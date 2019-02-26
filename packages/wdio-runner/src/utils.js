import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULT_CONFIGS } from '@wdio/config'

const log = logger('@wdio/local-runner:utils')

const MERGE_OPTIONS = { clone: false }

/**
 * run before/after session hook
 */
export function runHook (hookName, config, caps, specs) {
    const catchFn = (e) => log.error(`Error in ${hookName}: ${e.stack}`)

    return Promise.all(config[hookName].map((hook) => {
        try {
            return hook(config, caps, specs)
        } catch (e) {
            return catchFn(e)
        }
    })).catch(catchFn)
}

/**
 * sanitizes wdio config from capability properties
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (caps) {
    return Object.keys(caps).filter(key => (
        /**
         * filter out all wdio config keys
         */
        !Object.keys(DEFAULT_CONFIGS).includes(key)
    )).reduce((obj, key) => {
        obj[key] = caps[key]
        return obj
    }, {})
}

/**
 * initialise browser instance depending whether remote or multiremote is requested
 * @param  {Object}  config        configuration of sessions
 * @param  {Object}  capabilities  desired session capabilities
 * @return {Promise}               resolves with browser object
 */
export async function initialiseInstance (config, capabilities, isMultiremote) {
    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        return attach({
            ...config,
            capabilities: capabilities
        })
    }

    if (!isMultiremote) {
        log.debug('init remote session')
        config.capabilities = sanitizeCaps(capabilities)
        return remote(config)
    }

    const options = {}
    log.debug('init multiremote session')
    delete config.capabilities
    for (let browserName of Object.keys(capabilities)) {
        options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
    }

    const browser = await multiremote(options)
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
