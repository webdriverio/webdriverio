import { IGNORED_URLS, UNSUPPORTED_ERROR_MESSAGE } from './constants'

const VERSION_PROPS = ['browserVersion', 'browser_version', 'version']
const SUPPORTED_BROWSERS_AND_MIN_VERSIONS = {
    'chrome': 63,
    'chromium' : 63,
    'googlechrome': 63,
    'google chrome': 63
}

export function setUnsupportedCommand () {
    return global.browser.addCommand('cdp', /* istanbul ignore next */() => {
        throw new Error(UNSUPPORTED_ERROR_MESSAGE)
    })
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
