import path from 'node:path'
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import { CommandArgs, SuiteStats, TestStats } from '@wdio/reporter'
import AllureReporter from '../src'
import { linkPlaceholder } from '../src/constants'
import { TYPE } from '../src/types'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

let processOn: any
beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = vi.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('reporter runtime implementation', () => {
    it('should correct add custom label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addLabel({ name: 'customLabel', value: 'Label' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('customLabel', 'Label')
    })

    it('should correct add story label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addStory({ storyName: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('story', 'foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addFeature({ featureName: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('feature', 'foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addSeverity({ severity: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('severity', 'foo')
    })

    it('should correctly add issue label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addIssue({ issue: '1' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('issue', '1')
    })

    it('should correctly add issue label with link', () => {
        const reporter = new AllureReporter({ issueLinkTemplate: `http://example.com/${linkPlaceholder}` })
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addIssue({ issue: '1' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('issue', 'http://example.com/1')
    })

    it('should correctly add test id label', () => {
        const reporter = new AllureReporter()
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addTestId({ testId: '2' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('testId', '2')
    })

    it('should correctly add test id label with link', () => {
        const reporter = new AllureReporter({ tmsLinkTemplate: `https://webdriver.io/${linkPlaceholder}` })
        const addLabel = vi.fn()
        const mock = vi.fn(() => {
            return { addLabel }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addTestId({ testId: '2' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('testId', 'https://webdriver.io/2')
    })

    it('should correct add environment', () => {
        const reporter = new AllureReporter()
        const addParameter = vi.fn()
        const mock = vi.fn(() => {
            return { addParameter }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addEnvironment({ name: 'foo', value: 'bar' })
        expect(addParameter).toHaveBeenCalledTimes(1)
        expect(addParameter).toHaveBeenCalledWith('environment-variable', 'foo', 'bar')
    })

    it('should correct add description', () => {
        const reporter = new AllureReporter()
        const setDescription = vi.fn()
        const mock = vi.fn(() => {
            return { setDescription }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addDescription({
            description: 'foo',
            descriptionType: TYPE.MARKDOWN
        })
        expect(setDescription).toHaveBeenCalledTimes(1)
        expect(setDescription).toHaveBeenCalledWith('foo', TYPE.MARKDOWN)
    })

    it('should correct add attachment', () => {
        const reporter = new AllureReporter()
        const addAttachment = vi.fn()
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => true),
            getCurrentTest: vi.fn(() => true),
            addAttachment
        } as any

        reporter.addAttachment({ name: 'foo', content: 'bar', type: 'baz' })
        expect(addAttachment).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledWith('foo', Buffer.from('bar'), 'baz')
    })

    it('should correct add "application/json" attachment', () => {
        const reporter = new AllureReporter()
        const dumpJSON = vi.fn()
        reporter.dumpJSON = dumpJSON
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => true),
            getCurrentTest: vi.fn(() => true),
        } as any

        reporter.addAttachment({ name: 'foo', content: 'bar', type: 'application/json' })
        expect(dumpJSON).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should allow to start end step', () => {
        const reporter = new AllureReporter()
        const startStep = vi.fn()
        const endStep = vi.fn()
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => true),
            getCurrentTest: vi.fn(() => true),
            startStep,
            endStep
        } as any
        reporter.startStep('bar')
        reporter.endStep('failed')

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)

        expect(startStep).toHaveBeenCalledWith('bar')
        expect(endStep).toHaveBeenCalledWith('failed')
    })

    it('should correct add step with attachment', () => {
        const reporter = new AllureReporter()
        const startStep = vi.fn()
        const endStep = vi.fn()
        const addAttachment = vi.fn()
        reporter.addAttachment = addAttachment
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => true),
            getCurrentTest: vi.fn(() => true),
            startStep,
            endStep
        } as any

        const step = {
            'step': {
                'attachment': { 'content': 'baz', 'name': 'attachment' },
                'status': 'passed',
                'title': 'foo'
            }
        }
        reporter.addStep(step)

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledTimes(1)

        expect(startStep).toHaveBeenCalledWith(step.step.title)
        expect(addAttachment).toHaveBeenCalledWith(step.step.attachment)
        expect(endStep).toHaveBeenCalledWith(step.step.status)
    })

    it('should correct add step without attachment', () => {
        const reporter = new AllureReporter()
        const startStep = vi.fn()
        const endStep = vi.fn()
        const addAttachment = vi.fn()
        reporter.addAttachment = addAttachment
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => true),
            getCurrentTest: vi.fn(() => true),
            startStep,
            endStep
        } as any

        const step = { 'step': { 'status': 'passed', 'title': 'foo' } }
        reporter.addStep(step)

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledTimes(0)

        expect(startStep).toHaveBeenCalledWith(step.step.title)
        expect(endStep).toHaveBeenCalledWith(step.step.status)
    })

    it('should correctly add argument', () => {
        const reporter = new AllureReporter()
        const addParameter = vi.fn()
        const mock = vi.fn(() => {
            return { addParameter }
        })
        reporter['_allure'] = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        } as any

        reporter.addArgument({ name: 'os', value: 'osx' })
        expect(addParameter).toHaveBeenCalledTimes(1)
        expect(addParameter).toHaveBeenCalledWith('argument', 'os', 'osx')
    })

    it('should do nothing if no tests run', () => {
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
        let reporter: any, addParameter: any, addLabel: any, mock

        beforeEach(() => {
            reporter = new AllureReporter()
            addParameter = vi.fn()
            addLabel = vi.fn()

            mock = vi.fn(() => {
                return { addParameter, addLabel }
            })

            reporter['_allure'] = {
                startCase: mock,
                getCurrentSuite: mock,
                getCurrentTest: mock,
            }
        })

        it('should correctly add argument for selenium', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { browserName: 'firefox', version: '1.2.3' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameter).toHaveBeenCalledTimes(1)
            expect(addParameter).toHaveBeenCalledWith('argument', 'browser', 'firefox-1.2.3')
        })

        it('should correctly set proper browser version for chrome headless in devtools', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { browserName: 'Chrome Headless', browserVersion: '85.0.4183.84' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameter).toHaveBeenCalledTimes(1)
            expect(addParameter).toHaveBeenCalledWith('argument', 'browser', 'Chrome Headless-85.0.4183.84')
        })

        it('should correctly add argument for appium', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { deviceName: 'Android Emulator', platformVersion: '8.0' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameter).toHaveBeenCalledTimes(1)
            expect(addParameter).toHaveBeenCalledWith('argument', 'device', 'Android Emulator-8.0')
        })

        it('should correctly add device name when run on BrowserStack', () => {
            reporter.onRunnerStart({ config: {}, capabilities: { device: 'Google Pixel 3', platformVersion: '9.0' } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameter).toHaveBeenCalledTimes(1)
            expect(addParameter).toHaveBeenCalledWith('argument', 'device', 'Google Pixel 3-9.0')
        })

        it('should correctly add argument for multiremote', () => {
            reporter.onRunnerStart({ isMultiremote: true, config: { capabilities: { myBrowser: { browserName: 'chrome' } } } })
            reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
            expect(addParameter).toHaveBeenCalledTimes(1)
            expect(addParameter).toHaveBeenCalledWith('argument', 'isMultiremote', 'true')
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

    it('dumpJSON', () => {
        const reporter = new AllureReporter()
        const addAttachment = vi.fn()
        reporter['_allure'] = {
            addAttachment
        } as any
        const json = { bar: 'baz' }
        reporter.dumpJSON('foo', json)
        expect(addAttachment).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledWith('foo', JSON.stringify(json, null, 2), 'application/json')
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
        const currentTestMock = { addParameter: vi.fn(), addLabel: vi.fn() }
        reporter['_allure'].getCurrentTest = vi.fn().mockReturnValue(currentTestMock)
        reporter['_allure'].startCase = vi.fn()
        reporter['_isMultiremote'] = false
        reporter['_capabilities'] = capabilities
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' } as TestStats)
        expect(reporter['_allure'].getCurrentTest).toBeCalledTimes(1)
        expect(currentTestMock.addParameter).toHaveBeenCalledWith('argument', 'device', 'Android GoogleAPI Emulator 6.0')
    })
})

describe('hooks handling disabled Mocha Hooks', () => {
    let reporter: any, startCase: any, endCase: any, startStep: any, endStep: any
    const allureInstance = ({ suite = {}, test = { steps: [1] } }: any = {}) => ({
        getCurrentSuite: vi.fn(() => suite),
        getCurrentTest: vi.fn(() => { return test }),
        startCase,
        endCase,
        startStep,
        endStep
    })

    beforeEach(() => {
        reporter = new AllureReporter({ disableMochaHooks: true })
        reporter.onTestStart = vi.fn(test => startCase(test.title))
        startCase = vi.fn()
        endCase = vi.fn(result => result)
        startStep = vi.fn()
        endStep = vi.fn(result => result)
    })

    it('should add test on custom hook', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookStart({ title: 'foo', parent: 'bar' })

        expect(startCase).toHaveBeenCalledTimes(1)
        expect(startCase).toHaveBeenCalledWith('foo')
        expect(startStep).toHaveBeenCalledTimes(0)
    })

    it('should not add test if no suite', () => {
        reporter['_allure'] = allureInstance({ suite: false })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore global mocha hooks', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookStart({ title: '"after all" hook', parent: '' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should capture mocha each hooks', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore mocha each hooks if no test', () => {
        reporter['_allure'] = allureInstance({ test: null })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should not end test onHookEnd if no suite', () => {
        reporter['_allure'] = allureInstance({ suite: false })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore mocha hook end if no test', () => {
        reporter['_allure'] = allureInstance({ test: null })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(0)
    })

    it('should ignore global mocha end hooks', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookEnd({ title: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should not pop test case if no steps and before hook', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(testcases).toHaveLength(1)
    })

    it('should pop test case if no steps and custom hook', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: 'bar', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(0)
    })

    it('should keep passed hooks if there are some steps', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('passed')
        expect(testcases).toHaveLength(1)
    })

    it('should keep failed hooks if there no some steps', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
        expect(testcases).toHaveLength(1)
    })

    it('should keep failed hooks if there are some steps', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
        expect(testcases).toHaveLength(1)
    })

    it('should capture mocha each hooks end - passed', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookEnd({ title: '"after each" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(endStep.mock.results[0].value).toBe('passed')
    })

    it('should capture mocha each hooks end - failed', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookEnd({ title: '"before each" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(endStep.mock.results[0].value).toBe('failed')
    })

    it('should ignore mocha all hooks if hook passes', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })

        expect(startCase).toHaveBeenCalledTimes(0)
        expect(endCase).toHaveBeenCalledTimes(0)
    })

    it('should treat mocha all hooks as tests if hook throws', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(startCase).toHaveBeenCalledTimes(1)
        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
    })
})

