import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { SessionServer, type RequestHandler, type SessionServerOptions } from '../../src/daemon/server.js'
import { sendRaw } from '../../src/cli/client.js'
import { MAX_QUEUE_LENGTH, PROTOCOL_VERSION } from '../../src/constants.js'
import { getSocketPath } from '../../src/daemon/state.js'
import type { Request } from '../../src/types.js'

function request (token: string, action = 'info', extra: Partial<Request> = {}): Request {
    return { v: PROTOCOL_VERSION, id: Math.random().toString(16).slice(2), token, action, args: {}, cwd: '/', timeout: 1000, ...extra }
}

describe('SessionServer', () => {
    let tmp: string
    let server: SessionServer | undefined

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-server-'))
    })

    afterEach(async () => {
        await server?.close()
        server = undefined
        fs.rmSync(tmp, { recursive: true, force: true })
    })

    async function start (handler: RequestHandler, opts: Partial<SessionServerOptions> = {}) {
        server = new SessionServer({ socketPath: getSocketPath(tmp, `s${Math.random().toString(16).slice(2, 8)}`), handler, ...opts })
        await server.listen()
        return server
    }

    it('answers authenticated requests and sets socket mode 0600', async () => {
        const s = await start(async (req) => ({ text: `hello ${req.action}` }))
        if (process.platform !== 'win32') {
            expect(fs.statSync(s.socketPath).mode & 0o777).toBe(0o600)
        }
        const res = await sendRaw(s.socketPath, request(s.token), 2000)
        expect(res).toMatchObject({ ok: true, result: { text: 'hello info' } })
    })

    it('rejects a wrong token without calling the handler', async () => {
        let called = false
        const s = await start(async () => {
            called = true
            return {}
        })
        const res = await sendRaw(s.socketPath, request('0'.repeat(64)), 2000)
        expect(res).toMatchObject({ ok: false, error: { code: 'INTERNAL', message: 'Invalid session token.' } })
        const short = await sendRaw(s.socketPath, request('abc'), 2000)
        expect(short.ok).toBe(false)
        expect(called).toBe(false)
    })

    it('rejects other protocol versions with a hint', async () => {
        const s = await start(async () => ({}))
        const res = await sendRaw(s.socketPath, request(s.token, 'info', { v: 99 as 1 }), 2000)
        expect(res).toMatchObject({ ok: false, error: { code: 'INTERNAL', hint: expect.stringContaining('open it again') } })
    })

    it('runs requests one at a time in order and reports BUSY above the queue limit', async () => {
        const order: string[] = []
        let release!: () => void
        const gate = new Promise<void>((r) => (release = r))
        const s = await start(async (req) => {
            order.push(`start ${req.id}`)
            if (req.id === 'first') {
                await gate
            }
            order.push(`end ${req.id}`)
            return { text: req.id }
        })
        const first = s.enqueue(request(s.token, 'info', { id: 'first' }))
        const queued = Array.from({ length: MAX_QUEUE_LENGTH }, (_, i) => s.enqueue(request(s.token, 'info', { id: `q${i}` })))
        expect(s.busy).toBe(true)
        const busy = await s.enqueue(request(s.token, 'info', { id: 'overflow' }))
        expect(busy).toMatchObject({ ok: false, error: { code: 'BUSY' } })

        release()
        await Promise.all([first, ...queued])
        expect(order.slice(0, 3)).toEqual(['start first', 'end first', 'start q0'])
        expect(order.filter((o) => o.startsWith('start')).length).toBe(MAX_QUEUE_LENGTH + 1)
        expect(s.busy).toBe(false)
    })

    it('times out a slow request and keeps serving', async () => {
        const order: string[] = []
        const s = await start(async (req) => {
            order.push(`start ${req.action}`)
            if (req.action === 'slow') {
                await new Promise((r) => setTimeout(r, 80))
            }
            order.push(`end ${req.action}`)
            return { text: req.action }
        })
        const slow = s.enqueue(request(s.token, 'slow', { timeout: 20 }))
        await new Promise((r) => setTimeout(r, 5))
        const fast = s.enqueue(request(s.token, 'fast'))
        expect(await slow).toMatchObject({ ok: false, error: { code: 'TIMEOUT', hint: expect.stringContaining('The page may be hung') } })
        expect(await fast).toMatchObject({ ok: true, result: { text: 'fast' } })
        expect(order).toEqual(['start slow', 'end slow', 'start fast', 'end fast'])
    })

    it('moves on from a request that never finishes', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const abandoned: string[] = []
        try {
            const s = await start(async (req) => {
                if (req.action === 'hang') {
                    await new Promise(() => {})
                }
                return { text: req.action }
            }, { onAbandon: (req) => abandoned.push(req.action) })
            const hang = s.enqueue(request(s.token, 'hang', { timeout: 20 }))
            const next = s.enqueue(request(s.token, 'next'))
            await vi.advanceTimersByTimeAsync(20)
            expect(await hang).toMatchObject({ ok: false, error: { code: 'TIMEOUT' } })
            expect(abandoned).toEqual([])
            // the hung request may hold the queue for a short grace period only
            await vi.advanceTimersByTimeAsync(5_000)
            expect(await next).toMatchObject({ ok: true, result: { text: 'next' } })
            expect(abandoned).toEqual(['hang'])
        } finally {
            vi.useRealTimers()
        }
    })

    it('runs close while another request is still running', async () => {
        let release: () => void = () => {}
        const s = await start(async (req) => {
            if (req.action === 'busy') {
                await new Promise<void>((r) => { release = r })
            }
            return { text: req.action }
        })
        const busy = s.enqueue(request(s.token, 'busy', { timeout: 60_000 }))
        await new Promise((r) => setTimeout(r, 5))
        expect(await s.enqueue(request(s.token, 'close'))).toMatchObject({ ok: true, result: { text: 'close' } })
        release()
        expect(await busy).toMatchObject({ ok: true })
    })

    it('takes close with a full queue, and answers the hung request when it closes', async () => {
        const s = await start(async (req) => {
            if (req.action === 'hang') {
                await new Promise(() => {})
            }
            return { text: req.action }
        })
        const hang = s.enqueue(request(s.token, 'hang', { timeout: 60_000 }))
        await new Promise((r) => setTimeout(r, 5))
        const queued = Array.from({ length: MAX_QUEUE_LENGTH }, () => s.enqueue(request(s.token, 'info')))
        expect(await s.enqueue(request(s.token, 'info'))).toMatchObject({ ok: false, error: { code: 'BUSY' } })
        expect(await s.enqueue(request(s.token, 'close'))).toMatchObject({ ok: true, result: { text: 'close' } })
        await s.close()
        server = undefined
        expect(await hang).toMatchObject({ ok: false, error: { code: 'SESSION_DIED' } })
        for (const res of await Promise.all(queued)) {
            expect(res).toMatchObject({ ok: false, error: { code: 'SESSION_DIED' } })
        }
    })

    it('maps handler errors to error responses', async () => {
        const s = await start(async () => {
            throw new Error('boom')
        })
        expect(await s.enqueue(request(s.token))).toMatchObject({ ok: false, error: { code: 'INTERNAL', message: 'boom' } })
    })

    it('calls onIdle after the idle timeout and resets it on requests', async () => {
        let idle = 0
        const s = await start(async () => ({}), { idleTimeout: 150, onIdle: () => idle++ })
        await new Promise((r) => setTimeout(r, 100))
        await s.enqueue(request(s.token))
        await new Promise((r) => setTimeout(r, 100))
        expect(idle).toBe(0)
        await new Promise((r) => setTimeout(r, 150))
        expect(idle).toBe(1)
    })

    it('close rejects queued requests and removes the socket', async () => {
        let release!: () => void
        const s = await start(() => new Promise((r) => (release = () => r({}))))
        const running = s.enqueue(request(s.token))
        const queued = s.enqueue(request(s.token))
        await s.close()
        expect(await queued).toMatchObject({ ok: false, error: { code: 'SESSION_DIED' } })
        release()
        await running
        if (process.platform !== 'win32') {
            expect(fs.existsSync(s.socketPath)).toBe(false)
        }
        expect(await s.enqueue(request(s.token))).toMatchObject({ ok: false, error: { code: 'SESSION_DIED' } })
        server = undefined
    })
})
