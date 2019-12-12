import assert from 'assert'
import { remote } from '../../packages/webdriverio'
import { hasWdioSyncSupport } from '../../packages/wdio-utils'

console.log(hasWdioSyncSupport)

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('scripts run in standalone mode', () => {
    it('should allow to be run asynchronous', async () => {
        browser.clickScenario()
        let beforeCmdCounter = 0
        let afterCmdCounter = 0

        const remoteBrowser = await remote({
            hostname: 'localhost',
            port: 4444,
            path: '/',
            capabilities: {
                browserName: 'chrome'
            },
            beforeCommand: [async () => {
                await sleep(100)
                ++beforeCmdCounter
            }],
            afterCommand: [async () => {
                await sleep(100)
                ++afterCmdCounter
            }]
        })

        const start = Date.now()
        assert.equal(await remoteBrowser.getTitle(), 'Mock Page Title')
        assert.equal(beforeCmdCounter, 1)
        assert.equal(afterCmdCounter, 1)
        assert.ok((Date.now() - start) > 200)
    })
})
