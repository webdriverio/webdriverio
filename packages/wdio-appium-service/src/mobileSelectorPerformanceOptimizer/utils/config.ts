import type { Options } from '@wdio/types'

/**
 * Checks if the log level is silent.
 * Uses the config object which is the source of truth in WebdriverIO.
 */
export function isSilentLogLevel(config?: Options.Testrunner): boolean {
    if (!config) {
        return false
    }
    const logLevel = config.logLevel || 'info'
    return logLevel === 'silent'
}
