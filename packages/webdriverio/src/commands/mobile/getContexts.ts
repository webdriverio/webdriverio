import logger from '@wdio/logger'

import type { AndroidDetailedContext, AppiumDetailedCrossPlatformContexts, GetContextsOptions, IosDetailedContext } from '../../types.js'
import type { Context } from '@wdio/protocols'

const log = logger('webdriver')

/**
 * The WebdriverIO `getContexts` method is an improved version of the default Appium `contexts`
 * (and the previous WebdriverIO `getContexts`) command. It provides detailed and actionable information
 * about available contexts in a mobile app session, addressing the limitations of the default Appium methods.
 *
 * ### How Webviews Work and Why This Method Helps
 * For more details, refer to the [Hybrid Apps documentation](/docs/api/mobile#hybrid-apps). Below is a summary of the challenges addressed by the `getContexts` command:
 *
 * #### Android Challenges
 * - A single webview (e.g., `WEBVIEW_{packageName}`) may contain multiple pages (similar to browser tabs).
 * - The default Appium methods do not include details about these pages, such as their `title`, `url`, or visibility,
 *   making it hard to identify the correct page and leading to potential flakiness.
 *
 * #### iOS Challenges
 * - The default Appium method only returns generic webview IDs (e.g., `WEBVIEW_{id}`) without any additional metadata.
 * - This makes it difficult to determine which webview corresponds to the target app screen.
 *
 * The enhanced `getContexts` method solves these issues by returning detailed context objects, which include:
 * - **For Android:** `title`, `url`, `packageName`, `webviewPageId`, and layout details (`screenX`, `screenY`, `width`, and `height`).
 * - **For iOS:** `bundleId`, `title`, and `url`.
 *
 * These enhancements make debugging and interacting with hybrid apps more reliable.
 *
 * ### Why Use This Method?
 * By default, the Appium `contexts` method returns only an array of strings representing available contexts:
 * - **For Android:** `['NATIVE_APP', 'WEBVIEW_com.wdiodemoapp', ...]`
 * - **For iOS:** `['NATIVE_APP', 'WEBVIEW_84392.1', ...]`
 *
 * While sufficient for simple scenarios, these default responses lack critical metadata for hybrid app testing:
 * - **For Android:** The lack of page-specific metadata makes it challenging to interact with the correct webview.
 * - **For iOS:** Generic webview IDs provide no insight into the content or app screen they represent.
 *
 * The enhanced `getContexts` method provides:
 * - Detailed metadata for both Android and iOS.
 * - Options to filter and customize the returned contexts for better targeting and interaction.
 *
 * :::info Notes and Limitations
 *
 * - The enhanced `getContexts` method works on both Android and iOS platforms. However, the returned data may vary depending on the platform and app under test.
 * - If you do not specify the `returnDetailedContexts` option, the method behaves like the default Appium `contexts` method, returning a simple context array.
 * - To use the "default" Appium `contexts` method, use `driver.getAppiumContexts()`. For more information, see the [Appium Contexts documentation](/docs/api/appium#getappiumcontexts).
 *
 * #### Android Webviews:
 * - Metadata such as `androidWebviewData` is available only when `returnAndroidDescriptionData` is `true`.
 * - Using the `getContexts` method on a Chrome browser may occasionally return incomplete data due to mismatched browser/Webview/ChromeDriver versions. In such cases, default values or an incorrect `webviewPageId` (e.g., `0`) may be returned.
 *
 * :::
 *
 * <example>
    :example.test.js
    it('should return all contexts in the current session with the default Appium `contexts`-method.', async () => {
        // For Android
        await driver.getContexts()
        // Returns ['NATIVE_APP', 'WEBVIEW_com.wdiodemoapp', ...]
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContexts()
        // Returns [ 'NATIVE_APP', 'WEBVIEW_84392.1', ... ]
    })
 * </example>
 *
 * <example>
    :detailed.test.js
    it('should return all contexts in the current session with detailed info.', async () => {
        // For Android
        await driver.getContexts({returnDetailedContexts: true})
        // Returns [
        //   { id: 'NATIVE_APP' },
        //   {
        //       id: 'WEBVIEW_com.wdiodemoapp',
        //       title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        //       url: 'https://webdriver.io/',
        //       packageName: 'com.wdiodemoapp',
        //       webviewPageId: '58B0AA2DBBBBBE9008C35AE42385BB0D'
        //   },
        //   {
        //       id: 'WEBVIEW_chrome',
        //       title: 'Android | Get more done with Google on Android-phones and devices',
        //       url: 'https://www.android.com/',
        //       packageName: 'com.android.chrome',
        //       webviewPageId: '0'
        //   }
        // ]
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContexts({returnDetailedContexts: true})
        // Returns: [
        //   { id: 'NATIVE_APP' },
        //   {
        //       id: 'WEBVIEW_86150.1',
        //       title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        //       url: 'https://webdriver.io/',
        //       bundleId: 'org.reactjs.native.example.wdiodemoapp'
        //   },
        //   {
        //       id: 'WEBVIEW_86152.1',
        //       title: 'Apple',
        //       url: 'https://www.apple.com/',
        //       bundleId: 'com.apple.mobilesafari'
        //   }
        // ]
    })
 * </example>
 *
 * <example>
    :description.data.test.js
    it('should return Android description data for the webview', async () => {
        // For Android
        await driver.getContexts({returnDetailedContexts: true, returnAndroidDescriptionData: true})
        // Returns [
        //   { id: 'NATIVE_APP' },
        //   {
        //       androidWebviewData: {
        //          // Indicates whether the web page is currently attached to a web view.
        //          // `true` means the page is attached and likely active, `false` indicates it is not.
        //          attached: true,
        //          // Indicates whether the web page is empty or not. An empty page typically means that
        //          // there is no significant content loaded in it. `true` indicates the page is empty,
        //          // `false` indicates it has content.
        //          empty: false,
        //          // Indicates whether the page has never been attached to a web view. If `true`, the
        //          // page has never been attached, which could indicate a new or unused page. If `false`,
        //          // the page has been attached at some point.
        //          neverAttached: false,
        //          // Indicates whether the web page is visible on the screen. `true` means the page is
        //          // visible to the user, `false` means it is not.
        //          visible: true,
        //          // This data can be super useful to determine where on the screen the webview is located
        //          // and can come in handy when you want to interact with elements on the screen based on
        //          // coordinates based on the top-left corner of the screen
        //          screenX: 0,
        //          screenY: 151,
        //          height: 2589,
        //          width: 1344
        //       },
        //       id: 'WEBVIEW_com.wdiodemoapp',
        //       title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        //       url: 'https://webdriver.io/',
        //       packageName: 'com.wdiodemoapp',
        //       webviewPageId: '58B0AA2DBBBBBE9008C35AE42385BB0D'
        //   }
        // ]
    })
 * </example>
 *
 * @param {GetContextsOptions=} options                                     The `getContexts` options (optional)
 * @param {boolean=}            options.returnDetailedContexts              By default, we only return the context names based on the default Appium `contexts` API. If you want to get all data, you can set this to `true`. Default is `false` (optional).
 * @param {number=}             options.androidWebviewConnectionRetryTime   The time in milliseconds to wait between each retry to connect to the webview. Default is `500` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {number=}             options.androidWebviewConnectTimeout        The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {boolean=}            options.filterByCurrentAndroidApp           By default, we return all webviews. If you want to filter the webviews by the current Android app that is opened, you can set this to `true`. Default is `false` (optional). <br /><strong>NOTE:</strong> Be aware that you can also NOT find any Webview based on this "restriction". <br /><strong>ANDROID-ONLY</strong>
 * @param {boolean=}            options.isAndroidWebviewVisible             By default, we only return the webviews that are attached and visible. If you want to get all webviews, you can set this to `false` (optional). Default is `true`. <br /><strong>ANDROID-ONLY</strong>
 * @param {boolean=}            options.returnAndroidDescriptionData        By default, no Android Webview (Chrome) description description data. If you want to get all data, you can set this to `true`. Default is `false` (optional). <br />By enabling this option you will get extra data in the response, see the `description.data.test.js` for more information. <br /><strong>ANDROID-ONLY</strong>
 * @skipUsage
 */
