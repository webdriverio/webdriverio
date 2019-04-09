import logger from '@wdio/logger'

const log = logger('@wdio/cli:utils')

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
