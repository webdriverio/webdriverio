import logger from '@wdio/logger'

import type { AndroidDetailedContext, AppiumDetailedCrossPlatformContexts, IosDetailedContext, SwitchContextOptions } from '../../types.js'

const log = logger('webdriver')

/**
 *
 * Switch into the context with the given name
 *
 *
 * <example>
    :example.test.js
    it('should switch to a webview with the default Appium `context`-method', async () => {
        // For Android, the context will be '`WEBVIEW_{packageName}`'
        await driver.switchContext('WEBVIEW_com.wdiodemoapp')
        // For iOS, the context will be 'WEBVIEW_{number}'
        await driver.switchContext('WEBVIEW_94703.19')
    })
 * </example>
 *
 * @param {string|SwitchContextOptions} context                                     The name of the context to switch to. An object with more context options can be provided.
 * @param {SwitchContextOptions}        options                                     switchContext command options
 * @param {string|RegExp=}              options.title                               The title of the page to switch to. This will be the content of the title-tag of a webviewpage. You can use a string that needs to fully match or or a regular expression.
 * @param {string|RegExp=}              options.url                                 The url of the page to switch to. This will be the `url` of a webviewpage. You can use a string that needs to fully match or or a regular expression.
 * @param {number=}                     options.androidWebviewConnectionRetryTime   The time in milliseconds to wait between each retry to connect to the webview. Default is `500` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @param {number=}                     options.androidWebviewConnectTimeout        The maximum amount of time in milliseconds to wait for a web view page to be detected. Default is `5000` ms (optional). <br /><strong>ANDROID-ONLY</strong>
 * @skipUsage
 * @TODO: Also change the context manager because it needs to keep track of the context to which we switch, so we also need to add the renamed Appium commands to the context manager.
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

type GenerateNonMatchingErrorMessageOptions = {
    identifier: string;
    title?: string | RegExp;
    url?: string | RegExp;
}

type FindMatchingContextOptions = {
    browser: WebdriverIO.Browser;
    contexts: AppiumDetailedCrossPlatformContexts;
    identifier: string;
    title?: string | RegExp;
    url?: string | RegExp;
}

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
    // @ts-expect-error
    const identifier = browser.isIOS ? (await browser.execute('mobile: activeAppInfo'))?.bundleId : await browser.getCurrentPackage()
    const matchingContext = findMatchingContext({ browser, contexts, identifier, ...(options?.title && { title: options.title }), ...(options?.url && { url: options.url }) })

    if (!matchingContext) {
        throw new Error(generateNonMatchingErrorMessage({ identifier, title: options?.title, url: options?.url }))
    }

    // 3. Android works differently, it has a Webview that can hold multiple pages, also comparable with tabs in a browser
    if (browser.isAndroid) {
        // So first switch to the Webview
        const webviewName = `WEBVIEW_${identifier}`
        await driver.switchAppiumContext(webviewName)
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

function generateNonMatchingErrorMessage({ identifier, title, url }: GenerateNonMatchingErrorMessageOptions): string {
    let errorMessage = `The ${identifier} matches, but the provided `
    const titleString = title instanceof RegExp ? title.toString() : title
    const urlString = url instanceof RegExp ? url.toString() : url

    if (titleString && urlString) {
        errorMessage += `title (${titleString}) or URL (${urlString}) do not match any context.`
    } else if (titleString) {
        errorMessage += `title (${titleString}) does not match any context.`
    } else if (urlString) {
        errorMessage += `URL (${urlString}) does not match any context.`
    } else {
        errorMessage = `The identifier (${identifier}) matches, but no matching context is found.`
    }

    return errorMessage
}

function findMatchingContext({ browser:{ isIOS }, contexts, identifier, title, url }: FindMatchingContextOptions) {
    return contexts.find(context => {
        if (context.id === 'NATIVE_APP') {
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

        return idMatch && titleMatches && urlMatches && additionalAndroidChecks
    })
}
