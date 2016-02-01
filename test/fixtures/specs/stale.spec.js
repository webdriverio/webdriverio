import conf from '../../conf/index.js'
import nock from 'nock'

function goodElementRequest (scope, sessionId, times = 1) {
    scope.post(`/wd/hub/session/${sessionId}/elements`).times(times).delayConnection(100).reply(200, {
        status: 0,
        value: [{ ELEMENT: '0' }]
    })
}

function staleElementError (scope, sessionId, times = 1) {
    scope.get(`/wd/hub/session/${sessionId}/element/0/displayed`).times(times).delayConnection(100).reply(500, {
        status: 10,
        type: 'StaleElementReference',
        value: {
            message: 'Element is no longer attached to the DOM'
        }
    })
}

function isDisplayed (scope, sessionId, times = 1, value) {
    scope.get(`/wd/hub/session/${sessionId}/element/0/displayed`).times(times).delayConnection(100).reply(200, {
        status: 0,
        value
    })
}

describe('staleElementRetry', () => {
    it('can run quick commands after each other', () => {
        let iterations = 50
        browser.url(conf.testPage.staleTest)
        while (iterations--) {
            let res = browser.isVisible('.staleElementContainer1 .stale-element-container-row')
            console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
            expect(res).to.be.true
        }
    })

    it('can run quick commands in custom commands', () => {
        browser.addCommand('staleMe', (iterations = 50) => {
            while (iterations--) {
                let res = browser.isVisible('.staleElementContainer1 .stale-element-container-row')
                console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
                expect(res).to.be.true
            }
        })

        browser.url(conf.testPage.staleTest)
        browser.staleMe(50)
    })

    it('catches errors if an inner command fails', () => {
        browser.url(conf.testPage.staleTest)

        let sessionId = browser.requestHandler.sessionID
        let scope = nock('http://127.0.0.1:4444', { allowUnmocked: true })

        /**
         * Allow 4 succesful elements() queries for .someSelector.
         * Return a StaleElementReference error three times in a row,
         * then return a valid result (isDisplayed === false).
         */
        goodElementRequest(scope, sessionId, 4)
        staleElementError(scope, sessionId, 3)
        isDisplayed(scope, sessionId, 1, false)

        let elementIsGone = browser.waitForVisible('.someSelector', 2000, true)
        expect(elementIsGone).to.be.true
        expect(scope.isDone()).to.be.true
    })

    it('correctly retries inside waitForVisible', () => {
        browser.url(conf.testPage.staleTest)

        let sessionId = browser.requestHandler.sessionID
        let scope = nock('http://127.0.0.1:4444', { allowUnmocked: true })

        /**
         * Allow 10 succesful elements() queries for .someSelector.
         * Return a mixture of StaleElementReference exceptions and valid
         * results (isDisplayed === true), then finally (isDisplayed === false),
         * which occurs well within the 6 second total wait time.
         */
        goodElementRequest(scope, sessionId, 6)
        isDisplayed(scope, sessionId, 1, true)
        staleElementError(scope, sessionId, 1)
        isDisplayed(scope, sessionId, 2, true)
        staleElementError(scope, sessionId, 1)
        isDisplayed(scope, sessionId, 1, false)

        let elementIsGone
        try {
            elementIsGone = browser.waitForVisible('.someSelector', 1000, true)
        } catch (e) {
            console.log('.someSelector still visible after 1 second. Will wait a bit longer.')
            elementIsGone = browser.waitForVisible('.someSelector', 5000, true)
        }

        expect(elementIsGone).to.be.true
        expect(scope.isDone()).to.be.true
    })

    afterEach(() => {
        nock.cleanAll()
    })

    after(() => {
        nock.restore()
    })
})
