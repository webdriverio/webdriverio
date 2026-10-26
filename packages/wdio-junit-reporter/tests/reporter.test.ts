import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TestStats } from '@wdio/reporter'

import WDIOJunitReporter, { addProperty } from '../src/index.js'
import type { SuiteStats } from '@wdio/reporter'

const mochaRunnerLog = (await vi.importActual('./__fixtures__/mocha-runner.json') as any).default
const mochaRunnerNestedArrayOfSuitesLog = (await vi.importActual('./__fixtures__/mocha-runner-nested-array-specs.json') as any).default
const cucumberRunnerLog = (await vi.importActual('./__fixtures__/cucumber-runner.json') as any).default
const cucumberRunnerMultiRemoteLog = (await vi.importActual('./__fixtures__/cucumber-runner-multiremote.json') as any).default
const cucumberRunnerBrowserstackIosLog = (await vi.importActual('./__fixtures__/cucumber-runner-browserstack-ios.json') as any).default
const cucumberRunnerBrowserstackAndroidLog = (await vi.importActual('./__fixtures__/cucumber-runner-browserstack-android.json') as any).default
const cucumberRunnerBrowserstackAndroidLogMissingOS = (await vi.importActual('./__fixtures__/cucumber-runner-browserstack-android-missing-os.json') as any).default
const suitesLog = (await vi.importActual('./__fixtures__/suites.json') as any).default
const suitesWithNoErrorObjectLog = (await vi.importActual('./__fixtures__/suites-with-no-error-object.json') as any).default
const featuresLog = (await vi.importActual('./__fixtures__/cucumber-features.json') as any).default
const featuresWithFailingThenSkipStepLog = (await vi.importActual('./__fixtures__/cucumber-features-with-failed-then-skipped-steps.json') as any).default
const featuresWithPendingStepLog = (await vi.importActual('./__fixtures__/cucumber-features-with-pending-step.json') as any).default
const featuresWithErrorStepAndNoErrorObjectLog = (await vi.importActual('./__fixtures__/cucumber-features-with-error-step-and-no-error-object.json') as any).default
const featuresWithFailedHooksLog = (await vi.importActual('./__fixtures__/cucumber-features-with-failed-hooks.json') as any).default
const featuresScenarioLevelLog = (await vi.importActual('./__fixtures__/cucumber-features-scenario-level.json') as any).default
const nestedSuites = (await vi.importActual('./__fixtures__/nested-suites.json') as any).default
const nestedArrayOfSuites = (await vi.importActual('./__fixtures__/nested-array-suites.json') as any).default
const unorderedFeatureAndScenarioWithError = (await vi.importActual('./__fixtures__/cucumber-features-with-error-step-and-no-error-object-unordered.json') as any).default
const suitesWithFailedBeforeEachHookLog = (await vi.importActual('./__fixtures__/suites-with-failed-before-each-hook.json') as any).default
const suitesWithFailedAfterEachHookLog = (await vi.importActual('./__fixtures__/suites-with-failed-after-each-hook.json') as any).default
const suitesHooksLog = (await vi.importActual('./__fixtures__/suites-hooks.json') as any).default
const suiteTestRetry = (await vi.importActual('./__fixtures__/suite-test-retry.json') as any).default
const suitesMultipleLog = (await vi.importActual('./__fixtures__/suites-multiple.json') as any).default
const suitesErrorLog = (await vi.importActual('./__fixtures__/suites-error.json') as any).default
const suiteEmpty = (await vi.importActual('./__fixtures__/suite-empty.json') as any).default

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

