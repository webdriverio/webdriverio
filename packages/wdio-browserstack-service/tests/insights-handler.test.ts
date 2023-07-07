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
    let insightsHandler: InsightsHandler

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
    let insightsHandler: InsightsHandler

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
    let insightsHandler: InsightsHandler

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
    let insightsHandler: InsightsHandler

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
    let insightsHandler: InsightsHandler

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
        insightsHandler = new InsightsHandler(browser, false, 'framework')
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

describe('getTestRunId', function () {
    let insightsHandler: InsightsHandler
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
    })

    it('should return if null context', () => {
        expect(insightsHandler.getTestRunId(null)).toEqual(undefined)
    })

    it('return test id from current test', () => {
        const identifier = 'parent title - some title'
        insightsHandler['_tests'] = { [identifier]: { uuid: '1234' } }
        expect(insightsHandler.getTestRunId({
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
        insightsHandler = new InsightsHandler(browser, false, 'framework')
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
    let insightsHandler: InsightsHandler

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, false, 'mocha')
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

    describe('jasmine', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, false, 'jasmine')
            insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_tests'] = {}
        })

        it('shouldn\'t update test data', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', fullName: 'parent test' } as any)
            expect(insightsHandler['_tests']).toEqual({})
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(0)
        })
    })
})

describe('beforeHook', () => {
    let insightsHandler: InsightsHandler

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, false, 'mocha')
            insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_tests'] = {}
            insightsHandler['_framework'] = 'mocha'
        })

        beforeEach(() => {
            vi.mocked(insightsHandler['sendTestRunEvent']).mockClear()
            vi.mocked(insightsHandler['attachHookData']).mockClear()
            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('parent - test')
        })

        it('update hook data', async () => {
            await insightsHandler.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
            expect(insightsHandler['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(1)
        })
    })

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, false, 'cucumber')
            insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_tests'] = {}
            insightsHandler['_framework'] = 'cucumber'
        })

        beforeEach(() => {
            vi.mocked(insightsHandler['sendTestRunEvent']).mockClear()
            vi.mocked(insightsHandler['attachHookData']).mockClear()
        })

        it('doesn\'t update hook data', async () => {
            await insightsHandler.beforeHook(undefined as any, {} as any)
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(0)
        })
    })
})

describe('afterHook', () => {
    let insightsHandler: InsightsHandler

    describe('mocha', () => {
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

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, false, 'cucumber')
            insightsHandler['sendTestRunEvent'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })

            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
            vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
            vi.mocked(insightsHandler['sendTestRunEvent']).mockClear()
            vi.mocked(insightsHandler['attachHookData']).mockClear()
        })

        it('doesn\'t update hook data', async () => {
            await insightsHandler.afterHook(undefined as any, {} as any)
            expect(insightsHandler['sendTestRunEvent']).toBeCalledTimes(0)
        })
    })
})

describe('getIntegrationsObject', () => {
    let insightsHandler: InsightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, false, 'framework')
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
    })

    it('return hash', () => {
        expect(insightsHandler['getIntegrationsObject']()).toBeInstanceOf(Object)
    })
})

describe('browserCommand', () => {
    let insightsHandler: InsightsHandler
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
    let insightsHandler: InsightsHandler
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
