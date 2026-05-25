import type { AppConfig, BrowserstackConfig } from './types.js'
import type { Capabilities, Options } from '@wdio/types'
import { v4 as uuidv4 } from 'uuid'
import TestOpsConfig from './testOps/testOpsConfig.js'
import { hasAnyAppAutomateCapability, isUndefined } from './util.js'
import { BStackLogger } from './bstackLogger.js'

class BrowserStackConfig {
    static getInstance(
        options?: BrowserstackConfig & Options.Testrunner,
        config?: Options.Testrunner,
        capabilities?: Capabilities.TestrunnerCapabilities,
    ): BrowserStackConfig {
        if (!this._instance && options && config) {
            this._instance = new BrowserStackConfig(options, config, capabilities)
        }
        return this._instance
    }

    public userName?: string
    public accessKey?: string
    public framework?: string
    public buildName?: string
    public buildIdentifier?: string
    public testObservability: TestOpsConfig
    public percy: boolean
    public percyCaptureMode?: string
    public accessibility?: boolean
    public app?: string | AppConfig
    private static _instance: BrowserStackConfig
    public appAutomate: boolean
    public automate: boolean
    public funnelDataSent: boolean = false
    public percyBuildId?: number | null
    public isPercyAutoEnabled = false
    public sdkRunID: string

    constructor(
        options: BrowserstackConfig & Options.Testrunner,
        config: Options.Testrunner,
        capabilities?: Capabilities.TestrunnerCapabilities,
    ) {
        this.framework = config.framework
        this.userName = config.user
        this.accessKey = config.key
        this.testObservability = new TestOpsConfig(options.testObservability !== false, !isUndefined(options.testObservability))
        this.percy = options.percy || false
        this.accessibility = options.accessibility
        this.app = options.app
        this.appAutomate = !isUndefined(options.app) || hasAnyAppAutomateCapability(capabilities)
        this.automate = !this.appAutomate
        this.buildIdentifier = options.buildIdentifier
        this.sdkRunID = uuidv4()
        BStackLogger.info(`BrowserStack service started with id: ${this.sdkRunID}`)
    }

    sentFunnelData() {
        this.funnelDataSent = true
    }

}

export default BrowserStackConfig
