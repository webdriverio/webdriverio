import request from 'request'

import LambdaTestService from '../src'
const uri = '/some/uri'
global.browser = {
    config: {},
    execute: jest.fn(),
    chromeA: { sessionId: 'sessionChromeA' },
    chromeB: { sessionId: 'sessionChromeB' },
    chromeC: { sessionId: 'sessionChromeC' },
    instances: ['chromeA', 'chromeB', 'chromeC']
}
test('beforeSuite', () => {
    const service = new LambdaTestService()
    expect(service.suiteTitle).toBeUndefined()
    service.beforeSuite({ title: 'foobar' })
    expect(service.suiteTitle).toBe('foobar')
})

test('beforeSession should set to unknown creds if no lambdatest user and key are found', () => {
    const service = new LambdaTestService()
    const config = {}
    service.beforeSession(config, {})
    expect(service.isServiceEnabled).toBe(false)
})

test('afterSuite', () => {
    const service = new LambdaTestService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterSuite({})
    expect(service.failures).toBe(0)
})

test('beforeTest', () => {
    const service = new LambdaTestService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.beforeTest({
        fullName: 'foobar',
        parent: 'Jasmine__TopLevel__Suite'
    })
    expect(service.suiteTitle).toBeUndefined()
})

test('afterTest', () => {
    const service = new LambdaTestService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterTest({ passed: true })
    expect(service.failures).toBe(0)

    service.afterTest({ passed: false })
    expect(service.failures).toBe(1)
})

test('after', () => {
    const service = new LambdaTestService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('afterScenario', () => {
    const service = new LambdaTestService()
    service.beforeSession({}, {})

    expect(service.failures).toBe(0)

    service.afterScenario(uri, {}, {}, { status: 'passed' })
    expect(service.failures).toBe(0)

    service.afterScenario(uri, {}, {}, { status: 'failed' })
    expect(service.failures).toBe(1)

    service.afterScenario(uri, {}, {}, { status: 'passed' })
    expect(service.failures).toBe(1)

    service.afterScenario(uri, {}, {}, { status: 'failed' })
    expect(service.failures).toBe(2)
})

test('after with bail set', () => {
    const service = new LambdaTestService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    global.browser.config = { mochaOpts: { bail: 1 } }
    service.after(1)

    expect(service.updateJob).toBeCalledWith('foobar', 1)
})

test('after in multiremote', () => {
    const service = new LambdaTestService()
    service.beforeSession(
        { user: 'foobar', key: '123' },
        { chromeA: {}, chromeB: {}, chromeC: {} }
    )
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = true
    global.browser.sessionId = 'foobar'
    service.after()

    expect(service.updateJob).toBeCalledWith(
        'sessionChromeA',
        5,
        false,
        'chromeA'
    )
    expect(service.updateJob).toBeCalledWith(
        'sessionChromeB',
        5,
        false,
        'chromeB'
    )
    expect(service.updateJob).toBeCalledWith(
        'sessionChromeC',
        5,
        false,
        'chromeC'
    )
})

test('onReload', () => {
    const service = new LambdaTestService()
    service.beforeSession({ user: 'foobar', key: '123' }, {})
    service.failures = 5
    service.updateJob = jest.fn()

    global.browser.isMultiremote = false
    global.browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
})

test('after in multiremote', () => {
    const service = new LambdaTestService()
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

    expect(service.updateJob).toBeCalledWith(
        'sessionChromeB',
        5,
        true,
        'chromeB'
    )
})

afterEach(() => {
    global.browser.execute.mockClear()
    request.mockClear()
})