var Q = require('q'),
    chainIt = require('chainit'),
    depth = 0,
    i = 0;

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
                callback.apply(this, args);
            }

            if(promises.length) {
                var err;
                args.shift();
                promises.forEach(function(promise, i) {
                    if (promise.callback) {
                        promise.callback.apply(self, args);
                    }

                    if (promise.rejected && err) {
                        promise.rejected.call(self, err);
                        return delete err;
                    } else if (promise.fulfilled) {
                        try {
                            return promise.fulfilled.apply(self, args);    
                        } catch(e) {
                            err = e;
                            if(!promise.rejected) {
                                return;
                            }
                            return promise.rejected.apply(self, e);
                        }
                    }
                });                
            }

        }, function(error) {
            callback.apply(this, error);
        });

        this.then = function(onFulfilled, onRejected, onProgress) {
            promises.push({
                fulfilled: onFulfilled,
                rejected: onRejected,
                progress: onProgress
            });
            return this;
        }

        this.catch = this.fail = function(onRejected) {
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

        this.finally = this.fin = this.notify = function(callback) {
            promises.push({
                callback: callback,
            });
            return this;
        }

        args.push(deferred.makeNodeResolver());
        return fn.apply(this, args);

    }
};

module.exports.inner = function PromiseHandlerOuter(fnName, fn) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        return fn.apply(this, args);
    }
}