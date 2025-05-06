/**
 *
 * Open a deep link URL in the mobile app based on the url and the app's package name (Android) or bundle ID (iOS).
 *
 * <example>
    :deeplink.js
    it('should open a deep link for the WDIO native demo app', async () => {
        // open the Drag tab with a deep link (this the bundleId for the iOS Demo App)
        await browser.deepLink('wdio://drag', 'org.reactjs.native.example.wdiodemoapp');

        // Or open the Drag tab with a deep link (this the package name for the Android Demo App)
        await browser.deepLink('wdio://drag', 'com.wdiodemoapp');

        // Or if you want to have it "cross-platform" you can use it like this
        await browser.deepLink('wdio://drag', browser.isIOS ? 'org.reactjs.native.example.wdiodemoapp' : 'com.wdiodemoapp');
    })
 * </example>
 *
 * @param {string}  link            The deep link URL that should be opened in the mobile app. It should be a valid deep link URL (e.g. `myapp://path`). If it's a universal deep link, which can be used for iOS, use the `browser.url("your-url")`-method.
 * @param {string}  appIdentifier   The value of the `package` (Android) or `bundleId` (iOS) of the app that the deep link should open.
 */
export async function deepLink(
    this: WebdriverIO.Browser,
    link: string,
    appIdentifier: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `deepLink` command is only available for mobile platforms.')
    }

    if (!isDeepLinkUrl(link)) {
        throw new Error(`The provided link is not a valid deep link URL.${browser.isIOS ? ' If your url is a `universal deep link` then use the `url` command instead.' : ''}`)
    }

    if (!appIdentifier) {
        const mobileOS = browser.isIOS ? 'iOS' : 'Android'
        const identifierValue = browser.isIOS ? 'bundleId' : 'package'

        throw new Error(`When using a deep link URL for ${mobileOS}, you need to provide the \`${identifierValue}\` of the app that the deep link should open.`)
    }

    return browser.execute('mobile:deepLink', {
        url: link,
        [browser.isIOS ? 'bundleId' : 'package']: appIdentifier,
    })
}

function isDeepLinkUrl(link: string): boolean {
    const deepLinkRegex = /^(?!https?:\/\/)[a-zA-Z][\w+\-.]*:\/\//

    return deepLinkRegex.test(link)
}
