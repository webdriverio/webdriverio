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

type SeleniumStartArgs = Partial<import('selenium-standalone').StartOpts>
type SeleniumInstallArgs = Partial<import('selenium-standalone').InstallOpts>
type BrowserDrivers = {
    chrome?: string | boolean
    firefox?: string | boolean
    chromiumedge?: string | boolean
    ie?: string | boolean
    edge?: string | boolean
}

export default class SeleniumStandaloneLauncher {
    capabilities: WebDriver.DesiredCapabilities[] | WebdriverIO.MultiRemoteCapabilities
    logPath?: string
    args: SeleniumStartArgs
    installArgs: SeleniumInstallArgs
    skipSeleniumInstall: boolean
    watchMode: boolean = false
    process!: SeleniumStandalone.ChildProcess
    drivers?: {
        chrome?: string
        firefox?: string
        chromiumedge?: string
        ie?: string
        edge?: string
    }

    constructor(
        options: WebdriverIO.ServiceOption,
        capabilities: WebDriver.DesiredCapabilities[] | WebdriverIO.MultiRemoteCapabilities,
        config: WebdriverIO.Config
    ) {
        this.capabilities = capabilities
        this.logPath = options.logPath || config.outputDir
        this.skipSeleniumInstall = Boolean(options.skipSeleniumInstall)

        // simplified mode
        if (options.drivers) {
            this.args = Object.entries(options.drivers as BrowserDrivers).reduce((acc, [browserDriver, version]) => {
                if (typeof version === 'string') {
                    acc.drivers![browserDriver] = { version }
                } else if (version === true) {
                    acc.drivers![browserDriver] = {}
                }
                return acc
            }, { drivers: {} } as SeleniumStartArgs)
            this.installArgs = { ...this.args } as SeleniumInstallArgs
        } else {
            this.args = options.args || {}
            this.installArgs = options.installArgs || {}
        }
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
        const capabilities = Array.isArray(this.capabilities) ? this.capabilities : Object.values(this.capabilities)
        capabilities.forEach(
            (cap: WebDriver.DesiredCapabilities | WebdriverIO.MultiRemoteBrowserOptions) =>
                !isCloudCapability(cap) && Object.assign(cap, DEFAULT_CONNECTION, { ...cap })
        )

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
