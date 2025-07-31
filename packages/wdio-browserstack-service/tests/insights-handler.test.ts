/// <reference path="../../webdriverio/src/@types/async.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'
import type { StdLog } from '../src/index.js'

import InsightsHandler from '../src/insights-handler.js'
import * as utils from '../src/util.js'
import * as bstackLogger from '../src/bstackLogger.js'
import Listener from '../src/testOps/listener.js'
import { TESTOPS_SCREENSHOT_ENV } from '../src/constants.js'

const log = logger('test')
let insightsHandler: InsightsHandler
let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

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
    insightsHandler = new InsightsHandler(browser, 'framework')
})

it('should initialize correctly', () => {
    insightsHandler = new InsightsHandler(browser, 'framework')
    expect(insightsHandler['_tests']).toEqual({})
    expect(insightsHandler['_hooks']).toEqual({})
    expect(insightsHandler['_commands']).toEqual({})
    expect(insightsHandler['_framework']).toEqual('framework')
})

describe('before', () => {
    const isBrowserstackSessionSpy = vi.spyOn(utils, 'isBrowserstackSession')

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        insightsHandler['getTestRunDataForCucumber'] = vi.fn()
        insightsHandler['_tests'] = {}
    })

    it('getTestRunDataForCucumber called', () => {
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
        expect(insightsHandler['getTestRunDataForCucumber']).toBeCalledTimes(1)
    })
})

describe('afterScenario', () => {
    let insightsHandler: InsightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
        insightsHandler['getTestRunDataForCucumber'] = vi.fn()
        insightsHandler['_tests'] = {}
    })

    it('getTestRunDataForCucumber called', () => {
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
        expect(insightsHandler['getTestRunDataForCucumber']).toBeCalledTimes(1)
    })
})

describe('beforeStep', () => {
    let insightsHandler: InsightsHandler

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
            insightsHandler = new InsightsHandler(browser, 'mocha')
            insightsHandler['getRunData'] = vi.fn().mockImplementation(() => { return [] })
            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
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
    })

    describe('jasmine', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, 'jasmine')
            insightsHandler['getRunData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_tests'] = {}
        })

        it('shouldn\'t update test data', async () => {
            await insightsHandler.beforeTest({ parent: 'parent', fullName: 'parent test' } as any)
            expect(insightsHandler['_tests']).toEqual({})
            expect(insightsHandler['getRunData']).toBeCalledTimes(0)
        })
    })
})

describe('beforeHook', () => {
    let insightsHandler: InsightsHandler

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, 'mocha')
            insightsHandler['getRunData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_tests'] = {}
            insightsHandler['_framework'] = 'mocha'
        })

        beforeEach(() => {
            vi.mocked(insightsHandler['getRunData']).mockClear()
            vi.mocked(insightsHandler['attachHookData']).mockClear()
            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('parent - test')
        })

        it('update hook data', async () => {
            await insightsHandler.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
            expect(insightsHandler['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z' } })
            expect(insightsHandler['getRunData']).toBeCalledTimes(1)
        })
    })

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, 'cucumber')
            insightsHandler['processCucumberHook'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['_framework'] = 'cucumber'
        })

        it('should call cucumber hook processor', async () => {
            await insightsHandler.beforeHook(undefined as any, {} as any)
            expect(insightsHandler['processCucumberHook']).toBeCalledTimes(1)
        })
    })
})

describe('afterHook', () => {
    let insightsHandler: InsightsHandler

    describe('mocha', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, 'mocha')
            insightsHandler['getRunData'] = vi.fn().mockImplementation(() => { return [] })
            insightsHandler['attachHookData'] = vi.fn().mockImplementation(() => { return [] })

            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
            vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
            vi.mocked(insightsHandler['getRunData']).mockClear()
            vi.mocked(insightsHandler['attachHookData']).mockClear()
        })

        it('add hook data', async () => {
            insightsHandler['_tests'] = {}
            await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
            expect(insightsHandler['getRunData']).toBeCalledTimes(1)
        })

        it('update hook data', async () => {
            insightsHandler['_tests'] = { 'test title': {} }
            await insightsHandler.afterHook({ parent: 'parent', title: 'test' } as any, {} as any)
            expect(insightsHandler['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
            expect(insightsHandler['getRunData']).toBeCalledTimes(1)
        })
    })

    describe('cucumber', () => {
        beforeEach(() => {
            insightsHandler = new InsightsHandler(browser, 'cucumber')
            insightsHandler['processCucumberHook'] = vi.fn().mockImplementation(() => { return [] })
        })

        it('should call cucumber hook processor', async () => {
            await insightsHandler.afterHook(undefined as any, {} as any)
            expect(insightsHandler['processCucumberHook']).toBeCalledTimes(1)
        })
    })
})

