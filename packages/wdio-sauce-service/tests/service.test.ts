import fs from 'fs'
import path from 'path'

import got from 'got'
import logger from '@wdio/logger'
import type { MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities, Options } from '@wdio/types'

import SauceService from '../src'
import { isRDC } from '../src/utils'

const log = logger('test')
const uri = '/some/uri'
const featureObject = {
    name: 'Create a feature'
}
const jasmineSuiteTitle = 'Jasmine__TopLevel__Suite'

jest.createMockFromModule('fs')
fs.createReadStream = jest.fn()
fs.promises.stat = jest.fn().mockReturnValue(Promise.resolve({ size: 123 }))
fs.promises.readdir = jest.fn().mockReturnValue(Promise.resolve([
    'wdio-0-0-browser.log',
    'wdio-0-0-driver.log',
    'wdio-0-0.log',
    'wdio-1-0-browser.log',
    'wdio-1-0-driver.log',
    'wdio-1-0.log',
    'wdio.log'
]))

jest.mock('form-data', () => jest.fn().mockReturnValue({
    append: jest.fn()
}))

jest.mock('../src/utils', () => {
    return {
        isRDC: jest.fn().mockReturnValue(false),
        ansiRegex: jest.requireActual('../src/utils').ansiRegex
    }
})

let browser: MultiRemoteBrowser<'async'>
beforeEach(() => {
    browser = {
        execute: jest.fn(),
        chromeA: { sessionId: 'sessionChromeA' },
        chromeB: { sessionId: 'sessionChromeB' },
        chromeC: { sessionId: 'sessionChromeC' },
        instances: ['chromeA', 'chromeB', 'chromeC'],
    } as any as MultiRemoteBrowser<'async'>
    ;(log.info as jest.Mock).mockClear()
    ;(log.error as jest.Mock).mockClear()
})

test('before should call isRDC', () => {
    const service = new SauceService({}, {}, {} as any)
    service.before({}, [], browser)
    expect(isRDC).toBeCalledTimes(1)
})

test('beforeSuite', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    expect(service['_suiteTitle']).toBeUndefined()
    service.beforeSuite({ title: 'foobar' } as any)
    expect(service['_suiteTitle']).toBe('foobar')
})

test('beforeSession should set to unknown creds if no sauce user and key are found', () => {
    const config: Options.Testrunner = { capabilities: [] }
    const service = new SauceService({}, {}, config)
    service['_browser'] = browser
    service.beforeSession()
    expect(config.user).toBe('unknown_user')
    expect(config.key).toBe('unknown_key')
})

test('beforeSuite should send request to set the job name as suite name', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    expect(service['_suiteTitle']).toBeUndefined()
    service.beforeSuite({ title: 'foobar' } as any)
    expect(service['_suiteTitle']).toBe('foobar')
    expect(service.setAnnotation).toBeCalledWith('sauce:job-name=foobar')
})

test('beforeSuite should not send request to set the job name as suite name for Jasmine tests', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    expect(service['_suiteTitle']).toBeUndefined()
    service.beforeSuite({ title: jasmineSuiteTitle } as any)
    expect(service['_suiteTitle']).toBe(jasmineSuiteTitle)
    expect(service.setAnnotation).not.toBeCalled()
})

test('beforeTest should send the job-name as suite name by default', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123', capabilities: {} })
    service['_browser'] = browser
    service['_suiteTitle'] = 'Suite Title'
    service.setAnnotation = jest.fn()
    expect(service['_isJobNameSet']).toBe(false)
    await service.beforeSuite({ title: 'foobar suite' } as any)
    expect(service['_isJobNameSet']).toBe(true)
    await service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    } as any)
    expect(service.setAnnotation).toBeCalledTimes(2)
    expect(service.setAnnotation).toBeCalledWith('sauce:job-name=foobar suite')
    expect(service.setAnnotation).toBeCalledWith('sauce:context=my test can do something')
})

test('beforeTest should mark job-name as set', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123', capabilities: {} })
    service['_browser'] = browser
    service['_suiteTitle'] = 'Suite Title'
    expect(service['_isJobNameSet']).toBe(false)
    await service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    } as any)
    expect(service['_isJobNameSet']).toBe(true)
})

