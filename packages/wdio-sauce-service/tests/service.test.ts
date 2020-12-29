import got from 'got'
import WebDriver from 'webdriver'

import SauceService from '../src'
import { isUnifiedPlatform } from '../src/utils'

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

let browser
beforeEach(() => {
    browser = {
        config: {},
        execute: jest.fn(),
        chromeA: { sessionId: 'sessionChromeA' },
        chromeB: { sessionId: 'sessionChromeB' },
        chromeC: { sessionId: 'sessionChromeC' },
        instances: ['chromeA', 'chromeB', 'chromeC'],
    }
})

test('constructor should set setJobNameInBeforeSuite', () => {
    let service = new SauceService({}, {}, {})
    service['_browser'] = browser
    expect(service['_options'].setJobNameInBeforeSuite).toBeFalsy()

    let options = {
        setJobNameInBeforeSuite: false
    }
    service = new SauceService(options, {}, {})
    service['_browser'] = browser
    expect(service['_options'].setJobNameInBeforeSuite).toBeFalsy()

    options = {
        setJobNameInBeforeSuite: true
    }
    service = new SauceService(options, {}, {})
    service['_browser'] = browser
    expect(service['_options'].setJobNameInBeforeSuite).toBeTruthy()
})

jest.mock('../src/utils', () => {
    return {
        isUnifiedPlatform: jest.fn().mockReturnValue(true),
    }
})

test('before should call isUnifiedPlatform', () => {
    const service = new SauceService({}, {}, {})
    service.before({}, [], browser)
    expect(isUnifiedPlatform).toBeCalledTimes(1)
})

test('beforeSuite', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    expect(service['_suiteTitle']).toBeUndefined()
    service.beforeSuite({ title: 'foobar' })
    expect(service['_suiteTitle']).toBe('foobar')
})

test('beforeSuite should set job-name', () => {
    const options = {
        setJobNameInBeforeSuite: true
    }
    const service = new SauceService(options, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service.beforeSuite({ title: 'foobar' })
    expect(browser.execute).toBeCalledWith('sauce:job-name=foobar')
})

test('beforeSession should set to unknown creds if no sauce user and key are found', () => {
    const config: WebdriverIO.Config = {}
    const service = new SauceService({}, {}, config)
    service['_browser'] = browser
    service.beforeSession()
    expect(config.user).toBe('unknown_user')
    expect(config.key).toBe('unknown_key')
})

test('beforeTest should set context for jasmine test', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    })
    expect(browser.execute).toBeCalledWith('sauce:context=my test can do something')
})

test('beforeTest should set context for mocha test', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service.beforeTest({
        parent: 'foo',
        title: 'bar'
    })
    expect(browser.execute).toBeCalledWith('sauce:context=foo - bar')
})

test('beforeTest should not set context for RDC test', () => {

    // not for RDC since sauce:context is not available there
    const rdcService = new SauceService({}, { testobject_api_key: 'foobar' }, {})
    rdcService['_browser'] = browser
    rdcService.beforeSession()
    rdcService.beforeTest({
        fullTitle: 'my test can do something'
    })
    expect(browser.execute).not.toBeCalled()
})

test('beforeTest should not set context if user does not use sauce', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()
    service.beforeTest({
        fullTitle: 'my test can do something'
    })
    expect(browser.execute).not.toBeCalled()
})

test('afterSuite', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterSuite({})
    expect(service['_failures']).toBe(0)

    service.afterSuite({ error: new Error('foobar') })
    expect(service['_failures']).toBe(1)
})

test('afterTest', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterTest({}, {}, { passed: true })
    expect(service['_failures']).toBe(0)

    service.afterTest({}, {}, { passed: false })
    expect(service['_failures']).toBe(1)

    service.afterTest({ _retriedTest: {} }, {}, { passed: true })
    expect(service['_failures']).toBe(0)

    service.afterTest({}, {}, { passed: false })
    expect(service['_failures']).toBe(1)
    service.afterTest({
        _retriedTest: {},
        _currentRetry: 1,
        _retries: 2
    }, {}, { passed: false })
    expect(service['_failures']).toBe(1)
    service.afterTest({
        _retriedTest: {},
        _currentRetry: 2,
        _retries: 2
    }, {}, { passed: false })
    expect(service['_failures']).toBe(2)
})

