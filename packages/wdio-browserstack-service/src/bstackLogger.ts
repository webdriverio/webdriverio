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

    private static redactCredentials(logMessage: string): string {
        return logMessage
            .replace(/(["']?(?:username|userName|accesskey|accessKey|user|key)["']?\s*[:=]\s*["']?)([^"'\s,}]+)/gi, '$1')
            .replace(/([?&](?:username|userName|access_key|accesskey|accessKey|user|key)=)([^&#\s]+)/gi, '$1')
    }

    static logToFile(logMessage: string, logLevel: string) {
        try {
            const redactedMessage = this.redactCredentials(logMessage)
            if (!this.logFileStream) {
                this.ensureLogsFolder()
                this.logFileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' })
            }
            if (this.logFileStream && this.logFileStream.writable) {
                this.logFileStream.write(this.formatLog(redactedMessage, logLevel))
            }
        } catch (error) {
            log.debug(`Failed to log to file. Error ${error}`)
        }
    }

    private static formatLog(logMessage: string, level: string) {
        return `${chalk.gray(new Date().toISOString())} ${chalk[COLORS[level]](level.toUpperCase())} ${chalk.whiteBright('@wdio/browserstack-service')} ${logMessage}\n`
    }

    public static info(message: string) {
        const redactedMessage = this.redactCredentials(message)
        this.logToFile(redactedMessage, 'info')
        log.info(redactedMessage)
    }

    public static error(message: string) {
        const redactedMessage = this.redactCredentials(message)
        this.logToFile(redactedMessage, 'error')
        log.error(redactedMessage)
    }

    public static debug(message: string, param?: unknown) {
        const redactedMessage = this.redactCredentials(message)
        this.logToFile(redactedMessage, 'debug')
        if (param) {
            log.debug(redactedMessage, param)
        } else {
            log.debug(redactedMessage)
        }
    }

    public static warn(message: string) {
        const redactedMessage = this.redactCredentials(message)
        this.logToFile(redactedMessage, 'warn')
        log.warn(redactedMessage)
    }

    public static trace(message: string) {
        const redactedMessage = this.redactCredentials(message)
        this.logToFile(redactedMessage, 'trace')
        log.trace(redactedMessage)
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