test('beforeTest should set job-name via custom setJobName method', async () => {
    const service = new SauceService({
        setJobName: (config, caps, title) => {
            return `${config.region}-${(caps as any).browserName}-${title}`
        }
    }, {
        browserName: 'foobar'
    }, {
        user: 'foobar',
        key: '123',
        region: 'barfoo' as any
    } as any)
    service['_browser'] = browser
    service['_suiteTitle'] = 'Suite Title'
    service.setAnnotation = jest.fn()
    expect(service['_isJobNameSet']).toBe(false)
    await service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    } as any)
    expect(service['_isJobNameSet']).toBe(true)
    expect(service.setAnnotation).toBeCalledWith('sauce:job-name=barfoo-foobar-Suite Title')
})

test('beforeTest not should set job-name when it has already been set', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123', capabilities: {} })
    service['_browser'] = browser
    service['_suiteTitle'] = 'Suite Title'
    service['_isJobNameSet'] = true
    service.setAnnotation = jest.fn()
    expect(service['_isJobNameSet']).toBe(true)
    await service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    } as any)
    expect(service['_isJobNameSet']).toBe(true)
    expect(service.setAnnotation).not.toBeCalledWith('sauce:job-name=Suite Title')
})

test('beforeTest should set context for jasmine test', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeTest({
        fullName: 'my test can do something',
        description: 'foobar'
    } as any)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=my test can do something')
})

test('beforeTest should set context for mocha test', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeTest({
        parent: 'foo',
        title: 'bar'
    } as any)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=foo - bar')
})

test('beforeTest should not set context for RDC test', async () => {
    // not for RDC since sauce:context is not available there
    const upService = new SauceService({}, {}, {} as any)
    upService['_browser'] = browser
    upService['_isRDC'] = true
    upService['_isJobNameSet'] = true
    upService.setAnnotation = jest.fn()
    await upService.beforeTest({
        title: 'update up job name'
    } as any)
    expect(upService.setAnnotation).toBeCalledTimes(0)
})

test('beforeTest should not set context if user does not use sauce', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeTest({
        fullTitle: 'my test can do something'
    } as any)
    expect(service.setAnnotation).not.toBeCalled()
})

test('afterSuite', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterSuite({} as any)
    expect(service['_failures']).toBe(0)

    service.afterSuite({ error: new Error('foobar') } as any)
    expect(service['_failures']).toBe(1)
})

test('afterTest', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterTest({} as any, {}, { passed: true } as any)
    expect(service['_failures']).toBe(0)

    service.afterTest({} as any, {}, { passed: false } as any)
    expect(service['_failures']).toBe(1)

    service.afterTest({ _retriedTest: {} } as any, {}, { passed: true } as any)
    expect(service['_failures']).toBe(0)

    service.afterTest({} as any, {}, { passed: false } as any)
    expect(service['_failures']).toBe(1)
    service.afterTest({
        _retriedTest: {},
        _currentRetry: 1,
        _retries: 2
    } as any, {}, { passed: false } as any)
    expect(service['_failures']).toBe(1)
    service.afterTest({
        _retriedTest: {},
        _currentRetry: 2,
        _retries: 2
    } as any, {}, { passed: false } as any)
    expect(service['_failures']).toBe(2)
    const stack = 'Error: Expected true to equal false.\n' +
        '    at <Jasmine>\n' +
        '    at UserContext.<anonymous> (/Users/test/specs/example.spec.js:12:44)\n' +
        '    at UserContext.executeSync (/Users/node_modules/@wdio/sync/build/index.js:25:22)\n' +
        '    at /Users/node_modules/@wdio/sync/build/index.js:46:68'
    service['_isRDC'] = true
    service.afterTest({} as any, {}, {
        error: {
            matcherName: 'toEqual',
            message: 'Expected true to equal false.',
            stack,
            passed: false,
            expected: [false, 'LoginPage page was not shown'],
            actual: true
        }
    } as any)
    expect(service.setAnnotation).toBeCalledTimes(0)
    ;(service.setAnnotation as jest.Mock).mockClear()
    service['_isRDC'] = false
    service.afterTest({} as any, {}, {
        error: {
            matcherName: 'toEqual',
            message: 'Expected true to equal false.',
            stack,
            passed: false,
            expected: [false, 'LoginPage page was not shown'],
            actual: true
        }
    } as any)
    expect(service.setAnnotation).toBeCalledTimes(5)
    stack.split(/\r?\n/).forEach((line:string) => expect(service.setAnnotation).toBeCalledWith(`sauce:context=${line}`))
    ;(service.setAnnotation as jest.Mock).mockClear()
    const maxErrorStackLength = 3
    service['_maxErrorStackLength'] = maxErrorStackLength
    service.afterTest({} as any, {}, {
        error: {
            matcherName: 'toEqual',
            message: 'Expected true to equal false.',
            stack,
            passed: false,
            expected: [false, 'LoginPage page was not shown'],
            actual: true
        }
    } as any)
    expect(service.setAnnotation).toBeCalledTimes(maxErrorStackLength)
    stack.split(/\r?\n/)
        .slice(0, maxErrorStackLength)
        .forEach((line:string) => expect(service.setAnnotation).toBeCalledWith(`sauce:context=${line}`))
})

