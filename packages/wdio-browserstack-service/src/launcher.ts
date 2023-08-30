import got from 'got'
import FormData from 'form-data'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import { SevereServiceError } from 'webdriverio'
import os from 'node:os'

import * as BrowserstackLocalLauncher from 'browserstack-local'

import logger from '@wdio/logger'
import type { Capabilities, Services, Options } from '@wdio/types'
import PerformanceTester from './performance-tester.js'

import type { BrowserstackConfig, App, AppConfig, AppUploadResponse } from './types.js'
import { BSTACK_SERVICE_VERSION, NOT_ALLOWED_KEYS_IN_CAPS, VALID_APP_EXTENSION } from './constants.js'
import {
    launchTestSession,
    createAccessibilityTestRun,
    shouldAddServiceVersion,
    stopBuildUpstream,
    getCiInfo,
    isBStackSession,
    isUndefined,
    isAccessibilityAutomationSession,
    stopAccessibilityTestRun
} from './util.js'
import CrashReporter from './crash-reporter.js'

const log = logger('@wdio/browserstack-service')

type BrowserstackLocal = BrowserstackLocalLauncher.Local & {
    pid?: number;
    stop(callback: (err?: any) => void): void;
}

export default class BrowserstackLauncherService implements Services.ServiceInstance {
    browserstackLocal?: BrowserstackLocal
    private _buildName?: string
    private _projectName?: string
    private _buildTag?: string
    private _buildIdentifier?: string
    private _accessibilityAutomation?: string | boolean

    constructor (
        private _options: BrowserstackConfig & Options.Testrunner,
        capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = _options)
        if (Array.isArray(capabilities)) {
            capabilities
                .flatMap((c: Capabilities.DesiredCapabilities | Capabilities.MultiRemoteCapabilities) => {
                    if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                        return Object.values(c).map((o: Options.WebdriverIO) => o.capabilities)
                    }
                    return c as (Capabilities.DesiredCapabilities)
                })
                .forEach((capability: Capabilities.DesiredCapabilities) => {
                    if (!capability['bstack:options']) {
                        // Skipping adding of service version if session is not of browserstack
                        if (isBStackSession(this._config)) {
                            const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                            if (extensionCaps.length) {
                                capability['bstack:options'] = { wdioService: BSTACK_SERVICE_VERSION }
                                if (!isUndefined(capability['browserstack.accessibility'])) {
                                    this._accessibilityAutomation ||= (capability['browserstack.accessibility'] + '') === 'true'
                                } else if (this._options.accessibility + '' === 'true') {
                                    capability['bstack:options'].accessibility = (this._options.accessibility + '' === 'true')
                                }
                            } else if (shouldAddServiceVersion(this._config, this._options.testObservability)) {
                                capability['browserstack.wdioService'] = BSTACK_SERVICE_VERSION
                            }
                        }

                        // Need this details for sending data to Observability
                        this._buildIdentifier = capability['browserstack.buildIdentifier']?.toString()
                        this._buildName = capability.build?.toString()
                    } else {
                        capability['bstack:options'].wdioService = BSTACK_SERVICE_VERSION
                        this._buildName = capability['bstack:options'].buildName
                        this._projectName = capability['bstack:options'].projectName
                        this._buildTag = capability['bstack:options'].buildTag
                        this._buildIdentifier = capability['bstack:options'].buildIdentifier

                        if (!isUndefined(capability['bstack:options'].accessibility)) {
                            this._accessibilityAutomation ||= (capability['bstack:options'].accessibility + '') === 'true'
                        } else if (this._options.accessibility + '' === 'true') {
                            capability['bstack:options'].accessibility = (this._options.accessibility + '' === 'true')
                        }
                    }
                })
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                if (!(caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                    if (isBStackSession(this._config)) {
                        const extensionCaps = Object.keys(caps.capabilities).filter((cap) => cap.includes(':'))
                        if (extensionCaps.length) {
                            (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { wdioService: BSTACK_SERVICE_VERSION }
                            if (!isUndefined((caps.capabilities as Capabilities.Capabilities)['browserstack.accessibility'])) {
                                this._accessibilityAutomation ||= ((caps.capabilities as Capabilities.Capabilities)['browserstack.accessibility'] + '') === 'true'
                            } else if (this._options.accessibility + '' === 'true') {
                                (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { wdioService: BSTACK_SERVICE_VERSION, accessibility: (this._options.accessibility + '' === 'true') }
                            }
                        } else if (shouldAddServiceVersion(this._config, this._options.testObservability)) {
                            (caps.capabilities as Capabilities.Capabilities)['browserstack.wdioService'] = BSTACK_SERVICE_VERSION
                        }
                    }
                    this._buildIdentifier = (caps.capabilities as Capabilities.Capabilities)['browserstack.buildIdentifier']
                } else {
                    const bstackOptions = (caps.capabilities as Capabilities.Capabilities)['bstack:options']
                    bstackOptions!.wdioService = BSTACK_SERVICE_VERSION
                    this._buildName = bstackOptions!.buildName
                    this._projectName = bstackOptions!.projectName
                    this._buildTag = bstackOptions!.buildTag
                    this._buildIdentifier = bstackOptions!.buildIdentifier
                    if (!isUndefined(bstackOptions!.accessibility)) {
                        this._accessibilityAutomation ||= (bstackOptions!.accessibility + '') === 'true'
                    } else if ((this._options.accessibility + '') === 'true') {
                        bstackOptions!.accessibility = (this._options.accessibility + '') === 'true'
                    }
                }
            })
        }

