import os from 'node:os'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { DisplayServer, DisplayServerOptions } from './types.js'
import { WaylandDisplayServer } from './WaylandDisplayServer.js'
import { XvfbDisplayServer } from './XvfbDisplayServer.js'

export class DisplayServerManager {
    #enabled: boolean
    #displayServerPreference: 'auto' | 'wayland' | 'xvfb'
    #autoInstall: boolean
    #autoInstallMode: 'root' | 'sudo'
    #autoInstallCommand?: string | string[]
    #maxRetries: number
    #retryDelay: number
    #force: boolean
    #log: ReturnType<typeof logger>
    #displayServer: DisplayServer | null = null

    constructor(options: DisplayServerOptions = {}) {
        // Support both old and new option names
        this.#enabled = options.enabled ?? options.autoXvfb ?? true
        this.#displayServerPreference = options.displayServer ?? 'auto'
        this.#autoInstall = options.autoInstall ?? options.xvfbAutoInstall ?? false
        this.#autoInstallMode = options.autoInstallMode ?? options.xvfbAutoInstallMode ?? 'sudo'
        this.#autoInstallCommand = options.autoInstallCommand ?? options.xvfbAutoInstallCommand
        this.#maxRetries = options.maxRetries ?? options.xvfbMaxRetries ?? 3
        this.#retryDelay = options.retryDelay ?? options.xvfbRetryDelay ?? 1000
        this.#force = options.force ?? false
        this.#log = logger('@wdio/display-server')

        // Log deprecation warnings
        if (options.autoXvfb !== undefined) {
            this.#log.warn('DEPRECATED: autoXvfb is deprecated, use enabled instead')
        }
        if (options.xvfbAutoInstall !== undefined) {
            this.#log.warn('DEPRECATED: xvfbAutoInstall is deprecated, use autoInstall instead')
        }
        if (options.xvfbAutoInstallMode !== undefined) {
            this.#log.warn('DEPRECATED: xvfbAutoInstallMode is deprecated, use autoInstallMode instead')
        }
        if (options.xvfbAutoInstallCommand !== undefined) {
            this.#log.warn('DEPRECATED: xvfbAutoInstallCommand is deprecated, use autoInstallCommand instead')
        }
        if (options.xvfbMaxRetries !== undefined) {
            this.#log.warn('DEPRECATED: xvfbMaxRetries is deprecated, use maxRetries instead')
        }
        if (options.xvfbRetryDelay !== undefined) {
            this.#log.warn('DEPRECATED: xvfbRetryDelay is deprecated, use retryDelay instead')
        }
    }

    /**
     * Check if display server should run on this system
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

        // Force display server if headless browser flags are detected
        const hasHeadlessFlag = this.#detectHeadlessMode(capabilities as unknown as WebdriverIO.Config['capabilities'])

        return inHeadlessEnvironment || hasHeadlessFlag
    }

    /**
     * Initialize display server for use
     */
    async init(capabilities?: Capabilities.ResolvedTestrunnerCapabilities): Promise<boolean> {
        this.#log.info('DisplayServerManager.init() called')

        if (!this.shouldRun(capabilities)) {
            this.#log.info('Display server not needed on current platform')
            return false
        }

        this.#log.info('Display server should run, selecting implementation...')

        try {
            const displayServer = await this.#selectDisplayServer(capabilities)

            if (displayServer) {
                this.#displayServer = displayServer
                this.#log.info(`${displayServer.name} display server is ready for use`)
                return true
            }

            this.#log.warn('No display server available; continuing without virtual display')
            return false
        } catch (error) {
            this.#log.error('Failed to setup display server:', error)
            throw error
        }
    }

    /**
     * Select and initialize appropriate display server
     */
    async #selectDisplayServer(capabilities?: Capabilities.ResolvedTestrunnerCapabilities): Promise<DisplayServer | null> {
        const wayland = new WaylandDisplayServer()
        const xvfb = new XvfbDisplayServer()

        // User override for specific display server
        if (this.#displayServerPreference === 'wayland') {
            this.#log.info('Wayland display server requested')
            if (await this.#ensureDisplayServerAvailable(wayland)) {
                this.#setupDisplayEnvironment(wayland, capabilities)
                return wayland
            }
            return null
        }

        if (this.#displayServerPreference === 'xvfb') {
            this.#log.info('Xvfb display server requested')
            if (await this.#ensureDisplayServerAvailable(xvfb)) {
                this.#setupDisplayEnvironment(xvfb, capabilities)
                return xvfb
            }
            return null
        }

        // Auto mode: Try Wayland first, then Xvfb fallback
        this.#log.info('Auto mode: Trying Wayland first...')
        if (await this.#ensureDisplayServerAvailable(wayland)) {
            this.#setupDisplayEnvironment(wayland, capabilities)
            return wayland
        }

        this.#log.info('Wayland not available, trying Xvfb fallback...')
        if (await this.#ensureDisplayServerAvailable(xvfb)) {
            this.#setupDisplayEnvironment(xvfb, capabilities)
            return xvfb
        }

