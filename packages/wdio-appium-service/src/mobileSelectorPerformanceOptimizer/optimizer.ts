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
 * Main optimization flow for a single element selector
 */
export async function optimizeSingleSelector(
    commandName: string,
    selector: string,
    originalFunc: (selector: unknown) => Promise<WebdriverIO.Element>,
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    options: OptimizationOptions
): Promise<WebdriverIO.Element> {
    const isSilent = options.isSilentLogLevel === true

    // Step 1: Test the current XPath selector first
    if (!isSilent) {
        console.log(`\n\n🔍 [${LOG_PREFIX}: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)
        console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    }
    const originalStartTime = getHighResTime()
    const originalElement = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)
    }

    // Step 3: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        usePageSource: options.usePageSource,
        browser: options.browser,
        logPageSource: !isSilent
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            console.warn(`⚠️ [${LOG_PREFIX}: Warning] ${conversionResult.warning}`)
        }
        return originalElement
    }

    const optimizedSelector = conversionResult.selector

    // Step 4: Log the potential optimized selector
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Step 3] Search for a better selector`)
        console.log(`${INDENT_LEVEL_1}✨ [${LOG_PREFIX}: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }

    // Step 5: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        console.warn(`⚠️ [${LOG_PREFIX}: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalElement
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
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, false, !isAccessibilityId && !isSilent)

    if (!testResult || testResult.elementRefs.length === 0) {
        if (!isSilent) {
            console.warn(`❌ [${LOG_PREFIX}: Warning] Optimized selector '${optimizedSelector}' did not find element, using original XPath`)
        }
        return originalElement
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 4] Optimized selector found element in ${testResult.duration.toFixed(2)}ms`)
    }

    // Step 6: Compare and conclude
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

    options.isReplacingSelector.value = true
    try {
        const optimizedElement = await originalFunc.call(browser, optimizedSelector)
        return optimizedElement
    } finally {
        options.isReplacingSelector.value = false
    }
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
    const isSilent = options.isSilentLogLevel === true

    // Step 1: Test the current XPath selector first
    if (!isSilent) {
        console.log(`\n\n🔍 [${LOG_PREFIX}: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)
        console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    }
    const originalStartTime = getHighResTime()
    const originalElements = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)
    }

    // Step 3: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        usePageSource: options.usePageSource,
        browser: options.browser,
        logPageSource: !isSilent
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            console.warn(`⚠️ [${LOG_PREFIX}: Warning] ${conversionResult.warning}`)
        }
        return originalElements
    }

    const optimizedSelector = conversionResult.selector

    // Step 4: Log the potential optimized selector
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Step 3] Search for a better selector`)
        console.log(`${INDENT_LEVEL_1}✨ [${LOG_PREFIX}: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }

    // Step 5: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        console.warn(`⚠️ [${LOG_PREFIX}: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalElements
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
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, true, !isAccessibilityId && !isSilent)

    if (!testResult || testResult.elementRefs.length === 0) {
        if (!isSilent) {
            console.warn(`❌ [${LOG_PREFIX}: Warning] Optimized selector '${optimizedSelector}' did not find elements, using original XPath`)
        }
        return originalElements
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 4] Optimized selector found ${testResult.elementRefs.length} element(s) in ${testResult.duration.toFixed(2)}ms`)
    }

    // Step 6: Compare and conclude
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

    options.isReplacingSelector.value = true
    try {
        const optimizedElements = await originalFunc.call(browser, optimizedSelector)
        return optimizedElements
    } finally {
        options.isReplacingSelector.value = false
    }
}

