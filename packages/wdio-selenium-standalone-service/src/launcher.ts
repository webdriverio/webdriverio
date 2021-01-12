import logger from '@wdio/logger'
import { isCloudCapability } from '@wdio/config'
import type { Capabilities, Options, Services } from '@wdio/types'

import { promisify } from 'util'
import fs from 'fs-extra'
import SeleniumStandalone from 'selenium-standalone'

import { getFilePath } from './utils'
import type { SeleniumStandaloneOptions } from './types'

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
        private _options: SeleniumStandaloneOptions,
        private _capabilities: Capabilities.RemoteCapabilities,
        private _config: Options.Testrunner
    ) {
        this.skipSeleniumInstall = Boolean(this._options.skipSeleniumInstall)

        // simplified mode
        if (this.isSimplifiedMode(this._options)) {
            this.args = Object.entries(this._options.drivers as BrowserDrivers).reduce((acc, [browserDriver, version]) => {
                if (typeof version === 'string') {
                    acc.drivers![browserDriver] = { version }
                } else if (version === true) {
                    acc.drivers![browserDriver] = {}
                }
                return acc
            }, { drivers: {} } as SeleniumStartArgs)
            this.installArgs = { ...this.args } as SeleniumInstallArgs
        } else {
            this.args = this._options.args || {}
            this.installArgs = this._options.installArgs || {}
        }
    }

    async onPrepare(config: Options.Testrunner): Promise<void> {
        this.watchMode = Boolean(config.watch)

        if (!this.skipSeleniumInstall) {
            const install: (opts: SeleniumStandalone.InstallOpts) => Promise<unknown> = promisify(SeleniumStandalone.install)
            await install(this.installArgs)
        }

        /**
         * update capability connection options to connect
         * to standalone server
         */
        const capabilities = (Array.isArray(this._capabilities) ? this._capabilities : Object.values(this._capabilities))
        for (const capability of capabilities) {
            const cap = (capability as Options.WebDriver).capabilities || capability
            const c = (cap as Capabilities.W3CCapabilities).alwaysMatch || cap

            if (!isCloudCapability(c)) {
                Object.assign(c, DEFAULT_CONNECTION, { ...c })
            }
        }

        /**
         * start Selenium Standalone server
         */
        const start: (opts: SeleniumStandalone.StartOpts) => Promise<SeleniumStandalone.ChildProcess> = promisify(SeleniumStandalone.start)
        this.process = await start(this.args)

        if (typeof this._config.outputDir === 'string') {
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
        const logFile = getFilePath(this._config.outputDir!, DEFAULT_LOG_FILENAME)

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

    private isSimplifiedMode(options: Services.ServiceOption) {
        return options.drivers && Object.keys(options.drivers).length > 0
    }
}
