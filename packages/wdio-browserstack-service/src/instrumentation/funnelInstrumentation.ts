import * as os from 'node:os'
import * as util from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import got from 'got'
import UsageStats from '../testOps/usageStats.js'
import {BStackLogger} from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import {BSTACK_SERVICE_VERSION, FUNNEL_INSTRUMENTATION_URL} from '../constants.js'
import DataStore from "../data-store.js";

class FunnelTestEvent {
    static workersDataDirPath = path.join(process.cwd(), 'logs', 'worker_data')

    static async fireFunnelTestEvent(eventType: string, config: BrowserStackConfig) {
        try {
            if (!config.userName || !config.accessKey) {
                BStackLogger.debug('username/accesskey not passed')
                return
            }

            const data = this.buildEventData(eventType, config)
            await this.fireRequest(data)
            BStackLogger.debug('Funnel event success')
            config.sentFunnelData()
        } catch (error) {
            BStackLogger.debug('Exception in sending funnel data: ' + error)
        }
    }

    static async sendStart(config: BrowserStackConfig) {
        await this.fireFunnelTestEvent('SDKTestAttempted', config)
    }

    static async sendFinish(config: BrowserStackConfig) {
        await this.fireFunnelTestEvent('SDKTestSuccessful', config)
    }

    static saveFunnelData(eventType: string, config: BrowserStackConfig): string {
        const data = this.buildEventData(eventType, config)

        BStackLogger.ensureLogsFolder()
        const filePath = path.join(BStackLogger.logFolderPath, 'funnelData.json')
        fs.writeFileSync(filePath, JSON.stringify(data))
        return filePath
    }

    // Called from two different process
    public static async fireRequest(data: any): Promise<void> {
        BStackLogger.debug('Sending SDK event with data ' + util.inspect(data, {depth: 6}))
        await got.post(FUNNEL_INSTRUMENTATION_URL, {
            headers: {
                'content-type': 'application/json'
            }, username: data.userName, password: data.accessKey, json: data
        })
    }

    private static getProductList(config: BrowserStackConfig) {
        const products: string[] = []
        if (config.testObservability.enabled) {
            products.push('observability')
        }

        if (config.accessibility) {
            products.push('accessibility')
        }

        if (config.percy) {
            products.push('percy')
        }

        if (config.automate) {
            products.push('automate')
        }

        if (config.appAutomate) {
            products.push('app-automate')
        }
        return products
    }

    private static getProductMap(config: BrowserStackConfig): any {
        return {
            'observability': config.testObservability.enabled,
            'accessibility': config.accessibility,
            'percy': config.percy,
            'automate': config.automate,
            'app_automate': config.appAutomate
        }
    }

    private static buildEventData(eventType: string, config: BrowserStackConfig): any {
        const eventProperties: any = {
            // Framework Details
            language_framework: this.getLanguageFramework(config.framework),
            referrer: this.getReferrer(config.framework),
            language: 'WebdriverIO',
            languageVersion: process.version,

            // Build Details
            buildName: config.buildName || 'undefined',
            buildIdentifier: String(config.buildIdentifier),

            // Host details
            os: os.type() || 'unknown',
            hostname: os.hostname() || 'unknown',

            // Product Details
            productMap: this.getProductMap(config),
            product: this.getProductList(config),
        }

        if (eventType === 'SDKTestSuccessful') {
            const workerData = DataStore.getDataFromWorkers()
            eventProperties.productUsage = this.getProductUsage(workerData)
        }

        return {
            userName: config.userName,
            accessKey: config.accessKey,
            event_type: eventType,
            detectedFramework: 'WebdriverIO-' + config.framework,
            event_properties: eventProperties
        }

    }

    private static getProductUsage(workersData: any[]) {
        return {
            testObservability: UsageStats.getInstance().getFormattedData(workersData)
        }
    }

    private static getLanguageFramework(framework?: string) {
        return 'WebdriverIO_' + framework
    }

    private static getReferrer(framework?: string) {
        const fullName = framework ? 'WebdriverIO-' + framework : 'WebdriverIO'
        return `${fullName}/${BSTACK_SERVICE_VERSION}`
    }
}

export default FunnelTestEvent
