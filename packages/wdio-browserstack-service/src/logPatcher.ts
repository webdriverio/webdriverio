import Transport from 'winston-transport'
import { consoleHolder } from './constants.js'

const LOG_LEVELS = {
    INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG', TRACE: 'TRACE', WARN: 'WARN',
}

class logPatcher extends Transport {
    constructor(opts: any) {
        super(opts)
    }

    logToTestOps = (level = LOG_LEVELS.INFO, message = ['']) => {
        (consoleHolder as any)[level.toLowerCase()](...message)
        // eslint-disable-next-line no-unexpected-multiline
        (process.emit as Function)(`bs:addLog:${process.pid}`, {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: `"${message.join(', ')}"`,
            kind: 'TEST_LOG',
            http_response: {}
        })
    }

    /* Patching this would show user an extended trace on their cli */
    trace = (...message: any) => {
        this.logToTestOps(LOG_LEVELS.TRACE, message)
    }

    debug = (...message:any) => {
        this.logToTestOps(LOG_LEVELS.DEBUG, message)
    }

    info = (...message: any) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }

    warn = (...message: any) => {
        this.logToTestOps(LOG_LEVELS.WARN, message)
    }

    error = (...message: any) => {
        this.logToTestOps(LOG_LEVELS.ERROR, message)
    }

    log = (...message:any) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }
}
export default logPatcher
