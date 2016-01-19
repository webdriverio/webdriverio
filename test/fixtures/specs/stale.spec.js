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
})
