import q from 'q'
import conf from '../../conf/index.js'

describe('waitUntil async', () => {
    beforeEach(() => {
        return browser.url(conf.testPage.start)
    })

    /**
     * just to make sure we actually running async mode
     */
    it('command result should be a promise', () => {
        q.isPromiseAlike(browser.status()).should.be.equal(true)
    })

    it('should bexecute wdio commands in condition synchronously', () => {
        const rand = Math.floor(Math.random() * 10e10)
        return browser.execute((_rand) => {
            setTimeout(function () {
                window._waitUntilTest = _rand
            }, 2000)
        }, rand).waitUntil(() => {
            return browser.execute(() => window._waitUntilTest).then((res) => {
                return res.value === rand
            })
        }, 3000)
    })

    it('should allow to define own error message', () => {
        const errorMsg = `my own error message`
        return browser.waitUntil(
            () => new Promise((resolve) => setTimeout(resolve, 200)),
            100,
            errorMsg
        ).catch((e) => {
            expect(e.message).to.be.equal(errorMsg)

        /**
         * second catch required here to not let the test fail
         * ToDo fix promise bug
         */
        }).catch((e) => {
            expect(e.message).to.be.equal(errorMsg)
        })
    })

    it('should not use own error message if error occured', () => {
        const errorMsg = `Promise was rejected with the following reason: buu`
        return browser.waitUntil(() => Promise.reject(new Error('buu')), 100, 'foobar').catch((e) => {
            expect(e.message).to.be.equal(errorMsg)

        /**
         * second catch required here to not let the test fail
         * ToDo fix promise bug
         */
        }).catch((e) => {
            expect(e.message).to.be.equal(errorMsg)
        })
    })
})
