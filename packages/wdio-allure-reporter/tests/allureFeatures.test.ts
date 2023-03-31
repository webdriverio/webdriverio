import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import type { HookStats } from '@wdio/types'
import type { Parameter, Label, Link } from 'allure-js-commons'
import { Stage, Status, LabelName, LinkType, ContentType } from 'allure-js-commons'
import AllureReporter from '../src/reporter.js'
import { linkPlaceholder } from '../src/constants.js'
import { TYPE } from '../src/types.js'
import { getResults, clean } from './helpers/wdio-allure-helper.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

import { temporaryDirectory } from 'tempy'
import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { testStart } from './__fixtures__/testState.js'
import { suiteStart, suiteEnd } from './__fixtures__/suite.js'

let processOn: any

beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = vi.fn()
})

afterAll(() => {
    process.on = processOn
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reporter runtime implementation', () => {
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
    })

    it('should correct add custom label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addLabel({ name: 'customLabel', value: 'Label' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === 'customLabel').value).toEqual('Label')
    })

    it('should correct add story label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addStory({ storyName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.STORY).value).toEqual('foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addFeature({ featureName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.FEATURE).value).toEqual('foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSeverity({ severity: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SEVERITY).value).toEqual('foo')
    })

    it('should correct add suite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSuite({ suiteName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SUITE).value).toEqual('foo')
    })

    it('should correct add subSuite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addSubSuite({ suiteName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.SUB_SUITE).value).toEqual('foo')
    })

    it('should correct add parentSuite label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addParentSuite({ suiteName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.PARENT_SUITE).value).toEqual('foo')
    })

    it('should correct add tag label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addTag({ tag: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.TAG).value).toEqual('foo')
    })

    it('should correct add epic label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addEpic({ epicName: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.EPIC).value).toEqual('foo')
    })

    it('should correct add allure id label', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addAllureId({ id: 'foo' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].labels.find((label: Label) => label.name === LabelName.AS_ID).value).toEqual('foo')
    })

    it('should correctly add issue label with link', () => {
        const reporter = new AllureReporter({ outputDir, issueLinkTemplate: `http://example.com/${linkPlaceholder}` })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addIssue({ issue: '1' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].links.find((link: Link) => link.type === LinkType.ISSUE).url).toEqual('http://example.com/1')
    })

    it('should correctly add test id label with link', () => {
        const reporter = new AllureReporter({ outputDir, tmsLinkTemplate: `https://webdriver.io/${linkPlaceholder}` })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addTestId({ testId: '2' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].links.find((link: Link) => link.type === LinkType.TMS).url).toEqual('https://webdriver.io/2')
    })

    it('should correct add environment', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addEnvironment({ name: 'foo', value: 'bar' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { environmentInfo } = getResults(outputDir)

        expect(environmentInfo).toEqual({ foo: 'bar' })
    })

    it('should correct add description', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addDescription({
            description: 'foo',
            descriptionType: TYPE.MARKDOWN
        })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

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
            descriptionType: TYPE.HTML
        })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].descriptionHtml).toEqual('foo')
    })

    it('should correct add attachment', () => {
        const reporter = new AllureReporter({ outputDir })
        const attachFileSpy = vi.spyOn(reporter, 'attachFile')

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.TEXT })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].attachments).toHaveLength(1)
        expect(results[0].attachments[0]).toEqual({
            name: 'foo',
            type: ContentType.TEXT,
            source: expect.any(String),
        })
        expect(attachFileSpy).toHaveBeenCalledWith('foo', Buffer.from('bar'), ContentType.TEXT)
    })

    it('should correct add "application/json" attachment', () => {
        const reporter = new AllureReporter({ outputDir })
        const attachJSONSpy = vi.spyOn(reporter, 'attachJSON')

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addAttachment({ name: 'foo', content: 'bar', type: ContentType.JSON })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].attachments).toHaveLength(1)
        expect(results[0].attachments[0]).toEqual({
            name: 'foo',
            type: ContentType.JSON,
            source: expect.any(String),
        })
        expect(attachJSONSpy).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should allow to start end step', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.startStep('bar')
        reporter.endStep(Status.FAILED)
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].status).toEqual(Status.FAILED)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
    })

    it('should correct add step with attachment', () => {
        const step = {
            attachment: { content: 'baz', name: 'attachment' },
            status: Status.PASSED,
            title: 'foo'
        }
        const reporter = new AllureReporter({ outputDir })
        const attachFileSpy = vi.spyOn(reporter, 'attachFile')

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addStep({ step })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual(step.title)
        expect(results[0].steps[0].status).toEqual(step.status)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
        expect(results[0].steps[0].attachments).toHaveLength(1)
        expect(results[0].steps[0].attachments[0]).toEqual({
            name: step.attachment.name,
            type: ContentType.TEXT,
            source: expect.any(String),
        })
        expect(attachFileSpy).toHaveBeenCalledWith(step.attachment.name, step.attachment.content, ContentType.TEXT)
    })

    it('should correct add step without attachment', () => {
        const step = {
            status: Status.PASSED,
            title: 'foo'
        }
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addStep({ step })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual(step.title)
        expect(results[0].steps[0].status).toEqual(step.status)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
    })

    it('should correctly add parameter', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.addArgument({ name: 'os', value: 'osx' })
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const osParameter = results[0].parameters.find((parameter: Parameter) => parameter.name === 'os')

        expect(results).toHaveLength(1)
        expect(osParameter.value).toEqual('osx')
    })

    it('should do nothing if no tests run', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.addLabel({ name: 'foo', value: 'bar' })
        reporter.addStory({ storyName: 'foobar' })
        reporter.addFeature({ featureName: 'foobar' })
        reporter.addSeverity({ severity: 'foobar' })
        reporter.addIssue({ issue: 'foobar' })
        reporter.addTestId({ testId: '123' })
        reporter.addDescription({ description: 'foobar' })
        reporter.addAttachment({ name: '', content: '', type: '' })
        reporter.startStep('test')
        reporter.endStep(Status.PASSED)
        reporter.addStep({})
        reporter.addArgument({})
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    describe('add argument', () => {
        it('should correctly add argument for selenium', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { browserName: 'firefox', version: '1.2.3' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

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
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'browser', value: 'Chrome Headless-85.0.4183.84' })
        })

        it('should correctly add argument for appium', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { deviceName: 'Android Emulator', platformVersion: '8.0' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Android Emulator-8.0' })
        })

        it('should correctly add device name when run on BrowserStack', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { device: 'Google Pixel 3', platformVersion: '9.0' },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

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
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].parameters).toHaveLength(1)
            expect(results[0].parameters[0]).toEqual({ name: 'isMultiremote', value: 'true' })
        })
    })

    describe('add allure step', () => {
        it('should add labels from custom steps', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                labels: [{ name: 'foo', value: 'bar' }],
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)
            const childStepLabel = results[0].labels.find((label: Label) => label.name === 'foo')

            expect(results).toHaveLength(1)
            expect(childStepLabel.value).toEqual('bar')
        })

        it('should add parameters from custom steps', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                parameter: [{ name: 'foo', value: 'bar' }],
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)
            const childStepParameter = results[0].parameters.find((param: Parameter) => param.name === 'foo')

            expect(results).toHaveLength(1)
            expect(childStepParameter.value).toEqual('bar')
        })

        it('should add links from custom steps', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                links: [{ name: 'foo', url: 'http://example.org', type: 'type' }],
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)
            const childStepLink = results[0].links.find((link: Link) => link.name === 'foo')

            expect(results).toHaveLength(1)
            expect(childStepLink.url).toEqual('http://example.org')
            expect(childStepLink.type).toEqual('type')
        })

        it('should add description from custom steps', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                description: 'foo'
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].description).toEqual('foo')
        })

        it('should add html description from custom steps', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                descriptionHtml: 'foo'
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].descriptionHtml).toEqual('foo')
        })

        it('should add custom steps as children to current test', () => {
            const reporter = new AllureReporter({ outputDir })

            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.addAllureStep({
                steps: [
                    {
                        name: 'custom step',
                        attachments: [],
                        parameters: [],
                        steps: [],
                        status: Status.PASSED,
                        statusDetails: {
                            message: undefined,
                            trace: undefined,
                        },
                        stage: Stage.FINISHED,
                    }
                ]
            })
            reporter.onTestPass()
            reporter.onRunnerEnd(runnerEnd())

            const { results } = getResults(outputDir)

            expect(results).toHaveLength(1)
            expect(results[0].steps).toHaveLength(1)
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
                automationName: 'UiAutomator2',
                deviceName: 'Android GoogleAPI Emulator',
                platformVersion: '6.0',
                noReset: true,
            }
        }
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart({
            ...runnerStart(),
            capabilities,
        })
        reporter.onTestStart(testStart())
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

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

    it('should add test on custom hook', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('foo')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should not add test if no suite', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    it('should ignore global mocha hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ title: '"after all" hook', parent: '' } as HookStats)
        reporter.onHookEnd({ title: '"after all" hook', parent: '' } as HookStats)
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    it('should capture mocha each hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].status).toEqual(Status.PASSED)
        expect(results[0].stage).toEqual(Stage.FINISHED)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].name).toEqual('"before each" hook')
        expect(results[0].steps[0].status).toEqual(Status.PASSED)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
    })

    it('should ignore mocha each hooks if no test', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    it('should not start test onHookStart if no suite', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onTestPass()
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should ignore mocha hook end if no test', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    it('should ignore global mocha end hooks', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(0)
    })

    it('should not pop test case if no steps and before hook', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: '"before all" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should pop test case if no steps and custom hook', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: 'bar', parent: 'foo' } as HookStats)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should keep passed hooks if there are some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'bar' } as HookStats)
        reporter.onAfterCommand({ command: 'SomeCommandStep' })
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const testResult = results.find((result) => result.name === 'should can do something')
        const hookResult = results.find((result) => result.name === 'foo')

        expect(results).toHaveLength(2)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual('SomeCommandStep')
        expect(hookResult).not.toBeUndefined()
    })

    it('should keep failed hooks if there no some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: '"after all" hook', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after all" hook', parent: 'bar', error: { message: '', stack: '' } } as HookStats)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const testResult = results.find((result) => result.name === 'should can do something')
        const hookResult = results.find((result) => result.name === '"after all" hook')

        expect(results).toHaveLength(2)
        expect(testResult).not.toBeUndefined()
        expect(hookResult).not.toBeUndefined()
        expect(hookResult.status).toEqual(Status.BROKEN)
    })

    it('should keep failed hooks if there are some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ cid: '0-0', title: '"after all" hook', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after all" hook', parent: 'bar', error: { message: '', stack: '' } } as HookStats)
        reporter.onAfterCommand({ command: 'SomeCommandStep' })
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const testResult = results.find((result) => result.name === 'should can do something')
        const hookResult = results.find((result) => result.name === '"after all" hook')

        expect(results).toHaveLength(2)
        expect(testResult).not.toBeUndefined()
        expect(testResult.steps).toHaveLength(1)
        expect(testResult.steps[0].name).toEqual('SomeCommandStep')
        expect(hookResult).not.toBeUndefined()
        expect(hookResult.status).toEqual(Status.BROKEN)
    })

    it('should capture mocha each hooks end - passed', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after each" hook', parent: 'foo' })
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
    })

    it('should capture mocha each hooks end - failed', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before each" hook', parent: 'foo', error: { message: '', stack: '' } })
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(1)
        expect(results[0].steps[0].status).toEqual(Status.FAILED)
        expect(results[0].steps[0].stage).toEqual(Stage.FINISHED)
    })

    it('should ignore mocha all hooks if hook passes', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo' })
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].steps).toHaveLength(0)
    })

    it('should treat mocha all hooks as tests if hook throws', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo', error: { message: '', stack: '' } })
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].status).toEqual(Status.BROKEN)
        expect(results[0].stage).toEqual(Stage.FINISHED)
    })
})

describe('hooks handling default', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('should capture mocha each hooks ', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before each" hook', parent: 'foo' })

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('"before each" hook')
    })

    it('should not ignore mocha each hooks if no test', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"after each" hook', parent: 'foo' })

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('"after each" hook')
    })

    it('should keep passed hooks if there are no steps (before/after)', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onHookStart({ title: '"before all" hook', parent: 'foo' })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('"before all" hook')
    })

    it('should keep passed hooks if there are some steps', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'SomeSuite' })
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        const { results } = getResults(outputDir)

        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('foo')
    })
})

describe('nested suite naming', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('should not end test if no hook ignored', () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: '0-0', title: 'foo' })
        reporter.onSuiteStart({ cid: '0-0', title: 'bar' })
        reporter.onSuiteEnd({ cid: '0-0', title: 'foo' })
        reporter.onSuiteEnd({ cid: '0-0', title: 'foo' })
        reporter.onRunnerEnd(runnerEnd())

        const { containers } = getResults(outputDir)
        const parentSuite = containers.find((suite) => suite.name === 'foo')
        const childSuite = containers.find((suite) => suite.name === 'foo: bar')

        expect(parentSuite).not.toBeUndefined()
        expect(childSuite).not.toBeUndefined()
    })
})
