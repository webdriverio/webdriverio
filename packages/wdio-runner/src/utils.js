import merge from 'deepmerge'
import logger from '@wdio/logger'
import { remote, multiremote, attach } from 'webdriverio'
import { initialisePlugin } from '@wdio/config'

import { SUPPORTED_W3C_CAPABILITIES } from './constants'

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
        const Service = initialisePlugin(serviceName, 'service')
        initialisedServices.push(new Service(config, caps))
    }

    return initialisedServices
}

/**
 * sanitizes capability properties that are not part of the protocol
 * @param  {Object} caps  desired session capabilities
 * @return {Object}       sanitized caps
 */
export function sanitizeCaps (caps) {
    return Object.keys(caps).filter(key => (
        /**
         * allow standard capabilities
         */
        SUPPORTED_W3C_CAPABILITIES.includes(key) ||
        /**
         * allow extension capabilities
         */
        key.includes(':')
    )).reduce((obj, key) => {
        obj[key] = caps[key]
        return obj
    }, {})
}

/**
 * initialise browser instance depending whether remote or multiremote is requested
 */
export async function initialiseInstance (config, capabilities, isMultiremote) {
    /**
     * check if config has sessionId and attach it to a running session if so
     */
    if (config.sessionId) {
        log.debug(`attach to session with id ${config.sessionId}`)
        return attach({
            ...config,
            capabilities: sanitizeCaps(capabilities)
        })
    }

    if (!isMultiremote) {
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
