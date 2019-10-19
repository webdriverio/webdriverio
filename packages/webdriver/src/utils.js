import merge from 'lodash.merge'
import logger from '@wdio/logger'
import {
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol, ChromiumProtocol,
    SauceLabsProtocol, SeleniumProtocol
} from '@wdio/protocols'

import WebDriverRequest from './request'
import command from './command'

const log = logger('webdriver')

const MOBILE_BROWSER_NAMES = ['ipad', 'iphone', 'android']
const MOBILE_CAPABILITIES = [
    'appium-version', 'appiumVersion', 'device-type', 'deviceType',
    'device-orientation', 'deviceOrientation', 'deviceName'
]

/**
 * Start browser session with WebDriver protocol.
 */
export async function startWebDriverSession (params) {
    /**
     * The user could have passed in either W3C-style or JSON-WP-style `caps`,
     * and we want to pass both styles to the server. 
     * Therefore, we must check which style the user provided, so we can determine how to 
     * construct the object for the other style.
     */
    const [w3cCaps, jsonwpCaps] = params.capabilities && params.capabilities.alwaysMatch
        /**
         * In case W3C-compliant capabilities are provided.
         */
        ? [params.capabilities, params.capabilities.alwaysMatch]
        /**
         * Otherwise, assume they passed in JSON-WP-style caps (flat object)
         */
        : [{ alwaysMatch: params.capabilities, firstMatch: [{}] }, params.capabilities]

    const sessionRequest = new WebDriverRequest(
        'POST',
        '/session',
        {
            capabilities: w3cCaps,          // W3C compliant
            desiredCapabilities: jsonwpCaps // JSONWP compliant
        }
    )

    const response = await sessionRequest.makeRequest(params)
    const sessionId = response.value.sessionId || response.sessionId

    /**
     * Save original set of capabilities. This allows a request for the same session again.
     * (e.g., for `reloadSession` command in WebdriverIO.)
     */
    params.requestedCapabilities = { w3cCaps, jsonwpCaps }

    /**
     * Save actual receveived session details.
     */
    params.capabilities = response.value.capabilities || response.value

    return sessionId
}

/**
 * Check if WebDriver request was successful.
 * @param  {Object}  body  - Body payload of response
 * @return {Boolean}       - True if request was successful
 */
export function isSuccessfulResponse (statusCode, body) {
    /**
     * response contains a body
     */
    if (!body || typeof body.value === 'undefined') {
        log.debug('request failed due to missing body')
        return false
    }

    /**
     * Ignore failing element request to enable lazy loading capability
     */
    if (
        body.status === 7 && body.value && body.value.message &&
        (
            body.value.message.toLowerCase().startsWith('no such element') ||
            // Appium
            body.value.message === 'An element could not be located on the page using the given search parameters.' ||
            // Internet Explorter
            body.value.message.toLowerCase().startsWith('unable to find element')
        )
    ) {
        return true
    }

    /**
     * If it has a status property, it should be 0.
     * (This is only here to stay backwards-compatible with the JSON Wire Protocol)
     */
    if (body.status && body.status !== 0) {
        log.debug(`request failed due to status ${body.status}`)
        return false
    }

    const hasErrorResponse = body.value && (body.value.error || body.value.stackTrace || body.value.stacktrace)

    /**
     * Check status code
     */
    if (statusCode === 200 && !hasErrorResponse) {
        return true
    }

    /**
     * If an element was not found, don't flag it as a failed request,
     * because we lazy load it.
     */
    if (statusCode === 404 && body.value && body.value.error === 'no such element') {
        return true
    }

    /**
     * That has no error property (Appium only).
     */
    if (hasErrorResponse) {
        log.debug('request failed due to response error:', body.value.error)
        return false
    }

    return true
}

/**
 * Creates the base prototype for the webdriver monad.
 */
export function getPrototype ({ isW3C, isChrome, isMobile, isSauce, isSeleniumStandalone }) {
    const prototype = {}
    const ProtocolCommands = merge(
        /**
         * if mobile apply JSONWire and WebDriver protocol because
         * some legacy JSONWire commands are still used in Appium
         * (e.g. set/get geolocation)
         */
        isMobile
            ? merge({}, JsonWProtocol, WebDriverProtocol)
            : isW3C ? WebDriverProtocol : JsonWProtocol,
        /**
         * only apply mobile protocol if session is actually for mobile
         */
        isMobile ? merge({}, MJsonWProtocol, AppiumProtocol) : {},
        /**
         * only apply special Chrome commands if session is using Chrome
         */
        isChrome ? ChromiumProtocol : {},
        /**
         * only Sauce Labs specific vendor commands
         */
        isSauce ? SauceLabsProtocol : {},
        /**
         * only apply special commands when running tests using
         * Selenium Grid or Selenium Standalone server
         */
        isSeleniumStandalone ? SeleniumProtocol : {}
    )

    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: command(method, endpoint, commandData, isSeleniumStandalone) }
        }
    }

    return prototype
}

/**
 * Check if session is based on W3C protocol based on the `/session` response
 * @param  {Object}  capabilities  - Capabilities of session response
 * @return {Boolean}               - True if W3C (browser)
 */
