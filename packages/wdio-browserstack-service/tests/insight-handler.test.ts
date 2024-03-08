import gotMock from 'got'
import logger from '@wdio/logger'
import type { Browser } from 'webdriverio'
import type { StdLog } from '../src/types'

import InsightsHandler from '../src/insights-handler'
import * as utils from '../src/util'
import { TESTOPS_SCREENSHOT_ENV } from '../src/constants'

interface GotMock extends jest.Mock {
    put: jest.Mock
}

const got = gotMock as unknown as GotMock
const expect = global.expect as unknown as jest.Expect

const log = logger('test')
let insightsHandler: InsightsHandler
let browser: Browser

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

beforeEach(() => {
    (log.info as jest.Mock).mockClear()
    got.mockClear()
    got.put.mockClear()
    got.mockReturnValue(Promise.resolve({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    }))
    got.put.mockReturnValue(Promise.resolve({}))

    browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Sierra',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        browserB: {},
        execute: jest.fn(),
        on: jest.fn(),
    } as any as Browser
    insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
})

it('should initialize correctly', () => {
    insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    expect(insightsHandler['_tests']).toEqual({})
    expect(insightsHandler['_hooks']).toEqual({})
    expect(insightsHandler['_commands']).toEqual({})
    expect(insightsHandler['_framework']).toEqual('framework')
})

describe('before', () => {
    insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockImplementation()

    beforeEach(() => {
        isBrowserstackSessionSpy.mockClear()
    })

    it('calls isBrowserstackSession', () => {
        insightsHandler.before()
        expect(isBrowserstackSessionSpy).toBeCalledTimes(1)
    })

    it('isBrowserstackSession returns true', () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        insightsHandler.before()
        expect(isBrowserstackSessionSpy).toBeCalledTimes(1)
    })
})

describe('getRunData', () => {
    describe('gets test data', () => {
        let getUniqueIdentifierSpy: any
        const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        const test = {
            type: 'test',
            title: 'test title',
            body: 'test body',
            file: 'filename'
        }
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '' } }
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
        insightsHandler['_hooks'] = { 'test title': ['hook_id'] }

        beforeAll(() => {
            getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
            jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })
            jest.spyOn(utils, 'getHookType').mockReturnValue('BEFORE_EACH')
            jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        })

        beforeEach(() => {
            getUniqueIdentifierSpy.mockClear()
        })

        it('for passed', async () => {
            const testData = insightsHandler['getRunData'](test as any, 'TestRunFinished', {
                error: undefined,
                result: 'passed',
                passed: true,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: undefined,
                status: 'passed'
            } as any)
            expect(testData).toMatchObject(expect.objectContaining({
                result: 'passed',
                retries: { limit: 0, attempts: 0 },
            }))
        })

        it('for failed', () => {
            const testData = insightsHandler['getRunData'](test as any, 'TestRunFinished', {
                error: { message: 'some error' },
                result: 'failed',
                passed: false,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: 'some error',
                status: 'failed'
            } as any)
            expect(testData).toMatchObject(expect.objectContaining({
                result: 'failed',
                retries: { limit: 0, attempts: 0 },
                failure_reason: 'some error',
                failure_type: 'UnhandledError',
                failure: [{ backtrace: ['some error'] }]
            }))
        })

        it('for started', () => {
            const testData = insightsHandler['getRunData'](test as any, 'TestRunStarted', {} as any)
            expect(testData).toMatchObject(expect.objectContaining({
                type: 'test',
                name: 'test title',
                file_name: 'filename',
                result: 'pending'
            }))
        })

        it('for hooks', () => {
            const testData = insightsHandler['getRunData'](test as any, 'HookRunStarted', {} as any)
            expect(testData).toMatchObject(expect.objectContaining({
                name: 'test title',
                file_name: 'filename',
                result: 'pending'
            }))
        })

        afterAll(() => {
            getUniqueIdentifierSpy.mockRestore()
        })
    })
})

