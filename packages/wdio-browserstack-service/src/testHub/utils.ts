import { BROWSERSTACK_PERCY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY } from '../constants.js'

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