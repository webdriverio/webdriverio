import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS } from '@wdio/config'
import type { Options, Capabilities } from '@wdio/types'

const log = logger('@wdio/runner')

export interface ConfigWithSessionId extends Omit<Options.Testrunner, 'capabilities'> {
    sessionId?: string,
    capabilities: Capabilities.RemoteCapability
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
 * initialise browser instance depending whether remote or multiremote is requested
 * @param  {Object}  config        configuration of sessions
 * @param  {Object}  capabilities  desired session capabilities
 * @param  {boolean} isMultiremote isMultiremote
 * @return {Promise}               resolves with browser object
 */
export async function initialiseInstance (
    config: ConfigWithSessionId,
    capabilities: Capabilities.RemoteCapability,
    isMultiremote?: boolean
): Promise<WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser> {
    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        config.capabilities = sanitizeCaps(capabilities)

        /**
         * propagate connection details defined by services or user in capabilities
         */
        const { protocol, hostname, port, path } = capabilities as Capabilities.Capabilities
        return attach({ ...config, ...{ protocol, hostname, port, path }, capabilities } as Required<ConfigWithSessionId>)
    }

    if (!isMultiremote) {
        log.debug('init remote session')
        const sessionConfig: Options.WebdriverIO = {
            ...config,
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
