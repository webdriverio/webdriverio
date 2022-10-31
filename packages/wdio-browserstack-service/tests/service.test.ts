import gotMock from 'got'
import logger from '@wdio/logger'
import type { Browser } from 'webdriverio'

import BrowserstackService from '../src/service'
import * as utils from '../src/util'

interface GotMock extends jest.Mock {
    put: jest.Mock
}

const got = gotMock as unknown as GotMock
const expect = global.expect as unknown as jest.Expect

const log = logger('test')
let service: BrowserstackService
let browser: Browser

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

beforeEach(() => {
    (log.info as jest.Mock).mockClear()
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

    browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Sierra',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        browserB: {},
        execute: jest.fn(),
    } as any as Browser
    service = new BrowserstackService({ testObservability: false }, [] as any, { user: 'foo', key: 'bar' } as any)
})

it('should initialize correctly', () => {
    service = new BrowserstackService({}, [] as any, {} as any)
    expect(service['_failReasons']).toEqual([])
})

describe('onReload()', () => {
    it('should update and get session', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        service['_browser'] = browser
        await service.onReload('1', '2')
        expect(updateSpy).toHaveBeenCalled()
        expect(got.put).toHaveBeenCalled()
        expect(got).toHaveBeenCalled()
        expect(isBrowserstackSessionSpy).toHaveBeenCalled()
    })

    it('should update and get multiremote session', async () => {
        // @ts-expect-error
        browser.isMultiremote = true
        service['_browser'] = browser
        const updateSpy = jest.spyOn(service, '_update')
        const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        await service.onReload('1', '2')
        expect(updateSpy).toHaveBeenCalled()
        expect(got.put).toHaveBeenCalled()
        expect(got).toHaveBeenCalled()
        expect(isBrowserstackSessionSpy).toHaveBeenCalled()
    })

    it('should reset failures', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        service['_browser'] = browser

        service['_failReasons'] = ['Custom Error: Button should be enabled', 'Expected something']
        await service.onReload('1', '2')
        expect(updateSpy).toHaveBeenCalledWith('1', {
            status: 'failed',
            reason: 'Custom Error: Button should be enabled' + '\n' + 'Expected something'
        })
        expect(service['_failReasons']).toEqual([])
    })

    it('should return if no browser object', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        service['_browser'] = undefined

        await service.onReload('1', '2')
        expect(updateSpy).toBeCalledTimes(0)
    })
})

describe('beforeSession', () => {
    it('should set some default to make missing user and key parameter apparent', () => {
        service.beforeSession({} as any)
        expect(service['_config']).toEqual({ user: 'NotSetUser', key: 'NotSetKey' })
    })

    it('should set username default to make missing user parameter apparent', () => {
        service.beforeSession({ user: 'foo' } as any)
        expect(service['_config']).toEqual({ user: 'foo', key: 'NotSetKey' })
    })

    it('should set key default to make missing key parameter apparent', () => {
        service.beforeSession({ key: 'bar' } as any)
        expect(service['_config']).toEqual({ user: 'NotSetUser', key: 'bar' })
    })
})

