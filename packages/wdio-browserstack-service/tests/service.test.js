import BrowserstackService from '../src/service'
import request from 'request'
import logger from '@wdio/logger'

jest.mock('request', () => ({
    put: jest.fn(),
    get: jest.fn()
}))

const log = logger('test')
let service

beforeAll(() => {
    global.browser = {
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Sierra',
            browserName: 'chrome'
        }
    }
    global.browser.sessionId = 12
    service = new BrowserstackService({})
})

it('should initialize correctly', () => {
    service = new BrowserstackService({})
    expect(service.failures).toEqual(0)
})

describe('onReload()', () => {
    beforeAll(() => {
        request.get.mockImplementation((url, opts, cb) => cb(
            null,
            { statusCode: 200 },
            {
                automation_session: {
                    browser_url:
                        'https://www.browserstack.com/automate/builds/1/sessions/2'
                }
            }
        ))
        request.put.mockImplementation((url, opts, cb) => {
            cb(null, {statusCode: 200}, {})
        })
    })

    it('should update and get session', async () => {
        await service.onReload(1, 2)
        expect(request.put).toHaveBeenCalled()
        expect(request.get).toHaveBeenCalled()
    })

    it('should reset failures', async () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.failures = 1
        await service.onReload(1, 2)
        expect(updateSpy).toHaveBeenCalled()
        expect(service.failures).toEqual(0)
    })
})

describe('_printSessionURL', () => {
    beforeAll(() => {
        request.get.mockImplementation((url, opts, cb) => cb(
            null,
            { statusCode: 200 },
            {
                automation_session: {
                    name: 'Smoke Test',
                    duration: 65,
                    os: 'OS X',
                    os_version: 'Sierra',
                    browser_version: '61.0',
                    browser: 'chrome',
                    device: null,
                    status: 'failed',
                    reason: 'CLIENT_STOPPED_SESSION',
                    browser_url:
                        'https://www.browserstack.com/automate/builds/1/sessions/2'
                }
            }
        ))
    })
    it('should get and log session details', async () => {
        const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)

        await service._printSessionURL()
        expect(logInfoSpy).toHaveBeenCalled()
        expect(logInfoSpy).toHaveBeenCalledWith(
            'OS X Sierra chrome session: https://www.browserstack.com/automate/builds/1/sessions/2'
        )
    })

    it('should throw an error if it recieves a non 200 status code', () => {
        request.get.mockImplementationOnce((url, opts, cb) => cb(null,{statusCode: 404}, {}))

        expect(service._printSessionURL())
            .rejects.toThrow(Error('Bad response code: Expected (200), Received (404)!'))
    })

    it('should reject and throw an error if request receives an error', () => {
        const e = new Error(`I'm an error!`)
        request.get.mockImplementationOnce((url, opts, cb) => cb(e, {}, {}))
        expect(service._printSessionURL()).rejects.toThrow(e)
    })
})

describe('before', () => {
    beforeAll(() => {
        global.browser.sessionId = 12
    })

    it('should set auth to default values if not provided', () => {
        let beforeService = new BrowserstackService({})

        beforeService.before()

        expect(beforeService.sessionId).toEqual(12)
        expect(beforeService.failures).toEqual(0)
        expect(beforeService.auth).toEqual({
            user: 'NotSetUser',
            pass: 'NotSetKey'
        })

        beforeService = new BrowserstackService({ user: 'blah'})
        beforeService.before()

        expect(beforeService.sessionId).toEqual(12)
        expect(beforeService.failures).toEqual(0)
        expect(beforeService.auth).toEqual({
            user: 'blah',
            pass: 'NotSetKey'
        })
        beforeService = new BrowserstackService({ key: 'blah'})
        beforeService.before()

        expect(beforeService.sessionId).toEqual(12)
        expect(beforeService.failures).toEqual(0)
        expect(beforeService.auth).toEqual({
            user: 'NotSetUser',
            pass: 'blah'
        })
    })

    it('should initialize correctly', () => {
        const beforeService = new BrowserstackService({
            user: 'foo',
            key: 'bar'
        })
        beforeService.before()

        expect(beforeService.sessionId).toEqual(12)
        expect(beforeService.failures).toEqual(0)
        expect(beforeService.auth).toEqual({
            user: 'foo',
            pass: 'bar'
        })
    })

    it('should log the url', () => {
        const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)
        const beforeService = new BrowserstackService({})

        beforeService.before()
        expect(logInfoSpy).toHaveBeenCalled()
    })
})

describe('afterSuite', () => {
    it('should increment failures on fails', () => {
        service.failures = 0

        service.afterSuite({})
        expect(service.failures).toBe(0)

        service.afterSuite({ error: new Error('foobar')})
        expect(service.failures).toBe(1)
    })
})

describe('afterTest', () => {
    it('should increment failures on fails', () => {
        service.failures = 0

        service.afterTest({ passed: false })
        expect(service.failures).toBe(1)
    })

    it('should not increment failures on passes', () => {
        service.failures = 0

        service.afterTest({ passed: true })
        expect(service.failures).toBe(0)
    })
})

describe('afterStep', () => {
    it('should increment failures on "failed"', () => {
        service.failures = 0

        service.afterStep({})
        expect(service.failures).toBe(0)

        service.afterStep({ failureException: { what: 'ever' }})
        expect(service.failures).toBe(1)

        service.afterStep({ getFailureException: () => 'whatever' })
        expect(service.failures).toBe(2)

        service.afterStep({ status: 'failed' })
        expect(service.failures).toBe(3)
    })
})

describe('after', () => {
    it('should call _update', () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.after()
        expect(updateSpy).toHaveBeenCalled()
    })
})

describe('_getBody', () => {
    it('should return "error" if failures', () => {
        service.failures = 1
        expect(service._getBody()).toEqual({ status: 'error' })
    })

    it('should return "completed" if no errors', () => {
        service.failures = 0
        expect(service._getBody()).toEqual({ status: 'completed' })
    })
})
