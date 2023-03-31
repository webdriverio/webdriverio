import path from 'node:path'
import { log } from 'node:console'
import { describe, it, expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import type { Label, Parameter, Link, Attachment } from 'allure-js-commons'
import { LabelName } from 'allure-js-commons'
import { Status, LinkType, Stage } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { TYPE } from '../src/types.js'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults, mapBy } from './helpers/wdio-allure-helper'

import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import {
    testFailed, testPending, testStart, testFailedWithMultipleErrors,
    hookStart, hookFailed, hookStartWithCurrentTest,
    testFailedWithAssertionErrorFromExpectWebdriverIO } from './__fixtures__/testState.js'
import {
    commandStart, commandEnd, commandEndScreenShot, commandStartScreenShot
} from './__fixtures__/command.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

let processOn: any

beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = vi.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('Passing tests', () => {
    const outputDir = temporaryDirectory()
    let allureResult: Record<string, any>
    let allureContainer: Record<string, any>
    let allureEnvInfo: Record<string, any>

    beforeAll(() => {
        const reporter = new AllureReporter({
            outputDir,
            issueLinkTemplate: 'https://example.org/issues/{}',
            tmsLinkTemplate: 'https://example.org/tests/{}',
        })
        const step = {
            step: {
                attachment: {
                    content: 'baz',
                    name: 'attachment'
                },
                status: Status.FAILED,
                title: 'foo'
            }
        }

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.addLabel({ name: 'customLabel', value: 'Label' })
        reporter.addStory({ storyName: 'Story' })
        reporter.addFeature({ featureName: 'foo' })
        reporter.addSeverity({ severity: 'baz' })
        reporter.addIssue({ issue: '1' })
        reporter.addTestId({ testId: '2' })
        reporter.addEnvironment({ name: 'jenkins', value: '1.2.3' })
        reporter.addDescription({ description: 'functions', descriptionType: TYPE.HTML })
        reporter.addAttachment({ name: 'My attachment', content: '99thoughtz', type: 'text/plain' })
        reporter.addArgument({ name: 'os', value: 'osx' })
        reporter.startStep('bar')
        reporter.endStep(Status.PASSED)
        reporter.addStep(step)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results, containers, environmentInfo } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(containers).toHaveLength(1)
        expect(Object.values(environmentInfo)).toHaveLength(1)

        allureResult = results[0]
        allureContainer = containers[0]
        allureEnvInfo = environmentInfo
    })

    afterAll(() => {
        clean(outputDir)
    })

    it('should report one suite', () => {
        expect(allureContainer.name).toEqual('A passing Suite')
    })

    it('should detect passed test case', () => {
        expect(allureResult.name).toEqual('should can do something')
        expect(allureResult.status).toEqual(Status.PASSED)
    })

    it('should detect analytics labels in test case', () => {
        const labels = mapBy<Label>(allureResult.labels, 'name')
        const languages = labels[LabelName.LANGUAGE]
        const frameworks = labels[LabelName.FRAMEWORK]

        expect(languages).toHaveLength(1)
        expect(languages[0].value).toEqual('javascript')
        expect(frameworks).toHaveLength(1)
        expect(frameworks[0].value).toEqual('wdio')
    })

    it('should add browser name as test argument', () => {
        const params = mapBy<Parameter>(allureResult.parameters, 'name')
        const browsers = params.browser

        expect(browsers).toHaveLength(1)
        expect(browsers[0].value).toEqual('chrome-68')
    })

    it('should add label, story, feature, severity, issue, testId, thread and package labels', () => {
        const labels = mapBy<Label>(allureResult.labels, 'name')
        const customLabels = labels.customLabel
        const features = labels[LabelName.FEATURE]
        const stories = labels[LabelName.STORY]
        const severities = labels[LabelName.SEVERITY]
        const threads = labels[LabelName.THREAD]
        const packages = labels[LabelName.PACKAGE]

        expect(features).toHaveLength(2)
        expect(features).toEqual(expect.arrayContaining([
            { name: LabelName.FEATURE, value: 'A passing Suite' },
            { name: LabelName.FEATURE, value: 'foo' }
        ]))
        expect(customLabels).toHaveLength(1)
        expect(customLabels[0].value).toEqual('Label')
        expect(stories).toHaveLength(1)
        expect(stories[0].value).toEqual('Story')
        expect(severities).toHaveLength(1)
        expect(severities[0].value).toEqual('baz')
        expect(threads).toHaveLength(1)
        expect(threads[0].value).toEqual(testStart().cid)
        expect(packages).toHaveLength(1)
        expect(packages[0].value).toEqual('foo.bar.test.js')
    })

    it('should add issue and tms links', () => {
        const links = mapBy<Link>(allureResult.links, 'type')
        const issues = links[LinkType.ISSUE]
        const tms = links[LinkType.TMS]

        expect(issues).toHaveLength(1)
        expect(issues[0].url).toEqual('https://example.org/issues/1')
        expect(tms).toHaveLength(1)
        expect(tms[0].url).toEqual('https://example.org/tests/2')
    })

    it('should add environment variable', () => {
        expect(allureEnvInfo).toEqual({ jenkins: '1.2.3' })
    })

    it('should start end custom step', () => {
        const customStep = allureResult.steps.find((step: any) => step.name === 'bar')

        expect(customStep.status).toEqual(Status.PASSED)
        expect(customStep.stage).toEqual(Stage.FINISHED)
    })

    it('should add custom step', () => {
        const customStep = allureResult.steps.find((step: any) => step.name === 'foo')

        expect(customStep.status).toEqual(Status.FAILED)
        expect(customStep.stage).toEqual(Stage.FINISHED)
        expect(customStep.attachments).toHaveLength(1)
    })

    it('should add attachment', () => {
        expect(allureResult.attachments).toHaveLength(1)
        expect(allureResult.attachments[0].name).toEqual('My attachment')
    })

    it('should add additional argument', () => {
        const params = mapBy<Parameter>(allureResult.parameters, 'name')
        const osParams = params.os

        expect(osParams).toHaveLength(1)
        expect(osParams[0].value).toEqual('osx')
    })
})

