import fs from 'node:fs'
import net from 'node:net'
import crypto from 'node:crypto'

import logger from '@wdio/logger'

import { MAX_QUEUE_LENGTH, PROTOCOL_VERSION } from '../constants.js'
import { SessionError } from '../errors.js'
import { actionTimeout } from '../actions/specs.js'
import type { ActionResult, Request, Response } from '../types.js'

const log = logger('@wdio/session:server')

export type RequestHandler = (req: Request) => Promise<ActionResult>

export interface SessionServerOptions {
    socketPath: string
    token?: string
    handler: RequestHandler
    /**
     * milliseconds without requests before `onIdle` is called, 0 disables
     */
    idleTimeout?: number
    onIdle?: () => void
    /**
     * called after every request, e.g. to persist `lastRequestAt`
     */
    onRequest?: (req: Request) => void
    /**
     * called when a request that ran past its timeout no longer holds the
     * queue, so whatever it still does can be kept from later requests
     */
    onAbandon?: (req: Request) => void
}

/**
 * How long a request that ran past its timeout may still hold the queue. A
 * page whose main thread is blocked can keep a browser command waiting for
 * minutes; the requests after it shouldn't wait with it.
 */
const ABANDONED_GRACE_MS = 5_000

interface QueueItem {
    req: Request
    resolve: (res: Response) => void
}

export class SessionServer {
    readonly token: string
    readonly socketPath: string
    #server?: net.Server
    #handler: RequestHandler
    #queue: QueueItem[] = []
    #running = false
    #idleTimeout: number
    #idleTimer?: NodeJS.Timeout
    #onIdle?: () => void
    #onRequest?: (req: Request) => void
    #onAbandon?: (req: Request) => void
    #closed = false
    #active = new Set<QueueItem>()
    #sockets = new Set<net.Socket>()

    constructor (opts: SessionServerOptions) {
        this.socketPath = opts.socketPath
        this.token = opts.token || crypto.randomBytes(32).toString('hex')
        this.#handler = opts.handler
        this.#idleTimeout = opts.idleTimeout ?? 0
        this.#onIdle = opts.onIdle
        this.#onRequest = opts.onRequest
        this.#onAbandon = opts.onAbandon
    }

    get busy () {
        return this.#active.size > 0 || this.#queue.length > 0
    }

    listen () {
        if (process.platform !== 'win32') {
            fs.rmSync(this.socketPath, { force: true })
        }
        return new Promise<void>((resolve, reject) => {
            const server = net.createServer((socket) => this.#onConnection(socket))
            server.once('error', reject)
            server.listen(this.socketPath, () => {
                if (process.platform !== 'win32') {
                    fs.chmodSync(this.socketPath, 0o600)
                }
                this.#server = server
                this.#resetIdle()
                resolve()
            })
        })
    }

    #onConnection (socket: net.Socket) {
        let buffer = ''
        this.#sockets.add(socket)
        socket.on('close', () => this.#sockets.delete(socket))
        socket.setEncoding('utf-8')
        socket.on('error', () => {})
        socket.on('data', (chunk: string) => {
            buffer += chunk
            const idx = buffer.indexOf('\n')
            if (idx < 0) {
                if (buffer.length > 16 * 1024 * 1024) {
                    socket.destroy()
                }
                return
            }
            const line = buffer.slice(0, idx)
            buffer = ''
            let req: Request
            try {
                req = JSON.parse(line)
            } catch {
                socket.destroy()
                return
            }
            if (!req || typeof req.token !== 'string' || !safeEqual(req.token, this.token)) {
                log.warn('Rejected request with invalid token')
                socket.end(JSON.stringify(errorResponse(req?.id, new SessionError('INTERNAL', 'Invalid session token.'))) + '\n')
                return
            }
            if (req.v !== PROTOCOL_VERSION) {
                socket.end(JSON.stringify(errorResponse(req.id, new SessionError(
                    'INTERNAL',
                    `Protocol version mismatch (client ${req.v}, daemon ${PROTOCOL_VERSION}).`,
                    { hint: 'Close the session and open it again after upgrading WebdriverIO.' }
                ))) + '\n')
                return
            }
            this.enqueue(req).then((res) => {
                if (!socket.destroyed) {
                    socket.end(JSON.stringify(res) + '\n')
                }
            })
        })
    }

    enqueue (req: Request): Promise<Response> {
        this.#resetIdle()
        if (this.#closed) {
            return Promise.resolve(errorResponse(req.id, new SessionError('SESSION_DIED', 'The session is shutting down.')))
        }
        // `close` must work while an action hangs or the queue is full, so it doesn't wait in line
        if (req.action === 'close' && this.#running) {
            return new Promise((resolve) => void this.#run({ req, resolve }))
        }
        if (this.#queue.length >= MAX_QUEUE_LENGTH) {
            return Promise.resolve(errorResponse(req.id, new SessionError('BUSY', `More than ${MAX_QUEUE_LENGTH} requests are queued for this session.`)))
        }
        return new Promise((resolve) => {
            this.#queue.push({ req, resolve })
            this.#next()
        })
    }

    async #next () {
        if (this.#running) {
            return
        }
        const item = this.#queue.shift()
        if (!item) {
            return
        }
        this.#running = true
        await this.#run(item)
        this.#running = false
        this.#resetIdle()
        this.#next()
    }

    async #run (item: QueueItem) {
        // a request counts as active until it is answered
        const active: QueueItem = {
            req: item.req,
            resolve: (res) => {
                this.#active.delete(active)
                item.resolve(res)
            }
        }
        this.#active.add(active)
        await this.#runItem(active)
    }