describe('_multiRemoteAction', () => {
    it('resolve if no browser object', () => {
        const tmpService = new BrowserstackService({ testObservability: false }, [] as any,
            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
        tmpService['_browser'] = undefined
        expect(tmpService._multiRemoteAction({} as any)).toEqual(Promise.resolve())
    })
})

describe('_update', () => {
    const tmpService = new BrowserstackService({ testObservability: false }, [] as any,
        { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)

    describe('should return if not a browserstack session', () => {
        const logDebugSpy = jest.spyOn(log, 'debug').mockImplementation((string) => string)
        const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockImplementation()
        isBrowserstackSessionSpy.mockReturnValue(false)
        const getCloudProviderSpy = jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')

        beforeEach(() => {
            logDebugSpy.mockClear()
            isBrowserstackSessionSpy.mockClear()
            getCloudProviderSpy.mockClear()
        })

        it('should resolve if not a browserstack session', () => {
            tmpService['_browser'] = undefined
            tmpService._update('sessionId', {})
            expect(isBrowserstackSessionSpy).toBeCalledTimes(0)
            expect(logDebugSpy).toBeCalledTimes(0)
        })

        afterEach(() => {
            logDebugSpy.mockClear()
            isBrowserstackSessionSpy.mockClear()
            getCloudProviderSpy.mockClear()
        })
    })
})

describe('_printSessionURL', () => {
    it('should get and log session details', async () => {
        browser.isMultiremote = false
        service['_browser'] = browser
        const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)
        const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        await service._printSessionURL()
        expect(got).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session123.json',
            { username: 'foo', password: 'bar', responseType: 'json' })
        expect(logInfoSpy).toHaveBeenCalled()
        expect(logInfoSpy).toHaveBeenCalledWith(
            'OS X Sierra chrome session: https://www.browserstack.com/automate/builds/1/sessions/2'
        )
        expect(isBrowserstackSessionSpy).toHaveBeenCalled()
    })

    it('should get and log multi remote session details', async () => {
        // @ts-expect-error
        browser.isMultiremote = true
        service['_browser'] = browser
        const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)
        const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        await service._printSessionURL()
        expect(got).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session456.json',
            { username: 'foo', password: 'bar', responseType: 'json' })
        expect(logInfoSpy).toHaveBeenCalled()
        expect(logInfoSpy).toHaveBeenCalledWith(
            'Windows 10 chrome session: https://www.browserstack.com/automate/builds/1/sessions/2'
        )
        expect(isBrowserstackSessionSpy).toHaveBeenCalled()
    })

    describe('if cant print', () => {
        describe('no browser object', () => {
            const logInfoSpy = jest.spyOn(log, 'info').mockImplementation((string) => string)
            const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)

            beforeEach(() => {
                logInfoSpy.mockClear()
                isBrowserstackSessionSpy.mockClear()
            })

            it('should resolve if not no browser object', async () => {
                service['_browser'] = undefined
                await service._printSessionURL()
                expect(isBrowserstackSessionSpy).toBeCalledTimes(0)
                expect(logInfoSpy).toBeCalledTimes(0)
            })

            afterEach(() => {
                logInfoSpy.mockClear()
                isBrowserstackSessionSpy.mockClear()
            })
        })
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

        browser.capabilities = {
            device: 'iPhone XS',
            os: 'iOS',
            os_version: '12.1',
            browserName: '',
        }
    })

    it('should get and log session details', async () => {
        service['_browser'] = browser
        await service._printSessionURL()
        expect(log.info).toHaveBeenCalled()
        expect(log.info).toHaveBeenCalledWith(
            'iPhone XS iOS 12.1 session: https://app-automate.browserstack.com/builds/1/sessions/2'
        )
    })
})

describe('before', () => {
    it('should set auth to default values if not provided', async () => {
        let service = new BrowserstackService({} as any, [{}] as any, { capabilities: {} })

        await service.beforeSession({} as any as any)
        await service.before(service['_config'], [], browser as Browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_config'].user).toEqual('NotSetUser')
        expect(service['_config'].key).toEqual('NotSetKey')

        service = new BrowserstackService({}, [{}] as any, { capabilities: {} })
        service.beforeSession({ user: 'blah' } as any as any)
        await service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])

        expect(service['_config'].user).toEqual('blah')
        expect(service['_config'].key).toEqual('NotSetKey')
        service = new BrowserstackService({}, [{}] as any, { capabilities: {} })
        service.beforeSession({ key: 'blah' } as any as any)
        await service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_config'].user).toEqual('NotSetUser')
        expect(service['_config'].key).toEqual('blah')
    })

    it('should initialize correctly', () => {
        const service = new BrowserstackService({}, [{}] as any, {
            user: 'foo',
            key: 'bar',
            capabilities: {}
        })
        service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_sessionBaseUrl']).toEqual('https://api.browserstack.com/automate/sessions')
    })

    it('should initialize correctly for multiremote', () => {
        const service = new BrowserstackService(
            {},
            [{}] as any,
            {
                user: 'foo',
                key: 'bar',
                capabilities: [{}]
            }
        )
        service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_sessionBaseUrl']).toEqual('https://api.browserstack.com/automate/sessions')
    })

    it('should initialize correctly for appium', () => {
        const service = new BrowserstackService(
            {},
            [{ app: 'test-app' }] as any,
            {
                user: 'foo',
                key: 'bar',
                capabilities: {
                    app: 'test-app'
                } as any
            }
        )
        browser.capabilities = {
            app: 'test-app',
            device: 'iPhone XS',
            os: 'iOS',
            os_version: '12.1',
            browserName: '',
        }
        service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_sessionBaseUrl']).toEqual('https://api-cloud.browserstack.com/app-automate/sessions')
    })

    it('should initialize correctly for appium without global browser capabilities', () => {
        const service = new BrowserstackService({}, {
            app: 'bs://BrowserStackMobileAppId'
        }, {
            user: 'foo',
            key: 'bar',
            capabilities: {
                app: 'test-app' as any
            }
        })
        service.before(service['_config'], [], browser)

        expect(service['_failReasons']).toEqual([])
        expect(service['_sessionBaseUrl']).toEqual('https://api-cloud.browserstack.com/app-automate/sessions')
    })

    it('should initialize correctly for appium if using valid W3C Webdriver capabilities', () => {
        const service = new BrowserstackService({}, {
            app: 'bs://BrowserStackMobileAppId'
        }, {
            user: 'foo',
            key: 'bar',
            capabilities: {
                ['appium:app']: 'test-app'
            }
        }, browser)
        service.before(service._config, [], browser)

        expect(service._failReasons).toEqual([])
        expect(service._sessionBaseUrl).toEqual('https://api-cloud.browserstack.com/app-automate/sessions')
    })

    it('should log the url', async () => {
        const service = new BrowserstackService({}, [{}] as any, { capabilities: {} })

        await service.before(service['_config'], [], browser)
        expect(log.info).toHaveBeenCalled()
        expect(log.info).toHaveBeenCalledWith(
            'OS X Sierra chrome session: https://www.browserstack.com/automate/builds/1/sessions/2')
    })
})

