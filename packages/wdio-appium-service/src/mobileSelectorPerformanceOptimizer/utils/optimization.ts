import type { XPathConversionResult } from './xpath-types.js'
import { convertXPathToOptimizedSelector } from './xpath-converter.js'
import { getHighResTime } from './timing.js'
import { INDENT_LEVEL_1, LOG_PREFIX } from './constants.js'

/**
 * Finds an optimized selector for a given XPath.
 */
export async function findOptimizedSelector(
    xpath: string,
    options: {
        usePageSource: boolean
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        logPageSource?: boolean
    }
): Promise<XPathConversionResult | null> {
    if (options.usePageSource) {
        if (options.logPageSource !== false) {
            console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 2] Collecting page source for dynamic analysis...`)
        }
        const pageSourceStartTime = getHighResTime()
        const result = await convertXPathToOptimizedSelector(xpath, {
            browser: options.browser,
            usePageSource: true
        })
        if (options.logPageSource !== false) {
            const pageSourceDuration = getHighResTime() - pageSourceStartTime
            console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 2] Page source collected in ${pageSourceDuration.toFixed(2)}ms`)
        }
        return result
    }

    const staticResult = convertXPathToOptimizedSelector(xpath, {
        usePageSource: false
    })
    return staticResult instanceof Promise ? await staticResult : staticResult
}