test('beforeFeature should set context', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service.beforeFeature( uri, featureObject)
    expect(browser.execute).toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('beforeFeature should not set context if RDC test', () => {
    const rdcService = new SauceService({}, { testobject_api_key: 'foobar' }, {})
    rdcService['_browser'] = browser
    rdcService.beforeSession()
    rdcService.beforeFeature(uri, featureObject)
    expect(browser.execute).not.toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('beforeFeature should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()
    service.beforeFeature(uri, featureObject)
    expect(browser.execute).not.toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('afterScenario', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterScenario(uri, {}, {}, { status: 'passed' })
    expect(service['_failures']).toBe(0)

    service.afterScenario(uri, {}, {}, { status: 'failed' })
    expect(service['_failures']).toBe(1)

    service.afterScenario(uri, {}, {}, { status: 'passed' })
    expect(service['_failures']).toBe(1)

    service.afterScenario(uri, {}, {}, { status: 'failed' })
    expect(service['_failures']).toBe(2)
})

test('beforeScenario should set context', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service.beforeScenario(uri, featureObject, { name: 'foobar' })
    expect(browser.execute).toBeCalledWith('sauce:context=Scenario: foobar')
})

test('beforeScenario should not set context if RDC test', () => {
    const rdcService = new SauceService({}, { testobject_api_key: 'foobar' }, {})
    rdcService['_browser'] = browser
    rdcService.beforeSession()
    rdcService.beforeScenario(uri, featureObject, { name: 'foobar' })
    expect(browser.execute).not.toBeCalledWith('sauce:context=Scenario: foobar')
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()
    service.beforeScenario(uri, featureObject, { name: 'foobar' })
    expect(browser.execute).not.toBeCalledWith('sauce:context=Scenario: foobar')
})

test('after', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.after({})

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('after for RDC', () => {
    const service = new SauceService({}, { testobject_api_key: '1' }, {})
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.after({})

    expect(service.updateJob).toBeCalledWith('foobar', 5)
})

test('after for UP', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    browser.capabilities = {}
    service.updateUP = jest.fn()
    service['_isServiceEnabled'] = true
    service['_isUP'] = true
    service['_failures'] = 5

    browser.isMultiremote = false
    service.after({})

    expect(service.updateUP).toBeCalledWith(5)
})

test('after for UP with multi remote', () => {
    const caps: WebdriverIO.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService(
        {},
        caps,
        { user: 'foobar', key: '123' }
    )
    service['_browser'] = browser
    service.beforeSession()
    browser.capabilities = {}
    service.updateUP = jest.fn()
    service['_isServiceEnabled'] = true
    service['_isUP'] = true
    service['_failures'] = 0

    browser.isMultiremote = true
    browser.sessionId = 'foobar'
    service.after({})

    expect(service.updateUP).toBeCalledTimes(3)
})

test('after with bail set', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    browser.config = { mochaOpts: { bail: 1 } }
    service.after(1)

    expect(service.updateJob).toBeCalledWith('foobar', 1)
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.after({})

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const caps: WebdriverIO.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService({}, caps, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = true
    browser.sessionId = 'foobar'
    service.after({})

    expect(service.updateJob).toBeCalledWith('sessionChromeA', 5, false, 'chromeA')
    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, false, 'chromeB')
    expect(service.updateJob).toBeCalledWith('sessionChromeC', 5, false, 'chromeC')
})

test('onReload', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
})

test('onReload with RDC', () => {
    const service = new SauceService({}, { testobject_api_key: '1' }, {})
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 0
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 0, true)
})

test('onReload should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = false
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const caps: WebdriverIO.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService({}, caps, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = true
    browser.sessionId = 'foobar'
    browser.chromeB.sessionId = 'newSessionChromeB'
    service.onReload('sessionChromeB', 'newSessionChromeB')

    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, true, 'chromeB')
})

