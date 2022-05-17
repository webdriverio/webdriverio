import path from 'node:path'
import { log } from 'node:console'
import { describe, it, expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import tempy from 'tempy'

import AllureReporter from '../src/'
import { TYPE } from '../src/types'

/**
 * this is not a real package and only used to utilize helper
 * methods without having to ignore them for test coverage
 */
// eslint-disable-next-line
import { clean, getResults } from './helpers/wdio-allure-helper'

import { runnerEnd, runnerStart } from './__fixtures__/runner'
import { suiteEnd, suiteStart } from './__fixtures__/suite'
import {
    testFailed, testPending, testStart, testFailedWithMultipleErrors,
    hookStart, hookFailed, hookStartWithCurrentTest,
    testFailedWithAssertionErrorFromExpectWebdriverIO } from './__fixtures__/testState'
import {
    commandStart, commandEnd, commandEndScreenShot, commandStartScreenShot
} from './__fixtures__/command'

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
    const outputDir = tempy.directory()
    let allureXml: any

    beforeAll(() => {
        const reporter = new AllureReporter({ outputDir })

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
        reporter.endStep('passed')
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment' }, 'status': 'failed', 'title': 'foo' } }
        reporter.addStep(step)
        reporter.onTestPass()
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        allureXml = results[0]
    })

    afterAll(() => {
        clean(outputDir)
    })

    it('should report one suite', () => {
        expect(allureXml('ns2\\:test-suite > name').text()).toEqual('A passing Suite')
        expect(allureXml('ns2\\:test-suite > title').text()).toEqual('A passing Suite')
    })

    it('should detect passed test case', () => {
        expect(allureXml('ns2\\:test-suite > name').text()).toEqual('A passing Suite')
        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('passed')
    })

    it('should detect analytics labels in test case', () => {
        expect(allureXml('test-case label[name="language"]').eq(0).attr('value')).toEqual('javascript')
        expect(allureXml('test-case label[name="framework"]').eq(0).attr('value')).toEqual('wdio')
    })

    it('should add browser name as test argument', () => {
        expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(2)
        expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual('chrome-68')
    })

    it('should add label, story, feature, severity, issue, testId labels, thread', () => {
        expect(allureXml('test-case label[name="customLabel"]').eq(0).attr('value')).toEqual('Label')
        expect(allureXml('test-case label[name="feature"]').eq(0).attr('value')).toEqual('foo')
        expect(allureXml('test-case label[name="story"]').eq(0).attr('value')).toEqual('Story')
        expect(allureXml('test-case label[name="severity"]').eq(0).attr('value')).toEqual('baz')
        expect(allureXml('test-case label[name="issue"]').eq(0).attr('value')).toEqual('1')
        expect(allureXml('test-case label[name="testId"]').eq(0).attr('value')).toEqual('2')
        expect(allureXml('test-case label[name="thread"]').eq(0).attr('value')).toEqual(testStart().cid)
    })

    it('should add environment variable', () => {
        expect(allureXml('test-case parameter[kind="environment-variable"]')).toHaveLength(1)
        expect(allureXml('test-case parameter[name="jenkins"]').eq(0).attr('value')).toEqual('1.2.3')
    })

    it('should start end custom step', () => {
        expect(allureXml('step > name').eq(0).text()).toEqual('bar')
        expect(allureXml('step > title').eq(0).text()).toEqual('bar')
        expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
    })

    it('should add custom step', () => {
        expect(allureXml('step > name').eq(1).text()).toEqual('foo')
        expect(allureXml('step > title').eq(1).text()).toEqual('foo')
        expect(allureXml('test-case attachment[title="attachment"]')).toHaveLength(1)
        expect(allureXml('step').eq(1).attr('status')).toEqual('failed')
    })

    it('should add attachment', () => {
        expect(allureXml('test-case attachment[title="My attachment"]')).toHaveLength(1)
    })

    it('should add additional argument', () => {
        expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(2)
        expect(allureXml('test-case parameter[name="os"]').eq(0).attr('value')).toEqual('osx')
    })
})

