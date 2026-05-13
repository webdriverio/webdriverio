import { vi, describe, it, expect } from 'vitest'
import path from 'node:path'
import url from 'node:url'
import type { ChildProcess } from 'node:child_process'

import { DisplayProcessFactory } from '../src/DisplayProcessFactory.js'
import type { DisplayServer } from '../src/types.js'
import type { DisplayServerManager } from '../src/DisplayServerManager.js'

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

/**
 * Integration coverage: real DisplayProcessFactory + real fork() of a Node
 * child + real env propagation. Sits between the heavily-mocked unit tests
 * (which don't actually fork) and the Linux-only e2e suite (which requires
 * Weston/Xvfb to be installed in CI). A fake DisplayServer lets the same path
 * be exercised on every platform — so failures show up on every PR matrix
 * rather than only when the e2e job runs.
 */
describe('integration: DisplayProcessFactory ↔ real fork', () => {
    it('Wayland path: forks the worker and merges daemon env into the child', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const fakeServer: DisplayServer = {
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
            }),
        }
        const manager = {
            shouldRun: () => true,
            getDisplayServer: () => fakeServer,
            executeWithRetry: async (fn: () => Promise<unknown>) => fn(),
        } as unknown as DisplayServerManager

        const factory = new DisplayProcessFactory(manager)
        const child = await factory.createWorkerProcess(shimPath, [], {
            cwd: __dirname,
            env: { NODE_ENV: 'integration', PATH: process.env.PATH } as Record<string, string>,
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        })

        const stdout = await collectStdout(child)
        const env = JSON.parse(stdout.trim())
        expect(env.WAYLAND_DISPLAY).toBe('wayland-test')
        expect(env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')
        expect(env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
        expect(env.NODE_ENV).toBe('integration')

        // daemon.stop() must fire on child exit
        await new Promise((r) => setImmediate(r))
        expect(stopSpy).toHaveBeenCalledTimes(1)
    })

    it('regular fork path: child inherits the caller env, untouched', async () => {
        const manager = {
            shouldRun: () => false,
            getDisplayServer: () => null,
            executeWithRetry: async (fn: () => Promise<unknown>) => fn(),
        } as unknown as DisplayServerManager

        const factory = new DisplayProcessFactory(manager)
        const child = await factory.createWorkerProcess(shimPath, [], {
            cwd: __dirname,
            env: { NODE_ENV: 'plain-fork', PATH: process.env.PATH } as Record<string, string>,
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        })

        const stdout = await collectStdout(child)
        const env = JSON.parse(stdout.trim())
        expect(env.NODE_ENV).toBe('plain-fork')
        expect(env.WAYLAND_DISPLAY).toBeNull()
        expect(env.XDG_RUNTIME_DIR).toBeNull()
    })

    it('Wayland path: stops the daemon even if fork() throws synchronously', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const fakeServer: DisplayServer = {
            name: 'wayland',
            isAvailable: async () => true,
            install: async () => true,
            getEnvironment: () => ({}),
            getProcessWrapper: () => null,
            getChromeFlags: () => [],
            startDaemon: async () => ({
                env: { WAYLAND_DISPLAY: 'wayland-test' },
                stop: stopSpy,
            }),
        }
        const manager = {
            shouldRun: () => true,
            getDisplayServer: () => fakeServer,
            executeWithRetry: async (fn: () => Promise<unknown>) => fn(),
        } as unknown as DisplayServerManager

        const factory = new DisplayProcessFactory(manager)

        // Point at a script that doesn't exist; fork itself doesn't synchronously
        // throw for missing files (the child emits an exit code), so instead we
        // force the failure path by passing an invalid cwd which makes fork
        // throw synchronously.
        await expect(
            factory.createWorkerProcess('/nonexistent/script.js', [], {
                cwd: '\0invalid-cwd-with-null-byte',
                env: process.env as Record<string, string>,
                stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
            })
        ).rejects.toBeInstanceOf(Error)

        // Even though fork() blew up, daemon.stop() must have been invoked
        // to release the daemon we started before the fork attempt.
        await new Promise((r) => setImmediate(r))
        expect(stopSpy).toHaveBeenCalledTimes(1)
    })
})