if (os.platform() === 'win32') {
    cucumberRunnerLog.specs = ['file:///C:/features/sample_feature.feature']
    cucumberRunnerMultiRemoteLog.specs = ['file:///C:/features/sample_feature.feature']
    mochaRunnerLog.specs = ['file:///C:/path/to/project/test/specs/sync.spec.js']
    mochaRunnerNestedArrayOfSuitesLog.specs = ['file:///C:/path/to/project/test/specs/sync_0.spec.js', 'file:///C:/path/to/project/test/specs/sync_1.spec.js']
    cucumberRunnerBrowserstackAndroidLogMissingOS.specs = ['file:///C:/features/sample_feature.feature']
    cucumberRunnerBrowserstackAndroidLog.specs = ['file:///C:/features/sample_feature.feature']
    cucumberRunnerBrowserstackIosLog.specs = ['file:///C:/features/sample_feature.feature']
    for (const fixture of [featuresLog, featuresWithPendingStepLog, unorderedFeatureAndScenarioWithError, featuresWithErrorStepAndNoErrorObjectLog, featuresWithFailingThenSkipStepLog, featuresScenarioLevelLog, featuresWithFailedHooksLog]) {
        for (const [, suite] of Object.entries(fixture) as any) {
            suite.file = 'C:\\features\\sample_feature.feature'
        }
    }

    for (const fixture of [suitesLog, suitesErrorLog, suitesHooksLog, suiteTestRetry, suitesMultipleLog, suitesWithFailedAfterEachHookLog, suitesWithFailedBeforeEachHookLog, suitesWithNoErrorObjectLog, nestedArrayOfSuites, nestedSuites, suiteEmpty]) {
        for (const [index, [, suite]] of Object.entries(Object.entries(fixture)) as any) {
            const specFileName = (fixture === nestedArrayOfSuites) ? `sync_${index}` : 'sync'
            suite.file = `C:\\path\\to\\project\\test\\specs\\${specFileName}.spec.js`
        }
    }
}

