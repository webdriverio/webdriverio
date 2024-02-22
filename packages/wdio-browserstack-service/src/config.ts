import type { AppConfig, BrowserstackConfig } from './types.js'
import type { Options } from '@wdio/types'

class BrowserStackConfig {
    static getInstance(options?: BrowserstackConfig & Options.Testrunner, config?: Options.Testrunner): BrowserStackConfig {
        if (!this._instance && options && config) {
            this._instance = new BrowserStackConfig(options, config)
        }
        return this._instance
    }

    public userName?: string
    public accessKey?: string
    public framework?: string
    public buildName?: string
    public buildIdentifier?: string
    public testObservability: boolean
    public percy: boolean
    public accessibility: boolean
    public app?: string|AppConfig
    private static _instance: BrowserStackConfig
    public appAutomate: boolean
    public automate: boolean

    constructor(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner) {
        this.framework = config.framework
        this.userName = config.user
        this.accessKey = config.key
        this.testObservability = options.testObservability || true
        this.percy = options.percy || false
        this.accessibility = options.accessibility || false
        this.app = options.app
        this.appAutomate = options.app != undefined //  TODO: Need to check capabilities to check if any of it is app automate
        this.automate = options.app == undefined // TODO: Check logic
        this.buildIdentifier = options.buildIdentifier
    }

}

export default BrowserStackConfig
