import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import os from 'node:os'
import isCI from 'is-ci'
import logger from '@wdio/logger'

export interface XvfbOptions {
    /**
     * Force Xvfb to run even on non-Linux systems (for testing)
     */
    force?: boolean;
    /**
     * Override package manager detection (for testing)
     */
    packageManager?: string;
    /**
     * Skip xvfb-run availability check and force installation (for testing)
     */
    forceInstall?: boolean;
}

const execAsync = promisify(exec)

export class XvfbManager {
    private force: boolean
    private packageManagerOverride?: string
    private forceInstall: boolean
    private log: ReturnType<typeof logger>

    constructor(options: XvfbOptions = {}) {
        this.force = options.force ?? false
        this.packageManagerOverride = options.packageManager
        this.forceInstall = options.forceInstall ?? false
        this.log = logger('@wdio/xvfb')
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
        return !hasDisplay || isCI
    }

    /**
     * Initialize xvfb-run for use
     * @returns Promise<boolean> - true if xvfb-run is ready, false if not needed
     */
    public async init(): Promise<boolean> {
        this.log.info('XvfbManager.init() called')

        if (!this.shouldRun()) {
            this.log.info('Xvfb not needed on current platform')
            return false
        }
        this.log.info('Xvfb should run, checking if setup is needed')

        try {
            await this.ensureXvfbRunAvailable()
            this.log.info('xvfb-run is ready for use')
            return true
        } catch (error) {
            this.log.error('Failed to setup xvfb-run:', error)
            throw error
        }
    }

    /**
     * Ensure xvfb-run is available, installing if necessary
     */
    private async ensureXvfbRunAvailable(): Promise<void> {
        this.log.info('Checking if xvfb-run is available...')

        if (!this.forceInstall) {
            try {
                // Check if xvfb-run is already available
                await execAsync('which xvfb-run')
                this.log.info('xvfb-run found in PATH')
                return
            } catch {
                this.log.info('xvfb-run not found, installing xvfb packages...')
            }
        } else {
            this.log.info('Force install enabled, skipping availability check')
        }

        // Install packages that include xvfb-run
        this.log.info('Starting xvfb package installation...')
        await this.installXvfbPackages()
        this.log.info('Package installation completed')

        // Verify xvfb-run is now available (skip if force install to allow error testing)
        if (!this.forceInstall) {
            this.log.info('Verifying xvfb-run installation...')
            try {
                const { stdout } = await execAsync('which xvfb-run')
                this.log.info(
                    `Successfully installed xvfb-run at: ${stdout.trim()}`
                )
            } catch (error) {
                this.log.error('Failed to install xvfb-run:', error)
                throw new Error(
                    "xvfb-run is not available after installation. Please install it manually using your distribution's package manager."
                )
            }
        }
    }

    protected async detectPackageManager(): Promise<string> {
        // Use override if provided (for testing)
        if (this.packageManagerOverride) {
            return this.packageManagerOverride
        }

        const packageManagers = [
            { command: 'apt-get', name: 'apt' },
            { command: 'dnf', name: 'dnf' },
            { command: 'yum', name: 'yum' },
            { command: 'zypper', name: 'zypper' },
            { command: 'pacman', name: 'pacman' },
            { command: 'apk', name: 'apk' },
        ]

        for (const { command, name } of packageManagers) {
            try {
                await execAsync(`which ${command}`)
                return name
            } catch {
                // Continue to next package manager
            }
        }

        return 'unknown'
    }

    private async installXvfbPackages(): Promise<void> {
        this.log.info('Detecting package manager...')
        const packageManager = await this.detectPackageManager()
        this.log.info(`Detected package manager: ${packageManager}`)

        const installCommands: Record<string, string> = {
            apt: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            dnf: 'sudo dnf install -y xorg-x11-server-Xvfb',
            yum: 'sudo yum install -y xorg-x11-server-Xvfb',
            zypper: 'sudo zypper install -y xorg-x11-server-Xvfb xvfb-run',
            pacman: 'sudo pacman -S --noconfirm xorg-server-xvfb',
            apk: 'sudo apk add --no-cache xvfb-run',
        }

        const command = installCommands[packageManager]
        if (!command) {
            throw new Error(
                `Unsupported package manager: ${packageManager}. Please install Xvfb manually.`
            )
        }

        this.log.info(`Installing xvfb packages using command: ${command}`)

        try {
            await execAsync(command, { timeout: 120000 }) // 2 minute timeout
            this.log.info(
                'Package installation command completed successfully'
            )
        } catch (error) {
            this.log.error('Package installation command failed:', error)
            throw error
        }
    }
}

// Export a default instance for convenience
export const xvfb = new XvfbManager()

// Export the class for custom instances
export default XvfbManager
