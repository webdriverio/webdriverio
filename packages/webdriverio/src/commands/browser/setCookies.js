/**
 *
 * Sets a [cookie](https://w3c.github.io/webdriver/#cookies) for current page. Make sure you are
 * on the page that should receive the cookie. You can't set a cookie for an arbitrary page without
 * being on that page.
 *
 * <example>
    :setCookie.js
    it('should set a cookie for the page', function () {
        browser.url('/')
        browser.setCookie({name: 'test', value: '123'});
        var cookies = browser.getCookie();
        console.log(cookies); // outputs: [{ name: 'test', value: '123', domain: 'www.example.com' }]
    });
 * </example>
 *
 * @alias browser.setCookie
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
    const cookieObjsList = !Array.isArray(cookieObjs) ? [cookieObjs] : cookieObjs;

    if (cookieObjsList.some(obj => !(obj instanceof Object))) {
        throw new Error('Invalid input (see http://webdriver.io/api/cookie/setCookies.html for documentation.')
    }

    return Promise.all(cookieObjsList.map(cookieObj => this.addCookie(cookieObj)))
}
