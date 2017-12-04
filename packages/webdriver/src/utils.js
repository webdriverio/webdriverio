import logger from 'wdio-logger'

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
    if (!body) {
        log.debug('request failed due to missing body')
        return false
    }

    /**
     * if it has a status property, it should be 0
     * (just here to stay backwards compatible to the jsonwire protocol)
     */
    if (body.status && body.status !== 0) {
        log.debug(`request failed due to status ${body.status}`)
        return false
    }

    /**
     * the body contains an actual result
     */
    if (typeof body.value === 'undefined') {
        log.debug('request failed due to missing value in body')
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
     * that has no error property (Appium only)
     */
    if (hasErrorResponse) {
        log.debug('request failed due to response error')
        return false
    }

    return true
}
