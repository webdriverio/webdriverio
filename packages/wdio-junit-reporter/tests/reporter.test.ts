import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TestStats } from '@wdio/reporter'

import WDIOJunitReporter from '../src/index.js'

import mochaRunnerLog from './__fixtures__/mocha-runner.json' assert { type: 'json' }
import cucumberRunnerLog from './__fixtures__/cucumber-runner.json' assert { type: 'json' }
import cucumberRunnerBrowserstackIosLog from './__fixtures__/cucumber-runner-browserstack-ios.json' assert { type: 'json' }
import cucumberRunnerBrowserstackAndroidLog from './__fixtures__/cucumber-runner-browserstack-android.json' assert { type: 'json' }
import cucumberRunnerBrowserstackAndroidLogMissingOS from './__fixtures__/cucumber-runner-browserstack-android-missing-os.json' assert { type: 'json' }
import suitesLog from './__fixtures__/suites.json' assert { type: 'json' }
import suitesWithNoErrorObjectLog from './__fixtures__/suites-with-no-error-object.json' assert { type: 'json' }
import featuresLog from './__fixtures__/cucumber-features.json' assert { type: 'json' }
import featuresWithFailingThenSkipStepLog from './__fixtures__/cucumber-features-with-failed-then-skipped-steps.json' assert { type: 'json' }
import featuresWithPendingStepLog from './__fixtures__/cucumber-features-with-pending-step.json' assert { type: 'json' }
import featuresWithErrorStepAndNoErrorObjectLog from './__fixtures__/cucumber-features-with-error-step-and-no-error-object.json' assert { type: 'json' }
import nestedSuites from './__fixtures__/nested-suites.json' assert { type: 'json' }
import unorderedFeatureAndScenarioWithError from './__fixtures__/cucumber-features-with-error-step-and-no-error-object-unordered.json' assert { type: 'json' }
import suitesWithFailedBeforeEachHookLog from './__fixtures__/suites-with-failed-before-each-hook.json' assert { type: 'json' }
import suitesWithFailedAfterEachHookLog from './__fixtures__/suites-with-failed-after-each-hook.json' assert { type: 'json' }
import suitesHooksLog from './__fixtures__/suites-hooks.json' assert { type: 'json' }
import suiteTestRetry from './__fixtures__/suite-test-retry.json' assert { type: 'json' }
import suitesMultipleLog from './__fixtures__/suites-multiple.json' assert { type: 'json' }
import suitesErrorLog from './__fixtures__/suites-error.json' assert { type: 'json' }

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

