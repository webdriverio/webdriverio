import { startDisplayDaemonFromConfig } from '@wdio/display-server'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import { startAppium } from './appium.js'
import { DEBUGGER_WAIT_TIMEOUT_MS, waitForDebugger } from './browser.js'
import { markCloudResult, startCloudTunnel } from './cloud.js'
import { launchElectron } from './electron.js'
import { launchWebview, startDriver } from './webview.js'
import type { OpenPlan } from '../types.js'
// a value import would load webdriverio for every `wdio session` command (see cli.ts)
import type { remote } from 'webdriverio'

const log = logger('@wdio/session:launch')

export const SESSION_LOG_LEVELS = { '@wdio/session': 'info' } as const

export interface SessionResult {
    passed: boolean
    reason?: string
}

export interface Launched {
    browser: WebdriverIO.Browser
    /**
     * PIDs of child processes that must stay alive (driver, Appium, …)
     */
    pids: () => number[]
    /**
     * Call before `cleanup()`; no-op unless the plan is a cloud plan; rejects with SessionError on API failure.
     */
    markResult: (result: SessionResult) => Promise<void>
    cleanup: (died?: boolean) => Promise<void>
}

export interface LaunchOptions {
    /**
     * extra webdriverio `remote()` options, e.g. hooks (`beforeCommand`, `afterCommand`) or timeouts; capabilities stay owned by the plan.
     * Connection fields (hostname, port, protocol, path, user, key) override the plan's, so leave them out for cloud, grid and Appium plans.
     * `remote()` rejects a hook given as a single function although its type allows one; pass hooks as arrays.
     * Electron ignores it (the electron service creates the session), as do Tauri/Dioxus when the service provides `startWdioSession`.
     */
    remoteOptions?: Partial<Omit<Capabilities.WebdriverIOConfig, 'capabilities'>>
}

type Cleanup = () => Promise<unknown> | unknown

/**
 * Start everything the plan needs (display server, Appium, drivers) and
 * create the WebdriverIO browser object. The caller owns the returned
 * `cleanup()`: disposing an `AgentSession` does not end the browser.
 */
export async function launch (plan: OpenPlan, opts: LaunchOptions = {}): Promise<Launched> {
    const cleanups: Cleanup[] = []
    const pids: number[] = []
    const runCleanups = async () => {
        for (const fn of cleanups.splice(0).reverse()) {
            try {
                await fn()
            } catch (err) {
                log.warn(`Cleanup failed: ${(err as Error).message}`)
            }
        }
    }

    try {
        if (plan.display) {
            const daemon = await startDisplayDaemonFromConfig({ displayServer: 'auto' } as WebdriverIO.Config)
            if (daemon) {
                log.info(`Started display server (DISPLAY=${process.env.DISPLAY || ''}, WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY || ''})`)
                cleanups.push(() => daemon.stop())
            }
        }

        if (plan.tunnel) {
            const stop = await startCloudTunnel(plan)
            cleanups.push(stop)
        }

        if (plan.appium?.main) {
            const appium = await startAppium(plan)
            pids.push(appium.pid)
            cleanups.push(() => appium.stop())
        }

        let browser: WebdriverIO.Browser
        let end: (died?: boolean) => Promise<void>
        if (plan.mode === 'electron') {
            ;({ browser, end } = await launchElectron(plan))
        } else if (plan.platform === 'tauri' || plan.platform === 'dioxus') {
            const launched = await launchWebview(plan, opts.remoteOptions)
            browser = launched.browser
            end = launched.end
            if (typeof launched.pid === 'number') {
                pids.push(launched.pid)
            }
        } else {
            if (plan.driver) {
                const driver = await startDriver(plan.driver)
                pids.push(driver.pid)
                cleanups.push(() => driver.stop())
            }
            const caps = plan.capabilities as Record<string, { debuggerAddress?: string } | undefined>
            const debuggerAddress = caps['goog:chromeOptions']?.debuggerAddress ?? caps['ms:edgeOptions']?.debuggerAddress
            if (debuggerAddress) {
                await waitForDebugger(debuggerAddress, DEBUGGER_WAIT_TIMEOUT_MS)
            }
            browser = await (await import('webdriverio')).remote({
                ...plan.remote,
                logLevel: plan.remote.logLevel as 'warn',
                logLevels: SESSION_LOG_LEVELS,
                ...opts.remoteOptions,
                capabilities: plan.capabilities
            } as Parameters<typeof remote>[0])
            end = async (died) => {
                if (died) {
                    const driverPid = (browser.capabilities as Record<string, unknown>)['wdio:driverPID']
                    if (typeof driverPid === 'number') {
                        try {
                            process.kill(driverPid, 'SIGKILL')
                        } catch {
                            // already gone
                        }
                    }
                    return
                }
                if (plan.detach) {
                    const driverPid = (browser.capabilities as Record<string, unknown>)['wdio:driverPID']
                    if (typeof driverPid === 'number') {
                        try {
                            process.kill(driverPid, 'SIGTERM')
                        } catch {
                            // already gone
                        }
                    }
                    return
                }
                await browser.deleteSession()
            }
        }
        if (!plan.bidi) {
            /**
             * Chromium returns a BiDi socket even when `webSocketUrl` was
             * false, and the client connects to it. Drop that connection so
             * `--no-bidi` sessions stay classic.
             */
            (browser as unknown as { _bidiHandler?: { close: () => void } })._bidiHandler?.close()
        }
        const driverPid = (browser.capabilities as Record<string, unknown>)['wdio:driverPID']
        if (typeof driverPid === 'number') {
            pids.push(driverPid)
        }
        return {
            browser,
            pids: () => pids,
            markResult: (result) => plan.provider ? markCloudResult(plan, browser, result) : Promise.resolve(),
            cleanup: async (died) => {
                try {
                    await end(died)
                } catch (err) {
                    log.warn(`Ending the session failed: ${(err as Error).message}`)
                }
                await runCleanups()
            }
        }
    } catch (err) {
        await runCleanups()
        throw err
    }
}