describe('wdio-junit-reporter', () => {
    let reporter: WDIOJunitReporter

    beforeEach(() => {
        reporter = new WDIOJunitReporter({ stdout: true })
    })

    function startTest (test: TestStats) {
        vi.spyOn(reporter, 'getContextTest').mockReturnValue(test)
        reporter.onTestStart(test)
    }

    it('should write to output stream on runnerEnd', () => {
        reporter.suites = suiteEmpty as any
        reporter.write = vi.fn()
        reporter.onRunnerEnd(mochaRunnerLog as any)
        const written = vi.mocked(reporter.write).mock.calls[0][0] as string
        expect(written).toContain('<?xml version="1.0" encoding="UTF-8"?>')
        expect(written).toContain('<testsuites')
        expect(written).not.toContain('<testcase')
    })

    it('adds the failed hooks of a suite as testcases, except those of a retried attempt', () => {
        const hook = (title: string, retried?: boolean) => ({ title, error: new Error('boom'), state: 'failed', _duration: 1, ...(retried && { retried }) })
        const suite = { tests: [], hooks: [hook('"before each" hook for "a"', true), hook('"before each" hook for "b"')] }
        const { tests } = reporter['_addFailedHooks'](suite as any)
        expect(tests.map(({ title }) => title)).toEqual(['"before each" hook for "b"'])
    })

    it('does not add a failed hook whose error is the failure of a test', () => {
        const hook = (title: string, failedTestUid?: string) => ({ title, error: new Error('boom'), state: 'failed', _duration: 1, ...(failedTestUid && { failedTestUid }) })
        const suite = { tests: [], hooks: [hook('"after each" hook for "a"', 'test-a'), hook('"after each" hook for "b"')] }
        const { tests } = reporter['_addFailedHooks'](suite as any)
        expect(tests.map(({ title }) => title)).toEqual(['"after each" hook for "b"'])
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
        } as unknown as TestStats
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
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style)', () => {
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style) with multi-remote (no framework in config)', () => {
        reporter.suites = featuresLog as any

        /**
         * In multi-remote mode, runner.config may come from browser.options which lacks the
         * `framework` key. The reporter must still detect Cucumber via suite type.
         * Steps should be grouped per scenario (1 testcase per scenario), not per step.
         */
        const output = reporter['_buildJunitXml'](cucumberRunnerMultiRemoteLog as any)
            .replace(/\s/g, '').replace(/C:\//g, '')

        // Should contain a testcase for the scenario (not for each step)
        expect(output).toContain('<testcaseclassname=')
        // The scenario should appear as <testcase name="Sample scenario"
        expect(output).toContain('name="Samplescenario"')
        // Steps should NOT be individual testcases - check no step title as testcase name
        expect(output).not.toContain('name="Givenstepha')
        expect(output).toMatchSnapshot()
    })

    describe('package of a multi-remote run', () => {
        const chrome = { browserName: 'chrome', browserVersion: '155.0.8059.85', platformName: 'mac' }
        const multiRemoteRunner = (extra: Record<string, unknown> = {}) => ({
            ...mochaRunnerLog,
            isMultiRemote: true,
            capabilities: { mrA: chrome, mrB: chrome },
            sanitizedCapabilities: '',
            ...extra
        })

        it('names each instance and its browser in the classname and the capabilities property', () => {
            reporter.suites = suitesLog as any
            const output = reporter['_buildJunitXml'](multiRemoteRunner() as any)
            const name = 'mrA-chrome_155_0_8059_85_mac+mrB-chrome_155_0_8059_85_mac'
            expect(output).toContain(`<property name="capabilities" value="${name}"/>`)
            expect(output).toContain(`classname="${name}.`)
            expect(output).not.toContain('classname=".')
        })

        it('names an instance without usable capabilities by its name only', () => {
            reporter.suites = suitesLog as any
            const output = reporter['_buildJunitXml'](multiRemoteRunner({ capabilities: { mrA: chrome, mrB: {} } }) as any)
            expect(output).toContain('value="mrA-chrome_155_0_8059_85_mac+mrB"/>')
        })

        it('keeps the packageName option first', () => {
            reporter.options.packageName = 'custom'
            reporter.suites = suitesLog as any
            const output = reporter['_buildJunitXml'](multiRemoteRunner() as any)
            expect(output).toContain('classname="custom.')
            expect(output).toContain('<property name="capabilities" value="mrA-chrome_155_0_8059_85_mac+mrB-chrome_155_0_8059_85_mac"/>')
        })

        it('keeps the Cucumber prefix', () => {
            reporter.suites = featuresLog as any
            const output = reporter['_buildJunitXml']({ ...cucumberRunnerMultiRemoteLog, capabilities: { mrA: chrome, mrB: chrome }, sanitizedCapabilities: '' } as any)
            expect(output).toContain('classname="CucumberJUnitReport-mrA-chrome_155_0_8059_85_mac+mrB-chrome_155_0_8059_85_mac.')
        })

        it('does not change the package of a single browser run', () => {
            reporter.suites = suitesLog as any
            const output = reporter['_buildJunitXml']({ ...mochaRunnerLog, isMultiRemote: false } as any)
            expect(output).toContain(`value="${mochaRunnerLog.sanitizedCapabilities}"`)
            expect(output).toContain(`classname="${mochaRunnerLog.sanitizedCapabilities}.`)
        })
    })

    it('generates xml output (Cucumber-style) with cucumberOpts.scenarioLevelReporter', () => {
        reporter.suites = featuresScenarioLevelLog as any

        /**
         * When `cucumberOpts.scenarioLevelReporter` is true, cucumber-framework reports
         * whole scenarios as tests directly on the feature suite (no separate `scenario`
         * suite is emitted). The junit report must still register a <testcase> per scenario.
         */
        const output = reporter['_buildJunitXml'](cucumberRunnerLog as any)
            .replace(/\s/g, '').replace(/C:\//g, '')

        expect(output).toContain('tests="3"')
        expect(output).toContain('name="Samplescenario"')
        expect(output).toContain('name="Samplescenariowithfailure"')
        expect(output).toContain('name="Samplescenariowithpendingstep"')
        expect(output).toContain('<skipped')
        expect(output).toMatchSnapshot()
    })

    it('generates xml output (Cucumber-style) (with packageName)', () => {
        reporter = new WDIOJunitReporter({ packageName: 'wdio-unit-tests', stdout: true })
        reporter.suites = featuresLog as any
        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('reports failed Cucumber hooks as failures of the scenario', () => {
        // the report adds the failed hooks to the steps, keep the fixture as it is for the next test
        reporter.suites = JSON.parse(JSON.stringify(featuresWithFailedHooksLog))

        const output = reporter['_buildJunitXml'](cucumberRunnerLog as any)
        expect(output).toContain('<testsuites tests="1" failures="1" errors="0" skipped="0">')
        expect(output).toContain('<failure message="Error: After hook failed"/>')
        expect(output).not.toContain('<skipped/>')
        // unnamed hooks get a title, hooks that ran before the steps come first
        const stdout = output.slice(output.indexOf('<system-out>'))
        expect(stdout.indexOf('❗ Before hook')).toBeGreaterThan(-1)
        expect(stdout.indexOf('❗ Before hook')).toBeLessThan(stdout.indexOf('Given a passing step'))
        expect(stdout.indexOf('❗ After hook')).toBeGreaterThan(stdout.indexOf('Given a passing step'))
        // passing hooks are not added
        expect(stdout.match(/❗/g)).toHaveLength(2)
    })

    it('places failed Cucumber hooks by their start time if the order was not recorded', () => {
        const suites = JSON.parse(JSON.stringify(featuresWithFailedHooksLog))
        const scenario = suites['hooks-scenario']
        expect(scenario.tests.map((test: { title: string }) => test.title)).toEqual(['Given a passing step'])
        scenario.hooksAndTests = []
        scenario.hooks[1].start = '2026-10-22T18:00:00.015Z'
        reporter.suites = suites

        const output = reporter['_buildJunitXml'](cucumberRunnerLog as any)
        const stdout = output.slice(output.indexOf('<system-out>'))
        expect(stdout.indexOf('❗ Before hook')).toBeLessThan(stdout.indexOf('Given a passing step'))
        expect(stdout.indexOf('❗ After hook')).toBeGreaterThan(stdout.indexOf('Given a passing step'))
    })

    it('scenario will be marked failed if a single scenario step fails (Cucumber-style)', () => {
        reporter.suites = featuresWithFailingThenSkipStepLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON', () => {
        reporter.suites = suitesWithNoErrorObjectLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('scenario will be marked failed if a single scenario step throws an error but there is no error object in JSON (Cucumber-style)', () => {
        reporter.suites = featuresWithErrorStepAndNoErrorObjectLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('should build the xml if feature and scenario are unordered in JSON (Cucumber-style)', () => {
        reporter.suites = unorderedFeatureAndScenarioWithError as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('scenario will be marked skipped if a single scenario step is pending (Cucumber-style)', () => {
        reporter.suites = featuresWithPendingStepLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output if before all hook failed', () => {
        reporter.suites = suitesHooksLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output if before each hook failed', () => {
        reporter.suites = suitesWithFailedBeforeEachHookLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output if after each hook failed', () => {
        reporter.suites = suitesWithFailedAfterEachHookLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output for multiple describe blocks', () => {
        reporter.suites = suitesMultipleLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output when test is marked as skipped', () => {
        reporter.suites = suiteTestRetry as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
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
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
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
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for iOS apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackIosLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output with correct information when test is ran against Browserstack for Android apps', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackAndroidLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('ensures that capabilities passed to buildJunitXml are not null/undefined', () => {
        reporter = new WDIOJunitReporter({})
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerBrowserstackAndroidLogMissingOS as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = suitesLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when the addFileAttribute option is set (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = featuresLog as any

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output without ansi', () => {
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having nested suites', () => {
        reporter.suites = nestedSuites as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having nested array of suites', () => {
        reporter.suites = nestedArrayOfSuites as any
        expect(reporter['_buildJunitXml'](mochaRunnerNestedArrayOfSuitesLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having classNameFormat override with mocha', () => {
        reporter = new WDIOJunitReporter({ stdout: true, classNameFormat: ({ packageName, suite }) => `foo-${packageName}-${suite!.fullTitle}` })
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having classNameFormat override with cucumber', () => {
        reporter = new WDIOJunitReporter({ stdout: true, classNameFormat: ({ packageName, activeFeatureName }) => `foo-${packageName}-${activeFeatureName}` })
        reporter.suites = featuresLog as any

        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace('C:/', '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having testSuiteNameFormat override with mocha', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: ({ name, suite }) => `foo ${name} ${suite.title}` })
        reporter.suites = suitesErrorLog as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace('file://', '').replace('C:/', '')).toMatchSnapshot()
    })

    it('generates xml output correctly when having testSuiteNameFormat override with cucumber', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: ({ name, suite }) => `foo-${name}-${suite.title}` })
        reporter.suites = featuresLog as any

        expect(reporter['_buildJunitXml'](cucumberRunnerLog as any).replace(/\s/g, '').replace('C:/', '')).toMatchSnapshot()
    })

    it('generates xml output correctly with empty suite', () => {
        reporter.suites = suiteEmpty as any
        expect(reporter['_buildJunitXml'](mochaRunnerLog as any).replace(/\s/g, '').replace(/file:\/\//g, '').replace(/C:\//g, '')).toMatchSnapshot()
    })

    it('_sameFileName - case independent on win32', function (context) {
        if (os.platform() !== 'win32') {
            context.skip()
        }
        expect(reporter['_sameFileName']('file:///C:/foo/bar', 'file:///C:/foo/bar')).toBeTruthy()
        expect(reporter['_sameFileName']('file:///c:/foo/bar', 'file:///C:/foo/bar')).toBeTruthy()
        expect(reporter['_sameFileName']('file:///c:/foo/bar', 'C:\\foo\\bar')).toBeTruthy()
        expect(reporter['_sameFileName']('file:///C:/foo/bar', 'c:\\foo\\bar')).toBeTruthy()
        expect(reporter['_sameFileName']('file:///C:/foo/bar', 'C:\\FOO\\bar')).toBeTruthy()
        expect(reporter['_sameFileName']('file:///c:/foo/bar', 'C:\\bar\\foo')).toBeFalsy()
    })

    it('_sameFileName - case sensitive on everything except win32', function (context) {
        if (os.platform() === 'win32') {
            context.skip()
        }
        expect(reporter['_sameFileName']('file:///foo/bar', 'file:///Foo/bar')).toBeFalsy()
        expect(reporter['_sameFileName']('file:///foo/bar', '/Foo/bar')).toBeFalsy()
    })

    it('_sameFileName', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        const file1URL = os.platform() === 'win32' ? 'file:///C:/foo/bar' : 'file:///foo/bar'
        const file1Path = os.platform() === 'win32' ? 'C:\\foo\\bar' : '/foo/bar'
        const file2URL = os.platform() === 'win32' ? 'file:///C:/bar/foo' : 'file:///bar/foo'
        const file2Path = os.platform() === 'win32' ? 'C:\\bar\\foo' : '/bar/foo'
        expect(reporter['_sameFileName'](file1URL, file1URL)).toBeTruthy()
        expect(reporter['_sameFileName'](file1URL, file1Path)).toBeTruthy()
        expect(reporter['_sameFileName'](file1Path, file1URL)).toBeTruthy()
        expect(reporter['_sameFileName'](file1Path, file1Path)).toBeTruthy()
        expect(reporter['_sameFileName'](file1URL, file2URL)).toBeFalsy()
        expect(reporter['_sameFileName'](file1URL, file2Path)).toBeFalsy()
        expect(reporter['_sameFileName'](file1Path, file2URL)).toBeFalsy()
        expect(reporter['_sameFileName'](file1Path, file2Path)).toBeFalsy()
        expect(reporter['_sameFileName'](undefined, file1URL)).toBeFalsy()
        expect(reporter['_sameFileName'](undefined, file1Path)).toBeFalsy()
        expect(reporter['_sameFileName'](file1URL, undefined)).toBeFalsy()
        expect(reporter['_sameFileName'](file1Path, undefined)).toBeFalsy()
        expect(reporter['_sameFileName'](undefined, undefined)).toBeTruthy()
    })

    it('_sameFileName - compares basenames when one path is just a filename (issue #13052)', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        const fullPath = os.platform() === 'win32'
            ? 'C:\\path\\to\\project\\test\\specs\\spec.js'
            : '/path/to/project/test/specs/spec.js'
        const filenameOnly = 'spec.js'
        const differentFilename = 'other.js'

        // Jasmine provides only filenames while the runner has full paths
        expect(reporter['_sameFileName'](fullPath, filenameOnly)).toBeTruthy()
        expect(reporter['_sameFileName'](filenameOnly, fullPath)).toBeTruthy()
        expect(reporter['_sameFileName'](fullPath, differentFilename)).toBeFalsy()
        expect(reporter['_sameFileName'](differentFilename, fullPath)).toBeFalsy()
        expect(reporter['_sameFileName'](filenameOnly, filenameOnly)).toBeTruthy()
        expect(reporter['_sameFileName'](filenameOnly, differentFilename)).toBeFalsy()
        // Two distinct full paths that share a basename are not the same file
        const otherFullPath = os.platform() === 'win32'
            ? 'C:\\path\\to\\project\\test\\other\\spec.js'
            : '/path/to/project/test/other/spec.js'
        expect(reporter['_sameFileName'](fullPath, otherFullPath)).toBeFalsy()
    })

    it('generates xml output when suite.file is a filename only (Jasmine, issue #13052)', () => {
        const suites = JSON.parse(JSON.stringify(suitesLog))
        for (const suite of Object.values(suites) as SuiteStats[]) {
            suite.file = 'sync.spec.js'
        }
        reporter.suites = suites as any

        const xml = reporter['_buildJunitXml'](mochaRunnerLog as any)
        expect(xml).toContain('should can do something')
        expect(xml).toContain('testsuite')
        expect(xml).not.toMatch(/<testsuites\s*\/>/)
        // Unique basename → safe to report the full runner spec path
        expect(xml).toContain('test/specs/sync.spec.js')
    })

    it('does not duplicate suites when grouped specs share a basename (issue #13052)', () => {
        const isWin = os.platform() === 'win32'
        const desktopSpec = isWin
            ? 'C:\\path\\to\\project\\test\\desktop\\spec.js'
            : '/path/to/project/test/desktop/spec.js'
        const mobileSpec = isWin
            ? 'C:\\path\\to\\project\\test\\mobile\\spec.js'
            : '/path/to/project/test/mobile/spec.js'
        const uniqueSpec = isWin
            ? 'C:\\path\\to\\project\\test\\specs\\unique.spec.js'
            : '/path/to/project/test/specs/unique.spec.js'

        const makeSuite = (uid: string, title: string, testTitle: string, file: string): SuiteStats => ({
            type: 'suite',
            start: new Date('2018-04-17T09:10:10.255Z'),
            end: new Date('2018-04-17T09:10:10.355Z'),
            _duration: 100,
            uid,
            cid: '0-0',
            file,
            title,
            fullTitle: title,
            tests: [{
                type: 'test',
                start: new Date('2018-04-17T09:10:10.256Z'),
                end: new Date('2018-04-17T09:10:10.306Z'),
                _duration: 50,
                uid: `${uid}-test`,
                cid: '0-0',
                title: testTitle,
                fullTitle: `${title} ${testTitle}`,
                state: 'passed',
                output: [],
                retries: 0
            }] as any,
            hooks: [],
            suites: [],
            hooksAndTests: []
        } as SuiteStats)

        reporter = new WDIOJunitReporter({ stdout: true, addFileAttribute: true })
        reporter.suites = {
            'Desktop suite': makeSuite('desktop-suite', 'Desktop suite', 'desktop test', 'spec.js'),
            'Mobile suite': makeSuite('mobile-suite', 'Mobile suite', 'mobile test', 'spec.js'),
            'Unique suite': makeSuite('unique-suite', 'Unique suite', 'unique test', 'unique.spec.js')
        } as any

        const runner = {
            ...mochaRunnerLog,
            specs: [desktopSpec, mobileSpec, uniqueSpec]
        }

        const xml = reporter['_buildJunitXml'](runner as any)
        expect(xml.match(/name="desktop test"/g)).toHaveLength(1)
        expect(xml.match(/name="mobile test"/g)).toHaveLength(1)
        expect(xml.match(/name="unique test"/g)).toHaveLength(1)
        expect(xml.match(/<testsuite /g)).toHaveLength(3)
        // Ambiguous basename → do not attribute those suites to a specific full path
        const reportedFiles = [...xml.matchAll(/<property name="file" value="([^"]+)"/g)].map((match) => match[1])
        expect(reportedFiles.filter((file) => file === 'spec.js')).toHaveLength(2)
        expect(reportedFiles.some((file) => file.includes('unique.spec.js'))).toBe(true)
        expect(reportedFiles.some((file) => file.includes(`${isWin ? 'desktop\\' : 'desktop/'}spec.js`))).toBe(false)
        expect(reportedFiles.some((file) => file.includes(`${isWin ? 'mobile\\' : 'mobile/'}spec.js`))).toBe(false)
        // <testcase file> follows the same attribution rules
        const testCaseFiles = [...xml.matchAll(/<testcase [^>]*file="([^"]+)"/g)].map((match) => match[1])
        expect(testCaseFiles.filter((file) => file === 'spec.js')).toHaveLength(2)
        expect(testCaseFiles.some((file) => file.includes('unique.spec.js'))).toBe(true)
    })

    it('_suiteFileAssociation - unique only when the basename maps to one spec', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        const desktopSpec = os.platform() === 'win32'
            ? 'C:\\path\\to\\project\\test\\desktop\\spec.js'
            : '/path/to/project/test/desktop/spec.js'
        const mobileSpec = os.platform() === 'win32'
            ? 'C:\\path\\to\\project\\test\\mobile\\spec.js'
            : '/path/to/project/test/mobile/spec.js'

        expect(reporter['_suiteFileAssociation'](desktopSpec, 'spec.js', [desktopSpec])).toBe('unique')
        expect(reporter['_suiteFileAssociation'](desktopSpec, 'spec.js', [desktopSpec, mobileSpec])).toBe('ambiguous')
        expect(reporter['_suiteFileAssociation'](mobileSpec, 'spec.js', [desktopSpec, mobileSpec])).toBe('ambiguous')
        expect(reporter['_suiteFileAssociation'](desktopSpec, desktopSpec, [desktopSpec, mobileSpec])).toBe('unique')
        expect(reporter['_suiteFileAssociation'](desktopSpec, 'other.js', [desktopSpec, mobileSpec])).toBe('none')
    })

    it('addWorkerLogs: should add worker console log to report for test if activated', () => {
        const originalWrite = process.stdout.write
        try {
            reporter = new WDIOJunitReporter({ stdout: true, addWorkerLogs: true })
            const suite = Object.values(suitesLog)[0] as SuiteStats
            reporter.onSuiteStart(suite)
            const test1 = suite.tests[0]
            const test2 = suite.tests[1]
            startTest(test1)
            process.stdout.write('0 - line 0')
            process.stdout.write('0 - line 1')
            reporter.onTestPass(test1)
            startTest(test2)
            process.stdout.write('1 - line 0')
            process.stdout.write('1 - line 1')
            reporter.onTestPass(suite.tests[0])
            expect(reporter['_getStandardOutput'](test1).toString()).toContain('0 - line 1')
            expect(reporter['_getStandardOutput'](test2).toString()).toContain('1 - line 1')

            expect(reporter['_getStandardOutput'](test1).toString()).not.toContain('1 - line 1')
            expect(reporter['_getStandardOutput'](test2).toString()).not.toContain('0 - line 1')
        } finally {
            process.stdout.write = originalWrite
        }
    })

    it('attributes properties and worker logs to the test owning the context, not the last started one', () => {
        const originalWrite = process.stdout.write
        try {
            reporter = new WDIOJunitReporter({ stdout: true, addWorkerLogs: true })
            const suite = Object.values(suitesLog)[0] as SuiteStats
            const [testA, testB] = suite.tests
            reporter.onTestStart(testA)
            reporter.onTestStart(testB)
            const contextTest = vi.spyOn(reporter, 'getContextTest')

            contextTest.mockReturnValue(testA)
            process.emit('junit:addProperty' as any, { name: 'a-prop', value: 'a-value' } as any)
            process.stdout.write('a-log')

            contextTest.mockReturnValue(testB)
            process.emit('junit:addProperty' as any, { name: 'b-prop', value: 'b-value' } as any)
            process.stdout.write('b-log')

            contextTest.mockReturnValue(undefined)
            process.emit('junit:addProperty' as any, { name: 'orphan-prop', value: 'x' } as any)
            process.stdout.write('orphan-log')

            const infoA = reporter['_testToAdditionalInformation'][testA.uid]
            const infoB = reporter['_testToAdditionalInformation'][testB.uid]
            expect(infoA.properties).toEqual({ 'a-prop': 'a-value' })
            expect(infoB.properties).toEqual({ 'b-prop': 'b-value' })
            expect(infoA.workerConsoleLog).toBe('a-log')
            expect(infoB.workerConsoleLog).toBe('b-log')

            reporter.suites = suitesLog as any
            const output = reporter['_buildJunitXml'](mochaRunnerLog).toString()
            expect(output).toContain('a-prop')
            expect(output).toContain('b-prop')
            expect(output).not.toContain('orphan')
        } finally {
            process.stdout.write = originalWrite
        }
    })

    it('attributes properties emitted on the reporter instance to the current test', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        const [testA] = (Object.values(suitesLog)[0] as SuiteStats).tests
        reporter.onTestStart(testA)
        vi.spyOn(reporter, 'getContextTest').mockReturnValue(testA)

        reporter.emit('junit:addProperty', { name: 'a-prop', value: 'a-value' })

        expect(reporter['_testToAdditionalInformation'][testA.uid].properties).toEqual({ 'a-prop': 'a-value' })
    })

    it('skips attribution for a context test that never started, e.g. a skipped test', () => {
        const originalWrite = process.stdout.write
        try {
            reporter = new WDIOJunitReporter({ stdout: true, addWorkerLogs: true })
            const passThrough = vi.fn()
            reporter['_originalStdoutWrite'] = passThrough
            const skipped = (Object.values(suitesLog)[0] as SuiteStats).tests[0]
            vi.spyOn(reporter, 'getContextTest').mockReturnValue(skipped)

            expect(() => addProperty('skipped-prop', 'x')).not.toThrow()
            expect(() => process.stdout.write('skipped-log')).not.toThrow()

            expect(passThrough).toHaveBeenCalledWith('skipped-log', undefined, undefined)
            expect(reporter['_testToAdditionalInformation'][skipped.uid]).toBeUndefined()
        } finally {
            process.stdout.write = originalWrite
        }
    })

    it('addWorkerLogs: writes each Cucumber step on its own line, followed by its output (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true, addWorkerLogs: true })
        reporter.suites = featuresLog as any
        reporter['_testToAdditionalInformation']['step has passed6'] = {
            uid: 'step has passed6',
            workerConsoleLog: 'output of the first step',
            properties: {}
        }

        const output = reporter['_buildJunitXml'](cucumberRunnerLog as any).toString()
        const systemOut = /<system-out><!\[CDATA\[([\s\S]*?)\]\]><\/system-out>/.exec(output)?.[1]
        expect(systemOut).toBe([
            '',
            '✅ Given step has passed',
            'output of the first step',
            '✅ When step has passed',
            '❗ Then step has failed',
            '',
            ''
        ].join('\n'))
    })

    it('addProperty adds a property to currently running testcase', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = suitesLog as any
        const suite = Object.values(suitesLog)[0] as SuiteStats
        reporter.onSuiteStart(suite)
        const test1 = suite.tests[0]
        const test2 = suite.tests[1]
        startTest(test1)
        addProperty('0-prop1', '0-value')
        reporter.onTestPass(test1)
        startTest(test2)
        addProperty('1-prop1', '1-value')
        reporter.onTestPass(suite.tests[0])
        const output = reporter['_buildJunitXml'](mochaRunnerLog).toString()
        expect(output).toContain('<property name="0-prop1" value="0-value"/>')
        expect(output).toContain('<property name="1-prop1" value="1-value"/>')
    })

    it('addProperty adds properties to Cucumber steps in scenarios (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true })
        reporter.suites = featuresLog as any

        // Get the scenario suite which contains steps
        const featureSuite = Object.values(featuresLog)[0] as SuiteStats
        const scenarioSuite = featureSuite.suites![0] as SuiteStats

        // Get individual steps from the scenario
        const step1 = scenarioSuite.tests[0]
        const step2 = scenarioSuite.tests[1]
        const step3 = scenarioSuite.tests[2]

        // Simulate adding properties to each step during test execution
        startTest(step1)
        addProperty('step1-prop', 'step1-value')
        addProperty('common-prop', 'common-value-1')
        reporter.onTestPass(step1)

        startTest(step2)
        addProperty('step2-prop', 'step2-value')
        reporter.onTestPass(step2)

        startTest(step3)
        addProperty('step3-prop', 'step3-value')
        addProperty('common-prop', 'common-value-3')
        reporter.onTestPass(step3)

        // Build the XML and verify all properties are included
        const output = reporter['_buildJunitXml'](cucumberRunnerLog).toString()

        // Verify step-specific properties are present
        expect(output).toContain('<property name="step1-prop" value="step1-value"/>')
        expect(output).toContain('<property name="step2-prop" value="step2-value"/>')
        expect(output).toContain('<property name="step3-prop" value="step3-value"/>')

        // Verify properties with same name from different steps are both included
        expect(output).toContain('<property name="common-prop" value="common-value-1"/>')
        expect(output).toContain('<property name="common-prop" value="common-value-3"/>')
    })

    it('handles undefined steps gracefully when adding properties (Cucumber-style)', () => {
        reporter = new WDIOJunitReporter({ stdout: true })

        // Create a modified feature log with an 'undefined' step
        const modifiedFeaturesLog = JSON.parse(JSON.stringify(featuresLog))
        const featureSuite = Object.values(modifiedFeaturesLog)[0] as SuiteStats
        const scenarioSuite = featureSuite.suites![0] as SuiteStats

        // Add an 'undefined' key to the tests object
        (scenarioSuite.tests as any)['undefined'] = {
            type: 'test',
            uid: 'undefined-step',
            title: 'undefined step'
        }

        reporter.suites = modifiedFeaturesLog as any

        // Add a property to a valid step
        const validStep = scenarioSuite.tests[0]
        startTest(validStep)
        addProperty('valid-prop', 'valid-value')
        reporter.onTestPass(validStep)

        // Build the XML - should not throw and should include the valid property
        const output = reporter['_buildJunitXml'](cucumberRunnerLog).toString()
        expect(output).toContain('<property name="valid-prop" value="valid-value"/>')
    })
})