describe('wdio-junit-reporter', () => {
    let reporter: WDIOJunitReporter

    beforeEach(() => {
        reporter = new WDIOJunitReporter({ stdout: true })
    })

    it('should write to output stream on runnerEnd', () => {
        reporter['_buildJunitXml'] = vi.fn().mockReturnValue(undefined)
        reporter.write = vi.fn()
        reporter.onRunnerEnd({} as any)
        expect(vi.mocked(reporter.write).mock.calls[0][0]).toMatchSnapshot()
    })

    it('should prepare name', () => {
        expect(reporter['_prepareName']()).toMatchSnapshot()
        expect(reporter['_prepareName']('Chrome something_odd.foobar')).toMatchSnapshot()
        expect(reporter['_prepareName']('Chrome @something_odd.foobar')).toMatchSnapshot()
    })

    it('has a suiteNameFormat option for setting names manually', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: /foobar/ })
        expect(reporter['_prepareName']('Skipped_foobar_test')).toMatchSnapshot()
    })

    it('can format output', () => {
        expect(reporter['_format'](1)).toMatchSnapshot()
        expect(reporter['_format']({ a: 'foo', b: 'bar' })).toMatchSnapshot()
        expect(reporter['_format']({ a: 'foobar'.repeat(100) })).toMatchSnapshot()
        expect(reporter['_format']({ a: '@'.repeat(10000) })).toMatchSnapshot()
        expect(reporter['_format']({ a: '@'.repeat(100).split('') })).toMatchSnapshot()
        expect(reporter['_format']([...Array(11)].map((item, i) => i).reduce((a, b) => {
            a['entry' + b] = 'foobar'
            return a
        }, {} as Record<string, string>))).toBe('{"entry0":"foobar","entry1":"foobar","entry2":"foobar","entry3":"foobar","entry4":"foobar","entry5":"foobar","entry6":"foobar","entry7":"foobar","entry8":"foobar","entry9":"foobar","_":"1 more keys: [\\"entry10\\"]"}')
    })

    it('can translate stdout', () => {
        const teststats: TestStats = {
            output: [{
                cid: '123',
                type: 'command',
                method: 'POST',
                sessionId: 'foobar',
                endpoint: '/sessionId/click',
                body: { elementId: 'foobar' },
                command: 'getText',
                params: {},
                result: { value: 'some text' }
            }, {
                cid: '123',
                method: 'POST',
                sessionId: 'foobar',
                endpoint: '/sessionId/click',
                command: 'getText',
                params: {},
                result: { value: 'some text' },
                type: 'result',
                body: { value: 'foobar' }
            }]
        } as any as TestStats
        expect(reporter['_getStandardOutput'](teststats)).toContain('COMMAND: POST /sessionId/click - {"elementId":"foobar"}')
        expect(reporter['_getStandardOutput'](teststats)).toContain('RESULT: {"value":"foobar"}')
    })

    it('test is marked as skipped when is retried', () => {
        const testStats = new TestStats({
            type: 'test:start',
            uid: 'test-00-0',
            cid: '0-0',
            title: 'test',
            fullTitle: 'suite test',
            retries: 0,
            parent: 'suite',
            pending: false,
            specs: []
        })
        reporter['onTestRetry'](testStats)

        expect(testStats.state).toContain('skipped')
    })

    it('generates xml output', () => {
        reporter.suites = suitesLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style)', () => {
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style) (with packageName)', () => {
        reporter = new WDIOJunitReporter({ packageName: 'wdio-unit-tests', stdout: true })
        reporter.suites = featuresLog as any
        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step fails (Cucumber-style)', () => {
        reporter.suites = featuresWithFailingThenSkipStepLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON', () => {
        reporter.suites = suitesWithNoErrorObjectLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON (Cucumber-style)', () => {
        reporter.suites = featuresWithErrorStepAndNoErrorObjectLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('should build the xml if feature and scenario are unordered in JSON (Cucumber-style)', () => {
        reporter.suites = unorderedFeatureAndScenarioWithError as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('scenario will be marked skipped if a single scenario step is pending (Cucumber-style)', () => {
        reporter.suites = featuresWithPendingStepLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if before all hook failed', () => {
        reporter.suites = suitesHooksLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if before each hook failed', () => {
        reporter.suites = suitesWithFailedBeforeEachHookLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output if after each hook failed', () => {
        reporter.suites = suitesWithFailedAfterEachHookLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output for multiple describe blocks', () => {
        reporter.suites = suitesMultipleLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output when test is marked as skipped', () => {
        reporter.suites = suiteTestRetry as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when error options are set', () => {
        const errorOptions = {
            error: 'message',
            failure: 'message',
            stacktrace: 'stack'
        }

        reporter = new WDIOJunitReporter({ stdout: true, errorOptions })
        reporter.suites = suitesLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when error options are set (Cucumber-style)', () => {
        const errorOptions = {
            error: 'message',
            failure: 'message',
            stacktrace: 'stack'
        }

        reporter = new WDIOJunitReporter({ stdout: true, errorOptions })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for iOS apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackIosLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for Android apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackAndroidLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('ensures that capabilities passed to buildJunitXml are not null/undefined', () => {
        reporter = new WDIOJunitReporter({})
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackAndroidLogMissingOS as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output without ansi', () => {
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having nested suites', () => {
        reporter.suites = nestedSuites as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it( 'generates xml output correctly when having classNameFormat override with mocha',  () => {
        reporter = new WDIOJunitReporter({ stdout: true, classNameFormat: ({ packageName, suite }) => `foo-${packageName}-${suite!.fullTitle}` })
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having classNameFormat override with cucumber', () => {
        reporter = new WDIOJunitReporter({ stdout: true, classNameFormat: ({ packageName, activeFeatureName }) => `foo-${packageName}-${activeFeatureName}` })
        reporter.suites = featuresLog as any

        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it( 'generates xml output correctly when having testSuiteNameFormat override with mocha',  () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: ({ name, suite }) => `foo ${name} ${suite.title}` })
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having testSuiteNameFormat override with cucumber', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: ({ name, suite }) => `foo-${name}-${suite.title}` })
        reporter.suites = featuresLog as any

        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '')).toMatchSnapshot()
    })
})
