/// <reference path="../../webdriverio/src/@types/async.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'

import InsightsHandler from '../src/insights-handler.js'
import * as utils from '../src/util.js'

const log = logger('test')
let insightsHandler: InsightsHandler
let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

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
        getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: vi.fn(),
        on: vi.fn(),
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    insightsHandler = new InsightsHandler(browser, false, 'framework')
})

it('should initialize correctly', () => {
    insightsHandler = new InsightsHandler(browser, false, 'framework')
    expect(insightsHandler['_tests']).toEqual({})
    expect(insightsHandler['_hooks']).toEqual({})
    expect(insightsHandler['_commands']).toEqual({})
    expect(insightsHandler['_framework']).toEqual('framework')
})

describe('before', () => {
    const isBrowserstackSessionSpy = vi.spyOn(utils, 'isBrowserstackSession')

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
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
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        insightsHandler['sendTestRunEventForCucumber'] = vi.fn()
        insightsHandler['_tests'] = {}
    })

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
        expect(insightsHandler['sendTestRunEventForCucumber']).toBeCalledTimes(1)
    })
})

describe('afterScenario', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['sendTestRunEventForCucumber'] = vi.fn()
        insightsHandler['_tests'] = {}
    })

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
        expect(insightsHandler['sendTestRunEventForCucumber']).toBeCalledTimes(1)
    })
})

describe('beforeStep', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        insightsHandler['getHierarchy'] = vi.fn().mockImplementation(() => { return [] })
    })

    it('update test data', () => {
        insightsHandler['_tests'] = {
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' }
            }
        }
        insightsHandler.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{
                    id: 'step_id',
                    text: 'this is step',
                    keyword: 'Given',
                    started_at: '2020-01-01T00:00:00.000Z'
                }]
            }
        })
    })

    it('add test data', () => {
        insightsHandler['_tests'] = { }
        insightsHandler.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({
            'test title': {
                steps: [{
                    id: 'step_id',
                    text: 'this is step',
                    keyword: 'Given',
                    started_at: '2020-01-01T00:00:00.000Z'
                }]
            }
        })
    })
})

describe('afterStep', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        insightsHandler['getHierarchy'] = vi.fn().mockImplementation(() => { return [] })
    })

    it('update test data - passed case', () => {
        insightsHandler['_tests'] = {
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' }
            }
        }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(insightsHandler['_tests']).toEqual({
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{
                    id: 'step_id',
                    text: 'this is step',
                    keyword: 'Given',
                    'result': 'PASSED',
                    duration: 10,
                    failure: undefined,
                    finished_at: '2020-01-01T00:00:00.000Z'
                }]
            }
        })
    })

    it('update test data - step present', () => {
        insightsHandler['_tests'] = {
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{ id: 'step_id' }]
            }
        }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(insightsHandler['_tests']).toEqual({
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{
                    id: 'step_id',
                    result: 'PASSED',
                    duration: 10,
                    failure: undefined,
                    finished_at: '2020-01-01T00:00:00.000Z'
                }]
            }
        })
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
        insightsHandler['_tests'] = {
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{ id: 'step_id' }]
            }
        }
        insightsHandler.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: false,
            duration: 10,
            error: 'this is a error'
        })
        expect(insightsHandler['_tests']).toEqual({
            'test title': {
                uuid: 'uuid',
                startedAt: '',
                finishedAt: '',
                feature: { name: 'name', path: 'path', description: 'description' },
                scenario: { name: 'name' },
                steps: [{
                    id: 'step_id',
                    result: 'FAILED',
                    duration: 10,
                    failure: 'this is a error',
                    finished_at: '2020-01-01T00:00:00.000Z'
                }]
            }
        })
    })
})

describe('attachHookData', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
    })

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
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
    })

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
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
        vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
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
})

describe('beforeHook', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
        insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })
        insightsHandler['_tests'] = {}
        insightsHandler['_framework'] = 'mocha'
    })

    beforeEach(() => {
        vi.mocked(insightsHandler['sendTestRunEvent']).mockClear()
        vi.mocked(insightsHandler['attachHookData']).mockClear()
    })

    it('update hook data', async () => {
        await insightsHandler.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
        expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(1)
    })
})

describe('afterHook', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'mocha')
        insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
        insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })

        vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        vi.mocked(insightsHandler['sendTestRunEvent']).mockClear()
        vi.mocked(insightsHandler['attachHookData']).mockClear()
    })

    it('add hook data', async () => {
        insightsHandler['_tests'] = {}
        await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(1)
    })

    it('update hook data', async () => {
        insightsHandler['_tests'] = { 'test title': {} }
        await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(1)
    })
})

describe('getIntegrationsObject', () => {
    let insightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
    })

    it('return hash', () => {
        expect(insightsHandler['getIntegrationsObject']()).toBeInstanceOf(Object)
    })
})

describe('browserCommand', () => {
    let insightsHandler
    let uploadEventDataSpy
    let commandSpy

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['getIdentifier'] = vi.fn().mockImplementation(() => { return 'test title' })
        insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }
        insightsHandler['_commands'] = { 's_m_e': {} as any }

        uploadEventDataSpy = vi.spyOn(utils, 'uploadEventData').mockImplementation(() => { return [] as any })
        commandSpy = vi.spyOn(utils, 'isScreenshotCommand')
    })

    it('client:beforeCommand', () => {
        insightsHandler.browserCommand('client:beforeCommand', {} as any, {} as any)
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand - test not defined', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: {} } as any, undefined)
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('client:afterCommand - screenshot', () => {
        process.env.BS_TESTOPS_ALLOW_SCREENSHOTS = 'true'
        commandSpy.mockImplementation(() => { return true })
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } } as any, {} as any)
        expect(uploadEventDataSpy).toBeCalled()
        delete process.env.BS_TESTOPS_ALLOW_SCREENSHOTS
    })

    it('return if test not in _tests', () => {
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } } as any, {} as any)
        insightsHandler['_tests'] = { 'test title not there': { 'uuid': 'uuid' } }
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })

    it('return if command not in _commands', () => {
        insightsHandler['_commands'] = { 'command not here': {} }
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } }, {})
        expect(uploadEventDataSpy).toBeCalledTimes(0)
    })
})

describe('getIdentifier', () => {
    let insightsHandler
    let getUniqueIdentifierSpy
    let getUniqueIdentifierForCucumberSpy

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }

        getUniqueIdentifierSpy = vi.spyOn(utils, 'getUniqueIdentifier')
        getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')
    })

    it('non cucumber', () => {
        insightsHandler['getIdentifier']({ parent: 'parent', title: 'title' } as any)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
    })

    it('cucumber', () => {
        insightsHandler['getIdentifier']({ pickle: { uri: 'uri', astNodeIds: ['9', '8'] } } as any)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        getUniqueIdentifierSpy.mockReset()
        getUniqueIdentifierForCucumberSpy.mockReset()
    })
})