export function isW3C (capabilities) {
    /**
     * JSONWire protocol doesn't return a property `capabilities`.
     * Also check for Appium response (as it is using JSONWire protocol for most of the part).
     */
    if (!capabilities) {
        return false
    }

    /**
     * Assume session to be a WebDriver session when
     * - capabilities are returned
     *   (https://w3c.github.io/webdriver/#dfn-new-sessions)
     * - it is an Appium session (since Appium is full W3C compliant)
     */
    const isAppium = capabilities.automationName || capabilities.deviceName || (capabilities.appiumVersion)
    const hasW3CCaps = (
        capabilities.platformName &&
        capabilities.browserVersion &&
        /**
         * Local Safari and BrowserStack don't provide `platformVersion`. Therefore
         * check also if setWindowRect is provided
         */
        (capabilities.platformVersion || Object.prototype.hasOwnProperty.call(capabilities, 'setWindowRect'))
    )
    return Boolean(hasW3CCaps || isAppium)
}

/**
 * Check whether session is run by Chromedriver.
 * @param  {Object}  capabilities  - Caps of session response
 * @return {Boolean}               - True if run by Chromedriver
 */
export function isChrome (caps) {
    return (
        Boolean(caps.chrome) ||
        Boolean(caps['goog:chromeOptions'])
    )
}

/**
 * Check if current platform is mobile device.
 *
 * @param  {Object}  caps  - Capabilities
 * @return {Boolean}       - True if platform is mobile device
 */
export function isMobile (caps) {
    const browserName = (caps.browserName || '').toLowerCase()

    /**
     * We have mobile capabilities if
     */
    return Boolean(
        /**
         * ...capabilities contain mobile only specific capabilities, or...
         */
        Object.keys(caps).find((cap) => MOBILE_CAPABILITIES.includes(cap)) ||
        /**
         * ...browserName is empty (and eventually app is defined), or...
         */
        caps.browserName === '' ||
        /**
         * ...browserName is a mobile browser.
         */
        MOBILE_BROWSER_NAMES.includes(browserName)
    )
}

/**
 * Check if session is run on iOS device.
 * @param  {Object}  capabilities  - Caps of session response
 * @return {Boolean}               - True if run on iOS device
 */
export function isIOS (caps) {
    return Boolean(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i))
    )
}

/**
 * Check if session is run on Android device.
 * @param  {Object}  capabilities  - Caps of session response
 * @return {Boolean}               - True if run on Android device
 */
export function isAndroid (caps) {
    return Boolean(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i))
    )
}

/**
 * Detects if session is run on Sauce with extended debugging enabled.
 * @param  {string}  hostname     - Hostname of session request
 * @param  {object}  capabilities - Session capabilities
 * @return {Boolean}              - True if session is running on Sauce with extended debugging enabled
 */
export function isSauce (hostname, caps) {
    return Boolean(
        caps.extendedDebugging ||
        (
            caps['sauce:options'] &&
            caps['sauce:options'].extendedDebugging
        )
    )
}

/**
 * Setects if session is run using Selenium Standalone server.
 * @param  {object}  capabilities - Session capabilities
 * @return {Boolean}              - True if session is run with Selenium Standalone Server
 */
export function isSeleniumStandalone (caps) {
    return Boolean(caps['webdriver.remote.sessionid'])
}

/**
 * Returns information about the environment.
 * @param  {Object}  hostname     - Name of the host to run the session against
 * @param  {Object}  capabilities - Caps of session response
 * @return {Object}               - Object with environment flags
 */
export function environmentDetector ({ hostname, capabilities, requestedCapabilities }) {
    return {
        isW3C: isW3C(capabilities),
        isChrome: isChrome(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(hostname, requestedCapabilities.w3cCaps.alwaysMatch),
        isSeleniumStandalone: isSeleniumStandalone(capabilities)
    }
}

/**
 * Helper method to determine the error from WebDriver response.
 * @param  {Object} body - Body object
 * @return {Object} - Error
 */
export function getErrorFromResponseBody (body) {
    if (!body) {
        return new Error('Response has empty body')
    }

    if (typeof body === 'string' && body.length) {
        return new Error(body)
    }

    if (typeof body !== 'object' || !body.value) {
        return new Error('unknown error')
    }

    return new CustomRequestError(body)
}

// Exporting for testability
export class CustomRequestError extends Error {
    constructor(body) {
        super(body.value.message || body.value.class || 'unknown error')
        if (body.value.error) {
            this.name = body.value.error
        } else if (body.value.message && body.value.message.includes('stale element reference')) {
            this.name = 'stale element reference'
        }
    }
}

/**
 * Return all supported flags. Format flags so we can attach them to the instance protocol.
 * @param  {Object} options  - Driver instance or option object containing these flags
 * @return {Object}          - Prototype object
 */
export function getEnvironmentVars({ isW3C, isMobile, isIOS, isAndroid, isChrome, isSauce }) {
    return {
        isW3C: { value: isW3C },
        isMobile: { value: isMobile },
        isIOS: { value: isIOS },
        isAndroid: { value: isAndroid },
        isChrome: { value: isChrome },
        isSauce: { value: isSauce },
        isSeleniumStandalone: { value: isSeleniumStandalone }
    }
}

/**
 * Decorate the params object with host updates, based on the presence of
 * `directConnect` capabilities in the new session response. 
 * Note that this mutates the object.
 * @param  {Object} params   - Post-new-session params used to build driver
 */
export function setupDirectConnect(params) {
    const { directConnectProtocol, directConnectHost, directConnectPort,
        directConnectPath } = params.capabilities
    if (directConnectProtocol && directConnectHost && directConnectPort &&
        (directConnectPath || directConnectPath === '')) {
        log.info('Found direct connect information in new session response. ' +
            `Will connect to server at ${directConnectProtocol}://` +
            `${directConnectHost}:${directConnectPort}/${directConnectPath}`)
        params.protocol = directConnectProtocol
        params.hostname = directConnectHost
        params.port = directConnectPort
        params.path = directConnectPath
    }
}
