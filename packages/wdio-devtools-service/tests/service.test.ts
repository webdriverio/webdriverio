import path from 'node:path'
import { EventEmitter } from 'node:events'
import { expect, test, vi, beforeEach } from 'vitest'
import puppeteer from 'puppeteer-core'

import DevToolsService from '../src/index.js'
import Auditor from '../src/auditor.js'
import { setUnsupportedCommand } from '../src/utils.js'

import logger from '@wdio/logger'

vi.mock('ws')
vi.mock('puppeteer-core')
vi.mock('lighthouse/lighthouse-core/fraggle-rock/gather/session')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/commands', () => {
    class CommandHandlerMock {
        cdp = vi.fn()
    }

    return { default: CommandHandlerMock }
})

vi.mock('../src/auditor', () => {
    const updateCommandsMock = vi.fn()
    return {
        default: class {
            traceEvents: any
            logs: any
            updateCommands = updateCommandsMock

            constructor (traceEvents: any, logs: any) {
                this.traceEvents = traceEvents
                this.logs = logs
            }
        }
    }
})

vi.mock('../src/utils', async () => {
    let wasCalled = false

    return {
        findCDPInterface: vi.fn().mockImplementation(() => {
            if (!wasCalled) {
                wasCalled = true
                return 42
            }
            throw new Error('boom')
        }),
        setUnsupportedCommand: vi.fn(),
        getLighthouseDriver: vi.fn()
    }
})

vi.mock('../src/gatherer/coverage', () => {
    const instances: any[] = []
    return {
        default: class {
            getCoverageReport = vi.fn()
            init = vi.fn()

            constructor () {
                instances.push(this)
            }
        }
    }
})

const pageMock = {
    setCacheEnabled: vi.fn(),
    emulate: vi.fn()
}
const sessionMock = { send: vi.fn() }
const log = logger('')

let browser: WebdriverIO.Browser
beforeEach(() => {
    browser = {
        getPuppeteer: vi.fn(() => puppeteer.connect({})),
        addCommand: vi.fn(),
        emit: vi.fn()
    } as any

    sessionMock.send.mockClear()
    vi.mocked(log.error).mockClear()
})

test('if not supported by browser', async () => {
    const service = new DevToolsService({})
    service['_browser'] = {
        addCommand: vi.fn(),
        getPuppeteer: vi.fn(() => Promise.reject(new Error('ups')))
    } as any

    await service._setupHandler()
    expect(setUnsupportedCommand).toBeCalledTimes(1)
    expect(vi.mocked(service['_browser']!.addCommand!).mock.calls).toHaveLength(0)
})

test('if supported by browser', async () => {
    const service = new DevToolsService({
        coverageReporter: {
            enable: true
        }
    })
    service['_browser'] = browser
    await service._setupHandler()
    expect(service['_session']?.send).toBeCalledWith('Network.enable')
    expect(service['_session']?.send).toBeCalledWith('Runtime.enable')
    expect(service['_session']?.send).toBeCalledWith('Page.enable')
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'enablePerformanceAudits', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'disablePerformanceAudits', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'emulateDevice', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'checkPWA', expect.any(Function))

    service['_devtoolsGatherer'] = { onMessage: vi.fn() } as any
    service['_propagateWSEvents']({ method: 'foo', params: 'bar' })
    expect(service['_devtoolsGatherer']?.onMessage).toBeCalledTimes(1)
    expect(service['_devtoolsGatherer']?.onMessage).toBeCalledWith({ method:'foo', params: 'bar' })
    expect((service['_browser'] as any).emit).toBeCalledTimes(1)
    expect((service['_browser'] as any).emit).toBeCalledWith('foo', 'bar')
    expect(service['_coverageGatherer']!.init).toBeCalledTimes(1)
})

test('beforeCommand', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service['_traceGatherer'] = { startTracing: vi.fn() } as any
    service._setThrottlingProfile = vi.fn()

    service['_networkThrottling'] = 'offline'
    service['_cpuThrottling'] = 2
    service['_cacheEnabled'] = true

    // @ts-ignore test without paramater
    service.beforeCommand()
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    service['_shouldRunPerformanceAudits'] = true
    // @ts-ignore test without paramater
    service.beforeCommand()
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    // @ts-ignore test with only one paramater
    service.beforeCommand('foobar')
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    service.beforeCommand('navigateTo', ['some page'])
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(1)
    expect(service['_traceGatherer']?.startTracing).toBeCalledWith('some page')
    expect(service._setThrottlingProfile).toBeCalledWith('offline', 2, true)

    service.beforeCommand('url', ['next page'])
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(2)
    expect(service['_traceGatherer']?.startTracing).toBeCalledWith('next page')
    expect(service._setThrottlingProfile).toBeCalledWith('offline', 2, true)

    service.beforeCommand('click', ['some other page'])
    expect(service['_traceGatherer']?.startTracing).toBeCalledTimes(3)
    expect(service['_traceGatherer']?.startTracing).toBeCalledWith('click transition')
})

