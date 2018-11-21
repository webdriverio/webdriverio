import logger from '@wdio/logger'

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
        let service

        /**
         * allow custom services
         */
        if (typeof serviceName === 'object') {
            const { onPrepare, onComplete } = serviceName
            launchServices.push({ onPrepare, onComplete })
            continue
        }

        const pkgName = serviceName.startsWith('@')
            ? `${serviceName}/launcher`
            : `wdio-${serviceName}-service/launcher`
        try {
            service = require(pkgName)
        } catch (e) {
            if (!e.message.match(`Cannot find module '${pkgName}'`)) {
                throw new Error(`Couldn't initialise launcher from service "${serviceName}".\n${e.stack}`)
            }
        }

        if (service && (typeof service.onPrepare === 'function' || typeof service.onComplete === 'function')) {
            const { onPrepare, onComplete } = service
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
