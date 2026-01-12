import type { Options } from '@wdio/types'

/**
 * Checks if the log level is silent.
 * Checks both the environment variable (which has priority in WebdriverIO) and the config.
 */
export function isSilentLogLevel(config?: Options.Testrunner): boolean {
    const envLogLevel = process.env.WDIO_LOG_LEVEL
    if (envLogLevel === 'silent') {
        return true
    }
    if (envLogLevel) {
        return false
    }

    if (!config) {
        return false
    }
    const logLevel = config.logLevel || 'info'
    return logLevel === 'silent'
}
