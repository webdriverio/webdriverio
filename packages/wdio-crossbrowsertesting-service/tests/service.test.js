import CrossBrowserTestingService from '../src/service'

jest.mock('request', () => ({
    put: jest.fn(),
    get: jest.fn()
}))

describe('wdio-crossbrowsertesting-service', () => {
    const execute = jest.fn()
    global.browser = {
        execute,
        sessionId: 'globalSessionId',
        requestHandler: {
            auth: {
                user: 'test',
                pass: 'testy'
            }
        },
        chromeA: { sessionId: 'sessionChromeA' },
        chromeB: { sessionId: 'sessionChromeB' },
        chromeC: { sessionId: 'sessionChromeC' },
        instances: ['chromeA', 'chromeB', 'chromeC'],
    }

    afterEach(() => {
        global.browser.isMultiremote = false
        execute.mockReset()
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

        expect(execute).not.toBeCalled()
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

        expect(execute).toBeCalledWith('cbt:test-context=Test parent - Test title')
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

        expect(execute).toBeCalledWith('cbt:test-context=Test parent - Test title')
        expect(cbtService.suiteTitle).toEqual('Test ')
    })

    it('afterTest: failed test', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0
        const test = {
            passed: true
        }
        cbtService.afterTest(test)

        expect(cbtService.failures).toEqual(0)
    })

    it('afterTest: passed test', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0
        const test = {
            passed: false
        }
        cbtService.afterTest(test)

        expect(cbtService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const cbtService = new CrossBrowserTestingService()
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        cbtService.beforeFeature(feature)

        expect(execute).not.toBeCalled()
    })

    it('beforeFeature: execute called', () => {
        const cbtService = new CrossBrowserTestingService()
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})
        cbtService.beforeFeature(feature)

        expect(cbtService.suiteTitle).toEqual('Feature name')
        expect(execute).toBeCalledWith('cbt:test-context=Feature: Feature name')
    })

    it('afterStep: exception happened', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0
        const feature = {
            failureException: 'Unhandled error!'
        }
        cbtService.afterStep(feature)

        expect(cbtService.failures).toEqual(1)
    })

    it('afterStep: getFailureException func exists', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0
        const feature = {
            getFailureException: () => 'Unhandled error!'
        }
        cbtService.afterStep(feature)

        expect(cbtService.failures).toEqual(1)
    })

    it('afterStep: cucumber failure', () => {
        const cbtService = new CrossBrowserTestingService()
        cbtService.failures = 0
        const feature = {
            status: 'failed'
        }
        cbtService.afterStep(feature)

        expect(cbtService.failures).toEqual(1)
    })

    it('beforeScenario: execute not called', () => {
        const cbtService = new CrossBrowserTestingService()
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        cbtService.beforeSession({
            user: undefined,
            key: undefined
        }, {})
        cbtService.beforeScenario(scenario)

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const cbtService = new CrossBrowserTestingService()
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})
        cbtService.beforeScenario(scenario)

        expect(execute).toBeCalledWith('cbt:test-context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: undefined,
            key: undefined
        }, {})
        cbtService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')

        global.browser.config = { mochaOpts: { bail: 1 } }
        global.browser.sessionId = 'sessionId'

        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, {})

        cbtService.failures = 2
        cbtService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('after: with multi-remote: updatedJob called with passed params', () => {
        const cbtService = new CrossBrowserTestingService()
        const updateJobSpy = jest.spyOn(cbtService, 'updateJob')
        cbtService.beforeSession({
            user: 'test',
            key: 'testy'
        }, { chromeA: {}, chromeB: {}, chromeC: {} })

        global.browser.isMultiremote = true
        global.browser.sessionId = 'sessionId'
        cbtService.failures = 2
        cbtService.after()

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

})