describe('afterTest', () => {
    it('should increment failure reasons on fails', () => {
        service.before(service['_config'], [], browser)
        service['_fullTitle'] = ''
        service.beforeSuite({ title: 'foo' } as any)
        service.afterTest(
            { title: 'foo', parent: 'bar' } as any,
            undefined as never,
            { error: { message: 'cool reason' }, result: 1, duration: 5, passed: false } as any)
        expect(service['_failReasons']).toContain('cool reason')

        service.afterTest(
            { title: 'foo2', parent: 'bar2' } as any,
            undefined as never,
            { error: { message: 'not so cool reason' }, result: 1, duration: 7, passed: false } as any)

        expect(service['_failReasons']).toHaveLength(2)
        expect(service['_failReasons']).toContain('cool reason')
        expect(service['_failReasons']).toContain('not so cool reason')

        service.afterTest(
            { title: 'foo3', parent: 'bar3' } as any,
            undefined as never,
            { error: undefined, result: 1, duration: 7, passed: false } as any)

        expect(service['_fullTitle']).toBe('bar3 - foo3')
        expect(service['_failReasons']).toHaveLength(3)
        expect(service['_failReasons']).toContain('cool reason')
        expect(service['_failReasons']).toContain('not so cool reason')
        expect(service['_failReasons']).toContain('Unknown Error')
    })

    it('should not increment failure reasons on passes', () => {
        service.before(service['_config'], [], browser)
        service.beforeSuite({ title: 'foo' } as any)
        service.afterTest(
            { title: 'foo', parent: 'bar' } as any,
            undefined as never,
            { error: { message: 'cool reason' }, result: 1, duration: 5, passed: true } as any)
        expect(service['_failReasons']).toEqual([])

        service.afterTest(
            { title: 'foo2', parent: 'bar2' } as any,
            undefined as never,
            { error: { message: 'not so cool reason' }, result: 1, duration: 5, passed: true } as any)

        expect(service['_fullTitle']).toBe('bar2 - foo2')
        expect(service['_failReasons']).toEqual([])
    })

    it('should set title for Mocha tests', () => {
        service.before(service['_config'], [], browser)
        service.beforeSuite({ title: 'foo' } as any)
        service.afterTest({ title: 'bar', parent: 'foo' } as any, undefined as never, {} as any)
        expect(service['_fullTitle']).toBe('foo - bar')
    })

    describe('Observability only', () => {
        const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
        const sendSpy = jest.spyOn(service, '_sendTestRunEvent').mockImplementation(() => { return [] })
        const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

        beforeEach(() => {
            sendSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })

        it('add hook data', async () => {
            service['_tests'] = {}
            await service.afterTest({ title: 'bar', parent: 'foo' } as any, undefined as never, {} as any)
            expect(service['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z' } })
            expect(sendSpy).toBeCalledTimes(1)
            expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        })

        it('update hook data', async () => {
            service['_tests'] = { 'test title': {} }
            await service.afterTest({ title: 'bar', parent: 'foo' } as any, undefined as never, {} as any)
            expect(service['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z' } })
            expect(sendSpy).toBeCalledTimes(1)
            expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        })

        afterAll(() => {
            sendSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })
    })

    describe('Jasmine only', () => {
        it('should set suite name of first test as title', () => {
            service.before(service['_config'], [], browser)
            service.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as any)
            service.afterTest({ fullName: 'foo bar baz', description: 'baz' } as any, undefined as never, {} as any)
            expect(service['_fullTitle']).toBe('foo bar')
        })

        it('should set parent suite name as title', () => {
            service.before(service['_config'], [], browser)
            service.beforeSuite({ title: 'Jasmine__TopLevel__Suite' } as any)
            service.afterTest({ fullName: 'foo bar baz', description: 'baz' } as any, undefined as never, {} as any)
            service.afterTest({ fullName: 'foo xyz', description: 'xyz' } as any, undefined as never, {} as any)
            expect(service['_fullTitle']).toBe('foo')
        })
    })
})

