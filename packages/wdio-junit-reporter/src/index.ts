/* eslint-disable @typescript-eslint/no-explicit-any */
import url from 'node:url'
import os from 'node:os'

import type { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import junitReportBuilder, { type Builder as JUnitReportBuilder } from 'junit-report-builder'

import type { JUnitReporterOptions } from './types.js'
import { limit } from './utils.js'
import { events } from './common/api.js'

const ansiRegex = new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
].join('|'), 'g')

/** Interface to store additional information for a given testcase */
interface JunitReporterAdditionalInformation {
    /** uid of the test case */
    uid: string
    /** Worker console log for this test. only filled if addWorkerLogs is true */
    workerConsoleLog: string
    /** Additional properties for junit reporting */
    properties: { [keys: string]: string }
}

/**
 * Reporter that converts test results from a single instance/runner into an XML JUnit report. This class
 * uses junit-report-builder (https://github.com/davidparsson/junit-report-builder) to build report.The report
 * generated from this reporter should conform to the standard JUnit report schema
 * (https://github.com/junit-team/junit5/blob/master/platform-tests/src/test/resources/jenkins-junit.xsd).
 */
class JunitReporter extends WDIOReporter {
    private _suiteNameRegEx: RegExp
    private _packageName?: string
    private _suiteTitleLabel?: string
    private _fileNameLabel?: string
    private _activeFeature?: any
    private _activeFeatureName?: any
    private _testToAdditionalInformation: { [keys: string]: JunitReporterAdditionalInformation }
    private _currentTest?: TestStats
    private _originalStdoutWrite: Function
    private _addWorkerLogs: boolean
    private _isWindows: boolean

    constructor(public options: JUnitReporterOptions) {
        super(options)
        this._isWindows = os.platform() === 'win32'
        this._addWorkerLogs = options.addWorkerLogs ?? false
        this._testToAdditionalInformation = {}
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)
        this._suiteNameRegEx = this.options.suiteNameFormat instanceof RegExp
            ? this.options.suiteNameFormat
            : /[^a-zA-Z0-9@]+/ // Reason for ignoring @ is; reporters like wdio-report-portal will fetch the tags from testcase name given as @foo @bar

