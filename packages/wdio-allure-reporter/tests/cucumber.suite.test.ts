import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll, afterEach } from 'vitest'
import type { Label, Parameter, Link, StepResult } from 'allure-js-commons'
import { Status, LabelName, LinkType, Stage } from 'allure-js-commons'

import { temporaryDirectory } from 'tempy'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults, mapBy } from './helpers/wdio-allure-helper'

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

                expect(results).toHaveLength(1)
                expect(attachments).toHaveLength(1)
                expect(containers).toHaveLength(1)

                allureResult = results[0]
                allureContainer = containers[0]
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
                const labels = mapBy<Label>(allureResult.labels, 'name')
                const features = labels[LabelName.FEATURE]
                const suites = labels[LabelName.SUITE]
                const languages = labels[LabelName.LANGUAGE]
                const frameworks = labels[LabelName.FRAMEWORK]

                expect(features).toHaveLength(1)
                expect(languages).toHaveLength(1)
                expect(frameworks).toHaveLength(1)
                expect(suites).toHaveLength(1)
                expect(features[0].value).toEqual('MyFeature')
                expect(suites[0].value).toEqual('MyFeature')
                expect(languages[0].value).toEqual('javascript')
                expect(frameworks[0].value).toEqual('wdio')
            })

            it('should add browser name as test argument', () => {
                const params = mapBy<Parameter>(allureResult.parameters, 'name')
                const browserParameters = params.browser

                expect(browserParameters).toHaveLength(1)
                expect(browserParameters[0].value).toEqual('chrome-68')
            })

            it('should detect tags labels on top in test case', () => {
                const labels = mapBy<Label>(allureResult.labels, 'name')
                const severityLabels = labels[LabelName.SEVERITY]

                expect(severityLabels).toHaveLength(1)
                expect(severityLabels[0].value).toEqual('critical')
            })

            it('should convert tag label "issue" to allure link', () => {
                const links = mapBy<Link>(allureResult.links, 'type')
                const issueLinks = links[LinkType.ISSUE]

                expect(issueLinks).toHaveLength(1)
                expect(issueLinks[0].url).toEqual('https://github.com/webdriverio/webdriverio/issues/BUG-987')
            })

            it('should convert tag label "testId" to allure link', () => {
                const links = mapBy<Link>(allureResult.links, 'type')
                const tmsLinks = links[LinkType.TMS]

                expect(tmsLinks).toHaveLength(1)
                expect(tmsLinks[0].url).toEqual('https://webdriver.io/TST-123')
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

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)

            allureResult = results[0]
            allureContainer = containers[0]
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should have the console log add', () => {
            expect(allureResult.steps).toHaveLength(3)
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
            let nonHookSteps: StepResult[]

            beforeEach(() => {
                nonHookSteps = allureResult.steps.filter((step: StepResult) => step.name !== 'Hook')

                expect(nonHookSteps).toHaveLength(1)
            })

            it('should report one passing non-hook step for test', () => {
                expect(nonHookSteps[0].name).toEqual('I do something')
                expect(nonHookSteps[0].status).toEqual(Status.PASSED)
                expect(nonHookSteps[0].stage).toEqual(Stage.FINISHED)
            })

            it('should add step from command for test', () => {
                expect(nonHookSteps[0].steps).toHaveLength(1)
                expect(nonHookSteps[0].steps[0].name).toEqual('GET /session/:sessionId/element')
                expect(nonHookSteps[0].steps[0].status).toEqual(Status.PASSED)
                expect(nonHookSteps[0].steps[0].stage).toEqual(Stage.FINISHED)
                expect(nonHookSteps[0].steps[0].attachments).toHaveLength(2)
            })
        })

        it('should detect analytics labels in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const features = labels[LabelName.FEATURE]
            const suites = labels[LabelName.SUITE]
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]
            const packages = labels[LabelName.PACKAGE]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(suites).toHaveLength(1)
            expect(suites[0].value).toEqual('MyFeature')
            expect(features).toHaveLength(2)
            expect(features).toEqual(expect.arrayContaining([
                { name: LabelName.FEATURE, value: 'MyFeature' },
                { name: LabelName.FEATURE, value: 'my-awesome-feature-at-scenario-level' }
            ]))
            expect(packages).toHaveLength(1)
            expect(packages[0].value).toEqual('foo.bar.feature')
        })

        it('should add browser name as test argument', () => {
            const params = mapBy<Parameter>(allureResult.parameters, 'name')
            const browserParameters = params.browser

            expect(browserParameters).toHaveLength(1)
            expect(browserParameters[0].value).toEqual('chrome-68')
        })

        it('should detect tags labels on top in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const severityLabels = labels[LabelName.SEVERITY]

            expect(severityLabels).toHaveLength(1)
            expect(severityLabels[0].value).toEqual('critical')
        })

        it('should keep tag label "issue" as is if issue link template is not configured', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const issueLabels = labels.issue

            expect(issueLabels).toHaveLength(1)
            expect(issueLabels[0].value).toEqual('BUG-987')
        })

        it('should keep tag label "testId" as is if tms link template is not configured', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const tmsLabels = labels.tms

            expect(tmsLabels).toHaveLength(1)
            expect(tmsLabels[0].value).toEqual('TST-123')
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

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)

            allureResult = results[0]
            allureContainer = containers[0]
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should detect analytics labels in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const features = labels[LabelName.FEATURE]
            const suites = labels[LabelName.SUITE]
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(suites).toHaveLength(1)
            expect(suites[0].value).toEqual('MyFeature')
            expect(features).toHaveLength(1)
            expect(features[0].value).toEqual('MyFeature')
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

            const { results, containers } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)

            allureResult = results[0]
            allureContainer = containers[0]
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should detect analytics labels in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const features = labels[LabelName.FEATURE]
            const suites = labels[LabelName.SUITE]
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]
            const packages = labels[LabelName.PACKAGE]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(suites).toHaveLength(1)
            expect(suites[0].value).toEqual('MyFeature')
            expect(features).toHaveLength(2)
            expect(features).toEqual(expect.arrayContaining([
                { name: LabelName.FEATURE, value: 'MyFeature' },
                { name: LabelName.FEATURE, value: 'my-awesome-feature-at-scenario-level' }
            ]))
            expect(packages).toHaveLength(1)
            expect(packages[0].value).toEqual('foo.bar.feature')
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

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)

            allureResult = results[0]
            allureContainer = containers[0]

            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

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

            expect(results).toHaveLength(1)
            expect(containers).toHaveLength(1)

            allureResult = results[0]
            allureContainer = containers[0]

            const params = mapBy<Parameter>(allureResult.parameters, 'name')
            const browserParameters = params.browser

            expect(browserParameters).toHaveLength(1)
            expect(browserParameters[0].value).toEqual('chrome-68')
            expect(allureContainer.name).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
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

            expect(results).toHaveLength(1)

            allureResult = results[0]
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
