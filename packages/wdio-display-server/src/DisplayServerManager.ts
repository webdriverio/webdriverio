import os from 'node:os'
import logger from '@wdio/logger'
import type { Options } from '@wdio/types'
import type { DisplayDaemon, DisplayDaemonOptions, DisplayServer, DisplayServerOptions } from './types.js'
import { WaylandDisplayServer } from './WaylandDisplayServer.js'
import { XvfbDisplayServer } from './XvfbDisplayServer.js'

// v9 config keys, still honored so existing configs keep working.
const RENAMED_KEYS = {
    autoXvfb: 'displayServerEnabled',
    xvfbAutoInstall: 'displayServerAutoInstall',
    xvfbAutoInstallMode: 'displayServerAutoInstallMode',
    xvfbAutoInstallCommand: 'displayServerAutoInstallCommand',
} as const
type RenamedKey = keyof typeof RENAMED_KEYS
const IGNORED_KEYS = ['xvfbMaxRetries', 'xvfbRetryDelay'] as const
const MIGRATION_GUIDE = 'https://webdriver.io/docs/v10-migration#virtual-displays-on-linux'

function warnAboutXvfbKeys(config: Options.Testrunner, preferringXvfb: boolean): void {
    const log = logger('@wdio/display-server')
    for (const [xvfbKey, key] of Object.entries(RENAMED_KEYS)) {
        if (config[xvfbKey as RenamedKey] !== undefined) {
            log.warn(`\`${xvfbKey}\` is deprecated, use \`${key}\` instead. See ${MIGRATION_GUIDE}`)
        }
    }
    for (const xvfbKey of IGNORED_KEYS) {
        if (config[xvfbKey] !== undefined) {
            log.warn(`\`${xvfbKey}\` is deprecated and has no effect, since display-server startup is not retried. See ${MIGRATION_GUIDE}`)
        }
    }
    if (preferringXvfb) {
        log.warn(`Preferring Xvfb, as v9 did, because the config sets v9 display keys; set \`displayServer\` to choose. See ${MIGRATION_GUIDE}`)
    }
}

export function optionsFromConfig(config: Options.Testrunner): DisplayServerOptions {
    const usesRenamedKeys = Object.entries(RENAMED_KEYS)
        .some(([xvfbKey, key]) => config[xvfbKey as RenamedKey] !== undefined && config[key] === undefined)
    const options: DisplayServerOptions = {
        enabled: config.displayServerEnabled ?? config.autoXvfb,
        displayServer: config.displayServer ?? (usesRenamedKeys ? 'xvfb' : undefined),
        autoInstall: config.displayServerAutoInstall ?? config.xvfbAutoInstall,
        autoInstallMode: config.displayServerAutoInstallMode ?? config.xvfbAutoInstallMode,
        autoInstallCommand: config.displayServerAutoInstallCommand ?? config.xvfbAutoInstallCommand,
    }
    warnAboutXvfbKeys(config, usesRenamedKeys && config.displayServer === undefined && options.enabled !== false)
    return options
}

export class DisplayServerManager {
    #enabled: boolean
    #displayServerPreference: 'auto' | 'wayland' | 'xvfb'
    #autoInstall: boolean
    #autoInstallMode: 'root' | 'sudo'
    #autoInstallCommand?: string | string[]
    #force: boolean
    #log: ReturnType<typeof logger>
    #displayServer: DisplayServer | null = null
    #wayland = new WaylandDisplayServer()
    #xvfb = new XvfbDisplayServer()

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
        return this.#skipReason() === undefined
    }

    // Why no display server is needed, or undefined when one is.
    #skipReason(): string | undefined {
        if (!this.#enabled) {
            return 'displayServerEnabled is false'
        }
        if (this.#force) {
            return undefined
        }
        if (os.platform() !== 'linux') {
            return 'not on Linux'
        }
        if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
            return 'DISPLAY or WAYLAND_DISPLAY is already set'
        }
        return undefined
    }

    async init(): Promise<boolean> {
        this.#log.info('DisplayServerManager.init() called')

        // Idempotent: a second init() must not re-select and overwrite
        // #displayServer, which may already back a running daemon.
        if (this.#displayServer) {
            return true
        }

        const skipReason = this.#skipReason()
        if (skipReason) {
            this.#log.info(`No display server needed: ${skipReason}`)
            return false
        }

        for await (const displayServer of this.#serverCandidates()) {
            this.#displayServer = displayServer
            this.#log.info(`${displayServer.name} display server is ready for use`)
            return true
        }
        this.#log.warn('No display server available; continuing without virtual display')
        return false
    }

    /** Starts the first candidate that comes up and makes it the active server; null when none is needed or none starts. */
    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon | null> {
        const skipReason = this.#skipReason()
        if (skipReason) {
            this.#log.info(`No display server needed: ${skipReason}`)
            return null
        }
        for await (const displayServer of this.#serverCandidates()) {
            try {
                const daemon = await displayServer.startDaemon(options)
                this.#displayServer = displayServer
                this.#log.info(`${displayServer.name} display server started`)
                return daemon
            } catch (error) {
                this.#log.warn(`${displayServer.name} failed to start: ${error instanceof Error ? error.message : String(error)}`)
            }
        }
        this.#log.warn('No display server could be started; continuing without a virtual display')
        return null
    }

    // Yielded lazily, so a server that starts means nothing later is probed or installed.
    // Installed servers come first, so an existing Xvfb is used before Weston is installed.
    async *#serverCandidates(): AsyncGenerator<DisplayServer> {
        const all = [this.#wayland, this.#xvfb]
        const preferred = all.filter((displayServer) => displayServer.name === this.#displayServerPreference)
        const order = preferred.length > 0 ? preferred : all

        const missing: DisplayServer[] = []
        for (const displayServer of order) {
            if (await displayServer.isAvailable()) {
                yield displayServer
            } else {
                missing.push(displayServer)
            }
        }
        for (const displayServer of missing) {
            if (!this.#autoInstall) {
                this.#log.warn(`${displayServer.name} not found. To enable auto-install, set 'displayServerAutoInstall: true' in your WDIO config.`)
                continue
            }
            // Probe before and after: a custom install command is shared by both servers,
            // so an earlier install may have provided this one, or provided the other instead.
            if (!await displayServer.isAvailable()) {
                this.#log.info(`Auto-installing ${displayServer.name}...`)
                if (!await displayServer.install({ mode: this.#autoInstallMode, command: this.#autoInstallCommand })) {
                    continue
                }
                if (!await displayServer.isAvailable()) {
                    this.#log.warn(`${displayServer.name} still not found after installing`)
                    continue
                }
            }
            yield displayServer
        }
    }

    getDisplayServer(): DisplayServer | null {
        return this.#displayServer
    }
}
