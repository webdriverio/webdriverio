import util from 'node:util'

import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import type { Capabilities, Options } from '@wdio/types'
import type { CoverageSummary } from 'istanbul-lib-coverage'

import { COVERAGE_FACTORS, GLOBAL_TRESHOLD_REPORTING, FILE_TRESHOLD_REPORTING } from './constants.js'
import type { BrowserRunnerOptions, CoverageOptions } from './types.js'

const log = logger('@wdio/browser-runner')

export function makeHeadless (options: BrowserRunnerOptions, caps: Capabilities.RemoteCapability): Capabilities.RemoteCapability {
    const capability = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
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

    if (capability.browserName === 'chrome') {
        return deepmerge(capability, {
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
    } else if (capability.browserName === 'firefox') {
        return deepmerge(capability, {
            'moz:firefoxOptions': {
                args: ['-headless']
            }
        })
    } else if (capability.browserName === 'msedge' || capability.browserName === 'edge') {
        return deepmerge(capability, {
            'ms:edgeOptions': {
                args: ['--headless']
            }
        })
    }

    log.error(`Headless mode not supported for browser "${capability.browserName}"`)
    return caps
}

/**
 * Open with devtools open when in watch mode
 */
export function adjustWindowInWatchMode (config: Options.Testrunner, caps: Capabilities.RemoteCapability): Capabilities.RemoteCapability {
    if (!config.watch) {
        return caps
    }

    const capability = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
    if (config.watch && capability.browserName === 'chrome') {
        return deepmerge(capability, {
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
