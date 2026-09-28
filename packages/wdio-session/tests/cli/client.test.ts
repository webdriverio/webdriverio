import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { getLiveState, send } from '../../src/cli/client.js'
import { SessionServer } from '../../src/daemon/server.js'
import { getSocketPath, writeState } from '../../src/daemon/state.js'
import type { StateFile } from '../../src/types.js'

const DEAD_PID = 2 ** 22 + 4321

describe('client', () => {
    let tmp: string

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-client-'))
    })

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true })
    })

    function state (patch: Partial<StateFile>): StateFile {
        const s: StateFile = {
            version: 1, name: 'default', pid: process.pid, status: 'ready', socket: getSocketPath(tmp, 'default'),
            token: 'a'.repeat(64), cwd: tmp, artifactsDir: tmp, target: 'chrome', startedAt: new Date().toISOString(), ...patch
        }
        writeState(tmp, s)
        return s
    }

    it('reports a missing session', () => {
        expect(() => getLiveState('default', tmp)).toThrow(expect.objectContaining({ code: 'SESSION_NOT_FOUND', message: 'Session "default" is not running.' }))
        expect(() => getLiveState('other', tmp)).toThrow(expect.objectContaining({ hint: 'Start it with `wdio session open <target> -s other`.' }))
    })

    it('removes state of a dead daemon', () => {
        state({ pid: DEAD_PID })
        expect(() => getLiveState('default', tmp)).toThrow(expect.objectContaining({ code: 'SESSION_NOT_FOUND', message: 'Session "default" is not running (stale state removed).' }))
        expect(fs.existsSync(path.join(tmp, 'default.json'))).toBe(false)
    })

    it('keeps the state of a session that is starting', () => {
        state({ status: 'starting' })
        expect(() => getLiveState('default', tmp)).toThrow(expect.objectContaining({ message: 'Session "default" is still starting.' }))
        expect(fs.existsSync(path.join(tmp, 'default.json'))).toBe(true)
    })

    it('treats a refused socket as stale', async () => {
        state({})
        await expect(send('default', 'info', {}, { runtimeDir: tmp })).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' })
        expect(fs.existsSync(path.join(tmp, 'default.json'))).toBe(false)
    })

    it('sends requests with the token and rethrows daemon errors', async () => {
        const s = state({})
        const server = new SessionServer({
            socketPath: s.socket!,
            token: s.token!,
            handler: async (req) => {
                if (req.action === 'fail') {
                    throw Object.assign(new Error('nope'), { code: 'MISSING_DEPENDENCY', package: 'x', install: ['npm i -D x'] })
                }
                return { text: `${req.action} ${JSON.stringify(req.args)}` }
            }
        })
        await server.listen()
        try {
            expect(await send('default', 'click', { target: 'e1' }, { runtimeDir: tmp })).toEqual({ text: 'click {"target":"e1"}' })
            await expect(send('default', 'fail', {}, { runtimeDir: tmp })).rejects.toMatchObject({ code: 'MISSING_DEPENDENCY', exitCode: 3, install: ['npm i -D x'] })
        } finally {
            await server.close()
        }
    })
})
