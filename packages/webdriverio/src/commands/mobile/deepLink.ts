/**
 *
 * Open a deep link URL in the mobile app based on the url and the app's package name (Android) or bundle ID (iOS).
 *
 * <example>
    :deeplink.js
    it('should open a deep link for the WDIO native demo app', async () => {
        // open the Drag tab with a deep link (this the bundleId for the iOS Demo App)
        await browser.deepLink('wdio://drag', 'org.reactjs.native.example.wdiodemoapp');

        // Or open the Drag tab with a deep link (this the packageName for the Android Demo App)
        await browser.deepLink('wdio://drag', 'com.wdiodemoapp');

        // Or if you want to have it "cross-platform" you can use it like this
        await browser.deepLink('wdio://drag', browser.isIOS ? 'org.reactjs.native.example.wdiodemoapp' : 'com.wdiodemoapp');
    })
 * </example>
 *
 * @param {string}  link        The deep link URL that should be opened in the mobile app. It should be a valid deep link URL (e.g. `myapp://path`). If it's a universal deep link, which can be used for iOS, use the `browser.url("your-url")`-method.
 * @param {string}  identifier  The value of the `packageName` (Android) or `bundleId` (iOS) of the app that the deep link should open.
 */
export async function deepLink(
    this: WebdriverIO.Browser,
    link: string,
    identifier: string
) {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `deepLink` command is only available for mobile platforms.')
    }

    if (!isDeepLinkUrl(link)) {
        throw new Error(`The provided link is not a valid deep link URL.${browser.isIOS ? ' If your url is a `universal deep link` then use the `browser.url("your-url")`-method.' : ''}`)
    }

    if (!identifier) {
        throw new Error(`When using a deep link URL for ${browser.isIOS ? 'iOS': 'Android'}, you need to provide the ${browser.isIOS ? '`bundleId`':'`packageName`'} of the app that the deep link should open.`)
    }

    return browser.execute('mobile:deepLink', {
        url: link,
        [browser.isIOS ? 'bundleId' : 'packageName']: identifier,
    })
}

function isDeepLinkUrl(link: string): boolean {
    const deepLinkRegex = /^(?!https?:\/\/)([a-zA-Z][a-zA-Z\d+\-.]*):\/\//

    return deepLinkRegex.test(link)
}
