import { promisify } from 'util'

import fs from 'fs-extra'
import SeleniumStandalone from 'selenium-standalone'

import getFilePath from './utils/getFilePath'

const DEFAULT_LOG_FILENAME = 'selenium-standalone.txt'

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

        if (!this.skipSeleniumInstall) {
            await promisify(SeleniumStandalone.install)(this.seleniumInstallArgs)
        }

        this.process = await promisify(SeleniumStandalone.start)(this.seleniumArgs)

        if (typeof this.seleniumLogs === 'string') {
            this._redirectLogStream()
        }
    }

    onComplete () {
        if(this.process) {
            this.process.kill()
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
}
