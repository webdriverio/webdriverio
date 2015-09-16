import fs from 'fs'
import path from 'path'

import { colors, errorCodes } from '../helpers/contants'
import { caps as sanitizeCaps } from '../helpers/sanitize'

const BANNER = `
${colors.yellow}=======================================================================================${colors.reset}
Selenium 2.0 / webdriver protocol bindings implementation with helper commands in nodejs.
For a complete list of commands, visit ${colors.lime}http://webdriver.io/docs.html${colors.reset}.
${colors.yellow}=======================================================================================${colors.reset}
`

/**
 * Logger module
 *
 * A Logger helper with fancy colors
 */
class Logger {
    constructor (options, eventHandler) {
        /**
         * log level
         * silent : no logs
         * command : command only
         * result : result only
         * error : error only
         * verbose : command + data + result
         */
        this.logLevel = options.logLevel

        this.setupWriteStream(options)

        /**
         * disable colors if coloredLogs is set to false or if we pipe output into files
         */
        if (!JSON.parse(process.env.WEBDRIVERIO_COLORED_LOGS) || this.writeStream) {
            Object.keys(colors).forEach(colorName => colors[colorName] = '')
        }

        /**
         * print welcome message
         */
        if (this.logLevel !== 'silent' && !this.infoHasBeenShown) {
            this.write(BANNER)
            this.infoHasBeenShown = true
        }

        // register event handler to log command events
        eventHandler.on('command', (data) => {
            if (this.logLevel === 'command' || this.logLevel === 'verbose') {
                this.command(data.method, data.uri.path)
            }
            if (this.logLevel === 'data' || this.logLevel === 'verbose') {
                this.data(data.data)
            }
        })

        // register event handler to log result events
        eventHandler.on('result', (data) => {
            // only log result events if they got executed successfully
            if (data.body && data.body.status === 0 && (this.logLevel === 'result' || this.logLevel === 'verbose')) {
                this.result(typeof data.body.value ? data.body.value : data.body.orgStatusMessage)
            }
        })

        // register event handler to log error events
        eventHandler.on('error', (data) => {
            if (data.err && data.err.code === 'ECONNREFUSED') {
                this.error(`Couldn't find a running selenium server instance on ${data.requestOptions.uri}`)
            } else if (data.err && data.err.code === 'ENOTFOUND') {
                this.error(`Couldn't resolve hostname ${data.requestOptions.uri}`)
            } else if (data.err && data.err.code === 'NOSESSIONID') {
                this.error(`Couldn't get a session ID - ${data.err.message}`)
            } else if (this.logLevel === 'error' || this.logLevel === 'verbose') {
                if (data.body && errorCodes[data.body.status]) {
                    this.error(errorCodes[data.body.status].id + '\t' + errorCodes[data.body.status].message + '\n\t\t\t' + data.body.value.message)
                } else if (typeof data.message === 'string') {
                    this.error('ServerError\t' + data.message)
                } else {
                    this.error(errorCodes['-1'].id + '\t' + errorCodes['-1'].message)
                }
            }
        })
    }

    /**
     * create write stream if logOutput is a string
     */
    setupWriteStream (options) {
        if (typeof options.logOutput === 'string') {
            let newDate = new Date()
            let dateString = newDate.toISOString().split(/\./)[0]
            let filename = sanitizeCaps(options.desiredCapabilities) + '.' + dateString + '.' + process.pid + '.log'

            this.writeStream = fs.createWriteStream(path.join(process.cwd(), options.logOutput, filename))
            this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel
        } else if (typeof options.logOutput === 'object' && options.logOutput.writable) {
            this.writeStream = options.logOutput
            this.logLevel = this.logLevel === 'silent' ? 'verbose' : this.logLevel
        }
    }

    write (...messages) {
        let msgString = messages.join(' ')

        if (this.writeStream) {
            this.writeStream.write(msgString + '\n')
        } else {
            console.log(msgString)
        }
    }

    /**
     * main log function
     */
    log (message, content) {
        if (!this.logLevel || this.logLevel === 'silent') {
            return
        }

        let currentDate = new Date()
        let dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0]
        let preamble = `${colors.dkgray}[${dateString}]: ${colors.reset}`

        if (!content) {
            this.write(preamble, message)
        } else {
            this.write(preamble, message, '\t', JSON.stringify(content))
        }
    }

    /**
     * logs command messages
     * @param  {String} method  method of command request
     * @param  {String} path    path of command request
     */
    command (method, path) {
        if (method && path) {
            this.log(`${colors.violet}COMMAND\t${colors.reset}`, method, path)
        }
    }

    /**
     * debugger info message
     */
    debug () {
        this.write('\n')
        this.log(`${colors.yellow}DEBUG\t${colors.reset}queue has stopped, you can now go into the browser`)
        this.log(`${colors.yellow}DEBUG\t${colors.dkgray}continue by pressing the [ENTER] key ...${colors.reset}`)
    }

    /**
     * logs data messages
     * @param  {Object} data  data object
     */
    data (data) {
        data = JSON.stringify(data)

        if (data.length > 1000) {
            data = '[String Buffer]'
        }

        if (data && keySize(data) !== 0 && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
            this.log(`${colors.brown}DATA\t\t${colors.reset}${data}`)
        }
    }

    /**
     * logs result messages
     * @param  {Object} result  result object
     */
    result (result) {
        if (typeof result === 'object') {
            result = JSON.stringify(result)
        }

        // prevent screenshot data output
        if (result && result.length > 1000) {
            result = '[Buffer] screenshot data'
        }

        this.log(`${colors.teal}RESULT\t\t${colors.reset}${result}`)
    }

    /**
     * logs error messages
     * @param  {String} msg  error message
     */
    error (msg) {
        if (msg && typeof msg === 'string' && msg.indexOf('caused by Request') !== -1) {
            msg = msg.substr(0, msg.indexOf('caused by Request') - 2)
        }

        if (msg && typeof msg === 'string' && msg.indexOf('Command duration or timeout') !== -1) {
            msg = msg.substr(0, msg.indexOf('Command duration or timeout'))
        }

        if (msg && typeof msg === 'string' && msg.indexOf('ID does not correspond to an open view') !== -1) {
            msg = msg.substr(0, msg.indexOf('ID does not correspond to an open view'))
            msg += 'NOTE: you probably try to continue your tests after closing a tab/window. Please set the focus on a current opened tab/window to continue. Use the window protocol command to do so.'
        }

        if (msg) {
            this.log(colors.red + 'ERROR\t' + colors.reset + msg, null)
        }
    }

    /**
     * print exception if command fails
     * @param {String}   type        error type
     * @param {String}   message     error message
     * @param {String[]} stacktrace  error stacktrace
     */
    static printException (type, message, stacktrace) {
        stacktrace = stacktrace.map(trace => '    at ' + trace)
        this.write(colors.dkred + (type || 'Error') + ': ' + message + colors.reset, null)
        this.write(colors.dkgray + stacktrace.reverse().join('\n') + colors.reset, null)
    }
}

/**
 * helper method to check size of object
 * @param   {Object}   obj  object you like to check
 * @return  {Integer}       number of own properties
 */
let keySize = function (obj) {
    let size = 0

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) size++
    }

    return size
}

export default Logger
