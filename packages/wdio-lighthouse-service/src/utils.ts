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

/**
 * Puppeteer 24+ returns a Uint8Array from `page.tracing.stop()`.
 * `Uint8Array#toString()` joins bytes with commas, so decode as UTF-8 first.
 */
export function parseTraceBuffer (buffer: Buffer | Uint8Array | string): { traceEvents?: unknown[] } & Record<string, unknown> {
    const raw = typeof buffer === 'string'
        ? buffer
        : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength).toString('utf8')
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
    if (Array.isArray(parsed)) {
        return { traceEvents: parsed }
    }
    if (parsed && typeof parsed === 'object') {
        return parsed as { traceEvents?: unknown[] } & Record<string, unknown>
    }
    throw new Error('Trace buffer did not contain JSON trace data')
}
