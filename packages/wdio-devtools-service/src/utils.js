import fs from 'fs'
import path from 'path'
import CDP from 'chrome-remote-interface'
import logger from '@wdio/logger'

import { IGNORED_URLS } from './constants'

const log = logger('@wdio/devtools-service:utils')

const RE_DEVTOOLS_DEBUGGING_PORT_SWITCH = /--remote-debugging-port=(\d*)/
const RE_USER_DATA_DIR_SWITCH = /--user-data-dir=([^-]*)/

/**
 * Find Chrome DevTools Interface port by checking Chrome switches from the chrome://version
 * page. In case a newer version is used (+v65) we check the DevToolsActivePort file
 */
export async function findCDPInterface () {
    /**
     * check if interface is part of goog:chromeOptions value
     */
    const chromeOptions = global.browser.capabilities['goog:chromeOptions']
    if (chromeOptions && chromeOptions.debuggerAddress) {
        const [host, port] = chromeOptions.debuggerAddress.split(':')
        return { host, port: parseInt(port, 10) }
    }

    /**
     * otherwise look into chrome flags
     */
    await global.browser.url('chrome://version')
    const cmdLineTextElem = await global.browser.$('#command_line')
    const cmdLineText = await cmdLineTextElem.getText()
    let port = parseInt(cmdLineText.match(RE_DEVTOOLS_DEBUGGING_PORT_SWITCH)[1], 10)

    /**
     * newer Chrome versions store port in DevToolsActivePort file
     */
    if (port === 0) {
        const userDataDir = cmdLineText.match(RE_USER_DATA_DIR_SWITCH)[1].trim()
        const devToolsActivePortFile = fs.readFileSync(path.join(userDataDir, 'DevToolsActivePort'), 'utf8')
        port = parseInt(devToolsActivePortFile.split('\n').shift(), 10)
    }

    return { host: 'localhost', port }
}

export function getCDPClient ({ host, port }) {
    return new Promise((resolve) => CDP({
        host,
        port,
        target: /* istanbul ignore next */ (targets) => targets.findIndex((t) => t.type === 'page')
    }, resolve))
}

export async function readIOStream (cdp, stream) {
    let isEOF = false
    let tracingChunks = ''

    log.info(`start fetching IO stream with id ${stream}`)
    while (!isEOF) {
        const { data, eof } = await cdp('IO', 'read', { handle: stream })
        tracingChunks += data

        if (eof) {
            isEOF = true
            log.info(`finished fetching IO stream with id ${stream}`)
            return JSON.parse(tracingChunks)
        }
    }
}

export function sumByKey (list, key) {
    return list.map((data) => data[key]).reduce((acc, val) => acc + val, 0)
}

/**
 * check if url is supported for tracing
 * @param  {String}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
}

/**
 * Approximates the Gauss error function, the probability that a random variable
 * from the standard normal distribution lies within [-x, x]. Moved from
 * traceviewer.b.math.erf, based on Abramowitz and Stegun, formula 7.1.26.
 * @param {number} x
 * @return {number}
 */
function internalErf_ (x) {
    // erf(-x) = -erf(x);
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)

    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911
    const t = 1 / (1 + p * x)
    const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))))
    return sign * (1 - y * Math.exp(-x * x))
}

/**
 * Creates a log-normal distribution and finds the complementary
 * quantile (1-percentile) of that distribution at value. All
 * arguments should be in the same units (e.g. milliseconds).
 *
 * @param {number} median
 * @param {number} falloff
 * @param {number} value
 * @return The complement of the quantile at value.
 * @customfunction
 */
export function quantileAtValue (median, falloff, value) {
    const location = Math.log(median)

    // The "falloff" value specified the location of the smaller of the positive
    // roots of the third derivative of the log-normal CDF. Calculate the shape
    // parameter in terms of that value and the median.
    const logRatio = Math.log(falloff / median)
    const shape = Math.sqrt(1 - 3 * logRatio - Math.sqrt((logRatio - 3) * (logRatio - 3) - 8)) / 2

    const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape)
    return (1 - internalErf_(standardizedX)) / 2
}