describe('hooks handling default', () => {
    let reporter: any, startCase: any, endCase: any, startStep: any, endStep: any
    const allureInstance = ({ suite = {}, test = { steps: [1] } }: any = {}) => ({
        getCurrentSuite: vi.fn(() => suite),
        getCurrentTest: vi.fn(() => { return test }),
        startCase,
        endCase,
        startStep,
        endStep
    })

    beforeEach(() => {
        reporter = new AllureReporter({ disableMochaHooks: false })
        reporter.onTestStart = vi.fn(test => startCase(test.title))
        startCase = vi.fn()
        endCase = vi.fn(result => result)
        startStep = vi.fn()
        endStep = vi.fn(result => result)
    })

    it('should capture mocha each hooks', () => {
        reporter['_allure'] = allureInstance()
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(1)
    })

    it('should not ignore mocha each hooks if no test', () => {
        reporter['_allure'] = allureInstance({ test: null })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(1)
    })

    it('should keep passed hooks if there are no steps (before/after)', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(1)
    })

    it('should keep passed hooks if there are some steps', () => {
        const testcases = [1]
        reporter['_allure'] = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(1)
    })
})

describe('nested suite naming', () => {
    it('should not end test if no hook ignored', () => {
        const reporter = new AllureReporter()
        const startSuite = vi.fn()
        reporter['_allure'] = {
            getCurrentSuite: vi.fn(() => { return { name: 'foo' } }),
            startSuite
        } as any
        reporter.onSuiteStart({ title: 'bar' } as SuiteStats)

        expect(startSuite).toHaveBeenCalledTimes(1)
        expect(startSuite).toHaveBeenCalledWith('foo: bar')
    })
})
