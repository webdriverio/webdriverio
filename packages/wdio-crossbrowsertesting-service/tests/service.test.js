import CrossBrowserTestingService from '../src/service'
import got from 'got'

got.put.mockReturnValue(Promise.resolve({ body: '{}' }))

const uri = 'some/uri'
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

describe('wdio-crossbrowsertesting-service', () => {
    const execute = jest.fn()

    beforeEach(() => {
        global.browser = {
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
        }
    })

    afterEach(() => {
        delete global.browser
        execute.mockReset()
        got.put.mockClear()
    })

    it('before', () => {
        const cbtService = new CrossBrowserTestingService()
        const capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, capabilities)

        expect(cbtService.capabilities).toEqual(capabilities)
        expect(cbtService.cbtUsername).toEqual('test')
        expect(cbtService.cbtAuthkey).toEqual('testy')
        expect(cbtService.testCnt).toEqual(0)
        expect(cbtService.failures).toEqual(0)
    })

    it('beforeSuite', () => {
        const cbtService = new CrossBrowserTestingService()
        const suiteTitle = 'Test Suite Title'
        cbtService.beforeSuite({ title: suiteTitle })

        expect(cbtService.suiteTitle).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
        const cbtService = new CrossBrowserTestingService()
        const test = {
            fullName: 'Test #1',
            parent: 'Test parent'
        }
        cbtService.cbtUsername = undefined
        cbtService.cbtAuthkey = undefined
        cbtService.suiteTitle = 'Test suite'
        cbtService.beforeTest(test)
        expect(cbtService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const cbtService = new CrossBrowserTestingService()
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})
        cbtService.beforeSuite({ title: 'Test suite' })
        cbtService.beforeTest(test)

        expect(cbtService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const cbtService = new CrossBrowserTestingService()
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})

        cbtService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' })
        cbtService.beforeTest(test)

        expect(cbtService.suiteTitle).toEqual('Test ')
    })

    it('afterSuite', ()=>{
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeSession({}, {})

        expect(cbtService.failures).toBe(0)

        cbtService.afterSuite({})
        expect(cbtService.failures).toBe(0)

        cbtService.afterSuite({ error: new Error('error') })
        expect(cbtService.failures).toBe(1)

    })

    it('afterTest: passed test', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0

        cbtService.afterTest({}, {}, { passed: true })
        expect(cbtService.failures).toEqual(0)
    })

    it('afterTest: failed test', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0

        cbtService.afterTest({}, {}, { passed: false })

        expect(cbtService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeFeature(uri, featureObject)
    })

    it('beforeFeature: execute called', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})
        cbtService.beforeFeature(uri, featureObject)

        expect(cbtService.suiteTitle).toEqual('Create a feature')
    })

    it('afterScenario: exception happened', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0

        expect(cbtService.failures).toBe(0)

        cbtService.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(cbtService.failures).toBe(0)

        cbtService.afterScenario(uri, {}, {}, { status: 'failed' })
        expect(cbtService.failures).toBe(1)

        cbtService.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(cbtService.failures).toBe(1)

        cbtService.afterScenario(uri, {}, {}, { status: 'failed' })
        expect(cbtService.failures).toBe(2)
    })

    it('after: updatedJob not called', async () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: undefined,
            key: undefined
        }, {})
        await cbtService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', async () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')

        global.browser.config = { mochaOpts: { bail: 1 } }
        global.browser.sessionId = 'test'

        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})

        cbtService.failures = 2
        await cbtService.after()

        expect(updateJobSpy).toBeCalledWith('test', 2)
    })

    test('after: with bail set', async () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeSession({ user: 'test', key: 'testy' }, {})
        cbtService.failures = 5
        cbtService.updateJob = jest.fn()

        global.browser.isMultiremote = false
        global.browser.sessionId = 'test'
        global.browser.config = { mochaOpts: { bail: 1 } }
        await cbtService.after(1)

        expect(cbtService.updateJob).toBeCalledWith('test', 1)
    })

    it('after: with multi-remote: updatedJob called with passed params', async () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, { chromeA: {}, chromeB: {}, chromeC: {} })

        global.browser.isMultiremote = true
        global.browser.sessionId = 'sessionId'
        cbtService.failures = 2
        await cbtService.after()

        expect(updateJobSpy).toBeCalledWith('sessionChromeA', 2, false, 'chromeA')
        expect(updateJobSpy).toBeCalledWith('sessionChromeB', 2, false, 'chromeB')
        expect(updateJobSpy).toBeCalledWith('sessionChromeC', 2, false, 'chromeC')
    })

    it('onReload: updatedJob not called', () => {
        const cbtService = new CrossBrowserTestingService()
        const cbtService2 = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService2, 'updateJob')
        cbtService.beforeSession({
            user: undefined,
            key: undefined
        }, {})

        global.browser.sessionId = 'sessionId'
        cbtService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
    })

    it('onReload: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})

        global.browser.sessionId = 'sessionId'
        cbtService.failures = 2
        cbtService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)

    })

    it('onReload with multi-remote: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})

        global.browser.isMultiremote = true
        global.browser.sessionId = 'sessionId'
        cbtService.failures = 2
        cbtService.onReload('oldSessionId', 'sessionChromeA')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true, 'chromeA')

    })

    it('getRestUrl', () => {
        const cbtService = new CrossBrowserTestingService()
        expect(cbtService.getRestUrl('testSessionId'))
            .toEqual('https://crossbrowsertesting.com/api/v3/selenium/testSessionId')
    })

    it('getBody', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeSession({}, {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        })

        cbtService.beforeSuite({ title: 'Suite title' })

        expect(cbtService.getBody(0, false)).toEqual({
            test: {
                build: 344,
                name: 'Test suite',
                public: true,
                success: '1',
                tags: ['tag1', 'tag2']
            }
        })

        cbtService.testCnt = 2
        global.browser.isMultiremote = true
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
        const cbtService = new CrossBrowserTestingService()
        cbtService.beforeSession({}, {
            name: 'Test suite',
            tags: ['tag3', 'tag4'],
            public: true,
            build: 344
        })

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
        const service = new CrossBrowserTestingService()
        service.beforeSession({ user: 'test', key: 'testy' }, {})
        service.suiteTitle = 'my test'

        await service.updateJob('12345', 23, true)
        expect(service.failures).toBe(0)
        expect(got.put).toHaveBeenCalled()
        expect(got.put.mock.calls[0][1].username).toBe('test')
        expect(got.put.mock.calls[0][1].password).toBe('testy')
    })

    it('updateJob failure', async () => {
        const response = new Error('Failure')
        response.statusCode = 500
        got.put.mockReturnValue(Promise.reject(response))

        const service = new CrossBrowserTestingService()
        service.beforeSession({ user: 'test', key: 'testy' }, {})
        service.suiteTitle = 'my test'
        const err = await service.updateJob('12345', 23, true).catch((err) => err)
        expect(err.message).toBe('Failure')

        expect(service.failures).toBe(0)
    })
})
