
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

export const getProductMap = (config: BrowserStackConfig): { [key: string]: boolean } => {
    // LTS gating: under LTS, automate is forced false (LTS builds route to
    // the LTS internal hub; keeping automate=true tags TestHub source as
    // TO,AUT,LTS instead of TO,LTS — see py-sdk ea53d914). The `lts` key
    // itself is only emitted under LTS so non-LTS payloads stay byte-
    // identical to the pre-LTS-PR shape (avoids surprising any backend with
    // strict unknown-key validation).
    const lts = isLoadTestingSession()
    const entries: [string, boolean | undefined][] = [
        ['observability', config.testObservability.enabled],
        ['accessibility', config.accessibility],
        ['percy', config.percy],
        ['automate', lts ? false : config.automate],
        ['app_automate', config.appAutomate],
    ]
    if (lts) {
        entries.push(['lts', true])
    }
    return Object.fromEntries(entries.filter(([, v]) => v !== null)) as { [key: string]: boolean }
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

export const getProductMapForBuildStartCall = (config: BrowserStackConfig, accessibilityAutomation?: boolean | null): { [key: string]: boolean } => {
    // LTS gating: under LTS, automate is forced false (LTS builds route to
    // the LTS internal hub; keeping automate=true tags TestHub source as
    // TO,AUT,LTS instead of TO,LTS — see py-sdk ea53d914). The `lts` key
    // itself is only emitted under LTS to keep non-LTS payloads byte-
    // identical to the pre-LTS-PR shape.
    const lts = isLoadTestingSession()
    const entries: [string, boolean | undefined | null][] = [
        ['observability', config.testObservability.enabled],
        ['accessibility', accessibilityAutomation],
        ['percy', config.percy],
        ['automate', lts ? false : config.automate],
        ['app_automate', config.appAutomate],
    ]
    if (lts) {
        entries.push(['lts', true])
    }
    return Object.fromEntries(entries.filter(([, v]) => v !== null)) as { [key: string]: boolean }
}
