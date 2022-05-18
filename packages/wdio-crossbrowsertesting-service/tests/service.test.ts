import { describe, expect, it, beforeEach, afterEach, test, vi } from 'vitest'

import got from 'got'
import CrossBrowserTestingService from '../src/service'
import { Frameworks } from '@wdio/types'

vi.mock('got')
vi.mocked(got.put).mockResolvedValue({ body: '{}' })

const uri = 'some/uri'
const featureObject = {
    name: 'Create a feature'
}

const testArgumens = {
    capabilities:  {
        name: 'Test suite',
        tags: ['tag1', 'tag2'],
        public: true,
        build: 344
    },
    beforeSession: { user: 'test', key: 'testy' },
    afterTest:<[Frameworks.Test, any]> [{}, {}]
}

describe('wdio-crossbrowsertesting-service', () => {
    const execute = vi.fn()
    let browser: any

    beforeEach(() => {
        browser = {
            execute,
            sessionId: 'globalSessionId',
            requestHandler: {
                auth: {
                    user: 'test',
                    pass: 'testy'
                }
            },
            config: {},
            chromeA: { sessionId: 'sessionChromeA' },
            chromeB: { sessionId: 'sessionChromeB' },
            chromeC: { sessionId: 'sessionChromeC' },
            instances: ['chromeA', 'chromeB', 'chromeC'],
            isMultiremote: false
        } as any
    })

    afterEach(() => {
        browser = undefined
        execute.mockReset();
        vi.mocked(got.put).mockClear()
    })

    it('constructor', () => {
        const capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, testArgumens.capabilities as any)
        cbtService['_browser'] = browser

        expect(cbtService['_capabilities']).toEqual(capabilities as any)
        expect(cbtService['_cbtUsername']).toEqual('test')
        expect(cbtService['_cbtAuthkey']).toEqual('testy')
        expect(cbtService['_testCnt']).toEqual(0)
        expect(cbtService['_failures']).toEqual(0)
    })

    it('before', () => {
        const cbtService = new CrossBrowserTestingService(
            {
                ...testArgumens.beforeSession
            } as any,
            testArgumens.capabilities as any
        )
        cbtService.before({}, [], 'browser' as any)
        expect(cbtService['_browser']).toBe('browser' as any)
    })

    it('beforeSuite', () => {
        const cbtService = new CrossBrowserTestingService(
            { ...testArgumens.beforeSession } as any,
            testArgumens.capabilities as any
        )
        cbtService['_browser'] = browser
        const suiteTitle = 'Test Suite Title'
        cbtService.beforeSuite({ title: suiteTitle } as Frameworks.Suite)

        expect(cbtService['_suiteTitle']).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
        const cbtService = new CrossBrowserTestingService(
            { ...testArgumens.beforeSession } as any,
            testArgumens.capabilities as any
        )
        cbtService['_browser'] = browser
        const test = {
            fullName: 'Test #1',
            parent: 'Test parent'
        } as any
        cbtService['_cbtUsername'] = ''
        cbtService['_cbtAuthkey'] = ''
        cbtService['_suiteTitle'] = 'Test suite'
        cbtService.beforeTest(test)
        expect(cbtService['_suiteTitle']).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as any
        cbtService.beforeSuite({ title: 'Test suite' } as Frameworks.Suite)
        cbtService.beforeTest(test)

        expect(cbtService['_suiteTitle']).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as any

        cbtService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as Frameworks.Suite)
        cbtService.beforeTest(test)

        expect(cbtService['_suiteTitle']).toEqual('Test ')
    })

    it('beforeTest: should not do anything if no key was specified', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as Frameworks.Suite)
        cbtService.beforeTest({} as any)

        expect(cbtService['_suiteTitle']).not.toEqual('Test ')
    })

    it('afterSuite', ()=>{
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        expect(cbtService['_failures']).toBe(0)

        cbtService.afterSuite({} as Frameworks.Suite)
        expect(cbtService['_failures']).toBe(0)

        cbtService.afterSuite({ error: new Error('error') } as Frameworks.Suite)
        expect(cbtService['_failures']).toBe(1)

    })

    it('afterTest: passed test', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        cbtService['_failures'] = 0
        const testResult = {
            passed: true
        } as Frameworks.TestResult

        cbtService.afterTest(...testArgumens.afterTest, testResult)
        expect(cbtService['_failures']).toEqual(0)
    })

    it('afterTest: failed test', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        cbtService['_failures'] = 0
        const testResult = {
            passed: false
        } as Frameworks.TestResult
        cbtService.afterTest(...testArgumens.afterTest, testResult)

        expect(cbtService['_failures']).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        cbtService.beforeFeature(uri, featureObject)
    })

    it('beforeFeature: execute called', () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser

        cbtService.beforeFeature(uri, featureObject)
        expect(cbtService['_suiteTitle']).toEqual('Create a feature')
    })

    it('afterScenario: exception happened', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        cbtService['_failures'] = 0

        expect(cbtService['_failures']).toBe(0)

        cbtService.afterScenario({} as any, { passed: true })
        expect(cbtService['_failures']).toBe(0)

        cbtService.afterScenario({} as any, { passed: false })
        expect(cbtService['_failures']).toBe(1)

        cbtService.afterScenario({} as any, { passed: true })
        expect(cbtService['_failures']).toBe(1)

        cbtService.afterScenario({} as any, { passed: false })
        expect(cbtService['_failures']).toBe(2)
    })

    it('after: updatedJob not called', async () => {
        const cbtService = new CrossBrowserTestingService({
            user: '',
            key: ''
        } as any, {} as any)
        cbtService['_browser'] = browser
        const updateJobSpy = vi.spyOn(cbtService, 'updateJob')
        await cbtService.after()
        expect(updateJobSpy).toHaveBeenCalledTimes(0)
    })

    it('after: updatedJob called with passed params', async () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser
        const updateJobSpy = vi.spyOn(cbtService, 'updateJob')

        cbtService['_config'] = { mochaOpts: { bail:<any> 1 } } as any
        cbtService['_browser'].sessionId = 'test'

        cbtService['_failures'] = 2
        await cbtService.after()

        expect(updateJobSpy).toHaveBeenCalledWith('test', 2)
    })

    test('after: with bail set', async () => {
        const cbtService = new CrossBrowserTestingService({ ...testArgumens.beforeSession } as any, {})
        cbtService['_browser'] = browser
        cbtService['_failures'] = 5
        cbtService.updateJob = vi.fn()

        cbtService['_browser'].isMultiremote = false
        cbtService['_browser'].sessionId = 'test'
        cbtService['_config'] = { mochaOpts: { bail:<any> 1 } } as any
        await cbtService.after(1)

        expect(cbtService.updateJob).toHaveBeenCalledWith('test', 1)
    })

    it('after: with multi-remote: updatedJob called with passed params', async () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, { chromeA: {}, chromeB: {}, chromeC: {} } as any)
        cbtService['_browser'] = browser
        const updateJobSpy = vi.spyOn(cbtService, 'updateJob')
        cbtService['_browser'].isMultiremote = true
        cbtService['_browser'].sessionId = 'sessionId'
        cbtService['_failures'] = 2
        await cbtService.after()

        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeA', 2, false, 'chromeA')
        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeB', 2, false, 'chromeB')
        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeC', 2, false, 'chromeC')
    })

    it('onReload: updatedJob not called', () => {
        const cbtService = new CrossBrowserTestingService({
            user: undefined,
            key: undefined
        } as any, {})
        cbtService['_browser'] = browser
        const cbtService2 = new CrossBrowserTestingService({} as any, {} as any)
        const updateJobSpy = vi.spyOn(cbtService2, 'updateJob')

        cbtService['_browser'].sessionId = 'sessionId'
        cbtService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toHaveBeenCalledTimes(0)
    })

    it('onReload: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser
        const updateJobSpy = vi.spyOn(cbtService, 'updateJob')

        cbtService['_browser'].sessionId = 'sessionId'
        cbtService['_failures'] = 2
        cbtService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toHaveBeenCalledWith('oldSessionId', 2, true)

    })

    it('onReload with multi-remote: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService({
            ...testArgumens.beforeSession
        } as any, {})
        cbtService['_browser'] = browser
        const updateJobSpy = vi.spyOn(cbtService, 'updateJob')

        cbtService['_browser'].isMultiremote = true
        cbtService['_browser'].sessionId = 'sessionId'
        cbtService['_failures'] = 2
        cbtService.onReload('oldSessionId', 'sessionChromeA')

        expect(updateJobSpy).toHaveBeenCalledWith('oldSessionId', 2, true, 'chromeA')

    })

    it('getRestUrl', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {} as any)
        cbtService['_browser'] = browser
        expect(cbtService.getRestUrl('testSessionId'))
            .toEqual('https://crossbrowsertesting.com/api/v3/selenium/testSessionId')
    })

    it('getBody', () => {
        const cbtService = new CrossBrowserTestingService({} as any, testArgumens.capabilities as any)
        cbtService['_browser'] = browser
        cbtService.beforeSuite({ title: 'Suite title' } as Frameworks.Suite)

        expect(cbtService.getBody(0, false)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '1',
                tags: ['tag1', 'tag2']
            }
        })

        cbtService['_testCnt'] = 2
        cbtService['_browser'].isMultiremote = true
        expect(cbtService.getBody(2, true)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '0',
                tags: ['tag1', 'tag2']
            }
        })
    })

    it('getBody should contain browserName if passed', () => {
        const cbtService = new CrossBrowserTestingService({} as any, {
            name: 'Test suite',
            tags: ['tag3', 'tag4'],
            public: true,
            build: 344
        } as any)

        expect(cbtService.getBody(0, false, 'internet explorer')).toEqual({
            test: {
                build: 344,
                name: 'internet explorer: Test suite',
                public: true,
                success: '1',
                tags: ['tag3', 'tag4']
            }
        })
    })

    it('updateJob success', async () => {
        const service = new CrossBrowserTestingService({ user: 'test', key: 'testy' } as any, {})
        service['_browser'] = browser
        service['_suiteTitle'] = 'my test'

        await service.updateJob('12345', 23, true)
        expect(service['_failures']).toBe(0)
        expect(got.put).toHaveBeenCalled()
        // @ts-expect-error
        expect(vi.mocked(got.put).mock.calls[0][1]?.username).toBe('test')
        // @ts-expect-error
        expect(vi.mocked(got.put).mock.calls[0][1]?.password).toBe('testy')
    })

    it('updateJob failure', async () => {
        const response: any = new Error('Failure')
        response.statusCode = 500;
        vi.mocked(got.put).mockRejectedValue(response)

        const service = new CrossBrowserTestingService({ user: 'test', key: 'testy' } as any, {})
        service['_browser'] = browser
        service['_suiteTitle'] = 'my test'
        const err: any = await service.updateJob('12345', 23, true).catch((err) => err)
        expect(err.message).toBe('Failure')

        expect(service['_failures']).toBe(0)
    })
})