describe('getTestRunDataForCucumber', () => {
    describe('gets test data', () => {
        const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })
        const getScenarioExamplesSpy = jest.spyOn(utils, 'getScenarioExamples')
        jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }

        beforeEach(() => {
            getUniqueIdentifierForCucumberSpy.mockClear()
            getScenarioExamplesSpy.mockClear()
            getScenarioExamplesSpy.mockReturnValue(undefined)
        })

        it('for passed', () => {
            const testData = insightsHandler['getTestRunDataForCucumber']({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'passed'
                }
            } as any, 'TestRunFinished')
            expect(testData).toMatchObject(expect.objectContaining({
                file_name: 'path',
                result: 'passed',
                duration_in_ms: 0.00001
            }))
        })

        it('for failed', async () => {
            const testData = insightsHandler['getTestRunDataForCucumber']({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'failed',
                    message: 'failure reason'
                }
            } as any, 'TestRunFinished')
            expect(testData).toMatchObject(expect.objectContaining({
                result: 'failed',
                failure_reason: 'failure reason',
                failure_type: 'UnhandledError',
                failure: [{ backtrace: ['failure reason'] }]
            }))
        })

        it('for started', async () => {
            const testData = insightsHandler['getTestRunDataForCucumber']({
                pickle: {
                    tags: []
                }
            } as any, 'TestRunStarted')
            expect(testData).toMatchObject(expect.objectContaining({
                result: 'pending',
                scopes: ['name'],
                meta: expect.objectContaining({
                    feature: { name: 'name', path: 'path' },
                    scenario: { name: 'name' }
                })
            }))
        })

        it('for passed - examples', async () => {
            getScenarioExamplesSpy.mockReturnValue(['1', '2'])
            insightsHandler['_browser'] = browser
            const testData = insightsHandler['getTestRunDataForCucumber']({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'passed'
                }
            } as any, 'TestRunStarted')
            expect(testData).toMatchObject(expect.objectContaining({
                meta: expect.objectContaining({
                    examples: ['1', '2']
                })
            }))
        })

        afterEach(() => {
            getUniqueIdentifierForCucumberSpy.mockClear()
            getScenarioExamplesSpy.mockClear()
        })
    })
})

