import logger from '@wdio/logger'

import type { AndroidDetailedContext, AppiumDetailedCrossPlatformContexts, IosDetailedContext, SwitchContextOptions } from '../../types.js'

const log = logger('webdriver')

/**
 * Switch to a specific context using a given Webview `name`, `title`, or `url`.
 *
 * This method enhances the default Appium `context` command by offering more flexibility and precision
 * for switching between native and webview contexts in hybrid mobile applications.
 *
 * ### How Contexts Work
 * For an overview of Hybrid Apps and webviews, refer to the [Hybrid Apps documentation](/docs/api/mobile#hybrid-apps).
 * Below is a summary of how the `switchContext` command addresses common challenges:
 *
 * #### Android Challenges
 * - Webviews often contain multiple pages (similar to browser tabs). Identifying the correct page requires additional
 *   metadata such as `title` or `url`, which is not provided by default Appium methods.
 * - Default Appium methods return only basic context names (e.g., `WEBVIEW_{packageName}`) without details about
 *   the content or pages within the webview.
 * - Switching contexts on Android involves two steps, which are handled automatically by this method:
 *   1. Switch to the Webview context using `WEBVIEW_{packageName}`.
 *   2. Select the appropriate page within the Webview using the `switchToWindow` method.
 *
 * #### iOS Challenges
 * - Webviews are identified by generic IDs (e.g., `WEBVIEW_{id}`), which do not provide information about the content
 *   or the app screen they correspond to.
 * - Determining the correct webview for interaction often requires trial and error.
 *
 * The `switchContext` method simplifies this process by retrieving detailed metadata (e.g., `title`, `url`, and visibility)
 * to ensure accurate and reliable context switching.
 *
 * ### Why Use This Method?
 * - **Simplified Switching**: If you know the `title` or `url` of the desired webview, this method eliminates the need for
 *   additional calls to `getContexts` or combining multiple methods like `switchContext({id})` and `getTitle()`.
 * - **Automatic Context Matching**: Finds the best match for a context based on:
 *   - Platform-specific identifiers (`bundleId` for iOS, `packageName` for Android). By default, uses the active app identifier, but you can provide a custom `appIdentifier` to search in a specific app (useful for overlays or non-active apps).
 *   - Exact or partial matches for `title` or `url` (supports both strings and regular expressions).
 *   - Android-specific checks to ensure webviews are attached and visible.
 * - **Fine-Grained Control**: Custom retry intervals and timeouts (Android-only) allow you to handle delays in webview initialization.
 * - **Default Appium Method Access**: If needed, you can use the default Appium `switchContext` command via `driver.switchAppiumContext()`.
 *
 * :::info Notes and Limitations
 *
 * - If the `title` or `url` of the desired webview is known, this method can automatically locate and switch to the matching context without additional `getContexts` calls.
 * - Android-specific options like `androidWebviewConnectionRetryTime` and `androidWebviewConnectTimeout` are not applicable to iOS.
 * - Logs reasons for context-matching failures to assist with debugging.
 * - When using an object as input, either `title` or `url` is required.
 *
 * :::
 *
 * <example>
    :example.test.js
    it('should switch to a webview by name and uses the default Appium `context`-method', async () => {
        // For Android, the context will be '`WEBVIEW_{packageName}`'
        await driver.switchContext('WEBVIEW_com.wdiodemoapp')
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.switchContext('WEBVIEW_94703.19')
    })
 * </example>
 *
 * <example>
    :exact.title.test.js
    it('should switch to a webview and match a webview based on an EXACT match of the `title` of the webview', async () => {
        await driver.switchContext({
            // In this case the title needs to be an exact match
            title: 'Webview Title',
        })
    })
 * </example>
 *
 * <example>
    :exact.url.test.js
    it('should switch to a webview and match a webview based on an EXACT match of the `title` of the webview', async () => {
        await driver.switchContext({
            // In this case the url needs to be an exact match
            url: 'https://webdriver.io',
        })
    })
 * </example>
 *
 * <example>
    :regex.title.url.test.js
    it('should switch to a webview and match a webview based on regex match of the `title` and `url` of the webview', async () => {
        await driver.switchContext({
            // The title should NOT end with 'foo'
            title: /^(?!.*foo$)/,
            // Matches any string that contains the substring `docs/api/mobile/switchContext`
            url: /.*docs\/api\/mobile\/switchContext/,
        })
    })
 * </example>
 *
 * <example>
    :android.context.waits.test.js
    it('should switch to a webview for Android but wait longer to connect and find a webview based on provided options', async () => {
        await driver.switchContext({
            // In this case the title need to be an exact match
            title: 'Webview Title',
            // For Android we might need to wait a bit longer to connect to the webview, so we can provide some additional options
            androidWebviewConnectionRetryTime: 1*1000,  // Retry every 1 second
            androidWebviewConnectTimeout: 10*1000,      // Timeout after 10 seconds
        })
    })
 * </example>
 *
 * <example>
 *    :app.identifier.test.js
 *    it('should switch to a webview by providing a specific app identifier (bundleId for iOS or packageName for Android)', async () => {
 *        // For Android, provide the packageName to search in a specific app (useful for overlays or non-active apps)
 *        await driver.switchContext({
 *            appIdentifier: 'com.otherApp',
 *            title: 'Other Apps',
 *        })
 *        // For iOS, provide the bundleId to search in a specific app
 *        await driver.switchContext({
 *            appIdentifier: 'com.apple.mobilesafari',
 *            url: /.*apple.com/,
 *        })
 *    })
 * </example>
 *
 * @param {string|SwitchContextOptions} context                                     The name of the context to switch to. An object with more context options can be provided.
 * @param {SwitchContextOptions}        options                                     switchContext command options
 * @param {string=}                     options.appIdentifier                       The app identifier to search in. For iOS, this should be the `bundleId`. For Android, this should be the `packageName`. If not provided, the method will use the active app identifier. This is useful when you need to search for webviews in overlays or non-active apps that are not recognized as the "active" app.
 * @param {string|RegExp=}              options.title                               The title of the page to switch to. This will be the content of the title-tag of a webviewpage. You can use a string that needs to fully match or or a regular expression.<br /><strong>IMPORTANT:</strong> When you use options then or the `title` or the `url` property is required.
 * @param {string|RegExp=}              options.url                                 The url of the page to switch to. This will be the `url` of a webviewpage. You can use a string that needs to fully match or or a regular expression.<br /><strong>IMPORTANT:</strong> When you use options then or the `title` or the `url` property is required.
 * @param {number=}                     options.androidWebviewConnectionRetryTime   The time in milliseconds to wait between each retry to connect to the webview. Default is `500` ms (optional). <br /><strong>ANDROID-ONLY</strong> and will only be used when a `title` or `url` is provided.
 * @param {number=}                     options.androidWebviewConnectTimeout        The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms (optional). <br /><strong>ANDROID-ONLY</strong> and will only be used when a `title` or `url` is provided.
 * @skipUsage
 */
