import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants'
import { RequestPayload } from './handler/network'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

const VERSION_PROPS = ['browserVersion', 'browser_version', 'version']
const SUPPORTED_BROWSERS_AND_MIN_VERSIONS = {
    'chrome': 63,
    'chromium' : 63,
    'googlechrome': 63,
    'google chrome': 63
}

export function setUnsupportedCommand (browser: Browser | MultiRemoteBrowser) {
    return browser.addCommand('cdp', /* istanbul ignore next */() => {
        throw new Error(UNSUPPORTED_ERROR_MESSAGE)
    })
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
 * @param  {String}  url to check for
 * @return {Boolean}     true if url was opened by user
 */
export function isSupportedUrl (url: string) {
    return IGNORED_URLS.filter((ignoredUrl) => url.startsWith(ignoredUrl)).length === 0
}

/**
 * check if browser version is lower than `minVersion`
 * @param {object} caps capabilities
 * @param {number} minVersion minimal chrome browser version
 */
export function isBrowserVersionLower (caps: Capabilities.Capabilities, minVersion: number) {
    const versionProp = VERSION_PROPS.find(
        (prop: keyof Capabilities.Capabilities) => caps[prop]
    ) as 'browserVersion'
    const browserVersion = getBrowserMajorVersion(caps[versionProp])
    return typeof browserVersion === 'number' && browserVersion < minVersion
}

/**
 * get chromedriver major version
 * @param   {string|*}      version chromedriver version like `78.0.3904.11` or just `78`
 * @return  {number|*}              either major version, ex `78`, or whatever value is passed
 */
export function getBrowserMajorVersion (version?: string | number) {
    if (typeof version === 'string') {
        const majorVersion = Number(version.split('.')[0])
        return isNaN(majorVersion) ? parseInt(version, 10) : majorVersion
    }
    return version
}

/**
 * check if browser is supported based on caps.browserName and caps.version
 * @param {object} caps capabilities
 */
export function isBrowserSupported(caps: Capabilities.Capabilities) {
    if (
        !caps.browserName ||
        !(caps.browserName.toLowerCase() in SUPPORTED_BROWSERS_AND_MIN_VERSIONS) ||
        isBrowserVersionLower(
            caps,
            SUPPORTED_BROWSERS_AND_MIN_VERSIONS[
                caps.browserName.toLowerCase() as keyof typeof SUPPORTED_BROWSERS_AND_MIN_VERSIONS
            ]
        )
    ) {
        return false
    }

    return true
}
