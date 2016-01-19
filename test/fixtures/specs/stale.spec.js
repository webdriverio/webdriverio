import conf from '../../conf/index.js'

describe('staleElementRetry', () => {
    it('can run quick commands after each other', () => {
        let iterations = 100
        browser.url(conf.testPage.staleTest)
        while (iterations--) {
            let res = browser.isVisible('.staleElementContainer1 .stale-element-container-row')
            console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
            expect(res).to.be.true
        }
    })

    it('can run quick commands in custom commands', () => {
        browser.addCommand('staleMe', (iterations = 100) => {
            while (iterations--) {
                let res = browser.isVisible('.staleElementContainer1 .stale-element-container-row')
                console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
                expect(res).to.be.true
            }
        })

        browser.url(conf.testPage.staleTest)
        browser.staleMe(100)
    })

    it('does not throw staleElementReference exception when waiting for element to become invisible but which is removed from DOM in a custom command', () => {

        browser.addCommand('waitForInvisibleInParallel', (iterations = 20) => {
            const promises = []
            for (let i = 1; i <= iterations; i++) {
                promises.push(browser.waitForVisible('.staleElementContainer2 .stale-element-container-row-' + i, 10000, true))
            }

            return Promise.all(promises)
            .then(function (results) {
                results.map(function (result) {
                    result.should.be.true
                })
            })
        })

        browser.url(conf.testPage.staleTest)
        browser.waitForInvisibleInParallel(20)
    })
})
