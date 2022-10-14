import got from 'got'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { performance, PerformanceObserver } from 'perf_hooks'
import { SevereServiceError } from 'webdriverio'

import * as BrowserstackLocalLauncher from 'browserstack-local'
import logger from '@wdio/logger'
import type { Capabilities, Services, Options } from '@wdio/types'
import { App, AppConfig, AppUploadResponse } from './types'

// @ts-ignore
import { version as bstackServiceVersion } from '../package.json'
import { BrowserstackConfig } from './types'
import { VALID_APP_EXTENSION } from './constants'
import { getLaunchInfo, launchTestSession, stopBuildUpstream } from './util'

const log = logger('@wdio/browserstack-service')

type BrowserstackLocal = BrowserstackLocalLauncher.Local & {
    pid?: number;
    stop(callback: (err?: any) => void): void;
}

export default class BrowserstackLauncherService implements Services.ServiceInstance {
    browserstackLocal?: BrowserstackLocal

    constructor (
        private _options: BrowserstackConfig & Options.Testrunner,
        capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = _options)
        if (Array.isArray(capabilities)) {
            capabilities.forEach((capability: Capabilities.DesiredCapabilities) => {
                if (!capability['bstack:options']) {
                    const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        capability['bstack:options'] = { wdioService: bstackServiceVersion }
                    } else {
                        capability['browserstack.wdioService'] = bstackServiceVersion
                    }
                } else {
                    capability['bstack:options'].wdioService = bstackServiceVersion
                }
            })
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                if (!(caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                    const extensionCaps = Object.keys(caps.capabilities).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { wdioService: bstackServiceVersion }
                    } else {
                        (caps.capabilities as Capabilities.Capabilities)['browserstack.wdioService'] = bstackServiceVersion
                    }
                } else {
                    (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.wdioService = bstackServiceVersion
                }
            })
        }

        // by default observability will be true unless specified as false
        this._options.observability = this._options.observability == false ? false : true

        if (this._options.observability) {
            // update files to run if it's a rerun
            if (process.env.BROWSERSTACK_TESTOPS_RERUN && process.env.BROWSERSTACK_TESTOPS_TESTS) {
                this._config.specs = process.env.BROWSERSTACK_TESTOPS_TESTS.split(',')
            }
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
            let appConfig: AppConfig | string = this._options.app

            try {
                app = await this._validateApp(appConfig)
            } catch (error: any){
                throw new SevereServiceError(error)
            }

            if (VALID_APP_EXTENSION.includes(path.extname(app.app!))){
                if (fs.existsSync(app.app!)) {
                    let data: AppUploadResponse
                    data = await this._uploadApp(app)
                    log.info(`app upload completed: ${JSON.stringify(data)}`)
                    app.app = data.app_url
                } else if (app.customId){
                    app.app = app.customId
                } else {
                    throw new SevereServiceError('[Invalid app path] app path ${app.app} is not correct, Provide correct path to app under test')
                }
            }

            log.info(`Using app: ${app.app}`)
            this._updateCaps(capabilities, 'app', app.app)
        }

        if (this._options.observability) {
            log.debug('sending lauch start event')

            let buildName: any
            let projectName: any
            let buildTag: any

            [buildName, projectName, buildTag] = getLaunchInfo(capabilities)

            let bsConfig = {
                username : this._config.user,
                password : this._config.key,
                projectName: projectName,
                buildName: buildName,
                buildTag: buildTag
            }
            const [BS_TESTOPS_JWT, BS_TESTOPS_BUILD_HASHED_ID] = await launchTestSession(bsConfig)
            if (BS_TESTOPS_JWT !== null) process.env.BS_TESTOPS_JWT = BS_TESTOPS_JWT
            if (BS_TESTOPS_BUILD_HASHED_ID !== null) process.env.BS_TESTOPS_BUILD_HASHED_ID = BS_TESTOPS_BUILD_HASHED_ID
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
        if (this._options.observability) {
            log.debug('sending lauch stop event')
            await stopBuildUpstream()
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
        if (app.app) form.append('file', fs.createReadStream(app.app))
        if (app.customId) form.append('custom_id', app.customId)

        const res = await got.post('https://api-cloud.browserstack.com/app-automate/upload', {
            body: form,
            username : this._config.user,
            password : this._config.key
        }).json().catch((err: any) => {
            throw new SevereServiceError(`app upload failed ${(err as Error).message}`)
        })

        return res as AppUploadResponse
    }

    /**
     * @param  {String | AppConfig}  appConfig    <string>: should be "app file path" or "app_url" or "custom_id" or "shareable_id".
     *                                            <object>: only "path" and "custom_id" should coexist as multiple properties.
     */
    async _validateApp (appConfig: AppConfig | string): Promise<App> {
        let app: App = {}

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

    _updateCaps(capabilities?: Capabilities.RemoteCapabilities, capType?: string, value?:string) {
        if (Array.isArray(capabilities)) {
            capabilities.forEach((capability: Capabilities.DesiredCapabilities) => {
                if (!capability['bstack:options']) {
                    const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        if (capType === 'local') {
                            capability['bstack:options'] = { local: true }
                        } else if (capType === 'app') {
                            capability['appium:app'] = value
                        }
                    } else if (capType === 'local'){
                        capability['browserstack.local'] = true
                    } else if (capType === 'app') {
                        capability['app'] = value
                    }
                } else if (capType === 'local') {
                    capability['bstack:options'].local = true
                } else if (capType === 'app') {
                    capability['appium:app'] = value
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
                        }
                    } else if (capType === 'local'){
                        (caps.capabilities as Capabilities.Capabilities)['browserstack.local'] = true
                    } else if (capType === 'app') {
                        (caps.capabilities as Capabilities.AppiumCapabilities)['app'] = value
                    }
                } else if (capType === 'local'){
                    (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.local = true
                } else if (capType === 'app') {
                    (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                }
            })
        } else {
            throw new SevereServiceError('Capabilities should be an object or Array!')
        }
    }
}
