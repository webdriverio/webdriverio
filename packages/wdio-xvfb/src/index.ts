import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import os from 'node:os'
import logger from '@wdio/logger'

export interface XvfbOptions {
    /**
     * Display number to use (default: 99)
     */
    display?: number;
    /**
     * Screen resolution (default: '1024x768x24')
     */
    screen?: string;
    /**
     * DPI setting (default: 96)
     */
    dpi?: number;
    /**
     * Additional Xvfb arguments
     */
    args?: string[];
    /**
     * Force Xvfb to run even on non-Linux systems (for testing)
     */
    force?: boolean;
    /**
     * Logger instance (optional, will create default if not provided)
     */
    logger?: ReturnType<typeof logger>;
}

const execAsync = promisify(exec)

export class XvfbManager {
    private xvfbProcess?: ChildProcess
    private display: number
    private screen: string
    private dpi: number
    private args: string[]
    private force: boolean
    private originalDisplay?: string
    private log: ReturnType<typeof logger>
    private isRunning = false

    constructor(options: XvfbOptions = {}) {
        this.display = options.display ?? 99
        this.screen = options.screen ?? '1024x768x24'
        this.dpi = options.dpi ?? 96
        this.args = options.args ?? []
        this.force = options.force ?? false
        this.log = options.logger ?? logger('@wdio/xvfb')
    }

    /**
     * Check if Xvfb should run on this system
     */
    shouldRun(): boolean {
        if (this.force) {
            return true
        }

        // Only run on Linux systems
        if (os.platform() !== 'linux') {
            return false
        }

        // Check if we're in a headless environment (no DISPLAY set or in CI)
        const hasDisplay = process.env.DISPLAY
        const isCI =
            process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.JENKINS_URL

        return !hasDisplay || !!isCI
    }

    /**
     * Start Xvfb if needed
     * @returns Promise<boolean> - true if Xvfb was started, false if not needed
     */
    async start(): Promise<boolean> {
        if (this.isRunning) {
            this.log.debug('Xvfb is already running')
            return true
        }

        if (!this.shouldRun()) {
            this.log.info('Xvfb not needed on current platform')
            return false
        }

        try {
            await this.setupEnvironment()
            await this.startXvfb()
            this.isRunning = true
            return true
        } catch (error) {
            this.log.error('Failed to start Xvfb:', error)
            throw error
        }
    }

    /**
     * Stop Xvfb and cleanup
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            this.log.debug('Xvfb is not running')
            return
        }

        await this.cleanup()
        this.isRunning = false
    }

    /**
     * Get the current display number
     */
    getDisplay(): string {
        return `:${this.display}`
    }

    /**
     * Check if Xvfb is currently running
     */
    isXvfbRunning(): boolean {
        return this.isRunning
    }

    private async detectDistribution(): Promise<string> {
        try {
            const { stdout } = await execAsync('cat /etc/os-release')
            if (stdout.includes('ubuntu') || stdout.includes('Ubuntu')) {
                return 'ubuntu'
            }
            if (stdout.includes('debian') || stdout.includes('Debian')) {
                return 'debian'
            }
            if (stdout.includes('fedora') || stdout.includes('Fedora')) {
                return 'fedora'
            }
            if (stdout.includes('centos') || stdout.includes('CentOS')) {
                return 'centos'
            }
            if (stdout.includes('rhel') || stdout.includes('Red Hat')) {
                return 'rhel'
            }
            if (stdout.includes('suse') || stdout.includes('SUSE')) {
                return 'suse'
            }
            if (stdout.includes('arch') || stdout.includes('Arch')) {
                return 'arch'
            }
            if (stdout.includes('alpine') || stdout.includes('Alpine')) {
                return 'alpine'
            }
        } catch {
            // Fallback detection methods
            try {
                await execAsync('which apt-get')
                return 'debian'
            } catch {
                try {
                    await execAsync('which yum')
                    return 'rhel'
                } catch {
                    try {
                        await execAsync('which dnf')
                        return 'fedora'
                    } catch {
                        try {
                            await execAsync('which zypper')
                            return 'suse'
                        } catch {
                            try {
                                await execAsync('which pacman')
                                return 'arch'
                            } catch {
                                try {
                                    await execAsync('which apk')
                                    return 'alpine'
                                } catch {
                                    return 'unknown'
                                }
                            }
                        }
                    }
                }
            }
        }
        return 'unknown'
    }

    private async installXvfbPackages(): Promise<void> {
        const distro = await this.detectDistribution()

        const installCommands: Record<string, string> = {
            ubuntu: 'sudo apt-get update -qq && sudo apt-get install -y xvfb x11-utils',
            debian: 'sudo apt-get update -qq && sudo apt-get install -y xvfb x11-utils',
            fedora: 'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils',
            centos: 'sudo yum install -y xorg-x11-server-Xvfb xorg-x11-utils',
            rhel: 'sudo yum install -y xorg-x11-server-Xvfb xorg-x11-utils',
            suse: 'sudo zypper install -y xvfb x11-utils',
            arch: 'sudo pacman -S --noconfirm xorg-server-xvfb xorg-xdpyinfo',
            alpine: 'sudo apk add --no-cache xvfb x11vnc',
        }

        const command = installCommands[distro]
        if (!command) {
            throw new Error(
                `Unsupported distribution: ${distro}. Please install Xvfb manually.`
            )
        }

        this.log.info(
            `Detected ${distro} distribution, installing packages...`
        )
        await execAsync(command)
    }

