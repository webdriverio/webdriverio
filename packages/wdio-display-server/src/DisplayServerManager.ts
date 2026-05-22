import os from 'node:os'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { DisplayServer, DisplayServerOptions } from './types.js'
import { WaylandDisplayServer } from './WaylandDisplayServer.js'
import { XvfbDisplayServer } from './XvfbDisplayServer.js'
import { executeWithRetry } from './utils.js'

// ---------------------------------------------------------------------------
// Module-private helpers for walking WebdriverIO capability shapes.
//
// WDIO supports three capability shapes that all flow through the same APIs:
//   - single:       { browserName: 'chrome', ... }
//   - vendor-keyed: { 'goog:chromeOptions': {...} }
//   - multiremote:  { browserA: { capabilities: {...} }, browserB: ... }
//
// The injectDisplayFlags + headless-detection paths both need to visit every
// browser capability regardless of shape; these helpers centralise that walk.
// ---------------------------------------------------------------------------

type CapsRoot = WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }>

function isSingleCapability(caps: CapsRoot): caps is WebdriverIO.Capabilities {
    return Boolean(
        (caps as WebdriverIO.Capabilities)['goog:chromeOptions'] ||
        (caps as WebdriverIO.Capabilities)['ms:edgeOptions'] ||
        (caps as WebdriverIO.Capabilities)['moz:firefoxOptions'] ||
        'browserName' in caps
    )
}

function isMultiRemoteCapability(caps: CapsRoot): caps is Record<string, WebdriverIO.Capabilities | { capabilities: WebdriverIO.Capabilities }> {
    return !isSingleCapability(caps) && typeof caps === 'object' && caps !== null
}

function extractCapabilitiesFromBrowserConfig(
    browserConfig: { capabilities: WebdriverIO.Capabilities } | WebdriverIO.Capabilities
): WebdriverIO.Capabilities {
    if (browserConfig && typeof browserConfig === 'object' && 'capabilities' in browserConfig && browserConfig.capabilities) {
        return browserConfig.capabilities
    }
    return browserConfig as WebdriverIO.Capabilities
}

/**
 * Iterate over every browser capability in either a single-capability or
 * multiremote shape, invoking `visit` once per browser. No-op when caps is
 * null/undefined.
 */
function forEachBrowserCapability(
    capabilities: CapsRoot | WebdriverIO.Config['capabilities'] | undefined,
    visit: (cap: WebdriverIO.Capabilities) => void
): void {
    if (!capabilities) {
        return
    }
    const caps = capabilities as CapsRoot
    if (isSingleCapability(caps)) {
        visit(caps)
    } else if (isMultiRemoteCapability(caps)) {
        for (const [, browserConfig] of Object.entries(caps)) {
            visit(extractCapabilitiesFromBrowserConfig(browserConfig))
        }
    }
}

/**
 * Map a WebdriverIO config to the corresponding DisplayServerOptions. Pulls
 * out both the modern `displayServer*` keys and the legacy `xvfb*` / `autoXvfb`
 * aliases so callers (e.g. LocalRunner) don't have to know about either
 * vocabulary — the DisplayServerManager constructor handles the precedence
 * + deprecation warnings.
 */
