
import { BROWSERSTACK_PERCY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY, BROWSERSTACK_TEST_REPORTING } from '../constants.js'
import type BrowserStackConfig from '../config.js'
import { BStackLogger } from '../bstackLogger.js'
import { isTrue } from '../util.js'

interface ErrorType {
    key: string
    message: string
}

export interface Errors {
    errors: ErrorType[]
}

export const getProductMap = (config: BrowserStackConfig): { [key: string]: boolean } => {
    return {
        observability: config.testObservability.enabled,
        accessibility: config.accessibility as boolean,
        percy: config.percy,
        automate: config.automate,
        app_automate: config.appAutomate
    }
}

export const shouldProcessEventForTesthub = (eventType: string): boolean => {
    if (isTrue(process.env[BROWSERSTACK_OBSERVABILITY]) || isTrue(process.env[BROWSERSTACK_TEST_REPORTING])) {
        return true
    }
    if (isTrue(process.env[BROWSERSTACK_ACCESSIBILITY])) {
        return !(['HookRunStarted', 'HookRunFinished', 'LogCreated'].includes(eventType))
    }
    if (isTrue(process.env[BROWSERSTACK_PERCY]) && eventType) {
        return false
    }
    return Boolean(process.env[BROWSERSTACK_ACCESSIBILITY] || process.env[BROWSERSTACK_OBSERVABILITY] || process.env[BROWSERSTACK_TEST_REPORTING] || process.env[BROWSERSTACK_PERCY])!
}

export const handleErrorForObservability = (error: Errors | null): void => {
    process.env[BROWSERSTACK_OBSERVABILITY] = 'false'
    process.env[BROWSERSTACK_TEST_REPORTING] = 'false'
    logBuildError(error, 'Test Reporting and Analytics')
}

export const handleErrorForAccessibility = (error: Errors | null): void => {
    process.env[BROWSERSTACK_ACCESSIBILITY] = 'false'
    logBuildError(error, 'accessibility')
}

export const logBuildError = (error: Errors | null, product: string = ''): void => {
    if (!error || !error.errors) {
        BStackLogger.error(`${product.toUpperCase()} Build creation failed ${error!}`)
        return
    }

    for (const errorJson of error.errors) {
        const errorType = errorJson.key
        const errorMessage = errorJson.message
        if (errorMessage) {
            switch (errorType) {
            case 'ERROR_INVALID_CREDENTIALS':
                BStackLogger.error(errorMessage)
                break
            case 'ERROR_ACCESS_DENIED':
                BStackLogger.info(errorMessage)
                break
            case 'ERROR_SDK_DEPRECATED':
                BStackLogger.error(errorMessage)
                break
            default:
                BStackLogger.error(errorMessage)
            }
        }
    }
}

export const getProductMapForBuildStartCall = (config: BrowserStackConfig, accessibilityAutomation: boolean | null): { [key: string]: boolean | null } => {
    return {
        observability: config.testObservability.enabled,
        accessibility: accessibilityAutomation,
        percy: config.percy,
        automate: config.automate,
        app_automate: config.appAutomate
    }
}
