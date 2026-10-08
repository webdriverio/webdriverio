import fs from 'node:fs'
import path from 'node:path'

import picomatch from 'picomatch'

import { SessionError, usage } from '../errors.js'
import { quote } from '../quote.js'
import { pollLogs } from '../daemon/capture.js'
import { formatLog, formatRequest, formatTime, parseDuration, type RingBuffer } from '../daemon/events.js'
import type { ActionFn, ActionOutcome } from '../session.js'

const DEFAULT_LIMIT = 50

const SOURCE_GROUPS: Record<string, string[]> = {
    browser: ['console', 'page'],
    driver: ['driver'],
    logcat: ['logcat'],
    syslog: ['syslog'],
    main: ['main']
}

interface StoredMock {
    id: string
    pattern: string
    mock: WebdriverIO.Mock
}

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

function since (value: unknown) {
    if (value === undefined) {
        return undefined
    }
    try {
        const duration = parseDuration(String(value))
        return duration === undefined ? undefined : Date.now() - duration
    } catch (err) {
        throw usage((err as Error).message)
    }
}

function take<T extends { seq: number, time: number }>(buffer: RingBuffer<T>, opts: { peek?: unknown, since?: unknown, [key: string]: unknown }, pred: (entry: T) => boolean) {
    const after = since(opts.since)
    const entries = buffer.unread().filter((entry) => (after === undefined || entry.time >= after) && pred(entry))
    if (!opts.peek) {
        buffer.advance()
    }
    return entries
}

export function requestMatches (url: string, filter: string) {
    if (/[*?]/.test(filter)) {
        // URLs use `/` on every platform. picomatch otherwise treats `\` as a separator on Windows.
        // `contains` keeps a path glob such as `api/*` matching inside the full URL.
        return picomatch.isMatch(url, filter, { windows: false, contains: true })
    }
    return url.includes(filter)
}

export const logs: ActionFn = async (session, args) => {
    await pollLogs(session, typeof args.source === 'string' ? args.source : undefined)
    if (args.network) {
        const entries = take(session.network, args, (entry) => !args.errors || entry.failed)
        const text = entries.length
            ? entries.map((entry) => `${formatTime(entry.time)} ${(entry.failed ? 'error' : 'info').padEnd(5)} network  ${formatRequest(entry)}`).join('\n')
            : 'No log entries.'
        return { text, data: { entries } }
    }
    const group = typeof args.source === 'string' ? SOURCE_GROUPS[args.source] : undefined
    const entries = take(session.logs, args, (entry) => {
        if (args.errors && entry.level !== 'error') {
            return false
        }
        if (group && !group.includes(entry.source)) {
            return false
        }
        return true
    })
    return {
        text: entries.length ? entries.map(formatLog).join('\n') : 'No log entries.',
        data: { entries }
    }
}

export const requests: ActionFn = async (session, args) => {
    session.requireBidi('Request capture')
    const after = since(args.since)
    const filter = typeof args.filter === 'string' ? args.filter : undefined
    const limit = typeof args.limit === 'number' ? args.limit : DEFAULT_LIMIT
    const matched = session.network.all().filter((entry) => {
        if (args.failed && !entry.failed) {
            return false
        }
        if (after !== undefined && entry.time < after) {
            return false
        }
        if (filter && !requestMatches(entry.url, filter)) {
            return false
        }
        return true
    })
    const entries = matched.slice(-limit)
    const hidden = matched.length - entries.length
    const lines = entries.map(formatRequest)
    if (hidden > 0) {
        lines.unshift(`… ${hidden} earlier`)
    }
    return {
        text: lines.length ? lines.join('\n') : 'No requests.',
        data: { requests: entries, total: matched.length }
    }
}

function mocks (session: { get: <T>(k: string) => T | undefined, set: (k: string, v: unknown) => void }) {
    let map = session.get<Map<string, StoredMock>>('mocks')
    if (!map) {
        map = new Map()
        session.set('mocks', map)
    }
    return map
}

function headerList (value: unknown) {
    return [value].flat().filter((item): item is string => typeof item === 'string' && item !== '')
}

/**
 * `--body` is JSON text, a plain string, or a path to a file.
 */
export function mockBody (raw: string, cwd: string): { body: unknown, fromFile: boolean } {
    const file = path.resolve(cwd, raw)
    if (!raw.startsWith('{') && !raw.startsWith('[') && !raw.includes('\n') && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const text = fs.readFileSync(file, 'utf-8')
        try {
            return { body: JSON.parse(text), fromFile: true }
        } catch {
            return { body: text, fromFile: true }
        }
    }
    try {
        return { body: JSON.parse(raw), fromFile: false }
    } catch {
        return { body: raw, fromFile: false }
    }
}

