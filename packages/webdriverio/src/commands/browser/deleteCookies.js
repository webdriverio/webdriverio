/**
 *
 * Delete cookies visible to the current page. By providing a cookie name it just removes the single cookie or more when multiple names are passed.
 *
 * <example>
    :deleteCookie.js
    it('should delete cookies', () => {
        browser.setCookies([
            {name: 'test', value: '123'},
            {name: 'test2', value: '456'},
            {name: 'test3', value: '789'}
        ])

        let cookies = browser.getCookies()
        console.log(cookies)
        // outputs:
        // [
        //     { name: 'test', value: '123' },
        //     { name: 'test2', value: '456' }
        //     { name: 'test3', value: '789' }
        // ]

        browser.deleteCookies(['test3'])
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
 * @alias browser.deleteCookies
 * @param {String=|String[]=} names  names of cookies to be deleted
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
        return Promise.reject(new Error('Invalid input (see https://webdriver.io/docs/api/browser/deleteCookies.html for documentation.'))
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
