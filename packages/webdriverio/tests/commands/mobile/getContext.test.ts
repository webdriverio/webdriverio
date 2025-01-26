import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getContext test', () => {
    let browser: WebdriverIO.Browser
    let androidContexts: any[] = []
    let iOSContexts: any[] = []
    let logSpy

    beforeEach(async () => {
        androidContexts = [
            { id: 'NATIVE_APP' },
            {
                id: 'WEBVIEW_com.wdiodemoapp',
                title: 'WebdriverIO',
                url: 'https://webdriver.io/',
                packageName: 'com.wdiodemoapp',
                webviewPageId: 'B32A3DC8B0FEA92C435CE26D51F46986',
            },
            {
                id: 'WEBVIEW_chrome',
                title: 'Android Chrome',
                url: 'https://www.google.com/',
                packageName: 'com.android.chrome',
                webviewPageId: '1A2B3C4D5E6F7G8H9I0J',
            },
        ]
        iOSContexts = [
            { id: 'NATIVE_APP' },
            {
                id: 'WEBVIEW_86150.1',
                title: 'WebdriverIO',
                url: 'https://webdriver.io/',
                bundleId: 'org.reactjs.native.example.wdiodemoapp',
            },
            {
                id: 'WEBVIEW_86152.1',
                title: 'Safari',
                url: 'https://www.apple.com/',
                bundleId: 'com.apple.mobilesafari',
            },
        ]
        vi.mocked(fetch).mockClear()
    })

    it('should return the current context as a string when no options are provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any,
        })

        const getAppiumContextSpy = vi.spyOn(browser, 'getAppiumContext').mockResolvedValue('NATIVE_APP')
        const result = await browser.getContext()

        expect(result).toEqual('NATIVE_APP')
        expect(getAppiumContextSpy).toHaveBeenCalledTimes(1)

        getAppiumContextSpy.mockRestore()
    })

    it('should return detailed context information for Android', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any,
        })

        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const getAppiumContextSpy = vi.spyOn(browser, 'getAppiumContext').mockResolvedValue('WEBVIEW_com.wdiodemoapp')
        const result = await browser.getContext({ returnDetailedContext: true })

        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getAppiumContextSpy).toHaveBeenCalledTimes(1)
        expect(result).toEqual(androidContexts[1])

        getContextsSpy.mockRestore()
        getAppiumContextSpy.mockRestore()
    })

    it('should return detailed context information for iOS', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any,
        })

        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(iOSContexts)
        const getAppiumContextSpy = vi.spyOn(browser, 'getAppiumContext').mockResolvedValue('WEBVIEW_86150.1')
        const result = await browser.getContext({ returnDetailedContext: true })

        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getAppiumContextSpy).toHaveBeenCalledTimes(1)
        expect(result).toEqual(iOSContexts[1])

        getContextsSpy.mockRestore()
        getAppiumContextSpy.mockRestore()
    })

    it('should log a warning and return a string if no detailed context is found', async () => {
        logSpy = vi.spyOn(log, 'warn')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any,
        })

        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue([])
        const getAppiumContextSpy = vi.spyOn(browser, 'getAppiumContext').mockResolvedValue('WEBVIEW_unknown')

        const result = await browser.getContext({ returnDetailedContext: true })

        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getAppiumContextSpy).toHaveBeenCalledTimes(1)
        expect(result).toEqual('WEBVIEW_unknown')
        expect(logSpy).toHaveBeenCalledWith(
            "We did not get back any detailed context for the current context 'WEBVIEW_unknown'. We will return the current context as a string."
        )

        logSpy.mockRestore()
        getContextsSpy.mockRestore()
        getAppiumContextSpy.mockRestore()
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any,
        })
        await expect(browser.getContext()).rejects.toThrow(
            'The `getContext` command is only available for mobile platforms.'
        )
    })

    it('should log and return the first matching context when multiple detailed contexts are found', async () => {
        logSpy = vi.spyOn(log, 'warn')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any,
        })

        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue([
            { id: 'WEBVIEW_duplicate' },
            { id: 'WEBVIEW_duplicate' },
        ])
        const getAppiumContextSpy = vi.spyOn(browser, 'getAppiumContext').mockResolvedValue('WEBVIEW_duplicate')

        const result = await browser.getContext({ returnDetailedContext: true })

        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getAppiumContextSpy).toHaveBeenCalledTimes(1)
        expect(result).toEqual({ id: 'WEBVIEW_duplicate' })
        expect(logSpy).toHaveBeenCalledWith(
            "We found more than 1 detailed context for the current context 'WEBVIEW_duplicate'. We will return the first context."
        )

        logSpy.mockRestore()
        getContextsSpy.mockRestore()
        getAppiumContextSpy.mockRestore()
    })
})
