var Timer = require('../../../lib/utils/Timer.js');
var sinon = require('sinon');
var q = require('q');

describe('timer', function() {

    var timer,
        clock;

    beforeEach(function() {
        sinon.stub(process, 'nextTick').yields();
        clock = sinon.useFakeTimers(Date.now());
        timer = new Timer(20, 100, function() {
            var defer = q.defer();
            defer.resolve();
            return defer.promise;
        }, false);
    });

    afterEach(function() {
        process.nextTick.restore();
        clock.restore();
    });

    it('should have leading fn call', function() {
        var spy = sinon.spy(function() {
            var defer = q.defer();
            defer.resolve();
            return defer.promise;
        });
        timer = new Timer(20, 100, spy, true);
        expect(spy.calledOnce).to.be.true;
        clock.tick(20);
        expect(spy.calledTwice).to.be.true;
    });

    it('should tick once', function() {
        var spy = sinon.spy();
        timer.progress(spy);
        clock.tick(20);
        expect(spy.calledOnce).to.be.true;
    });

    it('should tick many times', function() {
        var spy = sinon.spy();
        timer.progress(spy);
        clock.tick(80);
        expect(spy.callCount).to.be.equal(5);
    });

    it('should not tick after timeout', function() {
        var spy = sinon.spy();
        timer.progress(spy);
        clock.tick(300);
        expect(spy.callCount).to.be.equal(5);
    });

    it('should be rejected by timeout', function() {
        var spy = sinon.spy();
        timer.catch(spy);
        clock.tick(200);
        expect(spy.calledWith('timeout')).to.be.true;
    });

    it('should be fulfilled when resolved with true value', function() {
        var spy = sinon.spy();
        timer = new Timer(20, 100, function() {
            var defer = q.defer();
            defer.resolve(true);
            return defer.promise;
        });
        timer.then(spy);
        clock.tick(20);
        expect(spy.calledOnce).to.be.true;
    });

    it('should not be fulfilled when resolved with false value', function() {
        var spy = sinon.spy();
        timer.then(spy);
        clock.tick(20);
        expect(spy.calledOnce).to.be.false;
    });

    it('should be rejected', function() {
        var spy = sinon.spy();
        timer = new Timer(20, 100, function() {
            var defer = q.defer();
            defer.reject();
            return defer.promise;
        });
        timer.catch(spy);
        clock.tick(100);
        expect(spy.calledOnce).to.be.true;
    });

});
