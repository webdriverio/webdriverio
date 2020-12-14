import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach, HookFunctions } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS, ConfigOptions, Capability } from '@wdio/config'

const log = logger('@wdio/local-runner:utils')

const MERGE_OPTIONS = { clone: false }
const mochaAllHooks = ['"before all" hook', '"after all" hook']

interface ConfigWithSessionId extends Omit<ConfigOptions, 'capabilities'> {
    capabilities?: Capability
    sessionId?: string
}

/**
 * run before/after session hook
 */
export function runHook (
    hookName: keyof WebdriverIO.HookFunctions,
    config: ConfigOptions,
    caps: Capability,
    specs: string[]
) {
    const catchFn = (e: Error) => log.error(`Error in ${hookName}: ${e.stack}`)
    return Array.isArray(config[hookName])
        ? Promise.all((config[hookName] as Function[]).map((hook) => {
            try {
                return hook(config, caps, specs)
            } catch (e) {
                return catchFn(e)
            }
        })).catch(catchFn)
        : undefined
}

/**
 * sanitizes wdio config from capability properties
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (
    caps: Capability,
    filterOut?: boolean
): Capability {
    const defaultConfigsKeys = [
        // WDIO config keys
        ...Object.keys(DEFAULT_CONFIGS()),
        // WebDriver config keys
        ...Object.keys(DEFAULTS)
    ]

    return Object.keys(caps).filter((key: keyof Capability) => (
        /**
         * filter out all wdio config keys
         */
        !defaultConfigsKeys.includes(key as string) === !filterOut
    )).reduce((
        obj: Capability,
        key: keyof Capability
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
    capabilities: Capability,
    isMultiremote?: boolean
) {
    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        config.capabilities = sanitizeCaps(capabilities)
        return attach({ ...config } as Required<ConfigWithSessionId>)
    }

    if (!isMultiremote) {
        log.debug('init remote session')
        const sessionConfig = { ...config, ...sanitizeCaps(capabilities, true) } as Omit<ConfigWithSessionId, keyof HookFunctions>
        sessionConfig.capabilities = sanitizeCaps(capabilities)
        return remote(sessionConfig)
    }

    const options: WebdriverIO.MultiRemoteOptions = {}
    log.debug('init multiremote session')
    delete config.capabilities
    for (let browserName of Object.keys(capabilities)) {
        options[browserName] = merge(
            config,
            (capabilities as WebdriverIO.MultiRemoteCapabilities)[browserName],
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
    browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject,
    isMultiremote: boolean
) {
    if (!isMultiremote) {
        return
    }

    const multiRemoteBrowser = browser as WebdriverIO.MultiRemoteBrowserObject
    const instances: Record<string, Partial<BrowserData>> = {}
    multiRemoteBrowser.instances.forEach((browserName) => {
        const { protocol, hostname, port, path, queryParams } = multiRemoteBrowser[browserName].options
        const { isW3C, sessionId } = multiRemoteBrowser[browserName]

        instances[browserName] = { sessionId, isW3C, protocol, hostname, port, path, queryParams }
    })

    return instances
}
