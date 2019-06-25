import logger from '@wdio/logger'

import command from './command'
import merge from 'lodash.merge'
import WebDriverProtocol from '../protocol/webdriver.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import JsonWProtocol from '../protocol/jsonwp.json'
import AppiumProtocol from '../protocol/appium.json'
import ChromiumProtocol from '../protocol/chromium.json'
import SauceLabsProtocol from '../protocol/saucelabs.json'

const log = logger('webdriver')

/**
 * check if WebDriver requests was successful
 * @param  {Object}  body  body payload of response
 * @return {Boolean}       true if request was successful
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
     * ignore failing element request to enable lazy loading capability
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
     * if it has a status property, it should be 0
     * (just here to stay backwards compatible to the jsonwire protocol)
     */
    if (body.status && body.status !== 0) {
        log.debug(`request failed due to status ${body.status}`)
        return false
    }

    const hasErrorResponse = body.value && (body.value.error || body.value.stackTrace || body.value.stacktrace)

    /**
     * check status code
     */
    if (statusCode === 200 && !hasErrorResponse) {
        return true
    }

    /**
     * if an element was not found we don't flag it as failed request because
     * we lazy load it
     */
    if (statusCode === 404 && body.value && body.value.error === 'no such element') {
        return true
    }

    /**
     * that has no error property (Appium only)
     */
    if (hasErrorResponse) {
        log.debug('request failed due to response error:', body.value.error)
        return false
    }

    return true
}

/**
 * checks if command argument is valid according to specificiation
 *
 * @param  {*}       arg           command argument
 * @param  {Object}  expectedType  parameter type (e.g. `number`, `string[]` or `(number|string)`)
 * @return {Boolean}               true if argument is valid
 */
export function isValidParameter (arg, expectedType) {
    let shouldBeArray = false

    if (expectedType.slice(-2) === '[]') {
        expectedType = expectedType.slice(0, -2)
        shouldBeArray = true
    }

    /**
     * check type of each individual array element
     */
    if (shouldBeArray) {
        if (!Array.isArray(arg)) {
            return false
        }
    } else {
        /**
         * transform to array to have a unified check
         */
        arg = [arg]
    }

    for (const argEntity of arg) {
        const argEntityType = getArgumentType(argEntity)
        if (!argEntityType.match(expectedType)) {
            return false
        }
    }

    return true
}

/**
 * get type of command argument
 */
export function getArgumentType (arg) {
    return arg === null ? 'null' : typeof arg
}

/**
 * creates the base prototype for the webdriver monad
 */
export function getPrototype ({ isW3C, isChrome, isMobile, isSauce }) {
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
        isSauce ? SauceLabsProtocol : {}
    )

    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: command(method, endpoint, commandData) }
        }
    }

    return prototype
}

/**
 * get command call structure
 * (for logging purposes)
 */
export function commandCallStructure (commandName, args) {
    const callArgs = args.map((arg) => {
        if (typeof arg === 'string') {
            arg = `"${arg}"`
        } else if (typeof arg === 'function') {
            arg = '<fn>'
        } else if (arg === null) {
            arg = 'null'
        } else if (typeof arg === 'object') {
            arg = '<object>'
        } else if (typeof arg === 'undefined') {
            arg = typeof arg
        }

        return arg
    }).join(', ')

    return `${commandName}(${callArgs})`
}

/**
 * check if session is based on W3C protocol based on the /session response
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if W3C (browser)
 */
export function isW3C (capabilities) {
    /**
     * JSONWire protocol doesn't return a property `capabilities`.
     * Also check for Appium response as it is using JSONWire protocol for most of the part.
     */
    if (!capabilities) {
        return false
    }

    /**
     * assume session to be a WebDriver session when
     * - capabilities are returned
     *   (https://w3c.github.io/webdriver/#dfn-new-sessions)
     * - it is an Appium session (since Appium is full W3C compliant)
     */
    const isAppium = capabilities.automationName || capabilities.deviceName
    const hasW3CCaps = (
        capabilities.platformName &&
        capabilities.browserVersion &&
        /**
         * local safari and BrowserStack don't provide platformVersion therefor
         * check also if setWindowRect is provided
         */
        (capabilities.platformVersion || Object.prototype.hasOwnProperty.call(capabilities, 'setWindowRect'))
    )
    return Boolean(hasW3CCaps || isAppium)
}

