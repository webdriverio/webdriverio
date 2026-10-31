import util from 'node:util'

import getPort, { portNumbers } from 'get-port'
import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { CoverageSummary } from 'istanbul-lib-coverage'

import { COVERAGE_FACTORS, GLOBAL_TRESHOLD_REPORTING, FILE_TRESHOLD_REPORTING, DEFAULT_DEBUG_PORT } from './constants.js'
import type { BrowserRunnerOptions, CoverageOptions } from './types.js'

const log = logger('@wdio/browser-runner')
const INSPECT_ARG_REGEXP = /^--(debug|inspect)(-brk)?(=|$)/
const INSPECT_PORT_REGEXP = /^--(?:debug|inspect)(?:-brk)?=(?:[^:]+:)?(\d+)$/
const MIN_PORT = 1024
const MAX_PORT = 65535
let portAllocationQueue = Promise.resolve()

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

export async function getInspectorPort (
    options: BrowserRunnerOptions = {},
    config?: WebdriverIO.Config,
    execArgv: string[] = process.execArgv,
    allocatedPorts?: Set<number>
): Promise<number> {
    const basePort = typeof options.inspect === 'number' &&
        Number.isInteger(options.inspect) &&
        options.inspect >= MIN_PORT &&
        options.inspect <= MAX_PORT
        ? options.inspect
        : DEFAULT_DEBUG_PORT

    const nodeDebugPorts = new Set<number>()
    const args = [...(config?.execArgv || []), ...execArgv]
    for (const arg of args) {
        const match = arg.match(INSPECT_PORT_REGEXP)
        if (match) {
            const port = Number(match[1])
            if (port >= MIN_PORT && port <= MAX_PORT) {
                nodeDebugPorts.add(port)
            }
        } else if (INSPECT_ARG_REGEXP.test(arg)) {
            const defaultNodePort = process.debugPort || 9229
            if (defaultNodePort >= MIN_PORT && defaultNodePort <= MAX_PORT) {
                nodeDebugPorts.add(defaultNodePort)
            }
        }
    }

    const previousAllocation = portAllocationQueue
    let releaseQueue!: () => void
    portAllocationQueue = new Promise<void>((resolve) => {
        releaseQueue = resolve
    })

    await previousAllocation
    try {
        const exclude = new Set<number>([
            ...nodeDebugPorts,
            ...(allocatedPorts || [])
        ])
        const preferredPorts = [
            ...portNumbers(basePort, MAX_PORT),
            ...(basePort > MIN_PORT ? portNumbers(MIN_PORT, basePort - 1) : [])
        ]
        const port = await getPort({
            port: preferredPorts,
            exclude
        })
        allocatedPorts?.add(port)
        return port
    } finally {
        releaseQueue()
    }
}

export async function configureBrowserInspector (
    options: BrowserRunnerOptions,
    config: WebdriverIO.Config,
    caps: WebdriverIO.Capabilities,
    execArgv: string[] = process.execArgv,
    allocatedPorts?: Set<number>,
    onPortAllocated?: (port: number) => void
): Promise<WebdriverIO.Capabilities> {
    if (!hasInspectorOption(options, config, execArgv)) {
        return caps
    }

    const isW3C = 'alwaysMatch' in caps
    const capability = isW3C ? (caps as Capabilities.W3CCapabilities).alwaysMatch : caps
    const mergeCapability = (patch: WebdriverIO.Capabilities): WebdriverIO.Capabilities => {
        const merged = deepmerge(capability, patch)
        if (isW3C) {
            return {
                ...caps,
                alwaysMatch: merged
            } as WebdriverIO.Capabilities
        }
        return merged
    }

    if (capability.browserName === 'chrome') {
        if (capability['goog:chromeOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        const port = await getInspectorPort(options, config, execArgv, allocatedPorts)
        onPortAllocated?.(port)
        return mergeCapability({
            'goog:chromeOptions': {
                args: [`--remote-debugging-port=${port}`]
            }
        })
    } else if (capability.browserName === 'msedge' || capability.browserName === 'edge') {
        if (capability['ms:edgeOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        const port = await getInspectorPort(options, config, execArgv, allocatedPorts)
        onPortAllocated?.(port)
        return mergeCapability({
            'ms:edgeOptions': {
                args: [`--remote-debugging-port=${port}`]
            }
        })
    } else if (capability.browserName === 'firefox') {
        if (capability['moz:firefoxOptions']?.args?.some((arg) => arg.includes('remote-debugging-port'))) {
            return caps
        }
        const port = await getInspectorPort(options, config, execArgv, allocatedPorts)
        onPortAllocated?.(port)
        return mergeCapability({
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
        (options.inspect && options.headless !== true) ||
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
