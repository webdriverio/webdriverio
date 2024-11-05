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