/**
 * check if session is run by Chromedriver
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run by Chromedriver
 */
export function isChrome (caps) {
    return (
        Boolean(caps.chrome) ||
        Boolean(caps['goog:chromeOptions'])
    )
}

/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
export function isMobile (caps) {
    return Boolean(
        (typeof caps['appium-version'] !== 'undefined') ||
        (typeof caps['device-type'] !== 'undefined') || (typeof caps['deviceType'] !== 'undefined') ||
        (typeof caps['device-orientation'] !== 'undefined') || (typeof caps['deviceOrientation'] !== 'undefined') ||
        (typeof caps.deviceName !== 'undefined') ||
        // Check browserName for specific values
        (caps.browserName === '' ||
             (caps.browserName !== undefined && (caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android')))
    )
}

/**
 * check if session is run on iOS device
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run on iOS device
 */
export function isIOS (caps) {
    return Boolean(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i))
    )
}

/**
 * check if session is run on Android device
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run on Android device
 */
export function isAndroid (caps) {
    return Boolean(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i))
    )
}

/**
 * detects if session is run on Sauce with extended debugging enabled
 * @param  {string}  hostname     hostname of session request
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is running on Sauce with extended debugging enabled
 */
export function isSauce (hostname, caps) {
    return Boolean(
        hostname &&
        hostname.includes('saucelabs') &&
        (
            caps.extendedDebugging ||
            (
                caps['sauce:options'] &&
                caps['sauce:options'].extendedDebugging
            )
        )
    )
}

/**
 * returns information about the environment
 * @param  {Object}  hostname      name of the host to run the session against
 * @param  {Object}  capabilities  caps of session response
 * @return {Object}                object with environment flags
 */
export function environmentDetector ({ hostname, capabilities, requestedCapabilities }) {
    return {
        isW3C: isW3C(capabilities),
        isChrome: isChrome(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(hostname, requestedCapabilities.w3cCaps.alwaysMatch)
    }
}

/**
 * helper method to determine the error from webdriver response
 * @param  {Object} body body object
 * @return {Object} error
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

//Exporting for testability
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
 * overwrite native element commands with user defined
 * @param {object} propertiesObject propertiesObject
 */
export function overwriteElementCommands(propertiesObject) {
    const elementOverrides = propertiesObject['__elementOverrides__'] ? propertiesObject['__elementOverrides__'].value : {}

    for (const [commandName, userDefinedCommand] of Object.entries(elementOverrides)) {
        if (typeof userDefinedCommand !== 'function') {
            throw new Error('overwriteCommand: commands be overwritten only with functions, command: ' + commandName)
        }

        if (!propertiesObject[commandName]) {
            throw new Error('overwriteCommand: no command to be overwritten: ' + commandName)
        }

        if (typeof propertiesObject[commandName].value !== 'function') {
            throw new Error('overwriteCommand: only functions can be overwritten, command: ' + commandName)
        }

        const origCommand = propertiesObject[commandName].value
        delete propertiesObject[commandName]

        const newCommand = function (...args) {
            return userDefinedCommand.apply(this, [origCommand.bind(this), ...args])
        }

        propertiesObject[commandName] = {
            value: newCommand,
            configurable: true
        }
    }

    delete propertiesObject['__elementOverrides__']
    propertiesObject['__elementOverrides__'] = { value: {} }
}

/**
 * return all supported flags and return them in a format so we can attach them
 * to the instance protocol
 * @param  {Object} options   driver instance or option object containing these flags
 * @return {Object}           prototype object
 */
export function getEnvironmentVars({ isW3C, isMobile, isIOS, isAndroid, isChrome, isSauce }) {
    return {
        isW3C: { value: isW3C },
        isMobile: { value: isMobile },
        isIOS: { value: isIOS },
        isAndroid: { value: isAndroid },
        isChrome: { value: isChrome },
        isSauce: { value: isSauce }
    }
}
