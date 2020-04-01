import TestingBotService from '../src/service'
import got from 'got'

const uri = '/some/uri'
const featureObject = {
    type: 'gherkin-document',
    uri: '__tests__/features/passed.feature',
    document:
        {
            type: 'GherkinDocument',
            feature:
                {
                    type: 'Feature',
                    tags: ['tag'],
                    location: ['Object'],
                    language: 'en',
                    keyword: 'Feature',
                    name: 'Create a feature',
                    description: '    the description',
                    children: [''],
                },
            comments: []
        }
}

got.put.mockReturnValue(Promise.resolve({ body: '{}' }))

describe('wdio-testingbot-service', () => {
    const execute = jest.fn()

    beforeEach(() => {
        global.browser = {
            execute,
            sessionId: 'globalSessionId',
            requestHandler: {
                auth: {
                    user: 'user',
                    pass: 'pass'
                }
            },
            config: {},
            chromeA: { sessionId: 'sessionChromeA' },
            chromeB: { sessionId: 'sessionChromeB' },
            chromeC: { sessionId: 'sessionChromeC' },
            instances: ['chromeA', 'chromeB', 'chromeC'],
        }
    })

    afterEach(() => {
        delete global.browser
        execute.mockReset()
        got.put.mockClear()
    })

    it('before', () => {
        const tbService = new TestingBotService()
        const capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        tbService.beforeSession({
            user: 'foobar',
            key: 'fookey'
        }, capabilities)

        expect(tbService.capabilities).toEqual(capabilities)
        expect(tbService.tbUser).toEqual('foobar')
        expect(tbService.tbSecret).toEqual('fookey')
        expect(tbService.testCnt).toEqual(0)
        expect(tbService.failures).toEqual(0)
    })

    it('beforeSuite', () => {
        const tbService = new TestingBotService()
        const suiteTitle = 'Test Suite Title'
        tbService.beforeSuite({ title: suiteTitle })

        expect(tbService.suiteTitle).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
        const tbService = new TestingBotService()
        const test = {
            fullName: 'Test #1',
            parent: 'Test parent'
        }
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.suiteTitle = 'Test suite'
        tbService.beforeTest(test)

        expect(execute).not.toBeCalled()
        expect(tbService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const tbService = new TestingBotService()
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})
        tbService.beforeSuite({ title: 'Test suite' })
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test #1')
        expect(tbService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called for Jasmine tests', () => {
        const tbService = new TestingBotService()
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        tbService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' })
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test #1')
        expect(tbService.suiteTitle).toEqual('Test ')
    })

    it('beforeTest: execute called for Mocha test', () => {
        const tbService = new TestingBotService()
        const test = {
            name: 'Test name',
            title: 'Test title',
            parent: 'Test parent'
        }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        tbService.beforeSuite({})
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
    })

    it('afterTest: failed test', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const test = {
            passed: true
        }
        tbService.afterTest({}, {}, test)

        expect(tbService.failures).toEqual(0)
    })

    it('afterTest: passed test', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const test = {
            passed: false
        }
        tbService.afterTest({}, {}, test)

        expect(tbService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const tbService = new TestingBotService()
        tbService.beforeFeature(uri, featureObject)

        expect(execute).not.toBeCalled()
    })

    it('beforeFeature: execute called', () => {
        const tbService = new TestingBotService()
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})
        tbService.beforeFeature(uri, featureObject)

        expect(tbService.suiteTitle).toEqual('Create a feature')
        expect(execute).toBeCalledWith('tb:test-context=Feature: Create a feature')
    })

    it('afterScenario: exception happened', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0

        expect(tbService.failures).toBe(0)

        tbService.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(tbService.failures).toBe(0)

        tbService.afterScenario(uri, {}, {}, { status: 'failed' })
        expect(tbService.failures).toBe(1)

        tbService.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(tbService.failures).toBe(1)

        tbService.afterScenario(uri, {}, {}, { status: 'failed' })
        expect(tbService.failures).toBe(2)
    })

    it('beforeScenario: execute not called', () => {
        const tbService = new TestingBotService()
        const scenario = { name: 'Scenario name' }
        tbService.beforeSession({
            user: 'user',
            key: undefined
        }, {})
        tbService.beforeScenario(uri, featureObject, scenario)

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const tbService = new TestingBotService()
        const scenario = { name: 'Scenario name' }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})
        tbService.beforeScenario(uri, featureObject, scenario)

        expect(execute).toBeCalledWith('tb:test-context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', async () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: undefined,
            key: undefined
        }, {})
        await tbService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')

        global.browser.config = { mochaOpts: { bail: 1 } }
        global.browser.sessionId = 'sessionId'

        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        tbService.failures = 2
        await tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('after: with multi-remote: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, { chromeA: {}, chromeB: {}, chromeC: {} })

        global.browser.isMultiremote = true
        global.browser.sessionId = 'sessionId'
        tbService.failures = 2
        await tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionChromeA', 2, false, 'chromeA')
        expect(updateJobSpy).toBeCalledWith('sessionChromeB', 2, false, 'chromeB')
        expect(updateJobSpy).toBeCalledWith('sessionChromeC', 2, false, 'chromeC')
    })

    it('onReload: updatedJob not called', async () => {
        const tbService = new TestingBotService()
        const tbService2 = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService2, 'updateJob')
        tbService.beforeSession({
            user: undefined,
            key: undefined
        }, {})

        global.browser.sessionId = 'sessionId'
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
    })

    it('onReload: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        global.browser.sessionId = 'sessionId'
        tbService.failures = 2
        await tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)
        expect(got.put).toHaveBeenCalled()
    })

    it('onReload with multi-remote: updatedJob called with passed params', async () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        global.browser.isMultiremote = true
        global.browser.sessionId = 'sessionId'
        tbService.failures = 2
        await tbService.onReload('oldSessionId', 'sessionChromeA')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true, 'chromeA')
        expect(got.put).toHaveBeenCalled()
    })

    it('getRestUrl', () => {
        const tbService = new TestingBotService()
        expect(tbService.getRestUrl('testSessionId'))
            .toEqual('https://api.testingbot.com/v1/tests/testSessionId')
    })

    it('getBody', () => {
        const tbService = new TestingBotService()
        tbService.beforeSession({}, {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        })

        tbService.beforeSuite({ title: 'Suite title' })

        expect(tbService.getBody(0, false)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '1',
                tags: ['tag1', 'tag2']
            }
        })

        tbService.testCnt = 2
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
        const tbService = new TestingBotService()
        tbService.beforeSession({}, {
            name: 'Test suite',
            tags: ['tag3', 'tag4'],
            public: true,
            build: 344
        })

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
        const service = new TestingBotService()
        service.beforeSession({ user: 'foobar', key: '123' }, {})
        service.suiteTitle = 'my test'

        await service.updateJob('12345', 23, true)

        expect(service.failures).toBe(0)
        expect(got.put).toHaveBeenCalled()
        expect(got.put.mock.calls[0][1].username).toBe('foobar')
        expect(got.put.mock.calls[0][1].password).toBe('123')
    })

    it('updateJob failure', async () => {
        const response = new Error('Failure')
        response.statusCode = 500
        got.put.mockReturnValue(Promise.reject(response))

        const service = new TestingBotService()
        service.beforeSession({ user: 'foobar', key: '123' }, {})
        service.suiteTitle = 'my test'
        const err = await service.updateJob('12345', 23, true).catch((err) => err)
        expect(err.message).toBe('Failure')

        expect(got.put).toHaveBeenCalled()
        expect(service.failures).toBe(0)
    })

    it('afterSuite', () => {
        const service = new TestingBotService()
        expect(service.failures).toBe(0)
        service.afterSuite({})
        expect(service.failures).toBe(0)
        service.afterSuite({ error: new Error('boom!') })
        expect(service.failures).toBe(1)
    })
})
