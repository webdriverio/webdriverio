import WDIOReporter from '@wdio/reporter'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import { buildTableData, printTable, getFormattedRows } from './utils'

class SpecReporter extends WDIOReporter {
    constructor (options) {
        /**
         * make spec reporter to write to output stream by default
         */
        options = Object.assign({ stdout: true }, options)
        super(options)

        // Keep track of the order that suites were called
        this.suiteUids = []

        this.suites = []
        this.indents = 0
        this.suiteIndents = {}
        this.defaultTestIndent = '   '
        this.stateCounts = {
            passed : 0,
            failed : 0,
            skipped : 0
        }

        this.chalk = chalk
    }

    onSuiteStart (suite) {
        this.suiteUids.push(suite.uid)
        this.suiteIndents[suite.uid] = ++this.indents
    }

    onSuiteEnd (suite) {
        this.indents--
        this.suites.push(suite)
    }

    onHookEnd (hook) {
        if (hook.error) {
            this.stateCounts.failed++
        }
    }

    onTestPass () {
        this.stateCounts.passed++
    }

    onTestFail () {
        this.stateCounts.failed++
    }

    onTestSkip () {
        this.stateCounts.skipped++
    }

    onRunnerEnd (runner) {
        this.printReport(runner)
    }

    /**
     * Print the report to the screen
     */
    printReport(runner) {
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
                config: { ...runner.config, ...{ capabilities } },
                sessionId: capabilities.sessionId,
                isMultiremote: runner.isMultiremote,
                instanceName
            }))
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
    getTestLink ({ config, sessionId, isMultiremote, instanceName }) {
        const isSauceJob = (
            (config.hostname && config.hostname.includes('saucelabs')) ||
            // only show if multiremote is not used
            config.capabilities && (
                // check w3c caps
                config.capabilities['sauce:options'] ||
                // check jsonwp caps
                config.capabilities.tunnelIdentifier
            )
        )

        if (isSauceJob) {
            const dc = config.headless
                ? '.us-east-1'
                : ['eu', 'eu-central-1'].includes(config.region) ? '.eu-central-1' : ''
            const multiremoteNote = isMultiremote ? ` ${instanceName}` : ''
            return [`Check out${multiremoteNote} job at https://app${dc}.saucelabs.com/tests/${sessionId}`]
        }

        return []
    }

    /**
     * Get the header display for the report
     * @param  {Object} runner Runner data
     * @return {Array}         Header data
     */
    getHeaderDisplay(runner) {
        const combo = this.getEnviromentCombo(runner.capabilities, undefined, runner.isMultiremote).trim()

        // Spec file name and enviroment information
        const output = [
            `Spec: ${runner.specs[0]}`,
            `Running: ${combo}`
        ]

        /**
         * print session ID if not multiremote
         */
        if (runner.capabilities.sessionId) {
            output.push(`Session ID: ${runner.capabilities.sessionId}`)
        }

        return output
    }

    /**
     * returns everything worth reporting from a suite
     * @param  {Object}    suite  test suite containing tests and hooks
     * @return {Object[]}         list of events to report
     */
    getEventsToReport (suite) {
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
                    .map((l) => `${suiteIndent}${this.chalk.grey(l.trim())}`))
                output.push('') // empty line
            }

            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                const testTitle = test.title
                const state = test.state
                const testIndent = `${this.defaultTestIndent}${suiteIndent}`

                // Output for a single test
                output.push(`${testIndent}${this.chalk[this.getColor(state)](this.getSymbol(state))} ${testTitle}`)

                // print cucumber data table cells
                if (test.argument && test.argument.rows && test.argument.rows.length) {
                    const data = buildTableData(test.argument.rows)
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
    getCountDisplay (duration) {
        const output = []

        // Get the passes
        if (this.stateCounts.passed > 0) {
            const text = `${this.stateCounts.passed} passing ${duration}`
            output.push(this.chalk[this.getColor('passed')](text))
            duration = ''
        }

        // Get the failures
        if (this.stateCounts.failed > 0) {
            const text = `${this.stateCounts.failed} failing ${duration}`.trim()
            output.push(this.chalk[this.getColor('failed')](text))
            duration = ''
        }

        // Get the skipped tests
        if (this.stateCounts.skipped > 0) {
            const text = `${this.stateCounts.skipped} skipped ${duration}`.trim()
            output.push(this.chalk[this.getColor('skipped')](text))
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
                const errors = test.errors || [test.error]
                // If we get here then there is a failed test
                output.push(
                    '',
                    `${++failureLength}) ${suiteTitle} ${testTitle}`,

                )
                for (let error of errors) {
                    output.push(this.chalk.red(error.message))
                    if (error.stack) {
                        output.push(...error.stack.split(/\n/g).map(value => this.chalk.gray(value)))
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
        if (this.orderedSuites) {
            return this.orderedSuites
        }

        this.orderedSuites = []
        for (const uid of this.suiteUids) {
            for (const suite of this.suites) {
                if (suite.uid !== uid) {
                    continue
                }

                this.orderedSuites.push(suite)
            }
        }

        return this.orderedSuites
    }

    /**
     * Indent a suite based on where how it's nested
     * @param  {String} uid Unique suite key
     * @return {String}     Spaces for indentation
     */
    indent (uid) {
        const indents = this.suiteIndents[uid]
        return indents === 0 ? '' : Array(indents).join('    ')
    }

    /**
     * Get a symbol based on state
     * @param  {String} state State of a test
     * @return {String}       Symbol to display
     */
    getSymbol (state) {
        let symbol = '?' // in case of an unknown state

        switch (state) {
        case 'passed':
            symbol = '✓'
            break
        case 'skipped':
            symbol = '-'
            break
        case 'failed':
            symbol = '✖'
            break
        }

        return symbol
    }

    /**
     * Get a color based on a given state
     * @param  {String} state Test state
     * @return {String}       State color
     */
    getColor (state) {
        // In case of an unknown state
        let color = null

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
    getEnviromentCombo (caps, verbose = true, isMultiremote = false) {
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
        const platform = caps.platformName || caps.platform || (caps.os ? caps.os + (caps.os_version ?  ` ${caps.os_version}` : '') : '(unknown)')

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

        return browser + (version ? ` (v${version})` : '') + (` on ${platform}`)
    }
}

export default SpecReporter
