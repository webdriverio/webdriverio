/* istanbul ignore file */

const LOG_METHODS = ['error', 'warn', 'info', 'debug', 'trace', 'silent']

export type { Logger } from './index.js'

export const SENSITIVE_DATA_REPLACER = '**MASKED**'

/**
 * This implementation of the Logger package is a simple adptation to run it within
 * a browser environment.
 */
export default function getLogger (component: string) {
    return LOG_METHODS.reduce((acc: Console, cur: string): Console => {
        const prop = cur as keyof Console

        // check if the method is available on console (web doesn't have
        // 'silent', for example) before adding to acc
        if (console[prop]) {
            // @ts-ignore
            acc[prop] = console[prop].bind(console, `${component}:`)
        }
        return acc
    }, {} as Console)
}

// logging interface expects a 'setLevel' method
getLogger.setLevel = () => {}
getLogger.setLogLevelsConfig = () => {}
getLogger.setMaskingPatterns = () => {}
getLogger.waitForBuffer = () => {}
getLogger.clearLogger = () => {}