export async function getContexts(
    this: WebdriverIO.Browser,
    options?: GetContextsOptions
): Promise<Context[] | AppiumDetailedCrossPlatformContexts> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getContexts` command is only available for mobile platforms.')
    }

    if (!options || !options.returnDetailedContexts) {
        log.info('The standard Appium `contexts` method is used. If you want to get more detailed data, you can set `returnDetailedContexts` to `true`.')

        return browser.getAppiumContexts()
    }

    const defaultOptions = {
        androidWebviewConnectionRetryTime: 500,
        androidWebviewConnectTimeout: 5000,
        filterByCurrentAndroidApp: false,
        isAndroidWebviewVisible: true,
        returnAndroidDescriptionData: false,
    }

    return getCurrentContexts({ browser, ...{ ...defaultOptions, ...options } })
}

const CHROME_PACKAGE_NAME = 'com.android.chrome'

type AndroidChromeInternalContexts = Array<{
    proc: string;
    webview: string;
    info: {
        'Android-Package': string;
        Browser: string;
        'Protocol-Version': string;
        'User-Agent': string;
        'V8-Version': string;
        'WebKit-Version': string;
        webSocketDebuggerUrl: string;
    };
    pages?: [{
        description: string;
        devtoolsFrontendUrl: string;
        faviconUrl: string;
        id: string;
        title: string;
        type: string;
        url: string;
        webSocketDebuggerUrl: string;
    }];
    webviewName: string;
}>

type GetCurrentContexts = {
    browser: WebdriverIO.Browser;
    androidWebviewConnectionRetryTime: number;
    androidWebviewConnectTimeout: number;
    filterByCurrentAndroidApp: boolean;
    isAndroidWebviewVisible: boolean;
    returnAndroidDescriptionData: boolean;
}

type ParsedAndroidContexts = {
    contexts: AndroidChromeInternalContexts;
    filterByCurrentAndroidApp: boolean;
    isAttachedAndVisible: boolean;
    packageName: string;
}

/**
 * Parse the Android array and return the same object as iOS
 *
 * Android will return something like this
 * [
 *   {
 *     "proc": "@webview_devtools_remote_29051",
 *     "webview": "WEBVIEW_29051",
 *     "info": {
 *       "Android-Package": "com.wdiodemoapp",
 *       "Browser": "Chrome/113.0.5672.136",
 *       "Protocol-Version": "1.3",
 *       "User-Agent": "Mozilla/5.0 (Linux; Android 14; sdk_gphone64_arm64 Build/UE1A.230829.036; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36",
 *       "V8-Version": "11.3.244.11",
 *       "WebKit-Version": "537.36 (@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82)",
 *       "webSocketDebuggerUrl": "ws://127.0.0.1:10900/devtools/browser"
 *     },
 *     "pages": [
 *       {
 *         "description": "{\"attached\":true,\"empty\":false,\"height\":2682,\"never_attached\":false,\"screenX\":0,\"screenY\":144,\"visible\":true,\"width\":1440}",
 *         "devtoolsFrontendUrl": "https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/inspector.html?ws=127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8",
 *         "faviconUrl": "https://webdriver.io/img/favicon.png",
 *         "id": "6751C1E052A63B0CA27F839216AEF4B8",
 *         "title": "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO",
 *         "type": "page",
 *         "url": "https://webdriver.io/",
 *         "webSocketDebuggerUrl": "ws://127.0.0.1:10900/devtools/page/6751C1E052A63B0CA27F839216AEF4B8"
 *       },
 *       {
 *         "description": "",
 *         "devtoolsFrontendUrl": "https://chrome-devtools-frontend.appspot.com/serve_internal_file/@2d54072eb2f350d37f3f304c4ba0fafcddbd7e82/worker_app.html?ws=127.0.0.1:10900/devtools/page/BB0EE977F0C88F5DF6E50F902A855CDC",
 *         "id": "BB0EE977F0C88F5DF6E50F902A855CDC",
 *         "title": "Service Worker https://webdriver.io/sw.js?params=%7B%22offlineMode%22%3Afalse%2C%22debug%22%3Afalse%7D",
 *         "type": "service_worker",
 *         "url": "https://webdriver.io/sw.js?params=%7B%22offlineMode%22%3Afalse%2C%22debug%22%3Afalse%7D",
 *         "webSocketDebuggerUrl": "ws://127.0.0.1:10900/devtools/page/BB0EE977F0C88F5DF6E50F902A855CDC"
 *       }
 *     ],
 *     "webviewName": "WEBVIEW_com.wdiodemoapp"
 *   }
 * ]
 *
 * This is what the description data means
 * - `attached`:
 *   This indicates whether the web page is currently attached to a web view. A value of true means the page is
 *   attached and likely active, whereas false indicates it is not.
 * - `empty`:
 *   This property shows whether the web page is empty or not. An empty page typically means that there is no
 *   significant content loaded in it. true indicates the page is empty, and false indicates it has content.
 * - `never_attached`:
 *   This signifies whether the page has never been attached to a web view. If true, the page has never been
 *   attached, which could indicate a new or unused page. If false, the page has been attached at some point.
 * - `screenX and screenY`:
 *   These properties give the X and Y coordinates of the web page on the screen, respectively. They indicate
 *   the position of the top-left corner of the web page relative to the screen.
 * - `visible`:
 *   This denotes whether the web page is visible on the screen. true means the page is visible to the user,
 *   and false means it is not.
 * - `width and height`:
 *   These properties specify the dimensions of the web page in pixels. width is the width of the page, and
 *   height is its height.
 * - `faviconUrl` (if present):
 *   This is the URL of the favicon (the small icon associated with the page, often displayed in browser tabs).
 */
async function parsedAndroidContexts({
    contexts,
    filterByCurrentAndroidApp,
    isAttachedAndVisible,
    packageName,
}: ParsedAndroidContexts): Promise<AndroidDetailedContext[]> {
    const currentWebviewName = `WEBVIEW_${packageName}`
    let parsedContexts = contexts
    if (filterByCurrentAndroidApp) {
        parsedContexts = contexts.filter((context) => context.webviewName === currentWebviewName)
    }

    const result = [{ id: 'NATIVE_APP' }]

    if (!parsedContexts || parsedContexts.length < 1) {
        return result
    }

    parsedContexts.forEach((context) =>
        context.pages
            ?.filter((page) => {
                // Chrome Webview data doesn't always contain description data
                if (packageName === CHROME_PACKAGE_NAME) {
                    return true
                }
                if (page.type === 'page' && page.description) {
                    let descriptionObj
                    try {
                        descriptionObj = JSON.parse(page.description)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        return false
                    }

                    return isAttachedAndVisible ? descriptionObj.attached === true && descriptionObj.visible === true : true
                }

                return !isAttachedAndVisible
            })
            // Reconstruct the data so it will be "equal" to iOS WebView object.
            .forEach((page) => {
                const {
                    attached = false,
                    empty = false,
                    height = 0,
                    never_attached: neverAttached = false,
                    screenX = 0,
                    screenY = 0,
                    visible = false,
                    width = 0,
                } = JSON.parse(page.description || '{}')

                const pageData = {
                    androidWebviewData: {
                        attached,
                        empty,
                        height,
                        neverAttached,
                        screenX,
                        screenY,
                        visible,
                        width,
                    },
                    id: context.webviewName,
                    title: page.title,
                    url: page.url,
                    packageName: context.info['Android-Package'],
                    webviewPageId: page.id,
                }
                result.push(pageData)
            })
    )

    return result
}

/**
 * Get the current contexts.
 * Instead of using the method `browser.getContexts` we are going to use our own implementation to get back more data
 */
async function getCurrentContexts({
    browser,
    androidWebviewConnectionRetryTime,
    androidWebviewConnectTimeout,
    filterByCurrentAndroidApp,
    isAndroidWebviewVisible,
    returnAndroidDescriptionData,
}: GetCurrentContexts): Promise<AppiumDetailedCrossPlatformContexts> {
    const contexts = await browser.execute('mobile: getContexts') as IosDetailedContext[] | AndroidChromeInternalContexts

    // The logic for iOS is clear, we can just return the contexts which will be an array of objects with more data (see the type) instead of only strings
    if (browser.isIOS) {
        return contexts as IosDetailedContext[]
    }

    // For Android we need to wait for the webview to contain pages, so we need to do a few checks
    // 1. Get the package name of the app we are testing
    const packageName = await browser.getCurrentPackage()
    const startTime = Date.now()
    const retryInterval = androidWebviewConnectionRetryTime
    let isPackageNameMissing = false

    while (Date.now() - startTime < androidWebviewConnectTimeout) {
        // 2. Parse the Android context data in a more readable format
        const parsedContexts = await parsedAndroidContexts({
            contexts: contexts as AndroidChromeInternalContexts,
            filterByCurrentAndroidApp,
            isAttachedAndVisible: isAndroidWebviewVisible,
            packageName,
        })
        // 3. Check if there is a webview that belongs to the app we are testing
        const matchingContexts = parsedContexts.filter((context) => context.packageName === packageName)
        // 4. There are cases that no packageName is returned, so we need to check for that
        isPackageNameMissing = matchingContexts.length === 0
        // 5. There are also cases that the androidWebviewData is not returned, so we need to check for that
        const hasAndroidWebviewData = matchingContexts.some((context) => Boolean(context.androidWebviewData))
        const isAndroidWebviewDataMissing = matchingContexts.length > 0 && !hasAndroidWebviewData
        // 6. There are also cases that the androidWebviewData is returned, but the empty property is not returned, so we need to check for that
        const hasNonEmptyAndroidWebviewData = matchingContexts.some((context) => context.androidWebviewData && !context.androidWebviewData.empty)
        const isAndroidWebviewDataEmpty = matchingContexts.length > 0 && hasAndroidWebviewData && !hasNonEmptyAndroidWebviewData

        // If the current app is Chrome we can't wait for the webview to contain pages by checking the androidWebviewData because it will always be empty
        if (packageName === CHROME_PACKAGE_NAME) {
            return parsedContexts
        }
        if (!isPackageNameMissing && !isAndroidWebviewDataMissing && !isAndroidWebviewDataEmpty) {
            // If returnAndroidDescriptionData is false, filter out androidWebviewData
            if (!returnAndroidDescriptionData) {
                parsedContexts.forEach(context => {
                    if ('androidWebviewData' in context) {
                        delete context.androidWebviewData
                    }
                })
            }

            return parsedContexts
        }

        // 7. We will check for X seconds, with a custom interval, if the webview contains the correct data
        await new Promise((resolve) => setTimeout(resolve, retryInterval))
    }

    throw new Error(`The packageName '${packageName}' ${isPackageNameMissing ?
        'could not be found!' :
        'matches, but no webview with pages was loaded in this response: ' + JSON.stringify(contexts) + '\''}`
    )
}
