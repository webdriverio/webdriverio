import path from 'node:path'
import { expect, describe, beforeEach, it, vi, beforeAll, afterAll } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const webdriverResponses = [null, null, 'foo', 'bar', 'loo', null, 'hello', 'world', 'yo', null, 'some', 'url', 'here']

describe('switchWindow', () => {
    // @ts-ignore
    let browser: WebdriverIO.Browser

    beforeAll(() => {
        // @ts-ignore
        global.window = {
            name: 'foobar'
        }
    })

    beforeEach(async () => {
        // @ts-expect-error mock feature
        vi.mocked(got).setMockResponse()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to switch to a window handle', async () => {
        const tabId = await browser.switchWindow('webdriver')
        expect(tabId).toBe('window-handle-1')
    })

    it('should iterate over all available handles to find the right window', async () => {
        // @ts-expect-error mock feature
        got.setMockResponse([...webdriverResponses])
        const tabId = await browser.switchWindow('so')
        expect(tabId).toBe('window-handle-3')
        // @ts-expect-error mock feature
        got.setMockResponse([...webdriverResponses])
        const otherTabId = await browser.switchWindow(/h(e|a)llo/)
        expect(otherTabId).toBe('window-handle-2')
        // @ts-expect-error mock feature
        got.setMockResponse([...webdriverResponses])
        const anotherTabId = await browser.switchWindow('world')
        expect(anotherTabId).toBe('window-handle-2')
        // @ts-expect-error mock feature
        got.setMockResponse([...webdriverResponses])
        const andAnotherTabId = await browser.switchWindow('loo')
        expect(andAnotherTabId).toBe('window-handle-1')
    })

    it('should fail if no window was found', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        // @ts-expect-error mock feature
        got.setMockResponse([...webdriverResponses])

        try {
            await browser.switchWindow('foobar')
        } catch (err: any) {
            expect(err.message).toContain('No window found')
        }
    })

    it('should fail if parameter is not valid', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()

        try {
            // @ts-ignore test invalid parameter
            await browser.switchWindow(true)
        } catch (err: any) {
            expect(err.message).toContain('Unsupported parameter')
        }
    })

    it('should find url with query string', async () => {
        // @ts-expect-error mock feature
        got.setMockResponse([null, null, 'foo.com?foo=bar', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const tabId = await browser.switchWindow('foo.com?foo=bar')
        expect(tabId).toBe('window-handle-1')
    })

    afterAll(() => {
        // @ts-expect-error
        delete global.window
    })
})
