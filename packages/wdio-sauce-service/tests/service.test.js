import SauceService from '../src'

global.browser = {
    execute: jest.fn(),
    chromeA: { sessionId: 'sessionChromeA' },
    chromeB: { sessionId: 'sessionChromeB' },
    chromeC: { sessionId: 'sessionChromeC' },
    instances: ['chromeA', 'chromeB', 'chromeC']
}

jest.mock('request', () => ({
    put: jest.fn().mockImplementation((url, opts, cb) => cb(null, {}, { message: 'success' }))
}))

test('getSauceRestUrl', () => {
    const service = new SauceService({ user: 'foobar' })
    service.before()
    expect(service.getSauceRestUrl('12345'))
        .toBe('https://saucelabs.com/rest/v1/foobar/jobs/12345')

    const euService = new SauceService({ user: 'foobar', region: 'eu' })
    euService.before()
    expect(euService.getSauceRestUrl('12345'))
        .toBe('https://eu-central-1.saucelabs.com/rest/v1/foobar/jobs/12345')
})

test('beforeSuite', () => {
    const service = new SauceService({})
    expect(service.suiteTitle).toBeUndefined()
    service.beforeSuite({ title: 'foobar' })
    expect(service.suiteTitle).toBe('foobar')
})

test('beforeTest should set context for test', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()
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

test('beforeTest should not set context if user does not use sauce', () => {
    const service = new SauceService({})
    service.before()
    service.beforeTest({
        parent: 'my test',
        title: 'can do something'
    })
    expect(global.browser.execute).not.toBeCalled()
})

test('afterSuite', () => {
    const service = new SauceService({})
    service.before()

    expect(service.failures).toBe(0)

    service.afterSuite({})
    expect(service.failures).toBe(0)

    service.afterSuite({ error: new Error('foobar')})
    expect(service.failures).toBe(1)
})

test('afterTest', () => {
    const service = new SauceService({})
    service.before()

    expect(service.failures).toBe(0)

    service.afterTest({ passed: true })
    expect(service.failures).toBe(0)

    service.afterTest({ passed: false })
    expect(service.failures).toBe(1)
})

test('beforeFeature should set context', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()
    service.beforeFeature({ name: 'foobar' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Feature: foobar')
    service.beforeFeature({ getName: () => 'barfoo' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Feature: barfoo')
})

test('beforeFeature should not set context if no sauce user was applied', () => {
    const service = new SauceService({})
    service.before()
    service.beforeFeature({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalledWith('sauce:context=Feature: foobar')
})

test('afterStep', () => {
    const service = new SauceService({})
    service.before()

    expect(service.failures).toBe(0)

    service.afterStep({})
    expect(service.failures).toBe(0)

    service.afterStep({ failureException: { what: 'ever' }})
    expect(service.failures).toBe(1)

    service.afterStep({ getFailureException: () => 'whatever' })
    expect(service.failures).toBe(2)

    service.afterStep({ status: 'failed' })
    expect(service.failures).toBe(3)
})

test('beforeScenario should set context', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()
    service.beforeScenario({ name: 'foobar' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Scenario: foobar')
    service.beforeScenario({ getName: () => 'barfoo' })
    expect(global.browser.execute).toBeCalledWith('sauce:context=Scenario: barfoo')
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService({})
    service.before()
    service.beforeScenario({ name: 'foobar' })
    expect(global.browser.execute).not.toBeCalledWith('sauce:context=Scenario: foobar')
})

test('after', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService({})
    service.before()
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before({ chromeA: {}, chromeB: {}, chromeC: {} })
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
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
})

test('onReload should not set context if no sauce user was applied', () => {
    const service = new SauceService({})
    service.before()
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before({ chromeA: {}, chromeB: {}, chromeC: {} })
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = true
    global.browser.sessionId = 'foobar'
    global.browser.chromeB.sessionId = 'newSessionChromeB'
    service.onReload('sessionChromeB', 'newSessionChromeB')

    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, true, 'chromeB')
})

test('updateJob', () => {
    const request = require('request')
    const service = new SauceService({ user: 'foobar', key: '123' })
    service.before()

    service.failures = 123
    service.getBody = jest.fn()

    service.updateJob('12345', 23, true)
    expect(service.getBody).toBeCalled()
    expect(service.failures).toBe(0)
    expect(request.put).toBeCalled()
})

test('getBody', () => {
    const service = new SauceService({})
    service.suiteTitle = 'jojo'
    service.before({
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

afterEach(() => {
    global.browser.execute.mockClear()
})
