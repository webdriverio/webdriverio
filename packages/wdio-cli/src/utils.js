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
 * Run onPrepareHook in Launcher
 * @param {Array|Function} onPrepareHook - can be array of functions or single function
 * @param {Object} config
 * @param {Object} capabilities
 */
export async function runOnPrepareHook(onPrepareHook, config, capabilities) {
    const catchFn = (e) => log.error(`Error in onPrepareHook: ${e.stack}`)

    if (typeof onPrepareHook === 'function') {
        onPrepareHook = [onPrepareHook]
    }

    return Promise.all(onPrepareHook.map((hook) => {
        try {
            return hook(config, capabilities)
        } catch (e) {
            return catchFn(e)
        }
    })).catch(catchFn)
}

/**
 * Run onCompleteHook in Launcher
 * @param {Array|Function} onCompleteHook - can be array of functions or single function
 * @param {*} config
 * @param {*} capabilities
 * @param {*} exitCode
 * @param {*} results
 */
export async function runOnCompleteHook(onCompleteHook, config, capabilities, exitCode, results) {
    if (typeof onCompleteHook === 'function') {
        onCompleteHook = [onCompleteHook]
    }

    return Promise.all(onCompleteHook.map((hook) => {
        try {
            hook(exitCode, config, capabilities, results)
            return 0
        } catch (e) {
            log.error(`Error in onCompleteHook: ${e.stack}`)
            return 1
        }
    }))
}

/**
 * map package names
 * used in the CLI to find the name of the package for different questions
 * answers.framework {String}
 * answers.reporters | answer.services {Array<string>}
 */
export function getNpmPackageName(pkgLabels) {
    if (typeof pkgLabels === 'string') {
        return pkgLabels.split('/package/')[1]
    }

    return pkgLabels.map(pkgLabel => pkgLabel.split('/package/')[1])
}

export function getPackageName(pkg) {
    return pkg.trim().split(' -')[0]
}

/**
 * get runner identification by caps
 */
export function getRunnerName (caps = {}) {
    let runner =
        caps.browserName ||
        caps.appPackage ||
        caps.appWaitActivity ||
        caps.app ||
        caps.platformName

    // MultiRemote
    if (!runner) {
        runner = Object.values(caps).length === 0 || Object.values(caps).some(cap => !cap.capabilities) ? 'undefined' : 'MultiRemote'
    }

    return runner
}

/**
 * used by the install command to better find the package to install
 */
export function parseInstallNameAndPackage(list) {
    const returnObj = {}

    for(let item of list) {
        returnObj[getPackageName(item)] = getNpmPackageName(item)
    }

    return returnObj
}
