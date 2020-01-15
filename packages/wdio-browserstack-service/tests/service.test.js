import BrowserstackService from '../src/service'
import got from 'got'
import logger from '@wdio/logger'

const log = logger('test')
let service

beforeEach(() => {
    log.info.mockClear()
    got.mockClear()
    got.put.mockClear()
    got.mockReturnValue(Promise.resolve({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    }))
    got.put.mockReturnValue(Promise.resolve({}))

    global.browser = {
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Sierra',
            browserName: 'chrome'
        }
    }
    global.browser.sessionId = 12
    service = new BrowserstackService({}, [], { user: 'foo', key: 'bar' })
})

it('should initialize correctly', () => {
    service = new BrowserstackService({}, [], {})
    expect(service.failures).toEqual(0)
})

describe('onReload()', () => {
    it('should update and get session', async () => {
        await service.onReload(1, 2)
        expect(got.put).toHaveBeenCalled()
        expect(got).toHaveBeenCalled()
    })

    it('should reset failures', async () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.failures = 1
        await service.onReload(1, 2)
        expect(updateSpy).toHaveBeenCalled()
        expect(service.failures).toEqual(0)
    })
})

describe('beforeSession', () => {
    it('should set some default to make missing user and key parameter apparent', () => {
        service.beforeSession({})
        expect(service.config).toEqual({ user: 'NotSetUser', key: 'NotSetKey' })
    })

    it('should set username default to make missing user parameter apparent', () => {
        service.beforeSession({ user: 'foo' })
        expect(service.config).toEqual({ user: 'foo', key: 'NotSetKey' })
    })

    it('should set key default to make missing key parameter apparent', () => {
        service.beforeSession({ key: 'bar' })
        expect(service.config).toEqual({ user: 'NotSetUser', key: 'bar' })
    })
})

describe('_printSessionURL', () => {
    it('should get and log session details', async () => {
        const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)

        service.sessionId = 'session123'
        await service._printSessionURL()
        expect(got).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session123.json',
            { auth: 'foo:bar', responseType: 'json' })
        expect(logInfoSpy).toHaveBeenCalled()
        expect(logInfoSpy).toHaveBeenCalledWith(
            'OS X Sierra chrome session: https://www.browserstack.com/automate/builds/1/sessions/2'
        )
    })
})

describe('_printSessionURL Appium', () => {
    beforeEach(() => {
        got.mockReturnValue(Promise.resolve({
            body: {
                automation_session: {
                    name: 'Smoke Test',
                    duration: 65,
                    os: 'ios',
                    os_version: '12.1',
                    browser_version: 'app',
                    browser: null,
                    device: 'iPhone XS',
                    status: 'failed',
                    reason: 'CLIENT_STOPPED_SESSION',
                    browser_url: 'https://app-automate.browserstack.com/builds/1/sessions/2'
                }
            }
        }))

        global.browser.capabilities = {
            device: 'iPhone XS',
            os: 'iOS',
            os_version: '12.1',
            browserName: '',
        }
    })

    it('should get and log session details', async () => {
        await service._printSessionURL()
        expect(log.info).toHaveBeenCalled()
        expect(log.info).toHaveBeenCalledWith(
            'iPhone XS iOS 12.1 session: https://app-automate.browserstack.com/builds/1/sessions/2'
        )
    })
})

describe('before', () => {
    it('should set auth to default values if not provided', async () => {
        let service = new BrowserstackService({}, [{}], { capabilities: {} })

        service.beforeSession({})
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failures).toEqual(0)
        expect(service.config.user).toEqual('NotSetUser')
        expect(service.config.key).toEqual('NotSetKey')

        service = new BrowserstackService({}, [{}], { capabilities: {} })
        service.beforeSession({ user: 'blah' })
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failures).toEqual(0)

        expect(service.config.user).toEqual('blah')
        expect(service.config.key).toEqual('NotSetKey')
        service = new BrowserstackService({}, [{}], { capabilities: {} })
        service.beforeSession({ key: 'blah' })
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failures).toEqual(0)
        expect(service.config.user).toEqual('NotSetUser')
        expect(service.config.key).toEqual('blah')
    })

    it('should initialize correctly', () => {
        const service = new BrowserstackService({}, [{}], {
            user: 'foo',
            key: 'bar',
            capabilities: {}
        })
        service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failures).toEqual(0)
        expect(service.sessionBaseUrl).toEqual('https://api.browserstack.com/automate/sessions')
    })

    it('should initialize correctly for appium', () => {
        global.browser.capabilities = {
            device: 'iPhone XS',
            os: 'iOS',
            os_version: '12.1',
            browserName: '',
        }
        const service = new BrowserstackService({}, [{
            app: 'test-app'
        }], {
            user: 'foo',
            key: 'bar',
            capabilities: {
                app: 'test-app'
            }
        })
        service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failures).toEqual(0)
        expect(service.sessionBaseUrl).toEqual('https://api-cloud.browserstack.com/app-automate/sessions')
    })

    it('should log the url', async () => {
        const service = new BrowserstackService({}, [{}], { capabilities: {} })

        await service.before()
        expect(log.info).toHaveBeenCalled()
        expect(log.info).toHaveBeenCalledWith(
            'OS X Sierra chrome session: https://www.browserstack.com/automate/builds/1/sessions/2')
    })
})

describe('afterSuite', () => {
    it('should increment failures on fails', () => {
        service.failures = 0

        service.afterSuite({})
        expect(service.failures).toBe(0)

        service.afterSuite({ error: new Error('foobar') })
        expect(service.failures).toBe(1)
    })
})

describe('afterTest', () => {
    it('should increment failures on fails', () => {
        service.failures = 0
        service.fullTitle = ''
        service.failReason = ''

        service.afterTest({ passed: false, parent: 'foo', title: 'bar', error: { message: 'error message' } })
        expect(service.failures).toBe(1)
        expect(service.fullTitle).toBe('foo - bar')
        expect(service.failReason).toBe('error message')
    })

    it('should not increment failures on passes', () => {
        service.failures = 0
        service.fullTitle = ''
        service.failReason = ''

        service.afterTest({ passed: true, parent: 'foo', title: 'bar' })
        expect(service.failures).toBe(0)
        expect(service.fullTitle).toBe('foo - bar')
    })
})

describe('afterScenario', () => {
    it('should increment failures on "failed"', () => {
        const uri = '/some/uri'
        service.failures = 0

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
})

describe('after', () => {
    it('should call _update', async () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.sessionId = 'session123'
        await service.after()

        const json = {
            name: undefined,
            reason: undefined,
            status: 'completed',
        }
        expect(got.put).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session123.json',
            { json, auth: 'foo:bar' })
        expect(service.failures).toBe(0)
        expect(updateSpy).toHaveBeenCalled()
    })
})

describe('_getBody', () => {
    it('should return "error" if failures', () => {
        service.failures = 1
        service.failReason = 'error message'
        service.fullTitle = 'foo - bar'
        expect(service._getBody()).toEqual({ status: 'error', reason: 'error message', name: 'foo - bar' })
    })

    it('should return "completed" if no errors', () => {
        service.failures = 0
        service.fullTitle = 'foo - bar'

        expect(service._getBody()).toEqual({ status: 'completed', name: 'foo - bar', reason: undefined })
    })
})
