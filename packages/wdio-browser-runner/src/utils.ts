import util from 'node:util'

import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { CoverageSummary } from 'istanbul-lib-coverage'

import { COVERAGE_FACTORS, GLOBAL_TRESHOLD_REPORTING, FILE_TRESHOLD_REPORTING, DEFAULT_DEBUG_PORT } from './constants.js'
import type { BrowserRunnerOptions, CoverageOptions } from './types.js'

const log = logger('@wdio/browser-runner')
const INSPECT_ARG_REGEXP = /^--(debug|inspect)(-brk)?(=|$)/
const INSPECT_PORT_REGEXP = /^--(?:debug|inspect)(?:-brk)?=(?:[^:]+:)?(\d+)$/

export function hasInspectorOption (
    options: BrowserRunnerOptions = {},
    config?: WebdriverIO.Config,
    execArgv: string[] = process.execArgv
): boolean {
    if (options.inspect) {
        return true
    }

    const args = [...(config?.execArgv || []), ...execArgv]
    return args.some((arg) => INSPECT_ARG_REGEXP.test(arg))
}

export function getInspectorPort (
    options: BrowserRunnerOptions = {},
    config?: WebdriverIO.Config,
    cid?: string,
    execArgv: string[] = process.execArgv
): number {
    if (typeof options.inspect === 'number') {
        return options.inspect
    }

    const args = [...(config?.execArgv || []), ...execArgv]
    for (const arg of args) {
        const match = arg.match(INSPECT_PORT_REGEXP)
        if (match) {
            return Number(match[1])
        }
    }

    const cidMatch = cid?.match(/^\d+-(\d+)$/)
    const workerOffset = cidMatch ? Number(cidMatch[1]) : 0
    return DEFAULT_DEBUG_PORT + workerOffset
}

export function configureBrowserInspector (
    options: BrowserRunnerOptions,
    config: WebdriverIO.Config,
    caps: WebdriverIO.Capabilities,
    cid?: string,
    execArgv: string[] = process.execArgv
): WebdriverIO.Capabilities {
    if (!hasInspectorOption(options, config, execArgv)) {
        return caps
    }

    const capability = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
    const port = getInspectorPort(options, config, cid, execArgv)

    if (capability.browserName === 'chrome') {
        if (capability['goog:chromeOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        return deepmerge(capability, {
            'goog:chromeOptions': {
                args: [`--remote-debugging-port=${port}`]
            }
        })
    } else if (capability.browserName === 'msedge' || capability.browserName === 'edge') {
        if (capability['ms:edgeOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        return deepmerge(capability, {
            'ms:edgeOptions': {
                args: [`--remote-debugging-port=${port}`]
            }
        })
    } else if (capability.browserName === 'firefox') {
        if (capability['moz:firefoxOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        return deepmerge(capability, {
            'moz:firefoxOptions': {
                args: ['-remote-debugging-port', String(port)]
            }
        })
    }

    return caps
}

export function makeHeadless (options: BrowserRunnerOptions, caps: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
    const capability = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
    if (!capability.browserName) {
        throw new Error(
            'No "browserName" defined in capability object. It seems you are trying to run tests ' +
            'in a non web environment, however WebdriverIOs browser runner only supports web environments'
        )
    }

    if (
        // do not force headless when inspect mode is enabled unless explicitly requested
        (Boolean(options.inspect) && options.headless !== true) ||
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
export function adjustWindowInWatchMode (config: WebdriverIO.Config, caps: WebdriverIO.Capabilities): WebdriverIO.Capabilities {
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
