jest.unmock('request')

import request from 'request'
import TestingBotService from '../src/tb-launch-service'

describe('wdio-testingbot-service', () => {
    const tbService = new TestingBotService()
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

    it('onPrepare: tbTunnel is undefined', () => {
        const config = {
            tbTunnel: undefined
        }

        tbService.onPrepare(config)
        expect(tbService.tbTunnelOpts).toBeUndefined()
        expect(tbService.tunnel).toBeUndefined()
        expect(config.protocol).toBeUndefined()
        expect(config.host).toBeUndefined()
        expect(config.port).toBeUndefined()
    })

    it('onPrepare', () => {
        const config = {
            tbTunnel: {},
            tbTunnelOpts: {
                options: 'some options'
            },
            user: 'user',
            key: 'key'
        }

        tbService.onPrepare(config)
        expect(tbService.tbTunnelOpts).toEqual({ apiKey: 'user', apiSecret: 'key', options: 'some options' })
        expect(config.protocol).toEqual('http')
        expect(config.host).toEqual('localhost')
        expect(config.port).toEqual(4445)
    })

    it('onComplete', () => {
        tbService.tunnel = {
            close: resolve => resolve('tunnel closed')
        }

        return expect(tbService.onComplete()).resolves.toEqual('tunnel closed')
    })

    it('onComplete: no tunnel', () => {
        tbService.tunnel = undefined
        expect(tbService.onComplete()).toBeUndefined()
    })

    it('before', () => {
        const capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        tbService.before(capabilities)

        expect(tbService.sessionId).toEqual('globalSessionId')
        expect(tbService.capabilities).toEqual(capabilities)
        expect(tbService.auth).toEqual(global.browser.requestHandler.auth)
        expect(tbService.tbUser).toEqual(global.browser.requestHandler.auth.user)
        expect(tbService.tbSecret).toEqual(global.browser.requestHandler.auth.pass)
        expect(tbService.testCnt).toEqual(0)
        expect(tbService.failures).toEqual(0)
    })

    it('beforeSuite', () => {
        const suiteTitle = 'Test Suite Title'
        tbService.beforeSuite({ title: suiteTitle })

        expect(tbService.suiteTitle).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
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
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.suiteTitle = 'Test suite'
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
        expect(tbService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.suiteTitle = 'Jasmine__TopLevel__Suite'
        tbService.beforeTest(test)

        expect(execute).toBeCalledWith('tb:test-context=Test parent - Test title')
        expect(tbService.suiteTitle).toEqual('Test ')
    })

    it('afterTest: failed test', () => {
        tbService.failures = 0
        const test = {
            passed: true
        }
        tbService.afterTest(test)

        expect(tbService.failures).toEqual(0)
    })

    it('afterTest: passed test', () => {
        tbService.failures = 0
        const test = {
            passed: false
        }
        tbService.afterTest(test)

        expect(tbService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
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
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.beforeFeature(feature)

        expect(tbService.suiteTitle).toEqual('Feature name')
        expect(execute).toBeCalledWith('tb:test-context=Feature: Feature name')
    })

    it('afterStep: exception happened', () => {
        tbService.failures = 0
        const feature = {
            failureException: 'Unhandled error!'
        }
        tbService.afterStep(feature)

        expect(tbService.failures).toEqual(1)
    })

    it('afterStep: getFailureException func exists', () => {
        tbService.failures = 0
        const feature = {
            getFailureException: () => 'Unhandled error!'
        }
        tbService.afterStep(feature)

        expect(tbService.failures).toEqual(1)
    })

    it('beforeScenario: execute not called', () => {
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        tbService.tbUser = 'user'
        tbService.tbSecret = undefined
        tbService.beforeScenario(scenario)

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.beforeScenario(scenario)

        expect(execute).toBeCalledWith('tb:test-context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', () => {
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', () => {
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.sessionId = 'sessionId'
        tbService.failures = 2
        tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('onReload: updatedJob not called', () => {
        const tbService2 = new TestingBotService()
        const updateJobSpy = jest.spyOn(tbService2, 'updateJob')
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.sessionId = 'sessionId'
        tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
        expect(tbService.sessionId).not.toEqual('newSessionId')
    })

    it('onReload: updatedJob called with passed params', () => {
        const updateJobSpy = jest.spyOn(tbService, 'updateJob')
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.sessionId = 'sessionId'
        tbService.failures = 2
        tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)
        expect(tbService.sessionId).toEqual('newSessionId')
    })

    it('getRestUrl', () => {
        expect(tbService.getRestUrl('testSessionId')).toEqual(`https://api.testingbot.com/v1/tests/testSessionId`)
    })

    it('updateJob: returns 401 error when no API key or/and API user set', () => {
        const putSpy = jest.spyOn(request, 'put')
        const updateJob = tbService.updateJob('sessionId', 2, true)

        expect(putSpy).toBeCalled()
        return (expect(updateJob)).resolves
            .toEqual({ error: '401 Unauthorized. Please supply the correct API key and API secret' })
    })

    it('getBody', () => {
        tbService.capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        tbService.suiteTitle = 'Suite title'

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
