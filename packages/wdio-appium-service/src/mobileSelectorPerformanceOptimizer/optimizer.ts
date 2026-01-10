import type { OptimizationOptions } from './types.js'
import {
    formatSelectorForDisplay,
    getHighResTime,
    parseOptimizedSelector,
    testOptimizedSelector,
    findOptimizedSelector,
    logOptimizationConclusion,
    createOptimizedSelectorData,
    INDENT_LEVEL_1,
    INDENT_LEVEL_2,
    LOG_PREFIX
} from './utils.js'
import { getCurrentTestFile, getCurrentSuiteName, getCurrentTestName, addPerformanceData } from './mspo-store.js'

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
    const isSilent = options.isSilentLogLevel === true
    const elementWord = isMultiple ? 'element(s)' : 'element'

    // Step 1: Test the current XPath selector first
    if (!isSilent) {
        console.log(`\n\n🔍 [${LOG_PREFIX}: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)
        console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    }
    const originalStartTime = getHighResTime()
    const originalResult = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)
    }

    // Step 2: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        usePageSource: options.usePageSource,
        browser: options.browser,
        logPageSource: !isSilent
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            console.warn(`⚠️ [${LOG_PREFIX}: Warning] ${conversionResult.warning}`)
        }
        return originalResult
    }

    const optimizedSelector = conversionResult.selector

    // Step 3: Log the potential optimized selector
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Step 3] Search for a better selector`)
        console.log(`${INDENT_LEVEL_1}✨ [${LOG_PREFIX}: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }

    // Step 4: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        console.warn(`⚠️ [${LOG_PREFIX}: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalResult
    }

    // Log detailed debugging steps for non-accessibility ID selectors (only if not silent)
    const isAccessibilityId = parsed.using === 'accessibility id'
    if (!isAccessibilityId && !isSilent) {
        console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Selector type: ${parsed.using}`)
        console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Selector value: "${parsed.value}"`)
        console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Starting verification process...`)
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 4] Testing optimized selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, isMultiple, !isAccessibilityId && !isSilent)

    if (!testResult || testResult.elementRefs.length === 0) {
        if (!isSilent) {
            console.warn(`❌ [${LOG_PREFIX}: Warning] Optimized selector '${optimizedSelector}' did not find ${elementWord}, using original XPath`)
        }
        return originalResult
    }

    if (!isSilent) {
        const foundMessage = isMultiple
            ? `Optimized selector found ${testResult.elementRefs.length} element(s) in ${testResult.duration.toFixed(2)}ms`
            : `Optimized selector found element in ${testResult.duration.toFixed(2)}ms`
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 4] ${foundMessage}`)
    }

    // Step 5: Compare and conclude
    const timeDifference = originalDuration - testResult.duration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0
    const testContext = {
        testFile: getCurrentTestFile() || 'unknown',
        suiteName: getCurrentSuiteName() || 'unknown',
        testName: getCurrentTestName() || 'unknown'
    }
    const optimizedData = createOptimizedSelectorData(
        testContext,
        selector,
        originalDuration,
        optimizedSelector,
        testResult.duration
    )
    addPerformanceData(optimizedData)

    if (!isSilent) {
        logOptimizationConclusion(timeDifference, improvementPercent, selector, optimizedSelector)
    }

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