describe('beforeScenario', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    const sendSpy = jest.spyOn(insightsHandler, 'getTestRunDataForCucumber').mockImplementation()
    insightsHandler['_tests'] = {}
    getUniqueIdentifierForCucumberSpy.mockClear()
    sendSpy.mockClear()

    it('sendTestRunEventForCucumber called', () => {
        insightsHandler.beforeScenario({
            pickle: {
                name: 'pickle-name'
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('afterScenario', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const sendSpy = jest.spyOn(insightsHandler, 'getTestRunDataForCucumber').mockImplementation()
    insightsHandler['_tests'] = {}
    sendSpy.mockClear()

    it('sendTestRunEventForCucumber called', () => {
        insightsHandler.afterScenario({
            pickle: {
                name: 'pickle-name'
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('beforeStep', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })

    beforeEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })

    it('update test data', () => {
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        insightsHandler.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', started_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('add test data', () => {
        insightsHandler['_tests'] = { }
        insightsHandler.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', started_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    afterEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })
})

describe('afterStep', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })

    beforeEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })

    it('update test data - passed case', () => {
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', 'result': 'PASSED', duration: 10, failure: undefined, finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('update test data - step present', () => {
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id' }] } }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', 'result': 'PASSED', duration: 10, failure: undefined, finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('add test data', () => {
        insightsHandler['_tests'] = { }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(insightsHandler['_tests']).toEqual({ 'test title': { steps: [] } })
    })

    it('failed case', () => {
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id' }] } }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: false,
            duration: 10,
            error: 'this is a error'
        })
        expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', 'result': 'FAILED', duration: 10, failure: 'this is a error', finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    afterEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })
})

describe('attachHookData', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')

    it('add hooks data in test', () => {
        insightsHandler['_hooks'] = {}
        insightsHandler['attachHookData']({
            currentTest: {
                title: 'test',
                parent: {
                    title: 'parent'
                }
            }
        } as any, 'hook_id')
        expect(insightsHandler['_hooks']).toEqual({ 'parent - test': ['hook_id'] })
    })

    it('push hooks data in test', () => {
        insightsHandler['_hooks'] = { 'parent - test': ['hook_id_old'] }
        insightsHandler['attachHookData']({
            currentTest: {
                title: 'test',
                parent: {
                    title: 'parent'
                }
            }
        } as any, 'hook_id')
        expect(insightsHandler['_hooks']).toEqual({ 'parent - test': ['hook_id_old', 'hook_id'] })
    })

    it('add hook data in test from suite tests', () =>{
        insightsHandler['_hooks'] = {}
        insightsHandler['attachHookData']({
            test: {
                parent: {
                    tests: [{
                        title: 'test',
                        parent: 'parent'
                    }],
                }
            }
        } as any, 'hook_id_from_test')
        expect(insightsHandler['_hooks']).toEqual({ 'parent - test': ['hook_id_from_test'] })
    })
})

describe('setHooksFromSuite', () => {
    let insightsHandler: InsightsHandler
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        insightsHandler['_hooks'] = {}
    })

    it('should return false if parent is null', () => {
        const result = insightsHandler['setHooksFromSuite'](null, 'hook_id')
        expect(result).toEqual(false)
        expect(insightsHandler['_hooks']).toEqual({})
    })

    it('should add hook data from nested suite tests', () => {
        const result = insightsHandler['setHooksFromSuite']({
            suites: [{
                tests: [{
                    title: 'test inside suite',
                    parent: 'parent'
                }],
            }],
        } as any, 'hook_id_from_test')
        expect(result).toEqual(true)
        expect(insightsHandler['_hooks']).toEqual({ 'parent - test inside suite': ['hook_id_from_test'] })
    })
})

describe('getHierarchy', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')

    it('return array of getHierarchy when context present', () => {
        expect(insightsHandler['getHierarchy']({
            ctx: {
                test: {
                    parent: {
                        title: 'test 2',
                        parent: {
                            title: 'test 1'
                        }
                    }
                }
            }
        } as any)).toEqual(['test 1', 'test 2'])
    })

    it('return empty array when no context present', () => {
        expect(insightsHandler['getHierarchy']({} as any)).toEqual([])
    })
})

describe('getTestRunId', function () {
    let insightsHandler: InsightsHandler
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    })

    it('should return if null context', () => {
        expect(insightsHandler['getTestRunId'](null)).toEqual(undefined)
    })

    it('return test id from current test', () => {
        const identifier = 'parent title - some title'
        insightsHandler['_tests'] = { [identifier]: { uuid: '1234' } }
        expect(insightsHandler['getTestRunId']({
            currentTest: {
                title: 'some title',
                parent: 'parent title'
            }
        })).toEqual('1234')
    })

    it('return test id from test', () => {
        const identifier = 'parent title - child title'
        insightsHandler['_tests'] = { [identifier]: { uuid: 'some_uuid' } }
        expect(insightsHandler['getTestRunId']({
            test: {
                parent: {
                    tests: [{
                        title: 'child title',
                        parent: 'parent title'
                    }]
                },
            }
        })).toEqual('some_uuid')
    })
})

describe('getTestRunIdFromSuite', function () {
    let insightsHandler: InsightsHandler
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    })

    it('should return null if parent null', function () {
        expect(insightsHandler['getTestRunIdFromSuite'](null)).toEqual(undefined)
    })

    it('should return test run id from nested suite', () => {
        insightsHandler['_tests'] = { ['suite title - nested test title']: { uuid: 'some_nested_uuid' } }
        expect(insightsHandler['getTestRunIdFromSuite']({
            tests: [],
            suites: [{
                tests: [{
                    title: 'nested test title',
                    parent: 'suite title'
                }]
            }]
        })).toEqual('some_nested_uuid')
    })
})

describe('beforeTest', () => {
    let insightsHandler : InsightsHandler, sendSpy : any, getUniqueIdentifierSpy: any

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
            sendSpy = jest.spyOn(insightsHandler, 'getRunData').mockImplementation(() => { return [] })
            getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

            insightsHandler['_tests'] = {}
            insightsHandler['_hooks'] = {
                'test title': ['hook_id']
            }
        })

        it('update test data', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', title: 'test' } as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
            expect(insightsHandler['getRunData']).toBeCalledTimes(1)
        })

        afterEach(() => {
            sendSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })
    })

    describe('jasmine', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'jasmine')
            sendSpy = jest.spyOn(insightsHandler, 'getRunData').mockImplementation(() => { return [] })

            insightsHandler['_tests'] = {}
        })

        it('should return for jasmine', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', fullName: 'parent test' } as any)
            expect(insightsHandler['_tests']).toEqual({})
            expect(insightsHandler['getRunData']).toBeCalledTimes(0)
        })

        afterEach(() => {
            sendSpy.mockClear()
        })
    })
})

