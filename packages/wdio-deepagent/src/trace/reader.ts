import AdmZip from 'adm-zip'
import zlib from 'node:zlib'

/**
 * Normalized view of a devtools `trace.zip` artifact (see
 * website/docs/devtools/wdio/trace-mode). Parsing is best-effort: exact
 * record shapes come from the webdriverio/devtools repo, so the reader
 * extracts documented fields defensively and keeps the raw records.
 */

export interface TraceAction {
    /** Pair id linking the `before`/`after` records. */
    id?: string
    /** wdio command name (e.g. `url`, `click`, `setValue`). */
    name?: string
    selector?: string
    value?: string
    url?: string
    /** Start timestamp (ms). */
    startedAt?: number
    /** Duration in ms when the `after` record is present. */
    duration?: number
    /** Whether the action completed without error. */
    ok: boolean
    error?: string
    /** Referenced resources inside the archive. */
    snapshotFile?: string
    elementsFile?: string
    screenshotFile?: string
    /** Raw NDJSON record for downstream consumers. */
    raw: Record<string, unknown>
}

export interface TraceNetworkEntry {
    method?: string
    url?: string
    status?: number
    duration?: number
    raw: Record<string, unknown>
}

/**
 * True when the entry records a failed request. Chromium logs HTTP errors
 * as >= 400 and aborted/failed requests (dns failure, connection reset,
 * `Network.loadingFailed` without a response) as status 0 or no status at
 * all — those must count as failures, not successes.
 */
export function isNetworkError(entry: TraceNetworkEntry): boolean {
    const status = entry.status ?? 0
    return status === 0 || status >= 400
}

export interface TraceArtifact {
    /** Archive file name. */
    source: string
    actions: TraceAction[]
    network: TraceNetworkEntry[]
    /** `transcript.md` content (LLM-friendly summary). */
    transcript: string
    /** True when the archive contains a `trace.network` entry with non-empty content. */
    hasNetworkData: boolean
    /** True when the archive contains a `transcript.md` entry. */
    hasTranscript: boolean
    /** `*-elements.json` / `*-snapshot.txt` resources by entry name. */
    snapshots: Map<string, string>
    /** Screenshot resources by entry name. */
    screenshots: Map<string, Buffer>
}

const ACTION_KEYS = ['name', 'selector', 'value', 'url'] as const

/** Hard caps so a crafted `trace.zip` cannot exhaust memory (zip-bomb defense). */
export const DEFAULT_MAX_TRACE_ENTRIES = 10_000
export const DEFAULT_MAX_TRACE_BYTES = 256 * 1024 * 1024

export interface TraceParseOptions {
    /** Max archive entries to decompress (default 10_000). */
    maxEntries?: number
    /** Max total decompressed bytes (default 256 MiB). */
    maxTotalBytes?: number
    /** Skip decompressing resource entries (screenshots/snapshots); record names only (default true). */
    keepResources?: boolean
}

/** First string-valued field among `keys` (multi-shape record fallback). */
function strField(rec: unknown, ...keys: string[]): string | undefined {
    if (!rec || typeof rec !== 'object') {
        return undefined
    }
    const obj = rec as Record<string, unknown>
    for (const key of keys) {
        if (typeof obj[key] === 'string') {
            return obj[key] as string
        }
    }
    return undefined
}

/** First number-valued field among `keys`. */
function numField(rec: unknown, ...keys: string[]): number | undefined {
    if (!rec || typeof rec !== 'object') {
        return undefined
    }
    const obj = rec as Record<string, unknown>
    for (const key of keys) {
        if (typeof obj[key] === 'number') {
            return obj[key] as number
        }
    }
    return undefined
}

/**
 * Action id in the devtools trace: `id` (fixture/older format) or
 * `callId` (current @wdio/devtools-service v8 format).
 */
function recordId(rec: Record<string, unknown>): string | undefined {
    return strField(rec, 'id', 'callId')
}

/** Timestamp in ms: `ts` (fixture), `timestamp`, or `startTime`/`endTime` (v8). */
function recordTs(rec: Record<string, unknown>, key: 'start' | 'end'): number | undefined {
    return key === 'start' ? numField(rec, 'ts', 'timestamp', 'startTime') : numField(rec, 'endTime')
}

