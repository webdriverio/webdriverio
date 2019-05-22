import request from 'request'

import SauceService from '../src'

global.browser = {
    config: { },
    execute: jest.fn(),
    chromeA: { sessionId: 'sessionChromeA' },
    chromeB: { sessionId: 'sessionChromeB' },
    chromeC: { sessionId: 'sessionChromeC' },
    instances: ['chromeA', 'chromeB', 'chromeC'],
}

test('beforeSuite', () => {
    const service = new SauceService()
    expect(service.suiteTitle).toBeUndefined()
    service.beforeSuite({ title: 'foobar' })
    expect(service.suiteTitle).toBe('foobar')
})

test('beforeSession should set to unknown creds if no sauce user and key are found', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    expect(service.sauceUser).toBe('unknown_user')
    expect(service.sauceKey).toBe('unknown_key')

    // not for RDC tho
    const rdcService = new SauceService()
    rdcService.beforeSession({}, { testobject_api_key: 'foobar' })
    expect(rdcService.sauceUser).toBe(undefined)
    expect(rdcService.sauceKey).toBe(undefined)
})

test('beforeTest should set context for test', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.beforeTest({
        parent: 'my test',
        title: 'can do something'
    })
    expect(global.browser.execute).toBeCalledWith('sauce:context=my test - can do something')

    service.beforeTest({
        fullName: 'foobar',
        parent: 'Jasmine__TopLevel__Suite'
    })
    expect(global.browser.execute).toBeCalledWith('sauce:context=foobar')
})

test('beforeTest should not set context for RDC test', () => {

    // not for RDC since sauce:context is not available there
    const rdcService = new SauceService()
    rdcService.beforeSession({}, { testobject_api_key: 'foobar' })
    rdcService.beforeTest({
        parent: 'my test',
        title: 'can do something'
    })
    expect(global.browser.execute).not.toBeCalled()

    rdcService.beforeTest({
        fullName: 'foobar',
        parent: 'Jasmine__TopLevel__Suite'
    })
    expect(global.browser.execute).not.toBeCalled()
})

test('beforeTest should not set context if user does not use sauce', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    service.beforeTest({
        parent: 'my test',
        title: 'can do something'
    })
    expect(global.browser.execute).not.toBeCalled()
})

test('afterSuite', () => {
    const service = new SauceService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterSuite({})
    expect(service.failures).toBe(0)

    service.afterSuite({ error: new Error('foobar') })
    expect(service.failures).toBe(1)
})

test('afterTest', () => {
    const service = new SauceService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterTest({ passed: true })
    expect(service.failures).toBe(0)

    service.afterTest({ passed: false })
    expect(service.failures).toBe(1)
})

