import { getCookies as getCookiesBrowser } from '../browser/getCookies.js'

/**
 *
 * Retrieve a [cookie](https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookies.js
    it('should return a cookie for me', async () => {
        const context = await browser.url('https://webdriver.io')
        await context.setCookies([
            {name: 'test', value: '123'},
            {name: 'test2', value: '456'}
        ])
        const testCookie = await context.getCookies(['test'])
        console.log(testCookie); // outputs: [{ name: 'test', value: '123' }]

        const allCookies = await context.getCookies()
        console.log(allCookies);
        // outputs:
        // [
        //    { name: 'test', value: '123' },
        //    { name: 'test2', value: '456' }
        // ]

        // filter cookies by domain
        const stagingCookies = await context.getCookies({
            domain: 'staging.myapplication.com'
        })
    })
 * </example>
 *
 * @alias browsingContext.getCookies
 * @param {remote.StorageCookieFilter}  filter  an object that allows to filter for cookies with specific attributes
 * @return {Cookie[]}                           requested cookies
 *
 */
export const getCookies = getCookiesBrowser