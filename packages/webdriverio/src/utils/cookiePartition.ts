import type { remote } from 'webdriver'

import { getParallelContextStore } from '../session/context.js'

/**
 * Parallel tests share one user context by default, so a `context` partition
 * would resolve to the whole user-context jar in Chrome. The partition is
 * scoped to the origin of the test's own browsing context instead. Without a
 * usable origin (e.g. about:blank) it falls back to the context partition.
 * An explicit `sourceOrigin` string replaces that origin and `null` drops it;
 * both stay scoped to the test's user context.
 */
export async function parallelCookiePartition(
    browser: WebdriverIO.Browser,
    explicitOrigin?: string | null
): Promise<remote.StoragePartitionDescriptor | undefined> {
    const context = getParallelContextStore().getStore()
    if (!context) {
        return undefined
    }

    const { contexts } = await browser.browsingContextGetTree({ root: context, maxDepth: 0 })
    const info = contexts[0]
    const userContext = info?.userContext ? { userContext: info.userContext } : {}
    if (explicitOrigin !== undefined) {
        return {
            type: 'storageKey',
            ...(explicitOrigin === null ? {} : { sourceOrigin: explicitOrigin }),
            ...userContext
        }
    }

    let sourceOrigin: string | undefined
    try {
        const { origin } = new URL(info?.url)
        sourceOrigin = origin === 'null' ? undefined : origin
    } catch {
        sourceOrigin = undefined
    }
    if (!sourceOrigin) {
        return { type: 'context', context }
    }
    return {
        type: 'storageKey',
        sourceOrigin,
        ...userContext
    }
}

export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    return { type: 'storageKey', sourceOrigin }
}
