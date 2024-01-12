import { format } from 'node:util'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import type { SuiteStats, HookStats, RunnerStats, Argument } from '@wdio/reporter'
import WDIOReporter, { TestStats } from '@wdio/reporter'
import type { Capabilities } from '@wdio/types'

import { buildTableData, printTable, getFormattedRows, sauceAuthenticationToken } from './utils.js'
import type { StateCount, Symbols, SpecReporterOptions, TestLink } from './types.js'

const DEFAULT_INDENT = '   '

interface CapabilitiesWithSessionId extends WebdriverIO.Capabilities {
    sessionId: string
}

export default class SpecReporter extends WDIOReporter {
    private _suiteUids = new Set()
    private _indents = 0
    private _suiteIndents: Record<string, number> = {}
    private _orderedSuites: SuiteStats[] = []
    private _consoleOutput = ''
    private _suiteIndent = ''
    private _preface = ''
    private _consoleLogs: string[] = []
    private _pendingReasons: string[] = []
    private _originalStdoutWrite = process.stdout.write.bind(process.stdout)

    private _addConsoleLogs = false
    private _realtimeReporting = false
    private _showPreface = true
    private _suiteName = ''
    // Keep track of the order that suites were called
    private _stateCounts: StateCount = {
        passed: 0,
        failed: 0,
        skipped: 0
    }

    private _symbols: Symbols = {
        passed: '✓',
        skipped: '-',
        pending: '?',
        failed: '✖'
    }

    private _onlyFailures = false
    private _sauceLabsSharableLinks = true

    constructor (options: SpecReporterOptions) {
        /**
         * make spec reporter to write to output stream by default
         */
        super(Object.assign({ stdout: true }, options))

        this._symbols = { ...this._symbols, ...this.options.symbols || {} }
        this._onlyFailures = options.onlyFailures || false
        this._realtimeReporting = options.realtimeReporting || false
        this._showPreface = options.showPreface !== false
        this._sauceLabsSharableLinks = 'sauceLabsSharableLinks' in options
            ? options.sauceLabsSharableLinks as boolean
            : this._sauceLabsSharableLinks
        const processObj:any = process
        if (options.addConsoleLogs || this._addConsoleLogs) {
            processObj.stdout.write = (chunk: string, encoding: BufferEncoding, callback:  ((err?: Error) => void)) => {
                if (typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
                    this._consoleOutput += chunk
                }
                return this._originalStdoutWrite(chunk, encoding, callback)
            }
        }

    }

    onRunnerStart (runner: RunnerStats) {
        this._preface = this._showPreface ? `[${this.getEnviromentCombo(runner.capabilities, false, runner.isMultiremote).trim()} #${runner.cid}]` : ''
    }

    onSuiteStart (suite: SuiteStats) {
        this._suiteName = suite.file?.replace(process.cwd(), '')
        this.printCurrentStats(suite)
        this._suiteUids.add(suite.uid)
        if (suite.type === 'feature') {
            this._indents = 0
            this._suiteIndents[suite.uid] = this._indents
        } else {
            this._suiteIndents[suite.uid] = ++this._indents
        }
    }

    onSuiteEnd () {
        this._indents--
    }

    onHookEnd (hook: HookStats) {
        this.printCurrentStats(hook)
        if (hook.error) {
            this._stateCounts.failed++
        }
    }

    onTestStart () {
        this._consoleOutput = ''
    }

    onTestPass (testStat: TestStats) {
        this.printCurrentStats(testStat)
        this._consoleLogs.push(this._consoleOutput)
        this._stateCounts.passed++
    }

    onTestFail (testStat: TestStats) {
        this.printCurrentStats(testStat)
        this._consoleLogs.push(this._consoleOutput)
        this._stateCounts.failed++
    }

    onTestSkip (testStat: TestStats) {
        this.printCurrentStats(testStat)
        this._pendingReasons.push(testStat.pendingReason as string)
        this._consoleLogs.push(this._consoleOutput)
        this._stateCounts.skipped++
    }

    onRunnerEnd (runner: RunnerStats) {
        this.printReport(runner)
    }

