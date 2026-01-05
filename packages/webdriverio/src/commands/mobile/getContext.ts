import logger from '@wdio/logger'
import type { Context, DetailedContext } from '@wdio/protocols'
import type { AppiumDetailedCrossPlatformContexts, GetContextsOptions } from '../../types.js'

const log = logger('webdriver')

/**
 * Retrieve the context of the current session.
 *
 * This method enhances the default Appium `context`/WebdriverIO `getContext` command by providing an option to
 * return detailed context information, making it easier to work with hybrid apps that use webviews.
 *
 * ### How Contexts Work
 * Refer to [Hybrid Apps documentation](/docs/api/mobile#hybrid-apps) for more information. Below is an explanation of the challenges associated with the `getContext` command:
 *
 * #### For Android:
 * - Webviews can contain multiple pages (like browser tabs), and identifying the correct page requires additional metadata
 *   such as `title` or `url`.
 * - The default Appium methods only provide basic context names (e.g., `WEBVIEW_{packageName}`) without detailed information
 *   about the pages inside the webview.
 *
 * #### For iOS:
 * - Each webview is identified by a generic `WEBVIEW_{id}` string, which doesn’t indicate its contents or the app screen
 *   it belongs to.
 *
 * ### Why Use This Method?
 * - **Default Behavior**:
 *   - Returns the current context as a string (e.g., `NATIVE_APP` or `WEBVIEW_{id}`).
 * - **Detailed Context**:
 *   - When `returnDetailedContext` is enabled, retrieves metadata such as:
 *     - **Android**: `packageName`, `title`, `url`, and `webviewPageId`.
 *     - **iOS**: `bundleId`, `title`, and `url`.
 * - **Android-Specific Options**:
 *   - Retry intervals and timeouts can be customized to handle delays in webview initialization.
 *
 * :::info Notes and Limitations
 *
 * - If `returnDetailedContext` is not enabled, the method behaves like the default Appium `getContext` method.
 * - If you want to use the "default" Appium `context` method, you can use the `driver.getAppiumContext()` method, see
 * also the [Appium Contexts](/docs/api/appium#getappiumcontext) command.
 * - **Android:** Android-specific options (`androidWebviewConnectionRetryTime` and `androidWebviewConnectTimeout`) have no effect on iOS.
 * - Logs warnings if multiple or no detailed contexts are found:
 *   - `We found more than 1 detailed context for the current context '{context}'. We will return the first context.`
 *   - `We did not get back any detailed context for the current context '{context}'. We will return the current context as a string.`
 *
 * :::
 *
 * <example>
    :default.test.js
    it('should return the current context with the default Appium `context` method', async () => {
        // For Android
        await driver.getContext()
        // Returns 'WEBVIEW_com.wdiodemoapp' or 'NATIVE_APP'
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContext()
        // Returns 'WEBVIEW_94703.19' or 'NATIVE_APP'
    })
 * </example>
 *
 * <example>
    :detailed.test.js
    it('should return the context of the current session with more detailed information', async () => {
        // For Android
        await driver.getContext({ returnDetailedContext: true})
        // Returns or `NATIVE_APP`, or
        // {
        //   id: 'WEBVIEW_com.wdiodemoapp',
        //   title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        //   url: 'https://webdriver.io/',
        //   packageName: 'com.wdiodemoapp',
        //   webviewPageId: '5C0425CF67E9B169245F48FF21172912'
        // }
        //
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.getContext({ returnDetailedContext: true})
        // Returns or `NATIVE_APP`, or
        // {
        //   id: 'WEBVIEW_64981.1',
        //   title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
        //   url: 'https://webdriver.io/',
        //   bundleId: 'org.reactjs.native.example.wdiodemoapp'
        // }
    })
 * </example>
 *
 * <example>
    :customize.retry.test.js
    it('should be able to cusomize the retry intervals and timeouts to handle delayed webview initialization', async () => {
        // For Android
        await driver.getContext({
            returnDetailedContext: true,
            // NOTE: The following options are Android-specific
            // For Android we might need to wait a bit longer to connect to the webview, so we can provide some additional options
            androidWebviewConnectionRetryTime: 1*1000,  // Retry every 1 second
            androidWebviewConnectTimeout: 10*1000,      // Timeout after 10 seconds
        })
    })
 * </example>
 *
 * <example>
 *    :wait.for.webview.test.js
 *    it('should wait for webview to become available before retrieving context', async () => {
 *        // For Android
 *        await driver.getContext({
 *            returnDetailedContext: true,
 *            // Wait for webview to become available at the Appium level before WebdriverIO's retry logic
 *            waitForWebviewMs: 3000,  // Wait 3 seconds for webview to become available
 *        })
 *    })
 * </example>
 *
 * @param {GetContextsOptions=} options                                     The `getContext` options (optional)
 * @param {boolean=}            options.returnDetailedContext               By default, we only return the context name based on the default Appium `context` API, which is only a string. If you want to get back detailed context information, set this to `true`. Default is `false` (optional).
 * @param {number=}             options.androidWebviewConnectionRetryTime   The time in milliseconds to wait between each retry to connect to the webview. Default is `500` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {number=}             options.androidWebviewConnectTimeout        The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {number=}             options.waitForWebviewMs                    The time in milliseconds to wait for webviews to become available before returning contexts. This parameter is passed directly to the Appium `mobile: getContexts` command. Default is `0` ms (optional). <br /><strong>ANDROID-ONLY</strong> <br />This is useful when you know that a webview is loading but needs additional time to become available. This option works at the Appium level, before WebdriverIO's retry logic (`androidWebviewConnectionRetryTime` and `androidWebviewConnectTimeout`) is applied.
 * @skipUsage
 */
export async function getContext(
    this: WebdriverIO.Browser,
    options?: {
        returnDetailedContext?: boolean,
        androidWebviewConnectionRetryTime?: number,
        androidWebviewConnectTimeout?: number,
        waitForWebviewMs?: number,
    }
): Promise<string | DetailedContext> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getContext` command is only available for mobile platforms.')
    }

    const currentAppiumContext: Context = await browser.getAppiumContext()

    if ((!options || !options?.returnDetailedContext) || currentAppiumContext === 'NATIVE_APP') {
        return currentAppiumContext
    }

    delete options.returnDetailedContext

    return getDetailedContext(browser, currentAppiumContext as string, options)
}

async function getDetailedContext(
    browser: WebdriverIO.Browser,
    currentAppiumContext: string,
    options?: Pick<GetContextsOptions, 'androidWebviewConnectionRetryTime' | 'androidWebviewConnectTimeout' | 'waitForWebviewMs'>,
): Promise<string | DetailedContext> {
    const detailedContexts = await browser.getContexts({
        ...options,
        // Defaults
        returnDetailedContexts: true,           // We want to get back the detailed context information
        isAndroidWebviewVisible: true,          // We only want to get back the visible webviews
        filterByCurrentAndroidApp: true,        // We only want to get back the webviews that are attached to the current app
        returnAndroidDescriptionData: false,    // We don't want to get back the Android Webview description data
    }) as AppiumDetailedCrossPlatformContexts
    const parsedContexts = detailedContexts.filter((context) => context.id === currentAppiumContext) as DetailedContext[]

    if (parsedContexts.length > 1) {
        log.warn(`We found more than 1 detailed context for the current context '${currentAppiumContext}'. We will return the first context.`)

        return parsedContexts[0]
    } else if (parsedContexts.length === 0) {
        log.warn(`We did not get back any detailed context for the current context '${currentAppiumContext}'. We will return the current context as a string.`)

        return currentAppiumContext
    }

    return parsedContexts[0]
}