        const processObj: any = process
        if (this._addWorkerLogs) {
            processObj.stdout.write = this._appendConsoleLog.bind(this)
        }
        processObj.on(events.addProperty, this._addPropertyToCurrentTest.bind(this))
    }

    onTestRetry(testStats: TestStats) {
        testStats.skip('Retry')
    }

    onTestStart(test: TestStats) {
        // Reset stdout when a test starts
        this._currentTest = test
        this._testToAdditionalInformation[test.uid] = {
            workerConsoleLog: '',
            properties: {},
            uid: test.uid
        }
    }

    onRunnerEnd(runner: RunnerStats) {
        const xml = this._buildJunitXml(runner)
        this.write(xml)
    }

    private _addPropertyToCurrentTest(dataObj: { name: string, value: string }) {
        if (this._currentTest?.uid) {
            this._testToAdditionalInformation[this._currentTest.uid].properties[dataObj.name] = dataObj.value
        }
    }

    private _appendConsoleLog(chunk: string, encoding: BufferEncoding, callback: ((err?: Error) => void)) {
        if (this._currentTest?.uid) {
            if (typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
                this._testToAdditionalInformation[this._currentTest.uid].workerConsoleLog = (this._testToAdditionalInformation[this._currentTest.uid].workerConsoleLog ?? '') + chunk
            }
        }
        return this._originalStdoutWrite(chunk, encoding, callback)
    }

    private _prepareName(name = 'Skipped test') {
        return name.split(this._suiteNameRegEx).filter(
            (item) => item && item.length
        ).join(' ')
    }

    private _addFailedHooks(suite: SuiteStats) {
        /**
         * Add failed hooks to suite as tests.
         */
        const failedHooks = suite.hooks.filter(hook => hook.error && hook.title.match(/^"(before|after)( all| each)?" hook/))
        failedHooks.forEach(hook => {
            const { title, _duration, error, state } = hook
            suite.tests.push({
                _duration,
                title,
                error,
                state: state as 'failed' | 'passed',
                output: []
            } as any)
        })
        return suite
    }

    private _addCucumberFeatureToBuilder(builder: any, runner: RunnerStats, specFileName: string, suite: SuiteStats) {
        const featureName = !this.options.suiteNameFormat || this.options.suiteNameFormat instanceof RegExp
            ? this._prepareName(suite.title)
            : this.options.suiteNameFormat({ name: this.options.suiteNameFormat.name, suite })

        const filePath = specFileName.replace(process.cwd(), '.')

        if (suite.type === 'feature') {
            const feature = builder.testSuite()
                .name(featureName)
                .timestamp(suite.start)
                .time(suite._duration / 1000)
                .property('specId', 0)
                .property(this._suiteTitleLabel, suite.title)
                .property('capabilities', runner.sanitizedCapabilities)
                .property(this._fileNameLabel, filePath)
            this._activeFeature = feature
            this._activeFeatureName = featureName
        } else if (this._activeFeature) {
            let scenario = suite
            const testName = this._prepareName(suite.title)
            const classNameFormat = this.options.classNameFormat ? this.options.classNameFormat({ packageName: this._packageName, activeFeatureName: this._activeFeatureName }) : `${this._packageName}.${this._activeFeatureName}`
            const testCase = this._activeFeature.testCase()
                .className(classNameFormat)
                .name(`${testName}`)
                .time(scenario._duration / 1000)

            if (this.options.addFileAttribute) {
                testCase.file(filePath)
            }

            scenario = this._addFailedHooks(scenario)

            let stepsOutput = ''
            let isFailing = false
            for (const stepKey of Object.keys(scenario.tests)) { // tests are trested as steps in Cucumber
                if (stepKey === 'undefined') { // fix cucumber hooks crashing reporter
                    continue
                }

                let stepEmoji = '✅'
                const step = scenario.tests[stepKey as any]
                if (step.state === 'pending' || step.state === 'skipped') {
                    if (!isFailing) {
                        testCase.skipped()
                    }
                    stepEmoji = '⚠️'
                } else if (step.state === 'failed') {
                    if (step.error) {
                        if (this.options.errorOptions) {
                            const errorOptions = this.options.errorOptions
                            for (const key of Object.keys(errorOptions)) {
                                testCase[key](step.error
                                    ? (step.error as any)[errorOptions[key]]
                                    : null
                                )
                            }
                        } else {
                            // default
                            testCase.failure(step.error.message)
                        }
                        testCase.standardError(`\n${step.error.stack}\n`)
                    } else {
                        testCase.failure()
                    }
                    isFailing = true
                    stepEmoji = '❗'
                }
                const output = this._getStandardOutput(step)
                stepsOutput += output ? stepEmoji + ' ' + step.title : stepEmoji + ' ' + step.title + '\n' + output
            }
            testCase.standardOutput(`\n${stepsOutput}\n`)
        }
        return builder
    }

    private _addSuiteToBuilder(
        builder: any,
        runner: RunnerStats,
        specFileName: string,
        suite: SuiteStats
    ) {

        const filePath = specFileName.replace(process.cwd(), '.')
        const suiteName = !this.options.suiteNameFormat || this.options.suiteNameFormat instanceof RegExp
            ? this._prepareName(suite.title)
            : this.options.suiteNameFormat({ name: this.options.suiteNameFormat.name, suite })

        const testSuite = builder.testSuite()
            .name(suiteName)
            .timestamp(suite.start)
            .time(suite._duration / 1000)
            .property('specId', 0)
            .property(this._suiteTitleLabel, suite.title)
            .property('capabilities', runner.sanitizedCapabilities)
            .property(this._fileNameLabel, filePath)

        suite = this._addFailedHooks(suite)

        for (const testKey of Object.keys(suite.tests)) {
            if (testKey === 'undefined') { // fix cucumber hooks crashing reporter (INFO: we may not need this anymore)
                continue
            }

            const test = suite.tests[testKey as any]
            const testName = this._prepareName(test.title)
            const classNameFormat = this.options.classNameFormat
                ? this.options.classNameFormat({ packageName: this._packageName, suite })
                : `${this._packageName}.${(suite.fullTitle || suite.title).replace(/\s/g, '_')}`
            const testCase = testSuite.testCase()
                .className(classNameFormat)
                .name(testName)
                .time(test._duration / 1000)

            if (this.options.addFileAttribute) {
                testCase.file(filePath)
            }

            if (test.state === 'pending' || test.state === 'skipped') {
                testCase.skipped()
                if (test.error) {
                    testCase.standardError(`\n${test.error.stack?.replace(ansiRegex, '')}\n`)
                }
            } else if (test.state === 'failed') {
                if (test.error) {
                    if (test.error.message) {
                        test.error.message = test.error.message.replace(ansiRegex, '')
                    }

                    if (this.options.errorOptions) {
                        const errorOptions = this.options.errorOptions
                        for (const key of Object.keys(errorOptions)) {
                            testCase[key]((test.error as any)[errorOptions[key]])
                        }
                    } else {
                        // default
                        testCase.failure(test.error.message)
                    }
                    testCase.standardError(`\n${test.error.stack?.replace(ansiRegex, '')}\n`)
                } else {
                    testCase.failure()
                }
            }

            for (const propName of Object.keys(this._testToAdditionalInformation[test.uid]?.properties ?? {})) {
                testCase.property(propName, this._testToAdditionalInformation[test.uid].properties[propName])
            }

            const output = this._getStandardOutput(test)
            if (output) {
                testCase.standardOutput(`\n${output}\n`)
            }
        }
        return builder
    }

    private _buildJunitXml(runner: RunnerStats) {
        const builder = (junitReportBuilder as unknown as JUnitReportBuilder).newBuilder()
        if (runner.config.hostname !== undefined && runner.config.hostname.indexOf('browserstack') > -1) {
            // NOTE: deviceUUID is used to build sanitizedCapabilities resulting in a ever-changing package name in runner.sanitizedCapabilities when running Android tests under Browserstack. (i.e. ht79v1a03938.android.9)
            // NOTE: platformVersion is used to build sanitizedCapabilities which can be incorrect and includes a minor version for iOS which is not guaranteed to be the same under Browserstack.
            const browserstackSanitizedCapabilities = [
                // @ts-expect-error capability only exists when running on BrowserStack
                (runner.capabilities).device,
                // @ts-expect-error capability only exists when running on BrowserStack
                (runner.capabilities).os,
                // @ts-expect-error capability only exists when running on BrowserStack
                ((runner.capabilities).os_version || '').replace(/\./g, '_'),
            ]
                .filter(Boolean)
                .map((capability) => capability!.toLowerCase())
                .join('.')
                .replace(/ /g, '') || runner.sanitizedCapabilities
            this._packageName = this.options.packageName || browserstackSanitizedCapabilities
        } else {
            this._packageName = this.options.packageName || runner.sanitizedCapabilities
        }
        const isCucumberFrameworkRunner = runner.config.framework === 'cucumber'
        if (isCucumberFrameworkRunner) {
            this._packageName = `CucumberJUnitReport-${this._packageName}`
            this._suiteTitleLabel = 'featureName'
            this._fileNameLabel = 'featureFile'
        } else {
            this._suiteTitleLabel = 'suiteName'
            this._fileNameLabel = 'file'
        }

        runner.specs.forEach((specFileName) => {
            if (isCucumberFrameworkRunner) {
                this._buildOrderedReport(builder, runner, specFileName, 'feature', isCucumberFrameworkRunner)
                this._buildOrderedReport(builder, runner, specFileName, 'scenario', isCucumberFrameworkRunner)
            } else {
                this._buildOrderedReport(builder, runner, specFileName, '', isCucumberFrameworkRunner)
            }
        })
        return builder.build() as unknown as string
    }

    private _buildOrderedReport(builder: JUnitReportBuilder, runner: RunnerStats, specFileName: string, type: string, isCucumberFrameworkRunner: boolean) {
        const suiteKeys = Object.keys(this.suites)

        if (suiteKeys.length === 0) {
            const error = this.runnerStat?.error ?? 'No tests found'
            /**
             * Because this function gets called twice for Cucumber, this conditional is to ensure that
             * Cucumber and Mocha generate the same Junit report for empty suites. Otherwise, Cucumber reporter
             * would generate two <testsuite>.
             */
            if (!isCucumberFrameworkRunner || (isCucumberFrameworkRunner && type === 'feature')) {
                return builder.testSuite().testCase().className('').name('').failure(error)
            }
        }

        for (const suiteKey of Object.keys(this.suites)) {
            /**
             * ignore root before all
             */
            /* istanbul ignore if  */
            if (suiteKey.match(/^"before all"/)) {
                continue
            }

            const suite = this.suites[suiteKey]
            const sameSpecFileName = this._sameFileName(specFileName, suite.file)
            if (isCucumberFrameworkRunner && suite.type === type && sameSpecFileName) {
                builder = this._addCucumberFeatureToBuilder(builder, runner, specFileName, suite)
            } else if (!isCucumberFrameworkRunner && sameSpecFileName) {
                builder = this._addSuiteToBuilder(builder, runner, specFileName, suite)
            }
        }
        return builder
    }

    private _getStandardOutput(test: TestStats) {
        let consoleOutput = ''
        if (this._addWorkerLogs) {
            consoleOutput = this._testToAdditionalInformation[test.uid]?.workerConsoleLog ?? ''
        }
        const commandText = this._getCommandStandardOutput(test)
        let result = ''
        if (consoleOutput !== '') {
            result += consoleOutput
        }
        if (commandText !== '' && consoleOutput !== '') {
            result += '\n...command output...\n\n'
        }
        result += commandText

        return result
    }

    private _getCommandStandardOutput(test: TestStats) {
        const standardOutput: string[] = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                standardOutput.push(
                    data.method
                        ? `COMMAND: ${data.method.toUpperCase()} ` +
                            `${data.endpoint.replace(':sessionId', data.sessionId)} - ${this._format(data.body)}`
                        : `COMMAND: ${data.command} - ${this._format(data.params)}`
                )
                break
            case 'result':
                standardOutput.push(`RESULT: ${this._format(data.body)}`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    private _format(val: any) {
        return JSON.stringify(limit(val))
    }

    private _sameFileName(file1?: string, file2?: string) {
        if (!file1 && !file2) {
            // both null -> same
            return true
        }
        if (!file1 || !file2) {
            // only one null -> not the same
            return false
        }

        // ensure both files are not a file URL
        file1 = file1.startsWith('file://') ? url.fileURLToPath(file1) : file1
        file2 = file2.startsWith('file://') ? url.fileURLToPath(file2) : file2

        return file1.localeCompare(file2, undefined, { sensitivity: this._isWindows ? 'accent' : 'variant' }) === 0
    }
}

export * from './common/api.js'
export default JunitReporter
