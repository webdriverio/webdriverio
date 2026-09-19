import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants.js'
import type { RequestPayload } from './handler/network.js'

const CUSTOM_COMMANDS = [
    'getMetrics',
    'startTracing',
    'getDiagnostics',
    'getCoverageReport',
    'enablePerformanceAudits',
    'disablePerformanceAudits',
    'getMainThreadWorkBreakdown',
    'checkPWA',
    'getPerformanceScore',
    'getTraceLogs',
    'getPageWeight',
    'endTracing'
]

export function setUnsupportedCommand (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
    for (const command of CUSTOM_COMMANDS) {
        (browser as WebdriverIO.Browser).addCommand(command, /* istanbul ignore next */() => {
            throw new Error(UNSUPPORTED_ERROR_MESSAGE)
        }, {})
    }
}

/**
 * Create a sum of a specific key from a list of objects
 * @param list list of key/value objects
 * @param key  key of value to be summed up
 */
export function sumByKey (list: RequestPayload[], key: keyof RequestPayload) {
    return list.map((data) => data[key]).reduce((acc, val) => acc + val, 0)
}

/**
 * check if url is supported for tracing
 * @param  {string}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url: string) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
}
