import * as os from 'node:os'
import * as util from 'node:util'
import UsageStats from '../testOps/usageStats.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import got from 'got'
import { BSTACK_SERVICE_VERSION } from '../constants.js'
import path from 'node:path'
import fs from 'node:fs'

class FunnelTestEvent {
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
        } catch (error)  {
            BStackLogger.debug('exception in sending funnel data ' + error)
            // BStackLogger.debug("exception in sending funnel data " + error.stack)
        }
    }

    static async sendStart(config: BrowserStackConfig) {
        await this.fireFunnelTestEvent('SDKTestAttempted', config)
    }

    static async sendFinish(config: BrowserStackConfig) {
        await this.fireFunnelTestEvent('SDKTestSuccessful', config)
    }

    static saveFunnelData(eventType:string, config:BrowserStackConfig): string {
        const data = this.buildEventData(eventType, config)
        const logFolderPath = path.join(process.cwd(), 'logs')
        const filePath = path.join(logFolderPath, 'funnelData.json')
        if (!fs.existsSync(logFolderPath)) {
            fs.mkdirSync(logFolderPath, { recursive: true })
        }
        fs.writeFileSync(filePath, JSON.stringify(data))
        return filePath
    }

    private static getProductList(config: BrowserStackConfig) {
        const products: string[] = [] // TODO: add automate and app-automate
        if (config.testObservability.enabled) {
            products.push('observability')
        }

        if (config.accessibility) {
            products.push('accessibility')
        }

        if (config.percy) {
            products.push('percy')
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
            eventProperties.productUsage = this.getProductUsage()
        }

        return {
            userName: config.userName,
            accessKey: config.accessKey,
            event_type: eventType,
            detectedFramework: 'WebdriverIO-' + config.framework,
            event_properties: eventProperties
        }

    }

    private static getProductUsage() {
        return {
            testObservability: UsageStats.getInstance().getFormattedData()
        }
    }

    private static getLanguageFramework(framework?: string) {
        return 'WebdriverIO_' + framework
    }

    // Called from two different process
    public static async fireRequest(data: any): Promise<void> {
        BStackLogger.debug('Sending SDK event with data ' + util.inspect(data, { depth: 6 }))
        await got.post('https://api.browserstack.com/sdk/v1/event', {
            headers: {
                'content-type': 'application/json'
            },
            username: data.userName,
            password: data.accessKey,
            json: data
        })
    }

    private static getReferrer(framework?: string) {
        const fullName = framework ? 'WebdriverIO-' + framework : 'WebdriverIO'
        return `${fullName}/${BSTACK_SERVICE_VERSION}`
    }
}

export default FunnelTestEvent
