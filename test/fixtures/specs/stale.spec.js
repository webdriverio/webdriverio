import conf from '../../conf/index.js'
import nock from 'nock'

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

    it('catches errors if an inner command fails', () => {
        browser.url(conf.testPage.staleTest)

        let sessionId = browser.requestHandler.sessionID
        let scope = nock('http://127.0.0.1:4444', { allowUnmocked: true })
        scope.post(`/wd/hub/session/${sessionId}/elements`).times(4).delayConnection(100).reply(200, {
            status: 0,
            value: [{ ELEMENT: '0' }]
        })

        /**
         * return with StaleElementReference error three times in a row
         */
        scope.get(`/wd/hub/session/${sessionId}/element/0/displayed`).times(3).delayConnection(100).reply(500, {
            status: 10,
            type: 'StaleElementReference',
            value: {
                message: 'Element is no longer attached to the DOM'
            }
        })

        /**
         * then return a valid result
         */
        scope.get(`/wd/hub/session/${sessionId}/element/0/displayed`).delayConnection(100).reply(200, {
            status: 0,
            value: false
        })

        browser.waitForVisible('.someSelector', 2000, true)
    })

    after(() => {
        nock.restore()
    })
})
