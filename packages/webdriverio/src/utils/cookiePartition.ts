import type { remote } from 'webdriver'

import { getParallelContextStore } from '../session/context.js'

type CookieAttributes = { domain?: string, path?: string, secure?: boolean }

export interface ParallelCookieScope {
    partition: remote.StoragePartitionDescriptor
    /** whether the page (or an explicit `sourceOrigin`) sees a cookie, as WebDriver Classic; none: all cookies of the jar */
    isVisible?: (cookie: CookieAttributes) => boolean
}

/**
 * The cookie jar of a parallel test: the storage partition of its window (WebDriver BiDi
 * "context" partition: the key of the navigable's storage partition). A `sourceOrigin` is
 * a partition key, not a cookie filter: Chrome reads it as the key of a partitioned
 * (CHIPS) jar, where a cookie that is not `secure` is rejected, and Firefox ignores it.
 * The cookies that the page sees (WebDriver Classic "associated cookies") are kept instead;
 * an explicit `sourceOrigin` keeps the cookies of its origin, and `null` all cookies of the jar.
 */
export async function parallelCookieScope(
    browser: WebdriverIO.Browser,
    explicitOrigin?: string | null
): Promise<ParallelCookieScope | undefined> {
    const context = getParallelContextStore().getStore()
    if (!context) {
        return undefined
    }

    const partition: remote.StoragePartitionDescriptor = { type: 'context', context }
    if (explicitOrigin === null) {
        return { partition }
    }
    let url: URL | undefined
    try {
        url = new URL(explicitOrigin ?? (await browser.browsingContextGetTree({ root: context, maxDepth: 0 })).contexts[0]?.url)
    } catch {
        url = undefined
    }
    // an origin has no path: only a page filters by the cookie path
    return { partition, isVisible: url ? associatedCookies(url, explicitOrigin === undefined) : () => false }
}

/**
 * RFC 6265 section 5.4 step 1, as WebDriver Classic "associated cookies": the domain and the
 * path match, and a secure cookie only goes to a potentially trustworthy URL. A page with no
 * host (`about:blank`, `data:`) has no cookies.
 */
export function associatedCookies(url: URL, withPath: boolean) {
    const host = url.hostname.toLowerCase()
    const trustworthy = isPotentiallyTrustworthy(url)
    return (cookie: CookieAttributes) => Boolean(host) &&
        domainMatches(cookie.domain, host) &&
        (!withPath || pathMatches(cookie.path, url.pathname || '/')) &&
        (!cookie.secure || trustworthy)
}

/** a domain cookie has a leading dot and also matches the subdomains; a host-only cookie matches its host */
function domainMatches(domain: string | undefined, host: string) {
    if (!domain) {
        return true
    }
    const cookieDomain = domain.toLowerCase()
    return cookieDomain.startsWith('.')
        ? host === cookieDomain.slice(1) || host.endsWith(cookieDomain)
        : host === cookieDomain
}

/** RFC 6265 section 5.1.4 */
function pathMatches(cookiePath = '/', requestPath: string) {
    return cookiePath === requestPath || (
        requestPath.startsWith(cookiePath) && (cookiePath.endsWith('/') || requestPath[cookiePath.length] === '/')
    )
}

function isPotentiallyTrustworthy(url: URL) {
    const host = url.hostname.toLowerCase()
    return url.protocol === 'https:' || url.protocol === 'wss:' ||
        host === 'localhost' || host.endsWith('.localhost') || host === '[::1]' || /^127\./.test(host)
}

export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    return { type: 'storageKey', sourceOrigin }
}
