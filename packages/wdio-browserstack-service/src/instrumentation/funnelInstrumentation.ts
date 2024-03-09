import os from 'node:os'
import util from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import UsageStats from '../testOps/usageStats.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import { BSTACK_SERVICE_VERSION, FUNNEL_INSTRUMENTATION_URL } from '../constants.js'
import { getDataFromWorkers } from '../data-store.js'
import fetchWrap from '../fetchWrapper.js'

async function fireFunnelTestEvent(eventType: string, config: BrowserStackConfig) {
    if (!config.userName || !config.accessKey) {
        BStackLogger.debug('username/accesskey not passed')
        return
    }

    try {
        const data = buildEventData(eventType, config)
        await fireFunnelRequest(data)
        BStackLogger.debug('Funnel event success')
        config.sentFunnelData()
    } catch (error) {
        BStackLogger.debug('Exception in sending funnel data: ' + error)
    }
}

export async function sendStart(config: BrowserStackConfig) {
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

    const encodedAuth = Buffer.from(`${data.userName}:${data.accessKey}`, 'utf8').toString('base64')
    const response = await fetchWrap(FUNNEL_INSTRUMENTATION_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            Authorization: `Basic ${encodedAuth}`,
        },
        body: JSON.stringify(data)
    })
    BStackLogger.debug('Funnel Event Response: ' + JSON.stringify(await response.text()))
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
