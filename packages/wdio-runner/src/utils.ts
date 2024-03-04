import path from 'node:path'

import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS } from '@wdio/config'
import type { AsymmetricMatchers } from 'expect-webdriverio'
import type { Options, Capabilities } from '@wdio/types'

const log = logger('@wdio/runner')

export interface ConfigWithSessionId extends Options.Testrunner<Capabilities.RemoteCapabilities> {
    sessionId?: string,
}

/**
 * sanitizes wdio config from capability properties
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (
    caps: Capabilities.RemoteCapability,
    filterOut?: boolean
): Omit<Capabilities.RemoteCapability, 'logLevel'> {
    const defaultConfigsKeys = [
        // WDIO config keys
        ...Object.keys(DEFAULT_CONFIGS()),
        // WebDriver config keys
        ...Object.keys(DEFAULTS)
    ]

    return Object.keys(caps).filter((key: keyof Capabilities.RemoteCapability) => (
        /**
         * filter out all wdio config keys
         */
        !defaultConfigsKeys.includes(key as string) === !filterOut
    )).reduce((
        obj: Capabilities.RemoteCapability,
        key: keyof Capabilities.RemoteCapability
    ) => {
        obj[key] = caps[key]
        return obj
    }, {})
}

/**
 * initialize browser instance depending whether remote or multiremote is requested
 * @param  {Object}  config        configuration of sessions
 * @param  {Object}  capabilities  desired session capabilities
 * @param  {boolean} isMultiremote isMultiremote
 * @return {Promise}               resolves with browser object
 */
export async function initializeInstance (
    config: ConfigWithSessionId,
    capabilities: Capabilities.RemoteCapability,
    isMultiremote?: boolean
): Promise<WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser> {
    /**
     * Store all log events in a file
     */
    if (config.outputDir && !process.env.WDIO_LOG_PATH) {
        process.env.WDIO_LOG_PATH = path.join(config.outputDir, 'wdio.log')
    }

    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        config.capabilities = sanitizeCaps(capabilities)

        /**
         * propagate connection details defined by services or user in capabilities
         */
        const caps = capabilities as WebdriverIO.Capabilities
        const connectionProps = {
            protocol: caps.protocol || config.protocol,
            hostname: caps.hostname || config.hostname,
            port: caps.port || config.port,
            path: caps.path || config.path
        }
        // ToDo(Christian): fix typing and remove `any`
        const params = { ...config, ...connectionProps, capabilities } as any
        return attach({ ...params, options: params })
    }

    if (!isMultiremote) {
        log.debug('init remote session')
        const sessionConfig: Options.WebdriverIO = {
            ...config,
            /**
             * allow to overwrite connection details by user through capabilities
             */
            ...sanitizeCaps(capabilities, true),
            capabilities: sanitizeCaps(capabilities)
        }
        return remote(sessionConfig)
    }

    const options: Record<string, Options.WebdriverIO> = {}
    log.debug('init multiremote session')
    // @ts-expect-error ToDo(Christian): can be removed?
    delete config.capabilities
    for (const browserName of Object.keys(capabilities)) {
        options[browserName] = deepmerge(
            config,
            (capabilities as Capabilities.MultiRemoteCapabilities)[browserName]
        )
    }

    const browser = await multiremote(options, config)

    /**
     * only attach to global environment if `injectGlobals` is set to true
     */
    const browserNames = config.injectGlobals ? Object.keys(capabilities) : []
    for (const browserName of browserNames) {
        // @ts-ignore allow random global browser names
        global[browserName] = browser[browserName]
    }

    return browser
}

/**
 * Filter logTypes based on filter
 * @param  {string[]} excludeDriverLogs logTypes filter
 * @param  {string[]} driverLogTypes    available driver log types
 * @return {string[]}                   logTypes
 */
export function filterLogTypes(
    excludeDriverLogs: string[],
    driverLogTypes: string[]
) {
    let logTypes = [...driverLogTypes]

    if (Array.isArray(excludeDriverLogs)) {
        log.debug('filtering logTypes', logTypes)
        logTypes = excludeDriverLogs.length === 1 && excludeDriverLogs[0] === '*'
            ? []
            : logTypes.filter(x => !excludeDriverLogs.includes(x)) // exclude specific logTypes
        log.debug('filtered logTypes', logTypes)
    }

    return logTypes
}

type BrowserData = {
    sessionId: string
    isW3C: boolean
    protocol: string
    hostname: string
    port: number
    path: string
    queryParams: Record<string, string>
}

/**
 * Gets { sessionId, isW3C, protocol, hostname, port, path, queryParams } of every Multiremote instance
 * @param {object} browser browser
 * @param {boolean} isMultiremote isMultiremote
 * @return {object}
 */
export function getInstancesData (
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    isMultiremote: boolean
) {
    if (!isMultiremote) {
        return
    }

    const multiRemoteBrowser = browser as WebdriverIO.MultiRemoteBrowser
    const instances: Record<string, Partial<BrowserData>> = {}
    multiRemoteBrowser.instances.forEach((browserName: string) => {
        const { protocol, hostname, port, path, queryParams } = multiRemoteBrowser.getInstance(browserName).options
        const { isW3C, sessionId } = multiRemoteBrowser.getInstance(browserName)

        instances[browserName] = { sessionId, isW3C, protocol, hostname, port, path, queryParams }
    })

    return instances
}

const SUPPORTED_ASYMMETRIC_MATCHER = {
    Any: 'any',
    Anything: 'anything',
    ArrayContaining: 'arrayContaining',
    ObjectContaining: 'objectContaining',
    StringContaining: 'stringContaining',
    StringMatching: 'stringMatching',
    CloseTo: 'closeTo'
} as const

/**
 * utility function to transform assertion parameters into asymmetric matchers if necessary
 * @param arg raw value or a stringified asymmetric matcher
 * @returns   raw value or an actual asymmetric matcher
 */
export function transformExpectArgs (arg: any) {
    if (typeof arg === 'object' && '$$typeof' in arg && Object.keys(SUPPORTED_ASYMMETRIC_MATCHER).includes(arg.$$typeof)) {
        const matcherKey = SUPPORTED_ASYMMETRIC_MATCHER[arg.$$typeof as keyof typeof SUPPORTED_ASYMMETRIC_MATCHER] as keyof AsymmetricMatchers
        const matcher: any = arg.inverse ? expect.not[matcherKey] : expect[matcherKey]

        if (!matcher) {
            throw new Error(`Matcher "${matcherKey}" is not supported by expect-webdriverio`)
        }

        return matcher(arg.sample)
    }

    return arg
}
