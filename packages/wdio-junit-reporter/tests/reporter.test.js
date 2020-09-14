import WDIOJunitReporter from '../src'

import mochaRunnerLog from './__fixtures__/mocha-runner.json'
import cucumberRunnerLog from './__fixtures__/cucumber-runner.json'
import cucumberRunnerBrowserstackIosLog from './__fixtures__/cucumber-runner-browserstack-ios.json'
import cucumberRunnerBrowserstackAndroidLog from './__fixtures__/cucumber-runner-browserstack-android.json'
import cucumberRunnerBrowserstackAndroidLogMissingOS from './__fixtures__/cucumber-runner-browserstack-android-missing-os.json'
import suitesLog from './__fixtures__/suites.json'
import suitesWithNoErrorObjectLog from './__fixtures__/suites-with-no-error-object.json'
import featuresLog from './__fixtures__/cucumber-features.json'
import featuresWithFailingThenSkipStepLog from './__fixtures__/cucumber-features-with-failed-then-skipped-steps.json'
import featuresWithPendingStepLog from './__fixtures__/cucumber-features-with-pending-step.json'
import featuresWithErrorStepAndNoErrorObjectLog from './__fixtures__/cucumber-features-with-error-step-and-no-error-object.json'
import suitesWithFailedBeforeEachHookLog from './__fixtures__/suites-with-failed-before-each-hook.json'
import suitesWithFailedAfterEachHookLog from './__fixtures__/suites-with-failed-after-each-hook.json'
import suitesHooksLog from './__fixtures__/suites-hooks.json'
import suitesMultipleLog from './__fixtures__/suites-multiple.json'

describe('wdio-junit-reporter', () => {
    let reporter

    beforeEach(() => {
        reporter = new WDIOJunitReporter({ stdout: true })
    })

    it('should write to output stream on runnerEnd', () => {
        reporter.buildJunitXml = jest.fn().mockReturnValue()
        reporter.write = jest.fn()
        reporter.onRunnerEnd()
        expect(reporter.write.mock.calls[0][0]).toMatchSnapshot()
    })

    it('should prepare name', () => {
        expect(reporter.prepareName()).toMatchSnapshot()
        expect(reporter.prepareName('Chrome something_odd.foobar')).toMatchSnapshot()
    })

    it('has a suiteNameFormat option for setting names manually', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: /foobar/ })
        expect(reporter.prepareName('Skipped_foobar_test')).toMatchSnapshot()
    })

    it('can format output', () => {
        expect(reporter.format()).toMatchSnapshot()
        expect(reporter.format(1)).toMatchSnapshot()
        expect(reporter.format({ a: 'foo', b: 'bar' })).toMatchSnapshot()
        expect(reporter.format({ a: 'foobar'.repeat(100) })).toMatchSnapshot()
        expect(reporter.format({ a: '@'.repeat(10000) })).toMatchSnapshot()
        expect(reporter.format({ a: '@'.repeat(100).split('') })).toMatchSnapshot()
        expect(reporter.format([...Array(11)].map((item, i) => i).reduce((a, b) => {
            a['entry' + b] = 'foobar'
            return a
        }, {}))).toBe('{"entry0":"foobar","entry1":"foobar","entry2":"foobar","entry3":"foobar","entry4":"foobar","entry5":"foobar","entry6":"foobar","entry7":"foobar","entry8":"foobar","entry9":"foobar","_":"1 more keys: [\\"entry10\\"]"}')
    })

    it('can translate stdout', () => {
        const output = [{
            type: 'command',
            method: 'POST',
            sessionId: 'foobar',
            endpoint: '/sessionId/click',
            body: { elementId: 'foobar' }
        }, {
            type: 'result',
            body: { value: 'foobar' }
        }]
        expect(reporter.getStandardOutput({ output })).toContain('COMMAND: POST /sessionId/click - {"elementId":"foobar"}')
        expect(reporter.getStandardOutput({ output })).toContain('RESULT: {"value":"foobar"}')
    })

    it('generates xml output', () => {
        reporter.suites = suitesLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style)', () => {
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style) (with packageName)', () => {
        reporter = new WDIOJunitReporter({ packageName: 'wdio-unit-tests', stdout: true })
        reporter.suites = featuresLog
        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step fails (Cucumber-style)', () => {
        reporter.suites = featuresWithFailingThenSkipStepLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON', () => {
        reporter.suites = suitesWithNoErrorObjectLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON (Cucumber-style)', () => {
        reporter.suites = featuresWithErrorStepAndNoErrorObjectLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked skipped if a single scenario step is pending (Cucumber-style)', () => {
        reporter.suites = featuresWithPendingStepLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if before all hook failed', () => {
        reporter.suites = suitesHooksLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if before each hook failed', () => {
        reporter.suites = suitesWithFailedBeforeEachHookLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if after each hook failed', () => {
        reporter.suites = suitesWithFailedAfterEachHookLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output for multiple describe blocks', () => {
        reporter.suites = suitesMultipleLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when error options are set', () => {
        const errorOptions = {
            error: 'message',
            failure: 'message',
            stacktrace: 'stack'
        }

        reporter = new WDIOJunitReporter({ stdout: true, errorOptions })
        reporter.suites = suitesLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when error options are set (Cucumber-style)', () => {
        const errorOptions = {
            error: 'message',
            failure: 'message',
            stacktrace: 'stack'
        }

        reporter = new WDIOJunitReporter({ stdout: true, errorOptions })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for iOS apps (with packageName)', () => {
        reporter = new WDIOJunitReporter({ packageName: 'wdio-unit-tests', stdout: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerBrowserstackIosLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for iOS apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerBrowserstackIosLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for Android apps (with packageName)', () => {
        reporter = new WDIOJunitReporter({ packageName: 'wdio-unit-test', stdout: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerBrowserstackAndroidLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for Android apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerBrowserstackAndroidLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('ensures that capabilities passed to buildJunitXml are not null/undefined', () => {
        reporter = new WDIOJunitReporter({})
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerBrowserstackAndroidLogMissingOS).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(mochaRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = featuresLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.buildJunitXml(cucumberRunnerLog).replace(/\s/g, '')).toMatchSnapshot()
    })
})
