import os from 'node:os'
import util from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import got from 'got'
import UsageStats from '../testOps/usageStats.js'
import TestOpsConfig from '../testOps/testOpsConfig.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import { BSTACK_SERVICE_VERSION, FUNNEL_INSTRUMENTATION_URL } from '../constants.js'
import { getDataFromWorkers, removeWorkersDataDir } from '../data-store.js'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'
import type { Options } from '@wdio/types'
import type { BrowserstackConfig } from '../types.js'

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
        sdkRunId: config.sdkRunID,

        // Host details
        os: os.type() || 'unknown',
        hostname: os.hostname() || 'unknown',

        // Product Details
        productMap: getProductMap(config),
        product: getProductList(config),
    }
    if (TestOpsConfig.getInstance().buildHashedId) {
        eventProperties.testhub_uuid = TestOpsConfig.getInstance().buildHashedId
    }

    if (eventType === 'SDKTestSuccessful') {
        const workerData = getDataFromWorkers()
        eventProperties.productUsage = getProductUsage(workerData)
        if (config.killSignal) {
            eventProperties.finishedMetadata = {
                reason: 'user_killed',
                signal: config.killSignal
            }
        }
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

async function sendTcgDownError(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestTcgDownResponse', config)
}

async function sendInvalidTcgAuthResponse(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestInvalidTcgAuthResponseWithUserImpact', config)
}

async function sendTcgAuthFailure(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestTcgAuthFailure', config)
}

async function sendTcgtInitSuccessful(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestTcgtInitSuccessful', config)
}

async function sendInitFailedResponse(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestInitFailedResponse', config)
}

async function sendTcgProxyFailure(config: BrowserStackConfig) {
    await fireFunnelTestEvent('SDKTestTcgProxyFailure', config)
}

export function handleHealingInstrumentation (
    authResult: BrowserstackHealing.InitErrorResponse | BrowserstackHealing.InitSuccessResponse,
    config: BrowserStackConfig,
    isSelfHealEnabled: boolean | undefined,
    options: BrowserstackConfig & Options.Testrunner
) {

    try {

        // TODO: Might need to explore more on proxy handling and modify this condition accordingly
        const proxyHost = (config as any).proxyHost || (config as any).localProxyHost || (options as any).proxyHost || (options as any).localProxyHost

        if (proxyHost) {
            sendTcgProxyFailure(config)
            return
        }

        const { message, isAuthenticated, status, userId, isHealingEnabled:isHealingEnabledForUser } = authResult as any

        if (isSelfHealEnabled) {
            if (message === 'Upgrade required') {
                BStackLogger.warn('Please upgrade Browserstack Service to the latest version to use the self-healing feature.')
                return
            }

            if (!isAuthenticated) {
                if (status >= 500) {
                    BStackLogger.warn('Something went wrong. Disabling healing for this session. Please try again later.')
                    sendTcgDownError(config)
                } else {
                    BStackLogger.warn('Authentication Failed. Disabling Healing for this session.')
                    sendTcgAuthFailure(config)
                }
                return
            }

            if (!isHealingEnabledForUser) {
                BStackLogger.warn('Healing is not enabled for your group, please contact the admin')
            } else if (userId) {
                sendTcgtInitSuccessful(config)
            }

            if (status >= 400) {
                sendInitFailedResponse(config)
            } else if (!status) {
                sendInvalidTcgAuthResponse(config)
            }
        }
    } catch (err) {
        BStackLogger.debug('Error in handling healing instrumentation: ' + err)
    }
}
