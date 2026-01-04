import WDIOReporter, { type SuiteStats, type TestStats } from '@wdio/reporter'
import {
    storeTestContext,
    setCurrentSuiteName,
    setCurrentTestFile,
    setCurrentTestName,
    getCurrentTestFile,
    getCurrentSuiteName,
    getCurrentTestName
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

        // Store context after updating the store
        const currentTestFile = getCurrentTestFile()
        if (currentTestFile) {
            storeTestContext({
                testFile: currentTestFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }

    onTestStart(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const testFile = getCurrentTestFile()
        if (testFile) {
            storeTestContext({
                testFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }

    onTestPass(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const testFile = getCurrentTestFile()
        if (testFile) {
            storeTestContext({
                testFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }

    onTestFail(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const testFile = getCurrentTestFile()
        if (testFile) {
            storeTestContext({
                testFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }

    onTestSkip(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const testFile = getCurrentTestFile()
        if (testFile) {
            storeTestContext({
                testFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }

    onTestPending(test: TestStats): void {
        const testName = this.extractTestName(test)
        if (testName) {
            setCurrentTestName(testName)
        }

        const testFile = getCurrentTestFile()
        if (testFile) {
            storeTestContext({
                testFile,
                suiteName: getCurrentSuiteName(),
                testName: getCurrentTestName(),
                timestamp: Date.now()
            })
        }
    }
}