test('afterTest should not mark test as fail if pending was called in Jasmine', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_reportErrorLog'] = jest.fn()
    expect(service['_failures']).toBe(0)
    service.afterTest({} as any, {}, {
        retries: { attempts: 0, limit: 0 },
        error: '=> marked Pendingfoobar',
        result: undefined,
        duration: 0,
        passed: false,
    } as any)
    expect(service['_failures']).toBe(0)
})

test('beforeFeature should set job-name', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeFeature( uri, featureObject)
    expect(service.setAnnotation).toBeCalledWith('sauce:job-name=Create a feature')
})

test('beforeFeature should set context', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeFeature( uri, featureObject)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('beforeFeature should not set context if RDC test', async () => {
    const upService = new SauceService({}, {}, {} as any)
    upService['_browser'] = browser
    upService['_isRDC'] = true
    upService['_isServiceEnabled'] = true
    upService.setAnnotation = jest.fn()
    await upService.beforeFeature(uri, featureObject)
    expect(upService.setAnnotation).not.toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('beforeFeature should not set context if no sauce user was applied', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeFeature(uri, featureObject)
    expect(service.setAnnotation).not.toBeCalledWith('sauce:context=Feature: Create a feature')
})

test('afterScenario', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.beforeSession()

    expect(service['_failures']).toBe(0)

    service.afterScenario({} as any, { passed: true })
    expect(service['_failures']).toBe(0)

    service.afterScenario({} as any, { passed: false })
    expect(service['_failures']).toBe(1)

    service.afterScenario({} as any, { passed: true })
    expect(service['_failures']).toBe(1)

    service.afterScenario({} as any, { passed: false })
    expect(service['_failures']).toBe(2)
})

test('beforeScenario should set context', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    service.beforeScenario({ pickle: { name: 'foobar' } })
    expect(service.setAnnotation).toBeCalledWith('sauce:context=-Scenario: foobar')
})

test('beforeScenario should set context when no pickle name is provided', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    service.beforeScenario({ pickle: { } })
    expect(service.setAnnotation).toBeCalledWith('sauce:context=-Scenario: unknown scenario')
})

test('beforeScenario should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    service.beforeScenario({ pickle: { name: 'foobar' } })
    expect(service.setAnnotation).not.toBeCalledWith('sauce:context=-Scenario: foobar')
})

test('beforeStep should set context', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    const step = {
        id: '5',
        text: 'I am a step',
        astNodeIds: ['0'],
        keyword: 'Given ',
    }
    service['_browser'] = browser
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeStep(step)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=--Step: Given I am a step')
})

test('beforeStep should not set context for RDC', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service['_isRDC'] = true
    service['_isServiceEnabled'] = true
    const step = {
        id: '5',
        text: 'I am a step',
        astNodeIds: ['0'],
        keyword: 'Given ',
    }
    service.setAnnotation = jest.fn()
    service.beforeSession()
    await service.beforeStep(step)
    expect(service.setAnnotation).not.toBeCalledWith('sauce:context=--Step: Given I am a step')
})

test('after', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()
    service['_uploadLogs'] = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.after(1)

    expect(service.updateJob).toBeCalledWith('foobar', 5)
    expect(service['_uploadLogs']).toBeCalledWith('foobar')
})

test('after for RDC', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    browser.capabilities = {}
    service.setAnnotation = jest.fn()
    service['_isServiceEnabled'] = true
    service['_isRDC'] = true
    service['_failures'] = 5

    // @ts-expect-error
    browser.isMultiremote = false
    await service.after(1)

    expect(service.setAnnotation).toBeCalledWith('sauce:job-result=false')
})

