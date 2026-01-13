import logger from '@wdio/logger'
import type { XPathConversionResult } from './xpath-types.js'
import { convertXPathToOptimizedSelector } from './xpath-converter.js'
import { getHighResTime } from './timing.js'
import { LOG_PREFIX } from './constants.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Finds an optimized selector for a given XPath.
 */
export async function findOptimizedSelector(
    xpath: string,
    options: {
        usePageSource: boolean
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    }
): Promise<XPathConversionResult | null> {
    if (options.usePageSource) {
        log.info(`[${LOG_PREFIX}: Step 2] Collecting page source for dynamic analysis...`)
        const pageSourceStartTime = getHighResTime()
        const result = await convertXPathToOptimizedSelector(xpath, {
            browser: options.browser,
            usePageSource: true
        })
        const pageSourceDuration = getHighResTime() - pageSourceStartTime
        log.info(`[${LOG_PREFIX}: Step 2] Page source collected in ${pageSourceDuration.toFixed(2)}ms`)
        return result
    }

    const staticResult = convertXPathToOptimizedSelector(xpath, {
        usePageSource: false
    })
    return staticResult instanceof Promise ? await staticResult : staticResult
}
