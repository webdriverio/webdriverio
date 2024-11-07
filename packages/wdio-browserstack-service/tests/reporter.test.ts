import logger from '@wdio/logger'
import { StdLog } from '../src'

import TestReporter from '../src/reporter'
import * as utils from '../src/util'

const log = logger('test')

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

describe('test-reporter', () => {
    const runnerConfig = {
        type: 'runner',
        start: new Date('2018-05-14T15:17:18.901Z'),
        _duration: 0,
        cid: '0-0',
        capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
        sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
        config: { capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
        specs: ['/tmp/user/spec.js'],
        sessionId: 'sessionId'
    }

    const testStats = {
        type: 'test',
        start: new Date('2018-05-14T15:17:18.901Z'),
        _duration: 0,
        uid: '23',
        cid: '0-0',
        title: 'Given the title is "Google1"',
        fullTitle: 'TestDesc.TestRun.it',
        output: [],
        argument: undefined,
        retries: 0,
        parent: '1',
        state: 'pending'
    }

    const hookStats = {
        ...testStats,
        type: 'hook'
    }

    beforeEach(() => {
        (log.debug as jest.Mock).mockClear()
    })

    describe('on create', () => {
        const reporter = new TestReporter({})
        it('should verify initial properties', () => {
            expect(reporter['_capabilities']).toEqual({})
            expect(reporter['_observability']).toBe(true)
            expect(reporter['_sessionId']).toEqual(undefined)
            expect(reporter['_suiteName']).toEqual(undefined)
        })
    })

    describe('onSuiteStart', () => {
        let reporter: TestReporter
        const suite = {
            title: 'suite title',
            file: 'filename',
        }
        beforeEach(() => {
            reporter = new TestReporter({})
            reporter.onSuiteStart(suite as any)
        })

        it('should set _suiteName', () => {
            expect(reporter['_suiteName']).toEqual('filename')
        })

        it ('should store suite in stack', () => {
            expect(reporter['_suites']).toEqual([suite])
            reporter.onSuiteStart(suite as any)
            expect(reporter['_suites']).toEqual([suite, suite])
        })
    })

    describe('onSuiteEnd', function () {
        let reporter: TestReporter
        const suite = {
            title: 'suite title',
            file: 'filename',
        }
        beforeEach(() => {
            reporter = new TestReporter({})
        })

        it('should pop from suites', () => {
            expect(reporter['_suites']).toEqual([])
            reporter.onSuiteStart(suite as any)
            reporter.onSuiteStart(suite as any)
            expect(reporter['_suites']).toEqual([suite, suite])
            reporter.onSuiteEnd()
            expect(reporter['_suites']).toEqual([suite])
            reporter.onSuiteEnd()
            expect(reporter['_suites']).toEqual([])
        })
    })

    describe('onRunnerStart', () => {
        const reporter = new TestReporter({})

        it('should set properties', () => {
            reporter.onRunnerStart(runnerConfig as any)
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(reporter['_observability']).toEqual(true)
        })

        it('should set properties - handle false', () => {
            reporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { testObservability: false, capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js'],
                sessionId: 'sessionId'
            } as any)
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(reporter['_observability']).toEqual(false)
        })
    })

    describe('onTestSkip', () => {
        const reporter = new TestReporter({})
        const uploadEventDataSpy = jest.spyOn(reporter['listener'], 'testFinished').mockImplementation()
        const getCloudProviderSpy = jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')

        let getPlatformVersionSpy

        beforeAll(() => {
            getPlatformVersionSpy = jest.spyOn(utils, 'getPlatformVersion').mockImplementation(() => { return 'some version' })
        })

        afterAll(() => {
            getPlatformVersionSpy.mockClear()
        })

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getCloudProviderSpy.mockClear()

            reporter.onRunnerStart(runnerConfig as any)
        })

        it('uploadEventData called', async () => {
            reporter['_observability'] = true
            reporter['_config'] = { capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }
            await reporter.onTestSkip({
                type: 'test',
                start: new Date('2018-05-14T15:17:18.901Z'),
                _duration: 0,
                uid: '23',
                cid: '0-0',
                title: 'Given the title is "Google1"',
                fullTitle: 'TestDesc.TestRun.it',
                output: [],
                argument: undefined,
                retries: 0,
                parent: '1',
                state: 'skipped'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
            expect(log.debug).toHaveBeenCalledTimes(0)
        })

        it('uploadEventData not called for cucumber', async () => {
            reporter['_config'] = { framework: 'cucumber' } as any
            await reporter.onTestSkip({
                type: 'test',
                start: new Date('2018-05-14T15:17:18.901Z'),
                _duration: 0,
                uid: '23',
                cid: '0-0',
                title: 'Given the title is "Google1"',
                fullTitle: 'TestDesc.TestRun.it',
                output: [],
                argument: undefined,
                retries: 0,
                parent: '1',
                state: 'skipped'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(0)
            expect(log.debug).toHaveBeenCalledTimes(0)
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
            getCloudProviderSpy.mockClear()
        })
    })

    describe('needToSendData', function () {
        const reporter = new TestReporter({})
        beforeEach(() => {
            reporter['_observability'] = true
        })

        it('should return if not observability', () => {
            reporter['_observability'] = false
            expect(reporter.needToSendData('test', 'some event')).toBe(false)
        })

        it('should return false for cucumber', () => {
            reporter['_config'] = { framework: 'cucumber' } as any
            expect(reporter.needToSendData('test', 'some event')).toBe(false)
        })

        it('should return true for mocha is skip event', () => {
            reporter['_config'] = { framework: 'mocha' } as any
            expect(reporter.needToSendData('test', 'skip')).toBe(true)
        })

        it('should return true for jasmine if type is test', () => {
            reporter['_config'] = { framework: 'jasmine' } as any
            expect(reporter.needToSendData('test', 'some event')).toBe(true)
        })
    })

    describe('onTestStart', function () {
        let reporter: TestReporter, uploadEventDataSpy: jest.SpyInstance
        jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')
        let testStartStats = { ...testStats }
        let getPlatformVersionSpy

        beforeAll(() => {
            getPlatformVersionSpy = jest.spyOn(utils, 'getPlatformVersion').mockImplementation(() => { return 'some version' })
        })

        afterAll(() => {
            getPlatformVersionSpy.mockClear()
        })

        beforeEach(() => {
            reporter = new TestReporter({})
            uploadEventDataSpy = jest.spyOn(reporter['listener'], 'testStarted').mockImplementation()
            reporter['_observability'] = true
            reporter.onRunnerStart(runnerConfig as any)
            testStartStats = { ...testStats }
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
        })

        describe('mocha', () => {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'mocha'
            })

            it ("uploadEventData shouldn't get called", async () => {
                await reporter.onTestStart(testStartStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(0)
            })
        })

        describe('jasmine', function () {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'jasmine'
                testStartStats.state = 'pending'
            })

            it('uploadEventData called for jasmine', async () => {
                await reporter.onTestStart(testStartStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(1)
            })
        })
    })

    describe('onTestEnd', function () {
        let reporter: TestReporter, uploadEventDataSpy: jest.SpyInstance
        jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')
        let testEndStats = { ...testStats }
        let getPlatformVersionSpy

        beforeAll(() => {
            getPlatformVersionSpy = jest.spyOn(utils, 'getPlatformVersion').mockImplementation(() => { return 'some version' })
        })

        afterAll(() => {
            getPlatformVersionSpy.mockClear()
        })

        beforeEach(() => {
            reporter = new TestReporter({})
            uploadEventDataSpy = jest.spyOn(reporter['listener'], 'testFinished').mockImplementation()
            reporter['_observability'] = true
            reporter.onRunnerStart(runnerConfig as any)
            testEndStats = { ...testStats }
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
        })

        describe('mocha', () => {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'mocha'
            })

            it ("uploadEventData shouldn't get called", async () => {
                await reporter.onTestEnd(testEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(0)
            })
        })

        describe('jasmine', function () {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'jasmine'
                testEndStats.state = 'passed'
            })

            it('uploadEventData called for passed tests', async () => {
                testEndStats.state = 'passed'
                await reporter.onTestEnd(testEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(1)
            })

            it('uploadEventData called for failed tests', async () => {
                testEndStats.state = 'failed'
                await reporter.onTestEnd(testEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(1)
            })

        })
    })

    describe('onHookEnd', function () {
        let reporter: TestReporter, uploadEventDataSpy: jest.SpyInstance
        jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')
        let hookEndStats = { ...hookStats }

        beforeEach(() => {
            reporter = new TestReporter({})
            reporter['_observability'] = true
            uploadEventDataSpy = jest.spyOn(reporter['listener'], 'hookFinished').mockImplementation()
            reporter.onRunnerStart(runnerConfig as any)
            hookEndStats = { ...hookStats }
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
        })

        describe('mocha', () => {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'mocha'
            })

            it ("uploadEventData shouldn't get called", async () => {
                await reporter.onHookEnd(hookEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(0)
            })
        })

        describe('jasmine', function () {
            beforeEach(() => {
                // @ts-ignore
                reporter['_config'].framework = 'jasmine'
                hookEndStats.state = 'passed'
                reporter['_suites'] = ([{
                    title: 'suite'
                }] as any)
            })

            it('uploadEventData called for passed tests', async () => {
                hookEndStats.state = 'passed'
                await reporter.onHookEnd(hookEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(1)
            })

            it('uploadEventData called for failed tests', async () => {
                hookEndStats.state = 'failed'
                await reporter.onHookEnd(hookEndStats as any)
                expect(uploadEventDataSpy).toBeCalledTimes(1)
            })

        })
    })

    describe('appendTestItemLog', function () {
        let reporter: TestReporter
        let sendDataSpy: any
        const logObj: StdLog = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'some log',
            kind: 'TEST_LOG',
            http_response: {}
        }
        let testLogObj: StdLog
        beforeEach(() => {
            reporter = new TestReporter({})
            sendDataSpy = jest.spyOn(reporter['listener'], 'logCreated')
            sendDataSpy.mockImplementation(() => { return [] as any })
            testLogObj = { ...logObj }
        })

        afterEach(() => {
            sendDataSpy.mockClear()
        })

        it('should upload with current test uuid for log', function () {
            reporter['_currentTest'] = { uuid: 'some_uuid' }
            reporter['appendTestItemLog'](testLogObj)
            expect(testLogObj.test_run_uuid).toBe('some_uuid')
            expect(sendDataSpy).toBeCalledTimes(1)
        })

        it('should upload with current hook uuid for log', function () {
            reporter['_currentHook'] = { uuid: 'some_uuid' }
            reporter['appendTestItemLog'](testLogObj)
            expect(testLogObj.hook_run_uuid).toBe('some_uuid')
            expect(sendDataSpy).toBeCalledTimes(1)
        })

        it('should not upload log if hook is finished', function () {
            reporter['_currentHook'] = { uuid: 'some_uuid', finished: true }
            reporter['appendTestItemLog'](testLogObj)
            expect(testLogObj.hook_run_uuid).toBe(undefined)
            expect(testLogObj.test_run_uuid).toBe(undefined)
            expect(sendDataSpy).toBeCalledTimes(0)
        })
    })
})