describe('afterTest', () => {
    let insightsHandler: InsightsHandler, sendSpy: any, getUniqueIdentifierSpy: any

    beforeAll(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
        sendSpy = jest.spyOn(insightsHandler, 'getRunData')
        sendSpy.mockImplementation(() => { return [] })
        getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
    })

    beforeEach(() => {
        sendSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('add hook data', async () => {
        insightsHandler['_tests'] = {}
        await insightsHandler.afterTest({ title: 'bar', parent: 'foo' } as any, undefined as never, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z' } })
        expect(sendSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
    })

    it('update hook data', async () => {
        insightsHandler['_tests'] = { 'test title': {} }
        await insightsHandler.afterTest({ title: 'bar', parent: 'foo' } as any, undefined as never, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z' } })
        expect(sendSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        sendSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })
})

describe('beforeHook', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
    let getUniqueIdentifierSpy: any
    const sendSpy = jest.spyOn(insightsHandler, 'getRunData')
    sendSpy.mockImplementation(() => { return [] })
    const attachHookDataSpy = jest.spyOn(insightsHandler, 'attachHookData')
    attachHookDataSpy.mockImplementation(() => { return [] })

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler['_framework'] = 'mocha'
            getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier')
            getUniqueIdentifierSpy.mockReturnValue('parent - test')
        })

        afterEach(() => {
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })

        afterAll(() => {
            getUniqueIdentifierSpy.mockRestore()
        })

        it('update hook data', async () => {
            await insightsHandler.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
            expect(insightsHandler['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
            expect(sendSpy).toBeCalledTimes(1)
        })
    })

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler['_framework'] = 'cucumber'
            sendSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
            attachHookDataSpy.mockClear()
        })

        afterEach(() => {
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
        })

        it('doesn\'t update hook data', async () => {
            await insightsHandler.beforeHook(undefined as any, {} as any)
            expect(sendSpy).toBeCalledTimes(0)
        })
    })
})

describe('afterHook', () => {
    let insightsHandler: InsightsHandler
    let getUniqueIdentifierSpy: any, getUniqueIdentifierForCucumberSpy: any
    insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const sendSpy = jest.spyOn(insightsHandler, 'getRunData')
    sendSpy.mockImplementation(() => { return [] })
    const attachHookDataSpy = jest.spyOn(insightsHandler, 'attachHookData')
    attachHookDataSpy.mockImplementation(() => { return [] })

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler['_framework'] = 'mocha'

            insightsHandler['_tests'] = {}
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
            getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier')
            getUniqueIdentifierSpy.mockReturnValue('test title')
            getUniqueIdentifierSpy.mockClear()
        })

        it('add hook data', async () => {
            insightsHandler['_tests'] = {}
            await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, { passed: true } as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
            expect(sendSpy).toBeCalledTimes(1)
        })

        it('update hook data', async () => {
            insightsHandler['_tests'] = { 'test title': {} }
            await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, { passed: true } as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
            expect(sendSpy).toBeCalledTimes(1)
        })

        afterEach(() => {
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })

        afterAll(() => {
            getUniqueIdentifierSpy.mockRestore()
        })
    })

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler['_framework'] = 'cucumber'
            getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber')
            getUniqueIdentifierForCucumberSpy.mockReturnValue('test title')
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
            getUniqueIdentifierForCucumberSpy.mockClear()
        })

        it('doesn\'t update hook data', async () => {
            insightsHandler['_tests'] = { 'test title': {} }
            await insightsHandler.afterHook(undefined as any, {} as any, {} as any)
            expect(sendSpy).toBeCalledTimes(0)
        })

        afterEach(() => {
            sendSpy.mockClear()
            attachHookDataSpy.mockClear()
            getUniqueIdentifierForCucumberSpy.mockClear()
        })

        afterAll(() => {
            getUniqueIdentifierForCucumberSpy.mockRestore()
        })
    })
})