describe('Failed tests', () => {
    let outputDir: any

    beforeEach(() => {
        outputDir = temporaryDirectory()
    })

    afterEach(() => {
        clean(outputDir)
    })

    it('should detect failed test case', () => {
        const reporter = new AllureReporter({ outputDir })

        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const browserParameter = results[0].parameters.find((param: Parameter) => param.name === 'browser')

        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)
        expect(results[0].parameters).toHaveLength(1)
        expect(browserParameter.value).toEqual(testStart().cid)
    })

    it('should detect failed test case without start event', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)
    })

    it('should detect failed test case with multiple errors', () => {
        const reporter = new AllureReporter({ outputDir })
        const runnerEvent = runnerStart()

        runnerEvent.config.framework = 'jasmine'

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailedWithMultipleErrors())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)

        const { message } = results[0].statusDetails
        const lines = message.split('\n')

        expect(lines[0]).toBe('CompoundError: One or more errors occurred. ---')
        expect(lines[2].trim()).toBe('ReferenceError: All is Dust')
        expect(lines[5].trim()).toBe('InternalError: Abandon Hope')
    })

    it('should detect failed test case with Assertion failed from expect-webdriverIO', () => {
        const reporter = new AllureReporter({ outputDir })

        const runnerEvent = runnerStart()
        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailedWithAssertionErrorFromExpectWebdriverIO())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)

        const { message } = results[0].statusDetails
        const lines = message.split('\n')

        expect(lines[0]).toBe('Expect $(`login-app`).$(`<fn>`).$(`<fn>`).$(`<fn>`) to be displayed')
        expect(lines[1].trim()).toBe('Expected: "displayed"')
        expect(lines[2].trim()).toBe('Received: "not displayed"')
    })
})

