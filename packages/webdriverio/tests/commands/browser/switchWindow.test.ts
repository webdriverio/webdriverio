/**
 * @jest-environment jsdom
 */
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'

describe('switchwindow by name', () => {
    beforeEach(() => {
        global.window.open = jest.fn()
    })

    afterEach(() => {
        got.mockClear()
        ;(global.window.open as jest.Mock).mockRestore()
    })

    it('should allow to switch by window name', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.newWindow('https://webdriver.io', {
            windowName: 'test1',
            windowFeatures: 'some params'
        })
        await browser.newWindow('https://webdriver.io', {
            windowName: 'test2',
            windowFeatures: 'some params'
        })
        await browser.switchWindow('test1')
        expect(got.mock.calls[3][1].json.handle)
            .toBe('window-handle-4')
    })
})

describe('switchWindow', () => {
    let browser: WebdriverIO.BrowserObject

    beforeEach(async () => {
        got.setMockResponse()
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
        got.setMockResponse([null, null, 'foo', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const tabId = await browser.switchWindow('so')
        expect(tabId).toBe('window-handle-3')
        got.setMockResponse([null, null, 'foo', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const otherTabId = await browser.switchWindow(/h(e|a)llo/)
        expect(otherTabId).toBe('window-handle-2')
        got.setMockResponse([null, null, 'foo', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const anotherTabId = await browser.switchWindow('world')
        expect(anotherTabId).toBe('window-handle-2')
    })

    it('should fail if no window was found', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        got.setMockResponse([null, null, 'foo', 'bar', null, 'hello', 'world', null, 'some', 'url'])

        try {
            await browser.switchWindow('foobar')
        } catch (e) {
            expect(e.message).toContain('No window found')
        }
    })

    it('should fail if parameter is not valid', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()

        try {
            // @ts-ignore test invalid parameter
            await browser.switchWindow(true)
        } catch (e) {
            expect(e.message).toContain('Unsupported parameter')
        }
    })

    it('should find url with query string', async () => {
        got.setMockResponse([null, null, 'foo.com?foo=bar', 'bar', null, 'hello', 'world', null, 'some', 'url'])
        const tabId = await browser.switchWindow('foo.com?foo=bar')
        expect(tabId).toBe('window-handle-1')
    })
})
