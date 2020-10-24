import fs from 'fs'
import path from 'path'
import CDP from 'chrome-remote-interface'
import logger from '@wdio/logger'

import { IGNORED_URLS } from './constants'

const log = logger('@wdio/devtools-service:utils')

const RE_DEVTOOLS_DEBUGGING_PORT_SWITCH = /--remote-debugging-port=(\d*)/
const RE_USER_DATA_DIR_SWITCH = /--user-data-dir=([^-]*)/
const VERSION_PROPS = ['browserVersion', 'browser_version', 'version']
const SUPPORTED_BROWSERS_AND_MIN_VERSIONS = {
    'chrome': 63,
    'chromium' : 63,
    'googlechrome': 63,
    'google chrome': 63
}

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
 * check if browser version is lower than `minVersion`
 * @param {object} caps capabilities
 * @param {number} minVersion minimal chrome browser version
 */
export function isBrowserVersionLower (caps, minVersion) {
    const browserVersion = getBrowserMajorVersion(caps[VERSION_PROPS.find(prop => caps[prop])])
    return typeof browserVersion === 'number' && browserVersion < minVersion
}

/**
 * get chromedriver major version
 * @param   {string|*}      version chromedriver version like `78.0.3904.11` or just `78`
 * @return  {number|*}              either major version, ex `78`, or whatever value is passed
 */
export function getBrowserMajorVersion (version) {
    let majorVersion = version
    if (typeof version === 'string') {
        majorVersion = Number(version.split('.')[0])
        majorVersion = isNaN(majorVersion) ? version : majorVersion
    }
    return majorVersion
}

/**
 * check if browser is supported based on caps.browserName and caps.version
 * @param {object} caps capabilities
 */
export function isBrowserSupported(caps) {
    if (
        !caps.browserName ||
        !(caps.browserName.toLowerCase() in SUPPORTED_BROWSERS_AND_MIN_VERSIONS) ||
        isBrowserVersionLower(caps, SUPPORTED_BROWSERS_AND_MIN_VERSIONS[caps.browserName.toLowerCase()])){
        return false
    }
    return true
}
