import junit from 'junit-report-builder'
import WDIOReporter from '@wdio/reporter'
import { limit } from './utils'

/**
 * Reporter that converts test results from a single instance/runner into an XML JUnit report. This class
 * uses junit-report-builder (https://github.com/davidparsson/junit-report-builder) to build report.The report
 * generated from this reporter should conform to the standard JUnit report schema
 * (https://github.com/junit-team/junit5/blob/master/platform-tests/src/test/resources/jenkins-junit.xsd).
 */
class JunitReporter extends WDIOReporter {
    constructor (options) {
        super(options)
        this.suiteNameRegEx = this.options.suiteNameFormat instanceof RegExp
            ? this.options.suiteNameFormat
            : /[^a-zA-Z0-9]+/
    }

    onRunnerEnd (runner) {
        const xml = this.prepareXml(runner)
        this.write(xml)
    }

    prepareName (name = 'Skipped test') {
        return name.split(this.suiteNameRegEx).filter(
            (item) => item && item.length
        ).join('_')
    }

    prepareXml (runner) {
        const builder = junit.newBuilder()
        const packageName = this.options.packageName
            ? `${runner.sanitizedCapabilities}-${this.options.packageName}`
            : runner.sanitizedCapabilities

        for (let suiteKey of Object.keys(this.suites)) {
            /**
             * ignore root before all
             */
            /* istanbul ignore if  */
            if (suiteKey.match(/^"before all"/)) {
                continue
            }

            // there should only be one spec file per runner so we can safely take the first element of the array
            const specFileName = runner.specs[0]
            const suite = this.suites[suiteKey]
            const suiteName = this.prepareName(suite.title)
            const testSuite = builder.testSuite()
                .name(suiteName)
                .timestamp(suite.start)
                .time(suite._duration / 1000)
                .property('specId', 0)
                .property('suiteName', suite.title)
                .property('capabilities', runner.sanitizedCapabilities)
                .property('file', specFileName.replace(process.cwd(), '.'))

            /**
             * Add failed before and after all hooks to suite as tests.
             */
            const failedHooks = suite.hooks.filter(hook => hook.error && (hook.title === '"before all" hook' || hook.title === '"after all" hook'))
            failedHooks.forEach(hook => {
                const { title, _duration, error, state } = hook
                suite.tests.push({
                    _duration,
                    title,
                    error,
                    state,
                    output: []
                })
            })

            for (let testKey of Object.keys(suite.tests)) {
                if (testKey !== 'undefined') { // fix cucumber hooks crashing reporter
                    const test = suite.tests[testKey]
                    const testName = this.prepareName(test.title)
                    const testCase = testSuite.testCase()
                        .className(`${packageName}.${suiteName}`)
                        .name(testName)
                        .time(test._duration / 1000)

                    if (test.state === 'pending' || test.state === 'skipped') {
                        testCase.skipped()
                    } else if (test.state === 'failed') {
                        if (test.error) {
                            if (this.options.errorOptions) {
                                const errorOptions = this.options.errorOptions
                                for (const key of Object.keys(errorOptions)) {
                                    testCase[key](test.error[errorOptions[key]])
                                }
                            } else {
                                // default
                                testCase.error(test.error.message)
                            }
                            testCase.standardError(`\n${test.error.stack}\n`)
                        } else {
                            testCase.error()
                        }
                    }

                    const output = this.getStandardOutput(test)
                    if (output) testCase.standardOutput(`\n${output}\n`)
                }
            }
        }

        return builder.build()
    }

    getStandardOutput (test) {
        let standardOutput = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                standardOutput.push(
                    `COMMAND: ${data.method.toUpperCase()} ` +
                    `${data.endpoint.replace(':sessionId', data.sessionId)} - ${this.format(data.body)}`
                )
                break
            case 'result':
                standardOutput.push(`RESULT: ${this.format(data.body)}`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    format (val) {
        return JSON.stringify(limit(val))
    }
}

export default JunitReporter
