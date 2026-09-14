import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import os from 'node:os'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

export interface XvfbOptions {
    /**
     * Explicitly enable / disable Xvfb usage. If false, `shouldRun()` returns false.
     */
    enabled?: boolean;
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
    /**
     * Enable automatic installation of `xvfb-run` if missing.
     * @default false
     */
    autoInstall?: boolean;
    /**
     * Mode for automatic installation when autoInstall is true.
     * - 'root': install only if running as root (no sudo)
     * - 'sudo': install if root or via non-interactive sudo (`sudo -n`) if available
     * @default 'sudo'
     */
    autoInstallMode?: 'root' | 'sudo';
    /**
     * Custom command to use for installation instead of built-in package manager detection.
     * When provided, this command is executed as-is and overrides the built-in installation logic.
     */
    autoInstallCommand?: string | string[];
    /**
     * Number of retry attempts for xvfb process failures (default: 3)
     */
    xvfbMaxRetries?: number;
    /**
     * Base delay between retries in milliseconds (default: 1000)
     * Progressive delay will be: baseDelay * attemptNumber
     */
    xvfbRetryDelay?: number;
}

const execAsync = promisify(exec)

export class XvfbManager {
    #force: boolean
    #packageManagerOverride?: string
    #forceInstall: boolean
    #autoInstallSetting: boolean
    #autoInstallMode: 'root' | 'sudo'
    #autoInstallCommand?: string | string[]
    #enabled: boolean
    #maxRetries: number
    #retryDelay: number
    #log: ReturnType<typeof logger>

    constructor(options: XvfbOptions = {}) {
        this.#force = options.force ?? false
        this.#packageManagerOverride = options.packageManager
        this.#forceInstall = options.forceInstall ?? false
        this.#autoInstallSetting = options.autoInstall ?? false
        this.#autoInstallMode = options.autoInstallMode ?? 'sudo'
        this.#autoInstallCommand = options.autoInstallCommand
        this.#enabled = options.enabled ?? true
        this.#maxRetries = options.xvfbMaxRetries ?? 3
        this.#retryDelay = options.xvfbRetryDelay ?? 1000
        this.#log = logger('@wdio/xvfb')
    }

    /**
     * Check if Xvfb should run on this system
     */
    shouldRun(capabilities?: Capabilities.ResolvedTestrunnerCapabilities): boolean {
        if (!this.#enabled) {
            return false
        }
        if (this.#force) {
            return true
        }

        // Only run on Linux systems
        if (os.platform() !== 'linux') {
            return false
        }

        // Check if we're in a headless environment (no DISPLAY set)
        const hasDisplay = process.env.DISPLAY
        const inHeadlessEnvironment = !hasDisplay

        // Force XVFB if headless Chrome flags are detected
        const hasHeadlessFlag = this.#detectHeadlessMode(capabilities as unknown as WebdriverIO.Config['capabilities'])

        return inHeadlessEnvironment || hasHeadlessFlag
    }

    /**
     * Initialize xvfb-run for use
     * @returns Promise<boolean> - true if xvfb-run is ready, false if not needed
     */
    public async init(capabilities?: Capabilities.ResolvedTestrunnerCapabilities): Promise<boolean> {
        this.#log.info('XvfbManager.init() called')

        if (!this.shouldRun(capabilities)) {
            this.#log.info('Xvfb not needed on current platform')
            return false
        }
        this.#log.info('Xvfb should run, checking if setup is needed')

        try {
            const isReady = await this.#ensureXvfbRunAvailable()

            if (isReady) {
                this.#log.info('xvfb-run is ready for use')
                return true
            }
            this.#log.warn('xvfb-run not available; continuing without virtual display')
            return false
        } catch (error) {
            this.#log.error('Failed to setup xvfb-run:', error)
            throw error
        }
    }

    /**
     * Ensure xvfb-run is available, installing if necessary
     */
    async #ensureXvfbRunAvailable(): Promise<boolean> {
        this.#log.info('Checking if xvfb-run is available...')

