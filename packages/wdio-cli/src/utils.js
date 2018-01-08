import logger from 'wdio-logger'

import BaseReporter from './lib/BaseReporter'

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
            launchServices.push(serviceName)
            continue
        }

        try {
            const pkgName = serviceName.startsWith('@')
                ? `${serviceName}/launcher`
                : `wdio-${serviceName}-service/launcher`
            service = require(pkgName)
        } catch (e) {
            if (!e.message.match(`Cannot find module 'wdio-${serviceName}-service/launcher'`)) {
                throw new Error(`Couldn't initialise launcher from service "${serviceName}".\n${e.stack}`)
            }
        }

        if (service && (typeof service.onPrepare === 'function' || typeof service.onComplete === 'function')) {
            launchServices.push(service)
        }
    }

    return launchServices
}

/**
 * initialise reporters
 */
export function initReporters (config) {
    let reporter = new BaseReporter()

    const reporters = {}

    for (let reporterName of config.reporters) {
        let Reporter
        if (typeof reporterName === 'function') {
            Reporter = reporterName
            if (!Reporter.reporterName) {
                throw new Error('Custom reporters must export a unique \'reporterName\' property')
            }
            reporters[Reporter.reporterName] = Reporter
        } else if (typeof reporterName === 'string') {
            try {
                const pkgName = reporterName.startsWith('@') ? reporterName : `wdio-${reporterName}-reporter`
                Reporter = require(pkgName)
            } catch (e) {
                throw new Error(`reporter "wdio-${reporterName}-reporter" is not installed. Error: ${e.stack}`)
            }
            reporters[reporterName] = Reporter
        }
        if (!Reporter) {
            throw new Error(`config.reporters must be an array of strings or functions, but got '${typeof reporterName}': ${reporterName}`)
        }
    }

    /**
     * if no reporter options are set or property is in a wrong format default to
     * empty object
     */
    if (!config.reporterOptions || typeof config.reporterOptions !== 'object') {
        config.reporterOptions = {}
    }

    for (let reporterName in reporters) {
        const Reporter = reporters[reporterName]
        let reporterOptions = {}
        for (let option of Object.keys(config.reporterOptions)) {
            if (option === reporterName && typeof config.reporterOptions[reporterName] === 'object') {
                // Copy over options specifically for this reporter type
                reporterOptions = Object.assign(reporterOptions, config.reporterOptions[reporterName])
            } else if (reporters[option]) {
                // Don't copy options for other reporters
                continue
            } else {
                // Copy over generic options
                reporterOptions[option] = config.reporterOptions[option]
            }
        }

        reporter.add(new Reporter(reporter, config, reporterOptions))
    }

    return reporter
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
