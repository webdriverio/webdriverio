import net from 'node:net'
import crypto from 'node:crypto'

import { PROTOCOL_VERSION } from '../constants.js'
import { SessionError } from '../errors.js'
import { getRuntimeDir, isPidAlive, readState, removeState } from '../daemon/state.js'
import type { ActionResult, Request, Response, StateFile } from '../types.js'

export interface SendOptions {
    runtimeDir?: string
    timeout?: number
    cwd?: string
}

/**
 * Find a live session. Removes stale state (dead daemon) and throws
 * `SESSION_NOT_FOUND` when there is no usable session.
 */
export function getLiveState (name: string, runtimeDir = getRuntimeDir()): StateFile {
    const state = readState(runtimeDir, name)
    if (!state) {
        throw new SessionError('SESSION_NOT_FOUND', `Session "${name}" is not running.`, {
            hint: `Start it with \`wdio session open <target>${name === 'default' ? '' : ` -s ${name}`}\`.`
        })
    }
    if (state.status === 'starting' && isPidAlive(state.pid)) {
        throw new SessionError('SESSION_NOT_FOUND', `Session "${name}" is still starting.`, { hint: 'Retry once `wdio session open` has returned.' })
    }
    if (state.status !== 'ready' || !isPidAlive(state.pid)) {
        removeState(runtimeDir, name)
        throw new SessionError('SESSION_NOT_FOUND', `Session "${name}" is not running (stale state removed).`, {
            hint: `Start it with \`wdio session open <target>${name === 'default' ? '' : ` -s ${name}`}\`.`
        })
    }
    return state
}

export function sendRaw (socketPath: string, payload: object, timeout: number): Promise<Response> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(socketPath)
        let buffer = ''
        let settled = false
        const done = (fn: () => void) => {
            if (settled) {
                return
            }
            settled = true
            clearTimeout(timer)
            socket.destroy()
            fn()
        }
        const timer = setTimeout(() => done(() => reject(new SessionError('TIMEOUT', `Request timed out after ${timeout}ms.`))), timeout)
        socket.setEncoding('utf-8')
        socket.on('connect', () => socket.write(JSON.stringify(payload) + '\n'))
        socket.on('data', (chunk: string) => {
            buffer += chunk
            const idx = buffer.indexOf('\n')
            if (idx >= 0) {
                const line = buffer.slice(0, idx)
                done(() => {
                    try {
                        resolve(JSON.parse(line))
                    } catch (err) {
                        reject(new SessionError('INTERNAL', `Invalid response from session daemon: ${(err as Error).message}`))
                    }
                })
            }
        })
        socket.on('error', (err) => done(() => reject(err)))
        socket.on('close', () => done(() => reject(new SessionError('SESSION_DIED', 'The session daemon closed the connection without a response.'))))
    })
}

export async function send (name: string, action: string, args: Record<string, unknown>, opts: SendOptions = {}): Promise<ActionResult> {
    const runtimeDir = opts.runtimeDir || getRuntimeDir()
    const state = getLiveState(name, runtimeDir)
    const timeout = opts.timeout ?? 30_000
    const request: Request = {
        v: PROTOCOL_VERSION,
        id: crypto.randomBytes(4).toString('hex'),
        token: state.token!,
        action,
        args,
        cwd: opts.cwd || process.cwd(),
        timeout
    }
    let response: Response
    try {
        /**
         * give the daemon a moment to report its own timeout first
         */
        response = await sendRaw(state.socket!, request, timeout + 5_000)
    } catch (err) {
        const code = (err as NodeJS.ErrnoException).code
        if (code === 'ECONNREFUSED' || code === 'ENOENT') {
            removeState(runtimeDir, name)
            throw new SessionError('SESSION_NOT_FOUND', `Session "${name}" is not running (stale state removed).`)
        }
        throw SessionError.from(err)
    }
    if (!response.ok) {
        throw SessionError.fromJSON(response.error)
    }
    return response.result
}