    /**
     * Print the report to the stdout realtime
     */
    printCurrentStats (stat: TestStats | HookStats | SuiteStats) {
        if (!this._realtimeReporting) {
            return
        }

        const title = stat.title, state = (stat as TestStats).state
        const divider = '------------------------------------------------------------------'

        const indent = (stat.type==='test') ?
            `${DEFAULT_INDENT}${this._suiteIndent}` :
            this.indent(stat.uid)

        const suiteStartBanner = (stat.type === 'feature' || stat.type === 'suite' || stat.type === 'suite:start') ?
            `${this._preface} ${divider}\n`+
            `${this._preface} Suite started: \n`+
            `${this._preface}   » ${this._suiteName}\n` : '\n'

        const content = stat.type === 'test'
            ? `${this._preface} ${indent}` +
              `${chalk[this.getColor(state)](this.getSymbol(state))} ${title}` +
              ` » ${chalk[this.getColor(state)]('[')} ${this._suiteName} ${chalk[this.getColor(state)](']')}`
            : stat.type !== 'hook' ?
                `${suiteStartBanner}${this._preface} ${title}` :
                title
                    ? `${this._preface} Hook executed: ${title}`
                    : undefined

        if (process.send && content) {
            process.send({ name: 'reporterRealTime', content })
        }
    }

    /**
     * Print the report to the screen
     */
    printReport(runner: RunnerStats) {
        // Don't print non failed tests
        if (runner.failures === 0 && this._onlyFailures === true) {
            return
        }

        const duration = `(${prettyMs(runner._duration)})`
        const preface = `[${this.getEnviromentCombo(runner.capabilities, false, runner.isMultiremote).trim()} #${runner.cid}]`
        const divider = '------------------------------------------------------------------'

        // Get the results
        const results = this.getResultDisplay(preface)

        // If there are no test results then return nothing
        if (results.length === 0) {
            return
        }

        const testLinks = runner.isMultiremote
            ? Object.entries(runner.capabilities).map(([instanceName, capabilities]: [string, CapabilitiesWithSessionId]) => this.getTestLink({
                capabilities,
                sessionId: capabilities.sessionId,
                isMultiremote: runner.isMultiremote,
                instanceName
            })).filter((links) => links.length)
            : this.getTestLink(runner)
        const output = [
            ...this.getHeaderDisplay(runner),
            '',
            ...results,
            ...this.getCountDisplay(duration),
            ...this.getFailureDisplay(),
            ...(testLinks.length
                /**
                 * if we have test links add an empty line
                 */
                ? ['', ...testLinks]
                : []
            )
        ]

        // Prefix all values with the browser information
        const prefacedOutput = this._showPreface ? output.map((value) => {
            return value ? `${preface} ${value}` : preface
        }) : output

        // Output the results
        this.write(`${divider}\n${prefacedOutput.join('\n')}\n`)
    }

    /**
     * get link to saucelabs job
     */
    getTestLink ({ sessionId, isMultiremote, instanceName, capabilities }: TestLink) {
        const config = this.runnerStat && this.runnerStat.instanceOptions[sessionId]

        const isSauceJob = (
            (config && config.hostname && config.hostname.includes('saucelabs')) ||
            // only show if multiremote is not used
            capabilities && (
                // check w3c cap in jsonwp caps
                (capabilities as Capabilities.DesiredCapabilities)['sauce:options'] ||
                // check jsonwp caps
                (capabilities as Capabilities.DesiredCapabilities).tunnelIdentifier ||
                // check w3c caps
                (
                    (capabilities as Capabilities.W3CCapabilities).alwaysMatch &&
                    (capabilities as Capabilities.W3CCapabilities).alwaysMatch['sauce:options']
                )
            )
        )

        if (isSauceJob && config && config.user && config.key && sessionId) {
            const multiremoteNote = isMultiremote ? ` ${instanceName}` : ''
            const note = 'Check out%s job at %s'
            // The report url of RDC is in the caps that are returned
            if ('testobject_test_report_url' in capabilities){
                return [format(note, multiremoteNote, capabilities.testobject_test_report_url)]
            }

            // VDC urls can be constructed / be made shared
            const isUSEast1 = config.headless || (config.hostname?.includes('us-east-1'))
            const isUSEast4 = ['us-east-4'].includes(config?.region || '') || (config.hostname?.includes('us-east-4'))
            const isEUCentral = ['eu', 'eu-central-1'].includes(config?.region || '') || (config.hostname?.includes('eu-central'))
            const isAPAC = ['apac', 'apac-southeast-1'].includes(config?.region || '') || (config.hostname?.includes('apac'))
            const dc = isUSEast1 ? '.us-east-1' : isUSEast4 ? '.us-east-4' : isEUCentral ? '.eu-central-1' : isAPAC ? '.apac-southeast-1' : ''
            const sauceLabsSharableLinks = this._sauceLabsSharableLinks
                ? sauceAuthenticationToken( config.user, config.key, sessionId )
                : ''
            const sauceUrl = `https://app${dc}.saucelabs.com/tests/${sessionId}${sauceLabsSharableLinks}`

            return [format(note, multiremoteNote, sauceUrl)]
        }

        return []
    }

