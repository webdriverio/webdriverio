import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fork, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import url from 'node:url'
import type * as DisplayServerManagerModule from '../src/DisplayServerManager.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/DisplayServerManager.js', async (importOriginal) => ({
    ...await importOriginal<typeof DisplayServerManagerModule>(),
    DisplayServerManager: vi.fn(function () { return { startDaemon: async () => null } }),
}))

const { DisplayServerManager, optionsFromConfig } = await import('../src/DisplayServerManager.js')
const { startDisplayDaemonFromConfig } = await import('../src/daemon.js')

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const shimPath = path.join(__dirname, 'fixtures', 'env-echo.mjs')

function noopManager () {
    return { startDaemon: async () => null }
}

const collectStdout = (proc: ChildProcess): Promise<string> => new Promise((resolve, reject) => {
    let out = ''
    if (!proc.stdout) {
        reject(new Error('child has no stdout — daemon test misconfigured'))
        return
    }
    proc.stdout.setEncoding('utf8')
    proc.stdout.on('data', (chunk: string) => { out += chunk })
    proc.on('error', reject)
    proc.on('exit', () => resolve(out))
})

describe('startDisplayDaemonFromConfig', () => {
    beforeEach(() => {
        vi.mocked(DisplayServerManager).mockClear()
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.mocked(DisplayServerManager).mockImplementation(noopManager)
    })

    it('builds its manager from the config', async () => {
        vi.stubEnv('DISPLAY', undefined)
        vi.stubEnv('WAYLAND_DISPLAY', undefined)
        const config = { displayServer: 'wayland', displayServerAutoInstall: true } as const

        await startDisplayDaemonFromConfig(config)

        expect(DisplayServerManager).toHaveBeenCalledWith(optionsFromConfig(config))
    })

    describe('with an existing Wayland display', () => {
        beforeEach(() => {
            vi.stubEnv('DISPLAY', undefined)
            vi.stubEnv('WAYLAND_DISPLAY', 'wayland-1')
            vi.stubEnv('GDK_BACKEND', undefined)
            vi.stubEnv('XDG_SESSION_TYPE', undefined)
            vi.stubEnv('ELECTRON_OZONE_PLATFORM_HINT', undefined)
        })

        it('sets the Wayland session env over any other value and restores it on stop', async () => {
            vi.stubEnv('GDK_BACKEND', 'x11')
            vi.stubEnv('XDG_SESSION_TYPE', 'tty')

            const running = await startDisplayDaemonFromConfig({})

            expect(process.env.GDK_BACKEND).toBe('wayland')
            expect(process.env.XDG_SESSION_TYPE).toBe('wayland')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
            await running?.stop()
            expect(process.env.GDK_BACKEND).toBe('x11')
            expect(process.env.XDG_SESSION_TYPE).toBe('tty')
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBeUndefined()
        })

        it('changes nothing when DISPLAY is set too', async () => {
            vi.stubEnv('DISPLAY', ':0')

            expect(await startDisplayDaemonFromConfig({})).toBeNull()
            expect(process.env.XDG_SESSION_TYPE).toBeUndefined()
        })
    })

    describe('when startDaemon returns a display', () => {
        const installDaemon = (env: Record<string, string>, stop: () => Promise<void>) => {
            vi.mocked(DisplayServerManager).mockImplementation(function () {
                return { startDaemon: async () => ({ env, stop, stopSync () {} }) }
            })
        }

        it('publishes Wayland env to process.env and a real fork()ed child inherits it', async () => {
            vi.stubEnv('DISPLAY', undefined)
            vi.stubEnv('WAYLAND_DISPLAY', undefined)
            vi.stubEnv('XDG_RUNTIME_DIR', undefined)
            vi.stubEnv('ELECTRON_OZONE_PLATFORM_HINT', undefined)
            const stopSpy = vi.fn().mockResolvedValue(undefined)
            installDaemon({
                WAYLAND_DISPLAY: 'wayland-test',
                XDG_RUNTIME_DIR: '/tmp/wdio-test-runtime',
                GDK_BACKEND: 'wayland',
                XDG_SESSION_TYPE: 'wayland',
                ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
            }, stopSpy)

            const running = await startDisplayDaemonFromConfig({})

            expect(running).not.toBeNull()
            expect(process.env.WAYLAND_DISPLAY).toBe('wayland-test')
            expect(process.env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')

            const child = fork(shimPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
            const env = JSON.parse((await collectStdout(child)).trim())
            expect(env.WAYLAND_DISPLAY).toBe('wayland-test')
            expect(env.XDG_RUNTIME_DIR).toBe('/tmp/wdio-test-runtime')
            expect(env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')

            await running?.stop()
            expect(stopSpy).toHaveBeenCalledTimes(1)
            expect(process.env.WAYLAND_DISPLAY).toBeUndefined()
            expect(process.env.XDG_RUNTIME_DIR).toBeUndefined()
            expect(process.env.ELECTRON_OZONE_PLATFORM_HINT).toBeUndefined()
        })

        it('publishes Xvfb DISPLAY to process.env and a real fork()ed child inherits it', async () => {
            vi.stubEnv('DISPLAY', undefined)
            vi.stubEnv('WAYLAND_DISPLAY', undefined)
            const stopSpy = vi.fn().mockResolvedValue(undefined)
            installDaemon({ DISPLAY: ':99' }, stopSpy)

            const running = await startDisplayDaemonFromConfig({})

            expect(running).not.toBeNull()
            expect(process.env.DISPLAY).toBe(':99')

            const child = fork(shimPath, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
            const env = JSON.parse((await collectStdout(child)).trim())
            expect(env.DISPLAY).toBe(':99')

            await running?.stop()
            expect(stopSpy).toHaveBeenCalledTimes(1)
            expect(process.env.DISPLAY).toBeUndefined()
        })

        it('restores any prior process.env value the daemon overwrote, rather than deleting it', async () => {
            vi.stubEnv('DISPLAY', undefined)
            vi.stubEnv('WAYLAND_DISPLAY', undefined)
            vi.stubEnv('NODE_ENV', 'preserved')
            const stopSpy = vi.fn().mockResolvedValue(undefined)
            installDaemon({ DISPLAY: ':99', NODE_ENV: 'daemon-set' }, stopSpy)

            const running = await startDisplayDaemonFromConfig({})
            expect(process.env.NODE_ENV).toBe('daemon-set')

            await running?.stop()
            expect(process.env.NODE_ENV).toBe('preserved')
            expect(process.env.DISPLAY).toBeUndefined()
        })
    })
})