    async #runItem ({ req, resolve }: QueueItem) {
        const timeout = req.timeout || actionTimeout(req.action)
        let timer: NodeJS.Timeout | undefined
        const action = this.#handler(req)
        let timedOut = false
        try {
            const result = await Promise.race([
                action,
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => {
                        timedOut = true
                        reject(new SessionError(
                            'TIMEOUT',
                            `"${req.action}" did not finish within ${timeout}ms.`,
                            { hint: 'The session is still usable. Increase --timeout if the action needs longer.' }
                        ))
                    }, timeout)
                })
            ])
            resolve({ v: PROTOCOL_VERSION, id: req.id, ok: true, result })
        } catch (err) {
            resolve(errorResponse(req.id, SessionError.from(err)))
        } finally {
            clearTimeout(timer)
            if (timedOut) {
                // let it finish if it's about to, but don't hold the queue for it
                let grace: NodeJS.Timeout | undefined
                const settled = await Promise.race([
                    action.then(() => true, () => true),
                    new Promise<false>((done) => { grace = setTimeout(() => done(false), ABANDONED_GRACE_MS) })
                ])
                clearTimeout(grace)
                if (!settled) {
                    try {
                        this.#onAbandon?.(req)
                    } catch {
                        // ignore
                    }
                }
            }
            try {
                this.#onRequest?.(req)
            } catch {
                // ignore
            }
        }
    }

    #resetIdle () {
        clearTimeout(this.#idleTimer)
        if (this.#idleTimeout > 0 && this.#onIdle && !this.#closed) {
            this.#idleTimer = setTimeout(() => {
                if (this.#running || this.#queue.length) {
                    return this.#resetIdle()
                }
                this.#onIdle?.()
            }, this.#idleTimeout)
            this.#idleTimer.unref?.()
        }
    }

    /**
     * Reject queued requests and stop listening.
     */
    async close (reason = new SessionError('SESSION_DIED', 'The session was closed.')) {
        this.#closed = true
        clearTimeout(this.#idleTimer)
        for (const item of this.#queue.splice(0)) {
            item.resolve(errorResponse(item.req.id, reason))
        }
        // a request that hangs keeps its connection open, and the server would wait for it
        for (const item of this.#active) {
            item.resolve(errorResponse(item.req.id, reason))
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
        for (const socket of this.#sockets) {
            socket.destroy()
        }
        await new Promise<void>((resolve) => this.#server ? this.#server.close(() => resolve()) : resolve())
        if (process.platform !== 'win32') {
            fs.rmSync(this.socketPath, { force: true })
        }
    }
}

function safeEqual (a: string, b: string) {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

export function errorResponse (id: string | undefined, err: SessionError): Response {
    return { v: PROTOCOL_VERSION, id: id || '', ok: false, error: err.toJSON() }
}
