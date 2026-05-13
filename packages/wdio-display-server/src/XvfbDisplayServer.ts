import { exec, spawn } from 'node:child_process'
import { access, readdir } from 'node:fs/promises'
import { promisify } from 'node:util'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'

const execAsync = promisify(exec)
const X_SOCKET_DIR = '/tmp/.X11-unix'

export class XvfbDisplayServer implements DisplayServer {
    readonly name = 'xvfb' as const
    private log = logger('@wdio/display-server: xvfb')
    private isCentOS10 = false

    async isAvailable(): Promise<boolean> {
        // Check if this is CentOS Stream 10 - Xvfb is not available
        if (await this.checkIsCentOS10()) {
            this.log.info('CentOS Stream 10 detected - Xvfb unavailable, skipping')
            this.isCentOS10 = true
            return false
        }

        try {
            await execAsync('which xvfb-run')
            await execAsync('which Xvfb')
            this.log.info('xvfb-run and Xvfb found in PATH')
            return true
        } catch {
            this.log.debug('xvfb-run or Xvfb not found')
            return false
        }
    }

    private async checkIsCentOS10(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('cat /etc/os-release')
            return stdout.includes('CentOS Stream') && stdout.includes('VERSION_ID="10"')
        } catch {
            return false
        }
    }

    async install(options?: DisplayServerInstallOptions): Promise<boolean> {
        // Don't try to install on CentOS 10
        if (this.isCentOS10) {
            this.log.info('Skipping Xvfb installation on CentOS Stream 10 - not available')
            return false
        }

        this.log.info('Attempting to install Xvfb...')

        // If custom command provided, use it
        if (options?.command) {
            const command = Array.isArray(options.command) ? options.command.join(' ') : options.command
            try {
                await execAsync(command, { timeout: 240000 })
                this.log.info('Xvfb installed successfully using custom command')
                return true
            } catch (error) {
                this.log.error('Failed to install Xvfb with custom command:', error)
                return false
            }
        }

        const installCommands: Record<string, string> = {
            apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
            dnf: 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb',
            yum: 'yum -y makecache && yum -y install xorg-x11-server-Xvfb',
            zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run',
            pacman: 'pacman -Sy --noconfirm xorg-server-xvfb',
            apk: 'apk update && apk add --no-cache xvfb-run',
            xbps: 'xbps-install -Sy xvfb',
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
            this.log.info('Xvfb installed successfully')
            return true
        } catch (error) {
            this.log.error('Failed to install Xvfb:', error)
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
        // Xvfb sets DISPLAY environment variable via xvfb-run
        return {
            DISPLAY: ':99'
        }
    }

    getProcessWrapper(): string[] | null {
        // Wrap process with xvfb-run
        return ['xvfb-run', '--auto-servernum', '--']
    }

    getChromeFlags(): string[] {
        // Xvfb doesn't need special Chrome flags
        return []
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const width = options?.width ?? 1920
        const height = options?.height ?? 1080
        const depth = options?.depth ?? 24

        const displayNum = await this.findFreeDisplay()
        const display = `:${displayNum}`
        const socketPath = `${X_SOCKET_DIR}/X${displayNum}`

        this.log.info(`Starting Xvfb daemon on ${display} (${width}x${height}x${depth})`)

        const proc = spawn(
            'Xvfb',
            [display, '-screen', '0', `${width}x${height}x${depth}`, '-nolisten', 'tcp'],
            { stdio: 'ignore' }
        )

        proc.on('error', (err) => {
            this.log.error(`Xvfb daemon spawn error: ${err.message}`)
        })

        await this.waitForSocket(socketPath, 10_000)

        let stopped = false
        const stop = async (): Promise<void> => {
            if (stopped) {
                return
            }
            stopped = true
            this.log.info(`Stopping Xvfb daemon on ${display}`)
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
        }

        return { env: { DISPLAY: display }, stop }
    }

    private async findFreeDisplay(): Promise<number> {
        const used = new Set<number>()
        try {
            const entries = await readdir(X_SOCKET_DIR)
            for (const entry of entries) {
                const match = entry.match(/^X(\d+)$/)
                if (match) {
                    used.add(parseInt(match[1], 10))
                }
            }
        } catch {
            // socket dir may not exist yet — Xvfb will create it
        }
        for (let n = 99; n < 200; n++) {
            if (!used.has(n)) {
                return n
            }
        }
        throw new Error('No free X display number available in range :99-:199')
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
        throw new Error(`Timed out waiting for Xvfb socket at ${path}`)
    }
}
