/**
 * Lightweight reporter to collect test context information (suite name, test name, test file)
 * and store it in a shared store that the MSPO service can access.
 *
 * This reporter uses the same logic as spec-reporter to handle Mocha, Jasmine, and Cucumber frameworks.
 * It only collects context data and doesn't output anything.
 */

import WDIOReporter, { type SuiteStats, type TestStats } from '@wdio/reporter'
import {
    storeTestContext,
    setCurrentSuiteName,
    setCurrentTestFile,
    setCurrentTestName,
    getCurrentContext
} from './mspo-store.js'

export default class MobileSelectorPerformanceReporter extends WDIOReporter {
    constructor(options: Record<string, unknown>) {
        // Don't write to stdout, we're just collecting data
        super({ ...options, stdout: false })
    }

    /**
     * Extract test file path from suite, matching spec-reporter logic
     * Spec reporter: suite.file?.replace(process.cwd(), '')
     * Then slices leading '/' when displaying: .slice(1)
     */
    private extractTestFile(suite: SuiteStats): string | undefined {
        if (!suite.file) {
            return undefined
        }
        const testFile = suite.file.replace(process.cwd(), '')

        return testFile.startsWith('/') ? testFile.slice(1) : testFile
    }

    /**
     * Extract suite name from suite title, matching spec-reporter logic
     * Spec reporter uses suite.title directly for all frameworks (Mocha, Jasmine, Cucumber)
     * For nested suites, each suite has its own title
     */
    private extractSuiteName(suite: SuiteStats): string | undefined {
        return suite.title || undefined
    }

    /**
     * Extract test name from test title, matching spec-reporter logic
     * Spec reporter uses test.title directly for all frameworks
     */
    private extractTestName(test: TestStats): string | undefined {
        return test.title || undefined
    }

    onSuiteStart(suite: SuiteStats): void {
        const suiteName = this.extractSuiteName(suite)
        if (suiteName) {
            setCurrentSuiteName(suiteName)
        }

        const testFile = this.extractTestFile(suite)
        if (testFile) {
            setCurrentTestFile(testFile)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }

    onTestStart(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }

    onTestPass(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }

    onTestFail(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }

    onTestSkip(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }

    onTestPending(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const context = getCurrentContext()
        if (context) {
            storeTestContext(context)
        }
    }
}

