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
 * Wire the spawn mock to return a fresh FakeProc, and (for the common happy
 * path) make the socket-poll `access` resolve immediately. Non-happy tests call
 * this without `mockAccess` and set their own access sequence inline.
 */
export const arrangeSpawn = (mockSpawn: Mock, mockAccess?: Mock) => {
    const proc = new FakeProc()
    mockSpawn.mockReturnValue(proc)
    if (mockAccess) {
        mockAccess.mockResolvedValue(undefined)
    }
    return proc
}

// `detectPackageManager` (used by installViaPackageManager) probes
// `which apt-get`, `which dnf`, ... via execAsync. This helper queues
// rejections for the package managers checked before the target, then a
// resolution for the target. Tests using install() can call this to put the
// detection in a deterministic state.
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
    // Pass-through by default; specific tests override to assert retry policy
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
