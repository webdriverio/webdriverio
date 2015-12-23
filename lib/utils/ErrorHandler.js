import { ERROR_CODES } from '../helpers/constants'

class CommandCall {
    constructor (name, args) {
        this.name = name
        this.args = args
    }
}

class ErrorHandler extends Error {
    constructor (typeOrMsg, msg, previousError, commandCall) {
        super()
        Error.captureStackTrace(this, this.constructor)

        if (typeof msg === 'number') {
            // if ID is not known error throw UnknownError
            if (!ERROR_CODES[msg]) {
                msg = 13
            }

            this.type = ERROR_CODES[msg].id
            this.message = ERROR_CODES[msg].message
        } else if (typeof typeOrMsg === 'string') {
            this.message = msg
            this.type = typeOrMsg
        } else {
            this.type = 'WebdriverIOError'
            this.message = typeOrMsg
        }

        if (typeof this.message === 'object') {
            let seleniumStack = this.message

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
                    problem = problem.slice(0, problem.indexOf('(Session info:')).replace(/\n/g, '').trim()
                }

                // make assumption based on experience on certain error messages
                if (problem.indexOf('unknown error: path is not absolute') !== -1) {
                    problem = 'You are trying to set a value to an input field with type="file", use the `uploadFile` command instead (Selenium error: ' + problem + ')'
                }

                this.message = problem
                this.seleniumStack = seleniumStack
            }
        }

        if (previousError) this.previousError = previousError
        if (commandCall) this.commandCall = commandCall
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

let CommandError = function () {
    return new ErrorHandler('CommandError', ...arguments)
}
let ProtocolError = function () {
    return new ErrorHandler('ProtocolError', ...arguments)
}
let RuntimeError = function () {
    return new ErrorHandler('RuntimeError', ...arguments)
}

function captureCommandCall (args) {
    const matches = Error().stack.match(/lib\/(?:protocol|commands)\/(\w+)/)
    if (matches) return new CommandCall(matches[1], Array.from(args))
}

export {
    ErrorHandler,
    CommandError,
    ProtocolError,
    RuntimeError,
    captureCommandCall
}
export default ErrorHandler