describe('getIntegrationsObject', () => {
    let insightsHandler: InsightsHandler
    let getPlatformVersionSpy
    beforeAll(() => {
        getPlatformVersionSpy = jest.spyOn(utils, 'getPlatformVersion').mockImplementation(() => { return 'some version' })
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        insightsHandler['_platformMeta'] = {
            caps: {},
            sessionId: '',
            browserName: '',
            browserVersion: '',
            platformName: '',
            product: ''
        }
    })

    it('return hash', () => {
        const integrationsObject = insightsHandler['getIntegrationsObject']()
        expect(integrationsObject).toBeInstanceOf(Object)
        expect(integrationsObject.platform_version).toEqual('some version')
    })

    it('should fetch latest details', () => {
        insightsHandler['_browser'].sessionId = 'session-new'
        insightsHandler['_browser'].capabilities.os = 'Windows'
        const integrationsObject = insightsHandler['getIntegrationsObject']()
        expect(integrationsObject.session_id).toEqual('session-new')
        expect(integrationsObject.capabilities.os).toEqual('Windows')
    })

    afterAll(() => {
        getPlatformVersionSpy.mockClear()
    })
})

describe('browserCommand', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const screenshotSpy = jest.spyOn(insightsHandler['listener'], 'onScreenshot').mockImplementation(() => { return [] })
    const getIdentifierSpy = jest.spyOn(insightsHandler, 'getIdentifier').mockImplementation(() => { return 'test title' })
    const commandSpy = jest.spyOn(utils, 'isScreenshotCommand')

    beforeEach(() => {
        insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }
        insightsHandler['_commands'] = { 's_m_e': {} }
        screenshotSpy.mockClear()
        getIdentifierSpy.mockClear()
    })

    it('client:beforeCommand', () => {
        insightsHandler.browserCommand('client:beforeCommand', {}, {})
        expect(screenshotSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e' }, {})
        expect(screenshotSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand - test not defined', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: {} }, undefined)
        expect(screenshotSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand - screenshot', () => {
        process.env[TESTOPS_SCREENSHOT_ENV] = 'true'
        commandSpy.mockImplementation(() => { return true })
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(screenshotSpy).toBeCalled()
        delete process.env[TESTOPS_SCREENSHOT_ENV]
    })

    it('return if test not in _tests', () => {
        insightsHandler['_tests'] = { 'test title not there': { 'uuid': 'uuid' } }
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(screenshotSpy).toBeCalledTimes(0)
    })

    it('return if command not in _commands', () => {
        insightsHandler['_commands'] = { 'command not here': {} }
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(screenshotSpy).toBeCalledTimes(0)
    })

    afterEach(() => {
        screenshotSpy.mockClear()
        getIdentifierSpy.mockClear()
    })
})

describe('getIdentifier', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    let getUniqueIdentifierSpy: any, getUniqueIdentifierForCucumberSpy: any
    insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }

    beforeEach(() => {
        getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier')
        getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber')

        getUniqueIdentifierSpy.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
    })

    it('non cucumber', () => {
        insightsHandler['getIdentifier']({ parent: 'parent', title: 'title' })
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
    })

    it('cucumber', () => {
        insightsHandler['getIdentifier']({ pickle: { uri: 'uri', astNodeIds: ['9', '8'] } })
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(1)
    })

    afterAll(() => {
        getUniqueIdentifierSpy.mockRestore()
        getUniqueIdentifierForCucumberSpy.mockRestore()
    })
})

describe('getCucumberHookType', function () {
    it('should return BEFORE_ALL', function () {
        expect(insightsHandler['getCucumberHookType'](undefined)).toEqual('BEFORE_ALL')
    })

    it('should return AFTER_ALL', function () {
        insightsHandler['_cucumberData'].scenariosStarted = true
        expect(insightsHandler['getCucumberHookType'](undefined)).toEqual('AFTER_ALL')
    })

    it('should return BEFORE_EACH', function () {
        expect(insightsHandler['getCucumberHookType']({ id: '1', hookId: '2' })).toEqual('BEFORE_EACH')
    })

    it('should return AFTER_EACH', function () {
        insightsHandler['_cucumberData'].scenariosStarted = true
        insightsHandler['_cucumberData'].stepsStarted = true
        expect(insightsHandler['getCucumberHookType']({ id: '1', hookId: '2' })).toEqual('AFTER_EACH')
    })

    it('should return null if step hook', function () {
        Object.assign(insightsHandler['_cucumberData'], {
            scenariosStarted: true,
            stepsStarted: true,
            steps: [{}]
        })
        expect(insightsHandler['getCucumberHookType']({ id: '1', hookId: '2' })).toEqual(null)
    })
})

