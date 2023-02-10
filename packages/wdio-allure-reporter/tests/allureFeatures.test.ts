import path from 'node:path'
import type { SpyInstance } from 'vitest'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import type { CommandArgs, SuiteStats, TestStats } from '@wdio/reporter'
import { FileSystemAllureWriter, AllureTest, AllureStep, Status, LabelName, LinkType, AllureRuntime, ContentType, TestResult } from 'allure-js-commons'
import AllureReporter from '../src/reporter.js'
import { linkPlaceholder } from '../src/constants.js'
import { TYPE } from '../src/types.js'
import { getSuitesFromReporter, getTestsFromReporter, getStepsFromReporter } from './helpers/wdio-allure-helper'
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

const fixtures = {
    testStats: {
        uid: '1',
        cid: '0-0',
        title: 'my test',
        duration: 0,
        _duration: 0,
        parent: undefined,
        type: 'scenario',
        start: new Date(),
        complete: vi.fn(),
    }
}

let processOn: any

beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = vi.fn()

    // TODO: move somewhere
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeAttachment').mockImplementation(() => {})
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeAttachmentFromPath').mockImplementation(() => {})
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeResult').mockImplementation(() => {})
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeGroup').mockImplementation(() => {})
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeEnvironmentInfo').mockImplementation(() => {})
    vi.spyOn(FileSystemAllureWriter.prototype, 'writeCategoriesDefinitions').mockImplementation(() => {})
})

