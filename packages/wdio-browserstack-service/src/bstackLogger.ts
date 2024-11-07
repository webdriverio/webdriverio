import path from 'node:path'
import fs from 'node:fs'

import logger from '@wdio/logger'

import { LOGS_FILE } from './constants'

const log = logger('@wdio/browserstack-service')

export class BStackLogger {
    public static logFilePath = path.join(process.cwd(), LOGS_FILE)
    public static logFolderPath = path.join(process.cwd(), 'logs')
    private static logFileStream: fs.WriteStream | null

    public static info(message: string) {
        log.info(message)
    }

    public static error(message: string) {
        log.error(message)
    }

    public static debug(message: string, param?: any) {
        if (param) {
            log.debug(message, param)
        } else {
            log.debug(message)
        }
    }

    public static warn(message: string) {
        log.warn(message)
    }

    public static trace(message: string) {
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
