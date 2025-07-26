import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import os from 'node:os'
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
        const isCI = !!(
            process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.JENKINS_URL ||
            process.env.TRAVIS ||
            process.env.CIRCLECI ||
            process.env.GITLAB_CI ||
            process.env.BUILDKITE ||
            process.env.APPVEYOR
        )
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

    protected async detectDistribution(): Promise<string> {
        // First try parsing /etc/os-release for accurate distribution detection
        try {
            const { stdout } = await execAsync('cat /etc/os-release')
            const osRelease = stdout.toLowerCase()

            const distributions = [
                { pattern: /ubuntu/, name: 'ubuntu' },
                { pattern: /debian/, name: 'debian' },
                { pattern: /fedora/, name: 'fedora' },
                { pattern: /centos stream/, name: 'centos-stream' },
                { pattern: /centos/, name: 'centos' },
                { pattern: /rhel|red hat/, name: 'rhel' },
                { pattern: /rocky linux|rocky/, name: 'rocky' },
                { pattern: /suse/, name: 'suse' },
                { pattern: /arch/, name: 'arch' },
                { pattern: /alpine/, name: 'alpine' }
            ]

            for (const { pattern, name } of distributions) {
                if (pattern.test(osRelease)) {
                    return name
                }
            }
        } catch {
            // Fallback: detect by available package managers
            const packageManagers = [
                { command: 'apt-get', distribution: 'debian' },
                { command: 'dnf', distribution: 'fedora' },
                { command: 'yum', distribution: 'rhel' },
                { command: 'zypper', distribution: 'suse' },
                { command: 'pacman', distribution: 'arch' },
                { command: 'apk', distribution: 'alpine' }
            ]

            const results = await Promise.allSettled(
                packageManagers.map(async ({ command, distribution }) => {
                    await execAsync(`which ${command}`)
                    return distribution
                })
            )

            const detected = results
                .filter(result => result.status === 'fulfilled')
                .map(result => (result as PromiseFulfilledResult<string>).value)

            if (detected.length > 0) {
                return detected[0]
            }
        }

        return 'unknown'
    }

    private async installXvfbPackages(): Promise<void> {
        const distro = await this.detectDistribution()

        const installCommands: Record<string, string> = {
            ubuntu: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            debian: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            fedora: 'sudo dnf install -y xorg-x11-server-Xvfb',
            centos: 'sudo yum install -y xorg-x11-server-Xvfb',
            'centos-stream': 'sudo dnf install -y xorg-x11-server-Xvfb',
            rhel: 'sudo yum install -y xorg-x11-server-Xvfb',
            rocky: 'sudo dnf install -y xorg-x11-server-Xvfb',
            suse: 'sudo zypper install -y xvfb',
            arch: 'sudo pacman -S --noconfirm xorg-server-xvfb',
            alpine: 'sudo apk add --no-cache xvfb',
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

}

// Export a default instance for convenience
export const xvfb = new XvfbManager()

// Export the class for custom instances
export default XvfbManager