afterAll(() => {
    process.on = processOn
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reporter runtime implementation', () => {
    it('should correct add custom label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addLabel({ name: 'customLabel', value: 'Label' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith('customLabel', 'Label')
    })

    it('should correct add story label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addStory({ storyName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.STORY, 'foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addFeature({ featureName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.FEATURE, 'foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addSeverity({ severity: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.SEVERITY, 'foo')
    })

    it('should correct add suite label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addSuite({ suiteName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.SUITE, 'foo')
    })

    it('should correct add subSuite label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addSubSuite({ suiteName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.SUB_SUITE, 'foo')
    })

    it('should correct add parentSuite label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addParentSuite({ suiteName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.PARENT_SUITE, 'foo')
    })

    it('should correct add tag label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addTag({ tag: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.TAG, 'foo')
    })

    it('should correct add epic label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addEpic({ epicName: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.EPIC, 'foo')
    })

    it('should correct add allure id label', () => {
        const reporter = new AllureReporter()
        const addLabelSpy = vi.spyOn(AllureTest.prototype, 'addLabel')

        reporter.onTestStart(fixtures.testStats)
        addLabelSpy.mockClear()
        reporter.addAllureId({ id: 'foo' })

        expect(addLabelSpy).toHaveBeenCalledTimes(1)
        expect(addLabelSpy).toHaveBeenCalledWith(LabelName.AS_ID, 'foo')
    })

    it('should correctly add issue label with link', () => {
        const reporter = new AllureReporter({ issueLinkTemplate: `http://example.com/${linkPlaceholder}` })
        const addLinkSpy = vi.spyOn(AllureTest.prototype, 'addLink')

        reporter.onTestStart(fixtures.testStats)
        reporter.addIssue({ issue: '1' })

        expect(addLinkSpy).toHaveBeenCalledTimes(1)
        expect(addLinkSpy).toHaveBeenCalledWith('http://example.com/1', undefined, LinkType.ISSUE)
    })

    it('should correctly add test id label with link', () => {
        const reporter = new AllureReporter({ tmsLinkTemplate: `https://webdriver.io/${linkPlaceholder}` })
        const addLinkSpy = vi.spyOn(AllureTest.prototype, 'addLink')

        reporter.onTestStart(fixtures.testStats)
        reporter.addTestId({ testId: '2' })

        expect(addLinkSpy).toHaveBeenCalledTimes(1)
        expect(addLinkSpy).toHaveBeenCalledWith('https://webdriver.io/2', undefined, LinkType.TMS)
    })

    it('should correct add environment', () => {
        const reporter = new AllureReporter()
        const writeEnvironmentSpy = vi.spyOn(AllureRuntime.prototype, 'writeEnvironmentInfo')

        reporter.addEnvironment({ name: 'foo', value: 'bar' })

        expect(writeEnvironmentSpy).toHaveBeenCalledTimes(1)
        expect(writeEnvironmentSpy).toHaveBeenCalledWith({ foo: 'bar' })
    })

    it('should correct add description', () => {
        const reporter = new AllureReporter()

        reporter.onTestStart(fixtures.testStats)
        reporter.addDescription({
            description: 'foo',
            descriptionType: TYPE.MARKDOWN
        })

        expect(reporter.currentTest.wrappedItem.description).toBe('foo')
    })

    it('should correct add html description', () => {
        const reporter = new AllureReporter()

        reporter.onTestStart(fixtures.testStats)
        reporter.addDescription({
            description: 'foo',
            descriptionType: TYPE.HTML
        })

        expect(reporter.currentTest.wrappedItem.descriptionHtml).toBe('foo')
    })

    it('should correct add attachment', () => {
        const reporter = new AllureReporter()
        const attachFileSpy = vi.spyOn(reporter, 'attachFile')

        reporter.onTestStart(fixtures.testStats)
        reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.TEXT })

        expect(attachFileSpy).toHaveBeenCalledTimes(1)
        expect(attachFileSpy).toHaveBeenCalledWith('foo', Buffer.from('bar'), ContentType.TEXT)
    })

    it('should correct add "application/json" attachment', () => {
        const reporter = new AllureReporter()
        const attachJSONSpy = vi.spyOn(reporter, 'attachJSON')

        reporter.onTestStart(fixtures.testStats)
        reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.JSON })

        expect(attachJSONSpy).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should allow to start end step', () => {
        const reporter = new AllureReporter()
        const endTestSpy = vi.spyOn(reporter, '_endTest')

        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.startStep('bar')

        let steps = getStepsFromReporter(reporter)

        expect(steps).toHaveLength(1)
        expect(steps[0].wrappedItem.name).toEqual('bar')

        reporter.endStep(Status.FAILED)

        steps = getStepsFromReporter(reporter)

        expect(steps).toHaveLength(0)
        expect(endTestSpy).toHaveBeenCalledTimes(1)
        expect(endTestSpy).toHaveBeenCalledWith(Status.FAILED)
    })

    it('should correct add step with attachment', () => {
        const reporter = new AllureReporter()
        const startStepSpy = vi.spyOn(reporter, '_startStep')
        const endTestSpy = vi.spyOn(reporter, '_endTest')
        const attachFileSpy = vi.spyOn(reporter, 'attachFile')
        const step = {
            step: {
                attachment: { content: 'baz', name: 'attachment' },
                status: Status.PASSED,
                title: 'foo'
            }
        }

        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.addStep(step)

        expect(startStepSpy).toHaveBeenCalledTimes(1)
        expect(startStepSpy).toHaveBeenCalledWith(step.step.title)
        expect(endTestSpy).toHaveBeenCalledTimes(1)
        expect(endTestSpy).toHaveBeenCalledWith(step.step.status)
        expect(attachFileSpy).toHaveBeenCalledTimes(1)
        expect(attachFileSpy).toHaveBeenCalledWith(step.step.attachment.name, step.step.attachment.content, ContentType.TEXT)
    })

    it('should correct add step without attachment', () => {
        const reporter = new AllureReporter()
        const startStepSpy = vi.spyOn(reporter, '_startStep')
        const endTestSpy = vi.spyOn(reporter, '_endTest')
        const step = {
            step: {
                status: Status.PASSED,
                title: 'foo'
            }
        }

        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.addStep(step)

        expect(startStepSpy).toHaveBeenCalledTimes(1)
        expect(startStepSpy).toHaveBeenCalledWith(step.step.title)
        expect(endTestSpy).toHaveBeenCalledTimes(1)
        expect(endTestSpy).toHaveBeenCalledWith(step.step.status)
    })

    it('should correctly add parameter', () => {
        const reporter = new AllureReporter()
        const addParameterSpy = vi.spyOn(AllureTest.prototype, 'addParameter')

        reporter.onTestStart(fixtures.testStats)
        addParameterSpy.mockClear()
        reporter.addArgument({ name: 'os', value: 'osx' })

        expect(addParameterSpy).toHaveBeenCalledTimes(1)
        expect(addParameterSpy).toHaveBeenCalledWith('os', 'osx')
    })

    // TODO
    it.skip('should do nothing if no tests run', () => {
        const reporter = new AllureReporter()

        expect(reporter.addLabel({ name: 'foo', value: 'bar' }))
            .toEqual(false)
        expect(reporter.addStory({ storyName: 'foobar' }))
            .toEqual(false)
        expect(reporter.addFeature({ featureName: 'foobar' }))
            .toEqual(false)
        expect(reporter.addSeverity({ severity: 'foobar' }))
            .toEqual(false)
        expect(reporter.addIssue({ issue: 'foobar' }))
            .toEqual(false)
        expect(reporter.addTestId({ testId: '123' }))
            .toEqual(false)
        expect(reporter.addEnvironment({ name: 'foo', value: 'bar' }))
            .toEqual(false)
        expect(reporter.addDescription({ description: 'foobar' }))
            .toEqual(false)
        expect(reporter.addAttachment({ name: '', content: '', type: '' }))
            .toEqual(false)
        expect(reporter.startStep('test')).toEqual(false)
        expect(reporter.endStep('passed')).toEqual(false)
        expect(reporter.addStep({})).toEqual(false)
        expect(reporter.addArgument({})).toEqual(false)
    })

    describe('add argument', () => {
        let addParameterSpy: SpyInstance
        let reporter: any

        beforeEach(() => {
            reporter = new AllureReporter()

            addParameterSpy = vi.spyOn(AllureTest.prototype, 'addParameter')
        })

        it('should correctly add argument for selenium', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { browserName: 'firefox', version: '1.2.3' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameterSpy).toHaveBeenCalledTimes(1)
            expect(addParameterSpy).toHaveBeenCalledWith('browser', 'firefox-1.2.3')
        })

        it('should correctly set proper browser version for chrome headless in devtools', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { browserName: 'Chrome Headless', browserVersion: '85.0.4183.84' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameterSpy).toHaveBeenCalledTimes(1)
            expect(addParameterSpy).toHaveBeenCalledWith('browser', 'Chrome Headless-85.0.4183.84')
        })

        it('should correctly add argument for appium', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { deviceName: 'Android Emulator', platformVersion: '8.0' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameterSpy).toHaveBeenCalledTimes(1)
            expect(addParameterSpy).toHaveBeenCalledWith('device', 'Android Emulator-8.0')
        })

        it('should correctly add device name when run on BrowserStack', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { device: 'Google Pixel 3', platformVersion: '9.0' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameterSpy).toHaveBeenCalledTimes(1)
            expect(addParameterSpy).toHaveBeenCalledWith('device', 'Google Pixel 3-9.0')
        })

        it('should correctly add argument for multiremote', () => {
            reporter.onRunnerStart({ isMultiremote: true, config: { capabilities: { myBrowser: { browserName: 'chrome' } } } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameterSpy).toHaveBeenCalledTimes(1)
            expect(addParameterSpy).toHaveBeenCalledWith('isMultiremote', 'true')
        })
    })
})

