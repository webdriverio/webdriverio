import logger from '@wdio/logger'

import type { LogEntry, NetworkEntry } from './events.js'
import type { Session } from '../session.js'

const log = logger('@wdio/session:capture')

interface RemoteValue {
    type?: string
    value?: unknown
}

/**
 * Text of a BiDi remote value, deep enough for console arguments.
 */
export function remoteValueText (value: unknown): string {
    if (!value || typeof value !== 'object') {
        return value === undefined || value === null ? '' : String(value)
    }
    const remote = value as RemoteValue
    switch (remote.type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
        return String(remote.value)
    case 'null':
        return 'null'
    case 'undefined':
        return 'undefined'
    case 'regexp':
        return String((remote.value as { pattern?: string } | undefined)?.pattern || '')
    case 'date':
        return String(remote.value ?? '')
    case 'error':
        return String((remote.value as { message?: string } | undefined)?.message || 'Error')
    case 'array':
        return Array.isArray(remote.value) ? remote.value.map(remoteValueText).join(', ') : ''
    default:
        return ''
    }
}

export function consoleText (entry: { text?: string | null, args?: unknown[] }) {
    if (entry.text) {
        return entry.text
    }
    return (entry.args || []).map(remoteValueText).filter((part) => part !== '').join(' ')
}

export function consoleLevel (method: string | undefined, fallback: LogEntry['level']): LogEntry['level'] {
    if (method === 'error' || method === 'assert') {
        return 'error'
    }
    if (method === 'warn') {
        return 'warn'
    }
    if (method === 'debug' || method === 'trace') {
        return 'debug'
    }
    return fallback
}

interface Timings {
    requestTime?: number
    fetchStart?: number
    responseEnd?: number
}

interface ResponseLike {
    bodySize?: number | null
    bytesReceived?: number | null
}

/**
 * Duration and size of a completed BiDi request. Timings are milliseconds
 * relative to the request's time origin.
 */
export function responseStats (timings: Timings | undefined, response: ResponseLike | undefined) {
    const start = timings?.requestTime || timings?.fetchStart || 0
    const end = timings?.responseEnd || 0
    const size = response?.bodySize ?? response?.bytesReceived
    return {
        durationMs: end > start ? Math.round(end - start) : undefined,
        size: size === null || size === undefined ? undefined : size
    }
}

interface CapturedRequest {
    request?: { method?: string, url?: string, timings?: Timings }
    timestamp?: number
    response?: ResponseLike & { status?: number }
    errorText?: string
}

export function networkEntry (params: CapturedRequest, failed: boolean): Omit<NetworkEntry, 'seq'> | undefined {
    const request = params.request
    if (!request?.url || !request.method) {
        return undefined
    }
    const stats = responseStats(request.timings, params.response)
    return {
        time: params.timestamp || Date.now(),
        method: request.method,
        url: request.url,
        status: failed ? undefined : params.response?.status,
        durationMs: stats.durationMs,
        size: stats.size,
        failed,
        errorText: params.errorText
    }
}

const CHROME_LEVEL: Record<string, LogEntry['level']> = {
    SEVERE: 'error',
    WARNING: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
}

/**
 * Drivers without BiDi keep logs in a buffer that `getLogs` drains.
 * Called from `logs` so the ring buffer sees them.
 */
export async function pollLogs (session: Session, source?: string) {
    const { browser } = session
    if (session.applies.includes('M')) {
        const types = source === 'syslog' || source === 'logcat' ? [source] : ['logcat', 'syslog']
        for (const type of types) {
            const entries = await browser.getLogs(type).catch(() => []) as { timestamp?: number, level?: string, message?: string }[]
            for (const entry of entries) {
                session.logs.push({
                    time: entry.timestamp || Date.now(),
                    level: CHROME_LEVEL[entry.level || ''] || 'info',
                    source: type,
                    text: entry.message || ''
                })
            }
        }
        return
    }
    if (session.isBidi || !session.isWeb) {
        return
    }
    const entries = await browser.getLogs('browser').catch(() => []) as { timestamp?: number, level?: string, message?: string }[]
    for (const entry of entries) {
        session.logs.push({
            time: entry.timestamp || Date.now(),
            level: CHROME_LEVEL[entry.level || ''] || 'info',
            source: 'console',
            text: entry.message || ''
        })
    }
}

/**
 * Subscribe to console, page errors and network events for the life of the
 * session (RFC §9.7).
 */
export async function startEventCapture (session: Session) {
    if (!session.isBidi || !session.isWeb || session.applies.includes('M')) {
        return
    }
    const { browser } = session
    await browser.sessionSubscribe({
        events: ['log.entryAdded', 'network.responseCompleted', 'network.fetchError']
    })

    const onLog = (entry: { type?: string, level?: LogEntry['level'], text?: string | null, timestamp?: number, method?: string, args?: unknown[] }) => {
        const javascript = entry.type === 'javascript'
        session.logs.push({
            time: entry.timestamp || Date.now(),
            level: javascript ? 'error' : consoleLevel(entry.method, entry.level || 'info'),
            source: javascript ? 'page' : 'console',
            text: consoleText(entry) || (javascript ? 'page error' : '')
        })
    }
    const onResponse = (params: CapturedRequest) => {
        const entry = networkEntry(params, false)
        if (entry) {
            session.network.push(entry)
        }
    }
    const onFetchError = (params: CapturedRequest) => {
        const entry = networkEntry(params, true)
        if (entry) {
            session.network.push(entry)
        }
    }
    browser.on('log.entryAdded', onLog)
    browser.on('network.responseCompleted', onResponse)
    browser.on('network.fetchError', onFetchError)
    session.disposers.push(() => {
        browser.off('log.entryAdded', onLog)
        browser.off('network.responseCompleted', onResponse)
        browser.off('network.fetchError', onFetchError)
    })
    log.debug(`Capturing logs and network for "${session.name}"`)
}
