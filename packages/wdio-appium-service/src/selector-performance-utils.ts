import type { Frameworks } from '@wdio/types'

/**
 * Utility functions for selector performance tracking
 */

export interface TestContext {
    testFile?: string
    suiteName: string
    testName: string
    lineNumber?: number
}

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

