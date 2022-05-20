import assert from 'node:assert'
import { remote, attach, multiremote } from '../../packages/webdriverio'

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('scripts run in standalone mode', () => {
    describe('remote', () => {
        let remoteBrowser
        let beforeCmdCounter = 0
        let afterCmdCounter = 0

        before(async () => {
            browser.clickScenario()
            remoteBrowser = await remote({
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
        })

        it('should allow to be run asynchronous', async () => {
            const start = Date.now()
            assert.equal(await remoteBrowser.getTitle(), 'Mock Page Title')
            assert.equal(beforeCmdCounter, 1)
            assert.equal(afterCmdCounter, 1)
            assert.ok((Date.now() - start) > 200)
        })
    })

    describe('attach', () => {
        it('can attach to a session', async () => {
            const remoteBrowser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {
                    browserName: 'chrome'
                }
            })
            assert.equal(await remoteBrowser.getTitle(), 'Mock Page Title')
            const attachBrowser = await attach(remoteBrowser)
            assert.equal(await attachBrowser.getTitle(), 'Mock Page Title')
        })
    })

    describe('multiremote', () => {
        let remoteBrowser

        before(async () => {
            remoteBrowser = await multiremote({
                foo: {
                    capabilities: {
                        browserName: 'chrome'
                    }
                },
                bar: {
                    capabilities: {
                        browserName: 'chrome'
                    }
                }
            })
        })

        it('should be able to fetch a title', async () => {
            expect(await remoteBrowser.getTitle())
                .toEqual(['Mock Page Title', 'Mock Page Title'])
        })
    })
})
