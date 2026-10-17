/**
 * @vitest-environment jsdom
 */
import path from 'node:path'
import { expect, describe, beforeEach, afterEach, it, vi, type MockInstance } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('newWindow', () => {
    beforeEach(() => {
        global.window.open = vi.fn()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.mocked(global.window.open).mockRestore()
    })

    it('should allow to create a new window handle', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([
            [],
            null,
            [],
            [],
            [],
            ['new-window-handle'],
            null
        ])

        const newHandle = await browser.newWindow('https://webdriver.io')
        expect(newHandle.handle).toBe('new-window-handle')
        expect(vi.mocked(fetch).mock.calls).toHaveLength(8)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).args)
            .toEqual(['https://webdriver.io'])
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toContain('/window/handles')
    })

    // like `browser.url()`, a Classic session gives a browsing context: the browser, on the new window
    it('should give a browsing context with the handle and type in a Classic session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([
            [],
            null,
            [],
            [],
            [],
            ['new-window-handle'],
            null
        ])

        const opened = await browser.newWindow('https://webdriver.io', { type: 'tab' })
        expect(opened.handle).toBe('new-window-handle')
        expect(opened.type).toBe('tab')
        expect(opened.browser).toBe(browser)
        expect(opened.isFrame).toBe(false)
        expect(opened.url).toBe('https://webdriver.io')
        expect(typeof opened.getTitle).toBe('function')
        expect('handle' in opened).toBe(true)
        expect('contextId' in opened).toBe(false)
        // the handle and the type belong to the result, not to the browser
        expect('handle' in browser).toBe(false)
        // v10.0 gave a plain `{ handle, type }`: JSON, keys and spread still show them
        expect(JSON.stringify(opened)).toBe(JSON.stringify({ handle: 'new-window-handle', type: 'tab' }))
        expect(Object.keys(opened)).toEqual(expect.arrayContaining(['handle', 'type']))
        expect({ ...opened }).toEqual(expect.objectContaining({ handle: 'new-window-handle', type: 'tab' }))
        await expect(opened.navigate('/foo')).rejects.toThrow(/`navigate\(\)` needs a WebDriver BiDi session[\s\S]*browser\.newWindow\(\)/)
    })

    it('should apply default args', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([
            [],
            null,
            [],
            ['new-window-handle'],
            null
        ])

        await browser.newWindow('https://webdriver.io')
        expect(vi.mocked(fetch).mock.calls).toHaveLength(6)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).args)
            .toEqual(['https://webdriver.io'])
    })

    it('should reject removed window options', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await expect(browser.newWindow('https://webdriver.io', {
            // @ts-expect-error removed in v10
            windowName: 'some name',
            windowFeatures: 'some params'
        })).rejects.toThrow('The `windowName` and `windowFeatures` options were removed from `newWindow` in WebdriverIO v10.')
    })

    it('should fail if url is invalid', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()

        try {
            // @ts-expect-error
            await browser.newWindow({})
        } catch (err: any) {
            expect(err.message).toContain('number or type')
        }
    })

    it('should fail if browser is a mobile device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'ipad',
                // @ts-ignore mock feature
                mobileMode: true
            }
        })

        const error = await browser.newWindow('https://webdriver.io').catch((err: Error) => err) as Error
        expect(error.message).toContain('not supported on mobile')
    })

    it('should open a new window by default', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const browsingContextCreateSpy: MockInstance = vi.spyOn(browser, 'browsingContextCreate')
        browsingContextCreateSpy.mockImplementation(() => ({ context: 'new-window-handle', type: 'window' }))
        const browsingContextNavigateSpy: MockInstance = vi.spyOn(browser, 'browsingContextNavigate')
        browsingContextNavigateSpy.mockImplementation(() => ({}))

        const newWindow = await browser.newWindow('https://webdriver.io')

        expect(newWindow.contextId).toBe('new-window-handle')
        expect(newWindow.handle).toBe('new-window-handle')
        expect(newWindow.type).toBe('window')
        expect(newWindow.isFrame).toBe(false)
        expect(newWindow.url).toBe('https://webdriver.io')
        expect(browsingContextCreateSpy).toHaveBeenCalledTimes(1)
        expect(browsingContextCreateSpy).toHaveBeenCalledWith({ type: 'window' })
        expect(browsingContextNavigateSpy).toHaveBeenCalledTimes(1)
        expect(browsingContextNavigateSpy).toHaveBeenCalledWith({
            context: 'new-window-handle',
            url: 'https://webdriver.io',
            wait: 'complete'
        })
    })

    it('should open a new tab when type is tab', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const browsingContextCreateSpy: MockInstance = vi.spyOn(browser, 'browsingContextCreate')
        browsingContextCreateSpy.mockImplementation(() => ({ context: 'new-tab-handle', type: 'tab' }))
        const browsingContextNavigateSpy: MockInstance = vi.spyOn(browser, 'browsingContextNavigate')
        browsingContextNavigateSpy.mockImplementation(() => ({}))

        const newTab = await browser.newWindow('https://webdriver.io', {
            type: 'tab'
        })

        expect(newTab.contextId).toBe('new-tab-handle')
        expect(newTab.handle).toBe('new-tab-handle')
        expect(newTab.type).toBe('tab')
        expect(newTab.isFrame).toBe(false)
        expect(browsingContextCreateSpy).toHaveBeenCalledTimes(1)
        expect(browsingContextCreateSpy).toHaveBeenCalledWith({ type: 'tab' })
        expect(browsingContextNavigateSpy).toHaveBeenCalledTimes(1)
        expect(browsingContextNavigateSpy).toHaveBeenCalledWith({
            context: 'new-tab-handle',
            url: 'https://webdriver.io',
            wait: 'complete'
        })
    })
})
