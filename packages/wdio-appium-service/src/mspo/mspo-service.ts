import fs from 'node:fs'
import path from 'node:path'
import type { Services, Frameworks, Capabilities, Options, Reporters } from '@wdio/types'
import type { AppiumServiceConfig } from '../types.js'
import type { SelectorPerformanceData, CommandTiming } from './types.js'
import {
    extractTestFile,
    extractTestName,
    extractSuiteName,
    extractSelectorFromArgs,
    formatSelectorForDisplay,
    getHighResTime,
    buildTestContext,
    findOptimizedSelector,
    findMostRecentUnmatchedUserCommand,
    findMatchingInternalCommandTiming,
    storePerformanceData,
    isNativeContext,
    isSilentLogLevel
} from './utils.js'
import {
    findTestContextForTimestamp,
    getCurrentContext,
    getCurrentSuiteName,
    getCurrentTestFile,
    getCurrentTestName
} from './mspo-store.js'
import MobileSelectorPerformanceReporter from './mspo-reporter.js'
import { overwriteUserCommands } from './overwrite.js'

export default class SelectorPerformanceService implements Services.ServiceInstance {
    private _enabled: boolean = false
    private _usePageSource: boolean = false
    private _replaceWithOptimized: boolean = false
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _isReplacingSelectorRef: { value: boolean } = { value: false }
    private _data: SelectorPerformanceData[] = []
    private _currentTest?: Frameworks.Test
    private _currentTestFile?: string
    private _currentTestStartTime?: number // Track when current test started to identify its entries
    private _currentSpecFile?: string // Track the spec file for the current test run
    private _currentSuiteName?: string // Track the current suite name (describe block)
    private _suiteStartTime?: number // Track when current suite started
    private _previousTestEndTime?: number // Track when previous test ended
    private _commandTimings: Map<string, CommandTiming> = new Map()
    private _userCommands = new Set([
        '$',
        '$$',
        'custom$',
        'custom$$'
    ])
    private _internalCommands = new Set([
        'findElement',
        'findElements'
    ])

    constructor(
        private _options: AppiumServiceConfig,
        private _capabilities: Capabilities.TestrunnerCapabilities,
        private _config?: Options.Testrunner
    ) {
        const trackConfig = _options.trackSelectorPerformance
        if (typeof trackConfig === 'object') {
            this._enabled = trackConfig.enabled === true
            this._usePageSource = trackConfig.usePageSource === true
            this._replaceWithOptimized = trackConfig.replaceWithOptimizedSelector === true
        } else {
            this._enabled = trackConfig === true
            this._usePageSource = false
            this._replaceWithOptimized = false
        }

        // Automatically register the test context reporter if MSPO is enabled
        if (this._enabled && this._config) {
            this._registerTestContextReporter()
        }
    }

    /**
     * Automatically register the MobileSelectorPerformanceReporter to collect suite/test information
     */
    private _registerTestContextReporter(): void {
        if (!this._config) {
            return
        }

        // Ensure reporters array exists
        if (!this._config.reporters) {
            this._config.reporters = []
        }

        // Check if MobileSelectorPerformanceReporter is already registered (by name)
        const isAlreadyRegistered = this._config.reporters.some((reporter) => {
            if (Array.isArray(reporter)) {
                const reporterClass = reporter[0]
                if (typeof reporterClass === 'function') {
                    return reporterClass.name === 'MobileSelectorPerformanceReporter'
                }
                return false
            }
            if (typeof reporter === 'function') {
                return reporter.name === 'MobileSelectorPerformanceReporter'
            }
            return false
        })

        // Add reporter if not already registered
        if (!isAlreadyRegistered) {
            // Type assertion needed because TypeScript doesn't know MobileSelectorPerformanceReporter is a ReporterClass
            this._config.reporters.push([MobileSelectorPerformanceReporter as unknown as Reporters.ReporterClass, {}])
        }
    }

    async before(
        _capabilities: never,
        _specs: never,
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser

        // Overwrite all user commands to replace XPath with optimized selectors if enabled
        if (this._enabled && this._replaceWithOptimized) {
            overwriteUserCommands(browser, {
                usePageSource: this._usePageSource,
                browser: this._browser,
                currentTest: this._currentTest,
                currentTestFile: this._currentTestFile,
                dataStore: this._data,
                isReplacingSelector: this._isReplacingSelectorRef,
                isSilentLogLevel: isSilentLogLevel(this._config)
            })
        }
    }

