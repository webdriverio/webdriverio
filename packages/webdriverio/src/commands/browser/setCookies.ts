import type { Cookie } from '@wdio/protocols'

/**
 *
 * Sets one or more [cookies](https://w3c.github.io/webdriver/#cookies) for the current page. Make sure you are
 * on the page that should receive the cookie. You can't set a cookie for an arbitrary page without
 * being on that page.
 *
 * <example>
    :setCookies.js
    it('should set a cookie for the page', async () => {
        await browser.url('/')

        // set a single cookie
        await browser.setCookies({
            name: 'test1',
            value: 'one'
            // The below options are optional
            // path: '/foo', // The cookie path. Defaults to "/"
            // domain: '.example.com', // The domain the cookie is visible to. Defaults to the current browsing context’s active document’s URL domain
            // secure: true, // Whether the cookie is a secure cookie. Defaults to false
            // httpOnly: true, // Whether the cookie is an HTTP only cookie. Defaults to false
            // expiry: 1551393875 // When the cookie expires, specified in seconds since Unix Epoch
        })

        // set multiple cookies
        await browser.setCookies([
            {name: 'test2', value: 'two'},
            {name: 'test3', value: 'three'}
        ])

        const cookies = await browser.getCookies()
        console.log(cookies);
        // outputs:
        // [
        //      {name: 'test1', value: 'one', domain: 'www.example.com'},
        //      {name: 'test2', value: 'two', domain: 'www.example.com'},
        //      {name: 'test3', value: 'three', domain: 'www.example.com'}
        // ]
    });
 * </example>
 *
 * @alias browser.setCookies
 * @param {Array<WebDriverCookie>|WebDriverCookie} cookie   cookie object or object array.
 * @param {String=}       cookie.name     The name of the cookie.
 * @param {String=}       cookie.value    The cookie value.
 * @param {String=}       cookie.path     The cookie path. Defaults to "/" if omitted when adding a cookie.
 * @param {String=}       cookie.domain   The domain the cookie is visible to. Defaults to the current browsing context’s active document’s URL domain if omitted when adding a cookie.
 * @param {Boolean=}      cookie.secure   Whether the cookie is a secure cookie. Defaults to false if omitted when adding a cookie.
 * @param {Boolean=}      cookie.httpOnly Whether the cookie is an HTTP only cookie. Defaults to false if omitted when adding a cookie.
 * @param {Number=}       cookie.expiry   When the cookie expires, specified in seconds since Unix Epoch. Must not be set if omitted when adding a cookie.
 * @param {String=}       cookie.sameSite Whether the cookie applies to a SameSite policy. Defaults to None if omitted when adding a cookie. Can be set to either "Lax" or "Strict".
 * @uses protocol/addCookie
 * @type cookie
 *
 */
export async function setCookies(
    this: WebdriverIO.Browser,
    cookieObjs: Cookie | Cookie[]
) {
    const cookieObjsList = !Array.isArray(cookieObjs) ? [cookieObjs] : cookieObjs

    if (cookieObjsList.some(obj => (typeof obj !== 'object'))) {
        throw new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies for documentation)')
    }

    for (const cookieObj of cookieObjsList) {
        await this.addCookie(cookieObj)
    }
    return
}
