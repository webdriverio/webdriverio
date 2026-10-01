import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frameworks } from '@wdio/types'

import TestingBotService from '../src/service.js'

const uri = '/some/uri'
const featureObject = {
    name: 'Create a feature'
} as any

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('wdio-testingbot-service', () => {
    let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    let executeScript: ReturnType<typeof vi.fn>
    let chromeA: { sessionId: string, executeScript: ReturnType<typeof vi.fn> }
    let chromeB: { sessionId: string, executeScript: ReturnType<typeof vi.fn> }
    let chromeC: { sessionId: string, executeScript: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        executeScript = vi.fn()
        chromeA = { sessionId: 'sessionChromeA', executeScript: vi.fn() }
        chromeB = { sessionId: 'sessionChromeB', executeScript: vi.fn() }
        chromeC = { sessionId: 'sessionChromeC', executeScript: vi.fn() }
        browser = {
            executeScript,
            sessionId: 'globalSessionId',
            getInstance: vi.fn().mockImplementation((browserName: string) => {
                // @ts-expect-error fixture instances are not on the MultiRemoteBrowser type
                return browser[browserName] as WebdriverIO.Browser
            }),
            chromeA,
            chromeB,
            chromeC,
            instances: ['chromeA', 'chromeB', 'chromeC'],
        } as unknown as WebdriverIO.MultiRemoteBrowser
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('beforeTest skips annotation without credentials', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService.before(undefined, undefined, browser)
        tbService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as Frameworks.Suite)
        tbService.beforeTest({
            fullName: 'Login page should greet the user',
            title: 'should greet the user',
            parent: 'Login page'
        } as Frameworks.Test)

        expect(executeScript).not.toHaveBeenCalled()
        expect(tbService.getBody(0, false).test.name).toBe('Jasmine__TopLevel__Suite')
    })

    it('beforeTest annotates with the full test name', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        tbService.beforeSuite({ title: 'Test suite' } as Frameworks.Suite)
        await tbService.beforeTest({
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as Frameworks.Test)

        expect(executeScript).toHaveBeenCalledWith('tb:test-context=Test #1', [])
    })

    it('beforeTest rewrites a Jasmine top-level suite into the job name', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        const test: Frameworks.Test = {
            name: 'should greet the user',
            fullName: 'Login page should greet the user',
            title: 'should greet the user',
            parent: 'Login page'
        } as Frameworks.Test

        tbService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as Frameworks.Suite)
        await tbService.beforeTest(test)

        expect(executeScript).toHaveBeenCalledWith('tb:test-context=Login page should greet the user', [])
        expect(tbService.getBody(0, false)).toEqual({
            test: {
                name: 'Login page',
                success: '1'
            }
        })
    })

    it('beforeTest annotates Mocha tests with parent and title', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        tbService.beforeSuite({} as Frameworks.Suite)
        await tbService.beforeTest({
            name: 'Test name',
            title: 'Test title',
            parent: 'Test parent'
        } as Frameworks.Test)

        expect(executeScript).toHaveBeenCalledWith('tb:test-context=Test parent - Test title', [])
    })

    it('beforeTest annotates every multi-remote browser', async () => {
        const caps = {
            chromeA: { capabilities: {} },
            chromeB: { capabilities: {} },
            chromeC: { capabilities: {} }
        }
        const tbService = new TestingBotService({}, caps, {
            user: 'user',
            key: 'secret'
        })
        browser.isMultiRemote = true
        tbService.before(undefined, undefined, browser)
        tbService.beforeSuite({ title: 'Test suite' } as Frameworks.Suite)
        await tbService.beforeTest({
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        } as Frameworks.Test)

        expect(executeScript).not.toHaveBeenCalled()
        expect(chromeA.executeScript).toHaveBeenCalledWith('tb:test-context=Test #1', [])
        expect(chromeB.executeScript).toHaveBeenCalledWith('tb:test-context=Test #1', [])
        expect(chromeC.executeScript).toHaveBeenCalledWith('tb:test-context=Test #1', [])
    })

    it('afterTest does not count a passing test', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_failures'] = 0
        tbService.afterTest({} as Frameworks.Test, {}, { passed: true } as Frameworks.TestResult)

        expect(tbService['_failures']).toEqual(0)
    })

    it('afterTest counts a failing test', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService['_failures'] = 0
        tbService.afterTest({} as Frameworks.Test, {}, { passed: false } as Frameworks.TestResult)

        expect(tbService['_failures']).toEqual(1)
    })

    it('beforeFeature skips annotation without credentials', () => {
        const tbService = new TestingBotService({}, {}, {})
        tbService.before(undefined, undefined, browser)
        tbService.beforeFeature(uri, featureObject)

        expect(executeScript).not.toHaveBeenCalled()
    })

    it('beforeFeature annotates the feature name', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        await tbService.beforeFeature(uri, featureObject)

        expect(executeScript).toHaveBeenCalledWith('tb:test-context=Feature: Create a feature', [])
        expect(tbService.getBody(0, false)).toEqual({
            test: {
                name: 'Create a feature',
                success: '1'
            }
        })
    })

    it('afterScenario counts failed scenarios', () => {
        const tbService = new TestingBotService({}, {}, {})
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

    it('beforeScenario skips annotation when the secret is missing', () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: undefined
        })
        tbService.before(undefined, undefined, browser)
        tbService.beforeScenario({ pickle: {} })

        expect(executeScript).not.toHaveBeenCalled()
    })

    it('beforeScenario annotates the scenario name', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        await tbService.beforeScenario({ pickle: { name: 'Scenario name' } })

        expect(executeScript).toHaveBeenCalledWith('tb:test-context=Scenario: Scenario name', [])
    })

    it('after: updatedJob not called', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: undefined,
            key: undefined
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        await tbService.after()

        expect(updateJobSpy).not.toHaveBeenCalled()
    })

    it('after forwards the failure count', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        browser.sessionId = 'sessionId'

        tbService['_failures'] = 2
        await tbService.after()

        expect(updateJobSpy).toHaveBeenCalledWith('sessionId', 2)
    })

    it('after: updatedJob called when bailed', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        browser.sessionId = 'sessionId'
        await tbService.after(10)

        expect(updateJobSpy).toHaveBeenCalledWith('sessionId', 1)
    })

    it('after: updatedJob called when status passed', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret',
            mochaOpts: { bail: true }
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')
        browser.sessionId = 'sessionId'

        tbService['_failures'] = 0
        await tbService.after()

        expect(updateJobSpy).toHaveBeenCalledWith('sessionId', 0)
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
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        browser.isMultiRemote = true
        browser.sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.after()

        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeA', 2, false, 'chromeA')
        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeB', 2, false, 'chromeB')
        expect(updateJobSpy).toHaveBeenCalledWith('sessionChromeC', 2, false, 'chromeC')
    })

    it('onReload skips the job update without credentials', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: undefined,
            key: undefined
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        browser.sessionId = 'sessionId'
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toHaveBeenCalled()
    })

    it('onReload: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        browser.sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toHaveBeenCalledWith('oldSessionId', 2, true)
        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
    })

    it('onReload with multi-remote: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService({}, {}, {
            user: 'user',
            key: 'secret'
        })
        tbService.before(undefined, undefined, browser)
        const updateJobSpy = vi.spyOn(tbService, 'updateJob')

        browser.isMultiRemote = true
        browser.sessionId = 'sessionId'
        tbService['_failures'] = 2
        await tbService.onReload('oldSessionId', 'sessionChromeA')

        expect(updateJobSpy).toHaveBeenCalledWith('oldSessionId', 2, true, 'chromeA')
        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
    })

    it('getBody', () => {
        const caps = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        const tbService = new TestingBotService({}, caps, {})
        tbService.before(undefined, undefined, browser)
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

        expect(tbService.getBody(2, false)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '0',
                tags: ['tag1', 'tag2']
            }
        })

        const unnamed = new TestingBotService({}, {}, {})
        unnamed.before(undefined, undefined, browser)
        unnamed.beforeSuite({ title: 'Suite title' } as Frameworks.Suite)
        expect(unnamed.getBody(0, false)).toEqual({
            test: {
                name: 'Suite title',
                success: '1'
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
        tbService.before(undefined, undefined, browser)

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
        const user = 'foobar'
        const key = '123'
        const service = new TestingBotService({}, {}, { user: user, key: key })
        service.before(undefined, undefined, browser)
        service.beforeSuite({ title: 'my test' } as Frameworks.Suite)

        await service.updateJob('12345', 23, true)

        expect(service['_failures']).toBe(0)
        const encodedAuth = Buffer.from(`${user}:${key}`, 'utf8').toString('base64')
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
            'https://api.testingbot.com/v1/tests/12345',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({
                    test: {
                        name: 'my test (1)',
                        success: '0'
                    }
                }),
                headers: expect.objectContaining({
                    Authorization: `Basic ${encodedAuth}`
                })
            })
        )
    })

    it('updateJob failure', async () => {
        const response: any = new Error('Failure')
        response.statusCode = 500
        vi.mocked(fetch).mockRejectedValueOnce(response)

        const service = new TestingBotService({}, {}, { user: 'foobar', key: '123' })
        service.before(undefined, undefined, browser)
        const err: any = await service.updateJob('12345', 23, true).catch((err) => err)
        expect(err.message).toBe('Failure')

        expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('PUT')
        expect(service['_failures']).toBe(0)
    })

    it('afterSuite', () => {
        const service = new TestingBotService({}, {}, {})
        expect(service['_failures']).toBe(0)
        service.afterSuite({} as Frameworks.Suite)
        expect(service['_failures']).toBe(0)
        service.afterSuite({ error: new Error('boom!') } as Frameworks.Suite)
        expect(service['_failures']).toBe(1)
    })
})
