import type { Frameworks } from '@wdio/types'
import type { XPathConversionResult } from './xpath-utils.js'
import { convertXPathToOptimizedSelector } from './xpath-utils.js'
import type { TestContext, CommandTiming, SelectorPerformanceData } from './types.js'

/**
 * Extracts the test file path from a test or suite object.
 * Follows the same pattern as wdio-spec-reporter for consistency.
 *
 * For suites: uses suite.file directly (works for Mocha, Jasmine, Cucumber)
 * For tests: uses test.file if available, otherwise gets from parent suite
 */
export function extractTestFile(test?: Frameworks.Test, suite?: Frameworks.Suite): string | undefined {
    // For suites: use file property directly (same as spec-reporter)
    if (suite) {
        const suiteWithFile = suite as Frameworks.Suite & { file?: string }
        if (suiteWithFile.file && typeof suiteWithFile.file === 'string') {
            return suiteWithFile.file
        }
    }

    if (test) {
        const testWithFile = test as Frameworks.Test & { file?: string }
        if (testWithFile.file && typeof testWithFile.file === 'string') {
            return testWithFile.file
        }

        if (test.parent && typeof test.parent === 'object') {
            const parentWithFile = test.parent as unknown as Frameworks.Suite & { file?: string }
            if (parentWithFile.file && typeof parentWithFile.file === 'string') {
                return parentWithFile.file
            }
        }
    }

    return undefined
}

/**
 * Extracts the suite name from a test object
 */
export function extractSuiteName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

    // For Mocha: test.parent.title
    // For Jasmine: test.fullName without test.title
    const parent = test.parent
    if (parent && typeof parent === 'object') {
        const parentSuite = parent as unknown as Frameworks.Suite
        if ('title' in parentSuite) {
            const parentTitle = parentSuite.title
            return (typeof parentTitle === 'string' ? parentTitle : 'unknown') || 'unknown'
        }
    }

    if (test.fullName) {
        const testTitle = test.title || ''
        return test.fullName.replace(new RegExp(' ' + testTitle + '$'), '').trim() || 'unknown'
    }

    return 'unknown'
}

/**
 * Extracts the test name from a test object
 */
export function extractTestName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

    return test.title || test.description || 'unknown'
}

/**
 * Extracts the line number from a stack trace for a given test file
 */
export function extractLineNumber(testFile?: string): number | undefined {
    if (!testFile) {
        return undefined
    }

    try {
        const stack = new Error().stack
        if (stack) {
            const lines = stack.split('\n')
            // Look for test file in stack
            for (const line of lines) {
                if (line.includes(testFile)) {
                    const match = line.match(/:(\d+):(\d+)/)
                    if (match) {
                        return parseInt(match[1], 10)
                    }
                }
            }
        }
    } catch {
        // Ignore errors
    }

    return undefined
}

/**
 * Extracts a selector string from command arguments
 */
export function extractSelectorFromArgs(args: unknown[]): string | null {
    if (!args || args.length === 0) {
        return null
    }

    // First argument is usually the selector
    const firstArg = args[0]

    if (typeof firstArg === 'string') {
        return firstArg
    }

    if (typeof firstArg === 'object' && firstArg !== null) {
        // For custom selectors or object-based selectors, stringify
        try {
            return JSON.stringify(firstArg)
        } catch {
            return String(firstArg)
        }
    }

    return String(firstArg)
}

/**
 * Formats a selector for display/logging purposes (truncates long selectors)
 */
export function formatSelectorForDisplay(selector: string | object, maxLength: number = 100): string {
    // Handle string selectors directly (most common case)
    if (typeof selector === 'string') {
        if (selector.length > maxLength) {
            return selector.substring(0, maxLength) + '...'
        }
        return selector
    }

    // Handle object selectors with simple string conversion
    return String(selector)
}

/**
 * Gets high-resolution time in milliseconds
 */
export function getHighResTime(): number {
    // Use high-resolution time if available (Node.js 16.5+)
    if (typeof process !== 'undefined' && process.hrtime) {
        const [seconds, nanoseconds] = process.hrtime()
        return seconds * 1000 + nanoseconds / 1000000
    }
    // Fallback to Date.now() for older Node.js versions
    return Date.now()
}

/**
 * Builds a complete test context object from a test object and test file
 */
export function buildTestContext(test?: Frameworks.Test, testFile?: string): TestContext {
    return {
        testFile: testFile || extractTestFile(test),
        suiteName: extractSuiteName(test),
        testName: extractTestName(test),
        lineNumber: extractLineNumber(testFile || extractTestFile(test))
    }
}

/**
 * Checks if a selector is an XPath selector
 */
export function isXPathSelector(selector: unknown): selector is string {
    if (typeof selector !== 'string') {
        return false
    }
    return selector.startsWith('/') ||
           selector.startsWith('(') ||
           selector.startsWith('../') ||
           selector.startsWith('./') ||
           selector.startsWith('*/')
}

/**
 * Parses an optimized selector string into WebDriver using/value format
 */
