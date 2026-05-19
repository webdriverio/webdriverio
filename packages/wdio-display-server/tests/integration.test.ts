import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fork } from 'node:child_process'
import path from 'node:path'
import url from 'node:url'
import type { ChildProcess } from 'node:child_process'

import type { DisplayServer } from '../src/types.js'
import type { DisplayServerManager } from '../src/DisplayServerManager.js'
import { startDisplayDaemonFromConfig } from '../src/daemon.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const shimPath = path.join(__dirname, 'fixtures', 'env-echo.mjs')

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
    })),
}))

const collectStdout = (proc: ChildProcess): Promise<string> => new Promise((resolve, reject) => {
    let out = ''
    if (!proc.stdout) {
        reject(new Error('child has no stdout — integration test misconfigured'))
        return
    }
    proc.stdout.setEncoding('utf8')
    proc.stdout.on('data', (chunk: string) => { out += chunk })
    proc.on('error', reject)
    proc.on('exit', () => resolve(out))
})

const makeManager = (server: DisplayServer | null, shouldRun = true) => ({
    shouldRun: () => shouldRun,
    init: vi.fn().mockResolvedValue(server !== null),
    getDisplayServer: () => server,
    injectDisplayFlags: vi.fn(),
}) as unknown as DisplayServerManager

const fakeWaylandServer = (stopSpy = vi.fn().mockResolvedValue(undefined)): DisplayServer => ({
    name: 'wayland',
    isAvailable: async () => true,
    install: async () => true,
    getEnvironment: () => ({}),
    getProcessWrapper: () => null,
    getChromeFlags: () => [],
    startDaemon: async () => ({
        env: {
            WAYLAND_DISPLAY: 'wayland-test',
            XDG_RUNTIME_DIR: '/tmp/wdio-test-runtime',
            ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
        },
        stop: stopSpy,
        stopSync: vi.fn(),
    }),
})

const fakeXvfbServer = (stopSpy = vi.fn().mockResolvedValue(undefined)): DisplayServer => ({
    name: 'xvfb',
    isAvailable: async () => true,
    install: async () => true,
    getEnvironment: () => ({}),
    getProcessWrapper: () => null,
    getChromeFlags: () => [],
    startDaemon: async () => ({
        env: { DISPLAY: ':99' },
        stop: stopSpy,
        stopSync: vi.fn(),
    }),
})

/**
 * Integration coverage: real {@link startDisplayDaemonFromConfig} + real
 * fork() of a Node child + real env propagation. Sits between the
 * heavily-mocked unit tests (which don't actually fork) and the Linux-only
 * e2e suite (which requires Weston/Xvfb to be installed in CI). A fake
 * DisplayServer lets the same path be exercised on every platform.
 *
 * The invariant this test locks down is the whole point of the redesign:
 * after startDisplayDaemonFromConfig() returns, process.env carries the
 * display vars, and any subsequently-forked child inherits them. This is
 * what makes a service's onPrepare-spawned driver (e.g. tauri-driver) work.
 */
