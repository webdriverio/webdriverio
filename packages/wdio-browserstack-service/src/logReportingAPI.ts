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
    log(info: any, callback: undefined|Function = undefined) {
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

    logToTestOps = (level = LOG_LEVELS.INFO, message = '', consoleLog = true) => {
        if (consoleLog) {
            (consoleHolder as any)[level.toLowerCase()](message)
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
    trace = (message: any) => {
        this.logToTestOps(LOG_LEVELS.TRACE, message)
    }

    debug = (message: any) => {
        this.logToTestOps(LOG_LEVELS.DEBUG, message)
    }

    info = (message: any) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }

    warn = (message: any) => {
        this.logToTestOps(LOG_LEVELS.WARN, message)
    }

    error = (message: any) => {
        this.logToTestOps(LOG_LEVELS.ERROR, message)
    }
}

export default logReportingAPI
