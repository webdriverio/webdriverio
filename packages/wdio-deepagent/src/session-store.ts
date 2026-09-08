import { CappedMap } from './capped-map.js'
import { MAX_KB_ENTRIES } from './knowledge-base/tools.js'
import type { SiteSnapshot } from './knowledge-base/tools.js'
import { MAX_ARCHIVE_CACHE } from './trace/tools.js'
import type { TraceArtifact } from './trace/reader.js'

/** Bounded caches shared by one harness's tool surface (KB + trace archives). */
export interface SessionCaches {
    knowledgeBase: CappedMap<string, SiteSnapshot>
    archives: CappedMap<string, TraceArtifact>
}

/**
 * Creates the bounded cache set for one harness instance. Harness instances
 * are already per-thread via the `threadId` option — instance ownership IS
 * the threading, so there is no global thread-keyed registry; the maps are
 * created here, threaded through the tool factories, and die with the harness.
 */
export function createSessionStore(): SessionCaches {
    return {
        knowledgeBase: new CappedMap<string, SiteSnapshot>(MAX_KB_ENTRIES),
        archives: new CappedMap<string, TraceArtifact>(MAX_ARCHIVE_CACHE),
    }
}
