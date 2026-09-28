import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { consoleLevel, consoleText, ingestElectronLogs, networkEntry, parseServiceLogLine, remoteValueText, responseStats } from '../../src/daemon/capture.js'
import { RingBuffer } from '../../src/daemon/events.js'
import type { Session } from '../../src/session.js'
import { requestMatches, mockBody } from '../../src/actions/network.js'

describe('console text', () => {
    it('prefers the entry text and otherwise joins remote values', () => {
        expect(consoleText({ text: 'boom', args: [{ type: 'string', value: 'other' }] })).toBe('boom')
        expect(consoleText({
            args: [
                { type: 'string', value: 'hello' },
                { type: 'number', value: 2 },
                { type: 'null' },
                { type: 'array', value: [{ type: 'string', value: 'a' }] }
            ]
        })).toBe('hello 2 null a')
        expect(remoteValueText({ type: 'error', value: { message: 'kaboom' } })).toBe('kaboom')
    })

    it('maps console methods onto levels', () => {
        expect(consoleLevel('error', 'info')).toBe('error')
        expect(consoleLevel('warn', 'info')).toBe('warn')
        expect(consoleLevel('debug', 'info')).toBe('debug')
        expect(consoleLevel('log', 'info')).toBe('info')
    })
})

describe('network entries', () => {
    it('derives duration and size from BiDi timings', () => {
        expect(responseStats({ requestTime: 10, responseEnd: 44 }, { bodySize: null, bytesReceived: 1200 })).toEqual({ durationMs: 34, size: 1200 })
        expect(responseStats({ requestTime: 10, responseEnd: 0 }, { bodySize: 4 })).toEqual({ durationMs: undefined, size: 4 })
    })

    it('records completed and failed requests', () => {
        expect(networkEntry({
            timestamp: 5,
            request: { method: 'GET', url: 'http://localhost/api/user', timings: { requestTime: 1, responseEnd: 3 } },
            response: { status: 200, bodySize: 12 }
        }, false)).toMatchObject({ method: 'GET', url: 'http://localhost/api/user', status: 200, failed: false, size: 12 })
        expect(networkEntry({ request: { method: 'GET', url: 'http://127.0.0.1:9/x' }, errorText: 'refused' }, true))
            .toMatchObject({ failed: true, status: undefined, errorText: 'refused' })
        expect(networkEntry({}, false)).toBeUndefined()
    })
})

describe('service log lines', () => {
    it('reads Electron main-process lines', () => {
        expect(parseServiceLogLine('2026-09-27T04:00:00.000Z INFO electron-service:service: [Electron:MainProcess] main ready')).toEqual({
            time: Date.parse('2026-09-27T04:00:00.000Z'),
            level: 'info',
            source: 'main',
            text: 'main ready'
        })
        expect(parseServiceLogLine('2026-09-27T04:00:00.000Z INFO electron-service:service: [Electron:Renderer:1] hi')).toMatchObject({ source: 'console', text: 'hi' })
        expect(parseServiceLogLine('not a log line')).toBeUndefined()
    })
})

describe('requestMatches', () => {
    it('matches substrings and globs', () => {
        expect(requestMatches('http://localhost/api/user', '/api/user')).toBe(true)
        expect(requestMatches('http://localhost/api/user', '**/api/user')).toBe(true)
        expect(requestMatches('http://localhost/api/user', 'api/*')).toBe(true)
        expect(requestMatches('http://localhost/other', '**/api/user')).toBe(false)
        expect(requestMatches('http://localhost/other', 'api/*')).toBe(false)
    })
})

describe('mockBody', () => {
    it('parses JSON text', () => {
        expect(mockBody('{"name":"Mocked"}', '/tmp')).toEqual({ body: { name: 'Mocked' }, fromFile: false })
        expect(mockBody('plain', '/tmp')).toEqual({ body: 'plain', fromFile: false })
    })
})

describe('RingBuffer', () => {
    it('returns unread entries and advances the cursor', () => {
        const buffer = new RingBuffer<{ seq: number, text: string }>(2)
        buffer.push({ text: 'a' })
        buffer.push({ text: 'b' })
        buffer.push({ text: 'c' })
        expect(buffer.all().map((e) => e.text)).toEqual(['b', 'c'])
        expect(buffer.unread().map((e) => e.text)).toEqual(['b', 'c'])
        buffer.advance()
        expect(buffer.unread()).toEqual([])
        buffer.push({ text: 'd' })
        expect(buffer.unread().map((e) => e.text)).toEqual(['d'])
    })
})

describe('ingestElectronLogs', () => {
    it('reads only the tail of a large unread log', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-electron-log-'))
        try {
            const file = path.join(dir, 'main.log')
            const head = '2026-01-01T00:00:00.000Z INFO electron-service:service: [Electron:MainProcess] HEAD_ONLY\n'
            const tail = '2026-01-01T00:00:01.000Z INFO electron-service:service: [Electron:MainProcess] TAIL_ONLY\n'
            fs.writeFileSync(file, head + 'x'.repeat(300 * 1024) + '\n' + tail)
            const logs = new RingBuffer<{ seq: number, text: string }>()
            const store = new Map<string, unknown>()
            const session = {
                plan: { electron: { logDir: dir } },
                logs,
                get: (key: string) => store.get(key),
                set: (key: string, value: unknown) => store.set(key, value)
            } as unknown as Session
            ingestElectronLogs(session)
            const texts = logs.all().map((entry) => entry.text)
            expect(texts).toContain('TAIL_ONLY')
            expect(texts).not.toContain('HEAD_ONLY')
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
})
