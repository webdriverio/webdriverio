/**
 *
 * Retrieve a [cookie](https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookie.js
    it('should return a cookie for me', function () {
        browser.setCookie({name: 'test', value: '123'})
        browser.setCookie({name: 'test2', value: '456'})

        var testCookie = browser.getCookie('test')
        console.log(testCookie); // outputs: { name: 'test', value: '123' }

        var allCookies = browser.getCookie()
        console.log(allCookies);
        // outputs:
        // [
        //    { name: 'test', value: '123' },
        //    { name: 'test2', value: '456' }
        // ]
    })
 * </example>
 *
 * @alias browser.getCookie
 * @param {String=} name name of requested cookie
 * @return {Object|null} requested cookie if existing
 * @uses protocol/cookie
 * @type cookie
 *
 */

let getCookie = function (name) {
    /*!
     * parameter check
     */
    if (typeof name !== 'string') {
        name = null
    }

    return this.cookie().then((res) => {
        res.value = res.value || []

        if (typeof name === 'string') {
            return res.value.filter((cookie) => cookie.name === name)[0] || null
        }

        return res.value || (typeof name === 'string' ? null : [])
    })
}

export default getCookie
