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
        if (typeof serviceName === 'object') {
            const { onPrepare, onComplete } = serviceName
            launchServices.push({ onPrepare, onComplete })
            continue
        }

        try {
            const Launcher = initialisePlugin(serviceName, 'service', 'launcher')
            launcher = new Launcher()
        } catch (e) {
            if (!e.message.match(`Couldn't find plugin`)) {
                throw new Error(`Couldn't initialise launcher from service "${serviceName}".\n${e.stack}`)
            }
        }

        if (launcher && (typeof launcher.onPrepare === 'function' || typeof launcher.onComplete === 'function')) {
            const { onPrepare, onComplete } = launcher
            launchServices.push({ onPrepare, onComplete })
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
