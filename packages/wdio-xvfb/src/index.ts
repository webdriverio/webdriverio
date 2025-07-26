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
}

const execAsync = promisify(exec)

export class XvfbManager {
    private force: boolean
    private log: ReturnType<typeof logger>

    constructor(options: XvfbOptions = {}) {
        this.force = options.force ?? false
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
    async init(): Promise<boolean> {
        if (!this.shouldRun()) {
            this.log.info('Xvfb not needed on current platform')
            return false
        }

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
        try {
            // Check if xvfb-run is already available
            await execAsync('which xvfb-run')
            this.log.info('xvfb-run found in PATH')
            return
        } catch {
            this.log.info('xvfb-run not found, installing xvfb packages...')
        }

        // Install packages that include xvfb-run
        await this.installXvfbPackages()

        // Verify xvfb-run is now available
        try {
            const { stdout } = await execAsync('which xvfb-run')
            this.log.info(`Successfully installed xvfb-run at: ${stdout.trim()}`)
        } catch (error) {
            this.log.error('Failed to install xvfb-run:', error)
            throw new Error(
                "xvfb-run is not available after installation. Please install it manually using your distribution's package manager."
            )
        }
    }

    protected async detectPackageManager(): Promise<string> {
        const packageManagers = [
            { command: 'apt-get', name: 'apt' },
            { command: 'dnf', name: 'dnf' },
            { command: 'yum', name: 'yum' },
            { command: 'zypper', name: 'zypper' },
            { command: 'pacman', name: 'pacman' },
            { command: 'apk', name: 'apk' }
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
        const packageManager = await this.detectPackageManager()

        const installCommands: Record<string, string> = {
            apt: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            dnf: 'sudo dnf install -y xorg-x11-server-Xvfb',
            yum: 'sudo yum install -y xorg-x11-server-Xvfb',
            zypper: 'sudo zypper install -y xvfb-run || sudo zypper install -y xorg-x11-server-Xvfb xorg-x11-apps',
            pacman: 'sudo pacman -S --noconfirm xorg-server-xvfb',
            apk: 'sudo apk add --no-cache xvfb-run',
        }

        const command = installCommands[packageManager]
        if (!command) {
            throw new Error(
                `Unsupported package manager: ${packageManager}. Please install Xvfb manually.`
            )
        }

        this.log.info(
            `Detected ${packageManager} package manager, installing xvfb packages...`
        )
        await execAsync(command)
    }

}

// Export a default instance for convenience
export const xvfb = new XvfbManager()

// Export the class for custom instances
export default XvfbManager
