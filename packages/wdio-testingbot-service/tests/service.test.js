jest.unmock('request')
import TestingBotService from '../src/service'

describe('wdio-testingbot-service', () => {
    const execute = jest.fn()
    global.browser = {
        execute,
        sessionId: 'globalSessionId',
        requestHandler: {
            auth: {
                user: 'user',
                pass: 'pass'
            }
        }
    }

    afterEach(() => execute.mockReset())

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

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
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

        tbService.beforeSuite({ title: 'Jasmine__TopLevel__Suite' })
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
        expect(tbService.suiteTitle).toEqual('Test ')
    })

    it('afterTest: failed test', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const test = {
            passed: true
        }
        tbService.afterTest(test)

        expect(tbService.failures).toEqual(0)
    })

    it('afterTest: passed test', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const test = {
            passed: false
        }
        tbService.afterTest(test)

        expect(tbService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const tbService = new TestingBotService()
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.beforeFeature(feature)

        expect(execute).not.toBeCalled()
    })

    it('beforeFeature: execute called', () => {
        const tbService = new TestingBotService()
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})
        tbService.beforeFeature(feature)

        expect(tbService.suiteTitle).toEqual('Feature name')
        expect(execute).toBeCalledWith('tb:test-context=Feature: Feature name')
    })

    it('afterStep: exception happened', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const feature = {
            failureException: 'Unhandled error!'
        }
        tbService.afterStep(feature)

        expect(tbService.failures).toEqual(1)
    })

    it('afterStep: getFailureException func exists', () => {
        const tbService = new TestingBotService()
        tbService.failures = 0
        const feature = {
            getFailureException: () => 'Unhandled error!'
        }
        tbService.afterStep(feature)

        expect(tbService.failures).toEqual(1)
    })

    it('beforeScenario: execute not called', () => {
        const tbService = new TestingBotService()
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        tbService.beforeSession({
            user: 'user',
            key: undefined
        }, {})
        tbService.beforeScenario(scenario)

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const tbService = new TestingBotService()
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})
        tbService.beforeScenario(scenario)

        expect(execute).toBeCalledWith('tb:test-context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: undefined,
            key: undefined
        }, {})
        tbService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')

        global.browser.config = { mochaOpts: { bail: 1 } }
        global.browser.sessionId = 'sessionId'

        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        tbService.failures = 2
        tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('onReload: updatedJob not called', () => {
        const tbService = new TestingBotService()
        const tbService2 = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService2, 'updateJob')
        tbService.beforeSession({
            user: undefined,
            key: undefined
        }, {})

        global.browser.sessionId = 'sessionId'
        tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
    })

    it('onReload: updatedJob called with passed params', () => {
        const tbService = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.beforeSession({
            user: 'user',
            key: 'secret'
        }, {})

        global.browser.sessionId = 'sessionId'
        tbService.failures = 2
        tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)
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
})