import net from 'net'

/**
 * check if WebDriver requests was successful
 * @param  {Object}  body  body payload of response
 * @return {Boolean}       true if request was successful
 */
export function isSuccessfulResponse ({ body, statusCode } = {}) {
    /**
     * response contains a body
     */
    if (!body) {
        return false
    }

    /**
     * if it has a status property, it should be 0
     * (just here to stay backwards compatible to the jsonwire protocol)
     */
    if (body.status && body.status !== 0) {
        return false
    }

    /**
     * the body contains an actual result
     */
    if (typeof body.value === 'undefined') {
        return false
    }

    /**
     * check status code
     */
    if (statusCode === 200) {
        return true
    }

    /**
     * that has no error property (Appium only)
     */
    if (body.value && (body.value.error || body.value.stackTrace || body.value.stacktrace)) {
        return false
    }

    return true
}

export function isUnknownCommand (err) {
    if (!err || typeof err !== 'object') {
        return false
    }

    /**
     * when running browser driver directly
     */
    if (err.message.match(/Command not found/) ||
        err.message.match(/Invalid Command Method/) ||
        err.message.match(/did not match a known command/) ||
        err.message.match(/unknown command/) ||
        err.message.match(/Driver info: driver\.version: unknown/) ||
        err.message.match(/Method has not yet been implemented/) ||
        err.message.match(/did not map to a valid resource/)
    ) {
        return true
    }

    /**
     * when running via selenium standalone
     */
    if (err.seleniumStack && err.seleniumStack.type.match(/Unknown/)) {
        return true
    }

    return false
}

/**
 * Checks if the error message is an unknown error
 * https://w3c.github.io/webdriver/#dfn-unknown-error
 * @param {Error} err
 * @return {Boolean} Whether the error message is an "Unknown Error"
 */
export function isUnknownError (err) {
    if (!err || typeof err !== 'object') {
        return false
    }

    if (err.message.match(/Unknown error/i)) {
        return true
    }

    return false
}

/**
 * Prepare the hostname to properly use IPv6 address
 * @param {string} hostname
 * @returns {string}
 */
export function formatHostname (hostname) {
    return net.isIPv6(hostname) ? `[${hostname}]` : hostname
}
