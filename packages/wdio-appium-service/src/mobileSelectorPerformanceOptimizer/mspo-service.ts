import fs from 'node:fs'
import path from 'node:path'
import { SevereServiceError } from 'webdriverio'
import logger from '@wdio/logger'
import type { Services, Options, Reporters } from '@wdio/types'
import type { AppiumServiceConfig } from '../types.js'
import type { CommandTiming } from './types.js'
import {
    extractSelectorFromArgs,
    formatSelectorForDisplay,
    getHighResTime,
    findOptimizedSelector,
    findMostRecentUnmatchedUserCommand,
    findMatchingInternalCommandTiming,
    storePerformanceData,
    isNativeContext,
    isSilentLogLevel,
    isReporterRegistered,
    determineReportDirectory
} from './utils.js'
import { getCurrentTestFile, getCurrentSuiteName, getCurrentTestName, getPerformanceData } from './mspo-store.js'
import MobileSelectorPerformanceReporter from './mspo-reporter.js'
import { overwriteUserCommands } from './overwrite.js'

const log = logger('@wdio/appium-service')

export default class SelectorPerformanceService implements Services.ServiceInstance {
    // Service configuration
    private _enabled: boolean = false
    private _usePageSource: boolean = true
    private _replaceWithOptimized: boolean = true
    private _enableReporter: boolean = true
    private _reportDirectory?: string
    // Some internal consts
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _isReplacingSelectorRef: { value: boolean } = { value: false }
    private _commandTimings: Map<string, CommandTiming> = new Map()
    // User commands to track
    private _userCommands = new Set([
        '$',
        '$$',
        'custom$',
        'custom$$'
    ])
    // Internal commands to not track
    private _internalCommands = new Set([
        'findElement',
        'findElements'
    ])

    constructor(
        private _options: AppiumServiceConfig,
        private _config?: Options.Testrunner
    ) {
        const trackConfig = _options.trackSelectorPerformance

        if (trackConfig !== undefined && trackConfig !== null) {
            if (typeof trackConfig !== 'object' || Array.isArray(trackConfig)) {
                throw new SevereServiceError(
                    'trackSelectorPerformance must be an object. ' +
                    'Expected format: { enabled: boolean, usePageSource?: boolean, replaceWithOptimizedSelector?: boolean }'
                )
            }
            this._enabled = trackConfig.enabled === true
            this._usePageSource = trackConfig.usePageSource === true
            this._replaceWithOptimized = trackConfig.replaceWithOptimizedSelector === true
            this._enableReporter = trackConfig.enableReporter === true

            if (this._enabled) {
                this._reportDirectory = determineReportDirectory(
                    trackConfig.reportPath,
                    this._config,
                    this._options
                )
            }
        }

    }

    async beforeSession(
        config: Options.Testrunner,
        _capabilities: never,
        _specs: never
    ) {
        if (this._enabled && config) {
            if (!config.reporters) {
                config.reporters = []
            }

            const isAlreadyRegistered = isReporterRegistered(config.reporters, 'MobileSelectorPerformanceReporter')

            if (!isAlreadyRegistered) {
                const reporterOptions = {
                    reportDirectory: this._reportDirectory
                }
                const reporterEntry: Reporters.ReporterEntry = [MobileSelectorPerformanceReporter as unknown as Reporters.ReporterClass, reporterOptions]
                config.reporters.push(reporterEntry)
            }
        }
    }

    async before(
        _capabilities: never,
        _specs: never,
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser

        if (this._enabled) {
            log.info('🧪 Mobile Selector Performance Optimizer (BETA)')
            log.info('   → All feedback is welcome!')
            log.info('   → Currently optimized for iOS (shows the most significant performance and stability gains)')

            if (this._browser.isAndroid) {
                log.info('⚠️  Mobile Selector Performance Optimizer is disabled for Android')
                log.info('   → Android support coming in a future release')
                this._enabled = false
                return
            }

            log.info('✅ Mobile Selector Performance Optimizer enabled for iOS')
        }

        // Overwrite all user commands to replace XPath with optimized selectors if enabled
        if (this._enabled && this._replaceWithOptimized) {
            overwriteUserCommands(browser, {
                usePageSource: this._usePageSource,
                browser: this._browser,
                isReplacingSelector: this._isReplacingSelectorRef,
                isSilentLogLevel: isSilentLogLevel(this._config)
            })
        }
    }

    async beforeCommand(commandName: string, args: unknown[]) {
        if (!this._enabled) {
            return
        }

        if (!isNativeContext(this._browser)) {
            log.info('⚠️  Mobile Selector Performance Optimizer is disabled for non-native context')
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
            log.info('⚠️  Mobile Selector Performance Optimizer is disabled for non-native context')
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

            const testContext: { testFile: string; suiteName: string; testName: string } = {
                testFile: getCurrentTestFile() || 'unknown',
                suiteName: getCurrentSuiteName() || 'unknown',
                testName: getCurrentTestName() || 'unknown'
            }

            storePerformanceData(timing, duration, testContext)

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

        if (!this._reportDirectory) {
            log.warn('Report directory not set, cannot write worker selector performance data')
            return
        }

        const workersDataDir = path.join(this._reportDirectory, 'selector-performance-worker-data')
        const workerDataPath = path.join(workersDataDir, `worker-data-${process.pid}.json`)

        try {
            const performanceData = getPerformanceData()
            fs.mkdirSync(workersDataDir, { recursive: true })
            fs.writeFileSync(workerDataPath, JSON.stringify(performanceData, null, 2))
            log.debug(`Worker selector performance data written to: ${workerDataPath} (${performanceData.length} entries)`)
        } catch (err) {
            log.error('Failed to write worker selector performance data:', err)
        }
    }
}
