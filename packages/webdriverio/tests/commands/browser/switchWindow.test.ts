import path from 'node:path'
import { expect, describe, beforeEach, it, vi, beforeAll, afterAll } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const webdriverResponses = [null, null, null, 'foo', 'bar', 'loo', null, 'hello', 'world', 'yo', null, 'some', 'url', 'here']

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
        vi.mocked(fetch).setMockResponse()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to switch to a window handle based on a partial URL match', async () => {
        const tabId = await browser.switchWindow('webdriver.io')
        expect(tabId).toBe('window-handle-1')
    })

    it('should not trigger a switchWindow call when the requested window handle matches the currently active one', async () => {
        const current = await browser.getWindowHandle()

        vi.spyOn(browser, 'switchToWindow').mockImplementation(() => {
            throw new Error('switchToWindow should not have been called')
        })

        const tabId = await browser.switchWindow(current)
        expect(tabId).toBe(current)
    })

    it('should allow to switch to a window handle based on an exact window handle match', async () => {
        const desiredHandle = 'window-handle-2'
        const spy = vi.spyOn(browser, 'switchToWindow')

        const tabId = await browser.switchWindow(desiredHandle)

        expect(tabId).toBe(desiredHandle)
        expect(spy).toHaveBeenCalledOnce()
    })

    it('should iterate over all available handles to find the right window', async () => {
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([...webdriverResponses])
        const tabId = await browser.switchWindow('so')
        expect(tabId).toBe('window-handle-3')
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([...webdriverResponses])
        const otherTabId = await browser.switchWindow(/h(e|a)llo/)
        expect(otherTabId).toBe('window-handle-2')
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([...webdriverResponses])
        const anotherTabId = await browser.switchWindow('world')
        expect(anotherTabId).toBe('window-handle-2')
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([...webdriverResponses])
        const andAnotherTabId = await browser.switchWindow('loo')
        expect(andAnotherTabId).toBe('window-handle-1')
    })

    it('should fail if no window was found', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([...webdriverResponses])

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
        vi.mocked(fetch).setMockResponse([null, null, null, 'foo.com?foo=bar', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const tabId = await browser.switchWindow('foo.com?foo=bar')
        expect(tabId).toBe('window-handle-1')
    })

    it('should allow switchWindow call even when the currently active one is closed', async () => {
        vi.spyOn(browser, 'getWindowHandle').mockImplementation(() =>
            Promise.reject('target window already closed')
        )

        const tabId = await browser.switchWindow('webdriver.io')
        expect(tabId).toBe('window-handle-1')
    })

    afterAll(() => {
        // @ts-expect-error
        delete global.window
    })
})
