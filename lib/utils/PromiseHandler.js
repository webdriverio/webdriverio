var Q = require('q'),
    chainIt = require('chainit'),
    lastThenable = [];

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

        var resolvePromise = function(promise, onFulfilled, onRejected, onFinalised) {
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
            } else if(!onFulfilled && !onRejected && onFinalised) {
                args = result.state === 'fulfilled' ? [undefined].concat(result.value) : [result.reason];
                responseMethod = onFinalised;
            }

            /**
             * execute response method on next tick to prevent loosing error
             */
            process.nextTick(function() {
                var returnPromise;

                if(typeof responseMethod === 'function') {
                    returnPromise = responseMethod.apply(self, args);
                } else {
                    returnPromise = args;
                }

                /**
                 * queue up next "then" if existing
                 */
                if(returnPromise && returnPromise.then) {
                    lastThenable.push(returnPromise.getPromise ? returnPromise.getPromise() : returnPromise);
                } else if(typeof returnPromise !== 'undefined') {
                    var newDeferred = Q.defer();
                    lastThenable.push(newDeferred.promise);
                    newDeferred.resolve(returnPromise);
                }
            });

        };

        var handlePromise = function(onFulfilled, onRejected, onFinalised) {
            return self.call(function() {
                /**
                 * run new promise queue
                 */
                if(fnName !== 'call') {
                    lastThenable = [];
                }

                var promise = fnName === 'call' ? lastThenable.shift() || deferred.promise : deferred.promise || lastThenable.shift();
                promise.finally(resolvePromise.bind(self, promise, onFulfilled, onRejected, onFinalised));
            });
        }

        this.then = this.thenResolve = function(onFulfilled, onRejected) {
            if(typeof onRejected === 'function') {
                hasErrorHandling = true;
            }

            return handlePromise(onFulfilled, onRejected);
        };

        this.catch = this.fail = this.thenReject = function(onRejected) {
            hasErrorHandling = true;
            return handlePromise(null, onRejected);
        };

        this.finally = this.fin = this.done = function(onFinalised) {
            return handlePromise(null, null, onFinalised);
        };

        this.inspect = function() {
            return deferred.promise.inspect();
        };

        this.getPromise = function() {
            return deferred.promise;
        };

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