describe('Pending tests', () => {
    let outputDir: any

    afterEach(() => {
        clean(outputDir)
    })

    it('should detect started pending test case', () => {
        outputDir = temporaryDirectory()

        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.SKIPPED)
        expect(results[0].stage).toEqual(Stage.PENDING)
    })

    it('should detect not started pending test case', () => {
        outputDir = temporaryDirectory()

        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.SKIPPED)
        expect(results[0].stage).toEqual(Stage.PENDING)
    })

    it('should detect not started pending test case after completed test', () => {
        outputDir = temporaryDirectory()

        const reporter = new AllureReporter({ outputDir })

        let passed = testStart()
        passed = {
            ...passed,
            title: passed.title + '2',
            uid: passed.uid + '2',
            fullTitle: passed.fullTitle + '2'
        }

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(passed)
        reporter.onTestPass()
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(2)

        const passedResult = results.find((result) => result.status === Status.PASSED)
        const skippedResult = results.find((result) => result.status === Status.SKIPPED)

        expect(passedResult.name).toEqual(passed.title)
        expect(passedResult.stage).toEqual(Stage.FINISHED)
        expect(skippedResult.name).toEqual('should can do something')
        expect(skippedResult.stage).toEqual(Stage.PENDING)
    })
})

describe('Hook start', () => {
    let outputDir: any

    beforeEach(() => {
        outputDir = temporaryDirectory()
    })

    afterEach(() => {
        clean(outputDir)
    })

    for (const hookFirst of [true, false]) {
        it(`should use currentTest if provided by hook and not report multiple tests when start hook comes ${hookFirst ? 'first' : 'second'}`, () => {
            const reporter = new AllureReporter({ outputDir })
            const runnerEvent = runnerStart()

            delete runnerEvent.capabilities.browserName
            delete runnerEvent.capabilities.version

            reporter.onRunnerStart(runnerEvent)
            reporter.onSuiteStart(suiteStart())

            if (hookFirst) {
                reporter.onHookStart(hookStartWithCurrentTest())
                reporter.onTestStart(testStart())
            } else {
                reporter.onTestStart(testStart())
                reporter.onHookStart(hookStartWithCurrentTest())
            }

            reporter.onTestFail(testFailed())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].name).toEqual('should can do something')
            expect(results[0].status).toEqual(Status.FAILED)
        })
    }
})

const assertionResults: any = {
    webdriver: {
        commandTitle: 'GET /session/:sessionId/element',
        screenshotTitle: 'GET /session/:sessionId/screenshot'
    },
    devtools: {
        commandTitle: 'getTitle',
        screenshotTitle: 'takeScreenshot'
    }
}

