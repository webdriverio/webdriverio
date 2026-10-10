import fs from 'node:fs'
import path from 'node:path'

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
    request?: { request?: string, method?: string, url?: string, timings?: Timings, initiatorType?: string | null, destination?: string }
    timestamp?: number
    response?: ResponseLike & { status?: number }
    errorText?: string
}

function inflightIds (session: Session) {
    let ids = session.get<Set<string>>('networkInflight')
    if (!ids) {
        ids = new Set()
        session.set('networkInflight', ids)
    }
    return ids
}

function noteRequest (session: Session, params: CapturedRequest, open: boolean) {
    const id = params.request?.request
    if (!id) {
        return
    }
    const ids = inflightIds(session)
    if (open) {
        ids.add(id)
    } else {
        ids.delete(id)
    }
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
        errorText: params.errorText,
        resource: request.initiatorType || request.destination || undefined
    }
}

const CHROME_LEVEL: Record<string, LogEntry['level']> = {
    SEVERE: 'error',
    WARNING: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
}

const SERVICE_LOG = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+([A-Za-z]+)\s+\S+\s+(.*)$/
const ELECTRON_TAG = /^\[Electron:(MainProcess|Renderer)(?::[^\]]*)?\]\s*(.*)$/

/**
 * One line of a native-service log file
 * (`<iso> INFO electron-service:service: [Electron:MainProcess] …`).
 */
export function parseServiceLogLine (line: string): Omit<LogEntry, 'seq'> | undefined {
    const match = SERVICE_LOG.exec(line.trim())
    if (!match) {
        return undefined
    }
    const tagged = ELECTRON_TAG.exec(match[3])
    const text = (tagged ? tagged[2] : match[3]).trim()
    if (!text) {
        return undefined
    }
    const levelName = match[2].toLowerCase()
    const level = levelName === 'debug' || levelName === 'info' || levelName === 'warn' || levelName === 'error' ? levelName : 'info'
    const time = Date.parse(match[1])
    return {
        time: Number.isNaN(time) ? Date.now() : time,
        level,
        source: tagged?.[1] === 'MainProcess' ? 'main' : tagged ? 'console' : 'driver',
        text
    }
}

interface LogTail {
    offset: number
    rest: string
}

/**
 * Electron main-process logs are written by `@wdio/electron-service` under
 * `plan.electron.logDir`. Fold new lines into the ring buffer.
 */
export function ingestElectronLogs (session: Session) {
    const logDir = session.plan.electron?.logDir
    if (!logDir || !fs.existsSync(logDir)) {
        return
    }
    const tails = session.get<Map<string, LogTail>>('electronLogTails') || new Map()
    let names: string[] = []
    try {
        names = fs.readdirSync(logDir).filter((name) => name.endsWith('.log'))
    } catch {
        return
    }
    for (const name of names) {
        const file = path.join(logDir, name)
        let size = 0
        try {
            size = fs.statSync(file).size
        } catch {
            continue
        }
        const tail = tails.get(file) || { offset: 0, rest: '' }
        if (size < tail.offset) {
            tail.offset = 0
            tail.rest = ''
        }
        if (size === tail.offset) {
            tails.set(file, tail)
            continue
        }
        const MAX_LOG_CHUNK = 256 * 1024
        let start = tail.offset
        if (size - start > MAX_LOG_CHUNK) {
            start = size - MAX_LOG_CHUNK
            tail.rest = ''
        }
        const length = size - start
        const buf = Buffer.alloc(length)
        const fd = fs.openSync(file, 'r')
        try {
            fs.readSync(fd, buf, 0, length, start)
        } finally {
            fs.closeSync(fd)
        }
        tail.offset = size
        const lines = (tail.rest + buf.toString('utf8')).split('\n')
        tail.rest = lines.pop() ?? ''
        tails.set(file, tail)
        for (const line of lines) {
            const entry = parseServiceLogLine(line)
            if (entry) {
                session.logs.push(entry)
            }
        }
    }
    session.set('electronLogTails', tails)
}

/**
 * Drivers without BiDi keep logs in a buffer that `getLogs` drains.
 * Called from `logs` so the ring buffer sees them.
 */
export async function pollLogs (session: Session, source?: string) {
    ingestElectronLogs(session)
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

const NETWORK_EVENTS = ['network.beforeRequestSent', 'network.responseCompleted', 'network.fetchError'] as const

/**
 * Subscribe to console, page errors and network events for the life of the
 * session (RFC §9.7). `logs: false` leaves console and page errors alone.
 */
export async function startEventCapture (session: Session, { logs = true } = {}) {
    if (!session.isBidi || !session.isWeb || session.applies.includes('M')) {
        return
    }
    const { browser } = session
    await browser.sessionSubscribe({
        events: logs ? ['log.entryAdded', ...NETWORK_EVENTS] : [...NETWORK_EVENTS]
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
    const onBefore = (params: CapturedRequest) => noteRequest(session, params, true)
    const onResponse = (params: CapturedRequest) => {
        noteRequest(session, params, false)
        const entry = networkEntry(params, false)
        if (entry) {
            session.network.push(entry)
        }
    }
    const onFetchError = (params: CapturedRequest) => {
        noteRequest(session, params, false)
        const entry = networkEntry(params, true)
        if (entry) {
            session.network.push(entry)
        }
    }
    if (logs) {
        browser.on('log.entryAdded', onLog)
    }
    browser.on('network.beforeRequestSent', onBefore)
    browser.on('network.responseCompleted', onResponse)
    browser.on('network.fetchError', onFetchError)
    session.disposers.push(() => {
        if (logs) {
            browser.off('log.entryAdded', onLog)
        }
        browser.off('network.beforeRequestSent', onBefore)
        browser.off('network.responseCompleted', onResponse)
        browser.off('network.fetchError', onFetchError)
    })
    log.debug(`Capturing logs and network for "${session.name}"`)
}