export async function switchContext(
    this: WebdriverIO.Browser,
    options: string | SwitchContextOptions
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `switchContext` command is only available for mobile platforms.')
    }

    if (!options) {
        throw new Error('You need to provide at least a context name to switch to. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
    }

    if (typeof options === 'string') {
        log.info('The standard Appium `context`-method is used. If you want to switch to a webview with a specific title or url, please provide an object with the `title` or `url` property. See https://webdriver.io/docs/api/mobile/switchContext for more information.')

        return browser.switchAppiumContext(options as string)
    }

    if (!options.title && !options.url) {
        throw new Error('You need to provide at least a `title` or `url` property to use full potential of the `switchContext` command. See https://webdriver.io/docs/api/mobile/switchContext for more information.')
    }

    return switchToContext({ browser, options })
}

type FindMatchingContextOptions = {
    browser: WebdriverIO.Browser;
    contexts: AppiumDetailedCrossPlatformContexts;
    identifier: string;
    title?: string | RegExp;
    url?: string | RegExp;
}

type FindMatchingContextOutput =  { matchingContext: AndroidDetailedContext | IosDetailedContext | undefined; reasons: string[] }

async function switchToContext(
    { browser, options }:{ browser: WebdriverIO.Browser, options: SwitchContextOptions }
) {
    // 1. Get all the detailed contexts
    const getContextsOptions = {
        returnDetailedContexts: true,
        filterByCurrentAndroidApp: false,
        isAndroidWebviewVisible: false,
        returnAndroidDescriptionData: true,
        ...(options?.androidWebviewConnectionRetryTime && { androidWebviewConnectionRetryTime: options.androidWebviewConnectionRetryTime }),
        ...(options?.androidWebviewConnectTimeout && { androidWebviewConnectTimeout: options.androidWebviewConnectTimeout }),
    }
    const contexts = await browser.getContexts(getContextsOptions) as AppiumDetailedCrossPlatformContexts

    // 2. Find the matching context
    let identifier: string
    if (options.appIdentifier) {
        identifier = options.appIdentifier
    } else {
        // @ts-expect-error
        identifier = browser.isIOS ? (await browser.execute('mobile: activeAppInfo'))?.bundleId : await browser.getCurrentPackage()
    }
    const { matchingContext, reasons } = findMatchingContext({ browser, contexts, identifier, ...(options?.title && { title: options.title }), ...(options?.url && { url: options.url }) })

    if (!matchingContext) {
        throw new Error(reasons.join('\n'))
    }

    log.info('WebdriverIO found a matching context:', JSON.stringify(matchingContext, null, 2))

    // 3. Android works differently, it has a Webview that can hold multiple pages, also comparable with tabs in a browser
    if (!browser.isIOS) {
        // So first switch to the Webview
        const webviewName = `WEBVIEW_${identifier}`
        await browser.switchAppiumContext(webviewName)
    }

    // 4. Switch to the correct context/page
    // For iOS we can just use the `browser.switchAppiumContext()` method to switch to the webview,
    // but for Android we are already in the webview. We now need to switch to the correct page inside the webview
    // that will be done by using the `browser.switchToWindow()` method
    const switchFunction: (context: string) => Promise<void> = browser.isIOS ? browser.switchAppiumContext.bind(browser) : browser.switchToWindow.bind(browser)
    const matchingContextId = (browser.isIOS ? matchingContext.id : (matchingContext as AndroidDetailedContext).webviewPageId) as string

    // Now switch to the correct context
    return switchFunction(matchingContextId)

}

