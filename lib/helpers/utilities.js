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
     * that has no error property (Appium only)
     */
    if (body.value.error || body.value.stackTrace || body.value.stacktrace) {
        return false
    }

    return true
}
