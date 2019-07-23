import { directory } from 'tempy'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults } from 'wdio-allure-helper'

import AllureReporter from '../src/'
import { runnerEnd, runnerStart } from './__fixtures__/runner'
import * as cucumberHelper from './__fixtures__/cucumber'
import { commandStart, commandEnd } from './__fixtures__/command'

let processOn
beforeAll(() => {
    processOn = ::process.on
    process.on = jest.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('reporter option "useCucumberStepReporter" set to true', () => {

    describe('Passing tests', () => {
        const outputDir = directory()
        let allureXml

        beforeAll(() => {
            const reporter = new AllureReporter({ stdout: true, outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestPass(cucumberHelper.testPass())
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd())
            reporter.onSuiteEnd(cucumberHelper.featureEnd())
            reporter.onRunnerEnd(runnerEnd())
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            allureXml = results[0]
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should report one suite', () => {
            expect(allureXml('ns2\\:test-suite > name').text()).toEqual('MyFeature')
            expect(allureXml('ns2\\:test-suite > title').text()).toEqual('MyFeature')
        })

        it('should detect passed test case', () => {
            expect(allureXml('test-case > name').text()).toEqual('MyScenario')
            expect(allureXml('test-case').attr('status')).toEqual('passed')
        })

        it('should report one hook', () => {
            expect(allureXml('step > name').eq(0).text()).toEqual('Hook')
            expect(allureXml('step > title').eq(0).text()).toEqual('Hook')
        })

        it('should report one step', () => {
            expect(allureXml('step > name').eq(1).text()).toEqual('I do something')
            expect(allureXml('step > title').eq(1).text()).toEqual('I do something')
        })

        it('should report hook and step as passing', () => {
            expect(allureXml('step[status="passed"]').length).toEqual(2)
        })

        it('should detect analytics labels in test case', () => {
            expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
            expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
        })

        it('should add browser name as test argument', () => {
            expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
            expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
        })
    })

    describe('Failed tests', () => {
        let outputDir
        let allureXml

        beforeEach(() => {
            outputDir = directory()
        })

        afterEach(() => {
            clean(outputDir)
        })

        it('should handle failed test', () => {
            const reporter = new AllureReporter({ stdout: true, outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestFail(cucumberHelper.testFail())
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd('test'))
            reporter.onSuiteEnd(cucumberHelper.featureEnd('test'))
            reporter.onRunnerEnd(runnerEnd())
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            allureXml = results[0]

            expect(allureXml('ns2\\:test-suite > name').text()).toEqual('MyFeature')
            expect(allureXml('test-case > name').text()).toEqual('MyScenario')
            expect(allureXml('test-case').attr('status')).toEqual('failed')
            expect(allureXml('step').attr('status')).toEqual('failed')
            expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
            expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
        })

        it('should handle failed hook', () => {
            const reporter = new AllureReporter({ stdout: true, outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookFail())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestSkip(cucumberHelper.testSkipped())
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd('hook'))
            reporter.onSuiteEnd(cucumberHelper.featureEnd('hook'))
            reporter.onRunnerEnd(runnerEnd())
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            allureXml = results[0]

            expect(allureXml('ns2\\:test-suite > name').text()).toEqual('MyFeature')
            expect(allureXml('test-case > name').text()).toEqual('MyScenario')
            expect(allureXml('test-case').attr('status')).toEqual('failed')
            expect(allureXml('step').attr('status')).toEqual('failed')
            expect(allureXml('step').eq(0).attr('status')).toEqual('failed')
            expect(allureXml('step').eq(1).attr('status')).toEqual('canceled')
            expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
            expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
        })

    })
})
