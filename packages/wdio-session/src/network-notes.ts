import type { NetworkEntry, RingBuffer } from './daemon/events.js'

const MAX_LINES = 3
const PREFIX = 'Requests failed: '

/** what a page's own code asks for, not what it loads to render */
const WANTED = new Set(['fetch', 'xmlhttprequest', 'document', 'iframe', 'frame'])
const IGNORED = new Set(['image', 'img', 'font', 'css', 'script', 'audio', 'video', 'track', 'beacon', 'ping', 'link', 'object', 'embed', 'input', 'style', 'manifest'])
const STATIC_ASSET = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|css|js|mjs|map|mp4|webm|mp3)$/i
const TRACKER = /(?:^|[./])(?:google-analytics|googletagmanager|doubleclick|facebook\.com\/tr|hotjar|segment|mixpanel)\b|\/(?:collect|pixel|beacon|track|analytics)(?:\/|$)/i

export function networkMark (buffer: RingBuffer<NetworkEntry>) {
    return buffer.all().at(-1)?.seq ?? 0
}

function short (url: string) {
    try {
        const { host, pathname } = new URL(url)
        return host ? `${host}${pathname}` : undefined
    } catch {
        return undefined
    }
}

function isReported (entry: NetworkEntry) {
    if (!entry.failed && (entry.status ?? 0) < 400) {
        return false
    }
    // a request the page gave up on (navigation, unload) is not a failure
    if (entry.failed && /abort/i.test(entry.errorText ?? '')) {
        return false
    }
    const resource = entry.resource?.toLowerCase()
    if (resource && IGNORED.has(resource)) {
        return false
    }
    const target = short(entry.url)
    if (!target || TRACKER.test(target)) {
        return false
    }
    return Boolean(resource && WANTED.has(resource)) || !STATIC_ASSET.test(target)
}

/**
 * One text for the failed XHR, fetch and document requests among `entries`,
 * identical ones counted, or `undefined` when there are none.
 */
export function failedRequestNote (entries: NetworkEntry[]): string | undefined {
    const groups = new Map<string, number>()
    for (const entry of entries.filter(isReported)) {
        const line = `${entry.failed ? 'ERR' : entry.status} ${entry.method} ${short(entry.url)}`
        groups.set(line, (groups.get(line) ?? 0) + 1)
    }
    const lines = [...groups].map(([line, count]) => count > 1 ? `${line} (×${count})` : line)
    if (!lines.length) {
        return undefined
    }
    const shown = lines.slice(0, MAX_LINES)
    if (lines.length > MAX_LINES) {
        shown.push(`+${lines.length - MAX_LINES} more`)
    }
    return PREFIX + shown.join(`\n${' '.repeat(PREFIX.length)}`)
}