        return null
    }

    /**
     * Ensure display server is available, installing if necessary
     */
    async #ensureDisplayServerAvailable(displayServer: DisplayServer): Promise<boolean> {
        if (await displayServer.isAvailable()) {
            this.#log.info(`${displayServer.name} is already available`)
            return true
        }

        if (!this.#autoInstall) {
            this.#log.warn(
                `${displayServer.name} not found. Skipping automatic installation. To enable auto-install, set 'displayServerAutoInstall: true' in your WDIO config.`
            )
            return false
        }

        this.#log.info(`Auto-installing ${displayServer.name}...`)
        return await displayServer.install({
            mode: this.#autoInstallMode,
            command: this.#autoInstallCommand
        })
    }

    /**
     * Setup environment and inject Chrome flags for display server
     */
    #setupDisplayEnvironment(displayServer: DisplayServer, capabilities?: Capabilities.ResolvedTestrunnerCapabilities): void {
        // Set environment variables
        const env = displayServer.getEnvironment()
        Object.entries(env).forEach(([key, value]) => {
            process.env[key] = value
        })

        // Inject Chrome flags for Wayland if needed
        if (displayServer.name === 'wayland' && capabilities) {
            this.#injectWaylandChromeFlags(capabilities)
        }
    }

    /**
     * Inject Wayland-specific Chrome flags into capabilities
     */
    #injectWaylandChromeFlags(capabilities: Capabilities.ResolvedTestrunnerCapabilities): void {
        const caps = capabilities as WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>

        // Handle single capability
        if (this.#isSingleCapability(caps)) {
            this.#addWaylandFlagsToCapability(caps)
        } else if (this.#isMultiRemoteCapability(caps)) {
            // Handle multiremote
            for (const [, browserConfig] of Object.entries(caps)) {
                const browserCaps = this.#extractCapabilitiesFromBrowserConfig(browserConfig)
                this.#addWaylandFlagsToCapability(browserCaps)
            }
        }
    }

    #isSingleCapability(caps: WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>): caps is WebdriverIO.Capabilities {
        return Boolean(
            caps['goog:chromeOptions'] ||
            caps['ms:edgeOptions'] ||
            caps['moz:firefoxOptions']
        )
    }

    #isMultiRemoteCapability(caps: WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>): caps is Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }> {
        return !this.#isSingleCapability(caps) && typeof caps === 'object' && caps !== null
    }

    #extractCapabilitiesFromBrowserConfig(browserConfig: { capabilities: WebdriverIO.Capabilities } | WebdriverIO.Capabilities): WebdriverIO.Capabilities {
        if (browserConfig && typeof browserConfig === 'object' && 'capabilities' in browserConfig && browserConfig.capabilities) {
            return browserConfig.capabilities
        }
        return browserConfig as WebdriverIO.Capabilities
    }

    #addWaylandFlagsToCapability(caps: WebdriverIO.Capabilities): void {
        // Only add flags for Chrome/Chromium/Edge
        const chromeOptions = caps['goog:chromeOptions'] || (caps as Record<string, unknown>).chromeOptions as { args?: string[] }
        const edgeOptions = caps['ms:edgeOptions'] || (caps as Record<string, unknown>).edgeOptions as { args?: string[] }

        if (chromeOptions) {
            chromeOptions.args = chromeOptions.args || []
            if (!chromeOptions.args.includes('--ozone-platform=wayland')) {
                chromeOptions.args.push('--ozone-platform=wayland', '--enable-features=UseOzonePlatform')
                this.#log.info('Added Wayland flags to Chrome capabilities')
            }
        }

        if (edgeOptions) {
            edgeOptions.args = edgeOptions.args || []
            if (!edgeOptions.args.includes('--ozone-platform=wayland')) {
                edgeOptions.args.push('--ozone-platform=wayland', '--enable-features=UseOzonePlatform')
                this.#log.info('Added Wayland flags to Edge capabilities')
            }
        }
    }

    /**
     * Detect if headless mode is enabled in browser capabilities
     */
    #detectHeadlessMode(capabilities?: WebdriverIO.Config['capabilities']): boolean {
        if (!capabilities) {
            return false
        }

        const caps = capabilities as WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>

        if (this.#isSingleCapability(caps)) {
            return this.#checkCapabilityForHeadless(caps)
        }

        if (this.#isMultiRemoteCapability(caps)) {
            for (const [, browserConfig] of Object.entries(caps)) {
                const browserCaps = this.#extractCapabilitiesFromBrowserConfig(browserConfig)
                if (this.#checkCapabilityForHeadless(browserCaps)) {
                    return true
                }
            }
        }

        return false
    }

    #checkCapabilityForHeadless(caps: WebdriverIO.Capabilities): boolean {
        if (!caps || typeof caps !== 'object') {
            return false
        }

        const chromeFlags = ['--headless']
        const firefoxFlags = ['--headless', '-headless']

        if (this.#hasHeadlessFlag(caps['goog:chromeOptions'], chromeFlags)) {
            this.#log.info('Detected headless Chrome flag, forcing display server usage')
            return true
        }

        if (this.#hasHeadlessFlag(caps['ms:edgeOptions'], chromeFlags)) {
            this.#log.info('Detected headless Edge flag, forcing display server usage')
            return true
        }

        if (this.#hasHeadlessFlag(caps['moz:firefoxOptions'], firefoxFlags)) {
            this.#log.info('Detected headless Firefox flag, forcing display server usage')
            return true
        }

        return false
    }

    #hasHeadlessFlag(options: { args?: string[] } | undefined, headlessFlags: string[]): boolean {
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

    /**
     * Get the active display server (if initialized)
     */
    getDisplayServer(): DisplayServer | null {
        return this.#displayServer
    }

    /**
     * Execute a function with retry logic for display server failures
     */
    async executeWithRetry<T>(
        commandFn: () => Promise<T>,
        context: string = 'display server operation'
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
}

// Default export for convenience
export const displayServer = new DisplayServerManager()