test('updateJob for VMs', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' })
    service['_browser'] = browser
    service.beforeSession()
    service['_suiteTitle'] = 'my test'

    service.updateJob('12345', 23, true)

    const [reqUri, reqCall] = (got.put as jest.Mock).mock.calls[0]
    expect(reqUri).toBe('https://api.us-west-1.saucelabs.com/rest/v1/foobar/jobs/12345')
    expect(reqCall.json).toEqual({ name: 'my test (1)', passed: false })
    expect(service['_failures']).toBe(0)
})

test('updateJob for RDC', () => {
    const service = new SauceService({}, { testobject_api_key: '1' }, {})
    service['_browser'] = browser
    service.beforeSession()

    service.updateJob('12345', 23)

    const [reqUri, reqCall] = (got.put as jest.Mock).mock.calls[0]
    expect(reqUri).toBe('https://app.testobject.com/api/rest/v2/appium/session/12345/test')
    expect(reqCall.json).toEqual({ passed: false })
    expect(service['_failures']).toBe(0)
})

test('getBody', () => {
    const service = new SauceService({}, {
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    }, {})
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()

    expect(service.getBody(0)).toEqual({
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' },
        passed: true
    })

    service['_capabilities'] = {} as WebDriver.Capabilities
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
    browser.isMultiremote = true
    expect(service.getBody(12, true)).toEqual({
        name: 'jojo (2)',
        passed: false
    })

    expect(service.getBody(12, true, 'chrome')).toEqual({
        name: 'chrome: jojo (2)',
        passed: false
    })
})

test('getBody', () => {
    const service = new SauceService({},  {
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    }, {})
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()

    expect(service.getBody(0)).toEqual({
        name: 'jobname',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' },
        passed: true
    })

    service['_capabilities'] = {}
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
    browser.isMultiremote = true
    expect(service.getBody(12, true)).toEqual({
        name: 'jojo (2)',
        passed: false
    })

    expect(service.getBody(12, true, 'chrome')).toEqual({
        name: 'chrome: jojo (2)',
        passed: false
    })
})

test('getBody with name Capability (JSON WP)', () => {
    const service = new SauceService({}, {
        name: 'bizarre'
    }, {})
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()

    expect(service.getBody(1)).toEqual({
        name: 'bizarre',
        passed: false
    })

    expect(service.getBody(1, true)).toEqual({
        name: 'bizarre',
        passed: false
    })

    service.getBody(1, true)
    service.getBody(1, true)
    browser.isMultiremote = true
    expect(service.getBody(12, true)).toEqual({
        name: 'bizarre',
        passed: false
    })

    expect(service.getBody(12, true, 'chrome')).toEqual({
        name: 'bizarre',
        passed: false
    })
})

test('getBody with name Capability (W3C)', () => {
    const service = new SauceService({}, {
        'sauce:options': {
            name: 'bizarre'
        }
    }, {})
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()

    expect(service.getBody(1)).toEqual({
        name: 'bizarre',
        passed: false
    })

    expect(service.getBody(1, true)).toEqual({
        name: 'bizarre',
        passed: false
    })

    service.getBody(1, true)
    service.getBody(1, true)
    browser.isMultiremote = true
    expect(service.getBody(12, true)).toEqual({
        name: 'bizarre',
        passed: false
    })

    expect(service.getBody(12, true, 'chrome')).toEqual({
        name: 'bizarre',
        passed: false
    })
})

test('getBody without multiremote', () => {
    const service = new SauceService({}, {
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    }, {})
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()
    service['_testCnt'] = 3

    browser.isMultiremote = false
    expect(service.getBody(0, true)).toEqual({
        name: 'jojo (4)',
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' },
        passed: true
    })
})

test('updateUP should set job status to false', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.updateUP(1)
    expect(browser.execute).toBeCalledWith('sauce:job-result=false')
})

test('updateUP should set job status to false', () => {
    const service = new SauceService({}, {}, {})
    service['_browser'] = browser
    service.updateUP(0)
    expect(browser.execute).toBeCalledWith('sauce:job-result=true')
})

afterEach(() => {
    browser = undefined
    ;(got.put as jest.Mock).mockClear()
})
