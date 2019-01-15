/**
 *
 * Sets a [cookie](https://w3c.github.io/webdriver/#cookies) for current page. Make sure you are
 * on the page that should receive the cookie. You can't set a cookie for an arbitrary page without
 * being on that page.
 *
 * <example>
    :setCookies.js
    it('should set a cookie for the page', () => {
        browser.url('/')
        browser.setCookies({name: 'test', value: '123'})

        const cookies = browser.getCookies()
        console.log(cookies); // outputs: [{ name: 'test', value: '123', domain: 'www.example.com' }]
    });
 * </example>
 *
 * @alias browser.setCookies
 * @param {Object} cookie cookie object
 * @param {String} cookie.name The name of the cookie
 * @param {String} cookie.value The cookie value
 * @param {String} cookie.path  (Optional) The cookie path
 * @param {String} cookie.domain  (Optional) The domain the cookie is visible to
 * @param {Boolean} cookie.secure (Optional) Whether the cookie is a secure cookie
 * @param {Boolean} cookie.httpOnly  (Optional) Whether the cookie is an httpOnly cookie
 * @param {Number} cookie.expiry  (Optional) When the cookie expires, specified in seconds since midnight, January 1, 1970 UTC
 * @uses protocol/addCookie
 * @type cookie
 *
 */
export default async function setCookies(cookieObjs) {
    const cookieObjsList = !Array.isArray(cookieObjs) ? [cookieObjs] : cookieObjs

    if (cookieObjsList.some(obj => (typeof obj !== 'object'))) {
        throw new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies.html for documentation.')
    }

    return Promise.all(cookieObjsList.map(cookieObj => this.addCookie(cookieObj)))
}
