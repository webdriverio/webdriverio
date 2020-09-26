import { logger } from '@wdio/logger'


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


export interface Config {
    outputDir: string,
    watch: boolean,
}

export interface SeleniumStandaloneOptions {

    logPath?: string;
    installArgs?: Partial<import('selenium-standalone').InstallOpts>;
    args?: Partial<import('selenium-standalone').StartOpts>;
    skipSeleniumInstall?: boolean;
}
export default class SeleniumStandaloneLauncher {

    private capabilities: any
    private logPath: string
    private args: Partial<import('selenium-standalone').StartOpts>;
    private installArgs: Partial<import('selenium-standalone').InstallOpts>;
    private skipSeleniumInstall: boolean
    private watchMode: boolean = false
    private process!: SeleniumStandalone.ChildProcess

    constructor(options: SeleniumStandaloneOptions, capabilities: any, config: Config) {
        this.capabilities = capabilities
        this.logPath = options.logPath || config.outputDir
        this.args = options.args || {}
        this.installArgs = options.installArgs || {}
        this.skipSeleniumInstall = Boolean(options.skipSeleniumInstall)
    }

    async onPrepare(config: Config) {
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
        this.process = await promisify(SeleniumStandalone.start, { this.args })

        if (typeof this.logPath === 'string') {
            this._redirectLogStream()
        }

        if (this.watchMode) {
            this.process.on('SIGINT', this._stopProcess)
            this.process.on('exit', this._stopProcess)
            this.process.on('uncaughtException', this._stopProcess)
        }
    }

    onComplete() {
        // selenium should not be killed in watch mode
        if (!this.watchMode) {
            this._stopProcess()
        }
    }

    _redirectLogStream() {
        const logFile = getFilePath(this.logPath, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        fs.ensureFileSync(logFile)

        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this.process.stdout?.pipe(logStream)
        this.process.stderr?.pipe(logStream)
    }

    _stopProcess = () => {
        if (this.process) {
            log.info('shutting down all browsers')
            this.process.kill()
        }
    }
}
