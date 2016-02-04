import Timer from '../../../lib/utils/Timer.js'
import sinon from 'sinon'

describe('timer', function() {

    describe('ticks', function() {

        let timer
        let spy
        let clock

        beforeEach(function() {
            sinon.stub(process, 'nextTick').yields()
            clock = sinon.useFakeTimers(Date.now())

            spy = sinon.spy(() => Promise.resolve())
            timer = new Timer(20, 100, spy, false)
        })

        afterEach(function() {
            process.nextTick.restore()
            clock.restore()
        })

        it('should tick once', function() {
            clock.tick(20)
            expect(spy.calledOnce).to.be.true
        })

        it('should tick many times', function() {
            clock.tick(80)
            expect(spy.callCount).to.be.equal(5)
        })

        it('should not tick after timeout', function() {
            clock.tick(300)
            expect(spy.callCount).to.be.equal(5)
        })

    })

    describe('promise', function() {

        it('should be rejected by timeout', function() {
            let timer = new Timer(20, 30, () => Promise.resolve(false))

            return timer.then(assert.fail, function(msg) {
                expect(msg).to.be.equal('timeout')
            })
        })

        it('should be fulfilled when resolved with true value', function() {
            let timer = new Timer(20, 30, () => Promise.resolve(true))

            return timer.then(assert.isTrue, assert.fail)
        })

        it('should not be fulfilled when resolved with false value', function() {
            let timer = new Timer(20, 30, () => Promise.resolve(false))

            return timer.then(assert.fail, assert.ok)
        })

        it('should be rejected', function() {
            let timer = new Timer(20, 30, () => Promise.reject('err'))

            return timer.then(assert.fail).catch(function(msg) {
                expect(msg).to.be.equal('err')
            })
        })

    })

    it('should have leading fn call', function() {
        let spy = sinon.spy(() => Promise.resolve(true))
        let timer = new Timer(100, 100, spy, true)

        return timer.then(assert.isTrue)
    })

})
