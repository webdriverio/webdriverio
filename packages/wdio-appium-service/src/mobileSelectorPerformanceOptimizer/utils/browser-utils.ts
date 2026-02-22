import logger from '@wdio/logger'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Checks if the browser is in native context.
 * MSPO only works in native context, not in webview context.
 */
export function isNativeContext(browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser): boolean {
    if (!browser) {
        return false
    }

    try {
        const browserWithNativeContext = browser as WebdriverIO.Browser

        if ('instances' in browser && Array.isArray(browser.instances)) {
            log.warn('Mobile Selector Performance Optimizer does not support MultiRemote sessions yet. Feature disabled for this session.')
            return false
        }

        return browserWithNativeContext.isNativeContext === true
    } catch {
        return false
    }
}
