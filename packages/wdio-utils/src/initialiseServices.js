import merge from 'deepmerge'
import logger from '@wdio/logger'

import initialisePlugin from './initialisePlugin'

const log = logger('@wdio/utils:initialiseServices')

/**
 * initialise services based on configuration
 * @param  {Object}    config  config of running session
 * @param  {Object}    caps    capabilities of running session
 * @param  {String}    type    define sub type of plugins (for services it could be "launcher")
 * @return {Object[]}          list of service classes that got initialised
 */
export default function initialiseServices (config, caps, type) {
    const initialisedServices = []

    if (!Array.isArray(config.services)) {
        return initialisedServices
    }

    for (let serviceName of config.services) {
        let serviceConfig = config

        /**
         * allow custom services with custom options
         */
        if (Array.isArray(serviceName)) {
            serviceConfig = merge(config, serviceName[1] || {})
            serviceName = serviceName[0]
        }

        /**
         * allow custom services that are already initialised
         */
        if (serviceName && typeof serviceName === 'object' && !Array.isArray(serviceName)) {
            log.debug('initialise custom initiated service')
            initialisedServices.push(serviceName)
            continue
        }

        try {
            /**
             * allow custom service classes
             */
            if (typeof serviceName === 'function') {
                log.debug(`initialise custom service "${serviceName.name}"`)
                initialisedServices.push(new serviceName(serviceConfig, caps))
                continue
            }

            log.debug(`initialise wdio service "${serviceName}"`)
            const Service = initialisePlugin(serviceName, 'service', type)

            /**
             * service only contains a launcher
             */
            if (!Service) {
                continue
            }

            initialisedServices.push(new Service(serviceConfig, caps))
        } catch(e) {
            log.error(e)
        }
    }

    return initialisedServices
}
