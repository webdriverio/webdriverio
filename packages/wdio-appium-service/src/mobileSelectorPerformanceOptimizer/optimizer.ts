import logger from '@wdio/logger'
import type { OptimizationOptions } from './types.js'
import {
    formatSelectorForDisplay,
    getHighResTime,
    parseOptimizedSelector,
    testOptimizedSelector,
    findOptimizedSelector,
    logOptimizationConclusion,
    createOptimizedSelectorData,
    findSelectorLocation,
    formatSelectorLocations,
    LOG_PREFIX
} from './utils/index.js'
import { getCurrentTestFile, getCurrentSuiteName, getCurrentTestName, addPerformanceData } from './mspo-store.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Core optimization flow shared between single and multiple element selectors.
 * This function handles the common optimization logic:
 * 1. Test original XPath selector
 * 2. Find optimized selector
 * 3. Test optimized selector
 * 4. Compare performance and store data
 * 5. Execute with optimized selector (or fallback)
 *
 * @param commandName - The command name (e.g., '$', '$$')
 * @param selector - The original XPath selector
 * @param originalFunc - The original command function to call
 * @param browser - The browser instance
 * @param options - Optimization options
 * @param isMultiple - Whether this is a multiple element command ($$)
 * @returns The element(s) found
 */
async function optimizeSelector<T extends WebdriverIO.Element | WebdriverIO.Element[]>(
    commandName: string,
    selector: string,
    originalFunc: (selector: unknown) => Promise<T>,
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    options: OptimizationOptions,
    isMultiple: boolean
): Promise<T> {
    const elementWord = isMultiple ? 'element(s)' : 'element'

    // Search for selector locations in test file and page objects
    const testFile = getCurrentTestFile()
    const locations = findSelectorLocation(testFile, selector, options.pageObjectPaths)
    const locationInfo = formatSelectorLocations(locations)

    // Step 1: Test the current XPath selector first
    log.info(`[${LOG_PREFIX}: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')${locationInfo}`)
    log.info(`[${LOG_PREFIX}: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    const originalStartTime = getHighResTime()
    const originalResult = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    log.info(`[${LOG_PREFIX}: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)

    // Step 2: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        browser: options.browser
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            log.warn(`[${LOG_PREFIX}: Warning] ${conversionResult.warning}`)
        }
        if (conversionResult?.suggestion) {
            log.info(`[${LOG_PREFIX}: Suggestion] Consider using: ${conversionResult.suggestion}`)
        }
        return originalResult
    }

    const optimizedSelector = conversionResult.selector

    // Step 3: Log the potential optimized selector
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    log.info(`[${LOG_PREFIX}: Step 3] Search for a better selector`)
    log.info(`[${LOG_PREFIX}: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)

    // Step 4: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        log.warn(`[${LOG_PREFIX}: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalResult
    }

    // Log detailed debugging steps for non-accessibility ID selectors
    const isAccessibilityId = parsed.using === 'accessibility id'
    if (!isAccessibilityId) {
        log.debug(`[${LOG_PREFIX}: Debug] Selector type: ${parsed.using}`)
        log.debug(`[${LOG_PREFIX}: Debug] Selector value: "${parsed.value}"`)
        log.debug(`[${LOG_PREFIX}: Debug] Starting verification process...`)
    }

    log.info(`[${LOG_PREFIX}: Step 4] Testing optimized selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, isMultiple, !isAccessibilityId)

    if (!testResult || testResult.elementRefs.length === 0) {
        log.warn(`[${LOG_PREFIX}: Warning] Optimized selector '${optimizedSelector}' did not find ${elementWord}, using original XPath`)
        return originalResult
    }

    const foundMessage = isMultiple
        ? `Optimized selector found ${testResult.elementRefs.length} element(s) in ${testResult.duration.toFixed(2)}ms`
        : `Optimized selector found element in ${testResult.duration.toFixed(2)}ms`
    log.info(`[${LOG_PREFIX}: Step 4] ${foundMessage}`)

    // Step 5: Compare and conclude
    const timeDifference = originalDuration - testResult.duration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0
    const testContext = {
        testFile: getCurrentTestFile() || 'unknown',
        suiteName: getCurrentSuiteName() || 'unknown',
        testName: getCurrentTestName() || 'unknown',
        lineNumber: locations.length > 0 ? locations[0].line : undefined,
        selectorFile: locations.length > 0 ? locations[0].file : undefined
    }
    const optimizedData = createOptimizedSelectorData(
        testContext,
        selector,
        originalDuration,
        optimizedSelector,
        testResult.duration
    )
    addPerformanceData(optimizedData)

    logOptimizationConclusion(timeDifference, improvementPercent, selector, optimizedSelector, locationInfo)

    // Step 6: Execute with optimized selector
    options.isReplacingSelector.value = true
    try {
        return await originalFunc.call(browser, optimizedSelector)
    } finally {
        options.isReplacingSelector.value = false
    }
}

/**
 * Main optimization flow for a single element selector
 */
export async function optimizeSingleSelector(
    commandName: string,
    selector: string,
    originalFunc: (selector: unknown) => Promise<WebdriverIO.Element>,
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    options: OptimizationOptions
): Promise<WebdriverIO.Element> {
    return optimizeSelector(commandName, selector, originalFunc, browser, options, false)
}

/**
 * Main optimization flow for multiple elements selector
 */
export async function optimizeMultipleSelectors(
    commandName: string,
    selector: string,
    originalFunc: (selector: unknown) => Promise<WebdriverIO.Element[]>,
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    options: OptimizationOptions
): Promise<WebdriverIO.Element[]> {
    return optimizeSelector(commandName, selector, originalFunc, browser, options, true)
}
