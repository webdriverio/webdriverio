import type { remote } from 'webdriver'

import { getParallelContextStore } from '../session/context.js'

/**
 * Parallel tests each own a user context, so a cookie must be scoped to the
 * test's browsing context rather than the origin-wide storage key that
 * concurrent tests would share.
 */
export function parallelCookiePartition(): remote.StoragePartitionDescriptor | undefined {
    const context = getParallelContextStore().getStore()
    return context ? { type: 'context', context } : undefined
}

export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    return parallelCookiePartition() ?? { type: 'storageKey', sourceOrigin }
}
