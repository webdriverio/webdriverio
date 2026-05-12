import logger from '@wdio/logger'
import type { Capabilities, Options, Services } from '@wdio/types'

import { DisplayServerManager } from './DisplayServerManager.js'
import type { DisplayDaemon, DisplayDaemonOptions, DisplayServerOptions } from './types.js'

export interface DisplayServerLauncherOptions extends DisplayServerOptions, DisplayDaemonOptions {}

export default class DisplayServerLauncher implements Services.HookFunctions {
    #manager: DisplayServerManager
    #daemonOptions: DisplayDaemonOptions
    #daemon: DisplayDaemon | null = null
    #daemonEnvKeys: string[] = []
    #signalHandler: (() => void) | null = null
    #log = logger('@wdio/display-server:launcher')

    constructor(options: DisplayServerLauncherOptions = {}) {
        this.#manager = new DisplayServerManager(options)
        this.#daemonOptions = {
            width: options.width,
            height: options.height,
            depth: options.depth,
        }
    }

    async onPrepare(
        _config: Options.Testrunner,
        capabilities: Capabilities.TestrunnerCapabilities
    ): Promise<void> {
        if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
            this.#log.info('DISPLAY/WAYLAND_DISPLAY already set; launcher daemon not needed')
            return
        }

        if (!this.#manager.shouldRun(capabilities as Capabilities.ResolvedTestrunnerCapabilities)) {
            this.#log.info('Display server not required on this platform/config')
            return
        }

        const ready = await this.#manager.init(capabilities as Capabilities.ResolvedTestrunnerCapabilities)
        if (!ready) {
            this.#log.warn('Display server init returned false; skipping daemon startup')
            return
        }

        const server = this.#manager.getDisplayServer()
        if (!server) {
            return
        }

        this.#daemon = await server.startDaemon(this.#daemonOptions)
        this.#daemonEnvKeys = Object.keys(this.#daemon.env)
        Object.assign(process.env, this.#daemon.env)
        this.#log.info(
            `Daemon ready (${server.name}); env: ${JSON.stringify(this.#daemon.env)}`
        )

        this.#registerCleanupHandlers()
    }

    async onComplete(): Promise<void> {
        await this.#stopDaemon()
    }

    async #stopDaemon(): Promise<void> {
        if (!this.#daemon) {
            return
        }
        const daemon = this.#daemon
        const envKeys = this.#daemonEnvKeys
        this.#daemon = null
        this.#daemonEnvKeys = []
        await daemon.stop()
        for (const key of envKeys) {
            delete process.env[key]
        }
        if (this.#signalHandler) {
            process.off('SIGINT', this.#signalHandler)
            process.off('SIGTERM', this.#signalHandler)
            process.off('exit', this.#signalHandler)
            this.#signalHandler = null
        }
    }

    #registerCleanupHandlers(): void {
        if (this.#signalHandler) {
            return
        }
        const handler = () => {
            // Best-effort sync cleanup: fire-and-forget the async stop.
            // Node's exit listeners must be synchronous; for SIGINT/SIGTERM the
            // process may exit before the promise settles, but the daemon
            // process is killed via SIGTERM/SIGKILL inside stop() which runs
            // synchronously enough to terminate the child.
            void this.#stopDaemon()
        }
        this.#signalHandler = handler
        process.once('SIGINT', handler)
        process.once('SIGTERM', handler)
        process.once('exit', handler)
    }
}
