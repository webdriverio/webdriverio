import logger from '@wdio/logger'
import { isCloudCapability } from '@wdio/config'

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

    capabilities: WebDriver.Capabilities[] | Record<string, WebDriver.Capabilities>
    logPath?: string
    args: Partial<import('selenium-standalone').StartOpts>;
    installArgs: Partial<import('selenium-standalone').InstallOpts>;
    skipSeleniumInstall: boolean
    watchMode: boolean = false
    process!: SeleniumStandalone.ChildProcess

    constructor(options: WebdriverIO.ServiceOption, capabilities: WebDriver.Capabilities[] | Record<string, WebDriver.Capabilities>, config: WebdriverIO.Config) {

        this.capabilities = capabilities
        this.logPath = options.logPath || config.outputDir
        this.args = options.args || {}
        this.installArgs = options.installArgs || {}
        this.skipSeleniumInstall = Boolean(options.skipSeleniumInstall)
    }

    async onPrepare(config: WebdriverIO.Config): Promise<void> {
        this.watchMode = Boolean(config.watch)

        if (!this.skipSeleniumInstall) {
            const install: (opts: SeleniumStandalone.InstallOpts) => Promise<unknown> = promisify(SeleniumStandalone.install)
            await install(this.installArgs)
        }

        /**
         * update capability connection options to connect
         * to standalone server
         */
        (
            Array.isArray(this.capabilities)
                ? this.capabilities
                : Object.values(this.capabilities)
        ).forEach((cap) => !isCloudCapability((cap as Record<string, WebDriver.Capabilities>).capabilities) && Object.assign(cap, DEFAULT_CONNECTION, { ...cap }))

        /**
         * start Selenium Standalone server
         */
        const start: (opts: SeleniumStandalone.StartOpts) => Promise<SeleniumStandalone.ChildProcess> = promisify(SeleniumStandalone.start)
        this.process = await start(this.args)

        if (typeof this.logPath === 'string') {
            this._redirectLogStream()
        }

        if (this.watchMode) {
            process.on('SIGINT', this._stopProcess)
            process.on('exit', this._stopProcess)
            process.on('uncaughtException', this._stopProcess)
        }
    }

    onComplete(): void {
        // selenium should not be killed in watch mode
        if (!this.watchMode) {
            this._stopProcess()
        }
    }

    _redirectLogStream(): void {
        const logFile = getFilePath(this.logPath!, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        fs.ensureFileSync(logFile)

        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this.process.stdout?.pipe(logStream)
        this.process.stderr?.pipe(logStream)
    }

    _stopProcess = (): void => {
        if (this.process) {
            log.info('shutting down all browsers')
            this.process.kill()
        }
    }
}
