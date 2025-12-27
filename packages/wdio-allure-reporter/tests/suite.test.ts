import path from 'node:path'
import { log } from 'node:console'
import { describe, it, expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import type { Label, Parameter, Link, Attachment } from 'allure-js-commons'
import { LabelName } from 'allure-js-commons'
import { Status, LinkType, Stage } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { DescriptionType } from '../src/types.js'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */

import { clean, getResults, mapBy } from './helpers/wdio-allure-helper.js'

import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import {
    testFailed, testPending, testStart, testFailedWithMultipleErrors, testFailedWithMultipleErrorsAndStacksNotContainingMessages,
    hookStart, hookFailed,
    testFailedWithAssertionErrorFromExpectWebdriverIO, eachHookFailed, eachHookStart, testPassed
} from './__fixtures__/testState.js'
import {
    commandStart, commandEnd, commandEndScreenShot, commandStartScreenShot
} from './__fixtures__/command.js'
import type { AfterCommandArgs, BeforeCommandArgs } from '@wdio/reporter'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

let processOnSpy: ReturnType<typeof vi.spyOn>
beforeAll(() => {
    processOnSpy = vi.spyOn(process, 'on')
})
afterAll(() => {
    processOnSpy.mockRestore()
})

describe('Passing tests', () => {
    const outputDir = temporaryDirectory()
    let allureResult: Record<string, any>
    let allureContainer: Record<string, any>
    let allureEnvInfo: Record<string, any>

    beforeAll(async () => {
        const reporter = new AllureReporter({
            outputDir,
            issueLinkTemplate: 'https://example.org/issues/{}',
            tmsLinkTemplate: 'https://example.org/tests/{}',
            reportedEnvironmentVars: {
                jenkins: '1.2.3',
                OS: 'Mocked'
            }
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
        reporter.addDescription({ description: 'functions', descriptionType: DescriptionType.HTML })
        reporter.addAttachment({ name: 'My attachment', content: '99thoughtz', type: 'text/plain' })
        reporter.addArgument({ name: 'os', value: 'osx' })
        reporter.addArgument({ name: 'p1', value: 'p1', mode: 'default' })
        reporter.addArgument({ name: 'p2', value: 'p2', mode: 'masked' })
        reporter.addArgument({ name: 'p3', value: 'p3', mode: 'hidden' })
        reporter.addArgument({ name: 'p4', value: 'p4', excluded: true })
        reporter.startStep('bar')
        reporter.endStep(Status.PASSED)
        reporter.addStep(step)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results, containers, environmentInfo } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(Object.values(environmentInfo)).toHaveLength(2)

        allureResult = results[0]
        allureContainer = containers[0] ?? {}
        allureEnvInfo = environmentInfo
    })

    afterAll(() => {
        clean(outputDir)
    })

    it('should report one suite', () => {
        expect(allureResult.labels.find(l => l.name === 'parentSuite')?.value).toEqual('A passing Suite')
        expect(allureResult.name).toEqual('should can do something')
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

        expect(features).toHaveLength(1)
        expect(features[0]).toEqual({ name: LabelName.FEATURE, value: 'foo' })
        expect(customLabels).toHaveLength(1)
        expect(customLabels[0].value).toEqual('Label')
        expect(stories).toHaveLength(1)
        expect(stories[0].value).toEqual('Story')
        expect(severities).toHaveLength(1)
        expect(severities[0].value).toEqual('baz')
        expect(threads).toHaveLength(1)
        expect(threads[0].value).toEqual(testStart().cid)
        expect(packages).toHaveLength(1)
        expect(packages[0].value).toContain('.spec.js')
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

    it('should contain environment variables', () => {
        expect(Object.keys(allureEnvInfo)).toHaveLength(2)
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
        const allureParams = allureResult.parameters

        expect(allureParams).toHaveLength(6)
        expect(allureParams[0].name).toEqual('browser')
        expect(allureParams[1].value).toEqual('osx')

        expect(allureParams[2].value).toEqual('p1')
        expect(allureParams[2].mode).toEqual('default')

        expect(allureParams[3].value).toEqual('p2')
        expect(allureParams[3].mode).toEqual('masked')

        expect(allureParams[4].value).toEqual('p3')
        expect(allureParams[4].mode).toEqual('hidden')

        expect(allureParams[5].value).toEqual('p4')
        expect(allureParams[5].excluded).toEqual(true)
    })

    it('should have testCaseId equal to historyId', () => {
        expect(allureResult.testCaseId).toEqual(allureResult.historyId)
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

    it('should detect failed test case', async () => {
        const reporter = new AllureReporter({ outputDir })

        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const browserParameter = results[0].parameters.find(
            (param: Parameter) => param.name === 'browser',
        )

        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)
        expect(results[0].parameters).toHaveLength(1)
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')
        expect(browserParameter!.value).toEqual('default')
    })

    it('should detect failed test case onTestRetry', async () => {
        const reporter = new AllureReporter({ outputDir })

        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestRetry(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const browserParameter = results[0].parameters.find((param: Parameter) => param.name === 'browser')

        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)
        expect(results[0].parameters).toHaveLength(1)
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')
        expect(browserParameter!.value).toEqual('default')
    })

    it('should detect failed test case without start event', async () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')
    })

    it('should detect failed test case with multiple errors', async () => {
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
        await reporter.onRunnerEnd(runnerEnd())

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

    it('should detect failed test case with multiple errors whose stacks do not contain error messages', async () => {
        const reporter = new AllureReporter({ outputDir })
        const runnerEvent = runnerStart()

        runnerEvent.config.framework = 'jasmine'

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailedWithMultipleErrorsAndStacksNotContainingMessages())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.FAILED)

        const { message } = results[0].statusDetails
        const lines = message.split('\n')

        expect(lines[0]).toBe('CompoundError: One or more errors occurred. ---')
        expect(lines[2].trim()).toBe('ReferenceError: All is Dust')
        expect(lines[4].trim()).toBe('stack trace of ReferenceError')
        expect(lines[7].trim()).toBe('InternalError: Abandon Hope')
        expect(lines[9].trim()).toBe('stack trace of InternalError')
    })

    it('should detect failed test case with Assertion failed from expect-webdriverIO', async () => {
        const reporter = new AllureReporter({ outputDir })

        const runnerEvent = runnerStart()
        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestFail(testFailedWithAssertionErrorFromExpectWebdriverIO())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

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

    it('should detect started pending test case', async () => {
        outputDir = temporaryDirectory()

        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.SKIPPED)
        expect(results[0].stage).toEqual(Stage.PENDING)
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')
    })

    it('should detect not started pending test case', async () => {
        outputDir = temporaryDirectory()

        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].status).toEqual(Status.SKIPPED)
        expect(results[0].stage).toEqual(Stage.PENDING)
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')
    })

    it('should detect not started pending test case after completed test', async () => {
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
        reporter.onTestPass(testPassed())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(2)

        const passedResult = results.find((result: any) => result.status === Status.PASSED)
        const skippedResult = results.find((result: any) => result.status === Status.SKIPPED)

        expect(passedResult.name).toEqual(passed.title)
        expect(passedResult.stage).toEqual(Stage.FINISHED)
        expect(skippedResult.name).toEqual('should can do something')
        expect(skippedResult.stage).toEqual(Stage.PENDING)
    })
})

describe('Multi-capability parallel execution', () => {
    let outputDir: any

    beforeEach(() => {
        outputDir = temporaryDirectory()
    })

    afterEach(() => {
        clean(outputDir)
    })

    it('should generate distinct historyIds for same test across different capabilities (fixes #14792)', async () => {
        // Simulate two parallel reporters running the same test with different cids
        const reporter1 = new AllureReporter({ outputDir })
        const reporter2 = new AllureReporter({ outputDir })

        const runner1 = { ...runnerStart(), cid: '0-0' }
        const runner2 = { ...runnerStart(), cid: '0-1' }

        const test = testStart() // Same test with same UID

        // Worker 1 (capability 1)
        reporter1.onRunnerStart(runner1)
        reporter1.onSuiteStart(suiteStart())
        reporter1.onTestStart(test)
        reporter1.onTestPass(testPassed())
        reporter1.onSuiteEnd(suiteEnd())
        await reporter1.onRunnerEnd(runnerEnd())

        // Worker 2 (capability 2)
        reporter2.onRunnerStart(runner2)
        reporter2.onSuiteStart(suiteStart())
        reporter2.onTestStart(test)
        reporter2.onTestPass(testPassed())
        reporter2.onSuiteEnd(suiteEnd())
        await reporter2.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        // Verify we have 2 distinct result files (not 1 overwritten file)
        expect(results).toHaveLength(2)

        // Verify both results have unique UUIDs
        const uuids = results.map((r: any) => r.uuid)
        expect(new Set(uuids).size).toBe(2)

        // Verify both results have unique historyIds (this is what prevents overwrites)
        const historyIds = results.map((r: any) => r.historyId)
        expect(new Set(historyIds).size).toBe(2)

        // Verify the historyIds are different (the bug was they were the same)
        expect(historyIds[0]).not.toEqual(historyIds[1])

        // Both should be the same test name
        expect(results[0].name).toEqual(results[1].name)
        expect(results[0].name).toEqual('should can do something')
    })

    it('should include cid in historyId calculation', async () => {
        const reporter = new AllureReporter({ outputDir })

        const runner = { ...runnerStart(), cid: '0-0' }

        reporter.onRunnerStart(runner)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        // The historyId should be the md5 hash of "fullTitle#cid"
        // This ensures different capabilities get different hashes
        expect(results[0].historyId).toEqual('9fd3aec777150aff9e56ec3dcdb64975')

        // This is the new hash format: md5('My awesome feature should can do something#0-0')
        // Old format was: md5('My awesome feature should can do something') = '195dd4bd8fdce339d6d2264e50de9e6f'
    })
})

describe('Hook reporting', () => {
    let outputDir: any

    beforeEach(() => {
        outputDir = temporaryDirectory()
    })

    afterEach(() => {
        clean(outputDir)
    })

    it('should report failed all hook', async () => {
        const reporter = new AllureReporter({ outputDir })
        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart(hookStart())
        reporter.onHookEnd(hookFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('"before all" hook for "should login with valid credentials"')
    })

    it('should report failed before each hook', async () => {
        const reporter = new AllureReporter({ outputDir })
        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart(eachHookStart())
        reporter.onHookEnd(eachHookFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
    })

    it('should report failed before each hook with disableMochaHooks', async () => {
        const reporter = new AllureReporter({ outputDir, disableMochaHooks: true })
        const runnerEvent = runnerStart()

        delete runnerEvent.capabilities.browserName
        delete runnerEvent.capabilities.version

        reporter.onRunnerStart(runnerEvent)
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart(eachHookStart())
        reporter.onHookEnd(eachHookFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
    })
})

describe('Allure ID', () => {
    const outputDir = temporaryDirectory()
    let allureResult: Record<string, any>

    beforeAll(async () => {
        const reporter = new AllureReporter({
            outputDir
        })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.addAllureId({ id: 'explicitly set allureId' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        allureResult = results[0]
    })

    afterAll(() => {
        clean(outputDir)
    })

    it('explicitly set allureId overrides testCaseId ', () => {
        const labels = mapBy<Label>(allureResult.labels, 'name')

        const allureId = labels[LabelName.AS_ID]
        expect(allureId).toHaveLength(1)
        expect(allureId[0].value).toEqual('explicitly set allureId')
        expect(allureResult.testCaseId).toBeDefined()
    })
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

describe('command reporting', () => {
    let outputDir: any

    beforeEach(() => {
        outputDir = temporaryDirectory()
    })

    afterEach(() => {
        clean(outputDir)
    })

    it('should not add step if no tests started', async () => {
        const allureOptions = {
            stdout: true,
            outputDir
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onBeforeCommand(commandStart(false))
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(0)
    })

    it('should not add step if isMultiremote = true', async () => {
        const allureOptions = {
            stdout: true,
            outputDir
        }
        const reporter = new AllureReporter(allureOptions)
        reporter.onRunnerStart(Object.assign(runnerStart(), { isMultiremote: true }))
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStart(false))
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(0)
    })

    it('should not end step if it was not started', async () => {
        const allureOptions = {
            stdout: true,
            outputDir
        }
        const reporter = new AllureReporter(allureOptions)
        reporter.onRunnerStart(Object.assign(runnerStart(), { isMultiremote: true }))
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(0)
    })

    it('should not add step if disableWebdriverStepsReporting = true', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableWebdriverStepsReporting: true
        }
        const reporter = new AllureReporter(allureOptions)
        reporter.onRunnerStart(Object.assign(runnerStart(),))
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStart(false))
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(0)
    })

    it('should add step from command', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStart(false))
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual(assertionResults['webdriver'].commandTitle)
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(results[0].steps[0].attachments).toEqual(
            [{
                name: 'Request',
                type: 'application/json',
                source: expect.any(String),
            },
            {
                name: 'Response',
                type: 'application/json',
                source: expect.any(String),
            }]
        )
    })

    it('should add step from custom command', async () => {
        const sessionId = '1234'
        const customCommandBeforeArgs = {
            sessionId,
            command: 'customCommand',
            body: ['arg1', 1, true, { foo: 'bar' }],
        } satisfies BeforeCommandArgs
        const customCommandAfterArgs = {
            sessionId,
            command: 'customCommand',
            result: {
                value: {
                    foo: 'bar',
                    bar: 1,
                    baz: true
                }
            }
        } satisfies AfterCommandArgs

        const allureOptions = {
            stdout: true,
            outputDir,
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(customCommandBeforeArgs)
        reporter.onAfterCommand(customCommandAfterArgs)
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual('customCommand')
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(results[0].steps[0].attachments).toEqual(
            [{
                name: 'Request',
                type: 'application/json',
                source: expect.any(String),
            },
            {
                name: 'Response',
                type: 'application/json',
                source: expect.any(String),
            }]
        )
    })

    it('should add step from unknown command', async () => {
        const sessionId = '1234'
        const customCommandBeforeArgs = {
            sessionId,
            body: undefined,
        } satisfies BeforeCommandArgs
        const customCommandAfterArgs = {
            sessionId,
            result: undefined
        } satisfies AfterCommandArgs

        const allureOptions = {
            stdout: true,
            outputDir,
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(customCommandBeforeArgs)
        reporter.onAfterCommand(customCommandAfterArgs)
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual('unknown command')
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(results[0].steps[0].attachments).toEqual([])
    })

    it('should add step from failed command', async () => {
        const error = new Error('Command failed')
        const command = {
            sessionId: '4d1707ae-820f-1645-8485-5a820b2a40da',
            method: 'GET',
            endpoint: '/session/:sessionId/element',
            cid: '0-0'
        }
        const beforeCommand = {
            ...command,
            body: { using: 'css selector', value: 'img' },
        } satisfies BeforeCommandArgs
        const afterCommandFailure = {
            ...command,
            result: { error }
        } satisfies AfterCommandArgs

        const allureOptions = { stdout: true, outputDir }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(beforeCommand)
        reporter.onAfterCommand(afterCommandFailure)
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual(assertionResults['webdriver'].commandTitle)
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(results[0].steps[0].attachments).toEqual(
            [{
                name: 'Request',
                type: 'application/json',
                source: expect.any(String),
            },
            {
                name: 'Response',
                type: 'text/plain',
                source: expect.any(String),
            }]
        )
    })

    it('should not empty attach for step from command', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        const command = commandStart(false)
        delete (command as any).body

        reporter.onBeforeCommand(command)
        reporter.onAfterCommand(commandEnd(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)

        const requestAttachments = results[0].steps[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Request'
        )

        expect(results[0].steps[0].name).toEqual(assertionResults['webdriver'].commandTitle)
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(requestAttachments).toHaveLength(0)
    })

    it('should add step with screenshot command', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStartScreenShot(false))
        reporter.onAfterCommand(commandEndScreenShot(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)

        const screenshotAttachments = results[0].steps[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Screenshot'
        )

        expect(results[0].steps[0].name).toEqual(assertionResults['webdriver'].screenshotTitle)
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(screenshotAttachments).toHaveLength(1)
    })

    it('should add step with screenshot command when disableWebdriverStepsReporting=true', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableWebdriverStepsReporting: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStartScreenShot(false))
        reporter.onAfterCommand(commandEndScreenShot(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const screenshotAttachments = results[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Screenshot'
        )
        expect(screenshotAttachments).toHaveLength(1)
    })

    it('should not add step with screenshot command when disableWebdriverScreenshotsReporting=true', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableWebdriverScreenshotsReporting: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStartScreenShot(false))
        reporter.onAfterCommand(commandEndScreenShot(false))
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)

        const screenshotAttachments = results[0].steps[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Screenshot'
        )

        expect(results[0].steps[0].name).toEqual(assertionResults['webdriver'].screenshotTitle)
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(screenshotAttachments).toHaveLength(0)
    })

    it('should attach screenshot on hook failure', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableMochaHooks: true,
            disableWebdriverStepsReporting: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart(hookStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(commandStartScreenShot(false))
        reporter.onAfterCommand(commandEndScreenShot(false))
        reporter.onHookEnd(hookFailed())
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)

        const result = results.find((res: any) => res.attachments.length === 1)
        expect(result).toBeDefined()

        const screenshotAttachments = result.attachments.filter(
            (attachment: Attachment) => attachment.name === 'Screenshot'
        )

        expect(screenshotAttachments).toHaveLength(1)
    })

    it('should attach console log for passing test', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableMochaHooks: true,
            addConsoleLogs: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        log('Printing to console 1')
        reporter.onTestStart(testStart())
        log('Printing to console 2')
        log('Printing webdriver to console 2')
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const consoleAttachments = results[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Console Logs'
        )

        expect(consoleAttachments).toHaveLength(1)
    })

    it('should attach console log for failing test', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableMochaHooks: true,
            addConsoleLogs: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        log('Printing to console 1')
        reporter.onTestStart(testStart())
        log('Printing to console 2')
        log('Printing webdriver to console 2')
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)

        const consoleAttachments = results[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Console Logs'
        )

        expect(consoleAttachments).toHaveLength(1)
    })

    it('should attach console log for skipping test', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableMochaHooks: true,
            addConsoleLogs: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        log('Printing to console 1')
        reporter.onTestStart(testStart())
        log('Printing to console 2')
        log('Printing webdriver to console 2')
        reporter.onTestSkip(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const consoleAttachments = results[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Console Logs'
        )

        expect(results).toHaveLength(1)
        expect(consoleAttachments).toHaveLength(1)
    })

    it('should not attach webdriver logs', async () => {
        const allureOptions = {
            stdout: true,
            outputDir,
            disableMochaHooks: true,
            addConsoleLogs: true
        }
        const reporter = new AllureReporter(allureOptions)

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        log('Printing to console 1')
        reporter.onTestStart(testStart())
        log('Printing mwebdriver to console 2')
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const consoleAttachments = results[0].attachments.filter(
            (attachment: Attachment) => attachment.name === 'Console Logs'
        )

        expect(results).toHaveLength(1)
        expect(consoleAttachments).toHaveLength(0)
    })
})
