import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULTS } from 'webdriver'
import { DEFAULT_CONFIGS } from '@wdio/config'

const log = logger('@wdio/local-runner:utils')

const MERGE_OPTIONS = { clone: false }
const mochaAllHooks = ['"before all" hook', '"after all" hook']

/**
 * run before/after session hook
 */
export function runHook (hookName, config, caps, specs) {
    const catchFn = (e) => log.error(`Error in ${hookName}: ${e.stack}`)

    return config && Array.isArray(config[hookName]) ? Promise.all(config[hookName].map((hook) => {
        try {
            return hook(config, caps, specs)
        } catch (e) {
            return catchFn(e)
        }
    })).catch(catchFn) : undefined
}

/**
 * sanitizes wdio config from capability properties
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (caps, filterOut) {
    const defaultConfigsKeys = [
        // WDIO config keys
        ...Object.keys(DEFAULT_CONFIGS()),
        // WebDriver config keys
        ...Object.keys(DEFAULTS)
    ]
    return Object.keys(caps).filter(key => (
        /**
         * filter out all wdio config keys
         */
        !defaultConfigsKeys.includes(key) === !filterOut
    )).reduce((obj, key) => {
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
export async function initialiseInstance (config, capabilities, isMultiremote) {
    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        config.capabilities = sanitizeCaps(capabilities)
        return attach({ ...config })
    }

    if (!isMultiremote) {
        log.debug('init remote session')
        const sessionConfig = { ...config, ...sanitizeCaps(capabilities, true) }
        sessionConfig.capabilities = sanitizeCaps(capabilities)
        return remote(sessionConfig)
    }

    const options = {}
    log.debug('init multiremote session')
    delete config.capabilities
    for (let browserName of Object.keys(capabilities)) {
        options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
    }

    const browser = await multiremote(options, config)
    for (let browserName of Object.keys(capabilities)) {
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
export function filterLogTypes(excludeDriverLogs, driverLogTypes) {
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
export function sendFailureMessage(e, payload) {
    if (e === 'test:fail' || (e === 'hook:end' && payload.error && mochaAllHooks.some(hook => payload.title.startsWith(hook)))) {
        process.send({
            origin: 'reporter',
            name: 'printFailureMessage',
            content: payload
        })
    }
}

/**
 * Gets { sessionId, isW3C, protocol, hostname, port, path, queryParams } of every Multiremote instance
 * @param {object} browser browser
 * @param {boolean} isMultiremote isMultiremote
 * @return {object}
 */
export function getInstancesData(browser, isMultiremote) {
    let instances

    if (isMultiremote) {
        instances = {}
        browser.instances.forEach(i => {
            const { protocol, hostname, port, path, queryParams } = browser[i].options
            const { isW3C, sessionId } = browser[i]

            instances[i] = { sessionId, isW3C, protocol, hostname, port, path, queryParams }
        })
    }

    return instances
}
