import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import { DisplayServerManager, optionsFromConfig } from './DisplayServerManager.js'
import { sessionEnv } from './sessionEnv.js'
import type { DisplayDaemonOptions } from './types.js'

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
 * session vars instead. Otherwise it returns `null` when `shouldRun()` says no or no
 * display server could be started.
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
        const env = sessionEnv('wayland') // XDG_SESSION_TYPE may be tty, e.g. over SSH, which sends Chrome and GTK apps to X11
        log.info(`Existing Wayland display; setting ${JSON.stringify(env)}`)
        const restoreEnv = applyEnv(env)
        return { stop: async () => restoreEnv() }
    }

    const daemon = await manager.startDaemon(daemonOptionsFromConfig(config))
    if (!daemon) {
        return null
    }

    const restoreEnv = applyEnv(daemon.env)
    log.info(`Display server env: ${JSON.stringify(daemon.env)}`)

    return {
        stop: async () => {
            try {
                await daemon.stop()
            } finally {
                restoreEnv()
            }
        },
    }
}