test('beforeFeature should set context', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.beforeFeature({ name: 'foobar' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Feature: foobar')
    service.beforeFeature({ getName: () => 'barfoo' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Feature: barfoo')
})

test('beforeFeature should set context if RDC test', () => {
    const rdcService = new SauceService()
    rdcService.beforeSession({}, { testobject_api_key: 'foobar' })
    rdcService.beforeFeature({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalled()
    rdcService.beforeFeature({ getName: () => 'barfoo' })
    expect(global.browser.execute).not.toBeCalled()
})

test('beforeFeature should not set context if no sauce user was applied', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    service.beforeFeature({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalledWith('sauce:context=Feature: foobar')
})

test('afterStep', () => {
    const service = new SauceService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterStep({})
    expect(service.failures).toBe(0)

    service.afterStep({ failureException: { what: 'ever' } })
    expect(service.failures).toBe(1)

    service.afterStep({ getFailureException: () => 'whatever' })
    expect(service.failures).toBe(2)

    service.afterStep({ status: 'failed' })
    expect(service.failures).toBe(3)
})

test('beforeScenario should set context', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.beforeScenario({ name: 'foobar' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Scenario: foobar')
    service.beforeScenario({ getName: () => 'barfoo' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Scenario: barfoo')
})

test('beforeScenario should not set context if RDC test', () => {
    const rdcService = new SauceService()
    rdcService.beforeSession({}, { testobject_api_key: 'foobar' })
    rdcService.beforeScenario({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalledWith('sauce:context=Scenario: foobar')
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    service.beforeScenario({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalledWith('sauce:context=Scenario: foobar')
})

test('after', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('after for RDC', () => {
    const service = new SauceService()
    service.beforeSession({}, { testobject_api_key: 1 })
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('after with bail set', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    global.browser.config = { mochaOpts: { bail: 1 } }
    service.after(1)

    expect(service.updateJob).toBeCalledWith('foobar', 1)
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const service = new SauceService()
    service.beforeSession(
        { user: 'foobar', key: '123' },
        { chromeA: {}, chromeB: {}, chromeC: {} }
    )
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = true
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith('sessionChromeA', 5, false, 'chromeA')
    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, false, 'chromeB')
    expect(service.updateJob).toBeCalledWith('sessionChromeC', 5, false, 'chromeC')
})

test('onReload', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
})

test('onReload with RDC', () => {
    const service = new SauceService()
    service.beforeSession({}, { testobject_api_key: 1 })
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
})

test('onReload should not set context if no sauce user was applied', () => {
    const service = new SauceService()
    service.beforeSession({}, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const service = new SauceService()
    service.beforeSession(
        { user: 'foobar', key: '123' },
        { chromeA: {}, chromeB: {}, chromeC: {} }
    )
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = true
    global.browser.sessionId = 'foobar'
    global.browser.chromeB.sessionId = 'newSessionChromeB'
    service.onReload('sessionChromeB', 'newSessionChromeB')

    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, true, 'chromeB')
})

test('updateJob for VMs', () => {
    const service = new SauceService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.suiteTitle = 'my test'

    service.updateJob('12345', 23, true)

    const reqCall = request.mock.calls[0][0]
    expect(reqCall.uri).toBe('https://saucelabs.com/rest/v1/foobar/jobs/12345')
    expect(reqCall.body).toEqual({ name: 'my test (1)', passed: false })
    expect(reqCall.auth).toEqual({ user: 'foobar', pass: '123' })
    expect(service.failures).toBe(0)
})

test('updateJob for RDC', () => {
    const service = new SauceService()
    service.beforeSession({}, { testobject_api_key: 1 })

    service.updateJob('12345', 23)
    const reqCall = request.mock.calls[0][0]
    expect(reqCall.uri).toBe('https://app.testobject.com/api/rest/v2/appium/session/12345/test')
    expect(reqCall.body).toEqual({ passed: false })
    expect(service.failures).toBe(0)
})

test('getBody', () => {
    const service = new SauceService()
    service.suiteTitle = 'jojo'
    service.beforeSession({}, {
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    })

    expect(service.getBody(0)).toEqual({
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' },
        passed: true
    })

    service.capabilities = {}
    expect(service.getBody(1)).toEqual({
        name: 'jojo',
        passed: false
    })

    expect(service.getBody(1, true)).toEqual({
        name: 'jojo (1)',
        passed: false
    })

    service.getBody(1, true)
    service.getBody(1, true)
    global.browser.isMultiremote = true
    expect(service.getBody(12, true)).toEqual({
        name: 'jojo (2)',
        passed: false
    })

    expect(service.getBody(12, true, 'chrome')).toEqual({
        name: 'chrome: jojo (2)',
        passed: false
    })
})

test('getBody without multiremote', () => {
    const service = new SauceService()
    service.suiteTitle = 'jojo'
    service.beforeSession({}, {
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    })
    service.testCnt = 3

    global.browser.isMultiremote = false
    expect(service.getBody(0, true)).toEqual({
        name: 'jojo (4)',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' },
        passed: true
    })
})

afterEach(() => {
    global.browser.execute.mockClear()
    request.mockClear()
})