test('afterCommand', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service['_traceGatherer'] = { once: vi.fn() } as any

    // @ts-ignore test without paramater
    service.afterCommand()
    expect(service['_traceGatherer']?.once).toBeCalledTimes(0)

    // @ts-ignore access mock
    service['_traceGatherer']['isTracing'] = true
    // @ts-ignore test without paramater
    service.afterCommand()
    expect(service['_traceGatherer']?.once).toBeCalledTimes(0)

    service.afterCommand('foobar')
    expect(service['_traceGatherer']?.once).toBeCalledTimes(0)

    service.afterCommand('navigateTo')
    expect(service['_traceGatherer']?.once).toBeCalledTimes(3)

    service.afterCommand('url')
    expect(service['_traceGatherer']?.once).toBeCalledTimes(6)

    service.afterCommand('click')
    expect(service['_traceGatherer']?.once).toBeCalledTimes(9)
})

test('afterCommand: should create a new auditor instance and should update the browser commands', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    service['_traceGatherer']['isTracing'] = true
    service['_devtoolsGatherer'] = { getLogs: vi.fn() } as any
    service['_browser'] = 'some browser' as any
    service.afterCommand('url')
    service['_traceGatherer']?.emit('tracingComplete', { some: 'events' })

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser')
})

test('afterCommand: should update browser commands even if failed', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    service['_traceGatherer']['isTracing'] = true
    service['_devtoolsGatherer'] = { getLogs: vi.fn() } as any
    service['_browser'] = 'some browser' as any
    service.afterCommand('url')
    service['_traceGatherer']?.emit('tracingError', new Error('boom'))

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser', expect.any(Function))
})

test('afterCommand: should continue with command after tracingFinished was emitted', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    service['_traceGatherer']['isTracing'] = true
    service._setThrottlingProfile = vi.fn()

    const start = Date.now()
    setTimeout(() => service['_traceGatherer']?.emit('tracingFinished'), 100)
    await service.afterCommand('navigateTo')

    expect(Date.now() - start).toBeGreaterThan(98)
    expect(service._setThrottlingProfile).toBeCalledWith('online', 0, true)
})

test('_enablePerformanceAudits: throws if network or cpu properties have wrong types', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'super fast 3g' } as any)
    ).toThrow(/Network throttling profile/)
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'Good 3G', cpuThrottling: '34' } as any)
    ).toThrow(/CPU throttling rate needs to be typeof number/)
})

test('_enablePerformanceAudits: applies some default values', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service._enablePerformanceAudits()

    expect(service['_networkThrottling']).toBe('online')
    expect(service['_cpuThrottling']).toBe(0)
    expect(service['_cacheEnabled']).toBe(false)
    expect(service['_formFactor']).toBe('desktop')
})

test('_enablePerformanceAudits: applies some custom values', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })

    expect(service['_networkThrottling']).toBe('Regular 2G')
    expect(service['_cpuThrottling']).toBe(42)
    expect(service['_cacheEnabled']).toBe(true)
    expect(service['_formFactor']).toBe('mobile')
})

test('_disablePerformanceAudits', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })
    service._disablePerformanceAudits()
    expect(service['_shouldRunPerformanceAudits']).toBe(false)
})

test('_setThrottlingProfile', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    const err = await service._setThrottlingProfile('Good 3G', 4, true)
        .catch((err: Error) => err) as Error
    expect(err.message).toContain('No page')

    service['_page'] = pageMock as any
    service['_session'] = sessionMock as any

    await service._setThrottlingProfile('GPRS', 42, true)
    expect(pageMock.setCacheEnabled).toBeCalledWith(true)
    expect(sessionMock.send).toBeCalledWith('Emulation.setCPUThrottlingRate', { rate: 42 })
    expect(sessionMock.send).toBeCalledWith('Network.emulateNetworkConditions', {
        downloadThroughput: 6400,
        latency: 500,
        offline: false,
        uploadThroughput: 2560
    })

    pageMock.setCacheEnabled.mockClear()
    sessionMock.send.mockClear()
    await service._setThrottlingProfile()
    expect(pageMock.setCacheEnabled).toBeCalledWith(false)
    expect(sessionMock.send).toBeCalledWith('Emulation.setCPUThrottlingRate', { rate: 0 })
    expect(sessionMock.send).toBeCalledWith('Network.emulateNetworkConditions', {
        downloadThroughput: -1,
        latency: 0,
        offline: false,
        uploadThroughput: -1
    })
})

test('_emulateDevice', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    const err = await service._emulateDevice('Nexus 6P')
        .catch((err: Error) => err) as Error
    expect(err.message).toContain('No page')

    service['_page'] = pageMock as any
    service['_session'] = sessionMock as any
    await service._emulateDevice('Nexus 6P')

    expect(pageMock.emulate.mock.calls).toMatchSnapshot()
    pageMock.emulate.mockClear()
    await service._emulateDevice({ foo: 'bar' } as any)
    expect(pageMock.emulate.mock.calls).toEqual([[{ foo: 'bar' }]])

    const isSuccessful = await service._emulateDevice('not existing').then(
        () => true,
        () => false)
    expect(isSuccessful).toBe(false)
})

test('before hook', async () => {
    const service = new DevToolsService({})
    service._setupHandler = vi.fn()
    service.before({}, [], browser)
    expect(service._setupHandler).toBeCalledTimes(1)
})

test('onReload hook', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service._setupHandler = vi.fn()
    ;(service['_browser'] as any).puppeteer = 'suppose to be reset after reload' as any
    service.onReload()
    expect(service._setupHandler).toBeCalledTimes(1)
})

test('after hook', async () => {
    const service = new DevToolsService({})
    await service.after()

    service['_coverageGatherer'] = { logCoverage: vi.fn() } as any
    await service.after()
    expect(service['_coverageGatherer']!.logCoverage).toHaveBeenCalledTimes(1)
})
