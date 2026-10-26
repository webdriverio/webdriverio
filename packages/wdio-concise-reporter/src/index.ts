import { getBrowserName, getBrowserNames, hookCountsAsFailure, type HookStats, type SuiteStats, type RunnerStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import chalk from 'chalk'

import type { Reporters } from '@wdio/types'

export default class ConciseReporter extends WDIOReporter {
    // keep track of the order that suites were called
    private _suiteUids: string[] = []
    private _suites: SuiteStats[] = []
    private _stateCounts = { failed: 0 }
    private _failedHooks: HookStats[] = []

    constructor(options: Reporters.Options) {
        // write to output stream by default
        super(Object.assign({ stdout: true }, options))
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

    // each failed hook that counts as a failure, in any framework: also one that fails no test
    onHookEnd (hook: HookStats) {
        if (hookCountsAsFailure(hook) && !this._failedHooks.includes(hook)) {
            this._failedHooks.push(hook)
        }
    }

    // the base clears the hooks of the attempt after this call: the retried attempt does not count
    onSuiteRetry (suite: SuiteStats) {
        this._failedHooks = this._failedHooks.filter((hook) => !suite.hooks.includes(hook))
    }

    onRunnerEnd (runner: RunnerStats): void {
        this.printReport(runner)
    }

    /**
     * Print the Concise report to the screen
     * @param  {Object} runner Wdio runner
     */
    printReport(runner: RunnerStats): void {
        const header = chalk.yellow('========= Your concise report ==========')

        const countDisplay = this.getCountDisplay()
        const output = [
            runner.isMultiRemote
                ? getBrowserNames(runner.capabilities, true).join(', ') || 'MultiRemoteBrowser'
                : this.getEnviromentCombo(runner.capabilities),
            // no count line when only hooks failed: their own part follows
            ...(countDisplay ? [countDisplay] : []),
            ...this.getFailureDisplay(),
            ...this.getHookFailureDisplay()
        ]

        this.write(`${header}\n${output.join('\n')}\n`)
    }

    /**
     * Get the display for failing tests
     * @return {String} Count display
     */
    getCountDisplay () {
        const failedTestsCount = this._stateCounts.failed
        return failedTestsCount > 0
            ? `❌ Test${failedTestsCount > 1 ? 's' : ''} failed (${failedTestsCount}):`
            : this.counts.tests === 0
                ? '❌ Failed to setup tests, no tests found'
                : this._failedHooks.length ? '' : '✅ All went well!'
    }

    /**
     * Get display for failed tests, e.g. stack trace
     * @return {Array} Stack trace output
     */
    getFailureDisplay () {
        const output: string[] = []

        this.getOrderedSuites().map(suite => suite.tests.map(test => {
            // the last attempt of a retried test decides
            if (test.state === 'failed' && !test.retried) {
                output.push(
                    `  Fail : ${chalk.red(test.title)}`,
                    // @ts-ignore
                    `    ${test.error.type} : ${chalk.yellow(test.error?.message)}`
                )
            }
        }))

        return output
    }

    /**
     * Get display for failed hooks that count as a failure, in the order they ended
     * @return {Array} Hook failure output
     */
    getHookFailureDisplay () {
        const hooks = this._failedHooks
        if (!hooks.length) {
            return []
        }
        return [
            `❌ Hook${hooks.length > 1 ? 's' : ''} failed (${hooks.length}):`,
            ...hooks.flatMap((hook) => [
                `  Fail : ${chalk.red(hook.title)}`,
                `    ${(hook.error as Error & { type?: string } | undefined)?.type} : ${chalk.yellow(hook.error?.message)}`
            ])
        ]
    }

    /**
     * Get suites in the order they were called
     * @return {Array} Ordered suites
     */
    getOrderedSuites () {
        const orderedSuites: SuiteStats[] = []

        this._suiteUids.map(uid => this._suites.map(suite => {
            if (suite.uid === uid) {
                orderedSuites.push(suite)
            }
        }))

        return orderedSuites
    }

    /**
     * Get information about the enviroment
     * @param  {Object}  caps    Enviroment details
     * @param  {Boolean} verbose
     * @return {String}          Enviroment string
     */
    getEnviromentCombo (caps: WebdriverIO.Capabilities) {
        // @ts-expect-error `deviceName` and `device` are legacy capability names
        const device = caps.deviceName || caps['appium:deviceName'] || caps.device
        const browser = getBrowserName(caps)
        // @ts-expect-error `version` and `browser_version` are legacy capability names
        const version = caps.browserVersion || caps.version || caps['appium:platformVersion'] || caps.browser_version
        // @ts-expect-error `os`, `os_version` and `platform` are legacy capability names
        const platform = caps.os ? (caps.os + ' ' + caps.os_version) : (caps.platform || caps.platformName)

        // mobile capabilities
        if (device) {
            const program = (caps['appium:app'] || '').replace('sauce-storage:', '') || caps.browserName
            const executing = program ? `executing ${program}` : ''

            return `${device} on ${platform} ${version} ${executing}`.trim()
        }

        return browser
            + (version ? ` (v${version})` : '')
            + (platform ? ` on ${platform}` : '')
    }
}
