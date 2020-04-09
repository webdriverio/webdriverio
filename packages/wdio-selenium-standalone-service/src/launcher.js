import logger from '@wdio/logger'

import { promisify } from 'util'
import fs from 'fs-extra'
import SeleniumStandalone from 'selenium-standalone'

import { getFilePath } from './utils'

const DEFAULT_LOG_FILENAME = 'wdio-selenium-standalone.log'
const log = logger('@wdio/selenium-standalone-service')

const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub'
}

export default class SeleniumStandaloneLauncher {
    constructor (options, capabilities, config) {
        this.capabilities = capabilities
        this.logPath = options.logPath || config.outputDir
        this.args = options.args || {}
        this.installArgs = options.installArgs || {}
        this.skipSeleniumInstall = Boolean(options.skipSeleniumInstall)
    }

    async onPrepare (config) {
        this.watchMode = Boolean(config.watch)

        if (!this.skipSeleniumInstall) {
            await promisify(SeleniumStandalone.install)(this.installArgs)
        }

        /**
         * update capability connection options to connect
         * to standalone server
         */
        (
            Array.isArray(this.capabilities)
                ? this.capabilities
                : Object.values(this.capabilities)
        ).forEach((cap) => Object.assign(cap, DEFAULT_CONNECTION, { ...cap }))

        /**
         * start Selenium Standalone server
         */
        this.process = await promisify(SeleniumStandalone.start)(this.args)

        if (typeof this.logPath === 'string') {
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
        const logFile = getFilePath(this.logPath, DEFAULT_LOG_FILENAME)

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