describe('auxiliary methods', () => {
    it('isScreenshotCommand', () => {
        const reporter = new AllureReporter()

        expect(reporter.isScreenshotCommand({ endpoint: '/session/id/screenshot' } as CommandArgs)).toEqual(true)
        expect(reporter.isScreenshotCommand({ endpoint: '/wdu/hub/session/id/screenshot' } as CommandArgs)).toEqual(true)
        expect(reporter.isScreenshotCommand({ endpoint: '/session/id/click' } as CommandArgs)).toEqual(false)
        expect(reporter.isScreenshotCommand({ command: 'takeScreenshot' } as CommandArgs)).toEqual(true)
        expect(reporter.isScreenshotCommand({ command: 'elementClick' } as CommandArgs)).toEqual(false)
        expect(reporter.isScreenshotCommand({ endpoint: '/session/id/element/id/screenshot' } as CommandArgs)).toEqual(true)
    })

    it('attachJSON', () => {
        const reporter = new AllureReporter()
        const attachFileSpy = vi.spyOn(reporter, 'attachFile')
        const json = { bar: 'baz' }

        reporter.onTestStart(fixtures.testStats)
        reporter.attachJSON('foo', json)

        expect(attachFileSpy).toHaveBeenCalledTimes(1)
        expect(attachFileSpy).toHaveBeenCalledWith('foo', JSON.stringify(json, null, 2), ContentType.JSON)
    })

    it('should populate the correct deviceName', () => {
        const capabilities = {
            deviceName: 'emulator',
            desired: {
                platformName: 'Android',
                automationName: 'UiAutomator2',
                deviceName: 'Android GoogleAPI Emulator',
                platformVersion: '6.0',
                noReset: true,
            }
        }
        const reporter = new AllureReporter()
        const addParameterSpy = vi.spyOn(AllureTest.prototype, 'addParameter')

        reporter['_isMultiremote'] = false
        reporter['_capabilities'] = capabilities
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' } as TestStats)

        expect(addParameterSpy).toHaveBeenCalledWith('device', 'Android GoogleAPI Emulator 6.0')
    })
})

