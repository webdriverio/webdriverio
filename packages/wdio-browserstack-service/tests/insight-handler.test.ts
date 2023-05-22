import gotMock from 'got'
import logger from '@wdio/logger'
import type { Browser } from 'webdriverio'

import InsightsHandler from '../src/insights-handler'
import * as utils from '../src/util'
import RequestQueueHandler from '../src/request-handler'

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

describe('sendTestRunEvent', () => {
    describe('calls uploadEventData', () => {
        const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        const requestQueueHandler = RequestQueueHandler.getInstance()
        const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
        jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })
        jest.spyOn(utils, 'getHookType').mockReturnValue('BEFORE_EACH')
        jest.spyOn(requestQueueHandler, 'add').mockImplementation(() => { return { proceed: true, data: [{}], url: '' } })
        const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
        jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        const test = {
            type: 'test',
            title: 'test title',
            body: 'test body',
            file: 'filename'
        }
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '' } }
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
        insightsHandler['_hooks'] = { 'test title': ['hook_id'] }

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })

        it('for passed', async () => {
            await insightsHandler.sendTestRunEvent(test as any, 'TestRunFinished', {
                error: undefined,
                result: 'passed',
                passed: true,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: undefined,
                status: 'passed'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for failed', async () => {
            await insightsHandler.sendTestRunEvent(test as any, 'TestRunFinished', {
                error: { message: 'some error' },
                result: 'failed',
                passed: false,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: 'some error',
                status: 'failed'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for started', async () => {
            await insightsHandler.sendTestRunEvent(test as any, 'TestRunStarted', {} as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for hooks', async () => {
            await insightsHandler.sendTestRunEvent(test as any, 'HookRunStarted', {} as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })
    })
})

describe('sendTestRunEventForCucumber', () => {
    describe('calls uploadEventData', () => {
        const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
        const requestQueueHandler = RequestQueueHandler.getInstance()
        const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        jest.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })
        const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
        const getScenarioExamplesSpy = jest.spyOn(utils, 'getScenarioExamples')
        jest.spyOn(requestQueueHandler, 'add').mockImplementation(() => { return { proceed: true, data: [{}], url: '' } })
        jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        insightsHandler['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getUniqueIdentifierForCucumberSpy.mockClear()
            getScenarioExamplesSpy.mockClear()
            getScenarioExamplesSpy.mockReturnValue(undefined)
        })

        it('for passed', async () => {
            await insightsHandler.sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'passed'
                }
            } as any, 'TestRunFinished')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for failed', async () => {
            await insightsHandler.sendTestRunEventForCucumber({
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
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for started', async () => {
            await insightsHandler.sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                }
            } as any, 'TestRunStarted')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for passed - examples', async () => {
            getScenarioExamplesSpy.mockReturnValue(['1', '2'])
            insightsHandler['_browser'] = browser
            await insightsHandler.sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'passed'
                }
            } as any, 'TestRunStarted')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
            getUniqueIdentifierForCucumberSpy.mockClear()
            getScenarioExamplesSpy.mockClear()
        })
    })
})

describe('beforeScenario', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    const sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEventForCucumber').mockImplementation()
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
    const sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEventForCucumber').mockImplementation()
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

describe('beforeTest', () => {
    let insightsHandler : InsightsHandler, sendSpy : any, getUniqueIdentifierSpy: any

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
            sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })
            getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

            insightsHandler['_tests'] = {}
            insightsHandler['_hooks'] = {
                'test title': ['hook_id']
            }
        })

        it('update test data', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', title: 'test' } as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(1)
        })

        afterEach(() => {
            sendSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })
    })

    describe('jasmine', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'jasmine')
            sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })

            insightsHandler['_tests'] = {}
        })

        it('should return for jasmine', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', fullName: 'parent test' } as any)
            expect(insightsHandler['_tests']).toEqual({})
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(0)
        })

        afterEach(() => {
            sendSpy.mockClear()
        })
    })
})

describe('afterTest', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'mocha')
    const sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

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
    const sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEvent')
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
    const sendSpy = jest.spyOn(insightsHandler, 'sendTestRunEvent')
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
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }

    it('return hash', () => {
        expect(insightsHandler.getIntegrationsObject()).toBeInstanceOf(Object)
    })
})

describe('browserCommand', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation(() => { return [] })
    const getIdentifierSpy = jest.spyOn(insightsHandler, 'getIdentifier').mockImplementation(() => { return 'test title' })
    const commandSpy = jest.spyOn(utils, 'isScreenshotCommand')

    beforeEach(() => {
        insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }
        insightsHandler['_commands'] = { 's_m_e': {} }
        uploadEventDataSpy.mockClear()
        getIdentifierSpy.mockClear()
    })

    it('client:beforeCommand', () => {
        insightsHandler.browserCommand('client:beforeCommand', {}, {})
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e' }, {})
        expect(uploadEventDataSpy).toBeCalledTimes(1)
    })

    it('client:afterCommand - test not defined', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: {} }, undefined)
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand - screenshot', () => {
        process.env.BS_TESTOPS_ALLOW_SCREENSHOTS = 'true'
        commandSpy.mockImplementation(() => { return true })
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(uploadEventDataSpy).toBeCalled()
        delete process.env.BS_TESTOPS_ALLOW_SCREENSHOTS
    })

    it('return if test not in _tests', () => {
        insightsHandler['_tests'] = { 'test title not there': { 'uuid': 'uuid' } }
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('return if command not in _commands', () => {
        insightsHandler['_commands'] = { 'command not here': {} }
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    afterEach(() => {
        uploadEventDataSpy.mockClear()
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
