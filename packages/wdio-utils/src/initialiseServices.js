import merge from 'deepmerge'
import logger from '@wdio/logger'

import initialisePlugin from './initialisePlugin'

const log = logger('@wdio/utils:initialiseServices')

/**
 * Initialise services based on configuration.
 * @param  {Object}    config  - Config of running session
 * @param  {Object}    caps    - Capabilities of running session
 * @param  {String}    type    - Define sub type of plugins (for services it could be "launcher")
 * @return {Object[]}          - List of service classes that got initialised
 */
export default function initialiseServices (config, caps, type) {
    const initialisedServices = []

    if (!Array.isArray(config.services)) {
        return initialisedServices
    }

    for (let serviceName of config.services) {
        let serviceConfig = config

        /**
         * Allow custom services with custom options.
         */
        if (Array.isArray(serviceName)) {
            serviceConfig = merge(config, serviceName[1] || {})
            serviceName = serviceName[0]
        }

        /**
         * Allow custom services that are already initialised.
         */
        if (serviceName && typeof serviceName === 'object' && !Array.isArray(serviceName)) {
            log.debug('initialise custom initiated service')
            initialisedServices.push(serviceName)
            continue
        }

        try {
            /**
             * Allow custom service classes.
             */
            if (typeof serviceName === 'function') {
                log.debug(`initialise custom service "${serviceName.name}"`)
                initialisedServices.push(new serviceName(serviceConfig, caps))
                continue
            }

            log.debug(`initialise wdio service "${serviceName}"`)
            const Service = initialisePlugin(serviceName, 'service', type)

            /**
             * Service only contains a launcher.
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
