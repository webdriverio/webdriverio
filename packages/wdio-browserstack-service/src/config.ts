import type { AppConfig, BrowserstackConfig } from './types.js'
import type { Capabilities, Options } from '@wdio/types'
import { v4 as uuidv4 } from 'uuid'
import TestOpsConfig from './testOps/testOpsConfig.js'
import { isTrue, isUndefined } from './util.js'
import { BStackLogger } from './bstackLogger.js'

const APP_AUTOMATE_CAP_KEYS = ['appium:app', 'appium:bundleId', 'appium:appPackage', 'appium:appActivity'] as const

function hasAppCap(cap: WebdriverIO.Capabilities | undefined): boolean {
    if (!cap || typeof cap !== 'object') {
        return false
    }
    const record = cap as Record<string, unknown>
    if (APP_AUTOMATE_CAP_KEYS.some(key => !isUndefined(record[key]))) {
        return true
    }
    const appiumOptions = record['appium:options'] as Record<string, unknown> | undefined
    return !!(appiumOptions && !isUndefined(appiumOptions.app))
}

function detectAppAutomate(capabilities?: Capabilities.TestrunnerCapabilities): boolean {
    if (!capabilities) {
        return false
    }
    const flat: WebdriverIO.Capabilities[] = []
    if (Array.isArray(capabilities)) {
        for (const entry of capabilities) {
            if (!entry || typeof entry !== 'object') {
                continue
            }
            if ('alwaysMatch' in entry) {
                const w3c = entry as { alwaysMatch: WebdriverIO.Capabilities; firstMatch?: WebdriverIO.Capabilities[] }
                flat.push(w3c.alwaysMatch)
                if (Array.isArray(w3c.firstMatch)) {
                    flat.push(...w3c.firstMatch)
                }
                continue
            }
            const values = Object.values(entry)
            const isParallelMultiremote = values.length > 0 && values.every(
                v => v !== null && typeof v === 'object' && (v as { capabilities?: unknown }).capabilities
            )
            if (isParallelMultiremote) {
                for (const v of values) {
                    flat.push((v as { capabilities: WebdriverIO.Capabilities }).capabilities)
                }
            } else {
                flat.push(entry as WebdriverIO.Capabilities)
            }
        }
    } else {
        for (const v of Object.values(capabilities)) {
            const inner = (v as { capabilities?: WebdriverIO.Capabilities }).capabilities
            if (inner) {
                flat.push(inner)
            }
        }
    }
    return flat.some(hasAppCap)
}

class BrowserStackConfig {
    static getInstance(
        options?: BrowserstackConfig & Options.Testrunner,
        config?: Options.Testrunner,
        capabilities?: Capabilities.TestrunnerCapabilities,
        isBrowserStackInfra?: boolean,
    ): BrowserStackConfig {
        if (!this._instance && options && config) {
            this._instance = new BrowserStackConfig(options, config, capabilities, isBrowserStackInfra)
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
        isBrowserStackInfra: boolean = true,
    ) {
        this.framework = config.framework
        this.userName = config.user
        this.accessKey = config.key
        this.testObservability = new TestOpsConfig(options.testObservability !== false, !isUndefined(options.testObservability))
        this.percy = options.percy || false
        this.accessibility = options.accessibility
        this.app = options.app
        // `automate`/`app_automate` describe a BrowserStack-hosted run. When the session
        // runs on an external (non-BrowserStack) grid — e.g. Test Observability only, with
        // credentials inside testObservabilityOptions — neither should be set, otherwise the
        // build is reported with origin `Automate` even though it never touched BrowserStack.
        // `skipAppOverride: true` marks an App Automate run even when no `app` is set — the user
        // supplies the app themselves (driver cap / BROWSERSTACK_APP_ID), so classification must not
        // depend on an app value being present. Mirrors isAppAutomateSession() in the Node SDK.
        this.appAutomate = isBrowserStackInfra && (!isUndefined(options.app) || isTrue(options.skipAppOverride) || detectAppAutomate(capabilities))
        this.automate = isBrowserStackInfra && !this.appAutomate
        this.buildIdentifier = options.buildIdentifier
        this.sdkRunID = uuidv4()
        BStackLogger.info(`BrowserStack service started with id: ${this.sdkRunID}`)
    }

    sentFunnelData() {
        this.funnelDataSent = true
    }

}

export default BrowserStackConfig
