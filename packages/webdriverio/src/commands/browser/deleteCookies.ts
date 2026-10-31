import logger from '@wdio/logger'
import type { remote } from 'webdriver'

import { isBrowsingContext } from '../../session/browsingContext.js'
import { cookieMatchesUrl, getCookiePartition, getWindowInfo, toCookieFilters, windowCookieScope, type WindowCookieScope } from '../../utils/cookiePartition.js'

const log = logger('webdriverio')

/**
 * Delete cookies visible to the current page. By providing a cookie name it
 * just removes the single cookie or more when multiple names are passed.
 *
 * @alias browser.deleteCookies
 * @param {StorageCookieFilter[]} filter  Use the filter property to identify and delete specific cookies based on matching criteria.
 * @example https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/deleteCookies/example.js#L9-L29
 * @example https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/deleteCookies/example.js#L31-L35
 */
export async function deleteCookies(
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    filter?: string | string[] | remote.StorageCookieFilter | remote.StorageCookieFilter[]
): Promise<void> {
    const filters = typeof filter === 'undefined'
        ? undefined
        : toCookieFilters(Array.isArray(filter) ? filter : [filter])

    if (!this.isBidi) {
        await deleteCookiesClassic.call(this, getNamesForClassic(filters))
        return
    }

    const scope = await windowCookieScope(this)
    if (scope) {
        await deleteWindowCookies(scope, filters)
        return
    }

    if (isBrowsingContext(this)) {
        const partition: remote.StoragePartitionDescriptor = {
            type: 'context',
            context: this.contextId
        }
        await deleteBidiCookies(this.browser, partition, filters)
        return
    }

    let url: URL
    try {
        url = new URL(await this.getUrl())
        if (url.origin === 'null') {
            await deleteCookiesClassic.call(this, getNamesForClassic(filters))
            return
        }
    } catch {
        await deleteCookiesClassic.call(this, getNamesForClassic(filters))
        return
    }
    const partition = getCookiePartition(url.origin)

    try {
        const { cookies } = await this.storageGetCookies({ partition })
        if (cookies.length === 0 && !this.isMobile) {
            await deleteCookiesClassic.call(this, getNamesForClassic(filters))
            return
        }
    } catch (err) {
        log.warn(`BiDi deleteCookies check failed, falling back to classic: ${(err as Error).message}`)
        await deleteCookiesClassic.call(this, getNamesForClassic(filters))
        return
    }

    try {
        await deleteBidiCookies(this, partition, filters)
    } catch (err) {
        log.warn(`BiDi deleteCookies failed, falling back to classic: ${(err as Error).message}`)
        await deleteCookiesClassic.call(this, getNamesForClassic(filters))
    }

    return
}

/**
 * the jar of the window holds the cookies of every host and path, and BiDi filters only match exact
 * values: delete each cookie that the page sees by its name, domain and path, as Puppeteer does
 */
async function deleteWindowCookies(
    scope: WindowCookieScope,
    filters?: remote.StorageCookieFilter[]
) {
    const { browser, partition } = scope
    const [{ url }, found] = await Promise.all([
        getWindowInfo(scope),
        Promise.all((filters ?? [undefined]).map((filter) => browser.storageGetCookies({ partition, ...(filter ? { filter } : {}) })))
    ])
    const cookies = new Map(found.flatMap(({ cookies }) => cookies).filter(cookieMatchesUrl(url)).map((cookie) => (
        [`${cookie.name}\0${cookie.domain}\0${cookie.path}`, cookie]
    )))
    await Promise.all([...cookies.values()].map(({ name, domain, path }) => (
        browser.storageDeleteCookies({ filter: { name, domain, path }, partition })
    )))
}

async function deleteBidiCookies(
    browser: WebdriverIO.Browser,
    partition: remote.StoragePartitionDescriptor,
    filters?: remote.StorageCookieFilter[]
) {
    if (!filters) {
        await browser.storageDeleteCookies({ partition })
        return
    }
    await Promise.all(filters.map((filter) => (
        browser.storageDeleteCookies({ filter, partition })
    )))
}

function getNamesForClassic(filters?: remote.StorageCookieFilter[]) {
    return filters?.map(({ name }) => {
        if (!name) {
            throw new Error('In WebDriver Classic you can only filter for cookie names')
        }
        return name
    })
}

function deleteCookiesClassic(
    this: WebdriverIO.Browser,
    names?: string[]
) {
    if (names === undefined) {
        return this.deleteAllCookies()
    }

    const namesList = Array.isArray(names) ? names : [names]

    if (namesList.every(obj => typeof obj !== 'string')) {
        return Promise.reject(new Error('Invalid input (see https://webdriver.io/docs/api/browser/deleteCookies for documentation)'))
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
