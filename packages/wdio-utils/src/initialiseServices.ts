import type { Capabilities, Services, Options } from '@wdio/types'
import logger from '@wdio/logger'

import initialisePlugin from './initialisePlugin.js'

const log = logger('@wdio/utils:initialiseServices')

type IntialisedService = (
    [Services.ServiceClass | { default: Function }, Services.ServiceOption, string] |
    [Services.HookFunctions, Record<string, any>] |
    [Services.ServiceClass, Services.ServiceOption]
)

type Service = Services.ServiceEntry | Services.ServiceClass
type ServiceWithOptions = [Service, Services.ServiceOption]

/**
 * Maps list of services of a config file into a list of actionable objects
 * @param  {Object}    config            config of running session
 * @param  {Object}    caps              capabilities of running session
 * @return {[(Object|Class), Object][]}  list of services with their config objects
 */
async function initialiseServices (services: ServiceWithOptions[]): Promise<IntialisedService[]> {
    const initialisedServices: IntialisedService[] = []
    for (const [serviceName, serviceConfig = {}] of services) {
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
            initialisedServices.push([serviceName as Services.HookFunctions, {}])
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
            initialisedServices.push([serviceName as Services.ServiceClass, serviceConfig])
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
        const service = await initialisePlugin(serviceName, 'service')
        initialisedServices.push([service as Services.ServiceClass, serviceConfig, serviceName])
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
function sanitizeServiceArray (service: Services.ServiceEntry): ServiceWithOptions {
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
export async function initialiseLauncherService (config: Omit<Options.Testrunner, 'capabilities' | keyof Services.HookFunctions>, caps: Capabilities.DesiredCapabilities) {
    const ignoredWorkerServices = []
    const launcherServices: Services.ServiceInstance[] = []
    let serviceLabelToBeInitialised = 'unknown'

    try {
        const services = await initialiseServices(config.services!.map(sanitizeServiceArray))
        for (const [service, serviceConfig, serviceName] of services) {
            /**
             * add custom services as object or function
             */
            if (typeof service === 'object' && !serviceName) {
                serviceLabelToBeInitialised = 'object'
                launcherServices.push(service as object)
                continue
            }

            /**
             * add class service from imported package
             */
            const Launcher = (service as Services.ServicePlugin).launcher
            if (typeof Launcher === 'function' && serviceName) {
                serviceLabelToBeInitialised = `"${serviceName}"`
                launcherServices.push(new Launcher(serviceConfig, caps, config))
            }

            /**
             * add class service from passed in class
             */
            if (typeof service === 'function' && !serviceName) {
                serviceLabelToBeInitialised = `"${service.constructor?.name || service.toString()}"`
                launcherServices.push(new service(serviceConfig, caps, config))
            }

            /**
             * check if service has a default export, if not we can later filter it out so the
             * service module is not even loaded in the worker process
             */
            if (
                serviceName &&
                typeof (service as { default: Function }).default !== 'function' &&
                typeof service !== 'function'
            ) {
                ignoredWorkerServices.push(serviceName)
            }
        }
    } catch (err: any) {
        throw new Error(`Failed to initilialise launcher service ${serviceLabelToBeInitialised}: ${err.stack}`)
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
export async function initialiseWorkerService (
    config: Options.Testrunner,
    caps: Capabilities.DesiredCapabilities,
    ignoredWorkerServices: string[] = []
): Promise<Services.ServiceInstance[]> {
    let serviceLabelToBeInitialised = 'unknown'
    const initialisedServices: Services.ServiceInstance[] = []
    const workerServices = config.services!
        .map(sanitizeServiceArray)
        .filter(([serviceName]) => !ignoredWorkerServices.includes(serviceName as string))

    try {
        const services = await initialiseServices(workerServices)
        for (const [service, serviceConfig, serviceName] of services) {
            /**
             * add object service
             */
            if (typeof service === 'object' && !serviceName) {
                serviceLabelToBeInitialised = 'object'
                initialisedServices.push(service as Services.ServiceInstance)
                continue
            }

            const Service = (service as Services.ServicePlugin).default || service as Services.ServiceClass
            if (typeof Service === 'function') {
                serviceLabelToBeInitialised = serviceName || Service.constructor?.name || Service.toString()
                initialisedServices.push(new Service(serviceConfig, caps, config))
                continue
            }
        }

        return initialisedServices
    } catch (err: any) {
        throw new Error(`Failed to initilialise service ${serviceLabelToBeInitialised}: ${err.stack}`)
    }
}
