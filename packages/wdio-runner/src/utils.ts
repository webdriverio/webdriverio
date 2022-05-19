import merge from 'deepmerge'
import logger from '@wdio/logger'
// @ts-expect-error
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS } from '@wdio/config'
import type { Options, Capabilities } from '@wdio/types'
// @ts-expect-error
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

const log = logger('@wdio/local-runner:utils')

const MERGE_OPTIONS = { clone: false }
const mochaAllHooks = ['"before all" hook', '"after all" hook']

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
): Promise<Browser<'async'> | MultiRemoteBrowser<'async'>> {
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
        return attach({ ...config, ...{ protocol, hostname, port, path } } as Required<ConfigWithSessionId>)
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
    for (let browserName of Object.keys(capabilities)) {
        options[browserName] = merge(
            config,
            (capabilities as Capabilities.MultiRemoteCapabilities)[browserName],
            MERGE_OPTIONS
        )
    }

    const browser = await multiremote(options, config)
    for (let browserName of Object.keys(capabilities)) {
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

        if (excludeDriverLogs.length === 1 && excludeDriverLogs[0] === '*') { // exclude all logTypes
            logTypes = []
        } else {
            logTypes = logTypes.filter(x => !excludeDriverLogs.includes(x)) // exclude specific logTypes
        }

        log.debug('filtered logTypes', logTypes)
    }

    return logTypes
}

/**
 * Send event to WDIOCLInterface if test or before/after all hook failed
 * @param {string} e        event
 * @param {object} payload  payload
 */
export function sendFailureMessage(e: string, payload: any) {
    if (
        e === 'test:fail' ||
        (
            e === 'hook:end' &&
            payload.error &&
            mochaAllHooks.some(hook => payload.title.startsWith(hook))
        )
    ) {
        process.send!({
            origin: 'reporter',
            name: 'printFailureMessage',
            content: payload
        })
    }
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
    browser: Browser<'async'> | MultiRemoteBrowser<'async'>,
    isMultiremote: boolean
) {
    if (!isMultiremote) {
        return
    }

    const multiRemoteBrowser = browser as MultiRemoteBrowser<'async'>
    const instances: Record<string, Partial<BrowserData>> = {}
    multiRemoteBrowser.instances.forEach((browserName: string) => {
        const { protocol, hostname, port, path, queryParams } = multiRemoteBrowser[browserName].options
        const { isW3C, sessionId } = multiRemoteBrowser[browserName]

        instances[browserName] = { sessionId, isW3C, protocol, hostname, port, path, queryParams }
    })

    return instances
}
