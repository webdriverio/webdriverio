var Q = require('q'),
    chainIt = require('chainit');

/**
 * copied from https://github.com/kriskowal/q/blob/v1/q.js
 * -------------------------------------------------------------------------
 * Attempt to make generics safe in the face of downstream modifications.
 * There is no situation where this is necessary.
 * If you need a security guarantee, these primordials need to be
 * deeply frozen anyway, and if you don’t need a security guarantee,
 * this is just plain paranoid.
 * However, this **might** have the nice side-effect of reducing the size of
 * the minified code by reducing x.call() to merely x()
 * See Mark Miller’s explanation of what this does.
 * http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
 */
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}

/**
 * This is equivalent, but slower:
 * uncurryThis = Function_bind.bind(Function_bind.call);
 * http://jsperf.com/uncurrythis
 */
var array_slice = uncurryThis(Array.prototype.slice);

module.exports = function PromiseHandler(fnName, fn) {
    return function() {

        var self = this,
            args = array_slice(arguments),
            deferred = Q.defer(),
            hasErrorHandling = false,
            callback;

        /**
         * get custom callback
         * exception for the execute command which can have a single function as param
         */
        if(typeof args[args.length - 1] === 'function' && (fnName.indexOf('execute') === -1 || args.length > 1)) {
            callback = args.pop();
        }

        var resolvePromise = function(promise, onFulfilled, onRejected) {
            var result = promise.inspect(),
                responseMethod = function() {},
                args;

            self.result = result;

            /**
             * protocol commands return single result, action commands
             * return result and response value as array
             */
            if(typeof result.value !== 'undefined' && !(result.value instanceof Array)) {
                result.value = [result.value];
            }

            /**
             * handle promise result according to state
             */
            if(result.state === 'fulfilled' && onFulfilled) {
                args = result.value;
                responseMethod = onFulfilled;
            } else if(result.state === 'rejected' && onRejected) {
                args = [result.reason];
                responseMethod = onRejected;
            }

            /**
             * execute response method on next tick to prevent loosing error
             */
            var returnValue;

            if(typeof responseMethod === 'function') {
                returnValue = responseMethod.apply(self, args);
            } else {
                returnValue = args;
            }

            /**
             * queue up next "then" if existing
             */
            if(returnValue && returnValue.constructor.name === 'WebdriverIO') {
                deferred = returnValue.getDeferred();
            } else if(returnValue && returnValue.then) {
                deferred = returnValue;
            } else {
                deferred = Q.defer();
                deferred.resolve([returnValue]);
            }

        };

        chainIt.add(this, 'handlePromise', function(onFulfilled, onRejected, onFinalised, cb) {
            return self.call(function() {
                var promise = deferred.getPromise ? deferred.getPromise() : deferred.then ? deferred : deferred.promise;
                promise.finally(resolvePromise.bind(self, promise, onFulfilled, onRejected)).finally(onFinalised).finally(cb);
            });
        });

        this.then = function(onFulfilled, onRejected) {
            var args = array_slice(arguments),
                cb = args.pop();

            if(typeof onRejected === 'function') {
                hasErrorHandling = true;
            }
            return this.handlePromise(onFulfilled, onRejected, null);
        };

        this.catch = function(onRejected) {
            var args = array_slice(arguments),
                cb = args.pop();

            hasErrorHandling = true;
            return this.handlePromise(null, onRejected, null);
        };

        this.finally = function(onFinalised) {
            return this.handlePromise(null, null, onFinalised);
        };

        this.inspect = function() {
            return deferred.promise.inspect();
        };

        this.getPromise = function() {
            return deferred.promise;
        };

        this.getDeferred = function() {
            return deferred;
        }

        /**
         * in order to prevent a clean order of callback/promise
         * execution we need to resolve the promise in the same
         * event loop as the callback execution.
         * see Q.makeNodeResolver https://github.com/kriskowal/q/blob/v1/q.js#L615
         */
        args.push(function(error, value) {
            var newArgs = array_slice(arguments);
            if(callback) {
                callback.apply(self, newArgs);
            } else if(error && !hasErrorHandling && self.eventHandler.listeners('error').length < 2) {

                if(self.constructor.name === 'Multibrowser') {
                    for(instanceName in error) {
                        throw error[instanceName];
                    }
                }
                throw error;
            }

            if (error) {
                deferred.reject(error);
            } else if (arguments.length > 2) {
                deferred.resolve(array_slice(arguments, 1));
            } else {
                deferred.resolve(value);
            }
        });

        return fn.apply(this, args);

    }
};