test('after for RDC with multi remote', async () => {
    const caps: Capabilities.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService(
        {},
        caps,
        { user: 'foobar', key: '123' } as any
    )
    service['_browser'] = browser
    service.beforeSession()
    browser.capabilities = {}
    service['_isServiceEnabled'] = true
    service['_isRDC'] = true
    service['_failures'] = 0
    service['_uploadLogs'] = jest.fn()
    service.setAnnotation = jest.fn()
    ;(isRDC as jest.Mock).mockImplementation(() => true)

    browser.isMultiremote = true
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.after(123)

    expect(service.setAnnotation).toBeCalledTimes(3)
    expect(service.setAnnotation).toBeCalledWith('sauce:job-result=true')
    expect(service.setAnnotation).toBeCalledWith('sauce:job-result=true')
    expect(service.setAnnotation).toBeCalledWith('sauce:job-result=true')
    expect(service['_uploadLogs']).toBeCalledTimes(0)
    ;(isRDC as jest.Mock).mockImplementation(() => false)
})

test('_uploadLogs should not upload if option is not set in config', async () => {
    const service = new SauceService(
        { uploadLogs: false },
        {},
        { outputDir: '/foo/bar' } as any
    )
    await service['_uploadLogs']('123')
    expect((got as any as jest.Mock).mock.calls).toHaveLength(0)
})

test('_uploadLogs should upload', async () => {
    const service = new SauceService(
        {},
        {},
        { outputDir: '/foo/bar' } as any
    )
    const api = { uploadJobAssets: jest.fn().mockResolvedValue({}) }
    service['_api'] = api as any
    await service.beforeSession(null as never, null as never, null as never, '1-0')
    await service['_uploadLogs']('123')
    expect(api.uploadJobAssets).toBeCalledTimes(1)
    expect(api.uploadJobAssets.mock.calls[0][1].files).toHaveLength(3)
    expect(api.uploadJobAssets.mock.calls[0][1].files).toContain(path.sep + path.join('foo', 'bar', 'wdio-1-0-browser.log'))
    expect(api.uploadJobAssets.mock.calls[0][1].files).toContain(path.sep + path.join('foo', 'bar', 'wdio-1-0-driver.log'))
    expect(api.uploadJobAssets.mock.calls[0][1].files).toContain(path.sep + path.join('foo', 'bar', 'wdio-1-0.log'))
})

test('_uploadLogs should not fail in case of a platform error', async () => {
    const service = new SauceService(
        {},
        {},
        { outputDir: '/foo/bar' } as any
    )
    ;(got as any as jest.Mock).mockRejectedValueOnce(new Error('upps'))
    expect(log.error).toHaveBeenCalledTimes(0)
    await service['_uploadLogs']('123')
    expect(log.error).toHaveBeenCalledTimes(1)
})

test('after with bail set', async () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123', mochaOpts: { bail: 1 } } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.after(1)

    expect(service.updateJob).toBeCalledWith('foobar', 1)
})

test('beforeScenario should not set context if no sauce user was applied', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.after(1)

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', async () => {
    const caps: Capabilities.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService({}, caps, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = true
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.after(1)

    expect(service.updateJob).toBeCalledWith('sessionChromeA', 5, false, 'chromeA')
    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, false, 'chromeB')
    expect(service.updateJob).toBeCalledWith('sessionChromeC', 5, false, 'chromeC')
})

test('onReload', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 5, true)
    expect(log.info).toHaveBeenCalledTimes(1)
    expect(log.info).toHaveBeenCalledWith('Update (reloaded) job with sessionId oldbar, status: failing')
})

test('onReload without failures', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 0
    service.updateJob = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).toBeCalledWith('oldbar', 0, true)
    expect(log.info).toHaveBeenCalledTimes(1)
    expect(log.info).toHaveBeenCalledWith('Update (reloaded) job with sessionId oldbar, status: passing')
})

test('onReload should not set context if no sauce user was applied', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    // @ts-expect-error
    browser.isMultiremote = false
    // @ts-expect-error
    browser.sessionId = 'foobar'
    service.onReload('oldbar', 'newbar')

    expect(service.updateJob).not.toBeCalled()
})

test('after in multiremote', () => {
    const caps: Capabilities.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService({}, caps, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_failures'] = 5
    service.updateJob = jest.fn()

    browser.isMultiremote = true
    // @ts-expect-error
    browser.sessionId = 'foobar'
    browser.chromeB.sessionId = 'newSessionChromeB'
    service.onReload('sessionChromeB', 'newSessionChromeB')

    expect(service.updateJob).toBeCalledWith('sessionChromeB', 5, true, 'chromeB')
})

test('updateJob for VMs', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_suiteTitle'] = 'my test'

    service.updateJob('12345', 23, true)

    const [reqUri, reqCall] = (got.put as jest.Mock).mock.calls[0]
    expect(reqUri).toBe('https://api.us-west-1.saucelabs.com/rest/v1/foobar/jobs/12345')
    expect(reqCall.json).toEqual({ name: 'my test (1)', passed: false })
    expect(service['_failures']).toBe(0)
})

