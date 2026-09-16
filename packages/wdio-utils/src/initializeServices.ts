import type { Services, Capabilities } from '@wdio/types'
import logger from '@wdio/logger'

import initializePlugin from './initializePlugin.js'

const log = logger('@wdio/utils:initializeServices')

type IntialisedService = (
    [Services.ServiceClass | { default: Function }, WebdriverIO.ServiceOption, string] |
    [Services.HookFunctions, Record<string, unknown>] |
    [Services.ServiceClass, WebdriverIO.ServiceOption]
)

type Service = Services.ServiceEntry | Services.ServiceClass
type ServiceWithOptions = [Service, WebdriverIO.ServiceOption]

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
export async function initializeLauncherService (
    config: Omit<WebdriverIO.Config, 'capabilities' | keyof Services.HookFunctions>,
    caps: Capabilities.TestrunnerCapabilities
): Promise<{
    ignoredWorkerServices: string[];
    launcherServices: Services.ServiceInstance[];
}> {
    const ignoredWorkerServices: string[] = []
    const workerServiceLoadDecisions = new Map<Services.ServicePlugin, boolean>()
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
                launcherServices.push(new Launcher(serviceConfig, caps as Capabilities.ResolvedTestrunnerCapabilities, config))
            }

            /**
             * add class service from passed in class
             */
            if (typeof service === 'function' && !serviceName) {
                serviceLabelToBeInitialised = `"${service.constructor?.name || service.toString()}"`
                launcherServices.push(new service(serviceConfig, caps as Capabilities.ResolvedTestrunnerCapabilities, config))
            }

            /**
             * Package-wide activation decisions are made once in the launcher, so disabled
             * packages need not be imported into any workers. Launcher hooks are unaffected.
             */
            const servicePlugin = service as Services.ServicePlugin
            if (serviceName && typeof servicePlugin.shouldLoad === 'function' && !workerServiceLoadDecisions.has(servicePlugin)) {
                serviceLabelToBeInitialised = `"${serviceName}"`
                workerServiceLoadDecisions.set(servicePlugin, await servicePlugin.shouldLoad(config, caps) !== false)
            }

            /**
             * check if service has a default export, if not we can later filter it out so the
             * service module is not even loaded in the worker process
             */
            if (
                serviceName &&
                (
                    (typeof servicePlugin.default !== 'function' && typeof service !== 'function') ||
                    workerServiceLoadDecisions.get(servicePlugin) === false
                ) &&
                !ignoredWorkerServices.includes(serviceName)
            ) {
                ignoredWorkerServices.push(serviceName)
            }
        }
    } catch (err) {
        throw new Error(`Failed to initialise launcher service ${serviceLabelToBeInitialised}: ${(err as Error).stack}`)
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
    config: WebdriverIO.Config,
    caps: WebdriverIO.Capabilities,
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
                serviceLabelToBeInitialised = serviceName || Service.name || Service.toString()
                if (typeof Service.shouldRun === 'function' && await Service.shouldRun(serviceConfig, caps, config) === false) {
                    continue
                }
                initializedServices.push(new Service(serviceConfig, caps, config))
                continue
            }
        }

        return initializedServices
    } catch (err) {
        throw new Error(`Failed to initialise service ${serviceLabelToBeInitialised}: ${(err as Error).stack}`)
    }
}
