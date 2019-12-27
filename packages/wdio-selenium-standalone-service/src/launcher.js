import logger from '@wdio/logger'

import { promisify } from 'util'
import fs from 'fs-extra'
import SeleniumStandalone from 'selenium-standalone'

import getFilePath from './utils/getFilePath'

const DEFAULT_LOG_FILENAME = 'selenium-standalone.txt'
const log = logger('@wdio/selenium-standalone-service')

export default class SeleniumStandaloneLauncher {
    constructor () {
        this.seleniumLogs = null
        this.seleniumArgs = {}
        this.seleniumInstallArgs = {}

        return this
    }

    async onPrepare (config) {
        this.seleniumArgs = config.seleniumArgs || {}
        this.seleniumInstallArgs = config.seleniumInstallArgs || {}
        this.seleniumLogs = config.seleniumLogs
        this.skipSeleniumInstall = !!config.skipSeleniumInstall
        this.watchMode = !!config.watch

        if (!this.skipSeleniumInstall) {
            await promisify(SeleniumStandalone.install)(this.seleniumInstallArgs)
        }

        this.process = await promisify(SeleniumStandalone.start)(this.seleniumArgs)

        if (typeof this.seleniumLogs === 'string') {
            this._redirectLogStream()
        }

        if (this.watchMode) {
            process.on('SIGINT', this._stopProcess)
            process.on('exit', this._stopProcess)
            process.on('uncaughtException', this._stopProcess)
        }
    }

    onComplete () {
        // selenium should not be killed in watch mode
        if (!this.watchMode) {
            this._stopProcess()
        }
    }

    _redirectLogStream () {
        const logFile = getFilePath(this.seleniumLogs, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        fs.ensureFileSync(logFile)

        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this.process.stdout.pipe(logStream)
        this.process.stderr.pipe(logStream)
    }

    _stopProcess = () => {
        if (this.process) {
            log.info('shutting down all browsers')
            this.process.kill()
        }
    }
}
