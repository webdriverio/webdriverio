import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import { DisplayServerManager, optionsFromConfig } from './DisplayServerManager.js'
import { sessionEnv } from './sessionEnv.js'
import type { DisplayDaemon, DisplayDaemonOptions } from './types.js'

const log = logger('@wdio/display-server:daemon')

export interface RunningDaemon {
    /** Stops the daemon, if any, and restores the `process.env` values it changed. */
    stop(): Promise<void>
}

function daemonOptionsFromConfig(config: Options.Testrunner): DisplayDaemonOptions {
    return {
        width: config.displayServerWidth,
        height: config.displayServerHeight,
        depth: config.displayServerDepth,
    }
}

function applyEnv(env: Readonly<Record<string, string>>): () => void {
    const previous = Object.keys(env).map((key) => [key, process.env[key]] as const)
    Object.assign(process.env, env)
    return () => {
        for (const [key, value] of previous) {
            if (value === undefined) {
                delete process.env[key]
            } else {
                process.env[key] = value
            }
        }
    }
}

/**
 * Start a persistent display-server daemon (Wayland/Weston or Xvfb) and publish
 * its env onto `process.env`, so any child process, including drivers spawned
 * from a service's `onPrepare`, inherits the display.
 *
 * With `WAYLAND_DISPLAY` set and no `DISPLAY`, it starts nothing and sets the Wayland
 * session vars instead. Otherwise it returns `null` when:
 *  - `DISPLAY` is already set,
 *  - `shouldRun()` says no, or
 *  - no display server is available or installable.
 *
 * Intended to be called from a `Runner`'s `initialize()`, which runs before
 * any service `onPrepare`.
 *
 * @param manager Optional pre-constructed manager; tests inject one to avoid
 *   real Xvfb/Weston spawns.
 */
export async function startDisplayDaemonFromConfig(
    config: Options.Testrunner,
    manager: DisplayServerManager = new DisplayServerManager(optionsFromConfig(config)),
): Promise<RunningDaemon | null> {
    if (process.env.WAYLAND_DISPLAY && !process.env.DISPLAY) {
        // Without XDG_SESSION_TYPE=wayland, whether unset or tty over SSH, Chrome picks X11.
        const env = sessionEnv('wayland')
        log.info(`Existing Wayland display; setting ${JSON.stringify(env)}`)
        const restoreEnv = applyEnv(env)
        return { stop: async () => restoreEnv() }
    }

    if (process.env.DISPLAY) {
        log.info('DISPLAY already set; daemon not needed')
        return null
    }

    if (!manager.shouldRun()) {
        log.info('Display server not required on this platform/config')
        return null
    }

    const ready = await manager.init()
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

    const restoreEnv = applyEnv(daemon.env)
    log.info(`Daemon ready (${server.name}); env: ${JSON.stringify(daemon.env)}`)

    // Memoize the in-flight stop promise (not a sync flag) so the 'exit' listener
    // can still run daemon.stopSync() while an async stop() is mid-flight —
    // otherwise 'exit' fires before stop() resolves and orphans the child.
    let stopPromise: Promise<void> | null = null
    let signalHandler: (() => void) | null = null
    let exitHandler: (() => void) | null = null

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