describe('getIntegrationsObject', () => {
    let insightsHandler: InsightsHandler
    let getPlatformVersionSpy

    beforeAll(() => {
        getPlatformVersionSpy = vi.spyOn(utils, 'getPlatformVersion').mockImplementation(() => { return 'some version' })
    })

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
        insightsHandler['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
    })

    it('return hash', () => {
        const integrationsObject = insightsHandler['getIntegrationsObject']()
        expect(integrationsObject).toBeInstanceOf(Object)
        expect(integrationsObject.platform_version).toEqual('some version')
    })

    it('should fetch latest details', () => {
        const existingSessionId = browser.sessionId
        const existingOs = browser.capabilities.os
        browser.sessionId = 'session-new'
        browser.capabilities.os = 'Windows'
        const integrationsObject = insightsHandler['getIntegrationsObject']()
        expect(integrationsObject.session_id).toEqual('session-new')
        expect(integrationsObject.capabilities.os).toEqual('Windows')
        browser.sessionId = existingSessionId
        browser.capabilities.os = existingOs
    })

    afterAll(() => {
        getPlatformVersionSpy.mockReset()
    })
})

describe('browserCommand', () => {
    let insightsHandler: InsightsHandler
    let uploadEventDataSpy
    let commandSpy

    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
        insightsHandler['getIdentifier'] = vi.fn().mockImplementation(() => { return 'test title' })
        insightsHandler['_tests'] = { 'test title': { 'uuid': 'uuid' } }
        insightsHandler['_commands'] = { 's_m_e': {} as any }

        uploadEventDataSpy = vi.spyOn(Listener.getInstance(), 'onScreenshot').mockImplementation(() => { return [] as any })
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
        process.env[TESTOPS_SCREENSHOT_ENV] = 'true'
        commandSpy.mockImplementation(() => { return true })
        insightsHandler.browserCommand('client:afterCommand', { sessionId: 's', method: 'm', endpoint: 'e', result: { value: 'random' } } as any, {} as any)
        expect(uploadEventDataSpy).toBeCalled()
        delete process.env[TESTOPS_SCREENSHOT_ENV]
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
        insightsHandler = new InsightsHandler(browser, 'framework')
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
    let sendDataSpy
    const logObj: StdLog = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'some log',
        kind: 'TEST_LOG',
        http_response: {}
    }
    let testLogObj: StdLog
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'mocha')
        sendDataSpy = vi.spyOn(insightsHandler['listener'], 'logCreated').mockImplementation(() => { return [] as any })
        testLogObj = { ...logObj }
    })

    it('should upload with current test uuid for log', function () {
        InsightsHandler['currentTest'] = { uuid: 'some_uuid' }
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
        InsightsHandler['currentTest'] = {}
        insightsHandler['_currentHook'] = { uuid: 'some_uuid', finished: true }
        insightsHandler['appendTestItemLog'](testLogObj)
        expect(testLogObj.hook_run_uuid).toBe(undefined)
        expect(testLogObj.test_run_uuid).toBe(undefined)
        expect(sendDataSpy).toBeCalledTimes(0)
    })
})

