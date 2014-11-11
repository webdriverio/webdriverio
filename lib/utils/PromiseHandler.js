var Q = require('q'),
    chainIt = require('chainit'),
    lastThenable = null,
    depth = 0,
    i = 0,
    error;

module.exports.outer = function PromiseHandlerInner(fnName, fn) {
    return function() {

        var self = this,
            args = Array.prototype.slice.call(arguments),
            deferred = Q.defer(),
            promises = [],
            callback;

        if(typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        deferred.promise.then(function(result) {
            var args = Array.prototype.slice.call(arguments);

            if(result instanceof Array) {
                args = args[0];
            }

            args.unshift(undefined);
            if(callback) {
                return callback.apply(this, args);
            }

        }, function(error) {
            callback.apply(this, error);
        });

        var thenMethod = function(onFulfilled, onRejected, onProgress) {

            var resolvePromise = function(promise) {
                var result = promise.inspect();

                /**
                 * first then method (already resolved)
                 */
                if(result.state === 'fulfilled') {

                    if(!(result.value instanceof Array)) {
                        result.value = [result.value];
                    }

                    if(!result.value[0]) {
                        result.value.shift();
                    }

                    /**
                     * queue up next "then" if existing
                     */
                    var fulFilledReturnValue = onFulfilled.apply(self, result.value),
                        returnPromise = Q.defer();

                    if(fulFilledReturnValue && fulFilledReturnValue.then) {
                        lastThenable = fulFilledReturnValue.getPromise();
                    } else {
                        delete returnPromise;
                    }

                } else {

                    /**
                     * TODO handle rejected promises
                     */

                }

            };

            self.call(function() {
                if(lastThenable) {
                    lastThenable.then(resolvePromise.bind(self, lastThenable));
                } else {
                    deferred.promise.then(resolvePromise.bind(self, deferred.promise));
                }
            });

            return this;
        }

        this.then = thenMethod;

        this.catch = this.fail = this.reject = function(onRejected) {
            promises.push({
                rejected: onRejected,
            });
            return this;
        }

        this.progress = function(onProgress) {
            promises.push({
                progress: onProgress,
            });
            return this;
        }

        this.finally = this.fin = this.callback = this.notify = function(callback) {
            promises.push({
                callback: callback,
            });
            return this;
        }

        this.inspect = function() {
            return deferred.promise.inspect();
        }

        this.getPromise = function() {
            return deferred.promise;
        }

        args.push(deferred.makeNodeResolver());
        return fn.apply(this, args);

    }
};

module.exports.inner = function PromiseHandlerOuter(fnName, fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments);

        if(error) {
            var e = error;
            error = null;
            throw new Error(e);
        }

        return fn.apply(this, args);
    }
}