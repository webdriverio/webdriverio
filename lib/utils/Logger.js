import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import validator from 'validator'

import { COLORS, ERROR_CODES } from '../helpers/constants'
import sanitize from '../helpers/sanitize'

const BANNER = `
${COLORS.yellow}=======================================================================================${COLORS.reset}
Selenium 2.0 / webdriver protocol bindings implementation with helper commands in nodejs.
For a complete list of commands, visit ${COLORS.lime}http://webdriver.io/docs.html${COLORS.reset}.
${COLORS.yellow}=======================================================================================${COLORS.reset}
`

const STRINGLIMIT = 1000

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
            Object.keys(COLORS).forEach(colorName => COLORS[colorName] = '')
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
                if (data.body && ERROR_CODES[data.body.status]) {
                    this.error(ERROR_CODES[data.body.status].id + '\t' + ERROR_CODES[data.body.status].message + '\n\t\t\t' + data.body.value.message)
                } else if (typeof data.message === 'string') {
                    this.error('ServerError\t' + data.message)
                } else {
                    this.error(ERROR_CODES['-1'].id + '\t' + ERROR_CODES['-1'].message)
                }
            }
        })
    }

    /**
     * creates log file name and directories if not existing
     * @param  {Object} caps          capabilities (required to create filename)
     * @param  {String} logOutputPath specified log directory
     * @return {Buffer}               log file buffer stream
     */
    getLogfile (caps, logOutputPath) {
        logOutputPath = logOutputPath[0] === '/' ? logOutputPath : path.join(process.cwd(), logOutputPath)

        /**
         * create directory if not existing
         */
        try {
            fs.statSync(logOutputPath)
        } catch (e) {
            mkdirp.sync(logOutputPath)
        }

        let newDate = new Date()
        let dateString = newDate.toISOString().split(/\./)[0]
        let filename = sanitize.caps(caps) + '.' + dateString + '.' + process.pid + '.log'

        return fs.createWriteStream(path.join(logOutputPath, filename))
    }

    /**
     * create write stream if logOutput is a string
     */
    setupWriteStream (options) {
        if (typeof options.logOutput === 'string') {
            this.writeStream = this.getLogfile(options.desiredCapabilities, options.logOutput)
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
        let preamble = `${COLORS.dkgray}[${dateString}] ${COLORS.reset}`

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
            this.log(`${COLORS.violet}COMMAND\t${COLORS.reset}${method}`, path)
        }
    }

    /**
     * debugger info message
     */
    debug () {
        this.write('\n')
        this.log(`${COLORS.yellow}DEBUG\t${COLORS.reset}queue has stopped, you can now go into the browser`)
        this.log(`${COLORS.yellow}DEBUG\t${COLORS.dkgray}continue by pressing the [ENTER] key ...${COLORS.reset}`)
    }

    /**
     * logs data messages
     * @param  {Object} data  data object
     */
    data (data) {
        data = JSON.stringify(data)

        if (data.length > STRINGLIMIT) {
            data = '[String Buffer]'
        }

        if (data && keySize(data) !== 0 && (this.logLevel === 'data' || this.logLevel === 'verbose')) {
            this.log(`${COLORS.brown}DATA\t\t${COLORS.reset}${data}`)
        }
    }

    /**
     * logs result messages
     * @param  {Object} result  result object
     */
    result (result) {
        if (typeof result === 'string' && validator.isBase64(result)) {
            result = '[base64] ' + result.length + ' bytes'
        } else if (typeof result === 'object') {
            result = JSON.stringify(result)
            if (result.length > STRINGLIMIT) result = `${result.substr(0, STRINGLIMIT)}... (${result.length - STRINGLIMIT} more bytes)`
        }

        this.log(`${COLORS.teal}RESULT\t\t${COLORS.reset}${result}`)
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
            this.log(COLORS.red + 'ERROR\t' + COLORS.reset + msg, null)
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
        this.write(COLORS.dkred + (type || 'Error') + ': ' + message + COLORS.reset, null)
        this.write(COLORS.dkgray + stacktrace.reverse().join('\n') + COLORS.reset, null)
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