describe('getCucumberHookUniqueId', function () {
    let insightsHandler: InsightsHandler
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    })

    it('should return hookId for each hooks', function () {
        expect(insightsHandler['getCucumberHookUniqueId']('BEFORE_EACH', { id: '1', hookId: '2' })).toBe('2')
    })

    it('should return unique id with feature for all hooks', function () {
        Object.assign(insightsHandler['_cucumberData'], {
            uri: 'filename',
            feature: { name: 'some name' }
        })
        const hookUniqueId = 'AFTER_ALL for filename:some name'
        expect(insightsHandler['getCucumberHookUniqueId']('AFTER_ALL', undefined)).toBe(hookUniqueId)
    })
})

describe('appendTestItemLog', function () {
    let insightsHandler: InsightsHandler
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
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
        sendDataSpy = jest.spyOn(insightsHandler['listener'], 'logCreated')
        sendDataSpy.mockImplementation(() => { return [] as any })
        testLogObj = { ...logObj }
    })

    afterEach(() => {
        sendDataSpy.mockClear()
    })

    it('should upload with current test uuid for log', function () {
        insightsHandler['_currentTest'] = { uuid: 'some_uuid' }
        insightsHandler['appendTestItemLog'](testLogObj)
        expect(testLogObj.test_run_uuid).toBe('some_uuid')
        expect(sendDataSpy).toBeCalledTimes(1)
    })

    it('should upload with current hook uuid for log', function () {
        insightsHandler['_currentHook'] = { uuid: 'some_uuid' }
        insightsHandler['appendTestItemLog'](testLogObj)
        expect(testLogObj.hook_run_uuid).toBe('some_uuid')
        expect(sendDataSpy).toBeCalledTimes(1)
    })

    it('should not upload log if hook is finished', function () {
        insightsHandler['_currentHook'] = { uuid: 'some_uuid', finished: true }
        insightsHandler['appendTestItemLog'](testLogObj)
        expect(testLogObj.hook_run_uuid).toBe(undefined)
        expect(testLogObj.test_run_uuid).toBe(undefined)
        expect(sendDataSpy).toBeCalledTimes(0)
    })
})

describe('processCucumberHook', function () {
    let insightsHandler: InsightsHandler
    let getHookRunDataForCucumberSpy: any, cucumberHookTypeSpy: any, cucumberHookUniqueIdSpy: any
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'cucumber')
        getHookRunDataForCucumberSpy = jest.spyOn(insightsHandler, 'getHookRunDataForCucumber')
        getHookRunDataForCucumberSpy.mockImplementation(() => { return [] as any })
        cucumberHookTypeSpy = jest.spyOn(insightsHandler, 'getCucumberHookType')
        cucumberHookTypeSpy.mockImplementation(() => { return 'hii' })
        cucumberHookUniqueIdSpy = jest.spyOn(insightsHandler, 'getCucumberHookUniqueId')
    })

    it('should not update if no hook type', function () {
        cucumberHookTypeSpy.mockReturnValue(null)
        insightsHandler['processCucumberHook'](undefined, { event: 'before' })
        expect(getHookRunDataForCucumberSpy).toBeCalledTimes(0)
    })

    it ('should send data for before event', function () {
        cucumberHookTypeSpy.mockReturnValue('BEFORE_ALL')
        insightsHandler['_currentTest'].uuid = 'test_uuid'
        insightsHandler['processCucumberHook'](undefined, { event: 'before', hookUUID: 'hook_uuid' })
        expect(getHookRunDataForCucumberSpy).toBeCalledWith(expect.objectContaining({
            uuid: 'hook_uuid',
            testRunId: 'test_uuid',
            hookType: 'BEFORE_ALL'
        }), 'HookRunStarted')
    })

    it('should send data for after event', function () {
        cucumberHookTypeSpy.mockReturnValue('AFTER_ALL')
        cucumberHookUniqueIdSpy.mockReturnValue('hook_unique_id')
        const hookObj = { uuid: 'hook_uuid' }
        const resultObj = { passed: true }
        insightsHandler['_tests']['hook_unique_id'] = hookObj
        insightsHandler['processCucumberHook'](undefined, { event: 'after' }, resultObj as any)
        expect(getHookRunDataForCucumberSpy).toBeCalledWith(hookObj, 'HookRunFinished', resultObj)
    })
})