function findMatchingContext({
    browser: { isIOS },
    contexts,
    identifier,
    title,
    url,
}: FindMatchingContextOptions):FindMatchingContextOutput {
    const reasons: string[] = []
    reasons.push(`We parsed a total of ${contexts.length} Webviews but did not find a matching context. The reasons are:`)

    const matchingContext = contexts.find((context, index) => {
        reasons.push(`- Webview ${index + 1}: '${context.id}'`)

        if (context.id === 'NATIVE_APP') {
            reasons.push('  - Skipped context because it is NATIVE_APP')
            return false
        }

        const idMatch = isIOS
            ? (context as IosDetailedContext).bundleId === identifier
            : (context as AndroidDetailedContext).packageName === identifier

        const titleMatches = title
            ? title instanceof RegExp
                ? title.test(context.title || '')
                : context.title?.includes(title)
            : true

        const urlMatches = url
            ? url instanceof RegExp
                ? url.test(context.url || '')
                : context.url?.includes(url)
            : true

        const additionalAndroidChecks = isIOS
            ? true
            : (context as AndroidDetailedContext).androidWebviewData?.attached &&
              (context as AndroidDetailedContext).androidWebviewData?.visible

        if (!idMatch) {reasons.push(`  - App ${isIOS ? 'bundleId' : 'packageName'} '${identifier}' did not match: '${context.id}'`)}
        if (!titleMatches) {reasons.push(`  - Title '${title}' did not match: '${context.title}'`)}
        if (!urlMatches) {reasons.push(`  - URL '${url}' did not match: '${context.url}'`)}
        if (!additionalAndroidChecks) {reasons.push('  - Additional Android checks failed')}

        return idMatch && titleMatches && urlMatches && additionalAndroidChecks
    })

    return { matchingContext, reasons }
}