        if (process.env.BROWSERSTACK_O11Y_PERF_MEASUREMENT) {
            PerformanceTester.startMonitoring('performance-report-launcher.csv')
        }

        this._accessibilityAutomation ||= (this._options.accessibility + '') === 'true'
        this._options.accessibility = this._accessibilityAutomation

        // by default observability will be true unless specified as false
        this._options.testObservability = this._options.testObservability === false ? false : true

        if (this._options.testObservability
            &&
            // update files to run if it's a rerun
            process.env.BROWSERSTACK_RERUN && process.env.BROWSERSTACK_RERUN_TESTS
        ) {
            this._config.specs = process.env.BROWSERSTACK_RERUN_TESTS.split(',')
        }

        try {
            CrashReporter.setConfigDetails(this._config, capabilities, this._options)
        } catch (error: any) {
            log.error(`[Crash_Report_Upload] Config processing failed due to ${error}`)
        }
    }

    async onPrepare (config?: Options.Testrunner, capabilities?: Capabilities.RemoteCapabilities) {
        /**
         * Upload app to BrowserStack if valid file path to app is given.
         * Update app value of capability directly if app_url, custom_id, shareable_id is given
         */
        if (!this._options.app) {
            log.info('app is not defined in browserstack-service config, skipping ...')
        } else {
            let app: App = {}
            const appConfig: AppConfig | string = this._options.app

            try {
                app = await this._validateApp(appConfig)
            } catch (error: any){
                throw new SevereServiceError(error)
            }

            if (VALID_APP_EXTENSION.includes(path.extname(app.app!))){
                if (fs.existsSync(app.app!)) {
                    const data: AppUploadResponse = await this._uploadApp(app)
                    log.info(`app upload completed: ${JSON.stringify(data)}`)
                    app.app = data.app_url
                } else if (app.customId){
                    app.app = app.customId
                } else {
                    throw new SevereServiceError(`[Invalid app path] app path ${app.app} is not correct, Provide correct path to app under test`)
                }
            }

            log.info(`Using app: ${app.app}`)
            this._updateCaps(capabilities, 'app', app.app)
        }

        /**
         * buildIdentifier in service options will take precedence over specified in capabilities
        */
        if (this._options.buildIdentifier) {
            this._buildIdentifier = this._options.buildIdentifier
            this._updateCaps(capabilities, 'buildIdentifier', this._buildIdentifier)
        }

        /**
         * evaluate buildIdentifier in case unique execution identifiers are present
         * e.g., ${BUILD_NUMBER} and ${DATE_TIME}
        */
        this._handleBuildIdentifier(capabilities)

        // remove accessibilityOptions from the capabilities if present
        this._updateObjectTypeCaps(capabilities, 'accessibilityOptions')

        if (this._accessibilityAutomation) {
            const scannerVersion = await createAccessibilityTestRun(this._options, this._config, {
                projectName: this._projectName,
                buildName: this._buildName,
                buildTag: this._buildTag,
                bstackServiceVersion: BSTACK_SERVICE_VERSION,
                buildIdentifier: this._buildIdentifier,
                accessibilityOptions: this._options.accessibilityOptions
            })

            if (scannerVersion) {
                process.env.BSTACK_A11Y_SCANNER_VERSION = scannerVersion
            }
            log.debug(`Accessibility scannerVersion ${scannerVersion}`)
        }

        if (this._options.accessibilityOptions) {
            const filteredOpts = Object.keys(this._options.accessibilityOptions)
                .filter(key => !NOT_ALLOWED_KEYS_IN_CAPS.includes(key))
                .reduce((opts, key) => {
                    return {
                        ...opts,
                        [key]: this._options.accessibilityOptions?.[key]
                    }
                }, {})

            if (Object.keys(filteredOpts).length > 0) {
                this._updateObjectTypeCaps(capabilities, 'accessibilityOptions', filteredOpts)
            }
        } else if (isAccessibilityAutomationSession(this._accessibilityAutomation)) {
            this._updateObjectTypeCaps(capabilities, 'accessibilityOptions', {})
        }

        if (this._options.testObservability) {
            log.debug('Sending launch start event')

            await launchTestSession(this._options, this._config, {
                projectName: this._projectName,
                buildName: this._buildName,
                buildTag: this._buildTag,
                bstackServiceVersion: BSTACK_SERVICE_VERSION,
                buildIdentifier: this._buildIdentifier
            })
        }

        if (!this._options.browserstackLocal) {
            return log.info('browserstackLocal is not enabled - skipping...')
        }

        const opts = {
            key: this._config.key,
            ...this._options.opts
        }

        this.browserstackLocal = new BrowserstackLocalLauncher.Local()

        this._updateCaps(capabilities, 'local')
        if (opts.localIdentifier) {
            this._updateCaps(capabilities, 'localIdentifier', opts.localIdentifier)
        }

        /**
         * measure BrowserStack tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`Browserstack Local successfully started after ${entry.duration}ms`)
        })

        obs.observe({ entryTypes: ['measure'] })

        let timer: NodeJS.Timeout
        performance.mark('tbTunnelStart')
        return Promise.race([
            promisify(this.browserstackLocal.start.bind(this.browserstackLocal))(opts),
            new Promise((resolve, reject) => {
                /* istanbul ignore next */
                timer = setTimeout(function () {
                    reject('Browserstack Local failed to start within 60 seconds!')
                }, 60000)
            })]
        ).then(function (result) {
            clearTimeout(timer)
            performance.mark('tbTunnelEnd')
            performance.measure('bootTime', 'tbTunnelStart', 'tbTunnelEnd')
            return Promise.resolve(result)
        }, function (err) {
            clearTimeout(timer)
            return Promise.reject(err)
        })
    }

    async onComplete () {
        if (isAccessibilityAutomationSession(this._accessibilityAutomation)) {
            await stopAccessibilityTestRun().catch((error: any) => {
                log.error(`Exception in stop accessibility test run: ${error}`)
            })
        }

        if (this._options.testObservability) {
            log.debug('Sending stop launch event')
            await stopBuildUpstream()
            if (process.env.BS_TESTOPS_BUILD_HASHED_ID) {
                console.log(`\nVisit https://observability.browserstack.com/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID} to view build report, insights, and many more debugging information all at one place!\n`)
            }

            if (process.env.BROWSERSTACK_O11Y_PERF_MEASUREMENT) {
                await PerformanceTester.stopAndGenerate('performance-launcher.html')
                PerformanceTester.calculateTimes(['launchTestSession', 'stopBuildUpstream'])

                if (!process.env.START_TIME) {
                    return
                }
                const duration = (new Date()).getTime() - (new Date(process.env.START_TIME)).getTime()
                log.info(`Total duration is ${duration / 1000 } s`)
            }
        }

        if (!this.browserstackLocal || !this.browserstackLocal.isRunning()) {
            return
        }

        if (this._options.forcedStop) {
            return process.kill(this.browserstackLocal.pid as number)
        }

        let timer: NodeJS.Timeout
        return Promise.race([
            new Promise<void>((resolve, reject) => {
                this.browserstackLocal?.stop((err: Error) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve()
                })
            }),
            new Promise((resolve, reject) => {
                /* istanbul ignore next */
                timer = setTimeout(
                    () => reject(new Error('Browserstack Local failed to stop within 60 seconds!')),
                    60000
                )
            })]
        ).then(function (result) {
            clearTimeout(timer)
            return Promise.resolve(result)
        }, function (err) {
            clearTimeout(timer)
            return Promise.reject(err)
        })
    }

    async _uploadApp(app:App): Promise<AppUploadResponse> {
        log.info(`uploading app ${app.app} ${app.customId? `and custom_id: ${app.customId}` : ''} to browserstack`)

        const form = new FormData()
        if (app.app) {
            form.append('file', fs.createReadStream(app.app))
        }
        if (app.customId) {
            form.append('custom_id', app.customId)
        }

        const res = await got.post('https://api-cloud.browserstack.com/app-automate/upload', {
            body: form,
            username : this._config.user,
            password : this._config.key
        }).json().catch((err) => {
            throw new SevereServiceError(`app upload failed ${(err as Error).message}`)
        })

        return res as AppUploadResponse
    }

    /**
     * @param  {String | AppConfig}  appConfig    <string>: should be "app file path" or "app_url" or "custom_id" or "shareable_id".
     *                                            <object>: only "path" and "custom_id" should coexist as multiple properties.
     */
    async _validateApp (appConfig: AppConfig | string): Promise<App> {
        const app: App = {}

        if (typeof appConfig === 'string'){
            app.app = appConfig
        } else if (typeof appConfig === 'object' && Object.keys(appConfig).length) {
            if (Object.keys(appConfig).length > 2 || (Object.keys(appConfig).length === 2 && (!appConfig.path || !appConfig.custom_id))) {
                throw new SevereServiceError(`keys ${Object.keys(appConfig)} can't co-exist as app values, use any one property from
                            {id<string>, path<string>, custom_id<string>, shareable_id<string>}, only "path" and "custom_id" can co-exist.`)
            }

            app.app = appConfig.id || appConfig.path || appConfig.custom_id || appConfig.shareable_id
            app.customId = appConfig.custom_id
        } else {
            throw new SevereServiceError('[Invalid format] app should be string or an object')
        }

        if (!app.app) {
            throw new SevereServiceError(`[Invalid app property] supported properties are {id<string>, path<string>, custom_id<string>, shareable_id<string>}.
                        For more details please visit https://www.browserstack.com/docs/app-automate/appium/set-up-tests/specify-app ')`)
        }

        return app
    }

    _updateObjectTypeCaps(capabilities?: Capabilities.RemoteCapabilities, capType?: string, value?: { [key: string]: any; }) {
        try {
            if (Array.isArray(capabilities)) {
                capabilities
                    .flatMap((c: Capabilities.DesiredCapabilities | Capabilities.MultiRemoteCapabilities) => {
                        if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                            return Object.values(c).map((o: Options.WebdriverIO) => o.capabilities)
                        }
                        return c as (Capabilities.DesiredCapabilities)
                    })
                    .forEach((capability: Capabilities.DesiredCapabilities) => {
                        if (!capability['bstack:options']) {
                            const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                            if (extensionCaps.length) {
                                if (capType === 'accessibilityOptions' && value) {
                                    capability['bstack:options'] = { accessibilityOptions: value }
                                }
                            } else if (capType === 'accessibilityOptions') {
                                if (value) {
                                    const accessibilityOpts = { ...value }
                                    if (capability?.accessibility) {
                                        accessibilityOpts.authToken = process.env.BSTACK_A11Y_JWT
                                        accessibilityOpts.scannerVersion = process.env.BSTACK_A11Y_SCANNER_VERSION
                                    }
                                    capability['browserstack.accessibilityOptions'] = accessibilityOpts
                                } else {
                                    delete capability['browserstack.accessibilityOptions']
                                }
                            }
                        } else if (capType === 'accessibilityOptions') {
                            if (value) {
                                const accessibilityOpts = { ...value }
                                if (capability['bstack:options'].accessibility) {
                                    accessibilityOpts.authToken = process.env.BSTACK_A11Y_JWT
                                    accessibilityOpts.scannerVersion = process.env.BSTACK_A11Y_SCANNER_VERSION
                                }
                                capability['bstack:options'].accessibilityOptions = accessibilityOpts
                            } else {
                                delete capability['bstack:options'].accessibilityOptions
                            }
                        }
                    })
            } else if (typeof capabilities === 'object') {
                Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                    if (!(caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                        const extensionCaps = Object.keys(caps.capabilities).filter((cap) => cap.includes(':'))
                        if (extensionCaps.length) {
                            if (capType === 'accessibilityOptions' && value) {
                                (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { accessibilityOptions: value }
                            }
                        } else if (capType === 'accessibilityOptions') {
                            if (value) {
                                const accessibilityOpts = { ...value }
                                if ((caps.capabilities as Capabilities.Capabilities)['browserstack.accessibility']) {
                                    accessibilityOpts.authToken = process.env.BSTACK_A11Y_JWT
                                    accessibilityOpts.scannerVersion = process.env.BSTACK_A11Y_SCANNER_VERSION
                                }
                                (caps.capabilities as Capabilities.Capabilities)['browserstack.accessibilityOptions'] = accessibilityOpts
                            } else {
                                delete (caps.capabilities as Capabilities.Capabilities)['browserstack.accessibilityOptions']
                            }
                        }
                    } else if (capType === 'accessibilityOptions') {
                        if (value) {
                            const accessibilityOpts = { ...value }
                            if ((caps.capabilities as Capabilities.Capabilities)['bstack:options']!.accessibility) {
                                accessibilityOpts.authToken = process.env.BSTACK_A11Y_JWT
                                accessibilityOpts.scannerVersion = process.env.BSTACK_A11Y_SCANNER_VERSION
                            }
                            (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.accessibilityOptions = accessibilityOpts
                        } else {
                            delete (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.accessibilityOptions
                        }
                    }
                })
            }
        } catch (error) {
            log.debug(`Exception while retrieving capability value. Error - ${error}`)
        }
    }

    _updateCaps(capabilities?: Capabilities.RemoteCapabilities, capType?: string, value?: string) {
        if (Array.isArray(capabilities)) {
            capabilities
                .flatMap((c: Capabilities.DesiredCapabilities | Capabilities.MultiRemoteCapabilities) => {
                    if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                        return Object.values(c).map((o: Options.WebdriverIO) => o.capabilities)
                    }
                    return c as (Capabilities.DesiredCapabilities)
                })
                .forEach((capability: Capabilities.DesiredCapabilities) => {
                    if (!capability['bstack:options']) {
                        const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                        if (extensionCaps.length) {
                            if (capType === 'local') {
                                capability['bstack:options'] = { local: true }
                            } else if (capType === 'app') {
                                capability['appium:app'] = value
                            } else if (capType === 'buildIdentifier' && value) {
                                capability['bstack:options'] = { buildIdentifier: value }
                            }
                        } else if (capType === 'local'){
                            capability['browserstack.local'] = true
                        } else if (capType === 'app') {
                        // @ts-expect-error BrowserStack still supports outdated JSOMWP
                            capability.app = value
                        } else if (capType === 'buildIdentifier') {
                            if (value) {
                                capability['browserstack.buildIdentifier'] = value
                            } else {
                                delete capability['browserstack.buildIdentifier']
                            }
                        } else if (capType === 'localIdentifier') {
                            capability['browserstack.localIdentifier'] = value
                        }
                    } else if (capType === 'local') {
                        capability['bstack:options'].local = true
                    } else if (capType === 'app') {
                        capability['appium:app'] = value
                    } else if (capType === 'buildIdentifier') {
                        if (value) {
                            capability['bstack:options'].buildIdentifier = value
                        } else {
                            delete capability['bstack:options'].buildIdentifier
                        }
                    } else if (capType === 'localIdentifier') {
                        capability['bstack:options'].localIdentifier = value
                    }
                })
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                if (!(caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                    const extensionCaps = Object.keys(caps.capabilities).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        if (capType === 'local') {
                            (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { local: true }
                        } else if (capType === 'app') {
                            (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                        } else if (capType === 'buildIdentifier' && value) {
                            (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { buildIdentifier: value }
                        }
                    } else if (capType === 'local'){
                        (caps.capabilities as Capabilities.Capabilities)['browserstack.local'] = true
                    } else if (capType === 'app') {
                        (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                    } else if (capType === 'buildIdentifier') {
                        if (value) {
                            (caps.capabilities as Capabilities.Capabilities)['browserstack.buildIdentifier'] = value
                        } else {
                            delete (caps.capabilities as Capabilities.Capabilities)['browserstack.buildIdentifier']
                        }
                    } else if (capType === 'localIdentifier') {
                        (caps.capabilities as Capabilities.Capabilities)['browserstack.localIdentifier'] = value
                    }
                } else if (capType === 'local'){
                    (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.local = true
                } else if (capType === 'app') {
                    (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                } else if (capType === 'buildIdentifier') {
                    if (value) {
                        (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.buildIdentifier = value
                    } else {
                        delete (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.buildIdentifier
                    }
                } else if (capType === 'localIdentifier') {
                    (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.localIdentifier = value
                }
            })
        } else {
            throw new SevereServiceError('Capabilities should be an object or Array!')
        }
    }

    _handleBuildIdentifier(capabilities?: Capabilities.RemoteCapabilities) {
        if (!this._buildIdentifier) {
            return
        }

        if ((!this._buildName || process.env.BROWSERSTACK_BUILD_NAME) && this._buildIdentifier) {
            this._updateCaps(capabilities, 'buildIdentifier')
            log.warn('Skipping buildIdentifier as buildName is not passed.')
            return
        }

        if (this._buildIdentifier && this._buildIdentifier.includes('${DATE_TIME}')){
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false })
                .format(new Date())
                .replace(/ |, /g, '-')
            this._buildIdentifier = this._buildIdentifier.replace('${DATE_TIME}', formattedDate)
            this._updateCaps(capabilities, 'buildIdentifier', this._buildIdentifier)
        }

        if (!this._buildIdentifier.includes('${BUILD_NUMBER}')) {
            return
        }

        const ciInfo = getCiInfo()
        if (ciInfo !== null && ciInfo.build_number) {
            this._buildIdentifier = this._buildIdentifier.replace('${BUILD_NUMBER}', 'CI '+ ciInfo.build_number)
            this._updateCaps(capabilities, 'buildIdentifier', this._buildIdentifier)
        } else {
            const localBuildNumber = this._getLocalBuildNumber()
            if (localBuildNumber) {
                this._buildIdentifier = this._buildIdentifier.replace('${BUILD_NUMBER}', localBuildNumber)
                this._updateCaps(capabilities, 'buildIdentifier', this._buildIdentifier)
            }
        }
    }

    /**
     * @return {string} if buildName doesn't exist in json file, it will return 1
     *                  else returns corresponding value in json file (e.g. { "wdio-build": { "identifier" : 2 } } => 2 in this case)
     */
    _getLocalBuildNumber() {
        const browserstackFolderPath = path.join(os.homedir(), '.browserstack')
        try {
            if (!fs.existsSync(browserstackFolderPath)){
                fs.mkdirSync(browserstackFolderPath)
            }

            const filePath = path.join(browserstackFolderPath, '.build-name-cache.json')
            if (!fs.existsSync(filePath)) {
                fs.appendFileSync(filePath, JSON.stringify({}))
            }

            const buildCacheFileData = fs.readFileSync(filePath)
            const parsedBuildCacheFileData = JSON.parse(buildCacheFileData.toString())

            if (this._buildName && this._buildName in parsedBuildCacheFileData) {
                const prevIdentifier = parseInt((parsedBuildCacheFileData[this._buildName].identifier))
                const newIdentifier = prevIdentifier + 1
                this._updateLocalBuildCache(filePath, this._buildName, newIdentifier)
                return newIdentifier.toString()
            }
            const newIdentifier = 1
            this._updateLocalBuildCache(filePath, this._buildName, 1)
            return newIdentifier.toString()
        } catch (error: any) {
            return null
        }
    }

    _updateLocalBuildCache(filePath?:string, buildName?:string, buildIdentifier?:number) {
        if (!buildName || !filePath) {
            return
        }
        const jsonContent = JSON.parse(fs.readFileSync(filePath).toString())
        jsonContent[buildName] = { 'identifier': buildIdentifier }
        fs.writeFileSync(filePath, JSON.stringify(jsonContent))
    }
}
