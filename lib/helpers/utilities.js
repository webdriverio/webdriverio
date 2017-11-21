/**
 * check if WebDriver requests was successful
 * @param  {Object}  body  body payload of response
 * @return {Boolean}       true if request was successful
 */
export function isSuccessfulResponse (body) {
    /**
     * response contains a body
     */
    if (!body) {
        return true
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
    if (err.message.match(/(did not match a known command|unknown command)/)) {
        return true
    }

    /**
     * when running via selenium standalone
     */
    if (err.seleniumStack && err.seleniumStack.type === 'UnknownCommand') {
        return true
    }

    return false
}
