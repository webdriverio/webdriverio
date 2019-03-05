/**
 *
 * Sets one or more [cookies](https://w3c.github.io/webdriver/#cookies) for the current page. Make sure you are
 * on the page that should receive the cookie. You can't set a cookie for an arbitrary page without
 * being on that page.
 *
 * <example>
    :setCookies.js
    it('should set a cookie for the page', () => {
        browser.url('/')

        // set a single cookie
        browser.setCookies({
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
        browser.setCookies([
            {name: 'test2', value: 'two'},
            {name: 'test3', value: 'three'}
        ])

        const cookies = browser.getCookies()
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
 * @param {Object} cookie cookie object or object array
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
