import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Label, Link, Parameter } from 'allure-js-commons'
import {
    attachment,
    ContentType,
    description,
    issue,
    label,
    LabelName,
    LinkType,
    Stage,
    Status,
    tms
} from 'allure-js-commons'
import AllureReporter from '../src/reporter.js'
import { clean, getResults } from './helpers/wdio-allure-helper.js'
import { events } from '../src/constants.js'
import { temporaryDirectory } from 'tempy'
import { cid, runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { testPassed, testStart } from './__fixtures__/testState.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import type { HookStats } from '@wdio/reporter'
import { addArgument } from '../src/common/api.js'

const hoisted = vi.hoisted(() => ({
    getCid: () => '0-0'
}))

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('../src/utils', async (importOriginal) => {
    const { cid } = await import('./__fixtures__/runner.js')
    const original = await importOriginal()

    return {
        // @ts-ignore
        ...original,
        getCid: () => hoisted.getCid,
    }
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reporter runtime implementation', () => {
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
    })

    it('adds custom label via allure runtime', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label('customLabel', 'Label')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        expect(results[0].labels.find((l: Label) => l.name === 'customLabel')!.value).toBe('Label')
    })

    it('adds story label', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label(LabelName.STORY, 'foo')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].labels.find((l: Label) => l.name === LabelName.STORY)!.value).toBe('foo')
    })

    it('adds feature label', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label(LabelName.FEATURE, 'foo')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].labels.find((l: Label) => l.name === LabelName.FEATURE)!.value).toBe('foo')
    })

    it('adds severity label', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label(LabelName.SEVERITY, 'critical')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].labels.find((l: Label) => l.name === LabelName.SEVERITY)!.value).toBe('critical')
    })

    it('adds suite/subSuite/parentSuite labels', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label(LabelName.SUITE, 'suiteA')
        await label(LabelName.SUB_SUITE, 'subA')
        await label(LabelName.PARENT_SUITE, 'parentA')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].labels.find((l: Label) => l.name === LabelName.SUITE)!.value).toBe('suiteA')
        expect(results[0].labels.find((l: Label) => l.name === LabelName.SUB_SUITE)!.value).toBe('subA')
        expect(results[0].labels.find((l: Label) => l.name === LabelName.PARENT_SUITE)!.value).toBe('parentA')
    })

    it('adds tag/epic/as_id', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await label(LabelName.TAG, 'foo')
        await label(LabelName.EPIC, 'epic-1')
        await label(LabelName.AS_ID, 'A-42')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].labels.find((l: Label) => l.name === LabelName.TAG)!.value).toBe('foo')
        expect(results[0].labels.find((l: Label) => l.name === LabelName.EPIC)!.value).toBe('epic-1')
        expect(results[0].labels.find((l: Label) => l.name === LabelName.AS_ID)!.value).toBe('A-42')
    })

    it('adds issue link using links mapping', async () => {
        const reporter = new AllureReporter({
            outputDir,
            links: { issue: { urlTemplate: 'http://example.com/%s' } }
        })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await issue('1')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].links.find((ln: Link) => ln.type === LinkType.ISSUE)!.url).toBe('http://example.com/1')
    })

    it('adds tms link using links mapping', async () => {
        const reporter = new AllureReporter({
            outputDir,
            links: { tms: { urlTemplate: 'https://webdriver.io/%s' } }
        })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await tms('2')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].links.find((ln: Link) => ln.type === LinkType.TMS)!.url).toBe('https://webdriver.io/2')
    })

    it('adds description (markdown)', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await description('foo')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].description).toBe('foo')
    })

    it('adds HTML description', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await description('<b>foo</b>')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].descriptionHtml ?? results[0].description).toBe('<b>foo</b>')
    })

    it('adds attachment (text)', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        await attachment('foo', 'bar', ContentType.TEXT)
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].steps[0].attachments).toHaveLength(1)
    })

    it('adds attachment (application/json)', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        //@ts-ignore
        await attachment('foo', { a: 1 }, ContentType.JSON)
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].steps[0].attachments).toHaveLength(1)
    })

    it('start/end step via process events', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        // @ts-ignore
        process.emit(events.startStep, 'bar')
        // @ts-ignore
        process.emit(events.endStep, Status.FAILED)
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].steps[0].name).toBe('bar')
        expect(results[0].steps[0].status).toBe(Status.FAILED)
        expect(results[0].steps[0].stage).toBe(Stage.FINISHED)
    })

    it('adds parameter (argument)', async () => {
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        // @ts-ignore
        await addArgument('os', 'osx')
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].parameters.find((p: Parameter) => p.name === 'os')!.value).toBe('osx')
    })

    describe('add argument', () => {
        it('should correctly add argument for selenium', async () => {
            const reporter = new AllureReporter({ outputDir })
            reporter.onRunnerStart({ ...runnerStart(), capabilities: { browserName: 'firefox', version: '1.2.3' } })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            await reporter.onRunnerEnd(runnerEnd())
            const { results } = getResults(outputDir)
            expect(results[0].parameters[0]).toEqual({ name: 'browser', value: 'firefox-1.2.3' })
        })

        it('should correctly set proper browser version for chrome headless in devtools', async () => {
            const reporter = new AllureReporter({ outputDir })
            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { browserName: 'Chrome Headless', browserVersion: '85.0.4183.84' }
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            await reporter.onRunnerEnd(runnerEnd())
            const { results } = getResults(outputDir)
            expect(results[0].parameters[0]).toEqual({ name: 'browser', value: 'Chrome Headless-85.0.4183.84' })
        })

        it('should correctly add argument for appium', async  () => {
            const reporter = new AllureReporter({ outputDir })
            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { deviceName: 'Android Emulator', 'appium:platformVersion': '8.0' }
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            await reporter.onRunnerEnd(runnerEnd())
            const { results } = getResults(outputDir)
            expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Android Emulator-8.0' })
        })

        it('should correctly add device name when run on BrowserStack', async () => {
            const reporter = new AllureReporter({ outputDir })
            reporter.onRunnerStart({
                ...runnerStart(),
                capabilities: { device: 'Google Pixel 3', 'appium:platformVersion': '9.0' }
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            await reporter.onRunnerEnd(runnerEnd())
            const { results } = getResults(outputDir)
            expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Google Pixel 3-9.0' })
        })

        it('should correctly add argument for multiremote', async () => {
            const reporter = new AllureReporter({ outputDir })
            reporter.onRunnerStart({
                ...runnerStart(),
                isMultiremote: true,
                capabilities: { myBrowser: { browserName: 'chrome' } },
            })
            reporter.onTestStart(testStart())
            reporter.onTestPass(testPassed())
            await reporter.onRunnerEnd(runnerEnd())
            const { results } = getResults(outputDir)
            expect(results[0].parameters[0]).toEqual({ name: 'isMultiremote', value: 'true' })
        })
    })
})