    private getDesktopEnvironment(): string {
        // Try to detect actual desktop environment first
        const currentDesktop = process.env.XDG_CURRENT_DESKTOP
        if (currentDesktop) {
            return currentDesktop
        }

        // Fallback based on common patterns
        if (
            process.env.GNOME_DESKTOP_SESSION_ID ||
            process.env.GNOME_SHELL_SESSION_MODE
        ) {
            return 'GNOME'
        }
        if (process.env.KDE_FULL_SESSION) {
            return 'KDE'
        }
        if (process.env.XFCE4_SESSION) {
            return 'XFCE'
        }

        // Generic fallback that works across distros
        return 'X-Generic'
    }

    private async setupEnvironment(): Promise<void> {
        this.log.info('Setting up environment for Xvfb')

        // Install required packages
        try {
            const { stdout } = await execAsync('which Xvfb')
            this.log.info(`Found Xvfb at: ${stdout.trim()}`)
        } catch (error) {
            this.log.info(`Xvfb not found in PATH: ${error}`)
            this.log.info('Installing XVFB and X11 utilities...')
            try {
                await this.installXvfbPackages()
                // Verify installation worked
                const { stdout } = await execAsync('which Xvfb')
                this.log.info(`Successfully installed Xvfb at: ${stdout.trim()}`)
            } catch (error) {
                this.log.warn('Failed to install xvfb automatically:', error)
                throw new Error(
                    "Xvfb is not installed. Please install it manually using your distribution's package manager."
                )
            }
        }

        // Set environment variables
        this.originalDisplay = process.env.DISPLAY
        process.env.DISPLAY = `:${this.display}`
        process.env.XDG_SESSION_TYPE = 'x11'
        process.env.XDG_CURRENT_DESKTOP = this.getDesktopEnvironment()

        this.log.info(`Set DISPLAY to :${this.display}`)
    }

    private async startXvfb(): Promise<void> {
        const xvfbArgs = [
            `:${this.display}`,
            '-screen',
            '0',
            this.screen,
            '-ac',
            '-nolisten',
            'tcp',
            '-dpi',
            this.dpi.toString(),
            ...this.args,
        ]

        this.log.info(`Starting Xvfb with args: ${xvfbArgs.join(' ')}`)

        this.xvfbProcess = spawn('Xvfb', xvfbArgs, {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        // Unreference the process so it can run independently
        if (this.xvfbProcess.unref) {
            this.xvfbProcess.unref()
        }

        this.xvfbProcess.stdout?.on('data', (data) => {
            this.log.info(`Xvfb stdout: ${data}`)
        })

        this.xvfbProcess.stderr?.on('data', (data) => {
            this.log.info(`Xvfb stderr: ${data}`)
        })

        this.xvfbProcess.on('error', (error) => {
            this.log.error('Xvfb process error:', error)
            this.isRunning = false
        })

        this.xvfbProcess.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                this.log.error(`Xvfb exited with code ${code}`)
            } else if (signal) {
                this.log.info(`Xvfb terminated with signal ${signal}`)
            }
            this.isRunning = false
        })

        // Wait for Xvfb to be ready
        await this.waitForXvfb()
        this.log.info(
            `Xvfb started successfully on display :${this.display} (PID: ${this.xvfbProcess.pid})`
        )
    }

    private async waitForXvfb(timeout = 10000): Promise<void> {
        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
            try {
                await execAsync(
                    `DISPLAY=:${this.display} xdpyinfo > /dev/null 2>&1`
                )
                return
            } catch {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
        }

        throw new Error(`Xvfb did not become ready within ${timeout}ms`)
    }

    private async cleanup(): Promise<void> {
        if (this.xvfbProcess) {
            this.log.info(
                `Cleaning up Xvfb process (PID: ${this.xvfbProcess.pid})`
            )

            try {
                this.xvfbProcess.kill('SIGTERM')

                // Wait for graceful shutdown
                await new Promise<void>((resolve) => {
                    const timeout = setTimeout(() => {
                        if (this.xvfbProcess && !this.xvfbProcess.killed) {
                            this.log.warn('Force killing Xvfb process')
                            this.xvfbProcess.kill('SIGKILL')
                        }
                        resolve()
                    }, 5000)

                    this.xvfbProcess?.on('exit', () => {
                        clearTimeout(timeout)
                        resolve()
                    })
                })
            } catch (error) {
                this.log.warn('Error during Xvfb cleanup:', error)
            }

            this.xvfbProcess = undefined
        }

        // Try to cleanup any remaining Xvfb processes
        try {
            await execAsync(`pkill -f "Xvfb :${this.display}" || true`)
        } catch {
            // Ignore errors
        }

        // Restore original DISPLAY
        if (this.originalDisplay !== undefined) {
            process.env.DISPLAY = this.originalDisplay
        } else {
            delete process.env.DISPLAY
        }

        this.log.info('Xvfb cleanup completed')
    }
}

// Export a default instance for convenience
export const xvfb = new XvfbManager()

// Export the class for custom instances
export default XvfbManager
