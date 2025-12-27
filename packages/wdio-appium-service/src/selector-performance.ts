import fs from 'node:fs'
import path from 'node:path'
import type { Services, Frameworks, Capabilities, Options } from '@wdio/types'
import type { AppiumServiceConfig } from './types.js'
import {
    extractTestFile,
    extractSelectorFromArgs,
    formatSelectorForDisplay,
    getHighResTime,
    buildTestContext,
    type TestContext
} from './selector-performance-utils.js'
import { convertXPathToOptimizedSelector } from './xpath-utils.js'

interface SelectorPerformanceData {
    testFile: string
    suiteName: string
    testName: string
    lineNumber?: number
    selector: string
    selectorType: string
    duration: number
    timestamp: number
}

interface CommandTiming {
    startTime: number
    commandName: string
    selector: string
    formattedSelector: string
    selectorType?: string
    timingId: string
    isUserCommand: boolean
}

export default class SelectorPerformanceService implements Services.ServiceInstance {
    private _enabled: boolean = false
    private _data: SelectorPerformanceData[] = []
    private _currentTest?: Frameworks.Test
    private _currentTestFile?: string
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
        this._enabled = _options.trackSelectorPerformance === true
    }

    async beforeTest(test: Frameworks.Test) {
        if (!this._enabled) {
            return
        }
        this._currentTest = test
        this._currentTestFile = extractTestFile(test) || this._currentTestFile
    }

    async beforeSuite(suite: Frameworks.Suite) {
        if (!this._enabled) {
            return
        }
        if (!this._currentTestFile) {
            this._currentTestFile = extractTestFile(undefined, suite)
        }
    }

    async beforeHook(test: Frameworks.Test, _context: unknown, _hookName: string) {
        if (!this._enabled) {
            return
        }

        if (!this._currentTest) {
            this._currentTest = test
        }

        if (!this._currentTestFile) {
            this._currentTestFile = extractTestFile(test)
        }
    }

    async beforeCommand(commandName: string, args: unknown[]) {
        if (!this._enabled) {
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
            const matchingUserCommand = this._findMostRecentUnmatchedUserCommand()

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
            const matchingTiming = this._findMatchingInternalCommandTiming(formattedSelector, using)

            if (!matchingTiming) {
                return
            }

            const [timingId, timing] = matchingTiming
            const duration = getHighResTime() - timing.startTime

            if (duration < 0 || !timing.selector || !timing.selectorType) {
                this._commandTimings.delete(timingId)
                return
            }

            const testContext = buildTestContext(this._currentTest, this._currentTestFile)
            this._storePerformanceData(timing, duration, testContext)

            console.log(`[Selector Performance] ${timing.commandName}('${formattedSelector}') took ${duration.toFixed(2)}ms`)

            const conversionResult = convertXPathToOptimizedSelector(timing.selector)
            if (conversionResult) {
                if (conversionResult.selector) {
                    // Use appropriate quote style based on selector type:
                    // - Class chain uses backticks with double quotes inside, so use single quotes for outer string
                    // - Predicate string uses single quotes inside, so use double quotes for outer string
                    // - Accessibility ID has no quotes, so either works (use double for consistency)
                    const quoteStyle = conversionResult.selector.startsWith('-ios class chain:') ? "'" : '"'
                    console.log(`[Potential Optimized Selector] ${timing.commandName}(${quoteStyle}${conversionResult.selector}${quoteStyle})`)
                }
                if (conversionResult.warning) {
                    console.warn(`[Selector Performance Warning] ${conversionResult.warning}`)
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
            // Ensure directory exists
            fs.mkdirSync(workersDataDir, { recursive: true })
            // Write worker data
            fs.writeFileSync(workerDataPath, JSON.stringify(this._data, null, 2))
        } catch (err) {
            console.error('Failed to write worker selector performance data:', err)
        }
    }

    /**
     * Finds the most recent user command that hasn't been matched with an internal command yet
     */
    private _findMostRecentUnmatchedUserCommand(): [string, CommandTiming] | undefined {
        return Array.from(this._commandTimings.entries())
            .filter(([_id, timing]) => timing.isUserCommand && !timing.selectorType)
            .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
    }

    /**
     * Finds the matching internal command timing entry for a given formatted selector and selector type
     */
    private _findMatchingInternalCommandTiming(formattedSelector: string, selectorType: string): [string, CommandTiming] | undefined {
        return Array.from(this._commandTimings.entries())
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
    private _storePerformanceData(timing: CommandTiming, duration: number, testContext: TestContext): void {
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

        this._data.push(data)
    }
}

