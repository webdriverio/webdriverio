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
export default async function getCookies(this: WebdriverIO.BrowserObject, names?: string | string[]) {
    if (names === undefined) {
        return this.getAllCookies()
    }

    const namesList = Array.isArray(names) ? names : [names]

    if (namesList.every(obj => typeof obj !== 'string')) {
        throw new Error('Invalid input (see https://webdriver.io/docs/api/browser/getCookies.html for documentation.')
    }

    const allCookies: WebDriver.Cookie[] = await this.getAllCookies() as WebDriver.Cookie[]
    return allCookies.filter(cookie => namesList.includes(cookie.name))
}
