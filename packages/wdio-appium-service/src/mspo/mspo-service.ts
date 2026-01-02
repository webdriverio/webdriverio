import fs from 'node:fs'
import path from 'node:path'
import type { Services, Frameworks, Capabilities, Options } from '@wdio/types'
import type { AppiumServiceConfig } from '../types.js'
import type { SelectorPerformanceData, CommandTiming } from './types.js'
import {
    extractTestFile,
    extractSelectorFromArgs,
    formatSelectorForDisplay,
    getHighResTime,
    buildTestContext,
    findOptimizedSelector,
    findMostRecentUnmatchedUserCommand,
    findMatchingInternalCommandTiming,
    storePerformanceData,
    isNativeContext,
    isElementFindCommand
} from './utils.js'
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
                isReplacingSelector: this._isReplacingSelectorRef
            })
        }
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

            const testContext = buildTestContext(this._currentTest, this._currentTestFile)
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

        // Track element actions (any command that is NOT an element find command)
        // Element find commands ($, $$, etc.) return elements, they don't act on them
        if (!isElementFindCommand(commandName)) {
            // Try to get selector from element ID in args (first arg is usually element ID)
            let elementSelector: string | undefined
            if (args && args.length > 0) {
                // For element commands, the first arg is usually the element ID
                // We can try to find the element in our tracked elements
                const elementId = args[0] as string
                // Look for this element in recent command timings
                for (const [, timing] of this._commandTimings) {
                    if (timing.selector && elementId.includes(timing.selector.substring(0, 10))) {
                        elementSelector = timing.selector
                        break
                    }
                }
            }

            // Also try to get selector from result if it's an element
            if (!elementSelector && _result && typeof _result === 'object') {
                const element = _result as WebdriverIO.Element & { selector?: string }
                elementSelector = element.selector
            }

            if (elementSelector) {
                const formattedSelector = formatSelectorForDisplay(elementSelector)
                console.log(`🎯 [Mobile Selector Performance: Element Action] ${commandName}() on element: ${formattedSelector}`)
            } else {
                console.log(`🎯 [Mobile Selector Performance: Element Action] ${commandName}()`)
            }
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