    /**
     * Get the header display for the report
     * @param  {Object} runner Runner data
     * @return {Array}         Header data
     */
    getHeaderDisplay (runner: RunnerStats) {
        const combo = this.getEnviromentCombo(runner.capabilities, undefined, runner.isMultiremote).trim()

        // Spec file name and enviroment information
        const output = [`Running: ${combo}`]

        /**
         * print session ID if not multiremote
         */
        // @ts-expect-error
        if (runner.capabilities.sessionId) {
            // @ts-expect-error
            output.push(`Session ID: ${runner.capabilities.sessionId}`)
        }

        return output
    }

    /**
     * returns everything worth reporting from a suite
     * @param  {Object}    suite  test suite containing tests and hooks
     * @return {Object[]}         list of events to report
     */
    getEventsToReport (suite: SuiteStats) {
        return [
            /**
             * Generate a report that shows all tests except those that failed but passed on retry, and only display failed hooks.
             */
            ...suite.hooksAndTests.reduce((accumulator, currentItem) => {
                if (currentItem instanceof TestStats) {
                    const existingTestIndex = accumulator.findIndex((test) => test instanceof TestStats && test.fullTitle === currentItem.fullTitle)
                    if (existingTestIndex === -1) {
                        accumulator.push(currentItem)
                    } else {
                        const existingTest = accumulator[existingTestIndex] as TestStats
                        if (currentItem.retries !== undefined && existingTest.retries !== undefined) {
                            if (currentItem.retries > existingTest.retries) {
                                accumulator.splice(existingTestIndex, 1, currentItem)
                            }
                        }
                    }
                } else {
                    accumulator.push(currentItem)
                }
                return accumulator
            }, [] as (HookStats | TestStats)[]).filter((item) => Object.keys(item).length > 0).filter((item) => {
                return item.type === 'test' || Boolean(item.error)
            })
        ]
    }

