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
import { getProductMap } from '../testHub/utils.js'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'

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

function redactCredentialsFromFunnelData(data: any) {
    if (data) {
        if (data.userName) {
            data.userName = '[REDACTED]'
        }
        if (data.accessKey) {
            data.accessKey = '[REDACTED]'
        }
    }
    return data
}

// Called from two different process
export async function fireFunnelRequest(data: any): Promise<void> {
    const { userName, accessKey } = data
    redactCredentialsFromFunnelData(data)
    BStackLogger.debug('Sending SDK event with data ' + util.inspect(data, { depth: 6 }))
    await got.post(FUNNEL_INSTRUMENTATION_URL, {
        headers: {
            'content-type': 'application/json'
        }, username: userName, password: accessKey, json: data
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
        eventProperties.isPercyAutoEnabled = config.isPercyAutoEnabled
        eventProperties.percyBuildId = config.percyBuildId
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

const sendEvent = {
    tcgDown: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgDownResponse', config),
    invalidTcgAuth: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestInvalidTcgAuthResponseWithUserImpact', config),
    tcgAuthFailure: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgAuthFailure', config),
    tcgtInitSuccessful: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgtInitSuccessful', config),
    initFailed: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestInitFailedResponse', config),
}

function handleUpgradeRequired(isSelfHealEnabled: boolean | undefined) {
    if (isSelfHealEnabled) {
        BStackLogger.warn('Please upgrade Browserstack Service to the latest version to use the self-healing feature.')
    }
}

function handleAuthenticationFailure(status: number, config: BrowserStackConfig, isSelfHealEnabled: boolean | undefined) {
    if (status >= 500) {
        if (isSelfHealEnabled) {
            BStackLogger.warn('Something went wrong. Disabling healing for this session. Please try again later.')
        }
        sendEvent.tcgDown(config)
    } else {
        if (isSelfHealEnabled) {
            BStackLogger.warn('Authentication Failed. Disabling Healing for this session.')
        }
        sendEvent.tcgAuthFailure(config)
    }
}

function handleAuthenticationSuccess(
    isHealingEnabledForUser: boolean,
    userId: string,
    config: BrowserStackConfig,
    isSelfHealEnabled: boolean | undefined
) {
    if (!isHealingEnabledForUser && isSelfHealEnabled) {
        BStackLogger.warn('Healing is not enabled for your group, please contact the admin')
    } else if (userId && isHealingEnabledForUser) {
        sendEvent.tcgtInitSuccessful(config)
    }
}

function handleInitializationFailure(status: number, config: BrowserStackConfig, isSelfHealEnabled: boolean | undefined) {
    if (status >= 400) {
        sendEvent.initFailed(config)
    } else if (!status && isSelfHealEnabled) {
        sendEvent.invalidTcgAuth(config)
    }

    if (isSelfHealEnabled) {
        BStackLogger.warn('Authentication Failed. Healing will be disabled for this session.')
    }
}

export function handleHealingInstrumentation(
    authResult: BrowserstackHealing.InitErrorResponse | BrowserstackHealing.InitSuccessResponse,
    config: BrowserStackConfig,
    isSelfHealEnabled: boolean | undefined,
) {
    try {

        const { message, isAuthenticated, status, userId, groupId, isHealingEnabled: isHealingEnabledForUser } = authResult as any

        if (message === 'Upgrade required') {
            handleUpgradeRequired(isSelfHealEnabled)
            return
        }

        if (!isAuthenticated) {
            handleAuthenticationFailure(status, config, isSelfHealEnabled)
            return
        }

        if (isAuthenticated && userId && groupId) {
            handleAuthenticationSuccess(isHealingEnabledForUser, userId, config, isSelfHealEnabled)
            return
        }

        if (status >= 400 || !status) {
            handleInitializationFailure(status, config, isSelfHealEnabled)
            return
        }

    } catch (err) {
        BStackLogger.debug('Error in handling healing instrumentation: ' + err)
    }
}
