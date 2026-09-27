import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
    createState, ensureRuntimeDir, getArtifactsDir, getRuntimeDir, getSocketPath, isPidAlive,
    killOrphans, listStates, readState, removeStaleState, updateState
} from '../../src/daemon/state.js'

describe('state', () => {
    let tmp: string

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-state-'))
    })

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    describe('getRuntimeDir', () => {
        it('prefers WDIO_SESSION_DIR', () => {
            expect(getRuntimeDir({ env: { WDIO_SESSION_DIR: '/x/y' }, platform: 'linux' })).toBe(path.resolve('/x/y'))
        })

        it('uses XDG_RUNTIME_DIR on POSIX', () => {
            expect(getRuntimeDir({ env: { XDG_RUNTIME_DIR: '/run/user/1000' }, platform: 'linux' })).toBe('/run/user/1000/wdio-session')
        })

        it('falls back to a per-user tmp dir', () => {
            expect(getRuntimeDir({ env: {}, platform: 'darwin', uid: 501, tmpdir: '/tmp' })).toBe('/tmp/wdio-session-501')
        })

        it('uses LOCALAPPDATA on Windows', () => {
            expect(getRuntimeDir({ env: { LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local', XDG_RUNTIME_DIR: '/ignored' }, platform: 'win32' }))
                .toBe('C:\\Users\\me\\AppData\\Local\\wdio-session')
        })
    })

    it('getSocketPath uses a named pipe with a runtime dir hash on Windows', () => {
        expect(getSocketPath('/run/wdio', 'default', 'linux')).toBe('/run/wdio/default.sock')
        const pipe = getSocketPath('C:\\a', 'default', 'win32')
        expect(pipe).toMatch(/^\\\\\.\\pipe\\wdio-session-[0-9a-f]{8}-default$/)
        expect(getSocketPath('C:\\b', 'default', 'win32')).not.toBe(pipe)
    })

    it('getArtifactsDir honors WDIO_SESSION_ARTIFACTS', () => {
        expect(getArtifactsDir('a', '/repo', {})).toBe('/repo/.wdio/session/a')
        expect(getArtifactsDir('a', '/repo', { WDIO_SESSION_ARTIFACTS: 'out' })).toBe('/repo/out/a')
    })

    it.skipIf(process.platform === 'win32')('creates the runtime dir with mode 0700', () => {
        const dir = path.join(tmp, 'run')
        fs.mkdirSync(dir, { mode: 0o755 })
        ensureRuntimeDir(dir)
        expect(fs.statSync(dir).mode & 0o777).toBe(0o700)
    })

    it('createState is exclusive and writes mode 0600', () => {
        const base = { name: 'a', pid: null, status: 'starting' as const, cwd: tmp, artifactsDir: tmp, target: 'chrome', startedAt: new Date().toISOString() }
        createState(tmp, base)
        expect(() => createState(tmp, base)).toThrow(expect.objectContaining({ code: 'EEXIST' }))
        if (process.platform !== 'win32') {
            expect(fs.statSync(path.join(tmp, 'a.json')).mode & 0o777).toBe(0o600)
        }
        updateState(tmp, 'a', { status: 'ready', pid: 1234 })
        expect(readState(tmp, 'a')).toMatchObject({ version: 1, name: 'a', status: 'ready', pid: 1234 })
        expect(listStates(tmp).map((s) => s.name)).toEqual(['a'])
        expect(fs.readdirSync(tmp)).toEqual(['a.json'])
    })

    it('isPidAlive', () => {
        expect(isPidAlive(process.pid)).toBe(true)
        expect(isPidAlive(null)).toBe(false)
        expect(isPidAlive(2 ** 22 + 12345)).toBe(false)
    })

    it('removeStaleState kills the process group of a dead daemon only', () => {
        const kill = vi.spyOn(process, 'kill').mockImplementation(((pid: number, signal?: string | number) => {
            if (signal === 0 && pid === 111) {
                const err = new Error('ESRCH') as NodeJS.ErrnoException
                err.code = 'ESRCH'
                throw err
            }
            return true
        }) as typeof process.kill)

        fs.writeFileSync(path.join(tmp, 'dead.json'), '{}')
        removeStaleState(tmp, { name: 'dead', pid: 111 })
        expect(fs.existsSync(path.join(tmp, 'dead.json'))).toBe(false)
        if (process.platform !== 'win32') {
            expect(kill).toHaveBeenCalledWith(-111, 'SIGKILL')
        }

        kill.mockClear()
        killOrphans(222)
        expect(kill).not.toHaveBeenCalledWith(-222, 'SIGKILL')
        killOrphans(111, 'win32')
        expect(kill).not.toHaveBeenCalledWith(-111, 'SIGKILL')
    })
})
