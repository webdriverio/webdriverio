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
    private xvfbRunAvailable = false

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
            this.xvfbRunAvailable = true
            this.log.info('xvfb-run is ready for use')
            return true
        } catch (error) {
            this.log.error('Failed to setup xvfb-run:', error)
            throw error
        }
    }

    /**
     * Execute a command with xvfb-run
     * @param command - The command to run under Xvfb
     * @param options - Additional spawn options
     * @returns Promise<{ stdout: string, stderr: string }>
     */
    async runWithXvfb(command: string, options: { cwd?: string; env?: Record<string, string> } = {}): Promise<{ stdout: string; stderr: string }> {
        if (!this.xvfbRunAvailable) {
            throw new Error('xvfb-run is not available. Call init() first.')
        }

        this.log.debug(`Running with xvfb-run: ${command}`)

        const { stdout, stderr } = await execAsync(`xvfb-run --auto-servernum -- ${command}`, {
            cwd: options.cwd,
            env: { ...process.env, ...options.env }
        })

        return { stdout, stderr }
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
            ubuntu: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            debian: 'sudo apt-get update -qq && sudo apt-get install -y xvfb',
            fedora: 'sudo dnf install -y xorg-x11-server-Xvfb',
            centos: 'sudo yum install -y xorg-x11-server-Xvfb',
            rhel: 'sudo yum install -y xorg-x11-server-Xvfb',
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