/**
 * Error text from either shape: plain string (`error`) or the v8
 * `{ message }` object.
 */
function recordError(rec: Record<string, unknown>): string | undefined {
    return strField(rec, 'error') ?? strField(rec.error, 'message')
}

function forEachNdjsonLine(text: string, fn: (line: Record<string, unknown>) => void): void {
    let start = 0
    const emit = (end: number) => {
        const trimmed = text.slice(start, end).trim()
        if (trimmed) {
            try {
                fn(JSON.parse(trimmed) as Record<string, unknown>)
            } catch {
                // skip malformed lines
            }
        }
        start = end + 1
    }
    let nl = text.indexOf('\n', start)
    while (nl !== -1) {
        emit(nl)
        nl = text.indexOf('\n', start)
    }
    if (start < text.length) {
        emit(text.length)
    }
}

/**
 * Decompresses one zip entry under a hard output cap so a crafted deflate
 * stream cannot exhaust memory (zip-bomb defense). Method 8 is DEFLATED
 * (raw deflate, no zlib header — verified against adm-zip 0.5.x's
 * `zlib.inflateRawSync`); STORED/other entries are copied, never inflated.
 */
function inflateEntryData(entry: AdmZip.IZipEntry, remaining: number, cap: number): Buffer {
    if (entry.header.method !== 8) {
        const data = entry.getData()
        if (data.length > remaining) {
            throw new Error(
                `trace.zip exceeds ${cap} bytes decompressed; refusing to parse untrusted archive.`
            )
        }
        return data
    }
    try {
        return zlib.inflateRawSync(entry.getCompressedData(), { maxOutputLength: remaining })
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ERR_BUFFER_TOO_LARGE') {
            throw new Error(
                remaining === cap
                    ? `trace.zip entry ${entry.entryName} exceeds ${cap} bytes decompressed; refusing to parse untrusted archive.`
                    : `trace.zip exceeds ${cap} bytes decompressed; refusing to parse untrusted archive.`
            )
        }
        throw err
    }
}

function parseActionRecord(rec: Record<string, unknown>): TraceAction {
    // The devtools trace wraps the action payload in `action` for before
    // records (fixture format); the current v8 format nests it in
    // `params`. Accept both flattened and nested shapes.
    const action = (rec.action && typeof rec.action === 'object'
        ? rec.action
        : rec.params && typeof rec.params === 'object' ? rec.params : rec) as Record<string, unknown>
    const actionFields: Partial<TraceAction> = {}
    for (const key of ACTION_KEYS) {
        const v = action[key]
        if (typeof v === 'string') {
            ;(actionFields as Record<string, unknown>)[key] = v
        }
    }
    // v8 before records carry no `name` — derive it from the CDP call
    if (!actionFields.name) {
        const derived = strField(rec, 'apiName', 'method')
        if (derived) {
            actionFields.name = derived
        }
    }
    return {
        id: recordId(rec),
        ...actionFields,
        startedAt: recordTs(rec, 'start'),
        // parseActionRecord only sees `before` records; ok is set by the
        // after-pairing below, and stays false for orphaned (truncated) actions
        ok: false,
        error: recordError(rec),
        snapshotFile: strField(rec, 'snapshotFile'),
        elementsFile: strField(rec, 'elementsFile'),
        screenshotFile: strField(rec, 'screenshotFile'),
        raw: rec,
    }
}

/**
 * Parses a devtools `trace.zip` buffer into structured agent context:
 * ordered action timeline (before/after pairs), network entries,
 * transcript, per-action accessibility snapshots and screenshots.
 */
