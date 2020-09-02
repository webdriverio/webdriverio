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
    expect(service.failReasons).toEqual([])
    expect(service.preferScenarioName).toEqual(false)
    expect(service.strict).toEqual(false)
})

describe('onReload()', () => {
    it('should update and get session', async () => {
        const updateSpy = jest.spyOn(service, '_update')
        await service.onReload(1, 2)
        expect(updateSpy).toHaveBeenCalled()
        expect(got.put).toHaveBeenCalled()
        expect(got).toHaveBeenCalled()
    })

    it('should reset failures', async () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.failReasons = ['Custom Error: Button should be enabled', 'Expected something']
        await service.onReload(1, 2)
        expect(updateSpy).toHaveBeenCalledWith(1, {
            status: 'failed',
            reason: 'Custom Error: Button should be enabled' + '\n' + 'Expected something'
        })
        expect(service.failReasons).toEqual([])
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
            { username: 'foo', password: 'bar', responseType: 'json' })
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

        await service.beforeSession({})
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failReasons).toEqual([])
        expect(service.config.user).toEqual('NotSetUser')
        expect(service.config.key).toEqual('NotSetKey')

        service = new BrowserstackService({}, [{}], { capabilities: {} })
        service.beforeSession({ user: 'blah' })
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failReasons).toEqual([])

        expect(service.config.user).toEqual('blah')
        expect(service.config.key).toEqual('NotSetKey')
        service = new BrowserstackService({}, [{}], { capabilities: {} })
        service.beforeSession({ key: 'blah' })
        await service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failReasons).toEqual([])
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
        expect(service.failReasons).toEqual([])
        expect(service.sessionBaseUrl).toEqual('https://api.browserstack.com/automate/sessions')
    })

    it('should initialize correctly for appium', () => {
        global.browser.capabilities = {
            app: 'test-app',
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
        expect(service.failReasons).toEqual([])
        expect(service.sessionBaseUrl).toEqual('https://api-cloud.browserstack.com/app-automate/sessions')
    })

    it('should initialize correctly for appium without global browser capabilities', () => {
        const service = new BrowserstackService({}, {
            app: 'bs://BrowserStackMobileAppId'
        }, {
            user: 'foo',
            key: 'bar',
            capabilities: {
                app: 'test-app'
            }
        })
        service.before()

        expect(service.sessionId).toEqual(12)
        expect(service.failReasons).toEqual([])
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

describe('afterTest', () => {
    it('should increment failure reasons on fails', () => {
        service.fullTitle = ''
        service.beforeSuite({ title: 'foo', })
        service.afterTest(
            { title: 'foo', parent: 'bar' },
            undefined,
            { error: { message: 'cool reason' }, result: 1, duration: 5, passed: false, undefined })
        expect(service.failReasons).toContain('cool reason')

        service.afterTest(
            { title: 'foo2', parent: 'bar2' },
            undefined,
            { error: { message: 'not so cool reason' }, result: 1, duration: 7, passed: false, undefined })

        expect(service.failReasons).toHaveLength(2)
        expect(service.failReasons).toContain('cool reason')
        expect(service.failReasons).toContain('not so cool reason')

        service.afterTest(
            { title: 'foo3', parent: 'bar3' },
            undefined,
            { error: undefined, result: 1, duration: 7, passed: false, undefined })

        expect(service.fullTitle).toBe('bar3 - foo3')
        expect(service.failReasons).toHaveLength(3)
        expect(service.failReasons).toContain('cool reason')
        expect(service.failReasons).toContain('not so cool reason')
        expect(service.failReasons).toContain('Unknown Error')
    })

    it('should not increment failure reasons on passes', () => {
        service.beforeSuite({ title: 'foo', })
        service.afterTest(
            { title: 'foo', parent: 'bar' },
            undefined,
            { error: { message: 'cool reason' }, result: 1, duration: 5, passed: true, undefined })
        expect(service.failReasons).toEqual([])

        service.afterTest(
            { title: 'foo2', parent: 'bar2' },
            undefined,
            { error: { message: 'not so cool reason' }, result: 1, duration: 5, passed: true, undefined })

        expect(service.fullTitle).toBe('bar2 - foo2')
        expect(service.failReasons).toEqual([])
    })

    it('should set title for Mocha tests', () => {
        service.beforeSuite({ title: 'foo', })
        service.afterTest({ title: 'bar', parent: 'foo' }, undefined, {})
        expect(service.fullTitle).toBe('foo - bar')
    })
})

describe('afterScenario', () => {
    it('should increment failure reasons on non-passing statuses (strict mode off)', () => {
        const uri = '/some/uri'
        service = new BrowserstackService({}, [],
            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })

        expect(service.failReasons).toEqual([])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual([])

        service.afterScenario(uri, {}, {}, { exception: 'I am Error, most likely', status: 'failed' })
        expect(service.failReasons).toEqual(['I am Error, most likely'])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual(['I am Error, most likely'])

        service.afterScenario(uri, {}, {}, { exception: 'I too am Error', status: 'failed' })
        expect(service.failReasons).toEqual(['I am Error, most likely', 'I too am Error'])

        service.afterScenario(uri, {}, {}, { exception: 'Step XYZ is undefined', status: 'undefined' })
        expect(service.failReasons).toEqual(['I am Error, most likely', 'I too am Error', 'Step XYZ is undefined'])

        service.afterScenario(uri, {}, {}, { exception: 'Step XYZ2 is ambiguous', status: 'ambiguous' })
        expect(service.failReasons).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario(uri, {}, { name: 'Can do something' }, { status: 'pending' })
        expect(service.failReasons).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual([
            'I am Error, most likely',
            'I too am Error',
            'Step XYZ is undefined',
            'Step XYZ2 is ambiguous'])
    })

    it('should increment failure reasons on non-passing statuses (strict mode on)', () => {
        const uri = '/some/uri'
        service = new BrowserstackService({}, [],
            { user: 'foo', key: 'bar', cucumberOpts: { strict: true } })

        expect(service.failReasons).toEqual([])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual([])

        service.afterScenario(uri, {}, {}, { exception: 'I am Error, most likely', status: 'failed' })
        expect(service.failReasons).toEqual(['I am Error, most likely'])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual(['I am Error, most likely'])

        service.afterScenario(uri, {}, {}, { exception: 'I too am Error', status: 'failed' })
        expect(service.failReasons).toEqual(['I am Error, most likely', 'I too am Error'])

        service.afterScenario(uri, {}, {}, { exception: 'Step XYZ is undefined', status: 'undefined' })
        expect(service.failReasons).toEqual(['I am Error, most likely', 'I too am Error', 'Step XYZ is undefined'])

        service.afterScenario(uri, {}, {}, { exception: 'Step XYZ2 is ambiguous', status: 'ambiguous' })
        expect(service.failReasons).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous'])

        service.afterScenario(uri, {}, { name: 'Can do something' }, { status: 'pending' })
        expect(service.failReasons).toEqual(
            ['I am Error, most likely',
                'I too am Error',
                'Step XYZ is undefined',
                'Step XYZ2 is ambiguous',
                'Some steps/hooks are pending for scenario "Can do something"'])

        service.afterScenario(uri, {}, {}, { status: 'passed' })
        expect(service.failReasons).toEqual([
            'I am Error, most likely',
            'I too am Error',
            'Step XYZ is undefined',
            'Step XYZ2 is ambiguous',
            'Some steps/hooks are pending for scenario "Can do something"'])
    })
})

describe('after', () => {
    it('should call _update when session has no errors (exit code 0)', async () => {
        const updateSpy = jest.spyOn(service, '_update')

        service.sessionId = 'session123'
        service.failReasons = []
        service.fullTitle = 'foo - bar'

        await service.after(0)

        expect(updateSpy).toHaveBeenCalledWith(service.sessionId,
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

        service.sessionId = 'session123'
        service.fullTitle = 'foo - bar'
        service.failReasons = ['I am failure']
        await service.after(1)

        expect(updateSpy).toHaveBeenCalledWith(service.sessionId,
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
            service = new BrowserstackService({}, [],
                { user: 'foo', key: 'bar', cucumberOpts: { strict: true } })
            service.sessionId = 'session123'

            const updateSpy = jest.spyOn(service, '_update')

            await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

            await service.afterScenario({}, {},
                { name: 'Can do something but pending 1' }, { status: 'pending' })
            await service.afterScenario({}, {},
                { name: 'Can do something but pending 2' }, { status: 'pending' })
            await service.afterScenario({}, {},
                { name: 'Can do something but pending 3' }, { status: 'pending'  })

            await service.after(1)

            expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                name: 'Feature1',
                reason: 'Some steps/hooks are pending for scenario "Can do something but pending 1"' + '\n' +
                        'Some steps/hooks are pending for scenario "Can do something but pending 2"' + '\n' +
                        'Some steps/hooks are pending for scenario "Can do something but pending 3"',
                status: 'failed',
            })
            expect(updateSpy).toHaveBeenCalled()
        })

        it('should call _update with status "passed" when strict mode is "off" and only passed and pending tests ran',
            async () => {
                service = new BrowserstackService({}, [],
                    { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })
                service.sessionId = 'session123'

                const updateSpy = jest.spyOn(service, '_update')

                await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                await service.afterScenario({}, {},
                    { name: 'Can do something' }, { status: 'passed' })
                await service.afterScenario({}, {},
                    { name: 'Can do something' }, { status: 'pending' })
                await service.afterScenario({}, {},
                    { name: 'Can do something' }, { status: 'passed'  })

                await service.after(0)

                expect(updateSpy).toHaveBeenCalled()
                expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                    name: 'Feature1',
                    reason: undefined,
                    status: 'passed',
                })
            })

        it('should call _update with status is "failed" when strict mode is "on" and only passed and pending tests ran',
            async () => {
                service = new BrowserstackService({}, [],
                    { user: 'foo', key: 'bar', cucumberOpts: { strict: true } })
                service.sessionId = 'session123'

                const updateSpy = jest.spyOn(service, '_update')

                await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                await service.afterScenario({}, {},
                    { name: 'Can do something 1' }, { status: 'passed' })
                await service.afterScenario({}, {},
                    { name: 'Can do something but pending' }, { status: 'pending' })
                await service.afterScenario({}, {},
                    { name: 'Can do something 2' }, { status: 'passed'  })

                await service.after(1)

                expect(updateSpy).toHaveBeenCalled()
                expect(updateSpy).toHaveBeenCalledWith(service.sessionId, {
                    name: 'Feature1',
                    reason: 'Some steps/hooks are pending for scenario "Can do something but pending"',
                    status: 'failed',
                })
            })

        it('should call _update with status "passed" when all tests are skipped',
            async () => {
                const updateSpy = jest.spyOn(service, '_update')

                service.sessionId = 'session123'
                service.strict = true

                await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                await service.afterScenario({}, {},
                    { name: 'Can do something skipped 1' }, { status: 'skipped' })
                await service.afterScenario({}, {},
                    { name: 'Can do something skipped 2' }, { status: 'skipped' })
                await service.afterScenario({}, {},
                    { name: 'Can do something skipped 3' }, { status: 'skipped'  })

                await service.after(0)

                expect(updateSpy).toHaveBeenCalledWith(service.sessionId, {
                    name: 'Feature1',
                    reason: undefined,
                    status: 'passed',
                })
            })

        it('should call _update with status "failed" when strict mode is "on" and only failed and pending tests ran',
            async () => {
                service = new BrowserstackService({}, [],
                    { user: 'foo', key: 'bar', cucumberOpts: { strict: true } })
                service.sessionId = 'session123'

                const updateSpy = jest.spyOn(service, '_update')
                const afterSpy = jest.spyOn(service, 'after')

                await service.beforeSession(service.config)
                await service.before(service.config)
                await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                expect(updateSpy).toHaveBeenCalledWith(service.sessionId, {
                    name: 'Feature1'
                })

                await service.afterScenario({}, {},
                    { name: 'Can do something failed 1' }, { exception: 'I am error, hear me roar', status: 'failed' })
                await service.afterScenario({}, {},
                    { name: 'Can do something but pending 2' }, { status: 'pending' })
                await service.afterScenario({}, {},
                    { name: 'Can do something but passed 3' }, { status: 'passed' })

                await service.after(1)

                expect(updateSpy).toHaveBeenCalledTimes(2)
                expect(updateSpy).toHaveBeenLastCalledWith(
                    service.sessionId, {
                        name: 'Feature1',
                        reason:
                            'I am error, hear me roar' +
                            '\n' +
                            'Some steps/hooks are pending for scenario "Can do something but pending 2"',
                        status: 'failed',
                    })
                expect(afterSpy).toHaveBeenCalledTimes(1)
            })

        it('should call _update with status "failed" when strict mode is "off" and only failed and pending tests ran',
            async () => {
                const updateSpy = jest.spyOn(service, '_update')

                service.sessionId = 'session123'
                service.strict = false

                await service.beforeSession(service.config)
                await service.before(service.config)
                await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                expect(updateSpy).toHaveBeenCalledWith(service.sessionId, {
                    name: 'Feature1'
                })

                await service.afterScenario({}, {},
                    { name: 'Can do something failed 1' }, { exception: 'I am error, hear me roar', status: 'failed' })
                await service.afterScenario({}, {},
                    { name: 'Can do something but pending 2' }, { status: 'pending' })
                await service.afterScenario({}, {},
                    { name: 'Can do something but passed 3' }, { status: 'passed' })

                await service.after(1)

                expect(updateSpy).toHaveBeenCalledTimes(2)
                expect(updateSpy).toHaveBeenLastCalledWith(
                    service.sessionId, {
                        name: 'Feature1',
                        reason: 'I am error, hear me roar',
                        status: 'failed',
                    })
            })

        describe('preferScenarioName', () => {
            describe('enabled', () => {
                ['failed', 'ambiguous', 'undefined', 'unknown'].map(status =>
                    it(`should call _update /w status failed and name of Scenario when single "${status}" Scenario ran`,
                        async () => {
                            service = new BrowserstackService({ preferScenarioName : true }, [],
                                { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })
                            service.sessionId = 'session123'

                            const updateSpy = jest.spyOn(service, '_update')

                            await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                            await service.afterScenario({}, {},
                                { name: 'Can do something single' }, { status })

                            await service.after(1)

                            expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                                name: 'Can do something single',
                                reason: 'Unknown Error',
                                status: 'failed',
                            })
                        })
                )

                it('should call _update /w status passed and name of Scenario when single "passed" Scenario ran',
                    async () => {
                        service = new BrowserstackService({ preferScenarioName : true }, [],
                            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })
                        service.sessionId = 'session123'

                        const updateSpy = jest.spyOn(service, '_update')

                        await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                        await service.afterScenario({}, {},
                            { name: 'Can do something single' }, { status: 'passed' })

                        await service.after(0)

                        expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                            name: 'Can do something single',
                            reason: undefined,
                            status: 'passed',
                        })
                    })
            })
            describe('disabled', () => {

                ['failed', 'ambiguous', 'undefined', 'unknown'].map(status =>
                    it(`should call _update /w status failed and name of Feature when single "${status}" Scenario ran`,
                        async () => {
                            service = new BrowserstackService({ preferScenarioName : false }, [],
                                { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })
                            service.sessionId = 'session123'

                            const updateSpy = jest.spyOn(service, '_update')

                            await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                            await service.afterScenario({}, {},
                                { name: 'Can do something single' }, { status })

                            await service.after(1)

                            expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                                name: 'Feature1',
                                reason: 'Unknown Error',
                                status: 'failed',
                            })
                        })
                )

                it('should call _update /w status passed and name of Feature when single "passed" Scenario ran',
                    async () => {
                        service = new BrowserstackService({ preferScenarioName : false }, [],
                            { user: 'foo', key: 'bar', cucumberOpts: { strict: false } })
                        service.sessionId = 'session123'

                        const updateSpy = jest.spyOn(service, '_update')

                        await service.beforeFeature({}, { document: { feature: { name: 'Feature1' } } })

                        await service.afterScenario({}, {},
                            { name: 'Can do something single' }, { status: 'passed' })

                        await service.after(0)

                        expect(updateSpy).toHaveBeenLastCalledWith(service.sessionId, {
                            name: 'Feature1',
                            reason: undefined,
                            status: 'passed',
                        })
                    })

            })
        })
    })
})
