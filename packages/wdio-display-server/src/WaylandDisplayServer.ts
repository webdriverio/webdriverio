import { exec, spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { access, mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'

const execAsync = promisify(exec)

export class WaylandDisplayServer implements DisplayServer {
    readonly name = 'wayland' as const
    private log = logger('@wdio/display-server:wayland')
    private runtimeDir: string | null = null
    private displayNum = 1

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
        this.log.info('Attempting to install Weston compositor...')

        // If custom command provided, use it
        if (options?.command) {
            const command = Array.isArray(options.command) ? options.command.join(' ') : options.command
            try {
                await execAsync(command, { timeout: 240000 })
                this.log.info('Weston installed successfully using custom command')
                return true
            } catch (error) {
                this.log.error('Failed to install Weston with custom command:', error)
                return false
            }
        }

        // Detect package manager and install
        const installCommands: Record<string, string> = {
            apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston',
            dnf: 'dnf -y makecache && dnf -y install weston',
            yum: 'yum -y makecache && yum -y install weston',
            zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y weston',
            pacman: 'pacman -Sy --noconfirm weston',
            apk: 'apk update && apk add --no-cache weston',
            xbps: 'xbps-install -Sy weston',
        }

        const packageManager = await this.detectPackageManager()

        if (!installCommands[packageManager]) {
            this.log.error(`Unsupported package manager: ${packageManager}`)
            return false
        }

        let command = installCommands[packageManager]

        // Apply installation mode (root vs sudo)
        if (options?.mode === 'sudo') {
            // Check if we're not root and sudo is available
            if (process.getuid && process.getuid() !== 0) {
                try {
                    await execAsync('which sudo')
                    command = `sudo -n sh -c "${command}"`
                } catch {
                    this.log.warn('sudo not available, attempting install without sudo')
                }
            }
        } else if (options?.mode === 'root') {
            // Only install if root
            if (process.getuid && process.getuid() !== 0) {
                this.log.error('Not running as root and autoInstallMode is "root"')
                return false
            }
        }

        try {
            await execAsync(command, { timeout: 240000 })
            this.log.info('Weston installed successfully')
            return true
        } catch (error) {
            this.log.error('Failed to install Weston:', error)
            return false
        }
    }

    private async detectPackageManager(): Promise<string> {
        const packageManagers = [
            { command: 'apt-get', name: 'apt' },
            { command: 'dnf', name: 'dnf' },
            { command: 'yum', name: 'yum' },
            { command: 'zypper', name: 'zypper' },
            { command: 'pacman', name: 'pacman' },
            { command: 'apk', name: 'apk' },
            { command: 'xbps-install', name: 'xbps' },
        ]

        for (const { command, name } of packageManagers) {
            try {
                await execAsync(`which ${command}`)
                return name
            } catch {
                // Continue to next
            }
        }

        return 'unknown'
    }

    getEnvironment(): Record<string, string> {
        const pid = process.pid
        this.runtimeDir = `/tmp/wdio-wayland-${pid}`
        mkdirSync(this.runtimeDir, { recursive: true, mode: 0o700 })

        return {
            WAYLAND_DISPLAY: `wayland-${this.displayNum}`,
            XDG_RUNTIME_DIR: this.runtimeDir,
            ELECTRON_OZONE_PLATFORM_HINT: 'wayland'
        }
    }

    getProcessWrapper(): string[] | null {
        if (!this.runtimeDir) {
            this.runtimeDir = `/tmp/wdio-wayland-${process.pid}`
        }

        // Wrap process with weston in headless mode
        return [
            'weston',
            '--backend=headless-backend.so',
            '--width=1920',
            '--height=1080',
            '--use-pixman',
            '--shell=fullscreen-shell.so',
            `--socket=wayland-${this.displayNum}`,
            '--',
        ]
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

        const runtimeDir = `/tmp/wdio-wayland-${process.pid}-${Date.now()}`
        const socketName = `wayland-${this.displayNum}`
        const socketPath = `${runtimeDir}/${socketName}`

        await mkdir(runtimeDir, { recursive: true, mode: 0o700 })
        this.runtimeDir = runtimeDir

        this.log.info(`Starting Weston daemon on ${socketName} (${width}x${height}) in ${runtimeDir}`)

        const proc = spawn(
            'weston',
            [
                '--backend=headless-backend.so',
                `--width=${width}`,
                `--height=${height}`,
                '--use-pixman',
                '--shell=fullscreen-shell.so',
                `--socket=${socketName}`,
            ],
            {
                stdio: 'ignore',
                env: { ...process.env, XDG_RUNTIME_DIR: runtimeDir },
            }
        )

        proc.on('error', (err) => {
            this.log.error(`Weston daemon spawn error: ${err.message}`)
        })

        await this.waitForSocket(socketPath, 10_000)

        let stopped = false
        const stop = async (): Promise<void> => {
            if (stopped) {
                return
            }
            stopped = true
            this.log.info(`Stopping Weston daemon on ${socketName}`)
            proc.kill('SIGTERM')
            await new Promise<void>((resolve) => {
                const timer = setTimeout(() => {
                    if (!proc.killed) {
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
        }

        return {
            env: {
                WAYLAND_DISPLAY: socketName,
                XDG_RUNTIME_DIR: runtimeDir,
                ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
            },
            stop,
        }
    }

    private async waitForSocket(path: string, timeoutMs: number): Promise<void> {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
            try {
                await access(path)
                return
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }
        throw new Error(`Timed out waiting for Wayland socket at ${path}`)
    }
}
