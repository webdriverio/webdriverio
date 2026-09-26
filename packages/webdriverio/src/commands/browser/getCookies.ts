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
        const testCookie = await browser.getCookies({ name: 'test' })
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
 * @param {string|null} sourceOrigin  an optional source origin to fetch cookies for, if not provided it will default to the current page's origin, if explicitly set to null it will fetch cookies without a partition (only supported in BiDi)
 * @return {Cookie[]}                           requested cookies
 *
 */
export async function getCookies(
    this: WebdriverIO.Browser,
    filter?: remote.StorageCookieFilter,
    sourceOrigin?: string | null
): Promise<Cookie[]> {
    assertObjectCookieFilter(filter)

    if (!this.isBidi) {
        return getCookiesClassic.call(this, filter)
    }

    let url: URL
    try {
        url = new URL(await this.getUrl())
        if (url.origin === 'null') {
            return getCookiesClassic.call(this, filter)
        }
    } catch {
        return getCookiesClassic.call(this, filter)
    }

    // In some cases, the forced origin in BiDi does not allow to find back the cookies, so by using null we can bypass the partition and filter by name only.
    const params: remote.StorageGetCookiesParameters = sourceOrigin === null
        ? {}
        : {
            partition: {
                type: 'storageKey',
                sourceOrigin: sourceOrigin || url.origin
            }
        }

    if (typeof filter !== 'undefined') {
        params.filter = filter
    }

    try {
        const { cookies } = await this.storageGetCookies(params)

        // Fallback to classic if BiDi returns empty (common in hybrid/guest modes)
        if (cookies.length === 0) {
            log.debug('BiDi getCookies returned empty, falling back to classic')
            return getCookiesClassic.call(this, filter)
        }

        return cookies.map((cookie) => ({
            ...cookie,
            value: cookie.value.type === 'base64'
                ? Buffer.from(cookie.value.value, 'base64').toString('utf-8')
                : cookie.value.value,
        }))
    } catch (err) {
        log.warn(`BiDi getCookies failed, falling back to classic: ${(err as Error).message}`)
        return getCookiesClassic.call(this, filter)
    }
}

const REMOVED_COOKIE_FILTER =
    'Passing a string or string array to `getCookies` was removed in WebdriverIO v10. ' +
    'Use an object filter, for example `await browser.getCookies({ name: \'session\' })`.'

function assertObjectCookieFilter(filter: unknown): asserts filter is remote.StorageCookieFilter | undefined {
    if (typeof filter === 'undefined') {
        return
    }

    if (typeof filter === 'string' || Array.isArray(filter)) {
        throw new Error(REMOVED_COOKIE_FILTER)
    }

    if (typeof filter !== 'object' || filter === null) {
        throw new Error('`getCookies` only accepts a cookie filter object.')
    }
}

/**
 * WebDriver Classic way to fetch cookies. BiDi sessions fall back to this
 * when the browsing context has no origin or the BiDi call cannot be used.
 */
async function getCookiesClassic(
    this: WebdriverIO.Browser,
    filter?: remote.StorageCookieFilter
): Promise<Cookie[]> {
    if (!filter) {
        return this.getAllCookies()
    }

    const allCookies = await this.getAllCookies()
    const filterValue = getCookieValue(filter.value)
    return allCookies.filter(cookie => (
        (filter.name === undefined || filter.name === cookie.name) &&
        (filter.value === undefined || filterValue === cookie.value) &&
        (filter.path === undefined || filter.path === cookie.path) &&
        (filter.domain === undefined || filter.domain === cookie.domain) &&
        (filter.sameSite === undefined || filter.sameSite === cookie.sameSite) &&
        (filter.expiry === undefined || filter.expiry === cookie.expiry) &&
        (filter.httpOnly === undefined || filter.httpOnly === cookie.httpOnly) &&
        (filter.secure === undefined || filter.secure === cookie.secure)
    ))
}

function getCookieValue(value?: remote.NetworkBytesValue | null): string | undefined {
    if (!value) {
        return
    }

    return value.type === 'base64'
        ? Buffer.from(value.value, 'base64').toString('utf-8')
        : value.value
}

