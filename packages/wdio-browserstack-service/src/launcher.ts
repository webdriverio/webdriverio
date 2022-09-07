import { promisify } from 'util'
import { performance, PerformanceObserver } from 'perf_hooks'

import * as BrowserstackLocalLauncher from 'browserstack-local'
import logger from '@wdio/logger'
import type { Capabilities, Services, Options, JsonObject } from '@wdio/types'

import got, { Response } from 'got'
import FormData from 'form-data'
import fs from 'fs'
import * as path from 'path'

// @ts-ignore
import { version as bstackServiceVersion } from '../package.json'
import { BrowserstackConfig } from './types'

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
    }

    async onPrepare (config?: Options.Testrunner, capabilities?: Capabilities.RemoteCapabilities) {
        /**
         * Upload app to BrowserStack if valid file path to app is given.
         * Assign app value to capability if app_url, custom_id, shareable_id is given
         */
        if (this._options.app) {
            let app: string | undefined
            let customId: string | undefined

            if (typeof this._options.app === 'string'){
                app = this._options.app
            } else if (typeof this._options.app === 'object' && Object.keys(this._options.app).length) {
                app = this._options.app.id || this._options.app.path || this._options.app.custom_id || this._options.app.sharable_id
                customId = this._options.app.custom_id
            } else {
                log.warn('[Invalid format] app should be string or an object')
                process.emit('SIGINT')
            }

            if (app && ['.apk', '.aab', '.ipa'].includes(path.extname(app))){
                if (fs.existsSync(app)) {
                    const data: any = await this._uploadApp(app, customId)
                    log.info(`app upload completed ${data.app_url}`)
                    this._updateCaps(capabilities, 'app', data.app_url)
                } else if (customId){
                    this._updateCaps(capabilities, 'app', customId)
                } else {
                    log.warn('Invalid file path...')
                    process.emit('SIGINT')
                }
            } else if (app) {
                this._updateCaps(capabilities, 'app', app)
            } else {
                log.warn('Invalid property given for app object, supported properties are {id: <string>, path: <string>, custom_id: <string>, sharable_id: <string>}')
                process.emit('SIGINT')
            }
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

    onComplete () {
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

    async _uploadApp(appPath: string, customId?: string): Promise<JsonObject> {
        log.info(`uploading app ${appPath} to browserstack`)

        const form = new FormData()
        form.append('file', fs.createReadStream(appPath))
        if (customId) form.append('custom_id', customId)

        const res = await got.post('https://api-cloud.browserstack.com/app-automate/upload', {
            body: form,
            username : this._config.user,
            password : this._config.key
        }).json().catch((err) => { this._uploadErrHandler(err) })

        return res as JsonObject
    }

    _uploadErrHandler(err: Response<Error>) {
        log.warn(`app upload failed, ${err}`)
        process.emit('SIGINT')
    }

    _updateCaps(capabilities?: Capabilities.RemoteCapabilities, capType?: string, value?:string) {
        if (Array.isArray(capabilities)) {
            capabilities.forEach((capability: Capabilities.DesiredCapabilities) => {
                if (!capability['bstack:options']) {
                    const extensionCaps = Object.keys(capability).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        if (capType == 'local') {
                            capability['bstack:options'] = { local: true }
                        } else {
                            capability['appium:app'] = value
                        }
                    } else if (capType == 'local'){
                        capability['browserstack.local'] = true
                    } else {
                        capability['app'] = value
                    }
                } else if (capType == 'local') {
                    capability['bstack:options'].local = true
                } else {
                    capability['appium:app'] = value
                }
            })
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                if (!(caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                    const extensionCaps = Object.keys(caps.capabilities).filter((cap) => cap.includes(':'))
                    if (extensionCaps.length) {
                        if (capType == 'local') {
                            (caps.capabilities as Capabilities.Capabilities)['bstack:options'] = { local: true }
                        } else {
                            (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                        }
                    } else if (capType == 'local'){
                        (caps.capabilities as Capabilities.Capabilities)['browserstack.local'] = true
                    } else {
                        (caps.capabilities as Capabilities.Capabilities)['app'] = value
                    }
                } else if (capType == 'local'){
                    (caps.capabilities as Capabilities.Capabilities)['bstack:options']!.local = true
                } else {
                    (caps.capabilities as Capabilities.Capabilities)['appium:app'] = value
                }
            })
        } else {
            throw TypeError('Capabilities should be an object or Array!')
        }
    }
}