test('updateJob for VMs without calledOnReload', () => {
    const service = new SauceService({}, {}, { user: 'foobar', key: '123' } as any)
    service['_browser'] = browser
    service.beforeSession()
    service['_suiteTitle'] = 'my test'

    service.updateJob('12345', 23)

    const [reqUri, reqCall] = (got.put as jest.Mock).mock.calls[0]
    expect(reqUri).toBe('https://api.us-west-1.saucelabs.com/rest/v1/foobar/jobs/12345')
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
    }, {} as any)
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

    service['_capabilities'] = {} as Capabilities.Capabilities
    expect(service.getBody(1)).toEqual({
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
    }, {} as any)
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
    }, {} as any)
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
    }, {} as any)
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

test('getBody with custom setJobName method', () => {
    const service = new SauceService({
        setJobName: () => 'foobarloo'
    }, {
        'sauce:options': {
            name: 'bizarre'
        }
    }, {} as any)
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()

    expect(service.getBody(1)).toEqual({
        name: 'foobarloo',
        passed: false
    })
})

test('getBody without multiremote', () => {
    const service = new SauceService({}, {
        tags: ['jobTag'],
        public: true,
        build: 'foobuild',
        'custom-data': { some: 'data' }
    }, {} as any)
    service['_browser'] = browser
    service['_suiteTitle'] = 'jojo'
    service.beforeSession()
    service['_testCnt'] = 3

    // @ts-expect-error
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

test('afterHook', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_reportErrorLog'] = jest.fn()
    expect(service['_failures']).toBe(0)
    expect(service['_reportErrorLog']).toHaveBeenCalledTimes(0)

    // @ts-expect-error
    service.afterHook(undefined, undefined, { passed: true })
    expect(service['_failures']).toBe(0)
    expect(service['_reportErrorLog']).toHaveBeenCalledTimes(0)

    // @ts-expect-error
    service.afterHook(undefined, undefined, {
        error: new Error('foo'),
        passed: false
    })
    expect(service['_failures']).toBe(1)
    expect(service['_reportErrorLog']).toHaveBeenCalledTimes(1)
})

test('strip ansi from _reportErrorLog', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = { execute: jest.fn() } as any
    service.setAnnotation = jest.fn()
    const error = new Error('Received: [31m""[39m')
    service['_reportErrorLog'](error)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=Error: Received: ""')
})

test('_reportErrorLog without error stack', () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = { execute: jest.fn() } as any
    service.setAnnotation = jest.fn()
    const error = { name: 'name', message: 'message' }
    service['_reportErrorLog'](error)
    expect(service.setAnnotation).toBeCalledWith('sauce:context=')
})

test('setAnnotation without a browser', async () => {
    const service = new SauceService({}, {}, {} as any)
    await service.setAnnotation('foo')

    expect(browser.execute).toBeCalledTimes(0)
})

test('setAnnotation', async () => {
    const service = new SauceService({}, {}, {} as any)
    service['_browser'] = browser
    // @ts-expect-error
    browser.isMultiremote = false
    await service.setAnnotation('foo')

    expect(browser.execute).toBeCalledWith('foo')
})

test('setAnnotation for VDC and RDC with multi remote', async () => {
    const caps: Capabilities.MultiRemoteCapabilities = {
        chromeA: { capabilities: {} },
        chromeB: { capabilities: {} },
        chromeC: { capabilities: {} }
    }
    const service = new SauceService({}, caps, {} as any)
    service['_browser'] = browser
    ;(isRDC as jest.Mock).mockReturnValueOnce(true)
    browser.isMultiremote = true
    // @ts-expect-error
    browser.sessionId = 'foobar'
    await service.setAnnotation('sauce:context=foo')

    expect(browser.execute).toBeCalledTimes(2)
    expect(browser.execute).toBeCalledWith('sauce:context=foo')
    expect(browser.execute).toBeCalledWith('sauce:context=foo')
})

afterEach(() => {
    // @ts-ignore
    browser = undefined
    ;(got.put as jest.Mock).mockClear()
})