describe('afterScenario', () => {
    it('should increment failure reasons on non-passing statuses (strict mode off)', () => {
        service = new BrowserstackService({ testObservability: false }, [] as any,
            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)

        expect(service['_failReasons']).toEqual([])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual([])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'FAILED', message: 'I am Error, most likely' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'FAILED', message: 'I too am Error' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely', 'I too am Error'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'UNDEFINED', message: 'Step XYZ is undefined' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely', 'I too am Error', 'Step XYZ is undefined'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'AMBIGUOUS', message: 'Step XYZ2 is ambiguous' } })
        expect(service['_failReasons']).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario({ pickle: { name: 'Can do something' }, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'PENDING' } })
        expect(service['_failReasons']).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual([
            'I am Error, most likely',
            'I too am Error',
            'Step XYZ is undefined',
            'Step XYZ2 is ambiguous'])
    })

    it('should increment failure reasons on non-passing statuses (strict mode on)', () => {
        service = new BrowserstackService({ testObservability: false }, [] as any,
            { user: 'foo', key: 'bar', cucumberOpts: { strict: true }, capabilities: {} })

        expect(service['_failReasons']).toEqual([])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual([])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, message: 'I am Error, most likely', status: 'FAILED' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'FAILED', message: 'I too am Error' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely', 'I too am Error'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'UNDEFINED', message: 'Step XYZ is undefined' } })
        expect(service['_failReasons']).toEqual(['I am Error, most likely', 'I too am Error', 'Step XYZ is undefined'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'AMBIGUOUS', message: 'Step XYZ2 is ambiguous' } })
        expect(service['_failReasons']).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario({ pickle: { name: 'Can do something' }, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'PENDING' } })
        expect(service['_failReasons']).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous',
                'Some steps/hooks are pending for scenario "Can do something"'])

        service.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'SKIPPED' } })
        expect(service['_failReasons']).toEqual([
            'I am Error, most likely',
            'I too am Error',
            'Step XYZ is undefined',
            'Step XYZ2 is ambiguous',
            'Some steps/hooks are pending for scenario "Can do something"'])
    })

    describe('Observability only', () => {
        const tmpService = new BrowserstackService({ testObservability: true }, [] as any,
            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
        const sendSpy = jest.spyOn(tmpService, '_sendTestRunEventForCucumber').mockImplementation(() => Promise.resolve())

        it('send event called', async () => {
            await tmpService.afterScenario({ pickle: {}, result: { duration: { seconds: 0, nanos: 1000000 }, willBeRetried: false, status: 'PASSED' } })
            expect(sendSpy).toBeCalledTimes(1)
        })
    })
})

