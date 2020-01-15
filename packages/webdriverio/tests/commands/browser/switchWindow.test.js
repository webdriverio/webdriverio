import got from 'got'
import { remote } from '../../../src'

describe('switchWindow', () => {
    let browser

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
        expect.hasAssertions()
        got.setMockResponse([null, null, 'foo', 'bar', null, 'hello', 'world', null, 'some', 'url'])

        try {
            await browser.switchWindow('foobar')
        } catch (e) {
            expect(e.message).toContain('No window found')
        }
    })

    it('should fail if parameter is not valid', async () => {
        expect.hasAssertions()

        try {
            await browser.switchWindow(true)
        } catch (e) {
            expect(e.message).toContain('Unsupported parameter')
        }
    })
})
