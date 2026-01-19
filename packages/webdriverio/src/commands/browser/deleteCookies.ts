import logger from '@wdio/logger'
import type { remote } from 'webdriver'

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
    this: WebdriverIO.Browser,
    filter?: string | string[] | remote.StorageCookieFilter | remote.StorageCookieFilter[]
): Promise<void> {
    const filterArray = typeof filter === 'undefined'
        ? undefined
        : Array.isArray(filter) ? filter : [filter]

    if (!this.isBidi) {
        await deleteCookiesClassic.call(this, getNamesForClassic(filterArray))
        return
    }

    let url: URL
    try {
        url = new URL(await this.getUrl())
        if (url.origin === 'null') {
            await deleteCookiesClassic.call(this, getNamesForClassic(filterArray))
            return
        }
    } catch {
        await deleteCookiesClassic.call(this, getNamesForClassic(filterArray))
        return
    }
    const partition: remote.StoragePartitionDescriptor = {
        type: 'storageKey',
        sourceOrigin: url.origin
    }

    try {
        if (!filterArray) {
            await this.storageDeleteCookies({ partition })
            return
        }

        const bidiFilter = filterArray.map((f) => {
            if (typeof f === 'string') {
                return { name: f } as remote.StorageCookieFilter
            }
            if (typeof f === 'object') {
                return f
            }

            throw new Error(`Invalid value for cookie filter, expected 'string' or 'remote.StorageCookieFilter' but found "${typeof f}"`)
        })

        await Promise.all(bidiFilter.map((filter) => (
            this.storageDeleteCookies({ filter, partition })
        )))
    } catch (err) {
        log.warn(`BiDi deleteCookies failed, falling back to classic: ${(err as Error).message}`)
        await deleteCookiesClassic.call(this, getNamesForClassic(filterArray))
    }

    return
}

function getNamesForClassic(filterArray?: (string | remote.StorageCookieFilter)[]) {
    return filterArray?.map((f) => {
        if (typeof f === 'object') {
            const name = f.name
            if (!name) {
                throw new Error('In WebDriver Classic you can only filter for cookie names')
            }
            return name
        }
        if (typeof f === 'string') {
            return f
        }

        throw new Error(`Invalid value for cookie filter, expected 'string' or 'remote.StorageCookieFilter' but found "${typeof f}"`)
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