    async beforeTest(test: Frameworks.Test) {
        if (!this._enabled) {
            return
        }

        // Mark the start of a new test
        const testStartTime = Date.now()
        // Try to get from store first (from reporter), then fallback to extraction
        const storeTestFile = getCurrentTestFile()
        const storeSuiteName = getCurrentSuiteName()
        const storeTestName = getCurrentTestName()
        const testFile = storeTestFile || extractTestFile(test) || this._currentTestFile || this._currentSpecFile
        const testName = storeTestName || extractTestName(test)
        const suiteName = storeSuiteName || extractSuiteName(test) || this._currentSuiteName || 'unknown'

        // If we have a test name now, update entries that belong to this test
        // Update entries that:
        // 1. Don't have a test name (or have 'unknown')
        // 2. Belong to the current spec file
        // 3. Were created after the suite started (or after previous test ended) but before this test starts
        if (testName && testName !== 'unknown' && testFile) {
            const updateStartTime = this._previousTestEndTime || this._suiteStartTime || 0
            for (const entry of this._data) {
                // Only update entries that:
                // - Don't have a test name yet (or have 'unknown')
                // - Belong to the current spec file (or are 'unknown')
                // - Were created in the time window between suite/previous test and this test
                const belongsToCurrentFile = entry.testFile === testFile ||
                    (entry.testFile === 'unknown' && testFile)
                const inTimeWindow = entry.timestamp >= updateStartTime && entry.timestamp < testStartTime
                const needsUpdate = (entry.testName === 'unknown' || !entry.testName) && belongsToCurrentFile && inTimeWindow

                if (needsUpdate) {
                    entry.testName = testName
                    if (testFile && entry.testFile === 'unknown') {
                        entry.testFile = testFile
                    }
                    // Also update suite name if it's unknown
                    if (suiteName && suiteName !== 'unknown' && (entry.suiteName === 'unknown' || !entry.suiteName)) {
                        entry.suiteName = suiteName
                    }
                }
            }
        }

        // Update current suite name if we got it from the test
        if (suiteName && suiteName !== 'unknown') {
            this._currentSuiteName = suiteName
        }

        this._currentTest = test
        this._currentTestFile = testFile
        this._currentTestStartTime = testStartTime

        // Update spec file if we have it
        if (testFile) {
            this._currentSpecFile = testFile
        }
    }

    async beforeSuite(suite: Frameworks.Suite) {
        if (!this._enabled) {
            return
        }
        const suiteTestFile = extractTestFile(undefined, suite)
        if (suiteTestFile) {
            this._currentTestFile = suiteTestFile
            this._currentSpecFile = suiteTestFile
            this._suiteStartTime = Date.now()
            this._previousTestEndTime = undefined
        }

        // Extract suite name from suite object (same as spec reporter)
        if (suite && typeof suite === 'object' && 'title' in suite) {
            const suiteTitle = suite.title
            if (typeof suiteTitle === 'string' && suiteTitle) {
                this._currentSuiteName = suiteTitle
            }
        }
    }

    async beforeHook(test: Frameworks.Test, _context: unknown, _hookName: string) {
        if (!this._enabled) {
            return
        }

        // Update test context if we have it
        if (test) {
            const testFile = extractTestFile(test) || this._currentTestFile || this._currentSpecFile
            if (testFile && !this._currentTestFile) {
                this._currentTestFile = testFile
            }
            if (!this._currentTest) {
                this._currentTest = test
            }
        }
    }

    async afterTest(_test: Frameworks.Test) {
        if (!this._enabled) {
            return
        }

        // Mark when test ends so we know where the next test starts
        this._previousTestEndTime = Date.now()

        // Final update: use current context from reporter to update any remaining entries
        const currentContext = getCurrentContext()
        if (currentContext && currentContext.testFile && currentContext.testName && currentContext.suiteName) {
            const testFile = currentContext.testFile
            const testName = currentContext.testName
            const suiteName = currentContext.suiteName

            // Update ALL entries that belong to this test file and test name
            for (const entry of this._data) {
                const belongsToCurrentFile = entry.testFile === testFile ||
                    (entry.testFile === 'unknown' && testFile)
                const hasSameTestName = entry.testName === testName
                const hasUnknownTestName = entry.testName === 'unknown' || !entry.testName

                // Update if it belongs to this file and either has the same test name or unknown test name
                if (belongsToCurrentFile && (hasSameTestName || hasUnknownTestName)) {
                    // Update test name if unknown
                    if (hasUnknownTestName) {
                        entry.testName = testName
                    }
                    // Update test file if unknown
                    if (entry.testFile === 'unknown' && testFile) {
                        entry.testFile = testFile
                    }
                    // Always update suite name if it's unknown (prefer known over unknown)
                    if (entry.suiteName === 'unknown' || !entry.suiteName) {
                        entry.suiteName = suiteName
                    }
                }
            }
        }
    }

