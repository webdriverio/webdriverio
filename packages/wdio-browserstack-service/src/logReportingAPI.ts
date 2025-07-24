import Transport from 'winston-transport'
import { consoleHolder } from './constants.js'

const LOG_LEVELS = {
    INFO: 'INFO',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
    TRACE: 'TRACE',
    WARN: 'WARN',
}

class logReportingAPI extends Transport {
    log(info: { level: string | null, message: string | null }, callback: undefined|Function = undefined) {
        setImmediate(() => {
            this.emit('logged', info)
        })

        if (typeof(info) === 'object') {
            /* From log appender */
            this.logToTestOps(info.level || LOG_LEVELS.INFO, info.message, false)
        } else {
            /* From default console */
            this.logToTestOps(LOG_LEVELS.INFO, info)
        }

        if (callback && typeof callback === 'function') {
            callback()
        }
    }

    logToTestOps = (level = LOG_LEVELS.INFO, message: string | null = '', consoleLog = true) => {
        if (consoleLog) {
            consoleHolder[level.toLowerCase() as 'info' | 'log'](message)
        }
        (process.emit as Function)(`bs:addLog:${process.pid}`, {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: message,
            kind: 'TEST_LOG',
            http_response: {}
        })
    }

    /* Patching this would show user an extended trace on their cli */
    trace = (message: string | null) => {
        this.logToTestOps(LOG_LEVELS.TRACE, message)
    }

    debug = (message: string | null) => {
        this.logToTestOps(LOG_LEVELS.DEBUG, message)
    }

    info = (message: string | null) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }

    warn = (message: string | null) => {
        this.logToTestOps(LOG_LEVELS.WARN, message)
    }

    error = (message: string | null) => {
        this.logToTestOps(LOG_LEVELS.ERROR, message)
    }
}

export default logReportingAPI
