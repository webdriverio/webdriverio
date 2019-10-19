import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { DEFAULT_CONFIGS } from '@wdio/config'

const log = logger('@wdio/local-runner:utils')

const MERGE_OPTIONS = { clone: false }
const mochaAllHooks = ['"before all" hook', '"after all" hook']

/**
 * Run before/after session hooks.
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
 * Sanitizes WDIO config from capability properties.
 * @param  {Object} caps  - Desired session capabilities
 * @return {Object}       - Sanitized capabilities
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
 * Initialise browser instance, depending whether remote or multiremote is requested.
 * @param  {Object}  config        - Configuration of sessions
 * @param  {Object}  capabilities  - Desired session capabilities
 * @param  {boolean} isMultiremote - Is multi remote?
 * @return {Promise}               - Resolves with browser object
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
 * Filter logTypes based on filter.
 * @param  {string[]} excludeDriverLogs - LogTypes filter
 * @param  {string[]} driverLogTypes    - Available driver log types
 * @return {string[]}                   - logTypes
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
 * Send event to WDIOCLInterface if test or `beforeAll`/`afterAll` hook failed.
 * @param {string} e        - Event
 * @param {object} payload  - Payload
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
 * Gets { sessionId, isW3C, protocol, hostname, port, path, queryParams } of every 
 * Multiremote instance.
 * @param {object} browser        - Browser
 * @param {boolean} isMultiremote - IsMultiremote
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

/**
 * Attach to Multiremote.
 * @param {object} instances - Mutliremote instances object
 * @param {object} caps      - Multiremote capabilities
 * @return {object}
 */
export async function attachToMultiremote(instances, caps) {
    // emulate multiremote browser object
    const browser = {
        instances: Object.keys(instances),
        deleteSession () {
            return Promise.all(Object.keys(instances).map(name => browser[name].deleteSession()))
        }
    }

    /**
     * attach to every multiremote instance
     */
    await Promise.all(
        Object.keys(instances).map(async name => {
            browser[name] = await initialiseInstance(instances[name], caps[name].capabilities, false)
        })
    )

    return browser
}
