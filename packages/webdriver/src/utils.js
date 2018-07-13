import logger from 'wdio-logger'

import command from './command'
import WebDriverProtocol from '../protocol/webdriver.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import JsonWProtocol from '../protocol/jsonwp.json'
import AppiumProtocol from '../protocol/appium.json'

const log = logger('webdriver')

/**
 * check if WebDriver requests was successful
 * @param  {Object}  body  body payload of response
 * @return {Boolean}       true if request was successful
 */
export function isSuccessfulResponse ({ body, statusCode } = {}) {
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
    if (body.status && body.status === 7 && body.value.message && body.value.message.startsWith('no such element')) {
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
        if (!(typeof argEntity).match(expectedType)) {
            return false
        }
    }

    return true
}

/**
 * creates the base prototype for the webdriver monad
 */
export function getPrototype (isW3C) {
    const prototype = {}
    const ProtocolCommands = Object.assign(
        isW3C ? WebDriverProtocol : JsonWProtocol,
        MJsonWProtocol,
        AppiumProtocol
    )

    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: command(method, endpoint, commandData) }
        }
    }

    return prototype
}
