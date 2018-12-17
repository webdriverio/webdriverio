/**
 *
 * Retrieve a [cookie](https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookie.js
    it('should return a cookie for me', () => {
        browser.setCookie({name: 'test', value: '123'})
        browser.setCookie({name: 'test2', value: '456'})
        const testCookie = browser.getCookies(['test'])
        console.log(testCookie); // outputs: { name: 'test', value: '123' }

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
 * @alias browser.getCookie
 * @param {String[]=} names  names of requested cookies
 * @return {Object[]}        requested cookies if existing
 * @uses webdriver/getAllCookies
 *
 */
export default async function getCookies(names) {
    const namesList = typeof names !== 'undefined' && !Array.isArray(names) ? [names] : names

    if (typeof namesList === 'undefined') {
        return this.getAllCookies()
    }

    if (namesList.every(obj => typeof obj !== 'string')) {
        throw new Error('Invalid input (see http://webdriver.io/docs/api/browser/getCookies.html for documentation.')
    }

    const allCookies = await this.getAllCookies()

    return allCookies.filter(cookie => namesList.includes(cookie.name))
}