    /**
     * Get the results from the tests
     * @param  {Array} suites Runner suites
     * @return {Array}        Display output list
     */
    getResultDisplay (prefaceString?: string) {
        const output = []
        const preface = this._showPreface ? prefaceString : ''
        const suites = this.getOrderedSuites()
        const specFileReferences: string[] = []

        for (const suite of suites) {
            // Don't do anything if a suite has no tests or sub suites
            if (suite.tests.length === 0 && suite.suites.length === 0 && suite.hooks.length === 0) {
                continue
            }

            // Get the indent/starting point for this suite
            const suiteIndent = this.indent(suite.uid)

            // Display file path of spec
            if (suite.file && !specFileReferences.includes(suite.file)) {
                output.push(`${suiteIndent}» ${suite.file.replace(process.cwd(), '')}`)
                specFileReferences.push(suite.file)
            }

            // Display the title of the suite
            output.push(`${suiteIndent}${suite.title}`)

            // display suite description (Cucumber only)
            if (suite.description) {
                output.push(...suite.description.trim().split('\n')
                    .map((l) => `${suiteIndent}${chalk.grey(l.trim())}`))
                output.push('') // empty line
            }

            // display suite rule (Cucumber only)
            if (suite.rule) {
                output.push(...suite.rule.trim().split('\n')
                    .map((l) => `${suiteIndent}${chalk.grey(l.trim())}`))
            }

            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                const testTitle = `${test.title} ${(test instanceof TestStats && test.retries && test.retries > 0) ? `(${test.retries} retries)` : ''}`
                const state = test.state
                const testIndent = `${DEFAULT_INDENT}${suiteIndent}`

                // Output for a single test
                output.push(`${testIndent}${chalk[this.getColor(state)](this.getSymbol(state))} ${testTitle.trim()}`)

                // print cucumber data table cells and docstring
                const arg = (test as TestStats).argument
                if (typeof(arg) === 'string'){
                    // Doc string is the same with the indent on the output for a single test
                    const docstringIndent = '  '
                    const docstringMark = `${testIndent}${docstringIndent}"""`
                    const docstring = String(arg)
                    const formattedDocstringLines = docstring.split('\n').filter(line => line)
                        .map((line: string) => `${testIndent}${docstringIndent}${line}`)
                    output.push(...[docstringMark, ...formattedDocstringLines, docstringMark])
                } else {
                    const dataTable = arg as Argument
                    if (dataTable && dataTable.rows && dataTable.rows.length) {
                        const data = buildTableData(dataTable.rows)
                        const rawTable = printTable(data)
                        const table = getFormattedRows(rawTable, testIndent)
                        output.push(...table)
                    }
                }

                // print pending reasons
                const pendingItem = this._pendingReasons.shift()
                if (pendingItem) {
                    output.push('')
                    output.push(testIndent.repeat(2) + '.........Pending Reasons.........')
                    output.push(testIndent.repeat(3) + pendingItem?.replace(/\n/g, '\n'.concat(preface + ' ', testIndent.repeat(3))))
                }

                // print console output
                const logItem = this._consoleLogs.shift()
                if (logItem) {
                    output.push('')
                    output.push(testIndent.repeat(2) + '.........Console Logs.........')
                    output.push(testIndent.repeat(3) + logItem?.replace(/\n/g, '\n'.concat(preface + ' ', testIndent.repeat(3))))
                }
            }

            // Put a line break after each suite (only if tests exist in that suite)
            if (eventsToReport.length) {
                output.push('')
            }
        }

