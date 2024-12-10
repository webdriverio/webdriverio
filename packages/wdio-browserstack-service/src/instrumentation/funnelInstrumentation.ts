import os from 'node:os'
import util, { format } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import UsageStats from '../testOps/usageStats.js'
import { BStackLogger } from '../bstackLogger.js'
import type BrowserStackConfig from '../config.js'
import { BSTACK_SERVICE_VERSION, FUNNEL_INSTRUMENTATION_URL } from '../constants.js'
import { getDataFromWorkers } from '../data-store.js'
import { getProductMap } from '../testHub/utils.js'
import fetchWrap from '../fetchWrapper.js'
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
        config.sentFunnelData()
    } catch (error) {
        BStackLogger.debug(`Exception in sending funnel data: ${format(error)}`)
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

    const encodedAuth = Buffer.from(`${userName}:${accessKey}`, 'utf8').toString('base64')
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

const sendEvent = {
    tcgDown: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgDownResponse', config),
    invalidTcgAuth: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestInvalidTcgAuthResponseWithUserImpact', config),
    tcgAuthFailure: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgAuthFailure', config),
    tcgtInitSuccessful: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgtInitSuccessful', config),
    initFailed: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestInitFailedResponse', config),
    tcgProxyFailure: (config: BrowserStackConfig) => fireFunnelTestEvent('SDKTestTcgProxyFailure', config),
}

function isProxyError(authResult: any): boolean {
    return (authResult as BrowserstackHealing.InitErrorResponse).status === 502
}

function handleProxyError(config: BrowserStackConfig, isSelfHealEnabled: boolean | undefined) {
    sendEvent.tcgProxyFailure(config)
    if (isSelfHealEnabled) {
        BStackLogger.warn('Proxy Error. Disabling Healing for this session.')
    }
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
        if (isProxyError(authResult)) {
            handleProxyError(config, isSelfHealEnabled)
            return
        }

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
