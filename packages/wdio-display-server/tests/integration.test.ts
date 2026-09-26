import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fork } from 'node:child_process'
import path from 'node:path'
import url from 'node:url'
import type { ChildProcess } from 'node:child_process'

import { startDisplayDaemonFromConfig } from '../src/daemon.js'
import { sessionEnv } from '../src/sessionEnv.js'
import { makeDaemonHandle, makeDisplayServer, makeManager } from './helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const shimPath = path.join(__dirname, 'fixtures', 'env-echo.mjs')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
 * Checks that `fork()`ed children inherit the daemon's env. A fake DisplayServer
 * lets it run on every platform.
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
        const manager = makeManager(makeDisplayServer({
            name: 'wayland',
            startDaemon: async () => makeDaemonHandle({
                env: {
                    WAYLAND_DISPLAY: 'wayland-test',
                    XDG_RUNTIME_DIR: '/tmp/wdio-test-runtime',
                    ...sessionEnv('wayland'),
                },
                stop: stopSpy,
            }),
        }))

        const daemon = await startDisplayDaemonFromConfig(
            {},
            manager,
        )
        expect(daemon).not.toBeNull()
        expect(process.env.WAYLAND_DISPLAY).toBe('wayland-test')
        expect(process.env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')

        const child = fork(shimPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
        const stdout = await collectStdout(child)
        const env = JSON.parse(stdout.trim())
        expect(env.WAYLAND_DISPLAY).toBe('wayland-test')
        expect(env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')
        expect(env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')

        await daemon!.stop()
        expect(stopSpy).toHaveBeenCalledTimes(1)
        expect(process.env.WAYLAND_DISPLAY).toBeUndefined()
        expect(process.env.XDG_RUNTIME_DIR).toBeUndefined()
        expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBeUndefined()
    })

    it('publishes Xvfb DISPLAY to process.env and a real fork()ed child inherits it', async () => {
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const manager = makeManager(makeDisplayServer({
            name: 'xvfb',
            startDaemon: async () => makeDaemonHandle({ env: { DISPLAY: ':99' }, stop: stopSpy }),
        }))

        const daemon = await startDisplayDaemonFromConfig(
            {},
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

    it('restores any prior process.env value the daemon overwrote, rather than deleting it', async () => {
        // Simulate the daemon overwriting a key that already had a value.
        process.env.NODE_ENV = 'preserved'
        const stopSpy = vi.fn().mockResolvedValue(undefined)
        const server = makeDisplayServer({
            name: 'xvfb',
            startDaemon: async () => makeDaemonHandle({ env: { DISPLAY: ':99', NODE_ENV: 'daemon-set' }, stop: stopSpy }),
        })
        const manager = makeManager(server)

        const daemon = await startDisplayDaemonFromConfig(
            {},
            manager,
        )
        expect(process.env.NODE_ENV).toBe('daemon-set')

        await daemon!.stop()
        expect(process.env.NODE_ENV).toBe('preserved')
        expect(process.env.DISPLAY).toBeUndefined()
    })
})
