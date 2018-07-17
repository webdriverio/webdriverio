import Selenium from 'selenium-standalone'
import fs from 'fs-extra'
import getFilePath from './utils/getFilePath'

const DEFAULT_LOG_FILENAME = 'selenium-standalone.txt'

export default class SeleniumStandaloneLauncher {
    constructor (config) {
        console.log(`from construct`)
        this.config = config
        this.seleniumLogs = null
        this.seleniumArgs = {}
        this.seleniumInstallArgs = {}
        this.logToStdout = false

        return this;
    }

    onPrepare () {
        //
        console.log(`before on sel standalone`);
        this.seleniumArgs = this.config.seleniumArgs || {}
        this.seleniumInstallArgs = this.config.seleniumInstallArgs || {}
        this.seleniumLogs = this.config.seleniumLogs
        this.logToStdout = this.config.logToStdout

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
        console.log(`after session...`)
        if(this.process) {
            console.log(`has existing process`)
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