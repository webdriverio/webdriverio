import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import type { Parameter, Label, Link } from 'allure-js-commons'
import {
    Stage,
    Status,
    LabelName,
    LinkType,
    ContentType,
    label as allureLabel,
} from 'allure-js-commons'
import AllureReporter from '../src/reporter.js'
import { DescriptionType } from '../src/types.js'
import { getResults, clean } from './helpers/wdio-allure-helper.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('../src/utils', async (importOriginal) => {
    const { cid } = await import('./__fixtures__/runner.js')
    const original = await importOriginal()

    return {
        // @ts-ignore
        ...original,
        getCid: () => cid(),
    }
})

import { temporaryDirectory } from 'tempy'
import { cid, runnerStart } from './__fixtures__/runner.js'
import { testStart, testPassed } from './__fixtures__/testState.js'
import { suiteStart, suiteEnd } from './__fixtures__/suite.js'
import type { HookStats } from '@wdio/reporter'

// let processOn: any

beforeAll(() => {
    // process.env.WDIO_WORKER_ID = cid()
    // processOn = process.on.bind(process)
    // process.on = vi.fn()
})

// afterAll(() => {
//     process.on = processOn
// })

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reporter runtime implementation', () => {
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
    })

    it('should correct add custom label', async () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await allureLabel('customLabel', 'Label')
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === 'customLabel').value).toEqual('Label')
    })

    it('should correct add story label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addStory({ storyName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.STORY).value).toEqual('foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addFeature({ featureName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.FEATURE).value).toEqual('foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSeverity({ severity: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SEVERITY).value).toEqual('foo')
    })

    it('should correct add suite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSuite({ suiteName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SUITE).value).toEqual('foo')
    })

    it('should correct add subSuite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSubSuite({ suiteName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SUB_SUITE).value).toEqual('foo')
    })

    it('should correct add parentSuite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addParentSuite({ suiteName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.PARENT_SUITE).value).toEqual('foo')
    })

    it('should correct add tag label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addTag({ tag: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.TAG).value).toEqual('foo')
    })

    it('should correct add epic label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addEpic({ epicName: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.EPIC).value).toEqual('foo')
    })

    it('should correct add allure id label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addAllureId({ id: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.AS_ID).value).toEqual('foo')
    })

    it('should correctly add issue label with link', async () => {
        const reporter = new AllureReporter({
            outputDir,
            links: {
                issue: {
                    urlTemplate: 'http://example.com/%s'
                }
            }
        })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.addIssue({ issue: '1' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].links.find((link: Link) => link.type === LinkType.ISSUE).url).toEqual('http://example.com/1')
    })

    it('should correctly add test id label with link', async () => {
        const reporter = new AllureReporter({
            outputDir,
            links: {
                tms: {
                    urlTemplate: 'https://webdriver.io/%s'
                }
            }
        })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.addTestId({ testId: '2' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].links.find((link: Link) => link.type === LinkType.TMS).url).toEqual('https://webdriver.io/2')
    })

    it('should correct add description', async () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.addDescription({
            description: 'foo',
            descriptionType: DescriptionType.MARKDOWN
        })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].description).toEqual('foo')
    })

    it('should correct add html description', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addDescription({
            description: 'foo',
            descriptionType: DescriptionType.HTML
        })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].descriptionHtml).toEqual('foo')
    })

    it('should correct add attachment', async () => {
        const reporter = new AllureReporter({ outputDir })
        const attachFileSpy = vi.spyOn(reporter, '_attachFile')

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.TEXT })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].attachments).toHaveLength(1)
        expect(results[0].attachments[0]).toEqual({
            name: 'foo',
            type: ContentType.TEXT,
            source: expect.any(String),
        })
        expect(attachFileSpy).toHaveBeenCalledWith({
            name: 'foo',
            content: Buffer.from('bar'),
            contentType: ContentType.TEXT,
        })
    })

    it('should correct add "application/json" attachment', async () => {
        const reporter = new AllureReporter({ outputDir })
        const attachJSONSpy = vi.spyOn(reporter, '_attachJSON')

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.JSON })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].attachments).toHaveLength(1)
        expect(results[0].attachments[0]).toEqual({
            name: 'foo',
            type: ContentType.JSON,
            source: expect.any(String),
        })
        expect(attachJSONSpy).toHaveBeenCalledWith({
            name: 'foo',
            json: 'bar',
        })
    })

    it('should allow to start end step', async () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await reporter.startStep('bar')
        await reporter.endStep(Status.FAILED)
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].status).toEqual(Status.FAILED)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
    })

    it('should correctly add parameter', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addArgument({ name: 'os', value: 'osx' })
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)
        const osParameter = results[0].parameters.find((parameter: Parameter) => parameter.name === 'os')

        expect(results).toHaveLength(1)
        // expect(results[0].historyId).toEqual('3cffc3d1d78d183463efee4c042f156c')
        expect(osParameter.value).toEqual('osx')
    })

    describe('add argument', () => {
        it('should correctly add argument for selenium', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { browserName: 'firefox', version: '1.2.3' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            reporter.onRunnerEnd()

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'browser', value: 'firefox-1.2.3' })
        })

        it('should correctly set proper browser version for chrome headless in devtools', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { browserName: 'Chrome Headless', browserVersion: '85.0.4183.84' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            reporter.onRunnerEnd()

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'browser', value: 'Chrome Headless-85.0.4183.84' })
        })

        it('should correctly add argument for appium', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: {
                    deviceName: 'Android Emulator',
                    'appium:platformVersion': '8.0'
                },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            reporter.onRunnerEnd()

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Android Emulator-8.0' })
        })

        it('should correctly add device name when run on BrowserStack', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { device: 'Google Pixel 3', 'appium:platformVersion': '9.0' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            reporter.onRunnerEnd()

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Google Pixel 3-9.0' })
        })

        it('should correctly add argument for multiremote', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            reporter.onRunnerEnd()

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'isMultiremote', value: 'true' })
        })
    })
})

