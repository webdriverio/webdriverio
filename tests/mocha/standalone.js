import assert from 'node:assert'
import { remote, attach, multiremote } from '../../packages/webdriverio/build/index.js'

function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

delete process.env.WDIO_WORKER_ID

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

        it('should not have testrunner options since we initiating it as standalone instance', async () => {
            const browser = await remote({
                hostname: 'localhost',
                port: 4444,
                path: '/',
                custom: 'foobar',
                capabilities: {
                    browserName: 'chrome'
                },
            })
            expect(browser.options).toHaveProperty('hostname')
            expect(browser.options).not.toHaveProperty('framework')
            expect(browser.options).not.toHaveProperty('custom')
            expect(browser.options).not.toHaveProperty('services')
        })
    })

    describe('attach', () => {
        it('can attach to a session', async () => {
            const remoteBrowser = await remote({
                automationProtocol: 'webdriver',
                protocol: 'http',
                hostname: 'localhost',
                port: 4444,
                path: '/',
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
                    hostname: 'localhost',
                    port: 4444,
                    path: '/',
                    capabilities: {
                        browserName: 'chrome'
                    }
                },
                bar: {
                    hostname: 'localhost',
                    port: 4444,
                    path: '/',
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