function bodyLiteral (body: unknown) {
    return typeof body === 'string' ? quote(body) : JSON.stringify(body)
}

export const mock: ActionFn = async (session, args) => {
    session.requireBidi('Mocking')
    const pattern = String(args.pattern ?? '')
    if (!pattern) {
        throw usage('Pass a URL pattern.', `Example: ${session.cmd('mock', { pattern: '**/api/user', body: '{"name":"Mocked"}' }, 'wdio session mock "**/api/user" --body \'{"name":"Mocked"}\'')}`)
    }
    if (args.abort && (args.body !== undefined || args.status !== undefined)) {
        throw usage('Use either --abort or a response (--body, --status).')
    }
    const method = typeof args.method === 'string' ? args.method.toUpperCase() : undefined
    const headers: Record<string, string> = {}
    for (const header of headerList(args.header)) {
        const split = header.indexOf(':')
        if (split <= 0) {
            throw usage(`Header ${JSON.stringify(header)} is not k:v.`)
        }
        headers[header.slice(0, split).trim()] = header.slice(split + 1).trim()
    }
    const map = mocks(session)
    for (const [id, stored] of map) {
        if (stored.pattern === pattern) {
            await stored.mock.restore()
            map.delete(id)
        }
    }
    const created = await session.browser.mock(pattern, method ? { method } : undefined)
    const id = `m${(session.get<number>('mockCounter') || 0) + 1}`
    session.set('mockCounter', (session.get<number>('mockCounter') || 0) + 1)
    map.set(id, { id, pattern, mock: created })

    const once = Boolean(args.once)
    const lines = [`const ${id} = await browser.mock(${quote(pattern)}${method ? `, { method: '${method}' }` : ''})`]
    if (args.abort) {
        created[once ? 'abortOnce' : 'abort']()
        lines.push(`${id}.${once ? 'abortOnce' : 'abort'}()`)
    } else if (args.body !== undefined || args.status !== undefined || headerList(args.header).length) {
        const parsed = args.body === undefined ? undefined : mockBody(String(args.body), String(args.$cwd || session.cwd))
        const status = typeof args.status === 'number' ? args.status : (parsed ? 200 : undefined)
        const params = {
            ...(status !== undefined ? { statusCode: status } : {}),
            ...(Object.keys(headers).length ? { headers } : {})
        }
        const payload = parsed ? parsed.body : ''
        created[once ? 'respondOnce' : 'respond'](payload as string, params)
        const options = [
            ...(status !== undefined ? [`statusCode: ${status}`] : []),
            ...(Object.keys(headers).length ? [`headers: ${JSON.stringify(headers)}`] : [])
        ]
        lines.push(`${id}.${once ? 'respondOnce' : 'respond'}(${bodyLiteral(payload)}${options.length ? `, { ${options.join(', ')} }` : ''})`)
    }
    return {
        ...done(`Mocked ${pattern} (id ${id})`, lines.join('\n')),
        data: { id, pattern, mocks: [...map.values()].map(({ id: mockId, pattern: mockPattern }) => ({ id: mockId, pattern: mockPattern })) }
    }
}

export const unmock: ActionFn = async (session, args) => {
    session.requireBidi('Mocking')
    const map = mocks(session)
    if (args.all || args.pattern === undefined) {
        if (!args.all) {
            throw usage('Pass a pattern, a mock id, or --all.')
        }
        await session.browser.mockRestoreAll()
        const count = map.size
        map.clear()
        return done(count ? `Removed ${count} mock${count === 1 ? '' : 's'}` : 'No mocks', 'await browser.mockRestoreAll()')
    }
    const target = String(args.pattern)
    const stored = map.get(target) || [...map.values()].find((item) => item.pattern === target)
    if (!stored) {
        throw new SessionError('NO_MATCH', `No mock ${JSON.stringify(target)}.`, {
            hint: `Run \`${session.cmd('requests', undefined, 'wdio session requests')}\` and \`${session.cmd('mock', undefined, 'wdio session mock')}\` to see the active mocks, or pass --all.`
        })
    }
    await stored.mock.restore()
    map.delete(stored.id)
    return done(`Removed ${stored.id} (${stored.pattern})`, `await ${stored.id}.restore()`)
}
