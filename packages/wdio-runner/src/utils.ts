import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import { remote, multiremote, attach, type AttachOptions } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS } from '@wdio/config'
import type { AsymmetricMatchers, InverseAsymmetricMatchers } from 'expect-webdriverio'
import type { Options, Capabilities } from '@wdio/types'
import { enableFileLogging } from '@wdio/utils'

const log = logger('@wdio/runner')

export interface ConfigWithSessionId extends Options.Testrunner {
    sessionId?: string
    capabilities: Capabilities.RequestedStandaloneCapabilities
}

/**
 * sanitizes wdio config from capability properties
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (
    capabilities: Capabilities.RequestedStandaloneCapabilities,
    filterOut?: boolean
): Omit<WebdriverIO.Capabilities, 'logLevel'> {
    const caps = 'alwaysMatch' in capabilities ? capabilities.alwaysMatch : capabilities
    const defaultConfigsKeys = [
        // WDIO config keys
        ...Object.keys(DEFAULT_CONFIGS()),
        // WebDriver config keys
        ...Object.keys(DEFAULTS)
    ]

    return Object.keys(caps).filter((key: keyof WebdriverIO.Capabilities) => (
        /**
         * filter out all wdio config keys
         */
        !defaultConfigsKeys.includes(key as string) === !filterOut
    )).reduce((
        obj: WebdriverIO.Capabilities,
        key: keyof WebdriverIO.Capabilities
    ) => {
        obj[key] = caps[key] as undefined
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
    config: ConfigWithSessionId | WebdriverIO.Config,
    capabilities: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities,
    isMultiremote?: boolean
): Promise<WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser> {
    await enableFileLogging(config.outputDir)

    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if ('sessionId' in config) {
        log.debug(`attach to session with id ${config.sessionId}`)
        config.capabilities = sanitizeCaps(capabilities as WebdriverIO.Capabilities)

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
        const params = { ...config, ...connectionProps, capabilities } as AttachOptions
        return attach({ ...params, options: params })
    }

    /**
     * start a normal standalone session
     */
    if (!isMultiremote) {
        log.debug('init remote session')
        const sessionConfig: Capabilities.WebdriverIOConfig = {
            ...config,
            /**
             * allow to overwrite connection details by user through capabilities
             */
            ...sanitizeCaps(capabilities as Options.Connection, true),
            capabilities: sanitizeCaps(capabilities)
        }
        return remote(sessionConfig)
    }

    /**
     * initiate multiremote sessions
     */
    const options: Capabilities.RequestedMultiremoteCapabilities = {}
    log.debug('init multiremote session')
    // @ts-expect-error ToDo(Christian): can be removed?
    delete config.capabilities
    for (const browserName of Object.keys(capabilities)) {
        options[browserName] = deepmerge(
            config,
            (capabilities as Capabilities.RequestedMultiremoteCapabilities)[browserName]
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
export function transformExpectArgs (arg: unknown) {
    if (typeof arg === 'object' && arg && '$$typeof' in arg && typeof arg.$$typeof === 'string' && Object.keys(SUPPORTED_ASYMMETRIC_MATCHER).includes(arg.$$typeof)) {
        const matcherKey = SUPPORTED_ASYMMETRIC_MATCHER[arg.$$typeof as keyof typeof SUPPORTED_ASYMMETRIC_MATCHER] as keyof AsymmetricMatchers
        const inverseMatcherKey = SUPPORTED_ASYMMETRIC_MATCHER[arg.$$typeof as keyof typeof SUPPORTED_ASYMMETRIC_MATCHER] as keyof InverseAsymmetricMatchers
        const matcher = ('inverse' in arg && arg.inverse ? expect.not[inverseMatcherKey] : expect[matcherKey]) as unknown as (sample: string) => unknown

        if (!matcher) {
            throw new Error(`Matcher "${matcherKey}" is not supported by expect-webdriverio`)
        }

        return matcher((arg as unknown as { sample: string }).sample)
    }

    return arg
}
