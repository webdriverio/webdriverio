import { EVENT_BUFFER_SIZE } from '../constants.js'

export interface LogEntry {
    seq: number
    time: number
    level: 'debug' | 'info' | 'warn' | 'error'
    source: string
    text: string
    url?: string
}

export interface NetworkEntry {
    seq: number
    time: number
    method: string
    url: string
    status?: number
    durationMs?: number
    size?: number
    failed: boolean
    errorText?: string
    /** BiDi `initiatorType`, else `destination`: what asked for the request */
    resource?: string
}

export class RingBuffer<T extends { seq: number }> {
    #items: T[] = []
    #seq = 0
    #cursor = 0

    constructor (readonly size = EVENT_BUFFER_SIZE) {}

    push (item: Omit<T, 'seq'>) {
        const entry = { ...item, seq: ++this.#seq } as T
        this.#items.push(entry)
        if (this.#items.length > this.size) {
            this.#items.shift()
        }
        return entry
    }

    all () {
        return [...this.#items]
    }

    /**
     * entries newer than the read cursor
     */
    unread () {
        return this.#items.filter((i) => i.seq > this.#cursor)
    }

    advance (seq = this.#seq) {
        this.#cursor = Math.max(this.#cursor, seq)
    }
}

export function formatTime (time: number) {
    const d = new Date(time)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export function formatLog (e: LogEntry) {
    return `${formatTime(e.time)} ${e.level.padEnd(5)} ${e.source.padEnd(8)} ${e.text}`
}

export function formatBytes (size?: number) {
    if (size === undefined || size < 0) {
        return '-'
    }
    if (size < 1024) {
        return `${size}B`
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)}kB`
    }
    return `${(size / 1024 / 1024).toFixed(1)}MB`
}

export function formatRequest (e: NetworkEntry) {
    const status = e.failed ? 'ERR' : String(e.status ?? '-')
    const duration = e.durationMs !== undefined ? `${Math.round(e.durationMs)}ms` : '-'
    const suffix = e.errorText ? ` (${e.errorText})` : ''
    return `${status} ${e.method} ${e.url} ${duration} ${formatBytes(e.size)}${suffix}`
}

export function parseDuration (value: string | number | undefined, fallback?: number): number | undefined {
    if (value === undefined || value === '') {
        return fallback
    }
    if (typeof value === 'number') {
        return value
    }
    const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/.exec(value.trim())
    if (!match) {
        throw new Error(`Invalid duration "${value}", use e.g. 500ms, 30s, 5m or 1h`)
    }
    const n = parseFloat(match[1])
    const unit = match[2] || 'ms'
    return Math.round(n * ({ ms: 1, s: 1000, m: 60_000, h: 3_600_000 } as const)[unit as 'ms'])
}
