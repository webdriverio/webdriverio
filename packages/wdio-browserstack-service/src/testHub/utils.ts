
import { BROWSERSTACK_PERCY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY } from '../constants.js'
import type BrowserStackConfig from '../config.js'
import { BStackLogger } from '../bstackLogger.js'
import { isTrue, isLoadTestingSession } from '../util.js'

interface ErrorType {
    key: string
    message: string
}

export interface Errors {
    errors: ErrorType[]
}

export const getProductMap = (config: BrowserStackConfig): { [key: string]: boolean | undefined } => {
    // LTS runs explicitly disable Automate (browserstackAutomation: false)
    // and route to the LTS internal hub instead of the Automate cloud hub.
    // Keeping automate=true here causes builds to land in TestHub with
    // source=TO,AUT,LTS instead of the expected TO,LTS that production
    // (binary-CLI-managed) LTS builds carry. Mirror of py-sdk ea53d914.
    const lts = isLoadTestingSession()
    return {
        observability: config.testObservability.enabled,
        accessibility: config.accessibility,
        percy: config.percy,
        automate: lts ? false : config.automate,
        app_automate: config.appAutomate,
        lts
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

export const handleErrorForObservability = (error: Errors | null): void => {
    process.env[BROWSERSTACK_OBSERVABILITY] = 'false'
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

export const getProductMapForBuildStartCall = (config: BrowserStackConfig, accessibilityAutomation?: boolean): { [key: string]: boolean | undefined } => {
    // See getProductMap above — same LTS-gated automate=false so the
    // build-start payload aligns with production binary-CLI LTS builds
    // (source: TO,LTS) instead of TO,AUT,LTS. Mirror of py-sdk ea53d914.
    const lts = isLoadTestingSession()
    return {
        observability: config.testObservability.enabled,
        accessibility: accessibilityAutomation,
        percy: config.percy,
        automate: lts ? false : config.automate,
        app_automate: config.appAutomate,
        lts
    }
}
