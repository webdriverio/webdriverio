import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import type { IosDetailedContext } from '../../../src/index.js'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('switchContext test', () => {
    let browser: WebdriverIO.Browser
    let androidContexts = [] as any
    let iOSContexts = [] as IosDetailedContext[]
    let logSpy

    beforeEach(async () => {
        androidContexts = [
            { id: 'NATIVE_APP' },
            {
                androidWebviewData: {
                    attached: true,
                    empty: false,
                    height: 2589,
                    neverAttached: false,
                    screenX: 0,
                    screenY: 151,
                    visible: true,
                    width: 1344
                },
                id: 'WEBVIEW_com.wdiodemoapp',
                title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                url: 'https://webdriver.io/',
                packageName: 'com.wdiodemoapp',
                webviewPageId: 'B32A3DC8B0FEA92C435CE26D51F46986',
            },
            {
                androidWebviewData: {
                    attached: true,
                    empty: false,
                    height: 2589,
                    neverAttached: false,
                    screenX: 0,
                    screenY: 151,
                    visible: true,
                    width: 1344
                },
                id: 'WEBVIEW_com.otherApp',
                title: 'Other Apps · I am just another app',
                url: 'https://otherapp.io/',
                packageName: 'com.otherApp',
                webviewPageId: '6751C1E052A63B0CA27F839216AEF4B8',
            },
            {
                androidWebviewData: {
                    attached: true,
                    empty: false,
                    height: 2589,
                    neverAttached: false,
                    screenX: 0,
                    screenY: 151,
                    visible: false,
                    width: 1344
                },
                id: 'WEBVIEW_com.otherNonVisibleApp',
                title: 'Other Apps · I am just another app which is not visible',
                url: 'https://othernotvisibleapp.io/',
                packageName: 'com.otherNonVisibleApp',
                webviewPageId: 'EE01B05A515BF58395772B5EA297BE78',
            },
            {
                androidWebviewData: {
                    attached: false,
                    empty: false,
                    height: 0,
                    neverAttached: false,
                    screenX: 0,
                    screenY: 0,
                    visible: false,
                    width: 0
                },
                id: 'WEBVIEW_chrome',
                title: 'Android | Get more done with Google on Android-phones and devices',
                url: 'https://www.android.com/',
                packageName: 'com.android.chrome',
                webviewPageId: '0',
            },
        ]
        iOSContexts = [
            { id: 'NATIVE_APP' },
            {
                id: 'WEBVIEW_86150.1',
                title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                url: 'https://webdriver.io/',
                bundleId: 'org.reactjs.native.example.wdiodemoapp'
            },
            {
                id: 'WEBVIEW_86152.1',
                title: 'Apple',
                url: 'https://www.apple.com/',
                bundleId: 'com.apple.mobilesafari'
            }
        ]
        vi.mocked(fetch).mockClear()
    })

    it('should call the default Appium endpoint if the Webview option as a string is provided', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.switchContext('WEBVIEW_29051')
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/context')
        expect(logSpy).toHaveBeenCalledWith('The standard Appium `context`-method is used. If you want to switch to a webview with a specific title or url, please provide an object with the `title` or `url` property. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
        logSpy.mockRestore()
    })

    it('should find a matching context for iOS and switch to it', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(iOSContexts)
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue({ bundleId:'com.apple.mobilesafari' })
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')

        await browser.switchContext({ title: 'Apple' })
        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getContextsSpy).toHaveBeenCalledWith({
            'filterByCurrentAndroidApp': false,
            'isAndroidWebviewVisible': false,
            'returnAndroidDescriptionData': true,
            'returnDetailedContexts': true,
        })
        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile: activeAppInfo')
        expect(logSpy).toHaveBeenCalledWith('WebdriverIO found a matching context:', JSON.stringify(iOSContexts[2], null, 2))
        expect(switchAppiumContextSpy).toHaveBeenCalledWith(iOSContexts[2].id)

        logSpy.mockRestore()
        getContextsSpy.mockRestore()
        executeSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
    })

    it('should find a matching context for Android and switch to it', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const getCurrentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')
        const switchToWindowSpy = vi.spyOn(browser, 'switchToWindow')

        await browser.switchContext({ title: /.*WebdriverIO.*/, url: /.*webdriver.io/ })
        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(getContextsSpy).toHaveBeenCalledWith({
            'filterByCurrentAndroidApp': false,
            'isAndroidWebviewVisible': false,
            'returnAndroidDescriptionData': true,
            'returnDetailedContexts': true,
        })
        expect(getCurrentPackageSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('WebdriverIO found a matching context:', JSON.stringify(androidContexts[1], null, 2))
        expect(switchAppiumContextSpy).toHaveBeenCalledWith(androidContexts[1].id)
        expect(switchToWindowSpy).toHaveBeenCalledWith(androidContexts[1].webviewPageId)

        logSpy.mockRestore()
        getContextsSpy.mockRestore()
        getCurrentPackageSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
        switchToWindowSpy.mockRestore()
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        await expect(browser.switchContext('foo')).rejects.toThrow('The `switchContext` command is only available for mobile platforms.')
    })

    it('should throw an error when no options are provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        // @ts-expect-error
        await expect(browser.switchContext()).rejects.toThrow('You need to provide at least a context name to switch to. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
    })

    it('should throw an error when no title and url is provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        await expect(browser.switchContext({})).rejects.toThrow('You need to provide at least a `title` or `url` property to use full potential of the `switchContext` command. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
    })

    it('should throw an error when no matching context is found for iOS based on the title', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(iOSContexts)
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue({ bundleId:'com.foo' })
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')

        await expect(browser.switchContext({ title: 'No matching Title' })).rejects.toThrowErrorMatchingSnapshot()

        getContextsSpy.mockRestore()
        executeSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
    })

    it('should throw an error when no matching context is found for Android based on the url', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const getCurrentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.foo')
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')

        await expect(browser.switchContext({ url: 'https://no-matching-url.io' })).rejects.toThrowErrorMatchingSnapshot()

        getContextsSpy.mockRestore()
        getCurrentPackageSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
    })

    it('should throw an error when no matching context is found for Android based on the title and url regex', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const getCurrentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.foo')
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')

        await expect(browser.switchContext({
            title: /No matching Title/,
            url: /.*io/,
            androidWebviewConnectionRetryTime: 1000,
            androidWebviewConnectTimeout: 1000,
        })).rejects.toThrowErrorMatchingSnapshot()

        getContextsSpy.mockRestore()
        getCurrentPackageSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
    })

    it('should find a matching context when using a custom appIdentifier', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')
        const switchToWindowSpy = vi.spyOn(browser, 'switchToWindow')

        // Use appIdentifier to search in a different app than the active one
        await browser.switchContext({
            appIdentifier: 'com.otherApp',
            title: 'Other Apps',
        })
        expect(getContextsSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith('WebdriverIO found a matching context:', JSON.stringify(androidContexts[2], null, 2))
        expect(switchAppiumContextSpy).toHaveBeenCalledWith('WEBVIEW_com.otherApp')
        expect(switchToWindowSpy).toHaveBeenCalledWith(androidContexts[2].webviewPageId)

        logSpy.mockRestore()
        getContextsSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
        switchToWindowSpy.mockRestore()
    })

    it('should throw an error when the provided appIdentifier does not match any context', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const getContextsSpy = vi.spyOn(browser, 'getContexts').mockResolvedValue(androidContexts)
        const switchAppiumContextSpy = vi.spyOn(browser, 'switchAppiumContext')

        await expect(browser.switchContext({
            appIdentifier: 'com.nonexistent.app',
            title: 'Some Title',
        })).rejects.toThrowErrorMatchingSnapshot()

        getContextsSpy.mockRestore()
        switchAppiumContextSpy.mockRestore()
    })
})
