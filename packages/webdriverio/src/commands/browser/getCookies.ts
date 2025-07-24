import logger from '@wdio/logger'
import type { Cookie } from '@wdio/protocols'
import type { remote } from 'webdriver'

const log = logger('webdriverio')

/**
 *
 * Retrieve a [cookie](https://w3c.github.io/webdriver/webdriver-spec.html#cookies)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookies.js
    it('should return a cookie for me', async () => {
        await browser.setCookies([
            {name: 'test', value: '123'},
            {name: 'test2', value: '456'}
        ])
        const testCookie = await browser.getCookies(['test'])
        console.log(testCookie); // outputs: [{ name: 'test', value: '123' }]

        const allCookies = await browser.getCookies()
        console.log(allCookies);
        // outputs:
        // [
        //    { name: 'test', value: '123' },
        //    { name: 'test2', value: '456' }
        // ]

        // filter cookies by domain
        const stagingCookies = await browser.getCookies({
            domain: 'staging.myapplication.com'
        })
    })
 * </example>
 *
 * @alias browser.getCookies
 * @param {remote.StorageCookieFilter}  filter  an object that allows to filter for cookies with specific attributes
 * @return {Cookie[]}                           requested cookies
 *
 */
export async function getCookies(
    this: WebdriverIO.Browser,
    filter?: string | string[] | remote.StorageCookieFilter
): Promise<Cookie[]> {
    /**
     * check if filter is a string array and let users know that this feature
     * is deprecated and will be removed in an upcoming version of WebdriverIO
     */
    const usesMultipleFilter = Array.isArray(filter) && filter.length > 1
    if (!this.isBidi || usesMultipleFilter) {
        return getCookiesClassic.call(this, filter)
    }

    const cookieFilter = getCookieFilter(filter)
    const { cookies } = await this.storageGetCookies({ filter: cookieFilter })
    return cookies.map((cookie) => ({
        ...cookie,
        value: cookie.value.type === 'base64' ? atob(cookie.value.value) : cookie.value.value
    }))
}

/**
 * Legacy WebDriver Classic way to fetch cookies
 */
async function getCookiesClassic(
    this: WebdriverIO.Browser,
    names?: string | string[] | remote.StorageCookieFilter
): Promise<Cookie[]> {
    if (!names) {
        return this.getAllCookies()
    }

    const usesMultipleFilter = Array.isArray(names) && names.length > 1
    if (usesMultipleFilter) {
        log.warn(
            'Passing a string array as filter for `getCookies` is deprecated and its ' +
            'support will be removed in an upcoming version of WebdriverIO!'
        )
        const allCookies = await this.getAllCookies()
        return allCookies.filter(cookie => names.includes(cookie.name))
    }

    const filter = getCookieFilter(names)
    const allCookies = await this.getAllCookies()
    return allCookies.filter(cookie => (
        !filter ||
        cookie.name && filter.name === cookie.name ||
        cookie.value && filter.value?.value === cookie.value ||
        cookie.path && filter.path === cookie.path ||
        cookie.domain && filter.domain === cookie.domain ||
        cookie.sameSite && filter.sameSite === cookie.sameSite ||
        cookie.expiry && filter.expiry === cookie.expiry ||
        typeof cookie.httpOnly === 'boolean' && filter.httpOnly === cookie.httpOnly ||
        typeof cookie.secure === 'boolean' && filter.secure === cookie.secure
    ))
}

function getCookieFilter (names?: string | string[] | remote.StorageCookieFilter) {
    if (!names) {
        return
    }

    if (Array.isArray(names) && names.length > 1) {
        throw new Error('Multiple cookie name filters are not supported')
    }

    return (Array.isArray(names) ? names : [names]).map((filter) => {
        if (typeof filter === 'string') {
            log.warn('Passing string values into `getCookie` is deprecated and its support will be removed in an upcoming version of WebdriverIO!')
            return { name: filter } as remote.StorageCookieFilter
        }
        return filter
    })[0]
}
