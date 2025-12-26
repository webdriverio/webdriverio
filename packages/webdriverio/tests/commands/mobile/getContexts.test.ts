import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import type { IosDetailedContext } from '../../../src/index.js'
import { remote } from '../../../src/index.js'

vi.mock('fetch')
const log = logger('test')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getContexts test', () => {
    let browser: WebdriverIO.Browser
    let androidChromeInternalContexts = [] as any
    let iOSContexts = [] as IosDetailedContext[]
    let logSpy

    beforeEach(async () => {
        androidChromeInternalContexts = [
            {
                proc: '@webview_devtools_remote_29051',
                webview: 'WEBVIEW_29051',
                info: {
                    'Android-Package': 'com.wdiodemoapp',
                    Browser: 'Chrome/113.0.5672.136',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_arm64 Build/UE1A.230829.036; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
                    'V8-Version': '11.3.244.11',
                    'WebKit-Version': '537.36 (@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '{"attached":true,"empty":false,"height":2682,"never_attached":false,"screenX":0,"screenY":144,"visible":true,"width":1440}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/inspector.html?ws=127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8',
                        faviconUrl: 'https://webdriver.io/img/favicon.png',
                        id: '6751C1E052A63B0CA27F839216AEF4B8',
                        title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                        type: 'page',
                        url: 'https://webdriver.io/',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8'
                    },
                    {
                        description: '',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/worker_app.html?ws=127.0.0.1:10900/devtools/page/BB0EE977F0C88F5DF6E50F902A855CDC',
                        id: 'BB0EE977F0C88F5DF6E50F902A855CDC',
                        title: 'Service Worker https://webdriver.io/sw.js?params=%7B%22offlineMode%22%3Afalse%2C%22debug%22%3Afalse%7D',
                        type: 'service_worker',
                        url: 'https://webdriver.io/sw.js?params=%7B%22offlineMode%22%3Afalse%2C%22debug%22%3Afalse%7D',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/BB0EE977F0C88F5DF6E50F902A855CDC'
                    }
                ],
                webviewName: 'WEBVIEW_com.wdiodemoapp'
            },
            {
                proc: '@webview_devtools_remote_29051',
                webview: 'WEBVIEW_29066',
                info: {
                    'Android-Package': 'com.otherApp',
                    Browser: 'Chrome/113.0.5672.136',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_arm64 Build/UE1A.230829.036; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
                    'V8-Version': '11.3.244.11',
                    'WebKit-Version': '537.36 (@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '{"attached":false,"empty":false,"height":2682,"never_attached":false,"screenX":0,"screenY":144,"visible":true,"width":1440}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/inspector.html?ws=127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8',
                        faviconUrl: 'https://otherapp.io/img/favicon.png',
                        id: '6751C1E052A63B0CA27F839216AEF4B8',
                        title: 'Other Apps · I am just another app',
                        type: 'page',
                        url: 'https://otherapp.io/',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8'
                    },
                ],
                webviewName: 'WEBVIEW_com.otherApp'
            },
            {
                proc: '@webview_devtools_remote_29051',
                webview: 'WEBVIEW_29066',
                info: {
                    'Android-Package': 'com.otherNonVisibleApp',
                    Browser: 'Chrome/113.0.5672.136',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_arm64 Build/UE1A.230829.036; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
                    'V8-Version': '11.3.244.11',
                    'WebKit-Version': '537.36 (@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '{"attached":true,"empty":false,"height":2682,"never_attached":false,"screenX":0,"screenY":144,"visible":false,"width":1440}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/inspector.html?ws=127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8',
                        faviconUrl: 'https://othernotvisibleapp.io/img/favicon.png',
                        id: '6751C1E052A63B0CA27F839216AEF4B8',
                        title: 'Other Apps · I am just another app which is not visible',
                        type: 'page',
                        url: 'https://othernotvisibleapp.io/',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8'
                    },
                ],
                webviewName: 'WEBVIEW_com.otherNonVisibleApp'
            },
            {
                proc: '@chrome_devtools_remote',
                webview: 'WEBVIEW_chrome',
                info: {
                    'Android-Package': 'com.android.chrome',
                    Browser: 'Chrome/124.0.6367.219',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'V8-Version': '12.4.254.16',
                    'WebKit-Version': '537.36 (@7741f71cbce3b7dfe3eb5890976d2596364b0733)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@7741f71cbce3b7dfe3eb5890976d2596364b0733/inspector.html?ws=127.0.0.1:10900/devtools/page/0',
                        id: '0',
                        title: 'Android | Get more done with Google on Android-phones and devices',
                        type: 'page',
                        url: 'https://www.android.com/',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/0'
                    }
                ],
                'webviewName': 'WEBVIEW_chrome'
            },
            {
                proc: '@chrome_devtools_remote',
                webview: 'WEBVIEW_373737',
                info: {
                    'Android-Package': 'com.no.webviews',
                    Browser: 'Chrome/124.0.6367.219',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'V8-Version': '12.4.254.16',
                    'WebKit-Version': '537.36 (@7741f71cbce3b7dfe3eb5890976d2596364b0733)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '{"attached":true,"empty":true,"height":2682,"never_attached":false,"screenX":0,"screenY":144,"visible":false,"width":1440}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/inspector.html?ws=127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8',
                        faviconUrl: 'https://emptypage.io/img/favicon.png',
                        id: '6751C1E052A63B0CA27F839216AEF4B8',
                        title: 'Empty Page',
                        type: 'page',
                        url: 'https://emptypage.io/',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8'
                    },
                ],
                'webviewName': 'WEBVIEW_com.no.webviews'
            }
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

    it('should call the default Appium endpoint if no options are provided', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts()
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
        expect(logSpy).toHaveBeenCalledWith('The standard Appium `contexts` method is used. If you want to get more detailed data, you can set `returnDetailedContexts` to `true`.')
        logSpy.mockRestore()
    })

    it('should call the default Appium endpoint if returnDetailedContexts is not provided', async () => {
        logSpy = vi.spyOn(log, 'info')
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts({})
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
        expect(logSpy).toHaveBeenCalledWith('The standard Appium `contexts` method is used. If you want to get more detailed data, you can set `returnDetailedContexts` to `true`.')
        logSpy.mockRestore()
    })

    it('should call the default Appium endpoint if returnDetailedContexts is set to false', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts({ returnDetailedContexts: false })
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
    })

    it('should return the detailed contexts for iOS if returnDetailedContexts is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(iOSContexts)
        const contexts = await browser.getContexts({ returnDetailedContexts: true })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile: getContexts')
        expect(contexts).toEqual(iOSContexts)
    })

    it('should return the detailed contexts for Android if returnDetailedContexts is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({ returnDetailedContexts: true })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should return the description data for Android if returnAndroidDescriptionData is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({
            returnAndroidDescriptionData: true,
            returnDetailedContexts: true,
        })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should return the current app data for Android if filterByCurrentAndroidApp is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({
            filterByCurrentAndroidApp: true,
            returnDetailedContexts: true,
        })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should return the visible app data for Android if isAndroidWebviewVisible is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({
            isAndroidWebviewVisible: true,
            returnDetailedContexts: true,
        })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should return the all app data for Android if isAndroidWebviewVisible is set to false', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({
            isAndroidWebviewVisible: false,
            returnDetailedContexts: true,
        })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should return the all app data for Android if isAndroidWebviewVisible is set to false and returnAndroidDescriptionData is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const contexts = await browser.getContexts({
            isAndroidWebviewVisible: false,
            returnAndroidDescriptionData: true,
            returnDetailedContexts: true,
        })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(contexts).toMatchSnapshot()
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        await expect(browser.getContexts()).rejects.toThrow('The `getContexts` command is only available for mobile platforms.')
    })

    it('should throw an error when the current app does not match', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(androidChromeInternalContexts)
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.nonMatchingApp')
        await expect(browser.getContexts({
            // Reduce the timeout to speed up the test
            androidWebviewConnectTimeout: 5,
            androidWebviewConnectionRetryTime: 5,
            isAndroidWebviewVisible: false,
            returnAndroidDescriptionData: true,
            returnDetailedContexts: true,
        })).rejects.toThrow('The packageName \'com.nonMatchingApp\' could not be found!')

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw an error when the current app does not have any webviews', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue([androidChromeInternalContexts[0], androidChromeInternalContexts[androidChromeInternalContexts.length - 1]])
        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.no.webviews')
        await expect(browser.getContexts({
            // Reduce the timeout to speed up the test
            androidWebviewConnectTimeout: 5,
            androidWebviewConnectionRetryTime: 5,
            isAndroidWebviewVisible: false,
            returnAndroidDescriptionData: true,
            returnDetailedContexts: true,
        })).rejects.toThrowErrorMatchingSnapshot()

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple webview pages with same package when first is empty (issue #14755)', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        const espressoLikeContexts = [
            {
                proc: '@webview_devtools_remote_6858',
                webview: 'WEBVIEW_6858',
                info: {
                    'Android-Package': 'com.ismobile.android.blaandroid',
                    Browser: 'Chrome/124.0.6367.219',
                    'Protocol-Version': '1.3',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 15; sdk_gphone64_arm64 Build/AE3A.240806.043; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.219 Mobile Safari/537.36',
                    'V8-Version': '12.4.254.16',
                    'WebKit-Version': '537.36 (@7741f71cbce3b7dfe3eb5890976d2596364b0733)',
                    webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser'
                },
                pages: [
                    {
                        description: '{"attached":false,"empty":true,"height":0,"never_attached":true,"screenX":0,"screenY":0,"visible":true,"width":0}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@7741f71cbce3b7dfe3eb5890976d2596364b0733/inspector.html?ws=127.0.0.1:10900/devtools/page/B4EF628032DA04BF5D2854F1B8CA7A37',
                        id: 'B4EF628032DA04BF5D2854F1B8CA7A37',
                        title: 'about:blank',
                        type: 'page',
                        url: 'about:blank',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/B4EF628032DA04BF5D2854F1B8CA7A37'
                    },
                    {
                        description: '{"attached":true,"empty":false,"height":1984,"never_attached":false,"screenX":0,"screenY":290,"visible":true,"width":1080}',
                        devtoolsFrontendUrl: 'https://chrome-devtools-frontend.appspot.com/serve_internal_file/@7741f71cbce3b7dfe3eb5890976d2596364b0733/inspector.html?ws=127.0.0.1:10900/devtools/page/B6745CF76C090CEC213E4A2A2B21D228',
                        faviconUrl: 'http://127.0.0.1:14532/images/icons/bla.ico',
                        id: 'B6745CF76C090CEC213E4A2A2B21D228',
                        title: 'Översikt',
                        type: 'page',
                        url: 'http://127.0.0.1:14532/Micro?sub=showsummary',
                        webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/B6745CF76C090CEC213E4A2A2B21D228'
                    }
                ],
                webviewName: 'WEBVIEW_com.ismobile.android.blaandroid'
            }
        ]

        vi.spyOn(browser, 'execute').mockResolvedValue(espressoLikeContexts as any)
        vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.ismobile.android.blaandroid')

        const contexts = await browser.getContexts({
            androidWebviewConnectTimeout: 50,
            androidWebviewConnectionRetryTime: 1,
            isAndroidWebviewVisible: false,
            returnAndroidDescriptionData: true,
            returnDetailedContexts: true,
        }) as any

        expect(contexts.some((c: any) => c.id === 'NATIVE_APP')).toBe(true)

        const validContext = contexts.find((c: any) => c.url === 'http://127.0.0.1:14532/Micro?sub=showsummary')
        expect(validContext).toBeDefined()
        expect(validContext).toMatchObject({
            id: 'WEBVIEW_com.ismobile.android.blaandroid',
            title: 'Översikt',
            packageName: 'com.ismobile.android.blaandroid',
            webviewPageId: 'B6745CF76C090CEC213E4A2A2B21D228'
        })

        const emptyContext = contexts.find((c: any) => c.url === 'about:blank')
        if (emptyContext) {
            expect(emptyContext.packageName).toBe('com.ismobile.android.blaandroid')
        }
    })

    it('should pass waitForWebviewMs parameter to mobile: getContexts when provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(iOSContexts)
        await browser.getContexts({ returnDetailedContexts: true, waitForWebviewMs: 3000 })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile: getContexts', { waitForWebviewMs: 3000 })
    })
})