describe('after', () => {
    it('should call _update when session has no errors (exit code 0)', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        await service.before(service['_config'], [], browser)

        service['_failReasons'] = []
        service['_fullTitle'] = 'foo - bar'

        await service.after(0)

        expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId,
            {
                status: 'passed',
                name: 'foo - bar',
                reason: undefined
            })
        expect(got.put).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session123.json',
            { json: {
                status: 'passed',
                name: 'foo - bar',
                reason: undefined
            }, username: 'foo', password: 'bar' })
    })

    it('should call _update when session has errors (exit code 1)', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        await service.before(service['_config'], [], browser)

        service['_fullTitle'] = 'foo - bar'
        service['_failReasons'] = ['I am failure']
        await service.after(1)

        expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId,
            {
                status: 'failed',
                name: 'foo - bar',
                reason: 'I am failure'
            })
        expect(got.put).toHaveBeenCalledWith(
            'https://api.browserstack.com/automate/sessions/session123.json',
            { json: {
                status: 'failed',
                name: 'foo - bar',
                reason: 'I am failure'
            }, username: 'foo', password: 'bar' })
    })

    describe('Cucumber only', function () {
        it('should call _update with status "failed" if strict mode is "on" and all tests are pending', async () => {
            service = new BrowserstackService({ testObservability: false }, [] as any,
                { user: 'foo', key: 'bar', cucumberOpts: { strict: true } } as any)

            const updateSpy = jest.spyOn(service, '_update')

            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            await service.afterScenario({ pickle: { name: 'Can do something but pending 1' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something but pending 2' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something but pending 3' },  result: { status: 'PENDING' } })

            await service.after(1)

            expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1',
                reason: 'Some steps/hooks are pending for scenario "Can do something but pending 1"' + '\n' +
                        'Some steps/hooks are pending for scenario "Can do something but pending 2"' + '\n' +
                        'Some steps/hooks are pending for scenario "Can do something but pending 3"',
                status: 'failed',
            })
            expect(updateSpy).toHaveBeenCalled()
        })

        it('should call _update with status "passed" when strict mode is "off" and only passed and pending tests ran', async () => {
            service = new BrowserstackService({ testObservability: false }, [] as any,
                { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)

            const updateSpy = jest.spyOn(service, '_update')

            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            await service.afterScenario({ pickle: { name: 'Can do something' },  result: { status: 'PASSED' } })
            await service.afterScenario({ pickle: { name: 'Can do something' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something' },  result: { status: 'PASSED' } })

            await service.after(0)

            expect(updateSpy).toHaveBeenCalled()
            expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1',
                reason: undefined,
                status: 'passed',
            })
        })

        it('should call _update with status is "failed" when strict mode is "on" and only passed and pending tests ran', async () => {
            service = new BrowserstackService({ testObservability: false }, [] as any,
                { user: 'foo', key: 'bar', cucumberOpts: { strict: true } } as any)

            const updateSpy = jest.spyOn(service, '_update')

            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            await service.afterScenario({ pickle: { name: 'Can do something 1' },  result: { status: 'PASSED' } })
            await service.afterScenario({ pickle: { name: 'Can do something but pending' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something 2' },  result: { status: 'PASSED' } })

            await service.after(1)

            expect(updateSpy).toHaveBeenCalled()
            expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1',
                reason: 'Some steps/hooks are pending for scenario "Can do something but pending"',
                status: 'failed',
            })
        })

        it('should call _update with status "passed" when all tests are skipped', async () => {
            const updateSpy = jest.spyOn(service, '_update')

            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            await service.afterScenario({ pickle: { name: 'Can do something skipped 1' },  result: { status: 'SKIPPED' } })
            await service.afterScenario({ pickle: { name: 'Can do something skipped 2' },  result: { status: 'SKIPPED' } })
            await service.afterScenario({ pickle: { name: 'Can do something skipped 3' },  result: { status: 'SKIPPED' } })

            await service.after(0)

            expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1',
                reason: undefined,
                status: 'passed',
            })
        })

        it('should call _update with status "failed" when strict mode is "on" and only failed and pending tests ran', async () => {
            service = new BrowserstackService({ testObservability: false }, [] as any,
                { user: 'foo', key: 'bar', cucumberOpts: { strict: true } } as any)

            const updateSpy = jest.spyOn(service, '_update')
            const afterSpy = jest.spyOn(service, 'after')

            await service.beforeSession(service['_config'] as any)
            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1'
            })

            await service.afterScenario({ pickle: { name: 'Can do something failed 1' },  result: { message: 'I am error, hear me roar', status: 'FAILED' } })
            await service.afterScenario({ pickle: { name: 'Can do something but pending 2' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something but passed 3' },  result: { status: 'SKIPPED' } })

            await service.after(1)

            expect(updateSpy).toHaveBeenCalledTimes(2)
            expect(updateSpy).toHaveBeenLastCalledWith(
                service['_browser']?.sessionId, {
                    name: 'Feature1',
                    reason:
                        'I am error, hear me roar' +
                        '\n' +
                        'Some steps/hooks are pending for scenario "Can do something but pending 2"',
                    status: 'failed',
                })
            expect(afterSpy).toHaveBeenCalledTimes(1)
        })

        it('should call _update with status "failed" when strict mode is "off" and only failed and pending tests ran', async () => {
            const updateSpy = jest.spyOn(service, '_update')

            await service.beforeSession(service['_config'] as any)
            await service.before(service['_config'], [], browser)
            await service.beforeFeature(null, { name: 'Feature1' })

            expect(updateSpy).toHaveBeenCalledWith(service['_browser']?.sessionId, {
                name: 'Feature1'
            })

            await service.afterScenario({ pickle: { name: 'Can do something failed 1' },  result: { message: 'I am error, hear me roar', status: 'FAILED' } })
            await service.afterScenario({ pickle: { name: 'Can do something but pending 2' },  result: { status: 'PENDING' } })
            await service.afterScenario({ pickle: { name: 'Can do something but passed 3' },  result: { status: 'SKIPPED' } })

            await service.after(1)

            expect(updateSpy).toHaveBeenCalledTimes(2)
            expect(updateSpy).toHaveBeenLastCalledWith(
                service['_browser']?.sessionId, {
                    name: 'Feature1',
                    reason: 'I am error, hear me roar',
                    status: 'failed',
                }
            )
        })

        describe('preferScenarioName', () => {
            describe('enabled', () => {
                [
                    { status: 'FAILED', body: {
                        name: 'Can do something single',
                        reason: 'Unknown Error',
                        status: 'failed',
                    } }
                    /*, 5, 4, 0*/
                ].map(({ status, body }) =>
                    it(`should call _update /w status failed and name of Scenario when single "${status}" Scenario ran`, async () => {
                        service = new BrowserstackService({ testObservability: false, preferScenarioName : true }, [] as any,
                            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
                        service.before({}, [], browser)

                        const updateSpy = jest.spyOn(service, '_update')

                        await service.beforeFeature(null, { name: 'Feature1' })
                        await service.afterScenario({ pickle: { name: 'Can do something single' }, result: { status } })
                        await service.after(1)

                        expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, body)
                    })
                )

                it('should call _update /w status passed and name of Scenario when single "passed" Scenario ran', async () => {
                    service = new BrowserstackService({ testObservability: false, preferScenarioName : true }, [] as any,
                        { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
                    service.before({}, [], browser)

                    const updateSpy = jest.spyOn(service, '_update')

                    await service.beforeFeature(null, { name: 'Feature1' })

                    await service.afterScenario({ pickle: { name: 'Can do something single' }, result: { status: 'passed' } })

                    await service.after(0)

                    expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, {
                        name: 'Can do something single',
                        reason: undefined,
                        status: 'passed',
                    })
                })
            })

            describe('disabled', () => {
                ['FAILED', 'AMBIGUOUS', 'UNDEFINED', 'UNKNOWN'].map(status =>
                    it(`should call _update /w status failed and name of Feature when single "${status}" Scenario ran`, async () => {
                        service = new BrowserstackService({ testObservability: false, preferScenarioName : false }, [] as any,
                            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
                        service.before({}, [], browser)

                        const updateSpy = jest.spyOn(service, '_update')

                        await service.beforeFeature(null, { name: 'Feature1' })

                        await service.afterScenario({ pickle: { name: 'Can do something single' }, result: { status } })

                        await service.after(1)

                        expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, {
                            name: 'Feature1',
                            reason: 'Unknown Error',
                            status: 'failed',
                        })
                    })
                )

                it('should call _update /w status passed and name of Feature when single "passed" Scenario ran', async () => {
                    service = new BrowserstackService({ testObservability: false, preferScenarioName : false }, [] as any,
                        { user: 'foo', key: 'bar', cucumberOpts: { strict: false } } as any)
                    service.before({}, [], browser)

                    const updateSpy = jest.spyOn(service, '_update')

                    await service.beforeFeature(null, { name: 'Feature1' })

                    await service.afterScenario({
                        pickle: { name: 'Can do something single' },
                        result: { status: 'PASSED' }
                    })
                    await service.after(0)

                    expect(updateSpy).toHaveBeenLastCalledWith(service['_browser']?.sessionId, {
                        name: 'Feature1',
                        reason: undefined,
                        status: 'passed',
                    })
                })
            })
        })
    })

    describe('Observability only', function () {
        it('should call _update with status "failed" if strict mode is "on" and all tests are pending', async () => {
            service = new BrowserstackService({ testObservability: true } as any, [] as any,
                { user: 'foo', key: 'bar', cucumberOpts: { strict: true } } as any)

            service['_failReasons'] = []
            const updateSpy = jest.spyOn(service, '_updateJob')
            await service.after(1)

            expect(updateSpy).toHaveBeenCalled()
        })
    })
})

