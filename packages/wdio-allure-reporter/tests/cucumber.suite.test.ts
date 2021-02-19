import { directory } from 'tempy'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults } from './helpers/wdio-allure-helper'

import AllureReporter from '../src/'
import { runnerEnd, runnerStart } from './__fixtures__/runner'
import * as cucumberHelper from './__fixtures__/cucumber'
import * as attachmentHelper from './__fixtures__/attachment'
import { commandStart, commandEnd } from './__fixtures__/command'

let processOn: any
beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = jest.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('reporter option "useCucumberStepReporter" set to true', () => {

    describe('reporter option "disableWebdriverStepsReporting" set to true', () => {
        describe('Passing tests', () => {
            const outputDir = directory()
            let allureXml: any

            beforeAll(() => {
                const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true, disableWebdriverStepsReporting: true })

                reporter.onRunnerStart(runnerStart())
                reporter.onSuiteStart(cucumberHelper.featureStart())
                reporter.onSuiteStart(cucumberHelper.scenarioStart())
                reporter.onHookStart(cucumberHelper.hookStart())
                reporter.onHookEnd(cucumberHelper.hookEnd())
                reporter.onTestStart(cucumberHelper.testStart())
                reporter.onBeforeCommand(commandStart())
                reporter.onAfterCommand(commandEnd())
                reporter.onTestPass()
                reporter.onHookStart(cucumberHelper.hookStart())
                reporter.addAttachment(attachmentHelper.xmlAttachment())
                reporter.onHookEnd(cucumberHelper.hookEnd())
                const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }
                reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
                reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
                reporter.onRunnerEnd(runnerEnd())

                const results = getResults(outputDir)
                expect(results).toHaveLength(2) // one for report, one for attachment
                allureXml = results.find((xml: any) => xml('ns2\\:test-suite').length >= 1)
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

            it('should not report passing hook', () => {
                expect(allureXml('step > name').eq(0).text()).not.toContain('Hook')
                expect(allureXml('step > title').eq(0).text()).not.toContain('Hook')
            })

            it('should report one passing step', () => {
                expect(allureXml('step > name').eq(0).text()).toEqual('I do something')
                expect(allureXml('step > title').eq(0).text()).toEqual('I do something')
                expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
                expect(allureXml('step').length).toEqual(1)
            })

            it('should detect analytics labels in test case', () => {
                expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
                expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
            })

            it('should add browser name as test argument', () => {
                expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
                expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
            })

            it('should detect tags labels on top in test case', () => {
                expect(allureXml('test-case label[name="severity"]').eq(0).attr('value')).toEqual('critical')
            })

            it('should detect description on top in test case', () => {
                expect(allureXml('test-case > description').eq(0).text()).toEqual('My scenario description')
                expect(allureXml('test-case description[type="text"]')).toHaveLength(1)
            })

            it('should move attachments from successful hook to test-case', () => {
                expect(allureXml('test-case > attachments > attachment').length).toEqual(1)
            })
        })
    })

    describe('Passing tests', () => {
        const outputDir = directory()
        let allureXml: any

        beforeAll(() => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestPass()
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.addAttachment(attachmentHelper.xmlAttachment())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())

            const results = getResults(outputDir)
            expect(results).toHaveLength(2) // one for report, one for attachment
            allureXml = results.find((xml: any) => xml('ns2\\:test-suite').length >= 1)
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

        it('should not report passing hook', () => {
            expect(allureXml('step > name').eq(0).text()).not.toContain('Hook')
            expect(allureXml('step > title').eq(0).text()).not.toContain('Hook')
        })

        describe('steps', () => {
            it('should report two passing steps', () => {
                expect(allureXml('step').length).toEqual(2)
            })

            it('should report one passing step for test', () => {
                expect(allureXml('step > name').eq(0).text()).toEqual('I do something')
                expect(allureXml('step > title').eq(0).text()).toEqual('I do something')
                expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
                expect(allureXml('step').length).toEqual(2)
            })

            it('should add step from command', () => {
                expect(allureXml('step > name').eq(1).text()).toEqual('GET /session/:sessionId/element')
                expect(allureXml('step > title').eq(1).text()).toEqual('GET /session/:sessionId/element')
                expect(allureXml('test-case attachment[title="Response"]')).toHaveLength(1)
                expect(allureXml('step').eq(1).attr('status')).toEqual('passed')
            })
        })

        it('should detect analytics labels in test case', () => {
            expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
            expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
        })

        it('should add browser name as test argument', () => {
            expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
            expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
        })

        it('should detect tags labels on top in test case', () => {
            expect(allureXml('test-case label[name="severity"]').eq(0).attr('value')).toEqual('critical')
        })

        it('should detect description on top in test case', () => {
            expect(allureXml('test-case > description').eq(0).text()).toEqual('My scenario description')
            expect(allureXml('test-case description[type="text"]')).toHaveLength(1)
        })

        it('should move attachments from successful hook to test-case', () => {
            expect(allureXml('test-case > attachments > attachment').length).toEqual(1)
        })
    })

    describe('Skipped test', () => {
        const outputDir = directory()
        let allureXml: any

        beforeAll(() => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestSkip(cucumberHelper.testSkipped())
            const suiteResults: any = { tests: [cucumberHelper.testSkipped()] }
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
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

        it('should report scenario as pending', () => {
            expect(allureXml('test-case').attr('status')).toEqual('pending')
        })

        it('should report one canceled step', () => {
            expect(allureXml('step > name').eq(0).text()).toEqual('I do something')
            expect(allureXml('step > title').eq(0).text()).toEqual('I do something')
            expect(allureXml('step').eq(0).attr('status')).toEqual('canceled')
            expect(allureXml('step').length).toEqual(1)
        })
    })

    describe('Failed tests', () => {
        let outputDir: any
        let allureXml

        beforeEach(() => {
            outputDir = directory()
        })

        afterEach(() => {
            clean(outputDir)
        })

        it('should handle failed test', () => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestFail(cucumberHelper.testFail())
            const suiteResults: any = { tests: ['failed'] }
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
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
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookFail())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestSkip(cucumberHelper.testSkipped())
            const suiteResults: any = { tests: [cucumberHelper.testSkipped()], hooks: [cucumberHelper.hookFail()] }
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            allureXml = results[0]

            expect(allureXml('ns2\\:test-suite > name').text()).toEqual('MyFeature')
            expect(allureXml('test-case > name').text()).toEqual('MyScenario')
            expect(allureXml('test-case').attr('status')).toEqual('failed')
            expect(allureXml('step > name').eq(0).text()).toEqual('Hook')
            expect(allureXml('step').eq(0).attr('status')).toEqual('failed')
            expect(allureXml('step').eq(1).attr('status')).toEqual('canceled')
            expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
            expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
        })

    })
})
