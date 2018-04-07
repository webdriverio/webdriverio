jest.unmock('request')

import request from 'request'
import SauceService from '../src/sauce-launch-service'

describe('wdio-sauce-service', () => {
    const sauceService = new SauceService()
    const execute = jest.fn()
    global.browser = {
        execute,
        sessionId: 'globalSessionId',
        requestHandler: {
            auth: {
                username: 'user',
                accessKey: 'pass'
            }
        }
    }

    afterEach(() => execute.mockReset())

    it('onPrepare: sauceConnect is undefined', () => {
        const config = {
            sauceConnect: undefined
        }

        sauceService.onPrepare(config)
        expect(sauceService.sauceConnectOpts).toBeUndefined()
        expect(sauceService.sauceConnect).toBeUndefined()
        expect(config.protocol).toBeUndefined()
        expect(config.host).toBeUndefined()
        expect(config.port).toBeUndefined()
    })

    it('onPrepare', () => {
        const config = {
            sauceConnect: {},
            sauceConnectOpts: {
                options: 'some options'
            },
            user: 'user',
            key: 'key'
        }

        sauceService.onPrepare(config)
        expect(sauceService.sauceConnectOpts).toEqual({ accessKey: 'key', username: 'user', options: 'some options' })
        expect(config.protocol).toEqual('http')
        expect(config.host).toEqual('localhost')
        expect(config.port).toEqual(4445)
    })

    it('onComplete', () => {
        sauceService.sauceConnectProcess = {
            close: resolve => resolve('sauce connect closed')
        }

        return expect(sauceService.onComplete()).resolves.toEqual('sauce connect closed')
    })

    it('onComplete: no sauce connect', () => {
        sauceService.sauceConnectProcess = undefined
        expect(sauceService.onComplete()).toBeUndefined()
    })

    it('before', () => {
        const capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        sauceService.before(capabilities)

        expect(sauceService.sessionId).toEqual('globalSessionId')
        expect(sauceService.capabilities).toEqual(capabilities)
        expect(sauceService.auth).toEqual(global.browser.requestHandler.auth)
        expect(sauceService.sauceUser).toEqual(global.browser.requestHandler.auth.user)
        expect(sauceService.sauceKey).toEqual(global.browser.requestHandler.auth.pass)
        expect(sauceService.testCnt).toEqual(0)
        expect(sauceService.failures).toEqual(0)
    })

    it('beforeSuite', () => {
        const suiteTitle = 'Test Suite Title'
        sauceService.beforeSuite({ title: suiteTitle })

        expect(sauceService.suiteTitle).toEqual(suiteTitle)
    })

    it('beforeTest: execute not called', () => {
        const test = {
            fullName: 'Test #1',
            parent: 'Test parent'
        }
        sauceService.sauceUser = undefined
        sauceService.sauceKey = undefined
        sauceService.suiteTitle = 'Test suite'
        sauceService.beforeTest(test)

        expect(execute).not.toBeCalled()
        expect(sauceService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.suiteTitle = 'Test suite'
        sauceService.beforeTest(test)

        expect(execute).toBeCalledWith('sauce:context=Test parent - Test title')
        expect(sauceService.suiteTitle).toEqual('Test suite')
    })

    it('beforeTest: execute called', () => {
        const test = {
            name: 'Test name',
            fullName: 'Test #1',
            title: 'Test title',
            parent: 'Test parent'
        }
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.suiteTitle = 'Jasmine__TopLevel__Suite'
        sauceService.beforeTest(test)

        expect(execute).toBeCalledWith('sauce:context=Test parent - Test title')
        expect(sauceService.suiteTitle).toEqual('Test ')
    })

    it('afterTest: failed test', () => {
        sauceService.failures = 0
        const test = {
            passed: true
        }
        sauceService.afterTest(test)

        expect(sauceService.failures).toEqual(0)
    })

    it('afterTest: passed test', () => {
        sauceService.failures = 0
        const test = {
            passed: false
        }
        sauceService.afterTest(test)

        expect(sauceService.failures).toEqual(1)
    })

    it('beforeFeature: execute not called', () => {
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        sauceService.sauceUser = undefined
        sauceService.sauceKey = undefined
        sauceService.beforeFeature(feature)

        expect(execute).not.toBeCalled()
    })

    it('beforeFeature: execute called', () => {
        const feature = {
            name: 'Feature name',
            getName: () => 'Feature name'
        }
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.beforeFeature(feature)

        expect(sauceService.suiteTitle).toEqual('Feature name')
        expect(execute).toBeCalledWith('sauce:context=Feature: Feature name')
    })

    it('afterStep: exception happened', () => {
        sauceService.failures = 0
        const feature = {
            failureException: 'Unhandled error!'
        }
        sauceService.afterStep(feature)

        expect(sauceService.failures).toEqual(1)
    })

    it('afterStep: getFailureException func exists', () => {
        sauceService.failures = 0
        const feature = {
            getFailureException: () => 'Unhandled error!'
        }
        sauceService.afterStep(feature)

        expect(sauceService.failures).toEqual(1)
    })

    it('beforeScenario: execute not called', () => {
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = undefined
        sauceService.beforeScenario(scenario)

        expect(execute).not.toBeCalled()
    })

    it('beforeScenario: execute called', () => {
        const scenario = {
            name: 'Scenario name',
            getName: () => 'Scenario name'
        }
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.beforeScenario(scenario)

        expect(execute).toBeCalledWith('sauce:context=Scenario: Scenario name')
    })

    it('after: updatedJob not called', () => {
        const updateJobSpy = jest.spyOn(sauceService, 'updateJob')
        sauceService.sauceUser = undefined
        sauceService.sauceKey = undefined
        sauceService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', () => {
        const updateJobSpy = jest.spyOn(sauceService, 'updateJob')
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.sessionId = 'sessionId'
        sauceService.failures = 2
        sauceService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('onReload: updatedJob not called', () => {
        const sauceService2 = new SauceService()
        const updateJobSpy = jest.spyOn(sauceService2, 'updateJob')
        sauceService.sauceUser = undefined
        sauceService.sauceKey = undefined
        sauceService.sessionId = 'sessionId'
        sauceService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
        expect(sauceService.sessionId).not.toEqual('newSessionId')
    })

    it('onReload: updatedJob called with passed params', () => {
        const updateJobSpy = jest.spyOn(sauceService, 'updateJob')
        sauceService.sauceUser = 'user'
        sauceService.sauceKey = 'secret'
        sauceService.sessionId = 'sessionId'
        sauceService.failures = 2
        sauceService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).toBeCalledWith('oldSessionId', 2, true)
        expect(sauceService.sessionId).toEqual('newSessionId')
    })

    it('getSauceRestUrl', () => {
        expect(sauceService.getSauceRestUrl('testSessionId')).toEqual(`https://saucelabs.com/rest/v1/user/jobs/testSessionId`)
    })

    // TODO: rewrite test
    it.skip('updateJob: returns 401 error when no API key or/and API user set', () => {
        const putSpy = jest.spyOn(request, 'put')
        const updateJob = sauceService.updateJob('sessionId', 2, true)

        expect(putSpy).toBeCalled()
        return (expect(updateJob)).resolves
            .toEqual({ message: 'Not authorized' })
    })

    it('getBody', () => {
        sauceService.capabilities = {
            name: 'Test suite',
            tags: ['tag1', 'tag2'],
            public: true,
            build: 344
        }
        sauceService.suiteTitle = 'Suite title'

        expect(sauceService.getBody(0, false)).toEqual({
            build: 344,
            name: 'Test suite',
            public: true,
            passed: true,
            tags: ['tag1', 'tag2']
        })

        sauceService.testCnt = 2
        expect(sauceService.getBody(2, true)).toEqual({
            build: 344,
            name: 'Test suite',
            public: true,
            passed: false,
            tags: ['tag1', 'tag2']
        })
    })
})