export function optionsFromConfig(config: WebdriverIO.Config): DisplayServerOptions {
    return {
        enabled: config.displayServerEnabled,
        autoXvfb: config.autoXvfb,
        displayServer: config.displayServer,
        autoInstall: config.displayServerAutoInstall,
        xvfbAutoInstall: config.xvfbAutoInstall,
        autoInstallMode: config.displayServerAutoInstallMode,
        xvfbAutoInstallMode: config.xvfbAutoInstallMode,
        autoInstallCommand: config.displayServerAutoInstallCommand,
        xvfbAutoInstallCommand: config.xvfbAutoInstallCommand,
        maxRetries: config.displayServerMaxRetries,
        xvfbMaxRetries: config.xvfbMaxRetries,
        retryDelay: config.displayServerRetryDelay,
        xvfbRetryDelay: config.xvfbRetryDelay,
    }
}

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
    #initialized = false

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

        // Once init() has run on this instance we know a display is active and
        // workers must use it, regardless of what process.env now shows.
        if (this.#enabled && this.#initialized) {
            return true
        }

        const hasDisplay = process.env.DISPLAY || process.env.WAYLAND_DISPLAY
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
                this.#initialized = true
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
     * Inject the active display server's Chrome / Edge / Electron flags.
     *
     * Env vars are not set here; the caller (`startDisplayDaemonFromConfig`)
     * applies them only after the daemon socket is ready, so child processes
     * never see a display address with no server behind it.
     */
    #setupDisplayEnvironment(displayServer: DisplayServer, capabilities?: Capabilities.ResolvedTestrunnerCapabilities): void {
        if (capabilities && displayServer.getChromeFlags().length > 0) {
            this.#injectDisplayServerFlags(capabilities, displayServer.getChromeFlags())
        }
    }

    /**
     * Inject the active display server's flags into every browser capability.
     */
    #injectDisplayServerFlags(
        capabilities: Capabilities.ResolvedTestrunnerCapabilities,
        flags: string[],
    ): void {
        if (flags.length === 0) {
            return
        }
        forEachBrowserCapability(capabilities as never, (cap) => this.#addFlagsToCapability(cap, flags))
    }

    #addFlagsToCapability(caps: WebdriverIO.Capabilities, flags: string[]): void {
        let chromeOptions = caps['goog:chromeOptions'] || (caps as Record<string, unknown>).chromeOptions as { args?: string[] }
        let edgeOptions = caps['ms:edgeOptions'] || (caps as Record<string, unknown>).edgeOptions as { args?: string[] }
        const electronOptions = (caps as Record<string, unknown>)['wdio:electronServiceOptions'] as { appArgs?: string[] } | undefined

        // Create options objects for bare caps like { browserName: 'chrome' }
        if (!chromeOptions && (caps.browserName === 'chrome' || caps.browserName === 'chromium')) {
            caps['goog:chromeOptions'] = { args: [] }
            chromeOptions = caps['goog:chromeOptions']
        }
        // Selenium accepts both 'MicrosoftEdge' (W3C canonical) and 'msedge'.
        if (!edgeOptions && (caps.browserName === 'MicrosoftEdge' || caps.browserName === 'msedge')) {
            caps['ms:edgeOptions'] = { args: [] }
            edgeOptions = caps['ms:edgeOptions']
        }

        // De-duplicate by `--ozone-platform=...` token so re-injecting (per
        // worker) or layering a config-level user flag doesn't double up.
        const hasOzoneFlag = (args: string[] | undefined): boolean =>
            !!args?.some(arg => typeof arg === 'string' && arg.startsWith('--ozone-platform='))

        if (chromeOptions) {
            chromeOptions.args = chromeOptions.args || []
            if (!hasOzoneFlag(chromeOptions.args)) {
                chromeOptions.args.push(...flags)
                this.#log.info(`Added display-server flags to Chrome capabilities: ${flags.join(' ')}`)
            }
        }

        if (edgeOptions) {
            edgeOptions.args = edgeOptions.args || []
            if (!hasOzoneFlag(edgeOptions.args)) {
                edgeOptions.args.push(...flags)
                this.#log.info(`Added display-server flags to Edge capabilities: ${flags.join(' ')}`)
            }
        }

        // Electron: appArgs reach the spawned Electron process. The env hint
        // ELECTRON_OZONE_PLATFORM_HINT isn't authoritative enough on Wayland
        // hosts; a CLI `--ozone-platform=...` is.
        if (electronOptions) {
            electronOptions.appArgs = electronOptions.appArgs || []
            if (!hasOzoneFlag(electronOptions.appArgs)) {
                electronOptions.appArgs.push(...flags)
                this.#log.info(`Added display-server flags to Electron appArgs: ${flags.join(' ')}`)
            }
        }
    }

    /**
     * Detect if headless mode is enabled in browser capabilities. Returns true
     * if any browser capability has a headless flag set.
     */
    #detectHeadlessMode(capabilities?: WebdriverIO.Config['capabilities']): boolean {
        let isHeadless = false
        forEachBrowserCapability(capabilities, (cap) => {
            if (this.#checkCapabilityForHeadless(cap)) {
                isHeadless = true
            }
        })
        return isHeadless
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
     * Inject the active display server's flags into a worker's capabilities.
     * Per-worker — init() only runs for the first worker.
     *
     * If this manager didn't start a daemon but `WAYLAND_DISPLAY` is set
     * externally (outer `xvfb-run`, existing Wayland session, etc.), Chrome
     * still needs `--ozone-platform=wayland` so it doesn't fall back to a
     * missing X11 server. No equivalent for an externally-set `DISPLAY`:
     * Chromium's default is X11 anyway.
     */
    injectDisplayFlags(capabilities: Capabilities.ResolvedTestrunnerCapabilities): void {
        if (!capabilities) {
            return
        }
        if (this.#displayServer) {
            this.#injectDisplayServerFlags(capabilities, this.#displayServer.getChromeFlags())
            return
        }
        if (process.env.WAYLAND_DISPLAY) {
            this.#injectDisplayServerFlags(capabilities, [
                '--ozone-platform=wayland',
                '--enable-features=UseOzonePlatform',
            ])
        }
    }

    /**
     * Retry a function with this manager's configured maxRetries/retryDelay.
     * Thin facade over the generic helper in utils.ts; kept here as a method
     * because (a) it lets the factory continue calling `manager.executeWithRetry`
     * without knowing the retry config, and (b) the legacy XvfbManager export
     * surface expects this method.
     */
    async executeWithRetry<T>(
        commandFn: () => Promise<T>,
        context: string = 'display server operation'
    ): Promise<T> {
        return executeWithRetry({
            fn: commandFn,
            maxRetries: this.#maxRetries,
            retryDelay: this.#retryDelay,
            log: this.#log,
            context,
        })
    }
}

// Lazy singleton — avoids side-effects (logger init, option parsing) at import time.
// Methods are bound to _defaultInstance so private-field access inside them works.
let _defaultInstance: DisplayServerManager | undefined
export const displayServer: DisplayServerManager = new Proxy({} as DisplayServerManager, {
    get(_, prop) {
        _defaultInstance ??= new DisplayServerManager()
        const value = Reflect.get(_defaultInstance, prop, _defaultInstance)
        return typeof value === 'function' ? (value as Function).bind(_defaultInstance) : value
    }
})
