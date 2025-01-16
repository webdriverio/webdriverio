import type { Context, DetailedContext } from '@wdio/protocols'
import type { AppiumDetailedCrossPlatformContexts } from '../../types.js'

/**
 *
 * Get the context of the current session.
 *
 *
 * <example>
    :example.test.js
    it('should return the current context', async () => {
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
 * @param {GetContextsOptions=} options                                     The `getContext` options (optional)
 * @param {boolean=}            options.returnDetailedContext               By default, we only return the context name based on the default Appium `context` API, which is only a string. If you want to get back detailed context information, set this to `true`. Default is `false` (optional).
 * @param {number=}             options.androidWebviewConnectionRetryTime   The time in milliseconds to wait between each retry to connect to the webview. Default is `500` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {number=}             options.androidWebviewConnectTimeout        The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 *
 * @TODO: Also change the context manager because it needs to keep track of the context to which we switch, so we also need to add the renamed Appium commands to the context manager.
 * @TODO: also add returning detailed context information hen requested
 */
export async function getContext(
    this: WebdriverIO.Browser,
    options?: {
        returnDetailedContext?: boolean,
        androidWebviewConnectionRetryTime?: number,
        androidWebviewConnectTimeout?: number,
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
    options?: { androidWebviewConnectionRetryTime?: number, androidWebviewConnectTimeout?: number },
): Promise<DetailedContext> {
    const detailedContexts = await browser.getContexts({
        ...{ options },
        // Defaults
        returnDetailedContexts: true,           // We want to get back the detailed context information
        isAndroidWebviewVisible: true,          // We only want to get back the visible webviews
        filterByCurrentAndroidApp: true,        // We only want to get back the webviews that are attached to the current app
        returnAndroidDescriptionData: false,    // We don't want to get back the Android Webview description data
    }) as AppiumDetailedCrossPlatformContexts
    const parsedContexts = detailedContexts.find((context) => context.id === currentAppiumContext) as DetailedContext

    return parsedContexts
}
