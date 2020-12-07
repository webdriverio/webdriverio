import logger from '@wdio/logger'

import initialisePlugin from './initialisePlugin'

const log = logger('@wdio/utils:initialiseServices')

type IntialisedService = (
    [WebdriverIO.ServiceClass | { default: Function }, WebdriverIO.ServiceOption, string] |
    [WebdriverIO.HookFunctions, Record<string, any>] |
    [WebdriverIO.ServiceClass, WebdriverIO.ServiceOption]
)

type Service = WebdriverIO.ServiceEntry | WebdriverIO.ServiceClass
type ServiceWithOptions = [Service, WebdriverIO.ServiceOption]

/**
 * Maps list of services of a config file into a list of actionable objects
 * @param  {Object}    config            config of running session
 * @param  {Object}    caps              capabilities of running session
 * @return {[(Object|Class), Object][]}  list of services with their config objects
 */
function initialiseServices (services: ServiceWithOptions[]): IntialisedService[] {
    const initialisedServices: IntialisedService[] = []
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
            initialisedServices.push([serviceName as WebdriverIO.HookFunctions, {}])
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
            initialisedServices.push([serviceName as WebdriverIO.ServiceClass, serviceConfig])
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
        initialisedServices.push([service as WebdriverIO.ServiceClass, serviceConfig, serviceName])
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
function sanitizeServiceArray (service: WebdriverIO.ServiceEntry): ServiceWithOptions {
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
export function initialiseLauncherService (config: Omit<WebdriverIO.Config, 'capabilities' | keyof WebdriverIO.HookFunctions>, caps: WebDriver.DesiredCapabilities) {
    const ignoredWorkerServices = []
    const launcherServices: WebdriverIO.ServiceInstance[] = []

    try {
        const services = initialiseServices(config.services!.map(sanitizeServiceArray))
        for (const [service, serviceConfig, serviceName] of services) {
            /**
             * add custom services as object or function
             */
            if (typeof service === 'object' && !serviceName) {
                launcherServices.push(service as object)
                continue
            }

            /**
             * add class service from imported package
             */
            const Launcher = (service as WebdriverIO.ServicePlugin).launcher
            if (typeof Launcher === 'function' && serviceName) {
                launcherServices.push(new Launcher(serviceConfig, caps, config))
            }

            /**
             * add class service from passed in class
             */
            if (typeof service === 'function' && !serviceName) {
                launcherServices.push(new service(serviceConfig, caps, config))
            }

            /**
             * check if service has a default export
             */
            if (
                serviceName &&
                typeof (service as { default: Function }).default !== 'function' &&
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
export function initialiseWorkerService (config: WebdriverIO.Config, caps: WebDriver.DesiredCapabilities, ignoredWorkerServices: string[] = []): WebdriverIO.ServiceInstance[] {
    const workerServices = config.services!
        .map(sanitizeServiceArray)
        .filter(([serviceName]) => !ignoredWorkerServices.includes(serviceName as string))

    try {
        const services = initialiseServices(workerServices)
        return services.map(([service, serviceConfig, serviceName]) => {
            /**
             * add object service
             */
            if (typeof service === 'object' && !serviceName) {
                return service as WebdriverIO.ServiceInstance
            }

            const Service = (service as WebdriverIO.ServicePlugin).default || service as WebdriverIO.ServiceClass
            if (typeof Service === 'function') {
                return new Service(serviceConfig, caps, config)
            }
        }).filter<WebdriverIO.ServiceInstance>(
            (service: WebdriverIO.ServiceInstance | undefined): service is WebdriverIO.ServiceInstance => Boolean(service)
        )
    } catch (err) {
        /**
         * don't break if service can't be initiated
         */
        log.error(err)
        return []
    }
}
