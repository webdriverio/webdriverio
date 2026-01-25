import crypto from 'node:crypto'
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
    isReporterRegistered,
    determineReportDirectory,
    findSelectorLocation,
    USER_COMMANDS
} from './utils/index.js'
import { getCurrentTestFile, getCurrentSuiteName, getCurrentTestName, getPerformanceData, setCurrentDeviceName } from './mspo-store.js'
import MobileSelectorPerformanceReporter from './mspo-reporter.js'
import { overwriteUserCommands } from './overwrite.js'

const log = logger('@wdio/appium-service:selector-optimizer')

export default class SelectorPerformanceService implements Services.ServiceInstance {
    // Service configuration
    private _enabled: boolean = false
    private _replaceWithOptimized: boolean = true
    private _enableCliReport: boolean = false
    private _enableMarkdownReport: boolean = false
    private _reportDirectory?: string
    private _pageObjectPaths?: string[]
    private _provideSelectorLocation: boolean = true
    // Some internal consts
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _isReplacingSelectorRef: { value: boolean } = { value: false }
    private _commandTimings: Map<string, CommandTiming> = new Map()
    // User commands to track
    private _userCommands = new Set<string>(USER_COMMANDS)
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
                    'Expected format: { enabled: boolean, replaceWithOptimizedSelector?: boolean, enableCliReport?: boolean, enableMarkdownReport?: boolean, reportPath?: string, maxLineLength?: number }'
                )
            }
            this._enabled = trackConfig.enabled === true
            this._replaceWithOptimized = trackConfig.replaceWithOptimizedSelector !== undefined ? trackConfig.replaceWithOptimizedSelector === true : true
            this._enableCliReport = trackConfig.enableCliReport === true
            this._enableMarkdownReport = trackConfig.enableMarkdownReport === true
            this._pageObjectPaths = trackConfig.pageObjectPaths

            if (trackConfig.provideSelectorLocation !== undefined) {
                this._provideSelectorLocation = trackConfig.provideSelectorLocation === true
                if (this._provideSelectorLocation && (!this._pageObjectPaths || this._pageObjectPaths.length === 0)) {
                    log.warn('provideSelectorLocation is enabled but pageObjectPaths is not configured. Selector location tracking will be disabled.')
                    this._provideSelectorLocation = false
                }
            } else {
                this._provideSelectorLocation = !!(this._pageObjectPaths && this._pageObjectPaths.length > 0)
            }

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
            log.info('Mobile Selector Performance Optimizer (BETA)')
            log.info('   → All feedback is welcome!')
            log.info('   → Currently optimized for iOS (shows the most significant performance and stability gains)')

            if (this._browser.isAndroid) {
                log.info('Mobile Selector Performance Optimizer is disabled for Android')
                log.info('   → Android support coming in a future release')
                this._enabled = false
                return
            }

            const deviceName = this._extractDeviceName(browser)
            if (deviceName) {
                setCurrentDeviceName(deviceName)
                log.debug(`Device name stored: ${deviceName}`)
            }

            log.info('Mobile Selector Performance Optimizer enabled for iOS')
        }

        // Overwrite all user commands to replace XPath with optimized selectors if enabled
        if (this._enabled && this._replaceWithOptimized) {
            overwriteUserCommands(browser, {
                browser: browser,
                isReplacingSelector: this._isReplacingSelectorRef,
                pageObjectPaths: this._pageObjectPaths,
                provideSelectorLocation: this._provideSelectorLocation
            })
        }
    }

    async beforeCommand(commandName: string, args: unknown[]) {
        if (!this._enabled) {
            return
        }

        if (!isNativeContext(this._browser)) {
            log.info('Mobile Selector Performance Optimizer is disabled for non-native context')
            return
        }

        if (this._userCommands.has(commandName)) {
            const selector = extractSelectorFromArgs(args)
            if (!selector || typeof selector !== 'string') {
                return
            }

            const formattedSelector = formatSelectorForDisplay(selector)
            const timingId = crypto.randomUUID()

            let lineNumber: number | undefined
            if (this._provideSelectorLocation) {
                const testFile = getCurrentTestFile()
                const locations = findSelectorLocation(testFile, selector, this._pageObjectPaths)
                lineNumber = locations.length > 0 ? locations[0].line : undefined
            }

            this._commandTimings.set(timingId, {
                startTime: getHighResTime(),
                commandName,
                selector: selector,
                formattedSelector: formattedSelector,
                timingId,
                isUserCommand: true,
                lineNumber
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
                const timingId = crypto.randomUUID()
                this._commandTimings.set(timingId, {
                    startTime: getHighResTime(),
                    commandName: userTiming.commandName,
                    selector: value,
                    formattedSelector: formattedSelector,
                    selectorType: using,
                    timingId,
                    isUserCommand: false,
                    lineNumber: userTiming.lineNumber
                })
            }
        }
    }

    async afterCommand(commandName: string, args: unknown[], _result: unknown, _error?: Error) {
        if (!this._enabled) {
            return
        }

        if (!isNativeContext(this._browser)) {
            log.info('Mobile Selector Performance Optimizer is disabled for non-native context')
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

            const testContext: { testFile: string; suiteName: string; testName: string; lineNumber?: number } = {
                testFile: getCurrentTestFile() || 'unknown',
                suiteName: getCurrentSuiteName() || 'unknown',
                testName: getCurrentTestName() || 'unknown',
                lineNumber: timing.lineNumber
            }

            storePerformanceData(timing, duration, testContext)

            if (!this._replaceWithOptimized) {
                let locationInfo = ''
                if (this._provideSelectorLocation) {
                    const locations = findSelectorLocation(testContext.testFile, timing.selector, this._pageObjectPaths)
                    if (locations.length > 0) {
                        const location = locations[0]
                        const fileDisplay = location.isPageObject
                            ? `${location.file} (page object)`
                            : location.file
                        locationInfo = ` at ${fileDisplay}:${location.line}`
                    }
                }

                log.info(`[Selector Performance] ${timing.commandName}('${formattedSelector}') took ${duration.toFixed(2)}ms${locationInfo}`)

                const conversionResult = await findOptimizedSelector(timing.selector, {
                    browser: this._browser!
                })

                if (conversionResult) {
                    if (conversionResult.selector) {
                        const quoteStyle = conversionResult.selector.startsWith('-ios class chain:') ? "'" : '"'
                        log.info(`[Potential Optimized Selector] ${timing.commandName}(${quoteStyle}${conversionResult.selector}${quoteStyle})${locationInfo}`)
                    }
                    if (conversionResult.warning) {
                        log.warn(`[Selector Performance Warning] ${conversionResult.warning}${locationInfo}`)
                    }
                }
            }

            this._commandTimings.delete(timingId)
        }
    }

    async afterSession() {
        // Always write worker data when enabled - JSON report is always generated
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

    /**
     * Extract device name from browser capabilities
     */
    private _extractDeviceName(browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser): string | undefined {
        if (!browser || !('capabilities' in browser)) {
            return undefined
        }

        const caps = browser.capabilities as Record<string, unknown>

        if (caps['appium:deviceName'] && typeof caps['appium:deviceName'] === 'string') {
            return caps['appium:deviceName']
        }

        return undefined
    }
}