describe('processCucumberHook', function () {
    let insightsHandler: InsightsHandler
    let getHookRunDataForCucumberSpy, cucumberHookTypeSpy, cucumberHookUniqueIdSpy
    beforeEach(() => {
        insightsHandler = new InsightsHandler(browser, 'mocha')
        getHookRunDataForCucumberSpy = vi.spyOn(insightsHandler, 'getHookRunDataForCucumber').mockImplementation(() => { return [] as any })
        cucumberHookTypeSpy = vi.spyOn(insightsHandler, 'getCucumberHookType')
        cucumberHookTypeSpy.mockImplementation(() => { return 'hii' })
        cucumberHookUniqueIdSpy = vi.spyOn(insightsHandler, 'getCucumberHookUniqueId')
    })

    it('should not update if no hook type', function () {
        cucumberHookTypeSpy.mockReturnValue(null)
        insightsHandler['processCucumberHook'](undefined, { event: 'before' })
        expect(getHookRunDataForCucumberSpy).toBeCalledTimes(0)
    })

    it ('should send data for before event', function () {
        cucumberHookTypeSpy.mockReturnValue('BEFORE_ALL')
        InsightsHandler['currentTest'].uuid = 'test_uuid'
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

describe('sendCBTInfo', () => {
    beforeAll(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
    })
    it('should not call cbtSessionCreated', () => {
        const cbtSessionCreatedSpy = vi.spyOn(Listener.getInstance(), 'cbtSessionCreated').mockImplementation(() => { return [] as any })
        insightsHandler.sendCBTInfo()
        expect(cbtSessionCreatedSpy).toBeCalledTimes(0)
    })
    it('should call cbtSessionCreated', () => {
        insightsHandler.currentTestId = 'abc'
        const cbtSessionCreatedSpy = vi.spyOn(Listener.getInstance(), 'cbtSessionCreated').mockImplementation(() => { return [] as any })
        insightsHandler.sendCBTInfo()
        expect(cbtSessionCreatedSpy).toBeCalled()
    })
})

describe('flushCBTDataQueue', () => {
    beforeAll(() => {
        insightsHandler = new InsightsHandler(browser, 'framework')
    })
    it('flushCBTDataQueue should not call cbtSessionCreated', () => {
        insightsHandler.cbtQueue = [{ uuid: 'abc', integrations: {} }]
        const cbtSessionCreatedSpy = vi.spyOn(Listener.getInstance(), 'cbtSessionCreated').mockImplementation(() => { return [] as any })
        insightsHandler.flushCBTDataQueue()
        expect(cbtSessionCreatedSpy).toBeCalledTimes(0)
    })
    it('flushCBTDataQueue should call cbtSessionCreated', () => {
        insightsHandler.currentTestId = 'abc'
        insightsHandler.cbtQueue = [{ uuid: 'abc', integrations: {} }]
        const cbtSessionCreatedSpy = vi.spyOn(Listener.getInstance(), 'cbtSessionCreated').mockImplementation(() => { return [] as any })
        insightsHandler.flushCBTDataQueue()
        expect(cbtSessionCreatedSpy).toBeCalled()
    })
})

describe('hasTestStepFailures for ignoreHooksStatus feature', () => {
    beforeAll(() => {
        insightsHandler = new InsightsHandler(browser, 'cucumber')
    })

    it('should return false when world.pickle is null/undefined', () => {
        const world = null as any
        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(false)
    })

    it('should return false when world.pickle exists but no test data found', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(false)
    })

    it('should return false when test data exists but no steps', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        // Mock the uniqueId generation and add test data without steps
        const uniqueId = 'test-unique-id'
        vi.doMock('../src/util.js', () => ({
            getUniqueIdentifierForCucumber: vi.fn().mockReturnValue(uniqueId)
        }))

        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z'
            // No steps property
        }

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(false)
    })

    it('should return false when test data exists with steps but none failed', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const uniqueId = 'test-unique-id-pass'
        vi.doMock('../src/util.js', () => ({
            getUniqueIdentifierForCucumber: vi.fn().mockReturnValue(uniqueId)
        }))

        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' },
                { id: 'step2', text: 'Step 2', result: 'PASSED' },
                { id: 'step3', text: 'Step 3', result: 'SKIPPED' }
            ]
        }

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(false)
    })

    it('should return true when test data exists with at least one failed step', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const uniqueId = 'test-unique-id-fail'
        const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')
        getUniqueIdentifierForCucumberSpy.mockReturnValue(uniqueId)

        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' },
                { id: 'step2', text: 'Step 2', result: 'FAILED' },
                { id: 'step3', text: 'Step 3', result: 'PASSED' }
            ]
        }

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(true)

        getUniqueIdentifierForCucumberSpy.mockRestore()
    })

    it('should return true when multiple steps failed', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const uniqueId = 'test-unique-id-multi-fail'
        const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')
        getUniqueIdentifierForCucumberSpy.mockReturnValue(uniqueId)

        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'FAILED' },
                { id: 'step2', text: 'Step 2', result: 'PASSED' },
                { id: 'step3', text: 'Step 3', result: 'FAILED' }
            ]
        }

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(true)

        getUniqueIdentifierForCucumberSpy.mockRestore()
    })

    it('should handle empty steps array', () => {
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const uniqueId = 'test-unique-id-empty'
        vi.doMock('../src/util.js', () => ({
            getUniqueIdentifierForCucumber: vi.fn().mockReturnValue(uniqueId)
        }))

        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: []
        }

        const result = insightsHandler.hasTestStepFailures(world)
        expect(result).toBe(false)
    })
})

