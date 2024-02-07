import path from 'node:path'
import fs from 'node:fs'

import logger from '@wdio/logger'

import { PERCY_LOGS_FILE } from '../constants'

const log = logger('@wdio/browserstack-service')

export class PercyLogger {
    public static logFilePath = path.join(process.cwd(), PERCY_LOGS_FILE)
    private static logFolderPath = path.join(process.cwd(), 'logs')
    private static logFileStream: fs.WriteStream | null

    static logToFile(logMessage: string, logLevel: string) {
        try {
            if (!this.logFileStream) {
                if (!fs.existsSync(this.logFolderPath)){
                    fs.mkdirSync(this.logFolderPath)
                }
                this.logFileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' })
            }
            if (this.logFileStream && this.logFileStream.writable) {
                this.logFileStream.write(this.formatLog(logMessage, logLevel))
            }
        } catch (error) {
            log.debug(`Failed to log to file. Error ${error}`)
        }
    }

    private static formatLog(logMessage: string, level: string) {
        return `${new Date().toISOString()} ${level.toUpperCase()} @wdio/browserstack-service ${logMessage}\n`
    }

    public static info(message: string) {
        this.logToFile(message, 'info')
        log.info(message)
    }

    public static error(message: string) {
        this.logToFile(message, 'error')
        log.error(message)
    }

    public static debug(message: string, param?: any) {
        this.logToFile(message, 'debug')
        if (param) {
            log.debug(message, param)
        } else {
            log.debug(message)
        }
    }

    public static warn(message: string) {
        this.logToFile(message, 'warn')
        log.warn(message)
    }

    public static trace(message: string) {
        this.logToFile(message, 'trace')
        log.trace(message)
    }

    public static clearLogger() {
        if (this.logFileStream) {
            this.logFileStream.end()
        }
        this.logFileStream = null
    }

    public static clearLogFile() {
        try {
            if (fs.existsSync(this.logFilePath)) {
                fs.truncateSync(this.logFilePath)
            }
        } catch (err: unknown) {
            log.error(`Failed to clear percy.log file. Error ${err}`)
        }
    }
}
