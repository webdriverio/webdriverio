
import { BROWSERSTACK_PERCY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY } from '../constants.js'
import type BrowserStackConfig from '../config.js'
import { BStackLogger } from '../bstackLogger.js'

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
    if (process.env[BROWSERSTACK_PERCY] && !process.env[BROWSERSTACK_ACCESSIBILITY] && !process.env[BROWSERSTACK_OBSERVABILITY]) {
        if (['LogCreated', 'CBTSessionCreated'].includes(eventType)) {
            return false
        }

        return true
    }
    // Do not send hooks events for accessibility true and observability false
    if (process.env[BROWSERSTACK_ACCESSIBILITY] && !process.env[BROWSERSTACK_OBSERVABILITY]) {
        if (['HookRunStarted', 'HookRunFinished', 'LogCreated'].includes(eventType)) {
            return false
        }

        return true
    }

    return Boolean(process.env[BROWSERSTACK_ACCESSIBILITY] || process.env[BROWSERSTACK_OBSERVABILITY] || process.env[BROWSERSTACK_PERCY])!
}

export const logBuildError = (error: any, product: string = ''): void => {
    if (!error) {
        BStackLogger.error(`${product.toUpperCase()} Build creation failed`)
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
                BStackLogger.error(errorMessage)
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