        return output
    }

    /**
     * Get the display for passing, failing and skipped
     * @param  {string} duration Duration string
     * @return {Array} Count display
     */
    getCountDisplay (duration: string) {
        const output: string[] = []

        // Get the passes
        if (this._stateCounts.passed > 0) {
            const text = `${this._stateCounts.passed} passing ${duration}`
            output.push(chalk[this.getColor('passed')](text))
            duration = ''
        }

        // Get the failures
        if (this._stateCounts.failed > 0) {
            const text = `${this._stateCounts.failed} failing ${duration}`.trim()
            output.push(chalk[this.getColor('failed')](text))
            duration = ''
        }

        // Get the skipped tests
        if (this._stateCounts.skipped > 0) {
            const text = `${this._stateCounts.skipped} skipped ${duration}`.trim()
            output.push(chalk[this.getColor('skipped')](text))
        }

        return output
    }

    /**
     * Get display for failed tests, e.g. stack trace
     * @return {Array} Stack trace output
     */
    getFailureDisplay () {
        let failureLength = 0
        const output = []
        const suites = this.getOrderedSuites()

        for (const suite of suites) {
            const suiteTitle = suite.title
            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                if (test.state !== 'failed') {
                    continue
                }

                const testTitle = test.title
                const errors: Error[] = test.errors || (test.error ? [test.error] : [])
                // If we get here then there is a failed test
                output.push(
                    '',
                    `${++failureLength}) ${suiteTitle} ${testTitle}`,

                )
                for (const error of errors) {
                    !error?.stack?.includes('new AssertionError')
                        ? output.push(chalk.red(error.message))
                        : output.push(...error.message.split('\n'))
                    if (error.stack) {
                        output.push(...error.stack.split(/\n/g).map(value => chalk.gray(value)))
                    }
                }
            }
        }

        return output
    }

    /**
     * Get suites in the order they were called
     * @return {Array} Ordered suites
     */
    getOrderedSuites () {
        if (this._orderedSuites.length) {
            return this._orderedSuites
        }

        this._orderedSuites = []
        for (const uid of this._suiteUids) {
            for (const [suiteUid, suite] of Object.entries(this.suites)) {
                if (suiteUid !== uid) {
                    continue
                }

                this._orderedSuites.push(suite)
            }
        }

        /**
         * ensure we include root suite hook errors
         */
        const rootSuite = this.currentSuites[0]
        if (rootSuite) {
            const baseRootSuite = {
                ...rootSuite,
                type: 'suite',
                title: '(root)',
                fullTitle: '(root)',
                suites: []
            }
            const beforeAllHooks = rootSuite.hooks.filter((hook) => hook.state && hook.title.startsWith('"before') && hook.title.endsWith('"{root}"'))
            const afterAllHooks = rootSuite.hooks.filter((hook) => hook.state && hook.title.startsWith('"after') && hook.title.endsWith('"{root}"'))
            this._orderedSuites.unshift(Object.assign({} as SuiteStats, baseRootSuite, {
                hooks: beforeAllHooks,
                hooksAndTests: beforeAllHooks
            }))
            this._orderedSuites.push(Object.assign({} as SuiteStats, baseRootSuite, {
                hooks: afterAllHooks,
                hooksAndTests: afterAllHooks
            }))
        }

        return this._orderedSuites
    }

    /**
     * Indent a suite based on where how it's nested
     * @param  {string} uid Unique suite key
     * @return {String}     Spaces for indentation
     */
    indent (uid: string) {
        const indents = this._suiteIndents[uid]
        return indents === 0 ? '' : Array(indents).join('    ')
    }

    /**
     * Get a symbol based on state
     * @param  {string} state State of a test
     * @return {String}       Symbol to display
     */
    getSymbol (state?: keyof Symbols) {
        return (state && this._symbols[state]) || '?'
    }

    /**
     * Get a color based on a given state
     * @param  {string} state Test state
     * @return {String}       State color
     */
    getColor (state?: string) {
        // In case of an unknown state
        let color: keyof typeof chalk = 'gray'

        switch (state) {
        case 'passed':
            color = 'green'
            break
        case 'pending':
        case 'skipped':
            color = 'cyan'
            break
        case 'failed':
            color = 'red'
            break
        }

        return color
    }

    /**
     * Get information about the enviroment
     * @param  {Object}  caps    Enviroment details
     * @param  {Boolean} verbose
     * @return {String}          Enviroment string
     */
    getEnviromentCombo (capability: Capabilities.RemoteCapability, verbose = true, isMultiremote = false) {
        if (isMultiremote) {
            const browserNames = Object.values(capability).map((c) => c.browserName)
            const browserName = browserNames.length > 1
                ? `${browserNames.slice(0, -1).join(', ')} and ${browserNames.pop()}`
                : browserNames.pop()
            return `MultiremoteBrowser on ${browserName}`
        }
        const caps = (
            ((capability as Capabilities.W3CCapabilities).alwaysMatch as Capabilities.DesiredCapabilities) ||
            (capability as Capabilities.DesiredCapabilities)
        )
        const device = caps['appium:deviceName']
        const app = ((caps['appium:app'] || (caps as any).app) || '').replace('sauce-storage:', '')
        const appName = app || caps['appium:bundleId'] || (caps as any).bundleId
        const browser = caps.browserName || caps.browser || appName
        /**
         * fallback to different capability types:
         * browserVersion: W3C format
         * version: JSONWP format
         * platformVersion: mobile format
         * browser_version: invalid BS capability
         */
        const version = caps.browserVersion || caps.version || caps['appium:platformVersion'] || caps.browser_version
        /**
         * fallback to different capability types:
         * platformName: W3C format
         * platform: JSONWP format
         * os, os_version: invalid BS capability
         */
        const platform = caps.platformName || caps['appium:platformName'] || caps.platform || (caps.os ? caps.os + (caps.os_version ?  ` ${caps.os_version}` : '') : '(unknown)')

        // Mobile capabilities
        if (device) {
            const program = appName || caps.browserName
            const executing = program ? `executing ${program}` : ''
            if (!verbose) {
                return `${device} ${platform} ${version}`
            }
            return `${device} on ${platform} ${version} ${executing}`.trim()
        }

        if (!verbose) {
            return (browser + (version ? ` ${version} ` : ' ') + (platform)).trim()
        }

        return browser + (version ? ` (v${version})` : '') + (` on ${platform}`)
    }
}
