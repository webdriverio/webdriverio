import type { Frameworks } from '@wdio/types'
import type { TestContext } from '../types.js'

/**
 * Extracts the test file path from a test or suite object.
 * Follows the same pattern as wdio-spec-reporter for consistency.
 *
 * For suites: uses suite.file directly (works for Mocha, Jasmine, Cucumber)
 * For tests: uses test.file if available, otherwise gets from parent suite
 */
export function extractTestFile(test?: Frameworks.Test, suite?: Frameworks.Suite): string | undefined {
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
 * Extracts the suite name from a test object.
 */
export function extractSuiteName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

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
 * Extracts the test name from a test object.
 */
export function extractTestName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

    return test.title || test.description || 'unknown'
}

/**
 * Builds a complete test context object from a test object and test file.
 * Note: Line numbers are not included here as they require a specific selector to search for.
 */
export function buildTestContext(test?: Frameworks.Test, testFile?: string): TestContext {
    return {
        testFile: testFile || extractTestFile(test),
        suiteName: extractSuiteName(test),
        testName: extractTestName(test),
        lineNumber: undefined
    }
}
