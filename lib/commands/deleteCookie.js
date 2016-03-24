/**
 *
 * Delete cookies visible to the current page. By providing a cookie name it just removes the single cookie.
 *
 * <example>
    :deleteSingleCookieAsync.js
    client
        .setCookie({name: 'test', value: '123'})
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
        })
        .deleteCookie('test')
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: []
        });

    :deleteMultipleCookiesAsync.js
    client
        .setCookie({name: 'test', value: '123'})
        .setCookie({name: 'test2', value: '456'})
        .getCookie().then(function(cookies) {
            console.log(cookies);
            // outputs:
            // [
            //     { name: 'test', value: '123' },
            //     { name: 'test2', value: '456' }
            // ]
        })
        .deleteCookie()
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: []
        });
 * </example>
 *
 * @param {String=} name name of cookie to be deleted
 *
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