describe('_sendTestRunEvent', () => {
    describe('calls uploadEventData', () => {
        const service = new BrowserstackService({}, [{}] as any, { capabilities: {} })
        const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
        jest.spyOn(service, 'scopes').mockImplementation(() => { return [] })
        jest.spyOn(service, '_getHookType').mockReturnValue('BEFORE_EACH')
        const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
        jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        const test = {
            type: 'test',
            title: 'test title',
            body: 'test body',
            file: 'filename'
        }
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '' } }
        service['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }
        service['_hooks'] = { 'test title': ['hook_id'] }

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getUniqueIdentifierSpy.mockClear()
        })

        it('for passed', async () => {
            await service._sendTestRunEvent(test as any, 'TestRunFinished', {
                error: undefined,
                result: 'passed',
                passed: true,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: undefined,
                status: 'passed'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for failed', async () => {
            await service._sendTestRunEvent(test as any, 'TestRunFinished', {
                error: { message: 'some error' },
                result: 'failed',
                passed: false,
                duration: 10,
                retries: { limit: 0, attempts: 0 },
                exception: 'some error',
                status: 'failed'
            } as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for started', async () => {
            await service._sendTestRunEvent(test as any, 'TestRunStarted', {} as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for hooks', async () => {
            await service._sendTestRunEvent(test as any, 'HookRunStarted', {} as any)
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })
    })
})

describe('_sendTestRunEventForCucumber', () => {
    describe('calls uploadEventData', () => {
        const service = new BrowserstackService({}, [{}] as any, { capabilities: {} })
        const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        jest.spyOn(service, 'scopes').mockImplementation(() => { return [] })
        const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
        jest.spyOn(utils, 'getScenarioNameWithExamples').mockReturnValue('test title with examples')
        jest.spyOn(utils, 'getCloudProvider').mockImplementation( () => 'browserstack' )
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        service['_platformMeta'] = { caps: {},  sessionId: '', browserName: '', browserVersion: '', platformName: '', product: '' }

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getUniqueIdentifierForCucumberSpy.mockClear()
        })

        it('for passed', async () => {
            await service._sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'passed'
                }
            } as any, 'TestRunFinished')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for failed', async () => {
            await service._sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                },
                result: {
                    duration: { nanos: 10 },
                    retries: { limit: 0, attempts: 0 },
                    status: 'failed',
                    message: 'failure reason'
                }
            } as any, 'TestRunFinished')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })

        it('for started', async () => {
            await service._sendTestRunEventForCucumber({
                pickle: {
                    tags: []
                }
            } as any, 'TestRunStarted')
            expect(uploadEventDataSpy).toBeCalledTimes(1)
        })
    })
})

