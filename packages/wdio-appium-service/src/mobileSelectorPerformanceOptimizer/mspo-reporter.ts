import WDIOReporter, { type SuiteStats, type TestStats } from '@wdio/reporter'
import {
    setCurrentSuiteName,
    setCurrentTestFile,
    setCurrentTestName
} from './mspo-store.js'

interface MobileSelectorPerformanceReporterOptions extends Record<string, unknown> {
    reportDirectory?: string
}

export default class MobileSelectorPerformanceReporter extends WDIOReporter {
    private _reportDirectory?: string

    constructor(options: MobileSelectorPerformanceReporterOptions) {
        super({ ...options, stdout: true })
        this._reportDirectory = options.reportDirectory
    }

    /**
     * Get the current suite from the reporter's suite tracking
     * Returns the most nested suite (skips root suite)
     * Matches spec-reporter approach: uses currentSuites array
     * WDIOReporter base class manages currentSuites - last item is most nested
     */
    private getCurrentSuite(): SuiteStats | undefined {
        if (!this.currentSuites || this.currentSuites.length === 0) {
            return undefined
        }

        // Get the most nested suite (last in array)
        // Root suite is at index 0 with title '(root)', actual suites start at index 1
        // We want the most nested suite, so start from the end
        for (let i = this.currentSuites.length - 1; i >= 0; i--) {
            const suite = this.currentSuites[i]
            // Skip root suite - it has title '(root)'
            if (suite.title && suite.title !== '(root)' && suite.title !== '{root}') {
                return suite
            }
        }

        return undefined
    }

    /**
     * Update context from current suite (helper to avoid duplication)
     */
    private updateContextFromCurrentSuite(): void {
        const currentSuite = this.getCurrentSuite()
        if (currentSuite) {
            const suiteName = this.extractSuiteName(currentSuite)
            if (suiteName) {
                setCurrentSuiteName(suiteName)
            }

            const testFile = this.extractTestFile(currentSuite)
            if (testFile) {
                setCurrentTestFile(testFile)
            }
        }
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
     * Only skip root suite which has "(root)" title
     */
    private extractSuiteName(suite: SuiteStats): string | undefined {
        // Skip root suite - it has title '(root)'
        if (suite.title === '(root)' || suite.title === '{root}') {
            return undefined
        }
        // Use title directly like spec-reporter does
        return suite.title
    }

    /**
     * Extract test name from test title, matching spec-reporter logic
     * Spec reporter uses test.title directly for all frameworks
     */
    private extractTestName(test: TestStats): string | undefined {
        return test.title || undefined
    }

    onSuiteStart(suite: SuiteStats): void {
        const testFile = this.extractTestFile(suite)
        if (testFile) {
            setCurrentTestFile(testFile)
        }

        if (suite.title && suite.title !== '(root)' && suite.title !== '{root}') {
            setCurrentSuiteName(suite.title)
        }
    }

    onTestStart(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        this.updateContextFromCurrentSuite()
    }

    onTestPass(_test: TestStats): void {
        // Test context already set in onTestStart
    }

    onTestFail(_test: TestStats): void {
        // Test context already set in onTestStart
    }

    onTestSkip(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }
    }

    onTestPending(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }
    }

    onHookStart(): void {
        this.updateContextFromCurrentSuite()
    }

    onHookEnd(): void {
        this.updateContextFromCurrentSuite()
    }
}

