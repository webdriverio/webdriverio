/**
 *
 * Delete cookies visible to the current page. By providing a cookie name it just removes the single cookie.
 *
 * <example>
    :deleteCookie.js
    it('should delete cookies', function () {
        browser.setCookie({name: 'test', value: '123'})
        browser.setCookie({name: 'test2', value: '456'})
        browser.setCookie({name: 'test3', value: '789'})

        var cookies = browser.getCookie()
        console.log(cookies)
        // outputs:
        // [
        //     { name: 'test', value: '123' },
        //     { name: 'test2', value: '456' }
        //     { name: 'test3', value: '789' }
        // ]

        browser.deleteCookie('test3')
        cookies = browser.getCookie()
        console.log(cookies)
        // outputs:
        // [
        //     { name: 'test', value: '123' },
        //     { name: 'test2', value: '456' }
        // ]

        browser.deleteCookie()
        cookies = browser.getCookie()
        console.log(cookies) // outputs: []
    })
 * </example>
 *
 * @alias browser.deleteCookie
 * @param {String=} name name of cookie to be deleted
 * @uses protocol/cookie
 * @type cookie
 *
 */

let deleteCookie = function (name) {
    /*!
     * parameter check
     */
    if (typeof name !== 'string') {
        name = null
    }

    return this.cookie('DELETE', name)
}

export default deleteCookie