describe('auxiliary methods', () => {
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
    })

    it('should populate the correct deviceName', async() => {
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
        reporter.onRunnerStart({ ...runnerStart(), capabilities })
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results[0].parameters[0]).toEqual({ name: 'device', value: 'Android GoogleAPI Emulator 6.0' })
    })
})

describe('hooks handling disabled Mocha Hooks', () => {
    let reporter: any
    const outputDir = temporaryDirectory()

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: true })
    })

    it('does not add test on custom hook', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('does not add test if no suite', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: 'foo', parent: 'bar' } as HookStats)
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('ignores global mocha hooks', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onHookStart({ cid: cid(), title: '"after all" hook', parent: '' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: '"after all" hook', parent: '' } as HookStats)
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('does not capture mocha/jasmine each hooks', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: cid(), title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: cid(), title: '"before each" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        const { results, containers } = getResults(outputDir)
        expect(results).toHaveLength(1)
        expect(results[0].status).toEqual(Status.PASSED)
        expect(results[0].stage).toEqual(Stage.FINISHED)
        expect(containers).toHaveLength(0)
    })

    it('ignores passed mocha/jasmine each hooks if no test', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onHookStart({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: '"after each" hook', parent: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('does not start test onHookStart if no suite', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onHookEnd({ cid: '0-0', title: 'foo', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        await reporter.onRunnerEnd(runnerEnd())
        const { results, containers } = getResults(outputDir)
        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(containers).toHaveLength(0)
    })

    it('ignores global mocha/jasmine end hooks', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: 'foo' } as HookStats)
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('should not pop test case if no steps and before hook', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookEnd({ cid: '0-0', title: '"before all" hook', parent: 'foo' } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        expect(results[0].name).toEqual('should can do something')
        expect(results[0].steps).toHaveLength(0)
    })

    it('should keep passed custom hooks if there are some steps', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onHookStart({ cid: '0-0', title: '"after all" hook', parent: 'bar' } as HookStats)
        reporter.onHookEnd({
            cid: '0-0',
            title: '"after all" hook',
            parent: 'bar',
            error: { message: '', stack: '' }
        } as HookStats)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        const { results, containers } = getResults(outputDir)
        const testResult = results.find(r => r.name === 'should can do something')
        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(containers).toHaveLength(0)
        if (testResult && testResult.fixtures) {
            const afterHooks = testResult.fixtures.filter(f => f.type === 'after')
            expect(afterHooks).toHaveLength(1)
            expect(afterHooks[0].status).toEqual(Status.BROKEN)
        }
    })
})

