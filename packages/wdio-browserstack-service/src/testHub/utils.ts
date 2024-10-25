
import { BROWSERSTACK_PERCY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY } from '../constants.js'
import type BrowserStackConfig from '../config.js'
import { BStackLogger } from '../bstackLogger.js'
import { isTrue } from '../util.js'

export const getProductMap = (config: BrowserStackConfig): any => {
    return {
        'observability': config.testObservability.enabled,
        'accessibility': config.accessibility,
        'percy': config.percy,
        'automate': config.automate,
        'app_automate': config.appAutomate
    }
}

export const shouldProcessEventForTesthub = (eventType: string): boolean => {
    if (isTrue(process.env[BROWSERSTACK_OBSERVABILITY])) {
        return true
    }
    if (isTrue(process.env[BROWSERSTACK_ACCESSIBILITY])) {
        return !(['HookRunStarted', 'HookRunFinished', 'LogCreated'].includes(eventType))
    }
    if (isTrue(process.env[BROWSERSTACK_PERCY]) && eventType) {
        return false
    }
    return Boolean(process.env[BROWSERSTACK_ACCESSIBILITY] || process.env[BROWSERSTACK_OBSERVABILITY] || process.env[BROWSERSTACK_PERCY])!
}

export const handleErrorForObservability = (error: any): void => {
    process.env[BROWSERSTACK_OBSERVABILITY] = 'false'
    logBuildError(error, 'observability')
}

export const handleErrorForAccessibility = (error: any): void => {
    process.env[BROWSERSTACK_ACCESSIBILITY] = 'false'
    logBuildError(error, 'accessibility')
}

export const logBuildError = (error: any, product: string = ''): void => {
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