export function parseOptimizedSelector(optimizedSelector: string): { using: string, value: string } | null {
    if (optimizedSelector.startsWith('~')) {
        // Accessibility ID
        return {
            using: 'accessibility id',
            value: optimizedSelector.substring(1)
        }
    }
    if (optimizedSelector.startsWith('-ios predicate string:')) {
        // iOS Predicate String
        return {
            using: '-ios predicate string',
            value: optimizedSelector.substring('-ios predicate string:'.length)
        }
    }
    if (optimizedSelector.startsWith('-ios class chain:')) {
        // iOS Class Chain
        return {
            using: '-ios class chain',
            value: optimizedSelector.substring('-ios class chain:'.length)
        }
    }
    return null
}

/**
 * Tests an optimized selector and returns the element reference and duration
 */
export async function testOptimizedSelector(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    using: string,
    value: string,
    isMultiple: boolean
): Promise<{ elementRefs: Array<{ [key: string]: string }>, duration: number } | null> {
    try {
        const startTime = getHighResTime()
        const browserWithProtocol = browser as WebdriverIO.Browser & {
            findElement: (using: string, value: string) => Promise<{ [key: string]: string }>
            findElements: (using: string, value: string) => Promise<Array<{ [key: string]: string }>>
        }

        if (isMultiple) {
            const elementRefs = await browserWithProtocol.findElements(using, value)
            const duration = getHighResTime() - startTime
            return { elementRefs: Array.isArray(elementRefs) ? elementRefs : [], duration }
        }

        const elementRef = await browserWithProtocol.findElement(using, value)
        const duration = getHighResTime() - startTime
        return { elementRefs: elementRef ? [elementRef] : [], duration }
    } catch {
        return null
    }
}

/**
 * Finds an optimized selector for a given XPath
 */
export async function findOptimizedSelector(
    xpath: string,
    options: {
        usePageSource: boolean
        browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        logPageSource?: boolean
    }
): Promise<XPathConversionResult | null> {
    if (options.usePageSource && options.browser) {
        if (options.logPageSource !== false) {
            console.log('⏳ [Mobile Selector Performance: Step 2] Collecting page source for dynamic analysis...')
        }
        const pageSourceStartTime = getHighResTime()
        const result = await convertXPathToOptimizedSelector(xpath, {
            browser: options.browser,
            usePageSource: true
        })
        if (options.logPageSource !== false) {
            const pageSourceDuration = getHighResTime() - pageSourceStartTime
            console.log(`[Mobile Selector Performance: Step 2] Page source collected in ${pageSourceDuration.toFixed(2)}ms`)
        }
        return result
    }

    const staticResult = convertXPathToOptimizedSelector(xpath, {
        usePageSource: false
    })
    return staticResult instanceof Promise ? await staticResult : staticResult
}

/**
 * Logs the optimization conclusion
 */
export function logOptimizationConclusion(
    timeDifference: number,
    improvementPercent: number
): void {
    if (timeDifference > 0) {
        console.log(`🚀 [Mobile Selector Performance: Conclusion] Optimized selector is ${timeDifference.toFixed(2)}ms faster than XPath (${improvementPercent.toFixed(1)}% improvement)`)
    } else if (timeDifference < 0) {
        console.log(`⚠️ [Mobile Selector Performance: Conclusion] Optimized selector is ${Math.abs(timeDifference).toFixed(2)}ms slower than XPath`)
    } else {
        console.log('📊 [Mobile Selector Performance: Conclusion] Optimized selector has the same performance as XPath')
    }
}

/**
 * Creates optimized selector performance data object
 */
export function createOptimizedSelectorData(
    testContext: TestContext,
    originalSelector: string,
    originalDuration: number,
    optimizedSelector: string,
    optimizedDuration: number
): SelectorPerformanceData {
    const timeDifference = originalDuration - optimizedDuration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0

    return {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selector: originalSelector,
        selectorType: 'xpath',
        duration: originalDuration,
        timestamp: Date.now(),
        optimizedSelector: optimizedSelector,
        optimizedDuration: optimizedDuration,
        improvementMs: timeDifference,
        improvementPercent: improvementPercent
    }
}

/**
 * Finds the most recent user command that hasn't been matched with an internal command yet
 */
export function findMostRecentUnmatchedUserCommand(
    commandTimings: Map<string, CommandTiming>
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) => timing.isUserCommand && !timing.selectorType)
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}

/**
 * Finds the matching internal command timing entry for a given formatted selector and selector type
 */
export function findMatchingInternalCommandTiming(
    commandTimings: Map<string, CommandTiming>,
    formattedSelector: string,
    selectorType: string
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) =>
            !timing.isUserCommand &&
            timing.formattedSelector === formattedSelector &&
            timing.selectorType === selectorType
        )
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}

/**
 * Stores performance data for a selector operation
 */
export function storePerformanceData(
    dataStore: SelectorPerformanceData[],
    timing: CommandTiming,
    duration: number,
    testContext: TestContext
): void {
    const data: SelectorPerformanceData = {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selector: timing.selector,
        selectorType: timing.selectorType!,
        duration,
        timestamp: Date.now()
    }

    dataStore.push(data)
}