describe('hasTestStepFailures and ignoreHooksStatus integration', () => {
    let testInsightsHandler: InsightsHandler

    beforeEach(() => {
        testInsightsHandler = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: true }
        })
    })

    it('should test hasTestStepFailures method directly', () => {
        // Test that hasTestStepFailures correctly identifies step failures
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        const uniqueId = 'test-unique-id-for-step-failures'
        const getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')
        getUniqueIdentifierForCucumberSpy.mockReturnValue(uniqueId)

        // Test: No steps - should return false
        testInsightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: undefined
        }
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test: Empty steps - should return false
        testInsightsHandler['_tests'][uniqueId].steps = []
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test: All steps passed - should return false
        testInsightsHandler['_tests'][uniqueId].steps = [
            { id: 'step1', text: 'Step 1', result: 'PASSED' },
            { id: 'step2', text: 'Step 2', result: 'PASSED' }
        ]
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test: One step failed - should return true
        testInsightsHandler['_tests'][uniqueId].steps = [
            { id: 'step1', text: 'Step 1', result: 'PASSED' },
            { id: 'step2', text: 'Step 2', result: 'FAILED' }
        ]
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(true)

        // Test: Multiple steps failed - should return true
        testInsightsHandler['_tests'][uniqueId].steps = [
            { id: 'step1', text: 'Step 1', result: 'FAILED' },
            { id: 'step2', text: 'Step 2', result: 'FAILED' }
        ]
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(true)

        // Test: Mixed results with failure - should return true
        testInsightsHandler['_tests'][uniqueId].steps = [
            { id: 'step1', text: 'Step 1', result: 'PASSED' },
            { id: 'step2', text: 'Step 2', result: 'FAILED' },
            { id: 'step3', text: 'Step 3', result: 'PASSED' }
        ]
        expect(testInsightsHandler.hasTestStepFailures(world)).toBe(true)

        getUniqueIdentifierForCucumberSpy.mockRestore()
    })

    it('should verify ignoreHooksStatus configuration is properly set', () => {
        // Test that the configuration is correctly passed through
        expect(testInsightsHandler['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(true)

        const testInsightsHandlerDisabled = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: false }
        })
        expect(testInsightsHandlerDisabled['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(false)

        const testInsightsHandlerDefault = new InsightsHandler(browser, 'cucumber', {}, {})
        expect(testInsightsHandlerDefault['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBeUndefined()
    })
})

describe('ignoreHooksStatus comprehensive tests', () => {
    it('should verify ignoreHooksStatus option is properly passed to InsightsHandler', () => {
        // Test with ignoreHooksStatus enabled
        const insightsHandlerEnabled = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: true }
        })
        expect(insightsHandlerEnabled['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(true)

        // Test with ignoreHooksStatus disabled
        const insightsHandlerDisabled = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: false }
        })
        expect(insightsHandlerDisabled['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(false)

        // Test with no testObservabilityOptions (default behavior)
        const insightsHandlerDefault = new InsightsHandler(browser, 'cucumber', {}, {})
        expect(insightsHandlerDefault['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBeUndefined()

        // Test with empty testObservabilityOptions
        const insightsHandlerEmpty = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: {}
        })
        expect(insightsHandlerEmpty['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBeUndefined()
    })

    it('should test hasTestStepFailures method comprehensively for different step results', () => {
        const insightsHandler = new InsightsHandler(browser, 'cucumber')

        // Test world with no pickle
        expect(insightsHandler.hasTestStepFailures(null)).toBe(false)

        // Test world with pickle but no test data
        const worldNoData = {
            pickle: { name: 'Test scenario' }
        } as any
        expect(insightsHandler.hasTestStepFailures(worldNoData)).toBe(false)

        // Test world with test data but no steps
        const worldNoSteps = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId = 'test-unique-id-no-steps'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z'
        }
        expect(insightsHandler.hasTestStepFailures(worldNoSteps)).toBe(false)

        // Test world with empty steps array
        const worldEmptySteps = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId2 = 'test-unique-id-empty-steps'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId2)
        insightsHandler['_tests'][uniqueId2] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: []
        }
        expect(insightsHandler.hasTestStepFailures(worldEmptySteps)).toBe(false)

        // Test world with all passed steps
        const worldPassedSteps = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId3 = 'test-unique-id-passed-steps'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId3)
        insightsHandler['_tests'][uniqueId3] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' },
                { id: 'step2', text: 'Step 2', result: 'PASSED' },
                { id: 'step3', text: 'Step 3', result: 'SKIPPED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(worldPassedSteps)).toBe(false)

        // Test world with one failed step
        const worldFailedStep = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId4 = 'test-unique-id-failed-step'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId4)
        insightsHandler['_tests'][uniqueId4] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' },
                { id: 'step2', text: 'Step 2', result: 'FAILED' },
                { id: 'step3', text: 'Step 3', result: 'PASSED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(worldFailedStep)).toBe(true)

        // Test world with multiple failed steps
        const worldMultipleFailures = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId5 = 'test-unique-id-multiple-failures'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId5)
        insightsHandler['_tests'][uniqueId5] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'FAILED' },
                { id: 'step2', text: 'Step 2', result: 'PASSED' },
                { id: 'step3', text: 'Step 3', result: 'FAILED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(worldMultipleFailures)).toBe(true)

        // Test world with mixed results including failure
        const worldMixedWithFailure = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId6 = 'test-unique-id-mixed-with-failure'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId6)
        insightsHandler['_tests'][uniqueId6] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' },
                { id: 'step2', text: 'Step 2', result: 'SKIPPED' },
                { id: 'step3', text: 'Step 3', result: 'FAILED' },
                { id: 'step4', text: 'Step 4', result: 'PASSED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(worldMixedWithFailure)).toBe(true)
    })

    it('should verify that ignoreHooksStatus logic is implemented in the correct location', () => {
        // This test verifies that the ignoreHooksStatus logic exists and is accessible
        // We can test this by checking if the method exists and works correctly

        const insightsHandler = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: true }
        })

        // Verify hasTestStepFailures method exists and works
        expect(typeof insightsHandler.hasTestStepFailures).toBe('function')

        // Verify the configuration is stored correctly
        expect(insightsHandler['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(true)

        // Test the logic with a simple case
        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        // Mock the scenario where no test data exists (should return false)
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)

        // Mock the scenario where test data exists with no failed steps
        const uniqueId = 'test-unique-id'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'PASSED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)

        // Mock the scenario where test data exists with failed steps
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'FAILED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(true)
    })

    it('should verify edge cases and error handling for hasTestStepFailures', () => {
        const insightsHandler = new InsightsHandler(browser, 'cucumber')

        // Test with null/undefined world
        expect(insightsHandler.hasTestStepFailures(null as any)).toBe(false)
        expect(insightsHandler.hasTestStepFailures(undefined as any)).toBe(false)

        // Test with world that has no pickle
        const worldNoPickle = {} as any
        expect(insightsHandler.hasTestStepFailures(worldNoPickle)).toBe(false)

        // Test with world that has empty pickle
        const worldEmptyPickle = {
            pickle: {}
        } as any
        expect(insightsHandler.hasTestStepFailures(worldEmptyPickle)).toBe(false)

        // Test with world that has pickle with null name
        const worldNullName = {
            pickle: { name: null }
        } as any
        expect(insightsHandler.hasTestStepFailures(worldNullName)).toBe(false)

        // Test with valid world but test data has undefined steps
        const worldValidWithUndefinedSteps = {
            pickle: { name: 'Test scenario' }
        } as any
        const uniqueId = 'test-unique-id-undefined-steps'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: undefined
        }
        expect(insightsHandler.hasTestStepFailures(worldValidWithUndefinedSteps)).toBe(false)

        // Test with valid world but test data has null steps (as any to bypass TypeScript)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: null as any
        }
        expect(insightsHandler.hasTestStepFailures(worldValidWithUndefinedSteps)).toBe(false)
    })

    it('should verify feature flag configuration with different option combinations', () => {
        // Test various combinations of configuration options

        // Test with only ignoreHooksStatus set to true
        const handler1 = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: { ignoreHooksStatus: true }
        })
        expect(handler1['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(true)

        // Test with ignoreHooksStatus set to false and other options
        const handler2 = new InsightsHandler(browser, 'cucumber', {}, {
            testObservabilityOptions: {
                ignoreHooksStatus: false,
                projectName: 'Test Project',
                buildName: 'Test Build'
            }
        })
        expect(handler2['_options']?.testObservabilityOptions?.ignoreHooksStatus).toBe(false)
        expect(handler2['_options']?.testObservabilityOptions?.projectName).toBe('Test Project')

        // Test with no testObservabilityOptions at all
        const handler3 = new InsightsHandler(browser, 'cucumber', {}, {})
        expect(handler3['_options']?.testObservabilityOptions).toBeUndefined()

        // Test with empty options object
        const handler4 = new InsightsHandler(browser, 'cucumber', {}, undefined)
        expect(handler4['_options']).toBeUndefined()

        // Test with null options (using any to bypass TypeScript)
        const handler5 = new InsightsHandler(browser, 'cucumber', {}, null as any)
        expect(handler5['_options']).toBeNull()
    })

    it('should test step result matching logic comprehensively', () => {
        const insightsHandler = new InsightsHandler(browser, 'cucumber')
        const uniqueId = 'test-step-results'
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue(uniqueId)

        const world = {
            pickle: { name: 'Test scenario' }
        } as any

        // Test with all possible step results that should be considered passed/skipped
        const passedResults = ['PASSED', 'SKIPPED', 'PENDING', 'UNDEFINED', 'AMBIGUOUS']
        for (const result of passedResults) {
            insightsHandler['_tests'][uniqueId] = {
                uuid: 'test-uuid',
                startedAt: '2020-01-01T00:00:00.000Z',
                steps: [
                    { id: 'step1', text: 'Step 1', result: result }
                ]
            }
            expect(insightsHandler.hasTestStepFailures(world)).toBe(false)
        }

        // Test with failed result
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'FAILED' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(true)

        // Test with mixed results where at least one is failed
        const mixedResults = ['PASSED', 'SKIPPED', 'FAILED', 'PENDING']
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: mixedResults.map((result, index) => ({
                id: `step${index + 1}`,
                text: `Step ${index + 1}`,
                result: result
            }))
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(true)

        // Test with unknown/custom result status (should be treated as not failed)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: 'CUSTOM_STATUS' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test with empty string result
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: '' }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test with null result (using any to bypass TypeScript)
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: null as any }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)

        // Test with undefined result
        insightsHandler['_tests'][uniqueId] = {
            uuid: 'test-uuid',
            startedAt: '2020-01-01T00:00:00.000Z',
            steps: [
                { id: 'step1', text: 'Step 1', result: undefined }
            ]
        }
        expect(insightsHandler.hasTestStepFailures(world)).toBe(false)
    })
})
