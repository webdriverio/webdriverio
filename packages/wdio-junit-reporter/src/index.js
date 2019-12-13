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
        const xml = this.buildJunitXml(runner)
        this.write(xml)
    }

    prepareName (name = 'Skipped test') {
        return name.split(this.suiteNameRegEx).filter(
            (item) => item && item.length
        ).join('_')
    }

    addFailedHooks(suite) {
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
        return suite
    }

    addCucumberFeatureToBuilder(builder, runner, specFileName, suite) {
        const featureName = this.prepareName(suite.title)
        if (suite.type === 'feature') {
            const feature = builder.testSuite()
                .name(featureName)
                .timestamp(suite.start)
                .time(suite._duration / 1000)
                .property('specId', 0)
                .property(this.suiteTitleLabel, suite.title)
                .property('capabilities', runner.sanitizedCapabilities)
                .property(this.fileNameLabel, specFileName.replace(process.cwd(), '.'))
            this.activeFeature = feature
            this.activeFeatureName = featureName
        } else if (this.activeFeature) {
            let scenario = suite
            const testName = this.prepareName(suite.title)

            let testCase = this.activeFeature.testCase()
                .className(`${this.packageName}.${this.activeFeatureName}`)
                .name(`${this.activeFeatureName}.${testName}`)
                .time(scenario._duration / 1000)

            scenario = this.addFailedHooks(scenario)

            let stepsOutput = ''
            let isFailing = false
            for (let stepKey of Object.keys(scenario.tests)) { // tests are trested as steps in Cucumber
                if (stepKey !== 'undefined') { // fix cucumber hooks crashing reporter
                    let stepEmoji = '✅'
                    const steps = scenario.tests[stepKey]
                    if (scenario.state === 'pending' || scenario.state === 'skipped') {
                        if (!isFailing) {
                            testCase.skipped()
                        }
                        stepEmoji = '⚠️'
                    } else if (scenario.state === 'failed') {
                        if (scenario.error) {
                            if (this.options.errorOptions) {
                                const errorOptions = this.options.errorOptions
                                for (const key of Object.keys(errorOptions)) {
                                    testCase[key](scenario.error[errorOptions[key]])
                                }
                            } else {
                                // default
                                testCase.error(scenario.error.message)
                            }
                            testCase.standardError(`\n${scenario.error.stack}\n`)
                        } else {
                            testCase.error()
                        }
                        isFailing = true
                        stepEmoji = '❗'
                    }
                    const output = this.getStandardOutput(steps)
                    stepsOutput += output ? stepEmoji + ' ' + scenario.title : stepEmoji + ' ' + scenario.title + '\n' + output
                }
            }
            testCase.standardOutput(`\n${stepsOutput}\n`)
        }
        return builder
    }

    addSuiteToBuilder(builder, runner, specFileName, suite) {
        const suiteName = this.prepareName(suite.title)
        let testSuite = builder.testSuite()
            .name(suiteName)
            .timestamp(suite.start)
            .time(suite._duration / 1000)
            .property('specId', 0)
            .property(this.suiteTitleLabel, suite.title)
            .property('capabilities', runner.sanitizedCapabilities)
            .property(this.fileNameLabel, specFileName.replace(process.cwd(), '.'))

        suite = this.addFailedHooks(suite)

        for (let testKey of Object.keys(suite.tests)) {
            if (testKey !== 'undefined') { // fix cucumber hooks crashing reporter (INFO: we may not need this anymore)
                const test = suite.tests[testKey]
                const testName = this.prepareName(test.title)
                const testCase = testSuite.testCase()
                    .className(`${this.packageName}.${suiteName}`)
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
        return builder
    }

    buildJunitXml (runner) {
        let builder = junit.newBuilder()

        this.packageName = this.options.packageName ? `${runner.sanitizedCapabilities}-${this.options.packageName}` : runner.sanitizedCapabilities

        this.isCucumberFrameworkRunner = runner.config.framework === 'cucumber'
        if (this.isCucumberFrameworkRunner) {
            this.packageName = `CucumberJUnitReport-${this.packageName}`
            this.suiteTitleLabel = 'featureName'
            this.fileNameLabel = 'featureFile'
        } else {
            this.suiteTitleLabel = 'suiteName'
            this.fileNameLabel = 'file'
        }

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

            if (this.isCucumberFrameworkRunner) {
                builder = this.addCucumberFeatureToBuilder(builder, runner, specFileName, suite)
            } else {
                builder = this.addSuiteToBuilder(builder, runner, specFileName, suite)
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
