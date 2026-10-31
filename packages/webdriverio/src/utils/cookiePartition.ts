import type { remote } from 'webdriver'

import { isBrowsingContext } from '../session/browsingContext.js'
import { getContextManager, getParallelContextStore } from '../session/context.js'
import { isBidiCommandsEnabled } from './bidi/elementCommands.js'

type CookieAttributes = { domain?: string, path?: string }

export interface WindowCookieScope {
    browser: WebdriverIO.Browser
    context: string
    /**
     * the jar of the window: its user context. Firefox limits the BiDi "context" partition to the
     * origin of the page, so a read or delete there misses the cookies of other hosts, and a cookie set
     * there is not visible to a plain http page; Chrome resolves "context" to the user context
     */
    partition: remote.StoragePartitionDescriptor
    userContext?: string
    url?: URL
}

/**
 * With `wdio:experimentalBiDiCommands`, and in every parallel test, the cookie commands follow
 * WebDriver BiDi as Puppeteer does: they use the cookie jar of the window (or of the browsing
 * context they are called on). Without it, they keep their earlier behavior.
 */
export async function windowCookieScope(
    target: WebdriverIO.Browser | WebdriverIO.BrowsingContext
): Promise<WindowCookieScope | undefined> {
    const browser = isBrowsingContext(target) ? target.browser : target
    const parallelContext = getParallelContextStore().getStore()
    if (!parallelContext && !isBidiCommandsEnabled(browser)) {
        return undefined
    }
    const context = isBrowsingContext(target)
        ? target.contextId
        : parallelContext ?? await getContextManager(browser).getCurrentContext()
    const info = (await browser.browsingContextGetTree({ root: context, maxDepth: 0 })).contexts[0]
    let url: URL | undefined
    try {
        url = new URL(info?.url)
    } catch {
        url = undefined
    }
    const userContext = info?.userContext || undefined
    return {
        browser,
        context,
        partition: userContext ? { type: 'storageKey', userContext } : { type: 'context', context },
        userContext,
        url
    }
}

/**
 * The cookies that a page sees, as Puppeteer filters the BiDi jar (BiDi filters only match exact
 * values): RFC 6265 domain-match and path-match. Browsers store a host-only cookie without a leading
 * dot. An IP address only matches itself. A page with no host (`about:blank`, `data:`) has no cookies.
 */
export function cookieMatchesUrl(url?: URL) {
    const host = url?.hostname.toLowerCase()
    if (!url || !host) {
        return () => false
    }
    const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')
    return (cookie: CookieAttributes) => (
        domainMatches(cookie.domain, host, isIpAddress) && pathMatches(cookie.path, url.pathname || '/')
    )
}

function domainMatches(domain: string | undefined, host: string, isIpAddress: boolean) {
    if (!domain) {
        return true
    }
    const cookieDomain = domain.toLowerCase()
    if (!cookieDomain.startsWith('.')) {
        return host === cookieDomain
    }
    return host === cookieDomain.slice(1) || (!isIpAddress && host.endsWith(cookieDomain))
}

/** RFC 6265 section 5.1.4 */
function pathMatches(cookiePath = '/', requestPath: string) {
    return cookiePath === requestPath || (
        requestPath.startsWith(cookiePath) && (cookiePath.endsWith('/') || requestPath[cookiePath.length] === '/')
    )
}

/** the cookie filters of `deleteCookies`; an entry that is not a name or a filter object is an error */
export function toCookieFilters(filterArray: unknown[]): remote.StorageCookieFilter[] {
    return filterArray.map((f) => {
        if (typeof f === 'string') {
            return { name: f }
        }
        if (typeof f === 'object' && f !== null) {
            return f as remote.StorageCookieFilter
        }
        throw new Error(`Invalid value for cookie filter, expected 'string' or 'remote.StorageCookieFilter' but found "${f === null ? 'null' : typeof f}"`)
    })
}

export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    return { type: 'storageKey', sourceOrigin }
}
