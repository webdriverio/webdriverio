import logger from '@wdio/logger'

import initialisePlugin from './initialisePlugin'

const log = logger('@wdio/utils:initialiseServices')

/**
 * Maps list of services of a config file into a list of actionable objects
 * @param  {Object}    config            config of running session
 * @param  {Object}    caps              capabilities of running session
 * @return {[(Object|Class), Object][]}  list of services with their config objects
 */
function initialiseServices (services) {
    const initialisedServices = []
    for (let [serviceName, serviceConfig = {}] of services) {
        /**
         * allow custom services that are already initialised, e.g.
         *
         * ```
         * services: [
         *     [{ beforeTest: () => { ... } }]
         * ]
         * ```
         */
        if (typeof serviceName === 'object') {
            log.debug('initialise custom initiated service')
            initialisedServices.push([serviceName, {}])
            continue
        }

        /**
         * allow custom service classes, e.g.
         *
         * ```
         * class MyService { ... }
         * ```
         *
         * in wdio.conf.js:
         *
         * ```
         * services: [MyService]
         * ```
         */
        if (typeof serviceName === 'function') {
            log.debug(`initialise custom service "${serviceName.name}"`)
            initialisedServices.push([serviceName, serviceConfig])
            continue
        }

        /**
         * services as NPM packages
         *
         * ```
         * services: ['@wdio/devtools-service']
         * ```
         */
        log.debug(`initialise service "${serviceName}" as NPM package`)
        const service = initialisePlugin(serviceName, 'service')
        initialisedServices.push([service, serviceConfig, serviceName])
    }

    return initialisedServices
}

/**
 * formats service array into proper structure which is an array with
 * the service object as first parameter and the service option as
 * second parameter
 * @param  {[Any]} service               list of services from config file
 * @return {[service, serviceConfig][]}  formatted list of services
 */
function sanitizeServiceArray (service) {
    return Array.isArray(service) ? service : [service, {}]
}

/**
 * initialise service for launcher process
 * @param  {Object}   config  wdio config
 * @param  {Object[]} caps    list of capabilities
 * @return {Object}           containing a list of launcher services as well
 *                            as a list of services that don't need to be
 *                            required in the worker
 */
export function initialiseLauncherService (config, caps) {
    const ignoredWorkerServices = []
    const launcherServices = []

    try {
        const services = initialiseServices(config.services.map(sanitizeServiceArray))
        for (const [service, serviceConfig, serviceName] of services) {
            /**
             * add custom services as object or function
             */
            if (typeof service === 'object' && !serviceName) {
                launcherServices.push(service)
                continue
            }

            /**
             * add class service
             */
            const Launcher = service.launcher || service
            if (typeof Launcher === 'function') {
                launcherServices.push(new Launcher(serviceConfig, caps, config))
            }

            /**
             * check if service has a default export
             */
            if (
                serviceName &&
                typeof service.default !== 'function' &&
                typeof service !== 'function'
            ) {
                ignoredWorkerServices.push(serviceName)
            }
        }
    } catch (err) {
        /**
         * don't break if service can't be initiated
         */
        log.error(err)
    }

    return { ignoredWorkerServices, launcherServices }
}

/**
 * initialise services for worker instance
 * @param  {Object} config                 wdio config
 * @param  {Object} caps                   worker capabilities
 * @param  {[type]} ignoredWorkerServices  list of services that don't need to be required in a worker
 *                                         as they don't export a service for it
 * @return {Object[]}                      list if worker initiated worker services
 */
export function initialiseWorkerService (config, caps, ignoredWorkerServices = []) {
    const workerServices = config.services
        .map(sanitizeServiceArray)
        .filter(([serviceName]) => !ignoredWorkerServices.includes(serviceName))

    try {
        const services = initialiseServices(workerServices)
        return services.map(([service, serviceConfig, serviceName]) => {
            /**
             * add object service
             */
            if (typeof service === 'object' && !serviceName) {
                return service
            }

            const Service = service.default || service
            if (typeof Service === 'function') {
                return new Service(serviceConfig, caps, config)
            }
        }).filter(Boolean)
    } catch (err) {
        /**
         * don't break if service can't be initiated
         */
        log.error(err)
        return []
    }
}
