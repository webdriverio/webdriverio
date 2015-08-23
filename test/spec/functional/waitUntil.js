var q = require('q');

describe('waitUntil', function() {

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
            err.message.should.match(/Promise never resolved with an truthy value/);
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
            err.message.should.match(/Promise was fulfilled but got rejected/);
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

    it('should allow a promise condition', function() {
        var defer = q.defer();

        setTimeout(function() {
            defer.resolve('foobar');
        }, 500);

        return this.client.waitUntil(defer.promise, 1000).then(function(res) {
            res.should.be.equal('foobar');
        });
    });

});