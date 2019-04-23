import WDIOReporter from '@wdio/reporter'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'

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

        const output = [
            ...this.getHeaderDisplay(runner),
            ...results,
            ...this.getCountDisplay(duration),
            ...this.getFailureDisplay(),
            ...this.getTestLink(runner)
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
    getTestLink ({ config, sessionId }) {
        if (config.hostname.includes('saucelabs')) {
            const dc = config.headless
                ? '.us-east-1'
                : ['eu', 'eu-central-1'].includes(config.region) ? '.eu-central-1' : ''
            return ['', `Check out job at https://app${dc}.saucelabs.com/tests/${sessionId}`]
        }

        return []
    }

    /**
     * Get the header display for the report
     * @param  {Object} runner Runner data
     * @return {Array}         Header data
     */
    getHeaderDisplay(runner) {
        const combo = this.getEnviromentCombo(runner.capabilities).trim()

        // Spec file name and enviroment information
        const output = [
            `Spec: ${runner.specs[0]}`,
            `Running: ${combo}`,
            '',
        ]

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
             * report all tests
             */
            ...suite.tests,
            /**
             * and only hooks that failed
             */
            ...suite.hooks
                .filter((hook) => Boolean(hook.error))
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

            const eventsToReport = this.getEventsToReport(suite)
            for (const test of eventsToReport) {
                const testTitle = test.title
                const state = test.state
                const testIndent = `${this.defaultTestIndent}${suiteIndent}`

                // Output for a single test
                output.push(`${testIndent}${this.chalk[this.getColor(state)](this.getSymbol(state))} ${testTitle}`)
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
        if(this.stateCounts.passed > 0) {
            const text = `${this.stateCounts.passed} passing ${duration}`
            output.push(this.chalk[this.getColor('passed')](text))
            duration = ''
        }

        // Get the failures
        if(this.stateCounts.failed > 0) {
            const text = `${this.stateCounts.failed} failing ${duration}`.trim()
            output.push(this.chalk[this.getColor('failed')](text))
            duration = ''
        }

        // Get the skipped tests
        if(this.stateCounts.skipped > 0) {
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
                if(test.state !== 'failed') {
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
                    output.push(
                        this.chalk.red(error.message),
                        ...error.stack.split(/\n/g).map(value => this.chalk.gray(value))
                    )
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
        const version = caps.version || caps.platformVersion || caps.browser_version
        const platform = caps.os ? (caps.os + ' ' + caps.os_version) : (caps.platform || caps.platformName)

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
            return (browser + ' ' + (version || '') + ' ' + (platform || '')).trim()
        }

        return browser + (version ? ` (v${version})` : '') + (platform ? ` on ${platform}` : '')
    }
}

export default SpecReporter