export function parseTraceArchive(
    zipBuffer: Buffer,
    source = 'trace.zip',
    options: TraceParseOptions = {},
): TraceArtifact {
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_TRACE_ENTRIES
    const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TRACE_BYTES
    const keepResources = options.keepResources ?? true
    const zip = new AdmZip(zipBuffer)
    const actions: TraceAction[] = []
    const network: TraceNetworkEntry[] = []
    const snapshots = new Map<string, string>()
    const screenshots = new Map<string, Buffer>()
    let transcript = ''
    let hasNetworkData = false
    let hasTranscript = false
    const actionById = new Map<string, TraceAction>()

    const entries = zip.getEntries()
    if (entries.length > maxEntries) {
        throw new Error(
            `trace.zip has ${entries.length} entries (max ${maxEntries}); refusing to parse untrusted archive.`
        )
    }

    /** Pair an `after` record into its action in place (no after → ok:false). */
    const enrichAction = (action: TraceAction, afterRaw: Record<string, unknown>): void => {
        const end = recordTs(afterRaw, 'end') ?? recordTs(afterRaw, 'start')
        if (typeof end === 'number' && action.startedAt !== undefined) {
            action.duration = Math.max(0, end - action.startedAt)
        }
        const err = recordError(afterRaw)
        if (err && !action.error) {
            action.error = err
        }
        // only an explicit error-free `after` clears the not-ok default
        action.ok = !err
    }

    let totalBytes = 0
    for (const entry of entries) {
        const name = entry.entryName
        // The entry header carries the declared uncompressed size; reject
        // oversized entries before materializing them in memory.
        const declared = typeof entry.header?.size === 'number' ? entry.header.size : 0
        if (declared > maxTotalBytes) {
            throw new Error(
                `trace.zip entry ${name} declares ${declared} bytes (max ${maxTotalBytes}); refusing to parse untrusted archive.`
            )
        }
        if (!keepResources) {
            if (name.endsWith('-elements.json') || name.endsWith('-snapshot.txt')) {
                snapshots.set(name, '')
                continue
            }
            if (/\.(jpe?g|png|webp)$/i.test(name)) {
                screenshots.set(name, Buffer.alloc(0))
                continue
            }
        }
        const data = inflateEntryData(entry, maxTotalBytes - totalBytes, maxTotalBytes)
        totalBytes += data.length

        if (name === 'transcript.md') {
            transcript = data.toString('utf8')
            hasTranscript = true
            continue
        }

        if (name === 'trace.trace' || name.endsWith('.trace')) {
            forEachNdjsonLine(data.toString('utf8'), (rec) => {
                if (rec.type === 'after') {
                    // `after` records only enrich their `before` pair
                    const id = recordId(rec)
                    const action = id ? actionById.get(id) : undefined
                    if (action) {
                        enrichAction(action, rec)
                    }
                    return
                }
                // v8 traces interleave `screencast-frame`/`network`/
                // `mutation` records — only `before` records are actions
                if (rec.type !== 'before') {
                    return
                }
                const action = parseActionRecord(rec)
                actions.push(action)
                if (action.id) {
                    actionById.set(action.id, action)
                }
            })
            continue
        }

        if (name === 'trace.network' || name.endsWith('.network')) {
            const text = data.toString('utf8')
            if (text.trim()) {
                hasNetworkData = true
            }
            forEachNdjsonLine(text, (rec) => {
                // Network lines are HAR-format `resource-snapshot` records written by
                // @wdio/devtools-service (core/src/trace-har.ts); fields live under `snapshot`.
                const snapshot = rec.snapshot && typeof rec.snapshot === 'object'
                    ? rec.snapshot as Record<string, unknown>
                    : undefined
                const request = snapshot?.request as Record<string, unknown> | undefined
                const response = snapshot?.response as Record<string, unknown> | undefined
                network.push({
                    method: strField(request, 'method'),
                    url: strField(request, 'url'),
                    status: numField(response, 'status'),
                    duration: numField(snapshot, 'time'),
                    raw: rec,
                })
            })
            continue
        }

        if (name.endsWith('-elements.json') || name.endsWith('-snapshot.txt')) {
            snapshots.set(name, data.toString('utf8'))
            continue
        }

        if (/\.(jpe?g|png|webp)$/i.test(name)) {
            screenshots.set(name, data)
        }
    }

    return { source, actions, network, transcript, hasNetworkData, hasTranscript, snapshots, screenshots }
}
