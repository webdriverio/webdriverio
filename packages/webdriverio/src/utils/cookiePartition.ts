import type { remote } from 'webdriver'

import { getParallelContextStore } from '../session/context.js'

export interface ParallelCookieScope {
    partition: remote.StoragePartitionDescriptor
    /** the host whose cookies the commands see, as WebDriver Classic for the page; none: all cookies of the jar */
    host?: string
}

/**
 * The cookie jar of a parallel test: the storage partition of its window (WebDriver BiDi
 * "context" partition: the key of the navigable's storage partition). A `sourceOrigin` is
 * a partition key, not a cookie filter: Chrome reads it as the key of a partitioned
 * (CHIPS) jar, where a cookie that is not `secure` is rejected, and Firefox ignores it.
 * The host of the page (or of an explicit `sourceOrigin`) filters the cookies instead,
 * as WebDriver Classic returns the cookies of the page; `null` keeps all cookies of the jar.
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
    let host: string | undefined
    try {
        const source = explicitOrigin ?? (await browser.browsingContextGetTree({ root: context, maxDepth: 0 })).contexts[0]?.url
        host = new URL(source).hostname || undefined
    } catch {
        host = undefined
    }
    return { partition, host }
}

/** RFC 6265 domain-match of a cookie domain (with or without the leading dot) and a host */
export function cookieMatchesHost(domain: string, host: string) {
    const cookieDomain = domain.replace(/^\./, '').toLowerCase()
    const hostName = host.toLowerCase()
    return hostName === cookieDomain || hostName.endsWith(`.${cookieDomain}`)
}

export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    return { type: 'storageKey', sourceOrigin }
}
