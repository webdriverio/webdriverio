import { exec, spawn } from 'node:child_process'
import { rmSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { installViaPackageManager, waitForSocket } from './utils.js'

const execAsync = promisify(exec)

export class WaylandDisplayServer implements DisplayServer {
    readonly name = 'wayland' as const
    private log = logger('@wdio/display-server:wayland')
    private static daemonCounter = 0

    async isAvailable(): Promise<boolean> {
        try {
            await execAsync('which weston')
            this.log.info('Weston compositor found in PATH')
            return true
        } catch {
            this.log.debug('Weston compositor not found')
            return false
        }
    }

    async install(options?: DisplayServerInstallOptions): Promise<boolean> {
        return installViaPackageManager({
            name: 'Weston',
            packageCommands: {
                apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston',
                dnf: 'dnf -y makecache && dnf -y install weston',
                yum: 'yum -y makecache && yum -y install weston',
                zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y weston',
                pacman: 'pacman -Sy --noconfirm weston',
                apk: 'apk update && apk add --no-cache weston',
                xbps: 'xbps-install -Sy weston',
            },
            log: this.log,
            options,
        })
    }

    getEnvironment(): Record<string, string> {
        // Wayland env is only available per-daemon via startDaemon().env
        return {}
    }

    getProcessWrapper(): string[] | null {
        // Weston doesn't exec its child, so wrapping breaks Node's IPC fd.
        return null
    }

    getChromeFlags(): string[] {
        return [
            '--ozone-platform=wayland',
            '--enable-features=UseOzonePlatform'
        ]
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const width = options?.width ?? 1920
        const height = options?.height ?? 1080

        const id = ++WaylandDisplayServer.daemonCounter
        const runtimeDir = `/tmp/wdio-wayland-${process.pid}-${id}`
        const socketName = `wayland-${id}`
        const socketPath = `${runtimeDir}/${socketName}`

        await mkdir(runtimeDir, { recursive: true, mode: 0o700 })

        this.log.info(`Starting Weston daemon on ${socketName} (${width}x${height}) in ${runtimeDir}`)

        const proc = spawn(
            'weston',
            [
                '--backend=headless',
                `--width=${width}`,
                `--height=${height}`,
                '--use-pixman',
                `--socket=${socketName}`,
            ],
            {
                stdio: 'ignore',
                env: { ...process.env, XDG_RUNTIME_DIR: runtimeDir },
            }
        )

        let rejectExit!: (err: Error) => void
        const exitPromise = new Promise<never>((_, reject) => { rejectExit = reject })
        const onExit = (code: number | null, signal: NodeJS.Signals | null) =>
            rejectExit(new Error(`Weston process exited unexpectedly (code=${code}, signal=${signal})`))
        const onError = (err: Error) =>
            rejectExit(new Error(`Weston process error: ${err.message}`))
        proc.once('exit', onExit)
        proc.once('error', onError)

        try {
            await Promise.race([waitForSocket(socketPath, 10_000, 'Wayland socket'), exitPromise])
        } catch (err) {
            proc.removeListener('exit', onExit)
            proc.removeListener('error', onError)
            if (!proc.killed) {
                proc.kill('SIGTERM')
            }
            await rm(runtimeDir, { recursive: true, force: true }).catch(() => {})
            throw err
        }
        proc.removeListener('exit', onExit)
        proc.removeListener('error', onError)

        // syncDone short-circuits stop() so a prior stopSync() (sync teardown
        // during process exit) isn't undone by a redundant async cleanup, while
        // still allowing stopSync() to run when an async stop() is mid-flight —
        // otherwise an exit fired while stop() is awaiting would orphan the child.
        let stopPromise: Promise<void> | null = null
        let syncDone = false
        const stop = (): Promise<void> => {
            if (syncDone) {
                return Promise.resolve()
            }
            if (stopPromise) {
                return stopPromise
            }
            stopPromise = (async () => {
                this.log.info(`Stopping Weston daemon on ${socketName}`)
                proc.kill('SIGTERM')
                await new Promise<void>((resolve) => {
                    const timer = setTimeout(() => {
                        if (proc.exitCode === null && proc.signalCode === null) {
                            proc.kill('SIGKILL')
                        }
                        resolve()
                    }, 1000)
                    proc.once('exit', () => {
                        clearTimeout(timer)
                        resolve()
                    })
                })
                await rm(runtimeDir, { recursive: true, force: true }).catch(() => {})
            })()
            return stopPromise
        }

        const stopSync = (): void => {
            if (syncDone) {
                return
            }
            syncDone = true
            try {
                if (proc.exitCode === null && proc.signalCode === null) {
                    proc.kill('SIGKILL')
                }
            } catch { /* process may already be gone */ }
            try {
                rmSync(runtimeDir, { recursive: true, force: true })
            } catch { /* ignore — best-effort */ }
        }

        return {
            env: {
                WAYLAND_DISPLAY: socketName,
                XDG_RUNTIME_DIR: runtimeDir,
                ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
            },
            stop,
            stopSync,
        }
    }

}