        if (!this.#forceInstall) {
            try {
                // Check if xvfb-run is already available
                await execAsync('which xvfb-run')
                this.#log.info('xvfb-run found in PATH')
                return true
            } catch {
                if (!this.#autoInstallSetting) {
                    this.#log.warn(
                        "xvfb-run not found. Skipping automatic installation. To enable auto-install, set 'xvfbAutoInstall: true' in your WDIO config."
                    )
                    this.#log.warn(
                        "Hint: you can also install it manually via your distro's package manager (e.g., 'sudo apt-get install xvfb', 'sudo dnf install xorg-x11-server-Xvfb')."
                    )
                    return false
                }
                this.#log.info('xvfb-run not found, installing xvfb packages (xvfbAutoInstall enabled)...')
            }
        } else {
            this.#log.info('Force install enabled, skipping availability check')
        }

        // Install packages that include xvfb-run
        this.#log.info('Starting xvfb package installation...')
        const attempted = await this.#installXvfbPackages()
        if (!attempted) {
            this.#log.warn('Insufficient privileges to install xvfb packages automatically. Please install manually.')
            return false
        }
        this.#log.info('Package installation completed')

        // Verify xvfb-run is now available (skip if force install to allow error testing)
        if (!this.#forceInstall) {
            this.#log.info('Verifying xvfb-run installation...')
            try {
                const { stdout } = await execAsync('which xvfb-run')
                this.#log.info(
                    `Successfully installed xvfb-run at: ${stdout.trim()}`
                )
                return true
            } catch (error) {
                this.#log.error('Failed to install xvfb-run:', error)
                throw new Error(
                    "xvfb-run is not available after installation. Please install it manually using your distribution's package manager."
                )
            }
        }
        return true
    }

    /**
     * Detect if headless mode is enabled in Chrome/Chromium capabilities
     */
    #detectHeadlessMode(capabilities?: WebdriverIO.Config['capabilities']): boolean {
        if (!capabilities) {
            return false
        }

        // Handle both single and multiremote capabilities
        const caps = capabilities as WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>

        // Check if it's a single capability object (has browser-specific options)
        if (this.isSingleCapability(caps)) {
            return this.checkCapabilityForHeadless(caps)
        }

        // Handle multiremote scenario
        if (this.isMultiRemoteCapability(caps)) {
            for (const [, browserConfig] of Object.entries(caps)) {
                const browserCaps = this.extractCapabilitiesFromBrowserConfig(browserConfig)
                if (this.checkCapabilityForHeadless(browserCaps)) {
                    return true
                }
            }
        }

        return false
    }

    /**
     * Check if the capabilities object is a single capability (not multiremote)
     */
    private isSingleCapability(caps: WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>): caps is WebdriverIO.Capabilities {
        return Boolean(
            caps['goog:chromeOptions'] ||
            caps['ms:edgeOptions'] ||
            caps['moz:firefoxOptions']
        )
    }

    /**
     * Check if the capabilities object is multiremote
     */
    private isMultiRemoteCapability(caps: WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>): caps is Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }> {
        return !this.isSingleCapability(caps) && typeof caps === 'object' && caps !== null
    }

    /**
     * Extract capabilities from browser config (handles both nested and direct formats)
     */
    private extractCapabilitiesFromBrowserConfig(browserConfig: { capabilities: WebdriverIO.Capabilities } | WebdriverIO.Capabilities): WebdriverIO.Capabilities {
        if (browserConfig && typeof browserConfig === 'object' && 'capabilities' in browserConfig && browserConfig.capabilities) {
            return browserConfig.capabilities
        }
        return browserConfig as WebdriverIO.Capabilities
    }

    /**
     * Check a single capability object for headless flags
     */
    private checkCapabilityForHeadless(caps: WebdriverIO.Capabilities): boolean {
        if (!caps || typeof caps !== 'object') {
            return false
        }

        // Check Chrome options
        if (this.hasHeadlessFlag(caps['goog:chromeOptions'], ['--headless'])) {
            this.#log.info('Detected headless Chrome flag, forcing XVFB usage')
            return true
        }

        // Check Edge options (Chromium-based, uses same flags as Chrome)
        if (this.hasHeadlessFlag(caps['ms:edgeOptions'], ['--headless'])) {
            this.#log.info('Detected headless Edge flag, forcing XVFB usage')
            return true
        }

        // Check Firefox options
        if (this.hasHeadlessFlag(caps['moz:firefoxOptions'], ['--headless', '-headless'])) {
            this.#log.info('Detected headless Firefox flag, forcing XVFB usage')
            return true
        }

        return false
    }

    /**
     * Check if browser options contain headless flags
     */
    private hasHeadlessFlag(options: { args?: string[] } | undefined, headlessFlags: string[]): boolean {
        if (!options?.args || !Array.isArray(options.args)) {
            return false
        }

        return options.args.some((arg: string) => {
            if (typeof arg !== 'string') {
                return false
            }
            return headlessFlags.some(flag =>
                arg === flag || (flag === '--headless' && arg.startsWith('--headless='))
            )
        })
    }

    protected async detectPackageManager(): Promise<string> {
        // Use override if provided (for testing)
        if (this.#packageManagerOverride) {
            return this.#packageManagerOverride
        }

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
                // Continue to next package manager
            }
        }

        return 'unknown'
    }

    #prefixSudoNonInteractive(cmd: string): string {
        // Prefix each sub-command (split by &&) with sudo -n
        return cmd
            .split('&&')
            .map((part) => {
                const p = part.trim()
                if (p.length === 0) {
                    return p
                }
                return `sudo -n ${p}`
            })
            .join(' && ')
    }

    #shellEscapeArray(args: string[]): string {
        // Properly escape shell arguments and join them
        return args
            .map(arg => {
                // If arg contains spaces or special characters, wrap in quotes
                if (/[\\$`"'\s]/.test(arg)) {
                    // Escape existing quotes and wrap in double quotes
                    return `"${arg.replace(/["\\$`]/g, '\\$&')}"`
                }
                return arg
            })
            .join(' ')
    }

    #getInstallMode(): 'root' | 'sudo' {
        const mode = this.#autoInstallMode
        return mode
    }

    #shouldSkipAutoInstall(isRoot: boolean, mode: 'root' | 'sudo', hasSudo: boolean, hasCustomCommand: boolean): boolean {
        if (hasCustomCommand) {
            return false
        }

        if (!isRoot && mode !== 'sudo') {
            this.#log.warn('Not running as root and sudo mode disabled; skipping auto-install')
            return true
        }

        if (!isRoot && mode === 'sudo' && !hasSudo) {
            this.#log.warn('Not running as root and sudo is not available; skipping auto-install')
            return true
        }

        return false
    }

    async #installXvfbPackages(): Promise<boolean> {
        // Determine privileges and desired mode
        const isRoot = typeof process.getuid === 'function' ? process.getuid() === 0 : false
        const mode = this.#getInstallMode()
        const hasCustomCommand = Boolean(this.#autoInstallCommand)

        let hasSudo = false
        if (!isRoot && mode === 'sudo') {
            try {
                await execAsync('which sudo')
                hasSudo = true
            } catch {
                hasSudo = false
            }
        }

        if (this.#shouldSkipAutoInstall(isRoot, mode, hasSudo, hasCustomCommand)) {
            return false
        }

        const command = await this.#getInstallCommand(isRoot, hasSudo)

        this.#log.info(`Installing xvfb packages using command: ${command}`)

        try {
            this.#log.info('Starting package installation command execution...')
            await execAsync(command, { timeout: 240000 }) // 4 minute timeout
            this.#log.info(
                'Package installation command completed successfully'
            )
            return true
        } catch (error) {
            this.#log.error('Package installation command failed:', error)
            throw error
        }
    }

    async #getInstallCommand(isRoot: boolean, hasSudo: boolean): Promise<string> {
        const customInstallCommand = this.#autoInstallCommand
            ? (Array.isArray(this.#autoInstallCommand) ? this.#shellEscapeArray(this.#autoInstallCommand) : this.#autoInstallCommand)
            : undefined

        if (customInstallCommand) {
            return customInstallCommand
        }

        this.#log.info('Detecting package manager...')
        const packageManager = await this.detectPackageManager()
        this.#log.info(`Detected package manager: ${packageManager}`)

        const installCommands: Record<string, string> = {
            apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
            dnf: 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb',
            yum: 'yum -y makecache && yum -y install xorg-x11-server-Xvfb',
            zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run',
            pacman: 'pacman -Sy --noconfirm xorg-server-xvfb',
            apk: 'apk update && apk add --no-cache xvfb-run',
            xbps: 'xbps-install -Sy xvfb-run',
        }

        if (!installCommands[packageManager]) {
            throw new Error(
                `Unsupported package manager: ${packageManager}. Please install Xvfb manually.`
            )
        }

        return !isRoot && hasSudo ? this.#prefixSudoNonInteractive(installCommands[packageManager]) : installCommands[packageManager]
    }

    /**
     * Execute a command with retry logic for xvfb failures
     */
    public async executeWithRetry<T>(
        commandFn: () => Promise<T>,
        context: string = 'xvfb operation'
    ): Promise<T> {
        let lastError: Error | unknown = null

        for (let attempt = 1; attempt <= this.#maxRetries; attempt++) {
            try {
                if (attempt === 1) {
                    this.#log.info(`🚀 Executing ${context}`)
                } else {
                    this.#log.info(`🔄 Retry attempt ${attempt}/${this.#maxRetries}: ${context}`)
                }

                const result = await commandFn()

                if (attempt > 1) {
                    this.#log.info(`✅ Success on attempt ${attempt}/${this.#maxRetries}`)
                }
                return result
            } catch (error: unknown) {
                this.#log.info(`❌ Attempt ${attempt}/${this.#maxRetries} failed: ${error}`)
                lastError = error

                // Check if this is an xvfb-related error that we should retry
                const errorMessage = error instanceof Error ? error.message : String(error)
                const isXvfbError = this.isXvfbError(errorMessage)

                if (!isXvfbError) {
                    this.#log.info('Non-xvfb error detected, not retrying')
                    throw error
                }

                if (attempt < this.#maxRetries) {
                    const delay = this.#retryDelay * attempt
                    this.#log.info(`⏳ Waiting ${delay}ms before retry...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                } else {
                    this.#log.info(`❌ All ${this.#maxRetries} attempts failed`)
                }
            }
        }

        throw lastError
    }

    /**
     * Check if an error is related to xvfb failures
     */
    private isXvfbError(errorMessage: string): boolean {
        const xvfbErrorPatterns = [
            'xvfb-run: error: Xvfb failed to start',
            'Xvfb failed to start',
            'xvfb-run: error:',
            'X server died'
        ]

        return xvfbErrorPatterns.some(pattern =>
            errorMessage.toLowerCase().includes(pattern.toLowerCase())
        )
    }
}
