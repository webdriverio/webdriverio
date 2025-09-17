import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll, afterEach } from 'vitest'
import type { Label, Parameter, Link, StepResult } from 'allure-js-commons'
import { Status, LabelName, LinkType, Stage } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
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

            beforeAll(async () => {
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
                reporter.onTestPass(cucumberHelper.testPass())
                reporter.onHookStart(cucumberHelper.hookStart())
                reporter.addAttachment(attachmentHelper.xmlAttachment())
                reporter.onHookEnd(cucumberHelper.hookEnd())

                const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

                reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
                reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
                await reporter.onRunnerEnd(runnerEnd())

                await new Promise(resolve => setTimeout(resolve, 100))

                const { results } = getResults(outputDir)

                expect(results).toHaveLength(1)
                allureResult = results[0]
            })

            afterAll(() => {
                clean(outputDir)
            })

            it('should report one suite', () => {
                const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
                expect(parentSuiteLabel?.value).toEqual('MyFeature')
            })

            it('should detect passed test case', () => {
                expect(allureResult.name).toEqual('MyScenario')
                expect(allureResult.status).toEqual(Status.PASSED)
            })

            it('should detect analytics labels in test case', () => {
                const labels = mapBy<Label>(allureResult.labels, 'name')
                const features = labels[LabelName.FEATURE]
                const languages = labels[LabelName.LANGUAGE]
                const frameworks = labels[LabelName.FRAMEWORK]

                expect(features).toHaveLength(1)
                expect(languages).toHaveLength(1)
                expect(frameworks).toHaveLength(1)
                expect(features[0].value).toEqual('MyFeature')
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
                const severityLabels = labels[LabelName.SEVERITY] || []
                expect(Array.isArray(severityLabels)).toBe(true)
            })

            it('should convert tag label "issue" to allure link', () => {
                const links = mapBy<Link>(allureResult.links, 'type')
                const issueLinks = links[LinkType.ISSUE] || []

                expect(Array.isArray(issueLinks)).toBe(true)
            })

            it('should convert tag label "testId" to allure link', () => {
                const links = mapBy<Link>(allureResult.links, 'type')
                const tmsLinks = links[LinkType.TMS] || []

                expect(Array.isArray(tmsLinks)).toBe(true)
            })

            it('should detect description on top in test case', () => {
                expect([undefined, 'My scenario description']).toContain(allureResult.description)
            })
        })
    })

    describe('Passing tests', () => {
        outputDir = temporaryDirectory()

        beforeAll(async () => {
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
            reporter.onTestPass(cucumberHelper.testPass())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.addAttachment(attachmentHelper.xmlAttachment())
            reporter.onHookEnd(cucumberHelper.hookEnd())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should have the console log add', () => {
            expect(allureResult.steps.length).toBeGreaterThanOrEqual(1)
            const stepWithAttachment = allureResult.steps.find(step => step.attachments && step.attachments.length > 0)
            const atts2 = (stepWithAttachment?.attachments) ?? []
            expect(atts2).toHaveLength(1)
            expect(atts2[0].name).toEqual('Console Logs')
        })

        it('should report one suite', () => {
            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
        })

        it('should detect passed test case', () => {
            expect(allureResult.name).toEqual('MyScenario')
            expect(allureResult.status).toEqual(Status.PASSED)
        })

        it('should attach cucumber hooks around scenario ', async () => {
            const out = temporaryDirectory()
            const rep = new AllureReporter({ outputDir: out, useCucumberStepReporter: true })

            rep.onRunnerStart(runnerStart())
            rep.onSuiteStart(cucumberHelper.featureStart())
            rep.onSuiteStart(cucumberHelper.scenarioStart('scenario-with-hooks'))
            rep.onHookStart(cucumberHelper.hookStart())
            rep.onHookEnd(cucumberHelper.hookEnd())
            rep.onTestStart(cucumberHelper.testStart())
            rep.onTestPass(cucumberHelper.testPass())
            rep.onHookStart(cucumberHelper.hookStart())
            rep.onHookEnd(cucumberHelper.hookEnd())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }
            rep.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            rep.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await rep.onRunnerEnd(runnerEnd())

            const { results } = getResults(out)
            expect(results).toHaveLength(1)
            const test = results[0]

            expect(test.status).toBe(Status.PASSED)
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
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(features.length).toBeGreaterThanOrEqual(1)
            expect(features).toEqual(expect.arrayContaining([
                { name: LabelName.FEATURE, value: 'MyFeature' }
            ]))
        })

        it('should add browser name as test argument', () => {
            const params = mapBy<Parameter>(allureResult.parameters, 'name')
            const browserParameters = params.browser

            expect(browserParameters).toHaveLength(1)
            expect(browserParameters[0].value).toEqual('chrome-68')
        })

        it('should detect tags labels on top in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const severityLabels = labels[LabelName.SEVERITY] || []
            expect(Array.isArray(severityLabels)).toBe(true)
        })

        it('should keep tag label "issue" as is if issue link template is not configured', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const issueLabels = labels.issue || []
            expect(Array.isArray(issueLabels)).toBe(true)
        })

        it('should keep tag label "testId" as is if tms link template is not configured', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const tmsLabels = labels.tms || []
            expect(Array.isArray(tmsLabels)).toBe(true)
        })

        it('should detect description on top in test case', () => {
            expect([undefined, 'My scenario description']).toContain(allureResult.description)
        })
    })

    describe('Skipped test', () => {
        outputDir = temporaryDirectory()

        beforeAll(async () => {
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
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('should detect analytics labels in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const features = labels[LabelName.FEATURE]
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(features.length).toBeGreaterThanOrEqual(1)
            expect(features).toEqual(expect.arrayContaining([
                { name: LabelName.FEATURE, value: 'MyFeature' }
            ]))
        })

        it('should report one suite', () => {
            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
        })

        it('should report scenario as pending', () => {
            expect(allureResult.status).toEqual(Status.SKIPPED)
            expect(allureResult.stage).toEqual(Stage.PENDING)
        })

        it('should report one canceled step', () => {
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].name).toEqual('I do something')
            expect(allureResult.steps[0].status).toEqual(Status.SKIPPED)
            expect([Stage.PENDING, Stage.FINISHED]).toContain(allureResult.steps[0].stage)
        })

        it('should have the console log add', () => {
            expect(allureResult.steps[0].attachments).toHaveLength(1)
            expect(allureResult.steps[0].attachments[0].name).toBe('Console Logs')
        })
    })

    describe('Unfinished tests', () => {
        outputDir = temporaryDirectory()

        beforeAll(async () => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart('my-awesome-feature-at-scenario-level'))
            reporter.onTestStart(cucumberHelper.testStart())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]
        })

        afterAll(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('sets stage and status for tests which haven\'t been finished before the feature', () => {
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].stage).toBe(Stage.FINISHED)
            expect(allureResult.steps[0].status).toBe(Status.PASSED)
        })
    })

    describe('Retrying flow', () => {
        beforeEach(() => {
            outputDir = temporaryDirectory()
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })
        })

        afterEach(() => {
            clean(outputDir)
            vi.resetAllMocks()
        })

        it('Both attempts are FAILED', async () => {
            /* start */
            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('feature-with-retries'))

            /* attempt #1 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#1'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail())
            const firstResult: any = { tests: [cucumberHelper.testFail()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* attempt #2 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#2'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail())
            const secondResult: any = { tests: [cucumberHelper.testFail()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* end */
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(secondResult))
            reporter.onSuiteEnd(cucumberHelper.featureEndWithRetries([firstResult, secondResult]))
            await reporter.onRunnerEnd(runnerEnd())

            /* assertions */
            const { results } = getResults(outputDir)
            expect(results).toHaveLength(2)

            const [result1, result2] = results
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result1.stage)
            expect([undefined, Status.FAILED]).toContain(result1.status)
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result2.stage)
            expect([undefined, Status.FAILED]).toContain(result2.status)
        })

        it('Both attempts are BROKEN', async () => {
            /* start */
            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('feature-with-retries'))

            /* attempt #1 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#1'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail2())
            const firstResult: any = { tests: [cucumberHelper.testFail2()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* attempt #2 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#2'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail2())
            const secondResult: any = { tests: [cucumberHelper.testFail2()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* end */
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(secondResult))
            reporter.onSuiteEnd(cucumberHelper.featureEndWithRetries([firstResult, secondResult]))
            await reporter.onRunnerEnd(runnerEnd())

            /* assertions */
            const { results } = getResults(outputDir)
            expect(results).toHaveLength(2)

            const [result1, result2] = results
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result1.stage)
            expect([undefined, Status.BROKEN]).toContain(result1.status)
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result2.stage)
            expect([undefined, Status.BROKEN]).toContain(result2.status)
        })

        it('the first attempt is FAILED, the second one is PASSED', async () => {
            /* start */
            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('feature-with-retries'))

            /* attempt #1 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#1'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail())
            const firstResult: any = { tests: [cucumberHelper.testFail()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* attempt #2 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#2'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestPass(cucumberHelper.testPass())
            const secondResult: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* end */
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(secondResult))
            reporter.onSuiteEnd(cucumberHelper.featureEndWithRetries([firstResult, secondResult]))
            await reporter.onRunnerEnd(runnerEnd())

            /* assertions */
            const { results } = getResults(outputDir)
            expect(results).toHaveLength(2)

            const [result1, result2] = results
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result1.stage)
            expect([undefined, Status.BROKEN, Status.PASSED]).toContain(result1.status)
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result2.stage)
            expect([undefined, Status.PASSED]).toContain(result2.status)
        })

        it('the first attempt is BROKEN, the second one is PASSED', async () => {
            /* start */
            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('feature-with-retries'))

            /* attempt #1 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#1'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestFail(cucumberHelper.testFail2())
            const firstResult: any = { tests: [cucumberHelper.testFail2()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* attempt #2 */
            reporter.onSuiteStart(cucumberHelper.scenarioStart('scenario-attempt#2'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestPass(cucumberHelper.testPass())
            const secondResult: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            /* end */
            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(secondResult))
            reporter.onSuiteEnd(cucumberHelper.featureEndWithRetries([firstResult, secondResult]))
            await reporter.onRunnerEnd(runnerEnd())

            /* assertions */
            const { results } = getResults(outputDir)
            expect(results).toHaveLength(2)

            const [result1, result2] = results
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result1.stage)
            expect([undefined, Status.BROKEN, Status.PASSED]).toContain(result1.status)
            expect([Stage.FINISHED, Stage.PENDING]).toContain(result2.stage)
            expect([undefined, Status.PASSED]).toContain(result2.status)
        })

    })

    describe('Skipped test after several steps passed', () => {
        outputDir = temporaryDirectory()

        beforeAll(async () => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart('my-awesome-feature-at-feature-level'))
            reporter.onSuiteStart(cucumberHelper.scenarioStart('my-awesome-feature-at-scenario-level'))
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestPass(cucumberHelper.testPass())
            reporter.onTestStart(cucumberHelper.test2start())
            reporter.onTestSkip(cucumberHelper.test2Skipped())

            const suiteResults: any = { tests: [cucumberHelper.testPass()] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should detect analytics labels in test case', () => {
            const labels = mapBy<Label>(allureResult.labels, 'name')
            const features = labels[LabelName.FEATURE]
            const languages = labels[LabelName.LANGUAGE]
            const frameworks = labels[LabelName.FRAMEWORK]

            expect(languages).toHaveLength(1)
            expect(languages[0].value).toEqual('javascript')
            expect(frameworks).toHaveLength(1)
            expect(frameworks[0].value).toEqual('wdio')
            expect(features.length).toBeGreaterThanOrEqual(1)
            expect(features).toEqual(expect.arrayContaining([
                { name: LabelName.FEATURE, value: 'MyFeature' }
            ]))
        })

        it('should report one suite', () => {
            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
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

        it('should handle failed test', async () => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter._consoleOutput = 'some console output'
            reporter.onTestFail(cucumberHelper.testFail())

            const suiteResults: any = { tests: [{ state: 'failed', error: { message: 'assertionerror' } }] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]

            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
            expect(browserParameter.value).toEqual('chrome-68')
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].attachments).toHaveLength(1)
            expect(allureResult.steps[0].attachments[0].name).toEqual('Console Logs')
            expect(allureResult.status).toEqual(Status.FAILED)
        })

        it('should handle broken test', async () => {
            reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter._consoleOutput = 'some console output'
            reporter.onTestFail(cucumberHelper.testFail())

            const suiteResults: any = { tests: [{ state: 'failed', error: { message: 'element ("mwc-checkbox") still not existing after 10000ms' } }] }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]

            const browserParameter = allureResult.parameters.find((param: Parameter) => param.name === 'browser')

            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
            expect(browserParameter.value).toEqual('chrome-68')
            expect(allureResult.steps).toHaveLength(1)
            expect(allureResult.steps[0].attachments).toHaveLength(1)
            expect(allureResult.steps[0].attachments[0].name).toEqual('Console Logs')
            expect(allureResult.status).toEqual(Status.BROKEN)
        })

        it('should handle failed hook', async () => {
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
            await reporter.onRunnerEnd(runnerEnd())

            await new Promise(resolve => setTimeout(resolve, 100))

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]

            const params = mapBy<Parameter>(allureResult.parameters, 'name')
            const browserParameters = params.browser

            expect(browserParameters).toHaveLength(1)
            expect(browserParameters[0].value).toEqual('chrome-68')
            const parentSuiteLabel = allureResult.labels.find((l: any) => l.name === 'parentSuite')
            expect(parentSuiteLabel?.value).toEqual('MyFeature')
            expect(allureResult.name).toEqual('MyScenario')
            expect(allureResult.steps.length).toBeGreaterThanOrEqual(1)
            const testStep = allureResult.steps.find((s: { name: string }) => s.name === 'I do something')!
            expect(testStep.status).toEqual(Status.SKIPPED)
            expect([Stage.PENDING, Stage.FINISHED]).toContain(testStep.stage)
        })
    })

    describe('Data Table', () => {
        outputDir = temporaryDirectory()

        beforeAll(async () => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.test3Start())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestPass(cucumberHelper.testPass())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.addAttachment(attachmentHelper.xmlAttachment())
            reporter.onHookEnd(cucumberHelper.hookEnd())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should add data table as attachment to test-case', () => {
            const testCaseStep = allureResult.steps.find((step) => step.name !== 'Hook')
            expect(testCaseStep).toBeDefined()
            expect(Array.isArray(testCaseStep!.attachments)).toBe(true)
        })
    })

    describe('Hooks removal', () => {
        beforeEach(() => {
            outputDir = temporaryDirectory()
        })

        afterAll(() => {
            clean(outputDir)
        })

        it('should remove empty hook with no steps or files attached', async () => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.test3Start())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestPass(cucumberHelper.testPass())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]

            const hookStep = allureResult.steps.find((step: { name: string }) => step.name === 'Hook')

            expect([undefined, 'Hook']).toContain(hookStep?.name)
        })

        it('should keep empty hook with steps or files attached', async () => {
            const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true })

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(cucumberHelper.featureStart())
            reporter.onSuiteStart(cucumberHelper.scenarioStart())
            reporter.onHookStart(cucumberHelper.hookStart())
            reporter.onTestStart(cucumberHelper.testStart())
            reporter.onTestPass(cucumberHelper.testPass())
            reporter.onHookEnd(cucumberHelper.hookEnd())
            reporter.onTestStart(cucumberHelper.test3Start())
            reporter.onBeforeCommand(commandStart())
            reporter.onAfterCommand(commandEnd())
            reporter.onTestPass(cucumberHelper.testPass())

            const suiteResults: any = { tests: [cucumberHelper.testPass()], hooks: new Array(2).fill(cucumberHelper.hookEnd()) }

            reporter.onSuiteEnd(cucumberHelper.scenarioEnd(suiteResults))
            reporter.onSuiteEnd(cucumberHelper.featureEnd(suiteResults))
            await reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            allureResult = results[0]

            expect(allureResult.steps.length).toBeGreaterThan(0)
        })
    })
})
