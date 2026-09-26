import { vi, beforeEach, afterEach, onTestFinished, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { PassThrough } from 'node:stream'

import type { DisplayDaemon, DisplayDaemonOptions, DisplayServer } from '../src/types.js'
import type { DisplayServerManager } from '../src/DisplayServerManager.js'

/**
 * Minimal stand-in for a spawned child process. Backend tests drive its
 * lifecycle by emitting 'exit'/'error' and asserting on the spied `kill`.
 */
export class FakeProc extends EventEmitter {
    pid: number | undefined = 4242
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
    // Like Node: 'exit' records the code or signal, and 'close' follows once stdio has drained.
    emit(event: string | symbol, ...args: any[]): boolean {
        if (event === 'exit') {
            this.exitCode = args[0] ?? null
            this.signalCode = args[1] ?? null
            setImmediate(() => super.emit('close', ...args))
        }
        return super.emit(event, ...args)
    }
}

export const exitOnKill = (proc: FakeProc) => {
    proc.kill.mockImplementation((signal?: NodeJS.Signals) => {
        setImmediate(() => proc.emit('exit', null, signal ?? 'SIGTERM'))
        return true
    })
}

/** Makes the spawn mock return a fresh FakeProc, and `mockAccess` report the socket at once. */
export const arrangeSpawn = (mockSpawn: Mock, mockAccess?: Mock) => {
    const proc = new FakeProc()
    mockSpawn.mockReturnValue(proc)
    if (mockAccess) {
        mockAccess.mockResolvedValue(undefined)
    }
    return proc
}

export const arrangeDisplayFdSpawn = (mockSpawn: Mock, display: number | null = 99) => {
    const proc = new FakeProc()
    const fd3 = new PassThrough()
    proc.stdio = [null, null, null, fd3]
    mockSpawn.mockReturnValue(proc)
    if (display !== null) {
        setImmediate(() => fd3.write(`${display}\n`))
    }
    return proc
}

/** Removes orphaned process 'exit' listeners after each test. */
export const trackExitListeners = () => {
    let before: NodeJS.ExitListener[] = []
    beforeEach(() => {
        before = process.listeners('exit')
    })
    afterEach(() => {
        for (const listener of process.listeners('exit')) {
            if (!before.includes(listener)) {
                process.off('exit', listener)
            }
        }
    })
}

export const PM_NAME_TO_CMD: Record<string, string> = {
    apt: 'apt-get', dnf: 'dnf', zypper: 'zypper',
    pacman: 'pacman', apk: 'apk', xbps: 'xbps-install',
}

/** Makes the stat mock report only `commands` as installed. */
export const onPath = (mockStat: Mock, ...commands: string[]) => {
    mockStat.mockImplementation(async (file: string) => {
        if (commands.includes(path.basename(file))) {
            return { isFile: () => true, mode: 0o100755 }
        }
        throw Object.assign(new Error(`ENOENT: ${file}`), { code: 'ENOENT' })
    })
}

// Replaced rather than spied on, since process.getuid doesn't exist on Windows.
const realGetuid = process.getuid
export const runAsUser = (uid = 1000) => {
    process.getuid = () => uid
    onTestFinished(() => {
        process.getuid = realGetuid
    })
}
export const runAsRoot = () => runAsUser(0)

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