describe('auxiliary methods', () => {
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
    })

    it('should populate the correct deviceName', () => {
        const capabilities = {
            deviceName: 'emulator',
            desired: {
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:deviceName': 'Android GoogleAPI Emulator',
                'appium:platformVersion': '6.0',
                'appium:noReset': true,
            }
        }
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart({
            ...runnerStart(),
            capabilities,
        })
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].parameters).toHaveLength(1)
        expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Android GoogleAPI Emulator 6.0' })
    })
})

// TODO: check twice the checks here, seems some of them doesn't look so obvious and good
describe('hooks handling disabled Mocha Hooks', () => {
    let reporter: any
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: true })
    })

    it('should not add test on custom hook', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should not add test if no suite', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should ignore global mocha hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ cid: cid(), title: '"after all" hook', parent: '' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: '"after all" hook', parent: '' } as HookStats)
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should not capture mocha/jasmine each hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: cid(), title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].status).toEqual(Status.PASSED)
        expect(results[0].stage).toEqual(Stage.FINISHED)
        expect(containers).toHaveLength(0)
    })

    it('should ignore passed mocha/jasmine each hooks if no test', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should not start test onHookStart if no suite', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(containers).toHaveLength(0)
    })

    it('should ignore global mocha/jasmine end hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should not pop test case if no steps and before hook', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: '"before all" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should keep passed custom hooks if there are some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand({ cid: cid(), command: 'SomeCommandStep' })
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onAfterCommand({ cid: cid(), command: 'SomeCommandStep' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)
        const testResult = results.find(
            (result) => result.name === 'should can do something',
        )
        const hookResult = results.find((result) =>
            result.name.endsWith('foo'),
        )

        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual('SomeCommandStep')
        expect(hookResult).toBeUndefined()
    })

    it('should keep failed hooks if there no some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: '"after all" hook', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after all" hook', parent: 'bar', error: { message: '', stack: '' } } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)
        const testResult = results.find(
            (result) => result.name === 'should can do something',
        )

        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(containers).toHaveLength(1)
        expect(containers[0].afters).toHaveLength(1)
        expect(containers[0].afters[0].status).toEqual(Status.BROKEN)
    })

    it('should keep failed hooks if there are some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand({ cid: cid(), command: 'SomeCommandStep' })
        reporter.onHookStart({ cid: cid(), title: '"after all" hook', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: '"after all" hook', parent: 'bar', error: { message: '', stack: '' } } as HookStats)
        reporter.onAfterCommand({ cid: cid(), command: 'SomeCommandStep' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)
        const testResult = results.find(
            (result) => result.name === 'should can do something',
        )

        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual('SomeCommandStep')
        expect(containers[0].afters).toHaveLength(1)
        expect(containers[0].afters[0].status).toEqual(Status.BROKEN)
    })

    it('should not report passed mocha/jasmine each hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: cid(), title: '"after each" hook', parent: 'foo' })
        reporter.onHookEnd({ cid: cid(), title: '"after each" hook', parent: 'foo' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(containers).toHaveLength(0)
    })

    it('should create a test and add mocha all hooks as fixtures if hook throws', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo', error: { message: '', stack: '' } })
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(containers[0].befores[0].status).toEqual(Status.BROKEN)
        expect(containers[0].befores[0].stage).toEqual(Stage.FINISHED)
    })
})

describe('hooks handling default', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('does not report passed hooks if there are no tests', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    // TODO:
    // it('reports failed hooks if there are no tests', () => {
    //     reporter.onRunnerStart(runnerStart())
    //     reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
    //     reporter.onHookStart({ title: 'foo', parent: 'bar' })
    //     reporter.onHookEnd({ title: 'foo', parent: 'bar', error: { message: 'foo', stack: 'bar' } })
    //     reporter.onSuiteEnd(suiteEnd())
    //     reporter.onRunnerEnd()
    //
    //     const { results, containers } = getResults(outputDir)
    //
    //     debugger
    // })

    it('reports passed hooks a test has been started', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
        reporter.onTestStart({ cid: cid(), title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })
        reporter.onAfterCommand({ command: 'SomeCommandStep' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results, containers } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(containers).toHaveLength(1)
        expect(containers[0].befores).toHaveLength(1)
        expect(containers[0].befores[0]).toEqual(expect.objectContaining({
            name: 'foo',
            status: Status.PASSED,
            stage: Stage.FINISHED
        }))
    })
})

describe('test step naming', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('should display command name when both command name and enpoint are available ', () => {
        const command = {
            command: 'SomeCommandStep',
            method: 'POST',
            endpoint: '/session/:sessionId/element',
        }
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(command)
        reporter.onAfterCommand(command)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)
        const testResult = results.find(
            (result) => result.name === 'should can do something'
        )

        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual(
            'SomeCommandStep'
        )
    })

    it('should display the endpoint and method in the absence of command name', () => {
        const command = {
            method: 'POST',
            endpoint: '/session/:sessionId/element',
        }
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(command)
        reporter.onAfterCommand(command)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd()

        const { results } = getResults(outputDir)
        const testResult = results.find(
            (result) => result.name === 'should can do something'
        )

        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual(
            'POST /session/:sessionId/element'
        )
    })
})