// TODO: check twice the checks here, seems some of them doesn't look so obvious and good
describe('hooks handling disabled Mocha Hooks', () => {
    let startTestSpy: SpyInstance
    let startStepSpy: SpyInstance
    let endTestSpy: SpyInstance
    let reporter: any

    beforeEach(() => {
        reporter = new AllureReporter({ disableMochaHooks: true })
        startTestSpy = vi.spyOn(reporter, '_startTest')
        startStepSpy = vi.spyOn(reporter, '_startStep')
        endTestSpy = vi.spyOn(reporter, '_endTest')
    })

    it('should add test on custom hook', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('foo')
        expect(steps).toHaveLength(0)
    })

    it('should not add test if no suite', () => {
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
    })

    it('should ignore global mocha hooks', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"after all" hook', parent: '' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
    })

    it('should capture mocha each hooks', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ cid: '0-0', title: '"before each" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(1)
        expect(steps[0].wrappedItem.name).toEqual('"before each" hook')
    })

    it('should ignore mocha each hooks if no test', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('"after each" hook')
        expect(steps).toHaveLength(0)
    })

    it('should not start test onHookStart if no suite', () => {
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
    })

    it('should not end pop any test onHookEnd if no suite', () => {
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
    })

    it('should ignore mocha hook end if no test', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
        expect(startTestSpy).not.toHaveBeenCalled()
        expect(startStepSpy).not.toHaveBeenCalled()
    })

    it('should ignore global mocha end hooks', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookEnd({ title: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
        expect(startTestSpy).not.toHaveBeenCalled()
        expect(startStepSpy).not.toHaveBeenCalled()
    })

    it('should not pop test case if no steps and before hook', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
    })

    it('should pop test case if no steps and custom hook', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookEnd({ title: 'bar', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
        expect(endTestSpy).toHaveBeenCalledWith(Status.PASSED)
    })

    it('should keep passed hooks if there are some steps', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(1)
        expect(steps[0].wrappedItem.name).toEqual('SomeCommandStep')
        expect(endTestSpy).toHaveBeenCalledWith(Status.PASSED)
    })

    it('should keep failed hooks if there no some steps', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
        expect(endTestSpy).toHaveBeenCalledWith(Status.BROKEN, { message: '', stack: '' })
    })

    it('should keep failed hooks if there are some steps', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(1)
        expect(steps[0].wrappedItem.name).toEqual('SomeCommandStep')
        expect(endTestSpy).toHaveBeenLastCalledWith(Status.BROKEN, { message: '', stack: '' })
    })

    it('should capture mocha each hooks end - passed', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after each" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
        expect(endTestSpy).toHaveBeenLastCalledWith(Status.PASSED, undefined)
    })

    it('should capture mocha each hooks end - failed', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before each" hook', parent: 'foo', error: { message: '', stack: '' } })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
        expect(endTestSpy).toHaveBeenLastCalledWith(Status.FAILED, { message: '', stack: '' })
    })

    it('should ignore mocha all hooks if hook passes', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
        expect(endTestSpy).not.toHaveBeenCalled()
    })

    it('should treat mocha all hooks as tests if hook throws', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo', error: { message: '', stack: '' } })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(0)
        expect(steps).toHaveLength(0)
        expect(startTestSpy).toHaveBeenCalledTimes(1)
        expect(endTestSpy).toHaveBeenCalledWith(Status.BROKEN, { message: '', stack: '' })
    })

    // TODO: add test for removing child steps after parent test finish
})

describe('hooks handling default', () => {
    let endTestSpy: SpyInstance
    let reporter: any

    beforeEach(() => {
        reporter = new AllureReporter({ disableMochaHooks: true })
        endTestSpy = vi.spyOn(reporter, '_endTest')
    })

    it('should capture mocha each hooks ', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('"before each" hook')
        expect(steps).toHaveLength(0)
    })

    it('should not ignore mocha each hooks if no test', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('"after each" hook')
        expect(steps).toHaveLength(0)
    })

    it('should keep passed hooks if there are no steps (before/after)', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"before all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(0)
        expect(endTestSpy).not.toHaveBeenCalled()
    })

    it('should keep passed hooks if there are some steps', () => {
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        const tests = getTestsFromReporter(reporter)
        const steps = getStepsFromReporter(reporter)

        expect(tests).toHaveLength(1)
        expect(tests[0].wrappedItem.name).toEqual('SomeTest')
        expect(steps).toHaveLength(1)
        expect(steps[0].wrappedItem.name).toEqual('SomeCommandStep')
        expect(endTestSpy).toHaveBeenCalledTimes(1)
        expect(endTestSpy).toHaveBeenCalledWith(Status.PASSED)
    })
})

describe('nested suite naming', () => {
    let startSuiteSpy: SpyInstance
    let reporter: any

    beforeEach(() => {
        reporter = new AllureReporter({ disableMochaHooks: true })
        startSuiteSpy = vi.spyOn(reporter, '_startSuite')
    })

    it('should not end test if no hook ignored', () => {
        reporter.onSuiteStart({ title: 'foo' } as SuiteStats)
        reporter.onSuiteStart({ title: 'bar' } as SuiteStats)

        expect(startSuiteSpy).toHaveBeenCalledTimes(2)
        expect(startSuiteSpy).toHaveBeenCalledWith('foo')
        expect(startSuiteSpy).toHaveBeenCalledWith('foo: bar')
    })
})
