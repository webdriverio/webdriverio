import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll, afterEach } from 'vitest'
import type { Label, Parameter, Link } from 'allure-js-commons'
import { Status, LabelName, LinkType, Stage } from 'allure-js-commons'

import { temporaryDirectory } from 'tempy'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults } from './helpers/wdio-allure-helper'

import AllureReporter from '../src/reporter.js'
import { linkPlaceholder } from '../src/constants.js'
import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import * as cucumberHelper from './__fixtures__/cucumber.js'
import * as attachmentHelper from './__fixtures__/attachment.js'
import { commandStart, commandEnd } from './__fixtures__/command.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

let processOn: any
beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = vi.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('reporter option "useCucumberStepReporter" set to true', () => {
    let outputDir: any
    let reporter: any
    let allureResult: Record<string, any>
    let allureContainer: Record<string, any>

    describe('reporter option "disableWebdriverStepsReporting" set to true', () => {
        describe('Passing tests', () => {
            outputDir = temporaryDirectory()

            beforeAll(() => {
                const reporter = new AllureReporter({
                    outputDir,
                    useCucumberStepReporter: true,
                    disableWebdriverStepsReporting: true,
                    issueLinkTemplate: `https://github.com/webdriverio/webdriverio/issues/${linkPlaceholder}`,
                    tmsLinkTemplate: `https://webdriver.io/${linkPlaceholder}`
                })

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

                const { results, attachments, containers } = getResults(outputDir)

                allureResult = results[0]
                allureContainer = containers[0]

                expect(results).toHaveLength(1)
                expect(attachments).toHaveLength(1)
            })

            afterAll(() => {
                clean(outputDir)
            })

            it('should report one suite', () => {
                expect(allureContainer.name).toEqual('MyFeature')
            })

            it('should detect passed test case', () => {
                expect(allureResult.name).toEqual('MyScenario')
                expect(allureResult.status).toEqual(Status.PASSED)
            })

            it('should detect analytics labels in test case', () => {
                const feature = allureResult.labels.find((label: Label) => label.name === LabelName.FEATURE)
                const language = allureResult.labels.find((label: Label) => label.name === LabelName.LANGUAGE)
                const framework = allureResult.labels.find((label: Label) => label.name === LabelName.FRAMEWORK)

                expect(feature.value).toEqual('MyFeature')
                expect(language.value).toEqual('javascript')
                expect(framework.value).toEqual('wdio')
            })

            it('should add browser name as test argument', () => {
                const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

                expect(browserParameter.value).toEqual('chrome-68')
            })

            it('should detect tags labels on top in test case', () => {
                const severity = allureResult.labels.find((label: Label) => label.name === LabelName.SEVERITY)

                expect(severity.value).toEqual('critical')
            })

            it('should convert tag label "issue" to allure link', () => {
                const issueLink = allureResult.links.find((link: Link) => link.type === LinkType.ISSUE)

                expect(issueLink.url).toEqual('https://github.com/webdriverio/webdriverio/issues/BUG-987')
            })

            it('should convert tag label "testId" to allure link', () => {
                const tmsLink = allureResult.links.find((link: Link) => link.type === LinkType.TMS)

                expect(tmsLink.url).toEqual('https://webdriver.io/TST-123')
            })

            it('should detect description on top in test case', () => {
                expect(allureResult.description).toEqual('My scenario description')
            })
        })
    })

    describe('Passing tests', () => {
        outputDir = temporaryDirectory()

        beforeAll(() => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart('my-awesome-feature-at-scenario-level'))
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter._consoleOutput = 'some console output'
            reporter.onTestPass()
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.addAttachment(attachmentHelper.xmlAttachment())
            reporter.onHookEnd(cucumberHelper.hookEnd())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())

            const { results, containers } = getResults(outputDir)

            allureResult = results[0]
            allureContainer = containers[0]

            // console.log({ allureResult: allureResult.steps[1].steps })

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should have the console log add', () => {
            expect(allureResult.steps[1].attachments).toHaveLength(1)
            expect(allureResult.steps[1].attachments[0].name).toEqual('Console Logs')
        })

        it('should report one suite', () => {
            expect(allureContainer.name).toEqual('MyFeature')
        })

        it('should detect passed test case', () => {
            expect(allureResult.name).toEqual('MyScenario')
            expect(allureResult.status).toEqual(Status.PASSED)
        })

        describe('steps', () => {
            it('should report one passing non-hook step for test', () => {
                const nonHookSteps = allureResult.steps.filter((step) => step.name !== 'Hook')

                expect(nonHookSteps).toHaveLength(1)
                expect(nonHookSteps[0].name).toEqual('I do something')
                expect(nonHookSteps[0].status).toEqual(Status.PASSED)
                expect(nonHookSteps[0].stage).toEqual(Stage.FINISHED)
            })

            it('should add step from command for test', () => {
                const [test] = allureResult.steps.filter((step) => step.name !== 'Hook')

                expect(test.steps).toHaveLength(1)
                expect(test.steps[0].name).toEqual('GET /session/:sessionId/element')
                expect(test.steps[0].status).toEqual(Status.PASSED)
                expect(test.steps[0].stage).toEqual(Stage.FINISHED)
                expect(test.steps[0].attachments).toHaveLength(2)
            })
        })

        it('should detect analytics labels in test case', () => {
            const feature = allureResult.labels.find((label: Label) => label.name === LabelName.FEATURE)
            const language = allureResult.labels.find((label: Label) => label.name === LabelName.LANGUAGE)
            const framework = allureResult.labels.find((label: Label) => label.name === LabelName.FRAMEWORK)

            expect(feature.value).toEqual('my-awesome-feature-at-scenario-level')
            expect(language.value).toEqual('javascript')
            expect(framework.value).toEqual('wdio')
        })

        it('should add browser name as test argument', () => {
            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

            expect(browserParameter.value).toEqual('chrome-68')
        })

        it('should detect tags labels on top in test case', () => {
            const severity = allureResult.labels.find((label: Label) => label.name === LabelName.SEVERITY)

            expect(severity.value).toEqual('critical')
        })

        it('should keep tag label "issue" as is if issue link template is not configured', () => {
            const issueLink = allureResult.links.find((link: Link) => link.type === LinkType.ISSUE)

            expect(issueLink.url).toEqual('BUG-987')
        })

        it('should keep tag label "testId" as is if tms link template is not configured', () => {
            const tmsLink = allureResult.links.find((link: Link) => link.type === LinkType.TMS)

            expect(tmsLink.url).toEqual('TST-123')
        })

        it('should detect description on top in test case', () => {
            expect(allureResult.description).toEqual('My scenario description')
        })
    })

    describe('Skipped test', () => {
        outputDir = temporaryDirectory()

        beforeAll(() => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('my-awesome-feature-at-feature-level'))
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter._consoleOutput = 'some console output'
            reporter.onTestSkip(cucumberHelper.testSkipped())

            const suiteResults: any = { tests: [cucumberHelper.testSkipped()] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())

            const { results, containers } = getResults(outputDir)

            allureResult = results[0]
            allureContainer = containers[0]

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should detect analytics labels in test case', () => {
            expect(allureXml('test-case label[name="feature"]').eq(0).attr('value')).toEqual('my-awesome-feature-at-feature-level')
            expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
            expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
        })

        it('should report one suite', () => {
            expect(allureContainer.name).toEqual('MyFeature')
        })

        it('should report scenario as pending', () => {
            expect(allureResult.status).toEqual(Status.SKIPPED)
            expect(allureResult.stage).toEqual(Stage.PENDING)
        })

        it('should report one canceled step', () => {
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].name).toEqual('I do something')
            expect(allureResult.steps[0].status).toEqual(Status.SKIPPED)
            expect(allureResult.steps[0].stage).toEqual(Stage.PENDING)
        })

        it('should have the console log add', () => {
            expect(allureResult.steps[0].attachments).toHaveLength(1)
            expect(allureResult.steps[0].attachments[0].name).toBe('Console Logs')
        })
    })

    describe('Skipped test after several steps passed', () => {
        outputDir = temporaryDirectory()

        beforeAll(() => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('my-awesome-feature-at-feature-level'))
            reporter.onSuiteStart(cucumberHelper.scenarioStart('my-awesome-feature-at-scenario-level'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestPass()
            reporter.onTestStart(cucumberHelper.test2start())
            reporter.onTestSkip(cucumberHelper.test2Skipped())

            const suiteResults: any = { tests: [cucumberHelper.testPass()] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())

            // const results = getResults(outputDir)
            // expect(results).toHaveLength(1)

            const { results, containers } = getResults(outputDir)

            allureResult = results[0]
            allureContainer = containers[0]

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should detect analytics labels in test case', () => {
            expect(allureXml('test-case label[name="feature"]').eq(0).attr('value')).toEqual('my-awesome-feature-at-scenario-level')
            expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
            expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
        })

        it('should report one suite', () => {
            expect(allureContainer.name).toEqual('MyFeature')
        })

        it('should report scenario as passed', () => {
            expect(allureResult.status).toEqual(Status.PASSED)
            expect(allureResult.stage).toEqual(Stage.FINISHED)
        })

        it('should report one passed step', () => {
            const passedSteps = allureResult.steps.filter((step) => step.status === Status.PASSED)

            expect(passedSteps).toHaveLength(1)
            expect(passedSteps[0].name).toEqual('I do something')
        })

        it('should report one canceled step', () => {
            const skippedSteps = allureResult.steps.filter((step) => step.status === Status.SKIPPED)

            expect(skippedSteps).toHaveLength(1)
            expect(skippedSteps[0].name).toEqual('I check something')
        })
    })

    describe('Failed tests', () => {
        beforeEach(() => {
            outputDir = temporaryDirectory()
        })

        afterEach(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should handle failed test', () => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter._consoleOutput = 'some console output'
            reporter.onTestFail(cucumberHelper.testFail())

            const suiteResults: any = { tests: [{ state: 'failed' }] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            reporter.onRunnerEnd(runnerEnd())

            const { results, containers } = getResults(outputDir)

            allureResult = results[0]
            allureContainer = containers[0]

            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)
            expect(allureContainer.name).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
            expect(browserParameter.value).toEqual('chrome-68')
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].attachments).toHaveLength(1)
            expect(allureResult.steps[0].attachments[0].name).toEqual('Console Logs')
            expect(allureResult.status).toEqual(Status.FAILED)
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

            const { results, containers } = getResults(outputDir)

            allureResult = results[0]
            allureContainer = containers[0]

            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)
            expect(allureContainer.name).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
            expect(browserParameter.value).toEqual('chrome-68')
            expect(allureResult.steps).toHaveLength(2)
            expect(allureResult.steps[0].name).toEqual('Hook')
            expect(allureResult.steps[0].status).toEqual(Status.FAILED)
            expect(allureResult.steps[0].stage).toEqual(Stage.FINISHED)
            expect(allureResult.steps[1].name).toEqual('I do something')
            expect(allureResult.steps[1].status).toEqual(Status.SKIPPED)
            expect(allureResult.steps[1].stage).toEqual(Stage.PENDING)
        })
    })

    describe('Data Table', () => {
        outputDir = temporaryDirectory()

        beforeAll(() => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.test3Start())
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

            const { results } = getResults(outputDir)

            allureResult = results[0]

            expect(results).toHaveLength(1)
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should add data table as attachment to test-case', () => {
            const testCaseStep = allureResult.steps.find((step) => step.name !== 'Hook')

            expect(testCaseStep.attachments).toHaveLength(1)
            expect(testCaseStep.attachments[0].name).toEqual('Data Table')
        })
    })
})
