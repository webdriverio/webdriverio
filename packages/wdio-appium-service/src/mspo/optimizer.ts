import type { OptimizationOptions } from './types.js'
import {
    formatSelectorForDisplay,
    getHighResTime,
    buildTestContext,
    parseOptimizedSelector,
    testOptimizedSelector,
    findOptimizedSelector,
    logOptimizationConclusion,
    createOptimizedSelectorData,
    INDENT_LEVEL_1,
    INDENT_LEVEL_2,
    INDENT_LEVEL_5,
    INDENT_DEBUG
} from './utils.js'

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

    // Step 1: Log the selector we're researching (always log)
    console.log(`🔍 [Mobile Selector Performance: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)

    // Step 2: Test the current XPath selector first
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_2}[Mobile Selector Performance: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    }
    const originalStartTime = getHighResTime()
    const originalElement = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_2}[Mobile Selector Performance: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)
    }

    // Step 3: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        usePageSource: options.usePageSource,
        browser: options.browser,
        logPageSource: !isSilent
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            console.warn(`⚠️ [Mobile Selector Performance: Warning] ${conversionResult.warning}`)
        }
        return originalElement
    }

    const optimizedSelector = conversionResult.selector

    // Step 4: Log the potential optimized selector
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}💡 [Mobile Selector Performance: Step 3] Search for a better selector`)
    }
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    console.log(`${INDENT_LEVEL_1}✨ [Mobile Selector Performance: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)

    // Step 5: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        console.warn(`⚠️ [Mobile Selector Performance: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalElement
    }

    // Log detailed debugging steps for non-accessibility ID selectors (only if not silent)
    const isAccessibilityId = parsed.using === 'accessibility id'
    if (!isAccessibilityId && !isSilent) {
        console.log(`  🔬 [Mobile Selector Performance: Debug] Selector type: ${parsed.using}`)
        console.log(`  🔬 [Mobile Selector Performance: Debug] Selector value: "${parsed.value}"`)
        console.log('  🔬 [Mobile Selector Performance: Debug] Starting verification process...')
    }

    if (!isSilent) {
        console.log(`[Mobile Selector Performance: Step 4] Testing optimized selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, false, !isAccessibilityId && !isSilent)

    if (!testResult || testResult.elementRefs.length === 0) {
        const warningMsg = `❌ [Mobile Selector Performance: Warning] Optimized selector '${optimizedSelector}' did not find element, using original XPath`
        if (isSilent) {
            // In silent mode, show research selector and outcome first, then warning
            console.log(`🔍 [Mobile Selector Performance: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)
            console.log(`✨ [Mobile Selector Performance: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
            console.warn(warningMsg)
        } else {
            console.warn(warningMsg)
        }
        return originalElement
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_5}[Mobile Selector Performance: Step 4] Optimized selector found element in ${testResult.duration.toFixed(2)}ms`)
    }

    // Step 6: Compare and conclude
    const timeDifference = originalDuration - testResult.duration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0

    // Store optimized selector performance data
    const testContext = buildTestContext(options.currentTest, options.currentTestFile)
    const optimizedData = createOptimizedSelectorData(
        testContext,
        selector,
        originalDuration,
        optimizedSelector,
        testResult.duration
    )
    options.dataStore.push(optimizedData)

    logOptimizationConclusion(timeDifference, improvementPercent)

    // Create new element by calling original function with optimized selector
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

    // Step 1: Log the selector we're researching (always log)
    console.log(`🔍 [Mobile Selector Performance: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)

    // Step 2: Test the current XPath selector first
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_2}[Mobile Selector Performance: Step 1] Testing current selector: ${commandName}('${formatSelectorForDisplay(selector)}')`)
    }
    const originalStartTime = getHighResTime()
    const originalElements = await originalFunc.call(browser, selector)
    const originalDuration = getHighResTime() - originalStartTime
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_2}[Mobile Selector Performance: Step 1] ${commandName}('${formatSelectorForDisplay(selector)}') took ${originalDuration.toFixed(2)}ms`)
    }

    // Step 3: Find optimized selector
    const conversionResult = await findOptimizedSelector(selector, {
        usePageSource: options.usePageSource,
        browser: options.browser,
        logPageSource: !isSilent
    })

    if (!conversionResult || !conversionResult.selector) {
        if (conversionResult?.warning) {
            console.warn(`⚠️ [Mobile Selector Performance: Warning] ${conversionResult.warning}`)
        }
        return originalElements
    }

    const optimizedSelector = conversionResult.selector

    // Step 4: Log the potential optimized selector
    if (!isSilent) {
        console.log(`${INDENT_LEVEL_1}💡 [Mobile Selector Performance: Step 3] Search for a better selector`)
    }
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
    console.log(`${INDENT_LEVEL_1}✨ [Mobile Selector Performance: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)

    // Step 5: Test the optimized selector
    const parsed = parseOptimizedSelector(optimizedSelector)
    if (!parsed) {
        console.warn(`⚠️ [Mobile Selector Performance: Warning] Unknown optimized selector type: ${optimizedSelector}. Using original XPath`)
        return originalElements
    }

    // Log detailed debugging steps for non-accessibility ID selectors (only if not silent)
    const isAccessibilityId = parsed.using === 'accessibility id'
    if (!isAccessibilityId && !isSilent) {
        console.log(`${INDENT_DEBUG}🔬 [Mobile Selector Performance: Debug] Selector type: ${parsed.using}`)
        console.log(`${INDENT_DEBUG}🔬 [Mobile Selector Performance: Debug] Selector value: "${parsed.value}"`)
        console.log(`${INDENT_DEBUG}🔬 [Mobile Selector Performance: Debug] Starting verification process...`)
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_5}[Mobile Selector Performance: Step 4] Testing optimized selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
    }
    const testResult = await testOptimizedSelector(browser, parsed.using, parsed.value, true, !isAccessibilityId && !isSilent)

    if (!testResult || testResult.elementRefs.length === 0) {
        const warningMsg = `❌ [Mobile Selector Performance: Warning] Optimized selector '${optimizedSelector}' did not find elements, using original XPath`
        if (isSilent) {
            // In silent mode, show research selector and outcome first, then warning
            console.log(`🔍 [Mobile Selector Performance: Research Selector] ${commandName}('${formatSelectorForDisplay(selector)}')`)
            console.log(`✨ [Mobile Selector Performance: Outcome] Potential Optimized Selector: ${commandName}(${quoteStyle}${optimizedSelector}${quoteStyle})`)
            console.warn(warningMsg)
        } else {
            console.warn(warningMsg)
        }
        return originalElements
    }

    if (!isSilent) {
        console.log(`${INDENT_LEVEL_5}[Mobile Selector Performance: Step 4] Optimized selector found ${testResult.elementRefs.length} element(s) in ${testResult.duration.toFixed(2)}ms`)
    }

    // Step 6: Compare and conclude
    const timeDifference = originalDuration - testResult.duration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0

    // Store optimized selector performance data
    const testContext = buildTestContext(options.currentTest, options.currentTestFile)
    const optimizedData = createOptimizedSelectorData(
        testContext,
        selector,
        originalDuration,
        optimizedSelector,
        testResult.duration
    )
    options.dataStore.push(optimizedData)

    logOptimizationConclusion(timeDifference, improvementPercent)

    // Create new elements by calling original function with optimized selector
    options.isReplacingSelector.value = true
    try {
        const optimizedElements = await originalFunc.call(browser, optimizedSelector)
        return optimizedElements
    } finally {
        options.isReplacingSelector.value = false
    }
}

