import path from 'node:path'
import got from 'got'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Capabilities, Frameworks } from '@wdio/types'

import TestingBotService from '../src/service.js'

const uri = '/some/uri'
const featureObject = {
    name: 'Create a feature'
} as any

vi.mock('got')
vi.mocked(got.put).mockResolvedValue({ body: '{}' })
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('wdio-testingbot-service', () => {
    const execute = vi.fn()

    let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    beforeEach(() => {
        browser = {
            execute,
            sessionId: 'globalSessionId',
            requestHandler: {
                auth: {
                    user: 'user',
                    pass: 'pass'
                }
            },
            config: {},
            getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
            chromeA: { sessionId: 'sessionChromeA' },
            chromeB: { sessionId: 'sessionChromeB' },
            chromeC: { sessionId: 'sessionChromeC' },
            instances: ['chromeA', 'chromeB', 'chromeC'],
        } as any
    })

    afterEach(() => {
        execute.mockReset()
        vi.mocked(got.put).mockClear()
    })

    it('before', () => {
        const caps = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        } as Capabilities.RemoteCapability
        const tbService = new TestingBotService(
            {},
            caps,
            {
                user: 'foobar',
                key: 'fookey'
            }
        )
        expect(tbService['_capabilities']).toEqual(caps)
        expect(tbService['_tbUser']).toEqual('foobar')
        expect(tbService['_tbSecret']).toEqual('fookey')
        expect(tbService['_testCnt']).toEqual(0)
        expect(tbService['_failures']).toEqual(0)
    })

    it('beforeSuite', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        const suiteTitle = 'Test Suite Title'
        tbService.beforeSuite({ title: suiteTitle } as Frameworks.Suite)

        expect(tbService['_suiteTitle']).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        const test = {
            fullName: 'Test #1',
            parent: 'Test parent'
        } as Frameworks.Test
        tbService['_tbUser'] = undefined
        tbService['_tbSecret'] = undefined
        tbService['_suiteTitle'] = 'Test suite'
        tbService.beforeTest(test)

        expect(execute).not.toBeCalled()
        expect(tbService['_suiteTitle']).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const test: Frameworks.Test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as any
        tbService.beforeSuite({ title: 'Test suite' } as Frameworks.Suite)
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test #1')
        expect(tbService['_suiteTitle']).toEqual('Test suite')
    })

    it('beforeTest: execute called for Jasmine tests', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const test: Frameworks.Test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as any

        tbService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as Frameworks.Suite)
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test #1')
        expect(tbService['_suiteTitle']).toEqual('Test ')
    })

    it('beforeTest: execute called for Mocha test', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const test: Frameworks.Test = {
            name: 'Test name',
            title: 'Test title',
            parent: 'Test parent'
        } as any

        tbService.beforeSuite({} as Frameworks.Suite)
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
    })

    it('afterTest: failed test', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        tbService['_failures'] = 0
        const testResult = {
            passed: true
        } as Frameworks.TestResult
        tbService.afterTest({} as Frameworks.Test, {}, testResult)

        expect(tbService['_failures']).toEqual(0)
    })

    it('afterTest: passed test', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        tbService['_failures'] = 0
        const testResult = {
            passed: false
        } as Frameworks.TestResult
        tbService.afterTest({} as Frameworks.Test, {}, testResult)

        expect(tbService['_failures']).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        tbService.beforeFeature(uri, featureObject)

        expect(execute).not.toBeCalled()
    })

    it('beforeFeature: execute called', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        tbService.beforeFeature(uri, featureObject)

        expect(tbService['_suiteTitle']).toEqual('Create a feature')
        expect(execute).toBeCalledWith('tb:test-context=Feature: Create a feature')
    })

    it('afterScenario: exception happened', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        tbService['_failures'] = 0

        expect(tbService['_failures']).toBe(0)

        tbService.afterScenario({} as any, { passed: true })
        expect(tbService['_failures']).toBe(0)

        tbService.afterScenario({} as any, { passed: false })
        expect(tbService['_failures']).toBe(1)

        tbService.afterScenario({} as any, { passed: true })
        expect(tbService['_failures']).toBe(1)

        tbService.afterScenario({} as any, { passed: false })
        expect(tbService['_failures']).toBe(2)
    })

    it('beforeScenario: execute not called', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: undefined
        })
        tbService['_browser'] = browser
        tbService.beforeScenario({ pickle: {} })

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        tbService.beforeScenario({ pickle: { name: 'Scenario name' } })

        expect(execute).toBeCalledWith('tb:test-context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: undefined,
            key: undefined
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        await tbService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        tbService['_browser'].sessionId = 'sessionId'

        tbService['_failures'] = 2
        await tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('after: updatedJob called when bailed', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        tbService['_browser'].sessionId = 'sessionId'
        await tbService.after(10)

        expect(updateJobSpy).toBeCalledWith('sessionId', 1)
    })

    it('after: updatedJob called when status passed', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        tbService['_browser'].sessionId = 'sessionId'

        tbService['_failures'] = 0
        await tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 0)
    })

    it('after: with multi-remote: updatedJob called with passed params', async () => {
        const caps = {
            chromeA: { capabilities: {} },
            chromeB: { capabilities: {} },
            chromeC: { capabilities: {} }
        }
        const tbService = new TestingBotService({}, caps, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        tbService['_browser'].isMultiremote = true
        tbService['_browser'].sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionChromeA', 2, false, 'chromeA')
        expect(updateJobSpy).toBeCalledWith('sessionChromeB', 2, false, 'chromeB')
        expect(updateJobSpy).toBeCalledWith('sessionChromeC', 2, false, 'chromeC')
    })

    it('onReload: updatedJob not called', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: undefined,
            key: undefined
        })
        tbService['_browser'] = browser
        const tbService2 = new TestingBotService({}, {}, {})
        tbService2['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService2, 'updateJob')

        tbService['_browser'].sessionId = 'sessionId'
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
    })

    it('onReload: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        tbService['_browser'].sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)
        expect(got.put).toHaveBeenCalled()
    })

    it('onReload with multi-remote: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService['_browser'] = browser
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        tbService['_browser'].isMultiremote = true
        tbService['_browser'].sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.onReload('oldSessionId', 'sessionChromeA')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true, 'chromeA')
        expect(got.put).toHaveBeenCalled()
    })

    it('getRestUrl', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_browser'] = browser
        expect(tbService.getRestUrl('testSessionId'))
            .toEqual('https://api.testingbot.com/v1/tests/testSessionId')
    })

    it('getBody', () => {
        const caps = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        const tbService = new TestingBotService({}, caps, {})
        tbService['_browser'] = browser
        tbService.beforeSuite({ title: 'Suite title' } as Frameworks.Suite)

        expect(tbService.getBody(0, false)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '1',
                tags: ['tag1', 'tag2']
            }
        })

        tbService['_testCnt'] = 2
        expect(tbService.getBody(2, true)).toEqual({
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
        const caps = {
            name: 'Test suite',
            tags: ['tag3', 'tag4'],
            public: true,
            build: 344
        }
        const tbService = new TestingBotService({}, caps, {})
        tbService['_browser'] = browser

        expect(tbService.getBody(0, false, 'internet explorer')).toEqual({
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
        const service = new TestingBotService({}, {}, { user: 'foobar', key: '123' })
        service['_browser'] = browser
        service['_suiteTitle'] = 'my test'

        await service.updateJob('12345', 23, true)

        expect(service['_failures']).toBe(0)
        expect(got.put).toHaveBeenCalled()
        expect((vi.mocked(got.put).mock.calls[0][1 as any] as any).username).toBe('foobar')
        expect((vi.mocked(got.put).mock.calls[0][1 as any] as any).password).toBe('123')
    })

    it('updateJob failure', async () => {
        const response: any = new Error('Failure')
        response.statusCode = 500
        vi.mocked(got.put).mockRejectedValue(response)

        const service = new TestingBotService({}, {}, { user: 'foobar', key: '123' })
        service['_browser'] = browser
        service['_suiteTitle'] = 'my test'
        const err: any = await service.updateJob('12345', 23, true).catch((err) => err)
        expect(err.message).toBe('Failure')

        expect(got.put).toHaveBeenCalled()
        expect(service['_failures']).toBe(0)
    })

    it('afterSuite', () => {
        const service = new TestingBotService({}, {}, {})
        service['_browser'] = browser
        expect(service['_failures']).toBe(0)
        service.afterSuite({} as Frameworks.Suite)
        expect(service['_failures']).toBe(0)
        service.afterSuite({ error: new Error('boom!') } as Frameworks.Suite)
        expect(service['_failures']).toBe(1)
    })
})
