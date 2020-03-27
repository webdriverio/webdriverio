/**
 *
 * Retrieve a [cookie](https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookies.js
    it('should return a cookie for me', () => {
        browser.setCookies([
            {name: 'test', value: '123'},
            {name: 'test2', value: '456'}
        ])
        const testCookie = browser.getCookies(['test'])
        console.log(testCookie); // outputs: [{ name: 'test', value: '123' }]

        const allCookies = browser.getCookies()
        console.log(allCookies);
        // outputs:
        // [
        //    { name: 'test', value: '123' },
        //    { name: 'test2', value: '456' }
        // ]
    })
 * </example>
 *
 * @alias browser.getCookies
 * @param {String[]=|String=}   names  names of requested cookies (if omitted, all cookies will be returned)
 * @return {WebDriver.Cookie[]}        requested cookies if existing
 * @uses webdriver/getAllCookies
 *
 */
export default async function getCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return this.getAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        throw new Error('Invalid input (see https://webdriver.io/docs/api/browser/getCookies.html for documentation.')
    }

    const allCookies = await this.getAllCookies()

    return allCookies.filter(cookie => namesList.includes(cookie.name))
}
