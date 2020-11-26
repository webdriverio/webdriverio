import WDIOReporter, { SuiteStats, RunnerStats } from '@wdio/reporter'
import chalk from 'chalk'

export default class ConciseReporter extends WDIOReporter {
    // keep track of the order that suites were called
    private _suiteUids: string[] = []
    private _suites: SuiteStats[] = []
    private _stateCounts = { failed: 0 }

    constructor(options: WDIOReporter.Options) {
        /**
        * make Concise reporter to write to output stream by default
        */
        super(Object.assign(options, { stdout: true }))
    }

    onSuiteStart (suite: SuiteStats): void {
        this._suiteUids.push(suite.uid)
    }

    onSuiteEnd (suite: SuiteStats): void {
        this._suites.push(suite)
    }

    onTestFail () {
        this._stateCounts.failed++
    }

    onRunnerEnd (runner: RunnerStats): void {
        this.printReport(runner)
    }

    /**
    * Print the Concise report to the screen
    * @param  {Object} runner Wdio runner
    */
    printReport(runner: any): void {
        const header = this.chalk.yellow('========= Your concise report ==========')

        const output = [
            this.getEnviromentCombo(runner.capabilities),
            this.getCountDisplay(),
            ...this.getFailureDisplay()
        ]

        this.write(`${header}\n${output.join('\n')}\n`)
    }

    /**
    * Get the display for failing tests
    * @return {String} Count display
    */
    getCountDisplay () {
        const failedTestsCount = this.stateCounts.failed

        return failedTestsCount > 0
            ? `Test${failedTestsCount > 1 ? 's' : ''} failed (${failedTestsCount}):`
            : 'All went well !!'
    }

    /**
    * Get display for failed tests, e.g. stack trace
    * @return {Array} Stack trace output
    */
    getFailureDisplay () {
        const output: Array<any> =[]

        this.getOrderedSuites().map(suite => suite.tests.map(test => {
            if (test.state === 'failed') {
                output.push(
                    `  Fail : ${this.chalk.red(test.title)}`,
                    `    ${test.error.type} : ${this.chalk.yellow(test.error.message)}`
                )
            }
        }))

        return output
    }

    /**
        * Get suites in the order they were called
        * @return {Array} Ordered suites
        */
    getOrderedSuites () {
        this.orderedSuites = []

        this.suiteUids.map(uid => this.suites.map(suite => {
            if (suite.uid === uid) {
                this.orderedSuites.push(suite)
            }
        }))

        return this.orderedSuites
    }

    /**
        * Get information about the enviroment
        * @param  {Object}  caps    Enviroment details
        * @param  {Boolean} verbose
        * @return {String}          Enviroment string
        */

    getEnviromentCombo (caps: WebDriver) {
        const device = caps.deviceName
        const browser = caps.browserName || caps.browser
        const version = caps.version || caps.platformVersion || caps.browser_version
        const platform = caps.os ? (caps.os + ' ' + caps.os_version) : (caps.platform || caps.platformName)

        // mobile capabilities
        if (device) {
            const program = (caps.app || '').replace('sauce-storage:', '') || caps.browserName
            const executing = program ? `executing ${program}` : ''

            return `${device} on ${platform} ${version} ${executing}`.trim()
        }

        return browser
            + (version ? ` (v${version})` : '')
            + (platform ? ` on ${platform}` : '')
    }
}
