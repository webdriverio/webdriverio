/**
 *
 * Delete cookies visible to the current page. By providing a cookie name it just removes the single cookie.
 *
 * <example>
    :deleteCookie.js
    it('should delete cookies', () => {
        browser.setCookie({name: 'test', value: '123'})
        browser.setCookie({name: 'test2', value: '456'})
        browser.setCookie({name: 'test3', value: '789'})
        let cookies = browser.getCookies()
        console.log(cookies)
        // outputs:
        // [
        //     { name: 'test', value: '123' },
        //     { name: 'test2', value: '456' }
        //     { name: 'test3', value: '789' }
        // ]

        browser.deleteCookie(['test3'])
        cookies = browser.getCookies()
        console.log(cookies)
        // outputs:
        // [
        //     { name: 'test', value: '123' },
        //     { name: 'test2', value: '456' }
        // ]
        
        browser.deleteCookies()
        cookies = browser.getCookies()
        console.log(cookies) // outputs: []
    })
 * </example>
 *
 * @alias browser.deleteCookie
 * @param {String[]=} name  names of cookies to be deleted
 * @uses webdriver/deleteAllCookies,webdriver/deleteCookie
 * @type cookie
 *
 */

export default function deleteCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return this.deleteAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        return Promise.reject(new Error('Invalid input (see http://webdriver.io/docs/api/browser/deleteCookies.html for documentation.'))
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
