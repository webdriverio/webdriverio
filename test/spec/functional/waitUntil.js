var q = require('q');

/**
 * breaks on travis
 */
describe.skip('waitUntil', function() {

    before(h.setup());

    it('should pass', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 500);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 1000).then(function(res) {
            res.should.be.equal('foobar');
        });
    });

    it('should fail', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve(false);
        }, 500);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 1000).catch(function(err) {
            err.message.should.match(/Promise was rejected with the following reason: timeout/);
        });
    });

    it('should get rejected', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.reject('foobar');
        }, 500);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 1000).catch(function(err) {
            err.message.should.match(/Promise was rejected with the following reason: foobar/);
        });
    });

    it('should timeout', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 1000);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 500).catch(function(err) {
            err.message.should.match(/Promise never resolved with an truthy value/);
        });
    });

    it('should pass fast with a short waitfor interval', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 50);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 100, 20).then(function(res) {
            res.should.be.equal('foobar');
        });
    });

    it('should timeout with a long waitfor interval', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 50);

        return this.client.waitUntil(function() {
            return defer.promise;
        }, 100, 250).catch(function(err) {
            err.message.should.match(/Promise never resolved with an truthy value/);
        });
    });

    it('should allow a promise condition', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 500);

        return this.client.waitUntil(defer.promise, 1000).then(function(res) {
            res.should.be.equal('foobar');
        });
    });


    it('should check a condition multiple times', function() {
        var flag = false,
            conditionCalledCount = 0,
            testCondition = function () {
                conditionCalledCount += 1;
                return q(flag);
            };

        setTimeout(function() {
            flag = 'foobar';
        }, 40);

        return this.client.waitUntil(testCondition, 100, 20).then(function(res) {
            res.should.equal('foobar');
            conditionCalledCount.should.equal(2);
        });
    });

    it('should not check after timeout', function(done) {
        var callCount = 0,
            lasttime = 0,
            failtime = 0;

        this.client.waitUntil(function() {
            lasttime = Date.now();
            callCount += 1;

            var defer = q.defer();
            defer.resolve(0);
            return defer.promise.then(function(value) {
                return !!value;
            });
        }, 40, 20).catch(function() {
            failtime = Date.now();
        });

        setTimeout(function() {
            callCount.should.be.equal(2);
            lasttime.should.be.lte(failtime);

            done();
        }, 100);

    });

});