for (const protocol of ['webdriver', 'devtools']) {
    describe(`${protocol} command reporting`, () => {
        let outputDir: any

        beforeEach(() => {
            outputDir = temporaryDirectory()
        })

        afterEach(() => {
            clean(outputDir)
        })

        it('should not add step if no tests started', () => {
            const allureOptions = {
                stdout: true,
                outputDir
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onBeforeCommand(commandStart(protocol === 'devtools'))
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(0)
        })

        it('should not add step if isMultiremote = true', () => {
            const allureOptions = {
                stdout: true,
                outputDir
            }
            const reporter = new AllureReporter(allureOptions)
            reporter.onRunnerStart(Object.assign(runnerStart(), { isMultiremote: true }))
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onBeforeCommand(commandStart(protocol === 'devtools'))
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(0)
        })

        it('should not end step if it was not started', () => {
            const allureOptions = {
                stdout: true,
                outputDir
            }
            const reporter = new AllureReporter(allureOptions)
            reporter.onRunnerStart(Object.assign(runnerStart(), { isMultiremote: true }))
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(0)
        })

        it('should not add step if disableWebdriverStepsReporting = true', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableWebdriverStepsReporting: true
            }
            const reporter = new AllureReporter(allureOptions)
            reporter.onRunnerStart(Object.assign(runnerStart(),))
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onBeforeCommand(commandStart(protocol === 'devtools'))
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(0)
        })

        it('should add step from command', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onBeforeCommand(commandStart(protocol === 'devtools'))
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(1)

            const responseAttachments = results[0].steps[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Response'
            )

            expect(results[0].steps[0].name).toEqual(assertionResults[protocol].commandTitle)
            expect(responseAttachments).toHaveLength(1)
            expect(results[0].steps[0].status).toEqual(Status.PASSED)
        })

        it('should not empty attach for step from command', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())

            const command = commandStart(protocol === 'devtools')

            delete command.body

            reporter.onBeforeCommand(command)
            reporter.onAfterCommand(commandEnd(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(1)

            const requestAttachments = results[0].steps[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Request'
            )

            expect(results[0].steps[0].name).toEqual(assertionResults[protocol].commandTitle)
            expect(results[0].steps[0].status).toEqual(Status.PASSED)
            expect(requestAttachments).toHaveLength(0)
        })

        it('should add step with screenshot command', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onBeforeCommand(commandStartScreenShot(protocol === 'devtools'))
            reporter.onAfterCommand(commandEndScreenShot(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(1)

            const screenshotAttachments = results[0].steps[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Screenshot'
            )

            expect(results[0].steps[0].name).toEqual(assertionResults[protocol].screenshotTitle)
            expect(results[0].steps[0].status).toEqual(Status.PASSED)
            expect(screenshotAttachments).toHaveLength(1)
        })

        it('should not add step with screenshot command when disableWebdriverScreenshotsReporting=true', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableWebdriverScreenshotsReporting: true
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onTestStart(testStart())
            reporter.onBeforeCommand(commandStartScreenShot(protocol === 'devtools'))
            reporter.onAfterCommand(commandEndScreenShot(protocol === 'devtools'))
            reporter.onTestSkip(testPending())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(1)

            const screenshotAttachments = results[0].steps[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Screenshot'
            )

            expect(results[0].steps[0].name).toEqual(assertionResults[protocol].screenshotTitle)
            expect(results[0].steps[0].status).toEqual(Status.PASSED)
            expect(screenshotAttachments).toHaveLength(0)
        })

        it('should attach screenshot on hook failure', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableMochaHooks: true,
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            reporter.onHookStart(hookStart())
            reporter.onBeforeCommand(commandStartScreenShot(protocol === 'devtools'))
            reporter.onAfterCommand(commandEndScreenShot(protocol === 'devtools'))
            reporter.onHookEnd(hookFailed())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            const screenshotAttachments = results[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Screenshot'
            )

            expect(screenshotAttachments).toHaveLength(0)
        })

        it('should attach console log for passing test', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableMochaHooks: true,
                addConsoleLogs: true
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            //this shouldn't be logged
            log('Printing to console 1')
            reporter.onTestStart(testStart())
            //this should be logged
            log('Printing to console 2')
            //this shouldn't be logged
            log('Printing webdriver to console 2')
            reporter.onTestPass()
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            const consoleAttachments = results[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Console Logs'
            )

            expect(consoleAttachments).toHaveLength(1)
        })

        it('should attach console log for failing test', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableMochaHooks: true,
                addConsoleLogs: true
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            //this shouldn't be logged
            log('Printing to console 1')
            reporter.onTestStart(testStart())
            //this should be logged
            log('Printing to console 2')
            //this shouldn't be logged
            log('Printing webdriver to console 2')
            reporter.onTestFail(testFailed())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)

            const consoleAttachments = results[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Console Logs'
            )

            expect(consoleAttachments).toHaveLength(1)
        })

        it('should attach console log for skipping test', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableMochaHooks: true,
                addConsoleLogs: true
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            //this shouldn't be logged
            log('Printing to console 1')
            reporter.onTestStart(testStart())
            //this should be logged
            log('Printing to console 2')
            //this shouldn't be logged
            log('Printing webdriver to console 2')
            reporter.onTestSkip(testFailed())
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)
            const consoleAttachments = results[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Console Logs'
            )

            expect(results).toHaveLength(1)
            expect(consoleAttachments).toHaveLength(1)
        })

        it('should not attach webdriver logs', () => {
            const allureOptions = {
                stdout: true,
                outputDir,
                disableMochaHooks: true,
                addConsoleLogs: true
            }
            const reporter = new AllureReporter(allureOptions)

            reporter.onRunnerStart(runnerStart())
            reporter.onSuiteStart(suiteStart())
            //this shouldn't be logged
            log('Printing to console 1')
            reporter.onTestStart(testStart())
            //this shouldn't be logged
            log('Printing mwebdriver to console 2')
            reporter.onTestPass()
            reporter.onSuiteEnd(suiteEnd())
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)
            const consoleAttachments = results[0].attachments.filter(
                (attachment: Attachment) => attachment.name === 'Console Logs'
            )

            expect(results).toHaveLength(1)
            expect(consoleAttachments).toHaveLength(0)
        })
    })
}
