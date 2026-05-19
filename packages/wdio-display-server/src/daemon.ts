import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import { DisplayServerManager, optionsFromConfig } from './DisplayServerManager.js'
import type { DisplayDaemon, DisplayDaemonOptions } from './types.js'

const log = logger('@wdio/display-server:daemon')

/**
 * Handle returned by {@link startDisplayDaemonFromConfig}. Stopping reverses
 * both the daemon process and the env mutation made on `process.env`.
 */
export interface RunningDaemon {
    stop(): Promise<void>
}

interface ResolvedDaemonOptions {
    width?: number
    height?: number
    depth?: number
}

function daemonOptionsFromConfig(config: WebdriverIO.Config): ResolvedDaemonOptions {
    return {
        width: config.displayServerWidth,
        height: config.displayServerHeight,
        depth: config.displayServerDepth,
    }
}

/**
 * Start a persistent display-server daemon (Wayland/Weston or Xvfb) and
 * publish its env (`DISPLAY` / `WAYLAND_DISPLAY` / `XDG_RUNTIME_DIR` / ...)
 * onto `process.env`, so that **any** subsequently `fork()`ed or `spawn()`ed
 * child — including drivers spawned from a service's `onPrepare` — inherits
 * the display.
 *
 * Returns `null` (no-op) when:
 *  - not Linux,
 *  - `displayServerEnabled === false` (or its legacy alias `autoXvfb: false`),
 *  - the configured `displayServer` is unselectable (`shouldRun() === false`),
 *  - or `process.env.DISPLAY` / `process.env.WAYLAND_DISPLAY` is already set
 *    (someone wrapped us with `xvfb-run`, or we're running on a real desktop
 *    session). In that case downstream children already see a display via the
 *    inherited env; starting our own daemon would only be a duplicate.
 *
 * Intended to be called from a `Runner`'s `initialize()` hook (see
 * `@wdio/local-runner`), which runs **before** any service `onPrepare` —
 * fixing the ordering race that the previous `DisplayServerLauncher` service
 * (`onPrepare`-based) couldn't avoid because `runServiceHook` invokes service
 * hooks in parallel via `Promise.all`.
 *
 * @param manager Optional pre-constructed manager; if omitted, one is built
 *   from `optionsFromConfig(config)`. Tests inject a manager to avoid actual
 *   Xvfb/Weston spawns.
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
    const daemon: DisplayDaemon = await server.startDaemon(daemonOptions)

    // Record any keys we're about to overwrite so stop() can restore them.
    const envKeys = Object.keys(daemon.env)
    const savedEnv: Record<string, string> = {}
    for (const key of envKeys) {
        if (key in process.env) {
            savedEnv[key] = process.env[key] as string
        }
    }
    Object.assign(process.env, daemon.env)
    log.info(`Daemon ready (${server.name}); env: ${JSON.stringify(daemon.env)}`)

    let stopped = false
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

    const stop = async (): Promise<void> => {
        if (stopped) {
            return
        }
        stopped = true
        try {
            await daemon.stop()
        } finally {
            restoreEnv()
            deregisterHandlers()
        }
    }

    // Split handlers by what Node's lifecycle permits:
    //
    // - SIGINT / SIGTERM are received while the event loop is still running,
    //   so we can do the full async `stop()` (await graceful child exit,
    //   await rm of the runtime dir) before the process actually goes away.
    //
    // - 'exit' fires when the process is about to terminate; listeners are
    //   synchronous and any async work scheduled inside them is abandoned.
    //   Use the daemon's `stopSync()` so the child is killed via SIGKILL and
    //   runtime files are removed via `rmSync` before Node tears down.
    signalHandler = () => {
        void stop()
    }
    exitHandler = () => {
        if (stopped) {
            return
        }
        stopped = true
        try {
            daemon.stopSync()
        } catch {
            // 'exit' listeners must never throw — Node will abort the process
            // with an uncaught exception otherwise.
        }
        restoreEnv()
        // Don't deregisterHandlers() — we're exiting; removing listeners
        // costs nothing and may race with Node's own teardown.
    }
    process.once('SIGINT', signalHandler)
    process.once('SIGTERM', signalHandler)
    process.once('exit', exitHandler)

    return { stop }
}
