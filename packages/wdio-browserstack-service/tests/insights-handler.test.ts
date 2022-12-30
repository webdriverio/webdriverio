import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import InsightsHandler from '../src/insights-handler.js'
import * as utils from '../src/util.js'

const log = logger('test')
let insightsHandler: InsightsHandler
let browser: Browser<'async'> | MultiRemoteBrowser<'async'>

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

beforeEach(() => {
    vi.mocked(log.info).mockClear()
    vi.mocked(got).mockClear()
    vi.mocked(got.put).mockClear()
    vi.mocked(got).mockResolvedValue({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    })
    vi.mocked(got.put).mockResolvedValue({})

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
        execute: vi.fn(),
        on: vi.fn(),
    } as any as Browser<'async'> | MultiRemoteBrowser<'async'>
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
    const isBrowserstackSessionSpy = vi.spyOn(utils, 'isBrowserstackSession').mockImplementation()

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

describe('beforeScenario', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    const sendSpy = vi.spyOn(insightsHandler, 'sendTestRunEventForCucumber').mockImplementation()
    insightsHandler['_tests'] = {}
    getUniqueIdentifierForCucumberSpy.mockClear()
    sendSpy.mockClear()

    it('sendTestRunEventForCucumber called', () => {
        insightsHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
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
    const sendSpy = vi.spyOn(insightsHandler, 'sendTestRunEventForCucumber').mockImplementation()
    insightsHandler['_tests'] = {}
    sendSpy.mockClear()

    it('sendTestRunEventForCucumber called', () => {
        insightsHandler.afterScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
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
    const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    vi.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })

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
    const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    vi.spyOn(insightsHandler, 'getHierarchy').mockImplementation(() => { return [] })

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
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const sendSpy = vi.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

    insightsHandler['_tests'] = {}
    insightsHandler['_hooks'] = {
        'test title': ['hook_id']
    }

    beforeEach(() => {
        sendSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('update test data', async () => {
        await insightsHandler.beforeTest({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
        expect(sendSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        sendSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })
})

describe('beforeHook', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const sendSpy = vi.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })
    const attachHookDataSpy = vi.spyOn(insightsHandler, 'attachHookData').mockImplementation(() => { return [] })

    insightsHandler['_tests'] = {}
    insightsHandler['_framework'] = 'mocha'

    beforeEach(() => {
        sendSpy.mockClear()
        attachHookDataSpy.mockClear()
    })

    afterEach(() => {
        sendSpy.mockClear()
        attachHookDataSpy.mockClear()
    })

    it('update hook data', async () => {
        await insightsHandler.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('afterHook', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const sendSpy = vi.spyOn(insightsHandler, 'sendTestRunEvent').mockImplementation(() => { return [] })
    const attachHookDataSpy = vi.spyOn(insightsHandler, 'attachHookData').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
    const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')

    insightsHandler['_framework'] = 'mocha'

    beforeEach(() => {
        sendSpy.mockClear()
        attachHookDataSpy.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('add hook data', async () => {
        insightsHandler['_tests'] = {}
        await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(sendSpy).toBeCalledTimes(1)
    })

    it('update hook data', async () => {
        insightsHandler['_tests'] = { 'test title': {} }
        await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(sendSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        sendSpy.mockClear()
        attachHookDataSpy.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
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
    const uploadEventDataSpy = vi.spyOn(utils, 'uploadEventData').mockImplementation(() => { return [] })
    const getIdentifierSpy = vi.spyOn(insightsHandler, 'getIdentifier').mockImplementation(() => { return 'test title' })
    const commandSpy = vi.spyOn(utils, 'isScreenshotCommand')

    insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }
    insightsHandler['_commands'] = { 's_m_e': {} }

    beforeEach(() => {
        uploadEventDataSpy.mockClear()
        getIdentifierSpy.mockClear()
    })

    it('client:beforeCommand', () => {
        insightsHandler.browserCommand('client:beforeCommand', {}, {})
        expect(uploadEventDataSpy).toBeCalledTimes(0)
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

    afterEach(() => {
        uploadEventDataSpy.mockClear()
        getIdentifierSpy.mockClear()
    })
})

describe('getIdentifier', () => {
    const insightsHandler = new InsightsHandler(browser, {} as any, false, 'sessionId', 'framework')
    const getUniqueIdentifierSpy = vi.spyOn(utils, 'getUniqueIdentifier')
    const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')

    insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }

    beforeEach(() => {
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

    afterEach(() => {
        getUniqueIdentifierSpy.mockReset()
        getUniqueIdentifierForCucumberSpy.mockReset()
    })
})
