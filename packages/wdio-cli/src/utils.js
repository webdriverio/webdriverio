import logger from '@wdio/logger'
import { initialisePlugin } from '@wdio/config'

const log = logger('wdio-cli:utils')

/**
 * loads launch services
 */
export function getLauncher (config) {
    let launchServices = []

    if (!Array.isArray(config.services)) {
        return launchServices
    }

    for (let serviceName of config.services) {
        let launcher

        /**
         * allow custom services
         */
        if (typeof serviceName === 'object' && (typeof serviceName.onPrepare === 'function' || typeof serviceName.onComplete === 'function')) {
            launchServices.push(serviceName)
            continue
        }

        try {
            const Launcher = initialisePlugin(serviceName, 'service', 'launcher')

            /**
             * abort if service has no launcher
             */
            if (!Launcher) {
                continue
            }

            launcher = new Launcher()
        } catch (e) {
            if (e.message.startsWith('Couldn\'t find plugin')) {
                log.error(`Couldn't initialise launcher from service "${serviceName}".\n${e.stack}`)
                continue
            }
        }

        if (launcher && (typeof launcher.onPrepare === 'function' || typeof launcher.onComplete === 'function')) {
            launchServices.push(launcher)
        }
    }

    return launchServices
}

/**
 * run service launch sequences
 */
export async function runServiceHook (launcher, hookName, ...args) {
    try {
        return await Promise.all(launcher.map((service) => {
            if (typeof service[hookName] === 'function') {
                return service[hookName](...args)
            }
        }))
    } catch (e) {
        log.error(`A service failed in the '${hookName}' hook\n${e.stack}\n\nContinue...`)
    }
}

/**
 * map package names
 */
export function filterPackageName (type) {
    return (pkgLabels) => pkgLabels.map(
        (pkgLabel) => pkgLabel.trim().includes('@wdio')
            ? `@wdio/${pkgLabel.split(/- /)[0].trim()}-${type}`
            : `wdio-${pkgLabel.split(/- /)[0].trim()}-${type}`)
}

/**
 * get runner identification by caps
 */
export function getRunnerName (caps) {
    return (
        caps.browserName ||
        caps.appPackage ||
        caps.appWaitActivity ||
        caps.app ||
        caps.platformName ||
        'undefined'
    )
}
