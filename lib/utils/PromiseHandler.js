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

            // console.log('# of promises', fnName, promises.length, depth);
            if(promises.length) {
                var err;
                args.shift();
                promises.forEach(function(promise, i) {
                    // console.log('execute priomise #', i, 'von', promises.length, promise);

                    if(err && promise.rejected) {
                        promise.rejected.call(self, err);
                        return delete err;
                    }

                    try {
                        promise.fulfilled.apply(self, args);    
                    } catch(e) {
                        err = e;
                        if(!promise.rejected) {
                            return;
                        }

                        console.log('catch the err', e, promise.rejected);
                        promise.rejected.apply(self, e);
                    }
                    
                });                
            }

        }, function(error) {
            callback.apply(this, error);
        });

        this.then = function(fnFulfilled, fnRejected) {
            promises.push({
                fulfilled: fnFulfilled,
                rejected: fnRejected,
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