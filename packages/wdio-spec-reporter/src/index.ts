import WDIOReporter, { SuiteStats, HookStats, RunnerStats, TestStats, Argument } from '@wdio/reporter'
import { Capabilities } from '@wdio/types'
import chalk, { Chalk } from 'chalk'
import prettyMs from 'pretty-ms'
import { buildTableData, printTable, getFormattedRows, sauceAuthenticationToken } from './utils'
import type { StateCount, Symbols, SpecReporterOptions, TestLink } from './types'

const DEFAULT_INDENT = '   '

export default class SpecReporter extends WDIOReporter {
    private _suiteUids = new Set()
    private _indents = 0
    private _suiteIndents: Record<string, number> = {}
    private _orderedSuites: SuiteStats[] = []

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

    private _sauceLabsSharableLinks = true

    constructor (options: SpecReporterOptions) {
        /**
         * make spec reporter to write to output stream by default
         */
        super(Object.assign({ stdout: true }, options))
        this._symbols = { ...this._symbols, ...this.options.symbols || {} }
        this._sauceLabsSharableLinks = 'sauceLabsSharableLinks' in options
            ? options.sauceLabsSharableLinks as boolean
            : this._sauceLabsSharableLinks
    }

    onSuiteStart (suite: SuiteStats) {
        this._suiteUids.add(suite.uid)
        this._suiteIndents[suite.uid] = ++this._indents
    }

    onSuiteEnd () {
        this._indents--
    }

    onHookEnd (hook: HookStats) {
        if (hook.error) {
            this._stateCounts.failed++
        }
    }

    onTestPass () {
        this._stateCounts.passed++
    }

    onTestFail () {
        this._stateCounts.failed++
    }

    onTestSkip () {
        this._stateCounts.skipped++
    }

    onRunnerEnd (runner: RunnerStats) {
        this.printReport(runner)
    }

