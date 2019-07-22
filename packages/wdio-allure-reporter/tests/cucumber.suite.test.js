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

    describe('Passing tests with option', () => {
        const outputDir = directory()
        // const outputDir = process.cwd() + '/allure-results'
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

    // describe('Failed tests', () => {
    //     let outputDir
    //     let allureXml

    //     beforeEach(() => {
    //         outputDir = directory()
    //     })

    //     afterEach(() => {
    //         clean(outputDir)
    //     })

    //     it('should detect failed test case', () => {
    //         const reporter = new AllureReporter({ stdout: true, outputDir })

    //         const runnerEvent = runnerStart()
    //         delete runnerEvent.config.capabilities.browserName
    //         delete runnerEvent.config.capabilities.version

    //         reporter.onRunnerStart(runnerEvent)
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestStart(testStart())
    //         reporter.onTestFail(testFailed())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)
    //         allureXml = results[0]

    //         expect(allureXml('test-case > name').text()).toEqual('should can do something')
    //         expect(allureXml('test-case').attr('status')).toEqual('failed')

    //         expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
    //         expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual(testStart().cid)
    //     })

    //     it('should detect failed test case without start event', () => {
    //         const reporter = new AllureReporter({ stdout: true, outputDir })

    //         reporter.onRunnerStart(runnerStart())
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestFail(testFailed())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)
    //         allureXml = results[0]

    //         expect(allureXml('test-case > name').text()).toEqual('should can do something')
    //         expect(allureXml('test-case').attr('status')).toEqual('failed')
    //     })

    //     it('should detect failed test case with multiple errors', () => {
    //         const reporter = new AllureReporter({ stdout: true, outputDir } )

    //         const runnerEvent = runnerStart()
    //         runnerEvent.config.framework = 'jasmine'
    //         delete runnerEvent.config.capabilities.browserName
    //         delete runnerEvent.config.capabilities.version

    //         reporter.onRunnerStart(runnerEvent)
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestStart(testStart())
    //         reporter.onTestFail(testFailedWithMultipleErrors())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)

    //         allureXml = results[0]
    //         expect(allureXml('test-case > name').text()).toEqual('should can do something')
    //         expect(allureXml('test-case').attr('status')).toEqual('failed')
    //         const message = allureXml('message').text()
    //         const lines = message.split('\n')
    //         expect(lines[0]).toBe('CompoundError: One or more errors occurred. ---')
    //         expect(lines[1].trim()).toBe('ReferenceError: All is Dust')
    //         expect(lines[3].trim()).toBe('InternalError: Abandon Hope')
    //     })
    // })

    // describe('Pending tests', () => {
    //     let outputDir

    //     afterEach(() => {
    //         clean(outputDir)
    //     })

    //     it('should detect started pending test case', () => {
    //         outputDir = directory()
    //         const reporter = new AllureReporter({ stdout: true, outputDir })

    //         reporter.onRunnerStart(runnerStart())
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestStart(testStart())
    //         reporter.onTestSkip(testPending())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)
    //         const allureXml = results[0]

    //         expect(allureXml('test-case > name').text()).toEqual('should can do something')
    //         expect(allureXml('test-case').attr('status')).toEqual('pending')
    //     })

    //     it('should detect not started pending test case', () => {
    //         outputDir = directory()
    //         const reporter = new AllureReporter({ stdout: true, outputDir })

    //         reporter.onRunnerStart(runnerStart())
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestSkip(testPending())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)
    //         const allureXml = results[0]

    //         expect(allureXml('test-case > name').text()).toEqual('should can do something')
    //         expect(allureXml('test-case').attr('status')).toEqual('pending')
    //     })

    //     it('should detect not started pending test case after completed test', () => {
    //         outputDir = directory()
    //         const reporter = new AllureReporter({ stdout: true, outputDir })
    //         let passed = testStart()
    //         passed = {
    //             ...passed,
    //             title: passed.title + '2',
    //             uid: passed.uid + '2',
    //             fullTitle: passed.fullTitle + '2'
    //         }

    //         reporter.onRunnerStart(runnerStart())
    //         reporter.onSuiteStart(suiteStart())
    //         reporter.onTestStart(passed)
    //         reporter.onTestPass({ ...passed, state: 'passed' })
    //         reporter.onTestSkip(testPending())
    //         reporter.onSuiteEnd(suiteEnd())
    //         reporter.onRunnerEnd(runnerEnd())

    //         const results = getResults(outputDir)
    //         expect(results).toHaveLength(1)
    //         const allureXml = results[0]

    //         expect(allureXml('test-case > name').length).toEqual(2)

    //         expect(allureXml('test-case > name').last().text()).toEqual('should can do something')
    //         expect(allureXml('test-case').last().attr('status')).toEqual('pending')

    //         expect(allureXml('test-case > name').first().text()).toEqual(passed.title)
    //         expect(allureXml('test-case').first().attr('status')).toEqual('passed')
    //     })
    // })
})
