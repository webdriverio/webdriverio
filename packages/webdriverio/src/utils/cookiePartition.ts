import type { remote } from 'webdriver'

import { getParallelContextStore } from '../session/context.js'

/**
 * Parallel tests each own a user context, so a cookie must be scoped to the
 * test's browsing context rather than the origin-wide storage key that
 * concurrent tests would share.
 */
export function getCookiePartition(sourceOrigin: string): remote.StoragePartitionDescriptor {
    const context = getParallelContextStore().getStore()
    return context
        ? { type: 'context', context }
        : { type: 'storageKey', sourceOrigin }
}