    async beforeCommand(commandName: string, args: unknown[]) {
        if (!this._enabled) {
            return
        }

        if (!isNativeContext(this._browser)) {
            return
        }

        if (this._userCommands.has(commandName)) {
            const selector = extractSelectorFromArgs(args)
            if (!selector || typeof selector !== 'string') {
                return
            }

            const formattedSelector = formatSelectorForDisplay(selector)
            const timingId = `${commandName}-${Date.now()}-${Math.random()}`

            this._commandTimings.set(timingId, {
                startTime: getHighResTime(),
                commandName,
                selector: selector,
                formattedSelector: formattedSelector,
                timingId,
                isUserCommand: true
            })
            return
        }

        if (this._internalCommands.has(commandName)) {
            if (!args || args.length < 2) {
                return
            }

            const using = args[0] as string
            const value = args[1] as string

            // Only track xpath selectors - this feature focuses on inefficient xpath usage
            if (using !== 'xpath' || !value || typeof value !== 'string') {
                return
            }

            // Find the most recent user command that would have triggered this findElement
            const formattedSelector = formatSelectorForDisplay(value)
            const matchingUserCommand = findMostRecentUnmatchedUserCommand(this._commandTimings)

            if (matchingUserCommand) {
                const [, userTiming] = matchingUserCommand
                userTiming.selectorType = using
                const timingId = `${commandName}-${Date.now()}-${Math.random()}`
                this._commandTimings.set(timingId, {
                    startTime: getHighResTime(),
                    commandName: userTiming.commandName, // Use the user's command name
                    selector: value,
                    formattedSelector: formattedSelector,
                    selectorType: using,
                    timingId,
                    isUserCommand: false
                })
            }
        }
    }

    async afterCommand(commandName: string, args: unknown[], _result: unknown, _error?: Error) {
        if (!this._enabled) {
            return
        }

        if (!isNativeContext(this._browser)) {
            return
        }

        // Handle internal commands (findElement, findElements) - they have the selector type info
        if (this._internalCommands.has(commandName)) {
            if (!args || args.length < 2) {
                return
            }

            const using = args[0] as string
            const value = args[1] as string

            // Only track xpath selectors
            if (using !== 'xpath' || !value || typeof value !== 'string') {
                return
            }

            const formattedSelector = formatSelectorForDisplay(value)
            const matchingTiming = findMatchingInternalCommandTiming(this._commandTimings, formattedSelector, using)

            if (!matchingTiming) {
                return
            }

            const [timingId, timing] = matchingTiming
            const duration = getHighResTime() - timing.startTime

            if (duration < 0 || !timing.selector || !timing.selectorType) {
                this._commandTimings.delete(timingId)
                return
            }

            // Always use current context from reporter first (most up-to-date)
            // This ensures we always have the latest suite/test information
            const currentContext = getCurrentContext()
            let testContext: ReturnType<typeof buildTestContext>

            if (currentContext && currentContext.testFile) {
                // Use current context from reporter (most accurate and up-to-date)
                testContext = {
                    testFile: currentContext.testFile,
                    suiteName: currentContext.suiteName || 'unknown',
                    testName: currentContext.testName || 'unknown'
                }
            } else {
                // Fallback: try to find context by timestamp, then extract from test object
                const storeContext = findTestContextForTimestamp(timing.startTime)
                testContext = storeContext ? {
                    testFile: storeContext.testFile || this._currentTestFile || 'unknown',
                    suiteName: storeContext.suiteName || 'unknown',
                    testName: storeContext.testName || 'unknown'
                } : buildTestContext(this._currentTest, this._currentTestFile)
            }

            // Always store performance data, even when replaceWithOptimizedSelector is enabled
            storePerformanceData(this._data, timing, duration, testContext)

            // When replaceWithOptimizedSelector is enabled, the overwrite commands handle all logging
            // Skip logging here to avoid duplicates, but still store the data
            if (!this._replaceWithOptimized) {
                console.log(`[Selector Performance] ${timing.commandName}('${formattedSelector}') took ${duration.toFixed(2)}ms`)

                // Find optimized selector using helper method (without page source logging for this flow)
                const conversionResult = await findOptimizedSelector(timing.selector, {
                    usePageSource: this._usePageSource,
                    browser: this._browser,
                    logPageSource: false
                })

                if (conversionResult) {
                    if (conversionResult.selector) {
                        const quoteStyle = conversionResult.selector.startsWith('-ios class chain:') ? "'" : '"'
                        console.log(`[Potential Optimized Selector] ${timing.commandName}(${quoteStyle}${conversionResult.selector}${quoteStyle})`)
                    }
                    if (conversionResult.warning) {
                        console.warn(`[Selector Performance Warning] ${conversionResult.warning}`)
                    }
                }
            }

            this._commandTimings.delete(timingId)
        }
    }

    async afterSession() {
        if (!this._enabled) {
            return
        }

        const workersDataDir = path.join(process.cwd(), 'logs', 'selector-performance')
        const workerDataPath = path.join(workersDataDir, `worker-data-${process.pid}.json`)

        try {
            fs.mkdirSync(workersDataDir, { recursive: true })
            fs.writeFileSync(workerDataPath, JSON.stringify(this._data, null, 2))
        } catch (err) {
            console.error('Failed to write worker selector performance data:', err)
        }
    }
}
