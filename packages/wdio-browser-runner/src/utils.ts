import util from 'node:util'

import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { CoverageSummary } from 'istanbul-lib-coverage'

import { COVERAGE_FACTORS, GLOBAL_TRESHOLD_REPORTING, FILE_TRESHOLD_REPORTING } from './constants.js'
import type { BrowserRunnerOptions, CoverageOptions } from './types.js'

const log = logger('@wdio/browser-runner')

/**
 * `create-wdio` writes `MicrosoftEdge`, which is also what msedgedriver reports
 */
const EDGE_BROWSER_NAMES = ['msedge', 'edge', 'microsoftedge']

/**
 * Bring the `host` option into the `<protocol>://<hostname>` form the base URL
 * is built from, e.g. `192.168.1.10/` becomes `http://192.168.1.10`
 */
export function normalizeHost (host?: string) {
    if (!host) {
        return
    }
    const withProtocol = host.includes('://') ? host : `http://${host}`
    return withProtocol.replace(/\/+$/, '')
}

/**
 * The capability that is actually used: `alwaysMatch` of W3C capabilities or the capabilities themselves
 */
export function getEffectiveCapability (caps: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
    return (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
}

/**
 * Merge options into the effective capability, keeping W3C capabilities
 * (`alwaysMatch` + `firstMatch`) in their shape
 */
export function mergeIntoCapability (caps: WebdriverIO.Capabilities, options: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
    const merged = deepmerge(getEffectiveCapability(caps), options) as WebdriverIO.Capabilities
    return (caps as Capabilities.W3CCapabilities).alwaysMatch
        ? { ...caps, alwaysMatch: merged } as WebdriverIO.Capabilities
        : merged
}

export function makeHeadless (options: BrowserRunnerOptions, caps: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
    const capability = getEffectiveCapability(caps)
    if (!capability.browserName) {
        throw new Error(
            'No "browserName" defined in capability object. It seems you are trying to run tests ' +
            'in a non web environment, however WebdriverIOs browser runner only supports web environments'
        )
    }

    if (
        // either user sets headless option implicitly
        (typeof options.headless === 'boolean' && !options.headless) ||
        // or CI environment is set
        (typeof process.env.CI !== 'undefined' && !process.env.CI) ||
        // or non are set
        (typeof options.headless !== 'boolean' && typeof process.env.CI === 'undefined')
    ) {
        return caps
    }

    const browserName = capability.browserName.toLowerCase()
    const headlessOptions: WebdriverIO.Capabilities | undefined = browserName === 'chrome'
        ? { 'goog:chromeOptions': { args: ['headless', 'disable-gpu'] } }
        : browserName === 'firefox'
            ? { 'moz:firefoxOptions': { args: ['-headless'] } }
            : EDGE_BROWSER_NAMES.includes(browserName)
                ? { 'ms:edgeOptions': { args: ['--headless'] } }
                : undefined

    if (!headlessOptions) {
        log.error(`Headless mode not supported for browser "${capability.browserName}"`)
        return caps
    }

    return mergeIntoCapability(caps, headlessOptions)
}

/**
 * Open with devtools open when in watch mode
 */
export function adjustWindowInWatchMode (config: WebdriverIO.Config, caps: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
    if (!config.watch) {
        return caps
    }

    const capability = getEffectiveCapability(caps)
    if (config.watch && capability.browserName?.toLowerCase() === 'chrome') {
        return mergeIntoCapability(caps, {
            'goog:chromeOptions': {
                args: ['auto-open-devtools-for-tabs', 'window-size=1600,1200'],
                prefs: {
                    devtools: {
                        preferences: {
                            'panel-selectedTab': '"console"'
                        }
                    }
                }
            }
        })
    }
    /**
     * TODO: add support for other browsers (if possible)
     * } else if (...) { }
     */

    return caps
}

export function getCoverageByFactor (
    options: Partial<CoverageOptions>,
    summary: Pick<CoverageSummary, (typeof COVERAGE_FACTORS)[number]>,
    fileName?: string
) {
    return COVERAGE_FACTORS.map((factor) => {
        const treshold = options![factor]
        if (!treshold) {
            return
        }
        if (summary[factor].pct >= treshold) {
            return
        }

        return fileName
            ? util.format(FILE_TRESHOLD_REPORTING, factor, summary[factor].pct, treshold, fileName)
            : util.format(GLOBAL_TRESHOLD_REPORTING, factor, summary[factor].pct, treshold)
    }).filter(Boolean) as string[]
}
