import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import type { OpenPlan } from '../types.js'

const log = logger('@wdio/session:launch')

export const SESSION_LOG_LEVELS = { '@wdio/session': 'info' } as const

export interface Launched {
    browser: WebdriverIO.Browser
    /**
     * PIDs of child processes that must stay alive (driver, Appium, …)
     */
    pids: () => number[]
    cleanup: (died?: boolean) => Promise<void>
}

type Cleanup = () => Promise<unknown> | unknown

/**
 * Start everything the plan needs (display server, Appium, drivers) and
 * create the WebdriverIO browser object.
 */
export async function launch (plan: OpenPlan): Promise<Launched> {
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
            const { startDisplayDaemonFromConfig } = await import('@wdio/display-server')
            const daemon = await startDisplayDaemonFromConfig(
                { displayServer: 'auto' } as WebdriverIO.Config,
                [plan.capabilities] as Capabilities.TestrunnerCapabilities
            )
            if (daemon) {
                log.info(`Started display server (DISPLAY=${process.env.DISPLAY || ''}, WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY || ''})`)
                cleanups.push(() => daemon.stop())
            }
        }

        if (plan.tunnel) {
            const { startCloudTunnel } = await import('./cloud.js')
            const stop = await startCloudTunnel(plan)
            cleanups.push(stop)
        }

        if (plan.appium?.main) {
            const { startAppium } = await import('./appium.js')
            const appium = await startAppium(plan)
            pids.push(appium.pid)
            cleanups.push(() => appium.stop())
        }

        let browser: WebdriverIO.Browser
        let end: (died?: boolean) => Promise<void>
        if (plan.mode === 'electron') {
            const { launchElectron } = await import('./electron.js')
            ;({ browser, end } = await launchElectron(plan))
        } else if (plan.platform === 'tauri' || plan.platform === 'dioxus') {
            const { launchWebview } = await import('./webview.js')
            const launched = await launchWebview(plan)
            browser = launched.browser
            end = launched.end
            if (typeof launched.pid === 'number') {
                pids.push(launched.pid)
            }
        } else {
            if (plan.driver) {
                const { startDriver } = await import('./webview.js')
                const driver = await startDriver(plan.driver)
                pids.push(driver.pid)
                cleanups.push(() => driver.stop())
            }
            const { remote } = await import('webdriverio')
            browser = await remote({
                ...plan.remote,
                logLevel: plan.remote.logLevel as 'warn',
                logLevels: SESSION_LOG_LEVELS,
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
