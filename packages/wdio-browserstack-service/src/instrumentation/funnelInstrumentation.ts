import * as os from 'node:os'
import * as util from 'node:util'
import UsageStats from '../testOps/usageStats.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import got from 'got'
import { BSTACK_SERVICE_VERSION } from '../constants.js'

class FunnelTestEvent {
    static async fireFunnelTestEvent(event_type: string, config: BrowserStackConfig) {
        try {
            if (!config.userName || !config.accessKey) {
                BStackLogger.debug('username/accesskey not passed')
                return
            }

            const data = this.buildEventData(event_type, config)
            await this.fireRequest(config, data)
            BStackLogger.debug('Funnel event success')
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

    private static getProductList(config: BrowserStackConfig) {
        const products: string[] = [] // TODO: add automate and app-automate
        if (config.testObservability) {
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
            'observability': config.testObservability,
            'accessibility': config.accessibility,
            'percy': config.percy,
            'automate': config.automate,
            'app_automate': config.appAutomate
        }
    }

    private static buildEventData(event_type: string, config: BrowserStackConfig): any {
        return {
            userName: config.userName,
            accessKey: config.accessKey,
            event_type: event_type,
            detectedFramework: 'WebdriverIO-' + config.framework,
            event_properties: {
                // Framework Details
                language_framework: this.getLanguageFramework(config.framework),
                referrer: this.getReferrer(config.framework),
                language: 'nodejs',
                languageVersion: process.version,

                // Build Details
                buildName: config.buildName || 'undefined',
                buildIdentifier: String(config.buildIdentifier),

                // Host details
                os: os.type() || 'unknown',
                hostname: os.hostname() || 'unknown',

                // Product Details
                productUsage: this.getProductUsage(),
                productMap: this.getProductMap(config),
                product: this.getProductList(config),
            }
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

    private static async fireRequest(config: BrowserStackConfig, data: object): Promise<void> {
        BStackLogger.debug('Sending SDK event with data ' + util.inspect(data, { depth: 6 }))
        await got.post('https://api.browserstack.com/sdk/v1/event', {
            headers: {
                'content-type': 'application/json'
            },
            username: config.userName,
            password: config.accessKey,
            json: data
        })
    }

    private static getReferrer(framework?: string) {
        const fullName = framework ? 'WebdriverIO-' + framework : 'WebdriverIO'
        return `${fullName}/${BSTACK_SERVICE_VERSION}`
    }
}

export default FunnelTestEvent