describe('integration: startDisplayDaemonFromConfig ↔ real fork', () => {
    let savedEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        savedEnv = { ...process.env }
        delete process.env.DISPLAY
        delete process.env.WAYLAND_DISPLAY
        delete process.env.XDG_RUNTIME_DIR
        delete process.env.ELECTRON_OZONE_PLATFORM_HINT
    })

    afterEach(() => {
        process.env = savedEnv
    })

    it('publishes Wayland env to process.env and a real fork()ed child inherits it', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const manager = makeManager(fakeWaylandServer(stopSpy))

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(daemon).not.toBeNull()
        expect(process.env.WAYLAND_DISPLAY).toBe('wayland-test')
        expect(process.env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')

        // Real fork — child inherits process.env transitively
        const child = fork(shimPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
        const stdout = await collectStdout(child)
        const env = JSON.parse(stdout.trim())
        expect(env.WAYLAND_DISPLAY).toBe('wayland-test')
        expect(env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')
        expect(env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')

        // stop() reverses both the daemon and the env mutation
        await daemon!.stop()
        expect(stopSpy).toHaveBeenCalledTimes(1)
        expect(process.env.WAYLAND_DISPLAY).toBeUndefined()
        expect(process.env.XDG_RUNTIME_DIR).toBeUndefined()
        expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBeUndefined()
    })

    it('publishes Xvfb DISPLAY to process.env and a real fork()ed child inherits it', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const manager = makeManager(fakeXvfbServer(stopSpy))

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(daemon).not.toBeNull()
        expect(process.env.DISPLAY).toBe(':99')

        const child = fork(shimPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
        const stdout = await collectStdout(child)
        const env = JSON.parse(stdout.trim())
        expect(env.DISPLAY).toBe(':99')

        await daemon!.stop()
        expect(stopSpy).toHaveBeenCalledTimes(1)
        expect(process.env.DISPLAY).toBeUndefined()
    })

    it('returns null when DISPLAY is already set (someone wrapped us with xvfb-run)', async () => {
        process.env.DISPLAY = ':42'
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const manager = makeManager(fakeWaylandServer(stopSpy))

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(daemon).toBeNull()
        // Original DISPLAY untouched
        expect(process.env.DISPLAY).toBe(':42')
        // No daemon spun up → nothing to stop
        expect(stopSpy).not.toHaveBeenCalled()
    })

    it('returns null when manager.shouldRun() returns false (non-Linux, disabled, etc.)', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const manager = makeManager(fakeWaylandServer(stopSpy), /* shouldRun */ false)

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(daemon).toBeNull()
        expect(process.env.WAYLAND_DISPLAY).toBeUndefined()
        expect(stopSpy).not.toHaveBeenCalled()
    })

    it('registers an exit listener that uses stopSync, not the abandonable async stop', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const stopSyncSpy = vi.fn()
        const server: DisplayServer = {
            name: 'xvfb',
            isAvailable: async () => true,
            install: async () => true,
            getEnvironment: () => ({}),
            getProcessWrapper: () => null,
            getChromeFlags: () => [],
            startDaemon: async () => ({
                env: { DISPLAY: ':99' },
                stop: stopSpy,
                stopSync: stopSyncSpy,
            }),
        }
        const manager = makeManager(server)

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(daemon).not.toBeNull()
        expect(process.env.DISPLAY).toBe(':99')

        // Fire the exit listener directly. Node's docs say async work scheduled
        // here is abandoned, so the daemon's cleanup must be synchronous.
        process.emit('exit', 0)

        expect(stopSyncSpy).toHaveBeenCalledTimes(1)
        // Async path was NOT used — important because `void daemon.stop()` in
        // an exit listener would leave the daemon process running.
        expect(stopSpy).not.toHaveBeenCalled()
        expect(process.env.DISPLAY).toBeUndefined()
    })

    it('restores any prior process.env value the daemon overwrote, rather than deleting it', async () => {
        // Simulate the daemon mutating a key that already had a value (rare but
        // possible if user sets a partial env before init for some reason).
        process.env.NODE_ENV = 'preserved'
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        // Server whose env includes a key that's already in process.env
        const server: DisplayServer = {
            ...fakeXvfbServer(stopSpy),
            startDaemon: async () => ({
                env: { DISPLAY: ':99', NODE_ENV: 'daemon-set' },
                stop: stopSpy,
                stopSync: vi.fn(),
            }),
        }
        const manager = makeManager(server)

        const daemon = await startDisplayDaemonFromConfig(
            {} as WebdriverIO.Config,
            [] as never,
            manager,
        )
        expect(process.env.NODE_ENV).toBe('daemon-set')

        await daemon!.stop()
        expect(process.env.NODE_ENV).toBe('preserved')
        expect(process.env.DISPLAY).toBeUndefined()
    })
})
