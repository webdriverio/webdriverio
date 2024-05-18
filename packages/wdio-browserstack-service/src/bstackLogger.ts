import path from 'node:path'
import fs from 'node:fs'
import chalk from 'chalk'

import logger from '@wdio/logger'

import { LOGS_FILE } from './constants.js'
import { COLORS } from './util.js'

const log = logger('@wdio/browserstack-service')

export class BStackLogger {
    public static logFilePath = path.join(process.cwd(), LOGS_FILE)
    public static logFolderPath = path.join(process.cwd(), 'logs')
    private static logFileStream: fs.WriteStream | null

    static logToFile(logMessage: string, logLevel: string) {
        try {
            if (!this.logFileStream) {
                this.ensureLogsFolder()
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
        return `${chalk.gray(new Date().toISOString())} ${chalk[COLORS[level]](level.toUpperCase())} ${chalk.whiteBright('@wdio/browserstack-service')} ${logMessage}\n`
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
        if (fs.existsSync(this.logFilePath)) {
            fs.truncateSync(this.logFilePath)
        }
    }

    public static ensureLogsFolder() {
        if (!fs.existsSync(this.logFolderPath)){
            fs.mkdirSync(this.logFolderPath)
        }
    }
}
