import conf from '../../conf/index.js'

describe('waitUntil', () => {
    beforeEach(() => {
        browser.url(conf.testPage.start)
    })

    it('should execute sync wdio commands in condition synchronously', () => {
        const rand = Math.floor(Math.random() * 10e10)
        browser.execute((_rand) => {
            setTimeout(function () {
                window._waitUntilTest = _rand
            }, 2000)
        }, rand)

        browser.waitUntil(() => {
            return browser.execute(() => window._waitUntilTest).value === rand
        }, 3000)
    })

    it('should execute sync wdio commands in condition asynchronously', () => {
        const rand = Math.floor(Math.random() * 10e10)
        browser.execute((_rand) => {
            setTimeout(function () {
                window._waitUntilTest = _rand
            }, 2000)
        }, rand)

        browser.waitUntil(function async () {
            return browser.execute(() => window._waitUntilTest).then((res) => res.value === rand)
        }, 3000)
    })

    it('should allow to define own error message', () => {
        const errorMsg = 'my own error message'
        try {
            browser.waitUntil(() => false, 100, errorMsg)
        } catch (e) {
            expect(e.message).to.contain(errorMsg)
        }
    })
})