describe('hooks handling default', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('does not report passed hooks if there are no tests', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        expect(() => getResults(outputDir)).toThrowError('ENOENT')
    })

    it('reports passed hooks when a test has been started', async () => {
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart({ cid: cid(), title: 'SomeSuite' })
        reporter.onTestStart({ cid: cid(), title: 'SomeTest' })
        reporter.onBeforeCommand({ command: 'SomeCommandStep' })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })
        reporter.onAfterCommand({ command: 'SomeCommandStep' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        const { results, containers } = getResults(outputDir)
        expect(results).toHaveLength(1)
        expect(containers).toHaveLength(0)
        const testResult = results[0]
        if (testResult && testResult.fixtures) {
            const beforeHooks = testResult.fixtures.filter(f => f.type === 'before')
            expect(beforeHooks).toHaveLength(1)
            expect(beforeHooks[0]).toEqual(expect.objectContaining({
                name: 'foo',
                status: Status.PASSED,
                stage: Stage.FINISHED
            }))
        }
    })
})

describe('test step naming', () => {
    const outputDir = temporaryDirectory()
    let reporter: any

    beforeEach(() => {
        clean(outputDir)
        reporter = new AllureReporter({ outputDir, disableMochaHooks: false })
    })

    it('should display command name when both command name and enpoint are available ', async () => {
        const command = { command: 'SomeCommandStep', method: 'POST', endpoint: '/session/:sessionId/element' }
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(command)
        reporter.onAfterCommand(command)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        const { results } = getResults(outputDir)
        const testResult = results.find(r => r.name === 'should can do something')
        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult!.steps).toHaveLength(1)
        expect(testResult!.steps[0].name).toBe('SomeCommandStep')
    })

    it('should display the endpoint and method in the absence of command name', async () => {
        const command = { method: 'POST', endpoint: '/session/:sessionId/element' }
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(testStart())
        reporter.onTestStart(testStart())
        reporter.onBeforeCommand(command as any)
        reporter.onAfterCommand(command as any)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerStart())
        const { results } = getResults(outputDir)
        const testResult = results.find(r => r.name === 'should can do something')
        expect(results).toHaveLength(1)
        expect(testResult).not.toBeUndefined()
        expect(testResult!.steps).toHaveLength(1)
        expect(testResult!.steps[0].name).toBe('POST /session/:sessionId/element')
    })
})
