import { vi, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

import type { DisplayDaemon, DisplayDaemonOptions, DisplayServer } from '../src/types.js'
import type { DisplayServerManager } from '../src/DisplayServerManager.js'

/**
 * Minimal stand-in for a spawned child process. Backend tests drive its
 * lifecycle by emitting 'exit'/'error' and asserting on the spied `kill`.
 */
export class FakeProc extends EventEmitter {
    killed = false
    exitCode: number | null = null
    signalCode: NodeJS.Signals | null = null
    stdio: Array<PassThrough | null> = []
    stderr = new EventEmitter()
    kill = vi.fn((_signal?: NodeJS.Signals) => {
        this.killed = true
        return true
    })
    removeListener = (event: string, listener: (...args: any[]) => void) => {
        super.removeListener(event, listener)
        return this
    }
}

export const createFakeProc = ({ exited = false } = {}) => {
    const proc = new FakeProc()
    if (exited) {
        proc.exitCode = 1 // a failure path then skips the 2s SIGTERM wait
    }
    return proc
}

export const exitOnKill = (proc: FakeProc) => {
    proc.kill.mockImplementation((signal?: NodeJS.Signals) => {
        proc.signalCode = signal ?? 'SIGTERM'
        setImmediate(() => proc.emit('exit', null, proc.signalCode))
        return true
    })
}

/** Makes the spawn mock return a fresh FakeProc, and `mockAccess` report the socket at once. */
export const arrangeSpawn = (mockSpawn: Mock, mockAccess?: Mock, { exited = false } = {}) => {
    const proc = createFakeProc({ exited })
    mockSpawn.mockReturnValue(proc)
    if (mockAccess) {
        mockAccess.mockResolvedValue(undefined)
    }
    return proc
}

export const arrangeDisplayFdSpawn = (mockSpawn: Mock, display: number | null = 99, { exited = false } = {}) => {
    const proc = createFakeProc({ exited })
    const fd3 = new PassThrough()
    proc.stdio = [null, null, null, fd3]
    mockSpawn.mockReturnValue(proc)
    if (display !== null) {
        setImmediate(() => fd3.write(`${display}\n`))
    }
    return proc
}

// Queue execAsync rejections for the package managers probed before `pm`, then a
// resolution for `pm`, so install()'s detectPackageManager lands deterministically.
export const PM_PROBE_ORDER = ['apt-get', 'dnf', 'yum', 'zypper', 'pacman', 'apk', 'xbps-install']
export const PM_NAME_TO_CMD: Record<string, string> = {
    apt: 'apt-get', dnf: 'dnf', yum: 'yum', zypper: 'zypper',
    pacman: 'pacman', apk: 'apk', xbps: 'xbps-install',
}
export const queuePackageManagerDetection = (mockExecAsync: Mock, pm: string) => {
    if (pm === 'unknown') {
        for (let i = 0; i < PM_PROBE_ORDER.length; i++) {
            mockExecAsync.mockRejectedValueOnce(new Error('not found'))
        }
        return
    }
    const target = PM_NAME_TO_CMD[pm]
    const targetIdx = PM_PROBE_ORDER.indexOf(target)
    for (let i = 0; i < targetIdx; i++) {
        mockExecAsync.mockRejectedValueOnce(new Error('not found'))
    }
    mockExecAsync.mockResolvedValueOnce({ stdout: `/usr/bin/${target}`, stderr: '' })
}

export const runAsRoot = () => {
    (process as any).getuid = vi.fn().mockReturnValue(0)
}

export const runAsUser = (uid = 1000) => {
    (process as any).getuid = vi.fn().mockReturnValue(uid)
}

export const makeDaemonHandle = (overrides: Partial<DisplayDaemon> = {}): DisplayDaemon => ({
    env: {},
    stop: vi.fn().mockResolvedValue(undefined),
    stopSync: vi.fn(),
    ...overrides,
} as DisplayDaemon)

export const makeDisplayServer = (overrides: Partial<DisplayServer> = {}): DisplayServer => ({
    name: 'xvfb',
    isAvailable: async () => true,
    install: async () => true,
    startDaemon: async () => makeDaemonHandle(),
    ...overrides,
} as DisplayServer)

/** Mock manager whose startDaemon() starts `server`. */
export const makeManager = (server: DisplayServer): DisplayServerManager => ({
    startDaemon: vi.fn(async (options?: DisplayDaemonOptions) => server.startDaemon(options)),
}) as unknown as DisplayServerManager
