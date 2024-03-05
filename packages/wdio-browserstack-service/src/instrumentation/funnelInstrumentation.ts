import os from 'node:os'
import util from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import got from 'got'
import UsageStats from '../testOps/usageStats.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import { BSTACK_SERVICE_VERSION, FUNNEL_INSTRUMENTATION_URL } from '../constants.js'
import { getDataFromWorkers, removeWorkersDataDir } from '../data-store.js'

async function fireFunnelTestEvent(eventType: string, config: BrowserStackConfig) {
    if (!config.userName || !config.accessKey) {
        BStackLogger.debug('username/accesskey not passed')
        return
    }

    try {
        const data = buildEventData(eventType, config)
        await fireFunnelRequest(data)
        BStackLogger.debug('Funnel event success')
        if (eventType === 'SDKTestSuccessful') {
            config.sentFunnelData()
        }
    } catch (error) {
        BStackLogger.debug('Exception in sending funnel data: ' + error)
    }
}

export async function sendStart(config: BrowserStackConfig) {
    // Remove Workers folder if exists
    removeWorkersDataDir()
    await fireFunnelTestEvent('SDKTestAttempted', config)
}

export async function sendFinish(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestSuccessful', config)
}

export function saveFunnelData(eventType: string, config: BrowserStackConfig): string {
    const data = buildEventData(eventType, config)

    BStackLogger.ensureLogsFolder()
    const filePath = path.join(BStackLogger.logFolderPath, 'funnelData.json')
    fs.writeFileSync(filePath, JSON.stringify(data))
    return filePath
}

// Called from two different process
export async function fireFunnelRequest(data: any): Promise<void> {
    BStackLogger.debug('Sending SDK event with data ' + util.inspect(data, { depth: 6 }))
    await got.post(FUNNEL_INSTRUMENTATION_URL, {
        headers: {
            'content-type': 'application/json'
        }, username: data.userName, password: data.accessKey, json: data
    })
}

function getProductList(config: BrowserStackConfig) {
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

function getProductMap(config: BrowserStackConfig): any {
    return {
        'observability': config.testObservability.enabled,
        'accessibility': config.accessibility,
        'percy': config.percy,
        'automate': config.automate,
        'app_automate': config.appAutomate
    }
}

function buildEventData(eventType: string, config: BrowserStackConfig): any {
    const eventProperties: any = {
        // Framework Details
        language_framework: getLanguageFramework(config.framework),
        referrer: getReferrer(config.framework),
        language: 'WebdriverIO',
        languageVersion: process.version,

        // Build Details
        buildName: config.buildName || 'undefined',
        buildIdentifier: String(config.buildIdentifier),

        // Host details
        os: os.type() || 'unknown',
        hostname: os.hostname() || 'unknown',

        // Product Details
        productMap: getProductMap(config),
        product: getProductList(config),
    }

    if (eventType === 'SDKTestSuccessful') {
        const workerData = getDataFromWorkers()
        eventProperties.productUsage = getProductUsage(workerData)
    }

    return {
        userName: config.userName,
        accessKey: config.accessKey,
        event_type: eventType,
        detectedFramework: 'WebdriverIO-' + config.framework,
        event_properties: eventProperties
    }

}

function getProductUsage(workersData: any[]) {
    return {
        testObservability: UsageStats.getInstance().getFormattedData(workersData)
    }
}

function getLanguageFramework(framework?: string) {
    return 'WebdriverIO_' + framework
}

function getReferrer(framework?: string) {
    const fullName = framework ? 'WebdriverIO-' + framework : 'WebdriverIO'
    return `${fullName}/${BSTACK_SERVICE_VERSION}`
}
