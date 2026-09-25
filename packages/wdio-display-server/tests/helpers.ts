import { vi, type Mock } from 'vitest'
import { EventEmitter } from 'node:events'

import type { DisplayDaemon, DisplayServer } from '../src/types.js'
import type { DisplayServerManager } from '../src/DisplayServerManager.js'

/**
 * Minimal stand-in for a spawned child process. Backend tests drive its
 * lifecycle by emitting 'exit'/'error' and asserting on the spied `kill`.
 */
export class FakeProc extends EventEmitter {
    killed = false
    exitCode: number | null = null
    signalCode: NodeJS.Signals | null = null
    kill = vi.fn((_signal?: NodeJS.Signals) => {
        this.killed = true
        return true
    })
    removeListener = (event: string, listener: (...args: any[]) => void) => {
        super.removeListener(event, listener)
        return this
    }
}

export const createFakeProc = () => new FakeProc()

/**
 * Wire the spawn mock to return a fresh FakeProc. For the happy path, also make
 * the socket-poll `access` resolve immediately; non-happy tests omit `mockAccess`
 * and set their own access sequence inline.
 */
export const arrangeSpawn = (mockSpawn: Mock, mockAccess?: Mock) => {
    const proc = new FakeProc()
    mockSpawn.mockReturnValue(proc)
    if (mockAccess) {
        mockAccess.mockResolvedValue(undefined)
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
    getChromeFlags: () => [],
    startDaemon: async () => makeDaemonHandle(),
    ...overrides,
} as DisplayServer)

/**
 * Pass-through manager: `executeWithRetry` just runs the fn once. Specific
 * tests assert against a real retry policy via `makeRetryManager`.
 */
export const makeManager = (
    server: DisplayServer | null,
    { shouldRun = true }: { shouldRun?: boolean } = {},
): DisplayServerManager => ({
    shouldRun: () => shouldRun,
    init: vi.fn().mockResolvedValue(server !== null),
    getDisplayServer: () => server,
    injectDisplayFlags: vi.fn(),
    executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}) as unknown as DisplayServerManager

/**
 * Manager whose `executeWithRetry` runs the real 3-attempt loop, so tests can
 * assert the configured retry policy is honoured end-to-end.
 */
export const makeRetryManager = (server: DisplayServer): DisplayServerManager => ({
    shouldRun: () => true,
    init: vi.fn().mockResolvedValue(true),
    getDisplayServer: () => server,
    injectDisplayFlags: vi.fn(),
    executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => {
        let lastError: unknown
        for (let i = 0; i < 3; i++) {
            try {
                return await fn()
            } catch (err) {
                lastError = err
            }
        }
        throw lastError
    }),
}) as unknown as DisplayServerManager
