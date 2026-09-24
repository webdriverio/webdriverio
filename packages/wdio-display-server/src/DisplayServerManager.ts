import os from 'node:os'
import logger from '@wdio/logger'
import type { Options } from '@wdio/types'
import type { DisplayServer, DisplayServerOptions } from './types.js'
import { WaylandDisplayServer } from './WaylandDisplayServer.js'
import { XvfbDisplayServer } from './XvfbDisplayServer.js'
import { executeWithRetry } from './utils.js'

export function optionsFromConfig(config: Options.Testrunner): DisplayServerOptions {
    return {
        enabled: config.displayServerEnabled,
        displayServer: config.displayServer,
        autoInstall: config.displayServerAutoInstall,
        autoInstallMode: config.displayServerAutoInstallMode,
        autoInstallCommand: config.displayServerAutoInstallCommand,
    }
}

// Daemon startup can fail transiently on spawn or readiness.
const DAEMON_START_MAX_RETRIES = 3
const DAEMON_START_RETRY_DELAY_MS = 1000

export class DisplayServerManager {
    #enabled: boolean
    #displayServerPreference: 'auto' | 'wayland' | 'xvfb'
    #autoInstall: boolean
    #autoInstallMode: 'root' | 'sudo'
    #autoInstallCommand?: string | string[]
    #force: boolean
    #log: ReturnType<typeof logger>
    #displayServer: DisplayServer | null = null

    constructor(options: DisplayServerOptions = {}) {
        this.#enabled = options.enabled ?? true
        this.#displayServerPreference = options.displayServer ?? 'auto'
        this.#autoInstall = options.autoInstall ?? false
        this.#autoInstallMode = options.autoInstallMode ?? 'sudo'
        this.#autoInstallCommand = options.autoInstallCommand
        this.#force = options.force ?? false
        this.#log = logger('@wdio/display-server')
    }

    shouldRun(): boolean {
        if (!this.#enabled) {
            return false
        }
        if (this.#force) {
            return true
        }

        if (os.platform() !== 'linux') {
            return false
        }

        return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY
    }

    async init(): Promise<boolean> {
        this.#log.info('DisplayServerManager.init() called')

        // Idempotent: a second init() must not re-select and overwrite
        // #displayServer, which may already back a running daemon.
        if (this.#displayServer) {
            return true
        }

        if (!this.shouldRun()) {
            this.#log.info('Display server not needed on current platform')
            return false
        }

        this.#log.info('Display server should run, selecting implementation...')

        try {
            const displayServer = await this.#selectDisplayServer()

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

    async #selectDisplayServer(): Promise<DisplayServer | null> {
        const wayland = new WaylandDisplayServer()
        const xvfb = new XvfbDisplayServer()

        if (this.#displayServerPreference === 'wayland') {
            this.#log.info('Wayland display server requested')
            return this.#tryDisplayServer(wayland)
        }

        if (this.#displayServerPreference === 'xvfb') {
            this.#log.info('Xvfb display server requested')
            return this.#tryDisplayServer(xvfb)
        }

        this.#log.info('Auto mode: Trying Wayland first...')
        const selected = await this.#tryDisplayServer(wayland)
        if (selected) {
            return selected
        }

        this.#log.info('Wayland not available, trying Xvfb fallback...')
        return this.#tryDisplayServer(xvfb)
    }

    // One place for the try/return that the four selection branches share.
    async #tryDisplayServer(displayServer: DisplayServer): Promise<DisplayServer | null> {
        if (await this.#ensureDisplayServerAvailable(displayServer)) {
            return displayServer
        }
        return null
    }

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

    getDisplayServer(): DisplayServer | null {
        return this.#displayServer
    }

    async executeWithRetry<T>(
        commandFn: () => Promise<T>,
        context: string = 'display server operation'
    ): Promise<T> {
        return executeWithRetry({
            fn: commandFn,
            maxRetries: DAEMON_START_MAX_RETRIES,
            retryDelay: DAEMON_START_RETRY_DELAY_MS,
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
