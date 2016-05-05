import { ERROR_CODES } from '../helpers/constants'

class ErrorHandler extends Error {
    constructor (type, msg) {
        super()
        Error.captureStackTrace(this, this.constructor)

        if (typeof msg === 'number') {
            // if ID is not known error throw UnknownError
            if (!ERROR_CODES[msg]) {
                msg = 13
            }

            this.type = ERROR_CODES[msg].id
            this.message = ERROR_CODES[msg].message
        } else if (arguments.length === 2) {
            this.message = msg
            this.type = type
        } else if (arguments.length === 1) {
            this.type = 'WebdriverIOError'
            this.message = type
        }

        if (typeof this.message === 'object') {
            let seleniumStack = this.message

            if (seleniumStack.screenshot) {
                this.screenshot = seleniumStack.screenshot
                delete seleniumStack.screenshot
            }

            if (seleniumStack.message && seleniumStack.type && seleniumStack.status) {
                if (seleniumStack.orgStatusMessage && seleniumStack.orgStatusMessage.match(/"errorMessage":"NoSuchElement"/)) {
                    seleniumStack.type = 'NoSuchElement'
                    seleniumStack.status = 7
                    seleniumStack.message = ERROR_CODES['7'].message
                }

                this.message = seleniumStack.message + ' (' + seleniumStack.type + ':' + seleniumStack.status + ')'
            }

            if (seleniumStack.orgStatusMessage) {
                let reqPos = seleniumStack.orgStatusMessage.indexOf(',"request"')
                let problem = ''

                if (reqPos > 0) {
                    problem = JSON.parse(seleniumStack.orgStatusMessage.slice(0, reqPos) + '}').errorMessage
                } else {
                    problem = seleniumStack.orgStatusMessage
                }

                if (problem.indexOf('No enum constant org.openqa.selenium.Platform') > -1) {
                    problem = 'The Selenium backend you\'ve chosen doesn\'t support the desired platform (' + problem.slice(46) + ')'
                }

                // truncate errorMessage
                if (problem.indexOf('(Session info:') > -1) {
                    problem = problem.slice(0, problem.indexOf('(Session info:')).trim()
                }

                // make assumption based on experience on certain error messages
                if (problem.indexOf('unknown error: path is not absolute') !== -1) {
                    problem = 'You are trying to set a value to an input field with type="file", use the `uploadFile` command instead (Selenium error: ' + problem + ')'
                }

                this.message = problem
                this.seleniumStack = seleniumStack
            }
        }
    }

    /**
     * make stack loggable
     * @return {Object} error log
     */
    toJSON () {
        return {
            name: this.type,
            message: this.message
        }
    }
}

let CommandError = function (msg) {
    return new ErrorHandler('CommandError', msg)
}
let ProtocolError = function (msg) {
    return new ErrorHandler('ProtocolError', msg)
}
let RuntimeError = function (msg) {
    return new ErrorHandler('RuntimeError', msg)
}
let WaitForTimeoutError = function (msg) {
    return new ErrorHandler('WaitForTimeoutError', msg)
}

/**
 * Check if current error is caused by timeout
 * @param {Object} err
 * @returns {Boolean}
 */
let isTimeoutError = function (e) {
    return e.message === 'Promise was rejected with the following reason: timeout'
}

export {
    ErrorHandler,
    CommandError,
    ProtocolError,
    RuntimeError,
    WaitForTimeoutError,
    isTimeoutError
}
export default ErrorHandler
