import type { Capabilities, Services, Options } from '@wdio/types'
import logger from '@wdio/logger'

import initializePlugin from './initializePlugin.js'

const log = logger('@wdio/utils:initializeServices')

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
async function initializeServices (services: ServiceWithOptions[]): Promise<IntialisedService[]> {
    const initializedServices: IntialisedService[] = []
    for (const [serviceName, serviceConfig = {}] of services) {
        /**
         * allow custom services that are already initialized, e.g.
         *
         * ```
         * services: [
         *     [{ beforeTest: () => { ... } }]
         * ]
         * ```
         */
        if (typeof serviceName === 'object') {
            log.debug('initialize custom initiated service')
            initializedServices.push([serviceName as Services.HookFunctions, {}])
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
            log.debug(`initialize custom service "${serviceName.name}"`)
            initializedServices.push([serviceName as Services.ServiceClass, serviceConfig])
            continue
        }

        /**
         * services as NPM packages
         *
         * ```
         * services: ['@wdio/lighthouse-service']
         * ```
         */
        log.debug(`initialize service "${serviceName}" as NPM package`)
        const service = await initializePlugin(serviceName, 'service')
        initializedServices.push([service as Services.ServiceClass, serviceConfig, serviceName])
    }

    return initializedServices
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
 * initialize service for launcher process
 * @param  {Object}   config  wdio config
 * @param  {Object[]} caps    list of capabilities
 * @return {Object}           containing a list of launcher services as well
 *                            as a list of services that don't need to be
 *                            required in the worker
 */
export async function initializeLauncherService (config: Omit<Options.Testrunner, 'capabilities' | keyof Services.HookFunctions>, caps: Capabilities.DesiredCapabilities) {
    const ignoredWorkerServices = []
    const launcherServices: Services.ServiceInstance[] = []
    let serviceLabelToBeInitialised = 'unknown'

    try {
        const services = await initializeServices(config.services!.map(sanitizeServiceArray))
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
 * initialize services for worker instance
 * @param  {Object} config                 wdio config
 * @param  {Object} caps                   worker capabilities
 * @param  {object} ignoredWorkerServices  list of services that don't need to be required in a worker
 *                                         as they don't export a service for it
 * @return {Object[]}                      list if worker initiated worker services
 */
export async function initializeWorkerService (
    config: Options.Testrunner,
    caps: Capabilities.DesiredCapabilities,
    ignoredWorkerServices: string[] = []
): Promise<Services.ServiceInstance[]> {
    let serviceLabelToBeInitialised = 'unknown'
    const initializedServices: Services.ServiceInstance[] = []
    const workerServices = config.services!
        .map(sanitizeServiceArray)
        .filter(([serviceName]) => !ignoredWorkerServices.includes(serviceName as string))

    try {
        const services = await initializeServices(workerServices)
        for (const [service, serviceConfig, serviceName] of services) {
            /**
             * add object service
             */
            if (typeof service === 'object' && !serviceName) {
                serviceLabelToBeInitialised = 'object'
                initializedServices.push(service as Services.ServiceInstance)
                continue
            }

            const Service = (service as Services.ServicePlugin).default || service as Services.ServiceClass
            if (typeof Service === 'function') {
                serviceLabelToBeInitialised = serviceName || Service.constructor?.name || Service.toString()
                initializedServices.push(new Service(serviceConfig, caps, config))
                continue
            }
        }

        return initializedServices
    } catch (err: any) {
        throw new Error(`Failed to initilialise service ${serviceLabelToBeInitialised}: ${err.stack}`)
    }
}