describe('beforeScenario', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    const sendSpy = jest.spyOn(service, '_sendTestRunEventForCucumber').mockImplementation()
    service['_tests'] = {}
    getUniqueIdentifierForCucumberSpy.mockClear()
    sendSpy.mockClear()

    it('_sendTestRunEventForCucumber called', () => {
        service.beforeScenario({
            pickle: {
                name: 'pickle-name'
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('beforeStep', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    jest.spyOn(service, 'scopes').mockImplementation(() => { return [] })

    beforeEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })

    it('update test data', () => {
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        service.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(service['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', started_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('add test data', () => {
        service['_tests'] = { }
        service.beforeStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any)
        expect(service['_tests']).toEqual({ 'test title': { steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', started_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    afterEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })
})

describe('afterStep', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    jest.spyOn(service, 'scopes').mockImplementation(() => { return [] })

    beforeEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })

    it('update test data - passed case', () => {
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' } } }
        service.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(service['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', text: 'this is step', keyword: 'Given', 'result': 'PASSED', duration: 10, failure: undefined, finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('update test data - step present', () => {
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id' }] } }
        service.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(service['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', 'result': 'PASSED', duration: 10, failure: undefined, finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    it('add test data', () => {
        service['_tests'] = { }
        service.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: true,
            duration: 10,
            error: undefined
        })
        expect(service['_tests']).toEqual({ 'test title': { steps: [] } })
    })

    it('failed case', () => {
        service['_tests'] = { 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id' }] } }
        service.afterStep({ id: 'step_id', text: 'this is step', keyword: 'Given' } as any, {} as any, {
            passed: false,
            duration: 10,
            error: 'this is a error'
        })
        expect(service['_tests']).toEqual({ 'test title': { uuid: 'uuid', startedAt: '', finishedAt: '', feature: { name: 'name', path: 'path' }, scenario: { name: 'name' }, steps: [{ id: 'step_id', 'result': 'FAILED', duration: 10, failure: 'this is a error', finished_at: '2020-01-01T00:00:00.000Z' }] } })
    })

    afterEach(() => {
        getUniqueIdentifierForCucumberSpy.mockClear()
    })
})

describe('_getHookType', () => {
    const service = new BrowserstackService({}, [{}] as any, { capabilities: {} })

    it('get hook type as string', () => {
        expect(service._getHookType('before each hook for test 1')).toEqual('BEFORE_EACH')
        expect(service._getHookType('after each hook for test 1')).toEqual('AFTER_EACH')
        expect(service._getHookType('before all hook for test 1')).toEqual('BEFORE_ALL')
        expect(service._getHookType('after all hook for test 1')).toEqual('AFTER_ALL')
        expect(service._getHookType('no hook test')).toEqual('unknown')
    })
})

describe('_attachHookData', () => {
    const service = new BrowserstackService({}, [{}] as any, { capabilities: {} })

    it('add hooks data in test', () => {
        service['_hooks'] = {}
        service._attachHookData({
            currentTest: {
                title: 'test',
                parent: {
                    title: 'parent'
                }
            }
        } as any, 'hook_id')
        expect(service['_hooks']).toEqual({ 'parent - test': ['hook_id'] })
    })

    it('push hooks data in test', () => {
        service['_hooks'] = { 'parent - test': ['hook_id_old'] }
        service._attachHookData({
            currentTest: {
                title: 'test',
                parent: {
                    title: 'parent'
                }
            }
        } as any, 'hook_id')
        expect(service['_hooks']).toEqual({ 'parent - test': ['hook_id_old', 'hook_id'] })
    })
})

describe('requestHandler', () => {
    const service = new BrowserstackService({} as any, [{}] as any, { capabilities: {} })
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
    const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
    service['_tests'] = { 'test title': { uuid: 'uuid' } }

    beforeEach(() => {
        uploadEventDataSpy.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('for mocha', () => {
        service.requestHandler({
            url: {
                host: 'host',
                pathname: 'path',
            },
            method: 'post',
            headers: {
                all: jest.fn().mockReturnValue({})
            }
        } as any, {
            status: '200',
            body: 'json body'
        } as any, {
            nopickle: 'no-pickle'
        })
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(0)
        expect(uploadEventDataSpy).toBeCalledTimes(1)
    })

    it('for cucumber', () => {
        service.requestHandler({
            url: {
                host: 'host',
                pathname: 'path',
            },
            method: 'post',
            headers: {
                all: jest.fn().mockReturnValue({})
            }
        } as any, {
            status: '200',
            body: 'json body'
        } as any, {
            pickle: 'pickle'
        })
        expect(getUniqueIdentifierSpy).toBeCalledTimes(0)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(1)
        expect(uploadEventDataSpy).toBeCalledTimes(1)
    })

    it('hostname handling', () => {
        service.requestHandler({
            url: {
                hostname: 'host',
                pathname: 'path',
            },
            method: 'post',
            headers: {
                all: jest.fn().mockReturnValue({})
            }
        } as any, {
            status: '200',
            body: 'json body'
        } as any, {
            nopickle: 'no-pickle'
        })
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(0)
        expect(uploadEventDataSpy).toBeCalledTimes(1)
    })

    it('hostname and path not present', () => {
        service.requestHandler({
            method: 'post',
            headers: {
                all: jest.fn().mockReturnValue({})
            }
        } as any, {
            status: '200',
            body: 'json body'
        } as any, {
            nopickle: 'no-pickle'
        })
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(0)
        expect(uploadEventDataSpy).toBeCalledTimes(1)
    })
})

describe('scopes', () => {
    const service = new BrowserstackService({} as any, [{}] as any, { capabilities: {} })

    it('return array of scopes when context present', () => {
        expect(service.scopes({
            ctx: {
                test: {
                    parent: {
                        title: 'test 2',
                        parent: {
                            title: 'test 1'
                        }
                    }
                }
            }
        } as any)).toEqual(['test 1', 'test 2'])
    })

    it('return empty array when no context present', () => {
        expect(service.scopes({} as any)).toEqual([])
    })
})

describe('beforeTest', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const sendSpy = jest.spyOn(service, '_sendTestRunEvent').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

    service['_tests'] = {}
    service['_hooks'] = {
        'test title': ['hook_id']
    }
    sendSpy.mockClear()
    getUniqueIdentifierSpy.mockClear()

    it('update test data', async () => {
        await service.beforeTest({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(service['_tests']).toEqual({ 'test title': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z', finishedAt: null, } })
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('beforeHook', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const sendSpy = jest.spyOn(service, '_sendTestRunEvent').mockImplementation(() => { return [] })
    const attachHookDataSpy = jest.spyOn(service, '_attachHookData').mockImplementation(() => { return [] })

    service['_tests'] = {}
    service['_framework'] = 'mocha'
    sendSpy.mockClear()
    attachHookDataSpy.mockClear()

    it('update hook data', async () => {
        await service.beforeHook({ parent: 'parent', title: 'test' } as any, {} as any)
        expect(service['_tests']).toEqual({ 'parent - test': { uuid: '123456789', startedAt: '2020-01-01T00:00:00.000Z', finishedAt: null, } })
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('afterHook', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const sendSpy = jest.spyOn(service, '_sendTestRunEvent').mockImplementation(() => { return [] })
    const attachHookDataSpy = jest.spyOn(service, '_attachHookData').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')

    service['_framework'] = 'mocha'

    beforeEach(() => {
        sendSpy.mockClear()
        attachHookDataSpy.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('add hook data', async () => {
        service['_tests'] = {}
        await service.afterHook({ parent: 'parent', title: 'test' } as any, {} as any, {} as any)
        expect(service['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(sendSpy).toBeCalledTimes(1)
    })

    it('update hook data', async () => {
        service['_tests'] = { 'test title': {} }
        await service.afterHook({ parent: 'parent', title: 'test' } as any, {} as any, {} as any)
        expect(service['_tests']).toEqual({ 'test title': { finishedAt: '2020-01-01T00:00:00.000Z', } })
        expect(sendSpy).toBeCalledTimes(1)
    })
})

describe('afterCommand', () => {
    const service = new BrowserstackService({ testObservability: true } as any, [{}] as any, { capabilities: {} })
    const uploadEventData = jest.spyOn(utils, 'uploadEventData').mockImplementation(() => { return [] })
    const getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')
    const getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')

    service['_tests'] = {
        'test title': {
            uuid: 'uuid'
        }
    }

    beforeEach( () => {
        uploadEventData.mockClear()
        getUniqueIdentifierForCucumberSpy.mockClear()
        getUniqueIdentifierSpy.mockClear()
    })

    it('send screenshot log - mocha', async () => {
        service['_currentTest'] = {
            'no-pickle': ''
        }
        await service.afterCommand('takeScreenshot', [], '')
        expect(uploadEventData).toBeCalledTimes(1)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(0)
    })

    it('send screenshot log - cucumber', async () => {
        service['_currentTest'] = {
            pickle: ''
        }
        await service.afterCommand('takeScreenshot', [], '')
        expect(uploadEventData).toBeCalledTimes(1)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(0)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(1)
    })
})

describe('_updateCaps', () => {
    it('calls fn', () => {
        const fnSpy = jest.fn()
        service._updateCaps(fnSpy)
        expect(fnSpy).toBeCalledTimes(1)
    })

    it('calls fn - caps present', () => {
        const fnSpy = jest.fn()
        service['_caps'] = { capabilities: { browserName: 'chrome' } } as any
        service._updateCaps(fnSpy)
        expect(fnSpy).toBeCalledTimes(1)
    })
})
