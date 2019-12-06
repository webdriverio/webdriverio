import assert from 'assert'
import { remote } from '../../packages/webdriverio'
import sync from '../../packages/wdio-sync'

describe('scripts run in standalone mode', () => {
    it('should allow to run standalone mode synchronously', () => {
        browser.clickScenario()

        return remote({
            runner: true,
            hostname: 'localhost',
            port: 4444,
            path: '/',
            capabilities: {
                browserName: 'chrome'
            }
        }).then((remoteBrowser) => sync(() => {
            assert.equal(remoteBrowser.getTitle(), 'Mock Page Title')
        }))
    })

    it('should allow to be run asynchronous', () => {
        browser.clickScenario()

        return remote({
            hostname: 'localhost',
            port: 4444,
            path: '/',
            capabilities: {
                browserName: 'chrome'
            }
        }).then((remoteBrowser) => async () => {
            console.log(remoteBrowser.sessionId)
            assert.equal(await remoteBrowser.getTitle(), 'Mock Page Title')
        })
    })
})