    /**
     * Print the report to the screen
     */
    printReport(runner: RunnerStats) {
        const duration = `(${prettyMs(runner._duration)})`
        const preface = `[${this.getEnviromentCombo(runner.capabilities, false, runner.isMultiremote).trim()} #${runner.cid}]`
        const divider = '------------------------------------------------------------------'

        // Get the results
        const results = this.getResultDisplay()

        // If there are no test results then return nothing
        if (results.length === 0) {
            return
        }

        const testLinks = runner.isMultiremote
            ? Object.entries(runner.capabilities).map(([instanceName, capabilities]) => this.getTestLink({
                config: runner.config,
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
        const prefacedOutput = output.map((value) => {
            return value ? `${preface} ${value}` : preface
        })

        // Output the results
        this.write(`${divider}\n${prefacedOutput.join('\n')}\n`)
    }

    /**
     * get link to saucelabs job
     */
    getTestLink ({ config, sessionId, isMultiremote, instanceName, capabilities }: TestLink) {
        const isSauceJob = (
            (config.hostname && config.hostname.includes('saucelabs')) ||
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

        if (isSauceJob && config.user && config.key && sessionId) {
            const dc = config.headless
                ? '.us-east-1'
                : ['eu', 'eu-central-1'].includes(config.region || '') ? '.eu-central-1' : ''
            const multiremoteNote = isMultiremote ? ` ${instanceName}` : ''
            const sauceLabsSharableLinks = this._sauceLabsSharableLinks
                ? sauceAuthenticationToken( config.user, config.key, sessionId )
                : ''
            return [`Check out${multiremoteNote} job at https://app${dc}.saucelabs.com/tests/${sessionId}${sauceLabsSharableLinks}`]
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
        const output = [
            `Spec: ${runner.specs[0]}`,
            `Running: ${combo}`
        ]

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
             * report all tests and only hooks that failed
             */
            ...suite.hooksAndTests
                .filter((item) => {
                    return item.type === 'test' || Boolean(item.error)
                })
        ]
    }

    /**
     * Get the results from the tests
     * @param  {Array} suites Runner suites
     * @return {Array}        Display output list
     */
    getResultDisplay () {
        const output = []
        const suites = this.getOrderedSuites()

        for (const suite of suites) {
            // Don't do anything if a suite has no tests or sub suites
            if (suite.tests.length === 0 && suite.suites.length === 0 && suite.hooks.length === 0) {
                continue
            }

            // Get the indent/starting point for this suite
            const suiteIndent = this.indent(suite.uid)

            // Display the title of the suite
            output.push(`${suiteIndent}${suite.title}`)

            // display suite description (Cucumber only)
            if (suite.description) {
                output.push(...suite.description.trim().split('\n')
                    .map((l) => `${suiteIndent}${chalk.grey(l.trim())}`))
                output.push('') // empty line
            }

            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                const testTitle = test.title
                const state = test.state
                const testIndent = `${DEFAULT_INDENT}${suiteIndent}`

                // Output for a single test
                output.push(`${testIndent}${chalk[this.getColor(state)](this.getSymbol(state))} ${testTitle}`)

                // print cucumber data table cells
                const args = (test as TestStats).argument as Argument
                if (args && args.rows && args.rows.length) {
                    const data = buildTableData(args.rows)
                    const rawTable = printTable(data)
                    const table = getFormattedRows(rawTable, testIndent)
                    output.push(...table)
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
     * @param  {String} duration Duration string
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
                for (let error of errors) {
                    output.push(chalk.red(error.message))
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

        return this._orderedSuites
    }

    /**
     * Indent a suite based on where how it's nested
     * @param  {String} uid Unique suite key
     * @return {String}     Spaces for indentation
     */
    indent (uid: string) {
        const indents = this._suiteIndents[uid]
        return indents === 0 ? '' : Array(indents).join('    ')
    }

    /**
     * Get a symbol based on state
     * @param  {String} state State of a test
     * @return {String}       Symbol to display
     */
    getSymbol (state?: keyof Symbols) {
        return (state && this._symbols[state]) || '?'
    }

    /**
     * Get a color based on a given state
     * @param  {String} state Test state
     * @return {String}       State color
     */
    getColor (state?: string) {
        // In case of an unknown state
        let color: keyof Chalk = 'gray'

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
        const caps = (
            ((capability as Capabilities.W3CCapabilities).alwaysMatch as Capabilities.DesiredCapabilities) ||
            (capability as Capabilities.DesiredCapabilities)
        )
        const device = caps.deviceName
        const browser = isMultiremote ? 'MultiremoteBrowser' : (caps.browserName || caps.browser)
        /**
         * fallback to different capability types:
         * browserVersion: W3C format
         * version: JSONWP format
         * platformVersion: mobile format
         * browser_version: invalid BS capability
         */
        const version = caps.browserVersion || caps.version || caps.platformVersion || caps.browser_version
        /**
         * fallback to different capability types:
         * platformName: W3C format
         * platform: JSONWP format
         * os, os_version: invalid BS capability
         */
        const platform = isMultiremote
            ? ''
            : caps.platformName || caps.platform || (caps.os ? caps.os + (caps.os_version ?  ` ${caps.os_version}` : '') : '(unknown)')

        // Mobile capabilities
        if (device) {
            const program = (caps.app || '').replace('sauce-storage:', '') || caps.browserName
            const executing = program ? `executing ${program}` : ''
            if (!verbose) {
                return `${device} ${platform} ${version}`
            }
            return `${device} on ${platform} ${version} ${executing}`.trim()
        }

        if (!verbose) {
            return (browser + (version ? ` ${version} ` : ' ') + (platform)).trim()
        }

        if (isMultiremote) {
            return browser + (version ? ` (v${version})` : '') + ` on ${Object.values(capability).map((c) => c.browserName).join(', ')}`
        }

        return browser + (version ? ` (v${version})` : '') + (` on ${platform}`)
    }
}
