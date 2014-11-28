var Q = require('q'),
    chainIt = require('chainit'),
    lastThenable = [];

module.exports = function PromiseHandler(fnName, fn) {
    return function() {

        var self = this,
            args = Array.prototype.slice.call(arguments),
            deferred = Q.defer(),
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

        });

        this.then = function(onFulfilled, onRejected) {

            var resolvePromise = function(promise) {
                var result = promise.inspect(),
                    responseMethod = function() {},
                    args;

                /**
                 * handle promise result according to state
                 */
                if(result.state === 'fulfilled' && onFulfilled) {

                    /**
                     * protocol commands return single result, action commands
                     * return result and response value as array
                     */
                    if(!(result.value instanceof Array)) {
                        result.value = [result.value];
                    }

                    /**
                     * remove error object if existing
                     */
                    if(!result.value[0]) {
                        result.value.shift();
                    }

                    args = result.value;
                    responseMethod = onFulfilled;

                } else if(result.state === 'rejected' && onRejected) {

                    args = [result.reason];
                    responseMethod = onRejected;

                }

                /**
                 * queue up next "then" if existing
                 */
                var returnPromise = responseMethod.apply(self, args);
                if(returnPromise && returnPromise.then) {
                    lastThenable.push(returnPromise.getPromise());
                }

            };

            self.call(function() {
                var promise = lastThenable.length ? lastThenable.shift() : deferred.promise;
                promise.finally(resolvePromise.bind(self, promise));
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