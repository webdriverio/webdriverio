/**
 * Shared helpers for one-to-many custom-tag (Test-Case-ID) tagging.
 *
 * Both runtime paths (CLI/gRPC module + legacy listener handler) funnel through
 * the same tokenizer + merge engine so they produce an identical `custom_metadata`
 * payload shape:
 *   { [key]: { field_type: 'multi_dropdown', values: [...] } }
 *
 * The binary is a strict pass-through for per-test/per-hook `custom_metadata` — it
 * does NOT merge or dedupe across events — so the union+dedupe (set semantics)
 * MUST be completed SDK-side before serialization. Value parsing mirrors the
 * node-agent quote-aware tokenizer (helper.js `parseCommaSeparatedValues`).
 */

export interface CustomMetadataEntry {
    field_type: 'multi_dropdown'
    values: string[]
}

export type CustomMetadata = Record<string, CustomMetadataEntry>

/**
 * Quote-aware comma split. Mirrors node-agent `helper.js` tokenizer
 * `/\s*"([^"]*)"\s*|[^,]+/g` — a quoted body is preserved verbatim (so an
 * embedded comma is kept), otherwise the raw token is trimmed; empties dropped.
 *   '"checkout,cart", header' -> ['checkout,cart', 'header']
 *   'TC-1, TC-2'              -> ['TC-1', 'TC-2']
 * Backward compatible: unquoted input tokenizes identically to a naive
 * split(',').map(trim).filter(Boolean).
 */
export function parseCommaSeparatedValues(value: string | string[] | undefined | null): string[] {
    if (!value) {
        return []
    }

    if (Array.isArray(value)) {
        return value
    }

    const str = value.toString()
    if (str.trim() === '') {
        return []
    }

    const tokenizer = /\s*"([^"]*)"\s*|[^,]+/g
    const out: string[] = []
    let match: RegExpExecArray | null
    while ((match = tokenizer.exec(str)) !== null) {
        // Group 1 = quoted body (preserved verbatim); otherwise trim the raw match.
        const token = match[1] !== undefined ? match[1] : match[0].trim()
        if (token !== '') {
            out.push(token)
        }
    }
    return out
}

/**
 * Union + dedupe, existing-first ordering. Mirrors node-agent
 * `CustomTagManager.mergeValues` — repeated calls accumulate, they do not override.
 */
export function mergeValues(existingValues: string[] | undefined | null, incomingValues: string[] | undefined | null): string[] {
    return Array.from(new Set([...(existingValues || []), ...(incomingValues || [])]))
}

/**
 * Create-or-merge a single tag key inside a `custom_metadata` container.
 * Always produces `{ field_type: 'multi_dropdown', values: [...] }`; merges values
 * via mergeValues. The container is mutated in place and returned for chaining.
 * Mirrors node-agent `CustomTagManager.mergeIntoTags`.
 */
export function mergeIntoTags(tagsContainer: CustomMetadata, key: string, incomingValues: string[]): CustomMetadata {
    if (!tagsContainer[key]) {
        tagsContainer[key] = {
            field_type: 'multi_dropdown',
            values: [...(incomingValues || [])]
        }
    } else {
        // Defensive: tolerate malformed pre-existing entries.
        if (!tagsContainer[key].field_type) {
            tagsContainer[key].field_type = 'multi_dropdown'
        }
        if (!Array.isArray(tagsContainer[key].values)) {
            tagsContainer[key].values = []
        }
        tagsContainer[key].values = mergeValues(tagsContainer[key].values, incomingValues)
    }

    return tagsContainer
}

/**
 * Per-test-uuid accumulator. Both paths key on `InsightsHandler.currentTest.uuid`
 * so repeated `setCustomTags` calls within a single test union into one entry, and
 * the flush sink reads the final consolidated map for that test.
 */
export class CustomTagAccumulator {
    private store: Map<string, CustomMetadata> = new Map()

    /**
     * Add (key, value) for a test uuid. value is quote-aware comma-split; the
     * resulting values union+dedupe into the test's custom_metadata for that key.
     * Returns false (no-op) when uuid/key/value resolve to nothing.
     */
    add(testUuid: string | undefined, key: string, value: string): boolean {
        if (!testUuid || !key) {
            return false
        }
        const values = parseCommaSeparatedValues(value)
        if (values.length === 0) {
            return false
        }
        const container = this.store.get(testUuid) || {}
        mergeIntoTags(container, key, values)
        this.store.set(testUuid, container)
        return true
    }

    /** Final consolidated custom_metadata for a test uuid, or undefined if none. */
    get(testUuid: string | undefined): CustomMetadata | undefined {
        if (!testUuid) {
            return undefined
        }
        return this.store.get(testUuid)
    }

    /** Drop the accumulated entry once flushed (avoid unbounded growth). */
    clear(testUuid: string | undefined): void {
        if (testUuid) {
            this.store.delete(testUuid)
        }
    }
}
