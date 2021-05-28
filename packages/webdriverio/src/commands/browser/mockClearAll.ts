import logger from '@wdio/logger'

import { SESSION_MOCKS } from './mock'

const log = logger('webdriverio:mockClearAll')

/**
 * Resets all information stored in all registered mocks of the session.
 *
 * <example>
    :mockClearAll.js
    it('should clear all mocks', () => {
        const docMock = browser.mock('**', {
            headers: { 'Content-Type': 'text/html' }
        })
        const jsMock = browser.mock('**', {
            headers: { 'Content-Type': 'application/javascript' }
        })

        browser.url('http://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "1 4"
        browser.url('http://guinea-pig.webdriver.io/')
        console.log(docMock.calls.length, jsMock.calls.length) // returns "2 4" (JavaScript comes from cache)
        browser.mockClearAll()
        console.log(docMock.calls.length, jsMock.calls.length) // returns "0 0"
    })
 * </example>
 *
 * @alias browser.mockClearAll
 */
export default async function mockClearAll () {
    for (const [handle, mocks] of Object.entries(SESSION_MOCKS)) {
        log.trace(`Clearing mocks for ${handle}`)
        for (const mock of mocks) {
            mock.clear()
        }
    }
}
