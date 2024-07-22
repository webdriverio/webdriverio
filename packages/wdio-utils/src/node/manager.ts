import logger from '@wdio/logger'
import type { Options, Capabilities } from '@wdio/types'

import {
    getCacheDir, getDriverOptions, setupChromedriver, setupEdgedriver,
    setupGeckodriver, setupPuppeteerBrowser
} from './utils.js'
import { definesRemoteDriver, isSafari, isEdge, isFirefox, isChrome } from '../utils.js'

const log = logger('@wdio/utils')
const UNDEFINED_BROWSER_VERSION = null

type SetupTaskFunction = (cap: WebdriverIO.Capabilities) => Promise<unknown>

enum BrowserDriverTaskLabel {
    BROWSER = 'browser binaries',
    DRIVER = 'browser driver'
}

function mapCapabilities (
    options: Options.WebdriverIO,
    caps: Capabilities.TestrunnerCapabilities,
    task: SetupTaskFunction,
    taskItemLabel: string) {
    const capabilitiesToRequireSetup = (
        Array.isArray(caps)
            ? caps.map((cap: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities) => {
                const w3cCaps = cap as Capabilities.W3CCapabilities
                const multiremoteCaps = cap as Capabilities.RequestedMultiremoteCapabilities
                const multiremoteInstanceNames = Object.keys(multiremoteCaps)

                if (typeof multiremoteCaps[multiremoteInstanceNames[0]] === 'object' && 'capabilities' in multiremoteCaps[multiremoteInstanceNames[0]]) {
                    return Object.values(multiremoteCaps).map((c: Capabilities.WithRequestedCapabilities) => (
                        'alwaysMatch' in c.capabilities
                            ? c.capabilities.alwaysMatch
                            : c.capabilities
                    ))
                }

                if (w3cCaps.alwaysMatch) {
                    return w3cCaps.alwaysMatch
                }
                return cap as WebdriverIO.Capabilities
            }).flat()
            : Object.values(caps as Capabilities.WithRequestedMultiremoteCapabilities['capabilities']).map((mrOpts) => {
                const w3cCaps = mrOpts.capabilities as Capabilities.W3CCapabilities
                if (w3cCaps.alwaysMatch) {
                    return w3cCaps.alwaysMatch
                }
                return mrOpts.capabilities as WebdriverIO.Capabilities
            })
    ).flat().filter((cap) => (
        /**
         * only set up driver if
         */
        // - capabilities are defined and not empty
        cap &&
        // - browserName is defined so we know it is a browser session
        cap.browserName &&
        // - we are not about to run a cloud session
        !definesRemoteDriver(options) &&
        // - we are not running Safari (driver already installed on macOS)
        !isSafari(cap.browserName) &&
        // - driver options don't define a binary path
        !getDriverOptions(cap).binary &&
        // - environment does not define a binary path
        !(process.env.CHROMEDRIVER_PATH && isChrome(cap.browserName))
    )) as WebdriverIO.Capabilities[]

    /**
     * nothing to setup
     */
    if (capabilitiesToRequireSetup.length === 0) {
        return
    }

    /**
     * get all browser names and versions that need driver setup
     */
    const queueByBrowserName = capabilitiesToRequireSetup.reduce((queue, cap) => {
        if (!cap.browserName) {
            return queue
        }
        if (!queue.has(cap.browserName)) {
            queue.set(cap.browserName, new Map<string, WebdriverIO.Capabilities>())
        }
        const browserVersion = cap.browserVersion || UNDEFINED_BROWSER_VERSION
        queue.get(cap.browserName)!.set(browserVersion, cap)
        return queue
    }, new Map())

    const driverToSetupString = Array.from(queueByBrowserName.entries())
        .map(([browserName, versions]) => `${browserName}@${Array.from(versions.keys()).map((bv) => bv || 'stable').join(', ')}`)
        .join(' - ')

    log.info(`Setting up ${taskItemLabel} for: ${driverToSetupString}`)
    return Promise.all(
        Array.from(queueByBrowserName.entries()).map(([browserName, queueByBrowserVersion]) => {
            return Array.from(queueByBrowserVersion).map(([browserVersion, cap]) => task({
                ...cap,
                browserName,
                ...(browserVersion !== UNDEFINED_BROWSER_VERSION ? { browserVersion } : {})
            }))
        }).flat()
    )
}

export async function setupDriver (options: Omit<Options.WebDriver, 'capabilities'>, caps: Capabilities.TestrunnerCapabilities) {
    return mapCapabilities(options, caps, async (cap: WebdriverIO.Capabilities) => {
        const cacheDir = getCacheDir(options, cap)
        if (isEdge(cap.browserName)) {
            return setupEdgedriver(cacheDir, cap.browserVersion)
        } else if (isFirefox(cap.browserName)) {
            // "latest" works for setting up browser only but not geckodriver
            const version = cap.browserVersion === 'latest' ? undefined : cap.browserVersion
            return setupGeckodriver(cacheDir, version)
        } else if (isChrome(cap.browserName)) {
            return setupChromedriver(cacheDir, cap.browserVersion)
        }

        return Promise.resolve()
    }, BrowserDriverTaskLabel.DRIVER)
}

export function setupBrowser (options: Omit<Options.WebDriver, 'capabilities'>, caps: Capabilities.TestrunnerCapabilities) {
    return mapCapabilities(options, caps, async (cap: WebdriverIO.Capabilities) => {
        const cacheDir = getCacheDir(options, cap)
        if (isEdge(cap.browserName)) {
            // not yet implemented
            return Promise.resolve()
        } else if (isChrome(cap.browserName) || isFirefox(cap.browserName)) {
            return setupPuppeteerBrowser(cacheDir, cap)
        }

        return Promise.resolve()
    }, BrowserDriverTaskLabel.BROWSER)
}
