import TestingBotService from '../src/tb-launch-service'

describe('wdio-testingbot-service', () => {
    const tbService = new TestingBotService()
    const updateJobSpy = jest.spyOn(tbService, 'updateJob')
    const execute = jest.fn()
    global.browser = {
        execute
    }

    afterEach(() => updateJobSpy.mockReset())

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

    it('after: updatedJob not called', () => {
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.after()

        expect(updateJobSpy).not.toBeCalled()
    })

    it('after: updatedJob called with passed params', () => {
        tbService.tbUser = 'user'
        tbService.tbSecret = 'secret'
        tbService.sessionId = 'sessionId'
        tbService.failures = 2
        tbService.after()

        expect(updateJobSpy).toBeCalledWith('sessionId', 2)
    })

    it('onReload: updatedJob not called', () => {
        tbService.tbUser = undefined
        tbService.tbSecret = undefined
        tbService.sessionId = 'sessionId'
        tbService.onReload('oldSessionId', 'newSessionId')

        expect(updateJobSpy).not.toBeCalled()
        expect(tbService.sessionId).not.toEqual('newSessionId')
    })

    it('onReload: updatedJob called with passed params', () => {
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
})
