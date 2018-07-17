import Selenium from 'selenium-standalone'
import fs from 'fs-extra'
import getFilePath from './utils/getFilePath'

const DEFAULT_LOG_FILENAME = 'selenium-standalone.txt'

export default class SeleniumStandaloneLauncher {
    constructor () {
        this.seleniumLogs = null
        this.seleniumArgs = {}
        this.seleniumInstallArgs = {}
        this.logToStdout = false

        return this;
    }

    onPrepare (config) {
        this.seleniumArgs = config.seleniumArgs || {}
        this.seleniumInstallArgs = config.seleniumInstallArgs || {}
        this.seleniumLogs = config.seleniumLogs
        this.logToStdout = config.logToStdout

        return this._installSeleniumDependencies(this.seleniumInstallArgs).then(() => new Promise((resolve, reject) => Selenium.start(this.seleniumArgs, (err, process) => {
            if (err) {
                return reject(err)
            }

            this.process = process
            if (typeof this.seleniumLogs === 'string') {
                this._redirectLogStream()
            }

            resolve()
        })))
    }

    onComplete () {
        if(this.process) {
            this.process.kill()
        }
    }

    _installSeleniumDependencies (seleniumInstallArgs) {
        return new Promise((resolve, reject) => Selenium.install(seleniumInstallArgs, (err) => {
            if (err) {
                return reject(err)
            }

            resolve()
        }))
    }

    _redirectLogStream () {
        const logFile = getFilePath(this.seleniumLogs, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        fs.ensureFileSync(logFile)

        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this.process.stdout.pipe(logStream)
        this.process.stderr.pipe(logStream)
    }
}