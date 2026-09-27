import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import { DisplayServerManager, optionsFromConfig } from './DisplayServerManager.js'
import type { DisplayDaemon, DisplayDaemonOptions } from './types.js'

const log = logger('@wdio/display-server:daemon')

/** Stopping reverses both the daemon process and the env mutation on `process.env`. */
export interface RunningDaemon {
    stop(): Promise<void>
}

function daemonOptionsFromConfig(config: WebdriverIO.Config): DisplayDaemonOptions {
    return {
        width: config.displayServerWidth,
        height: config.displayServerHeight,
        depth: config.displayServerDepth,
    }
}

/**
 * Start a persistent display-server daemon (Wayland/Weston or Xvfb) and publish
 * its env onto `process.env`, so any child process — including drivers spawned
 * from a service's `onPrepare` — inherits the display.
 *
 * Returns `null` (no-op) when:
 *  - not Linux,
 *  - `displayServerEnabled` is false,
 *  - `shouldRun()` says no, or
 *  - `DISPLAY` / `WAYLAND_DISPLAY` is already on `process.env`.
 *
 * Intended to be called from a `Runner`'s `initialize()`, which runs before
 * any service `onPrepare`.
 *
 * @param manager Optional pre-constructed manager; tests inject one to avoid
 *   real Xvfb/Weston spawns.
 */
export async function startDisplayDaemonFromConfig(
    config: WebdriverIO.Config,
    capabilities: Capabilities.TestrunnerCapabilities,
    manager: DisplayServerManager = new DisplayServerManager(optionsFromConfig(config)),
): Promise<RunningDaemon | null> {
    if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
        log.info('DISPLAY/WAYLAND_DISPLAY already set; daemon not needed')
        return null
    }

    if (!manager.shouldRun(capabilities as Capabilities.ResolvedTestrunnerCapabilities)) {
        log.info('Display server not required on this platform/config')
        return null
    }

    const ready = await manager.init(capabilities as Capabilities.ResolvedTestrunnerCapabilities)
    if (!ready) {
        log.warn('Display server init returned false; skipping daemon startup')
        return null
    }

    const server = manager.getDisplayServer()
    if (!server) {
        return null
    }

    const daemonOptions: DisplayDaemonOptions = daemonOptionsFromConfig(config)
    // Spawn is the most transient failure mode, so it's the step worth retrying.
    const daemon: DisplayDaemon = await manager.executeWithRetry(
        () => server.startDaemon(daemonOptions),
        `${server.name} daemon startup`,
    )

    // Capture pre-existing values so stop() can restore them.
    const envKeys = Object.keys(daemon.env)
    const savedEnv: Record<string, string> = {}
    for (const key of envKeys) {
        if (key in process.env) {
            savedEnv[key] = process.env[key] as string
        }
    }
    Object.assign(process.env, daemon.env)
    log.info(`Daemon ready (${server.name}); env: ${JSON.stringify(daemon.env)}`)

    // Memoize the in-flight stop promise (not a sync flag) so the 'exit' listener
    // can still run daemon.stopSync() while an async stop() is mid-flight —
    // otherwise 'exit' fires before stop() resolves and orphans the child.
    let stopPromise: Promise<void> | null = null
    let signalHandler: (() => void) | null = null
    let exitHandler: (() => void) | null = null

    const restoreEnv = (): void => {
        for (const key of envKeys) {
            if (key in savedEnv) {
                process.env[key] = savedEnv[key]
            } else {
                delete process.env[key]
            }
        }
    }

    const deregisterHandlers = (): void => {
        if (signalHandler) {
            process.off('SIGINT', signalHandler)
            process.off('SIGTERM', signalHandler)
            signalHandler = null
        }
        if (exitHandler) {
            process.off('exit', exitHandler)
            exitHandler = null
        }
    }

    const stop = (): Promise<void> => {
        if (stopPromise) {
            return stopPromise
        }
        stopPromise = (async () => {
            try {
                await daemon.stop()
            } finally {
                restoreEnv()
                deregisterHandlers()
            }
        })()
        return stopPromise
    }

    // SIGINT/SIGTERM run with the event loop alive — full async stop() is fine.
    // 'exit' listeners are sync; async work is abandoned, so call daemon.stopSync()
    // before Node tears down. The display-server layer guards stopSync() against
    // re-entry, so it's safe even after an async stop().
    signalHandler = () => {
        // Catch only to avoid an unhandled rejection; stop() cleans up in its own finally.
        stop().catch((err) => log.error(`Failed to stop display daemon: ${err instanceof Error ? err.message : String(err)}`))
    }
    exitHandler = () => {
        try {
            daemon.stopSync()
        } catch { /* swallow — 'exit' listeners must not throw */ }
        restoreEnv()
        // No deregisterHandlers() — we're exiting anyway.
    }
    process.once('SIGINT', signalHandler)
    process.once('SIGTERM', signalHandler)
    process.once('exit', exitHandler)

    return { stop }
}
