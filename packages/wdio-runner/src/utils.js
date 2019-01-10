import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { initialisePlugin, DEFAULT_CONFIGS } from '@wdio/config'

const log = logger('wdio-local-runner:utils')

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
 * initialise services based on configuration
 * @param  {Object}    config  of running session
 * @return {Object[]}          list of service classes that got initialised
 */
export function initialiseServices (config, caps) {
    const initialisedServices = []

    if (!Array.isArray(config.services)) {
        return initialisedServices
    }

    for (let serviceName of config.services) {
        /**
         * allow custom services that are already initialised
         */
        if (typeof serviceName === 'object') {
            log.debug(`initialise custom service "${serviceName}"`)
            initialisedServices.push(serviceName)
            continue
        }

        log.debug(`initialise wdio service "${serviceName}"`)
        try {
            const Service = initialisePlugin(serviceName, 'service')

            /**
             * service only contains a launcher
             */
            if (!Service) {
                continue
            }

            initialisedServices.push(new Service(config, caps))
        } catch(e) {
            log.error(e)
        }
    }

    return initialisedServices
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
 * checks whether capabilities contains multiple browser configurations
 * @param  {Object}  capabilities  desired session capabilities
 * @return {Boolean}               true if multiple browsers configured
 */
export function isMultiremoteConfig (capabilities) {
    return (
        Object.keys(capabilities).length > 0 &&
        Object.values(capabilities).every(
            (browserConfig) => browserConfig.hasOwnProperty('capabilities')
        )
    )
}

/**
 * initialise browser instance depending whether remote or multiremote is requested
 * @param  {Object}  config        configuration of sessions
 * @param  {Object}  capabilities  desired session capabilities
 * @return {Promise}               resolves with browser object
 */
export async function initialiseInstance (config, capabilities) {
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

    if (!isMultiremoteConfig(capabilities)) {
        log.debug('init remote session')
        config.capabilities = sanitizeCaps(capabilities)
        return remote(config)
    }

    const options = {}
    log.debug('init multiremote session')
    for (let browserName of Object.keys(capabilities)) {
        options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
    }

    const browser = await multiremote(options)
    for (let browserName of Object.keys(capabilities)) {
        global[browserName] = browser[browserName]
    }

    return browser
}
