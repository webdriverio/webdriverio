import Transport from 'winston-transport'

const LOG_LEVELS = {
    INFO: 'INFO', ERROR: 'ERROR', DEBUG: 'DEBUG', TRACE: 'TRACE', WARN: 'WARN',
}

class logPatcher extends Transport {
    logToTestOps = (level = LOG_LEVELS.INFO, message = [''] as unknown[]) => {
        (process.emit as Function)(`bs:addLog:${process.pid}`, {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: `"${message.join(', ')}"`,
            kind: 'TEST_LOG',
            http_response: {}
        })
    }

    /* Patching this would show user an extended trace on their cli */
    trace = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.TRACE, message)
    }

    debug = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.DEBUG, message)
    }

    info = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }

    warn = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.WARN, message)
    }

    error = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.ERROR, message)
    }

    log = (...message: unknown[]) => {
        this.logToTestOps(LOG_LEVELS.INFO, message)
    }
}
export default logPatcher