describe('Failed tests', () => {
    let outputDir: any
    let allureXml

    beforeEach(() => {
        outputDir = tempy.directory()
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

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        allureXml = results[0]

        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('failed')

        expect(allureXml('test-case parameter[kind="argument"]')).toHaveLength(1)
        expect(allureXml('test-case parameter[name="browser"]').eq(0).attr('value')).toEqual(testStart().cid)
    })

    it('should detect failed test case without start event', () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestFail(testFailed())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        allureXml = results[0]

        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('failed')
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

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)

        allureXml = results[0]
        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('failed')
        const message = allureXml('message').text()
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

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        allureXml = results[0]

        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('failed')

        const message = allureXml('message').text()
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
        outputDir = tempy.directory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        const allureXml = results[0]

        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('pending')
    })

    it('should detect not started pending test case', () => {
        outputDir = tempy.directory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestSkip(testPending())
        reporter.onSuiteEnd(suiteEnd())
        reporter.onRunnerEnd(runnerEnd())

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        const allureXml = results[0]

        expect(allureXml('test-case > name').text()).toEqual('should can do something')
        expect(allureXml('test-case').attr('status')).toEqual('pending')
    })

    it('should detect not started pending test case after completed test', () => {
        outputDir = tempy.directory()
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

        const results = getResults(outputDir)
        expect(results).toHaveLength(1)
        const allureXml = results[0]

        expect(allureXml('test-case > name').length).toEqual(2)

        expect(allureXml('test-case > name').last().text()).toEqual('should can do something')
        expect(allureXml('test-case').last().attr('status')).toEqual('pending')

        expect(allureXml('test-case > name').first().text()).toEqual(passed.title)
        expect(allureXml('test-case').first().attr('status')).toEqual('passed')
    })
})

describe('Hook start', () => {
    let outputDir: any
    let allureXml

    beforeEach(() => {
        outputDir = tempy.directory()
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

            const results = getResults(outputDir)

            expect(results).toHaveLength(1)
            allureXml = results[0]

            expect(allureXml('test-case').length).toEqual(1)
            expect(allureXml('test-case > name').text()).toEqual('should can do something')
            expect(allureXml('test-case').attr('status')).toEqual('failed')
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
            outputDir = tempy.directory()
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]

            expect(allureXml('step > name')).toHaveLength(0)
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]

            expect(allureXml('step > name')).toHaveLength(0)
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]

            expect(allureXml('step > name')).toHaveLength(0)
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]

            expect(allureXml('step > name')).toHaveLength(0)
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('step > name')).toHaveLength(1)
            expect(allureXml('step > name').eq(0).text()).toEqual(assertionResults[protocol].commandTitle)
            expect(allureXml('step > title').eq(0).text()).toEqual(assertionResults[protocol].commandTitle)
            expect(allureXml('test-case attachment[title="Response"]')).toHaveLength(1)
            expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('step > name')).toHaveLength(1)
            expect(allureXml('step > name').eq(0).text()).toEqual(assertionResults[protocol].commandTitle)
            expect(allureXml('step > title').eq(0).text()).toEqual(assertionResults[protocol].commandTitle)
            expect(allureXml('test-case attachment[title="Request"]')).toHaveLength(0)
            expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('step > name')).toHaveLength(1)
            expect(allureXml('step > name').eq(0).text()).toEqual(assertionResults[protocol].screenshotTitle)
            expect(allureXml('step > title').eq(0).text()).toEqual(assertionResults[protocol].screenshotTitle)
            expect(allureXml('test-case attachment[title="Screenshot"]')).toHaveLength(1)
            expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('step > name')).toHaveLength(1)
            expect(allureXml('step > name').eq(0).text()).toEqual(assertionResults[protocol].screenshotTitle)
            expect(allureXml('step > title').eq(0).text()).toEqual(assertionResults[protocol].screenshotTitle)
            expect(allureXml('test-case attachment[title="Screenshot"]')).toHaveLength(0)
            expect(allureXml('step').eq(0).attr('status')).toEqual('passed')
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

            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('test-case attachment[title="Screenshot"]')).toHaveLength(1)
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
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('test-case attachment[title="Console Logs"]')).toHaveLength(1)
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
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('test-case attachment[title="Console Logs"]')).toHaveLength(1)
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
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('test-case attachment[title="Console Logs"]')).toHaveLength(1)
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
            const results = getResults(outputDir)
            expect(results).toHaveLength(1)
            const allureXml = results[0]
            expect(allureXml('test-case attachment[title="Console Logs"]')).toHaveLength(0)
        })

    })
}
