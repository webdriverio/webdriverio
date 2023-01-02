import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import { isCloudCapability } from '@wdio/config'
import type { Capabilities, Options, Services } from '@wdio/types'

import SeleniumStandalone from 'selenium-standalone'
import type { StartOpts, InstallOpts } from 'selenium-standalone'

import { getFilePath, hasCapsWithSupportedBrowser } from './utils.js'
import type { SeleniumStandaloneOptions } from './types.js'

const DEFAULT_LOG_FILENAME = 'wdio-selenium-standalone.log'
const log = logger('@wdio/selenium-standalone-service')

const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub'
}

type SeleniumStartArgs = Partial<StartOpts>
type SeleniumInstallArgs = Partial<InstallOpts>
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
        private _config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        this.skipSeleniumInstall = Boolean(this._options.skipSeleniumInstall)

        this.args = this._options.args || {}
        // simplified mode
        if (this.isSimplifiedMode(this._options)) {
            this.args.drivers = {}
            Object.entries(this._options.drivers as BrowserDrivers).forEach(([browserDriver, version]) => {
                if (typeof version === 'string') {
                    this.args.drivers![browserDriver] = { version }
                } else if (version === true) {
                    this.args.drivers![browserDriver] = {}
                }
            })
            this.installArgs = { ...this.args } as SeleniumInstallArgs
        } else {
            this.installArgs = this._options.installArgs || {}
        }
    }

    async onPrepare(config: Options.Testrunner): Promise<void> {
        this.watchMode = Boolean(config.watch)

        if (!this.skipSeleniumInstall) {
            await SeleniumStandalone.install(this.installArgs).catch(this.handleSeleniumError)
        }

        /**
         * update capability connection options to connect
         * to standalone server
         */
        const isMultiremote = !Array.isArray(this._capabilities)
        const capabilities = isMultiremote
            ? Object.values(this._capabilities) as Options.WebdriverIO[]
            : this._capabilities as (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities)[]
        for (const capability of capabilities) {
            const cap = (capability as Options.WebdriverIO).capabilities || capability

            /**
             * handle standard mode vs multiremote mode, e.g.
             * ```js
             * capabilities: [{
             *   browserName: 'chrome',
             *   hostname: 'localhost'
             * }]
             * ```
             * vs.
             * ```js
             * capabilities: {
             *   myBrowser: {
             *     hostname: 'localhost',
             *     capabilities: { browserName: 'chrome' }
             *   }
             * }
             */
            const remoteCapabilities = (cap as Capabilities.W3CCapabilities).alwaysMatch || cap
            const objectToApplyConnectionDetails = !isMultiremote
                ? remoteCapabilities
                : capability

            if (!isCloudCapability(remoteCapabilities) && hasCapsWithSupportedBrowser(remoteCapabilities)) {
                Object.assign(
                    objectToApplyConnectionDetails,
                    DEFAULT_CONNECTION,
                    { ...objectToApplyConnectionDetails }
                )
            }
        }

        /**
         * start Selenium Standalone server
         */
        const start = SeleniumStandalone.start(this.args)
        start.catch(this.handleSeleniumError)
        this.process = await start

        if (typeof this._config.outputDir === 'string') {
            await this._redirectLogStream()
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

    async _redirectLogStream() {
        const logFile = getFilePath(this._config.outputDir!, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        await fsp.mkdir(path.dirname(logFile), { recursive: true })

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

    private handleSeleniumError(error: Error) {
        log.error(error)
        process.exit(1)
    }
}
