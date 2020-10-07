import AllureReporter from '../src'
import { linkPlaceholder } from '../src/constants'

let processOn
beforeAll(() => {
    processOn = process.on.bind(process)
    process.on = jest.fn()
})

afterAll(() => {
    process.on = processOn
})

describe('reporter runtime implementation', () => {
    it('should correct add custom label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addLabel({ name: 'customLabel', value: 'Label' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('customLabel', 'Label')
    })

    it('should correct add story label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addStory({ storyName: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('story', 'foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addFeature({ featureName: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('feature', 'foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addSeverity({ severity: 'foo' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('severity', 'foo')
    })

    it('should correctly add issue label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addIssue({ issue: '1' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('issue', '1')
    })

    it('should correctly add issue label with link', () => {
        const reporter = new AllureReporter({ stdout: true, issueLinkTemplate: `http://example.com/${linkPlaceholder}` })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addIssue({ issue: '1' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('issue', 'http://example.com/1')
    })

    it('should correctly add test id label', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addTestId({ testId: '2' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('testId', '2')
    })

    it('should correctly add test id label with link', () => {
        const reporter = new AllureReporter({ stdout: true, tmsLinkTemplate: `https://webdriver.io/${linkPlaceholder}` })
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return { addLabel }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addTestId({ testId: '2' })
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('testId', 'https://webdriver.io/2')
    })

    it('should correct add environment', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addParameter = jest.fn()
        const mock = jest.fn(() => {
            return { addParameter }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addEnvironment({ name: 'foo', value: 'bar' })
        expect(addParameter).toHaveBeenCalledTimes(1)
        expect(addParameter).toHaveBeenCalledWith('environment-variable', 'foo', 'bar')
    })

    it('should correct add description', () => {
        const reporter = new AllureReporter({ stdout: true })
        const setDescription = jest.fn()
        const mock = jest.fn(() => {
            return { setDescription }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addDescription({ description: 'foo', descriptionType: 'bar' })
        expect(setDescription).toHaveBeenCalledTimes(1)
        expect(setDescription).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should correct add attachment', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addAttachment = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            addAttachment
        }

        reporter.addAttachment({ name: 'foo', content: 'bar', type: 'baz' })
        expect(addAttachment).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledWith('foo', Buffer.from('bar'), 'baz')
    })

    it('should correct add "application/json" attachment', () => {
        const reporter = new AllureReporter({ stdout: true })
        const dumpJSON = jest.fn()
        reporter.dumpJSON = dumpJSON
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
        }

        reporter.addAttachment({ name: 'foo', content: 'bar', type: 'application/json' })
        expect(dumpJSON).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should allow to start end step', () => {
        const reporter = new AllureReporter({ stdout: true })
        const startStep = jest.fn()
        const endStep = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            startStep,
            endStep
        }
        reporter.startStep('bar')
        reporter.endStep('failed')

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)

        expect(startStep).toHaveBeenCalledWith('bar')
        expect(endStep).toHaveBeenCalledWith('failed')
    })

    it('should correct add step with attachment', () => {
        const reporter = new AllureReporter({ stdout: true })
        const startStep = jest.fn()
        const endStep = jest.fn()
        const addAttachment = jest.fn()
        reporter.addAttachment = addAttachment
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            startStep,
            endStep
        }

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
        const reporter = new AllureReporter({ stdout: true })
        const startStep = jest.fn()
        const endStep = jest.fn()
        const addAttachment = jest.fn()
        reporter.addAttachment = addAttachment
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            startStep,
            endStep
        }

        const step = { 'step': { 'status': 'passed', 'title': 'foo' } }
        reporter.addStep(step)

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledTimes(0)

        expect(startStep).toHaveBeenCalledWith(step.step.title)
        expect(endStep).toHaveBeenCalledWith(step.step.status)
    })

    it('should correctly add argument', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addParameter = jest.fn()
        const mock = jest.fn(() => {
            return { addParameter }
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addArgument({ name: 'os', value: 'osx' })
        expect(addParameter).toHaveBeenCalledTimes(1)
        expect(addParameter).toHaveBeenCalledWith('argument', 'os', 'osx')
    })

    it('should do nothing if no tests run', () => {
        const reporter = new AllureReporter({ stdout: true })
        expect(reporter.addLabel({})).toEqual(false)
        expect(reporter.addStory({})).toEqual(false)
        expect(reporter.addFeature({})).toEqual(false)
        expect(reporter.addSeverity({})).toEqual(false)
        expect(reporter.addIssue({})).toEqual(false)
        expect(reporter.addTestId({})).toEqual(false)
        expect(reporter.addEnvironment({})).toEqual(false)
        expect(reporter.addDescription({})).toEqual(false)
        expect(reporter.addAttachment({})).toEqual(false)
        expect(reporter.startStep({})).toEqual(false)
        expect(reporter.endStep({})).toEqual(false)
        expect(reporter.addStep({})).toEqual(false)
        expect(reporter.addArgument({})).toEqual(false)
    })

    describe('add argument', () => {
        let reporter, addParameter, addLabel, mock

        beforeEach(() => {
            reporter = new AllureReporter({ stdout: true })
            addParameter = jest.fn()
            addLabel = jest.fn()

            mock = jest.fn(() => {
                return { addParameter, addLabel }
            })

            reporter.allure = {
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
        const reporter = new AllureReporter({ stdout: true })
        expect(reporter.isScreenshotCommand({ endpoint: '/session/id/screenshot' })).toEqual(true)
        expect(reporter.isScreenshotCommand({ endpoint: '/wdu/hub/session/id/screenshot' })).toEqual(true)
        expect(reporter.isScreenshotCommand({ endpoint: '/session/id/click' })).toEqual(false)
        expect(reporter.isScreenshotCommand({ command: 'takeScreenshot' })).toEqual(true)
        expect(reporter.isScreenshotCommand({ command: 'elementClick' })).toEqual(false)
    })

    it('dumpJSON', () => {
        const reporter = new AllureReporter({ stdout: true })
        const addAttachment = jest.fn()
        reporter.allure = {
            addAttachment
        }
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
        const reporter = new AllureReporter({ stdout: true })
        const currentTestMock = { addParameter: jest.fn(), addLabel: jest.fn() }
        reporter.allure.getCurrentTest = jest.fn().mockReturnValue(currentTestMock)
        reporter.allure.startCase = jest.fn()
        reporter.isMultiRemote = false
        reporter.capabilities = capabilities
        reporter.onTestStart({ cid: '0-0', title: 'SomeTest' })
        expect(reporter.allure.getCurrentTest).toBeCalledTimes(1)
        expect(currentTestMock.addParameter).toHaveBeenCalledWith('argument', 'device', 'Android GoogleAPI Emulator 6.0')
    })
})

describe('hooks handling disabbled Mocha Hooks', () => {
    let reporter, startCase, endCase, startStep, endStep
    const allureInstance = ({ suite = true, test = { steps: [1] } } = {}) => ({
        getCurrentSuite: jest.fn(() => suite),
        getCurrentTest: jest.fn(() => { return test }),
        startCase,
        endCase,
        startStep,
        endStep
    })

    beforeEach(() => {
        reporter = new AllureReporter({ stdout: true, disableMochaHooks: true })
        reporter.onTestStart = jest.fn(test => startCase(test.title))
        startCase = jest.fn()
        endCase = jest.fn(result => result)
        startStep = jest.fn()
        endStep = jest.fn(result => result)
    })

    it('should add test on custom hook', () => {
        reporter.allure = allureInstance()
        reporter.onHookStart({ title: 'foo', parent: 'bar' })

        expect(startCase).toHaveBeenCalledTimes(1)
        expect(startCase).toHaveBeenCalledWith('foo')
        expect(startStep).toHaveBeenCalledTimes(0)
    })

    it('should not add test if no suite', () => {
        reporter.allure = allureInstance({ suite: false })
        reporter.onHookStart({ title: 'foo', parent: 'bar' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore global mocha hooks', () => {
        reporter.allure = allureInstance()
        reporter.onHookStart({ title: '"after all" hook', parent: '' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should capture mocha each hooks', () => {
        reporter.allure = allureInstance()
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore mocha each hooks if no test', () => {
        reporter.allure = allureInstance({ test: null })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should not end test onHookEnd if no suite', () => {
        reporter.allure = allureInstance({ suite: false })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(0)
    })

    it('should ignore mocha hook end if no test', () => {
        reporter.allure = allureInstance({ test: null })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(0)
    })

    it('should ignore global mocha end hooks', () => {
        reporter.allure = allureInstance()
        reporter.onHookEnd({ title: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should not pop test case if no steps and before hook', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(testcases).toHaveLength(1)
    })

    it('should pop test case if no steps and custom hook', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: 'bar', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(0)
    })

    it('should keep passed hooks if there are some steps', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('passed')
        expect(testcases).toHaveLength(1)
    })

    it('should keep failed hooks if there no some steps', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
        expect(testcases).toHaveLength(1)
    })

    it('should keep failed hooks if there are some steps', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: '"after all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
        expect(testcases).toHaveLength(1)
    })

    it('should capture mocha each hooks end - passed', () => {
        reporter.allure = allureInstance()
        reporter.onHookEnd({ title: '"after each" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(endStep.mock.results[0].value).toBe('passed')
    })

    it('should capture mocha each hooks end - failed', () => {
        reporter.allure = allureInstance()
        reporter.onHookEnd({ title: '"before each" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(endCase).toHaveBeenCalledTimes(0)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(endStep.mock.results[0].value).toBe('failed')
    })

    it('should ignore mocha all hooks if hook passes', () => {
        reporter.allure = allureInstance()
        reporter.onHookStart({ title: '"after all" hook', parent: 'foo' })

        expect(startCase).toHaveBeenCalledTimes(0)
        expect(endCase).toHaveBeenCalledTimes(0)
    })

    it('should treat mocha all hooks as tests if hook throws', () => {
        reporter.allure = allureInstance()
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo', error: { message: '', stack: '' } })

        expect(startCase).toHaveBeenCalledTimes(1)
        expect(endCase).toHaveBeenCalledTimes(1)
        expect(endCase.mock.results[0].value).toBe('broken')
    })
})

describe('hooks handling default', () => {
    let reporter, startCase, endCase, startStep, endStep
    const allureInstance = ({ suite = true, test = { steps: [1] } } = {}) => ({
        getCurrentSuite: jest.fn(() => suite),
        getCurrentTest: jest.fn(() => { return test }),
        startCase,
        endCase,
        startStep,
        endStep
    })

    beforeEach(() => {
        reporter = new AllureReporter({ stdout: true, disableMochaHooks: false })
        reporter.onTestStart = jest.fn(test => startCase(test.title))
        startCase = jest.fn()
        endCase = jest.fn(result => result)
        startStep = jest.fn()
        endStep = jest.fn(result => result)
    })

    it('should capture mocha each hooks', () => {
        reporter.allure = allureInstance()
        reporter.onHookStart({ title: '"before each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(1)
    })

    it('should not ignore mocha each hooks if no test', () => {
        reporter.allure = allureInstance({ test: null })
        reporter.onHookStart({ title: '"after each" hook', parent: 'foo' })

        expect(startStep).toHaveBeenCalledTimes(0)
        expect(startCase).toHaveBeenCalledTimes(1)
    })

    it('should keep passed hooks if there are no steps (before/after)', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [] } })
        reporter.onHookEnd({ title: '"before all" hook', parent: 'foo' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(1)
    })

    it('should keep passed hooks if there are some steps', () => {
        const testcases = [1]
        reporter.allure = allureInstance({ suite: { testcases }, test: { steps: [1] } })
        reporter.onHookEnd({ title: 'foo', parent: 'bar' })

        expect(endCase).toHaveBeenCalledTimes(1)
        expect(testcases).toHaveLength(1)
    })
})

describe('nested suite naming', () => {
    it('should not end test if no hook ignored', () => {
        const reporter = new AllureReporter({ stdout: true })
        const startSuite = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => { return { name: 'foo' } }),
            startSuite
        }
        reporter.onSuiteStart({ title: 'bar' })

        expect(startSuite).toHaveBeenCalledTimes(1)
        expect(startSuite).toHaveBeenCalledWith('foo: bar')
    })
})
