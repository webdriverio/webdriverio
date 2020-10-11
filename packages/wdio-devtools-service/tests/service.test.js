import EventEmitter from 'events'
import puppeteer from 'puppeteer-core'

import DevToolsService from '../src'
import Auditor from '../src/auditor'

import logger from '@wdio/logger'

jest.mock('../src/commands', () => {
    class CommandHandlerMock {
        constructor () {
            this.cdp = jest.fn()
        }
    }

    return CommandHandlerMock
})

jest.mock('../src/auditor', () => {
    const updateCommandsMock = jest.fn()
    return class AuditorMock {
        constructor (traceEvents, logs) {
            this.traceEvents = traceEvents
            this.logs = logs
            this.updateCommands = updateCommandsMock
        }
    }
})

jest.mock('../src/utils', () => {
    const { isBrowserSupported } = jest.requireActual('../src/utils')
    let wasCalled = false

    return {
        findCDPInterface: jest.fn().mockImplementation(() => {
            if (!wasCalled) {
                wasCalled = true
                return 42
            }
            throw new Error('boom')
        }),
        isBrowserSupported,
        setUnsupportedCommand: jest.fn()
    }
})

const pageMock = {
    setCacheEnabled: jest.fn(),
    emulate: jest.fn()
}
const sessionMock = { send: jest.fn() }
const log = logger()

beforeEach(() => {
    global.browser = {
        getPuppeteer: jest.fn(() => puppeteer.connect({})),
        addCommand: jest.fn(),
        emit: jest.fn()
    }

    sessionMock.send.mockClear()
    log.error.mockClear()
})

test('beforeSession', () => {
    const service = new DevToolsService({}, [{}], {})
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, {})
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'firefox' })
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'chrome', version: 62 })
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'chrome', version: 65 })
    expect(service.isSupported).toBe(true)
})

test('if not supported by browser', async () => {
    const service = new DevToolsService({}, [{}], {})
    service.isSupported = false

    await service._setupHandler()
    expect(global.browser.addCommand.mock.calls).toHaveLength(0)
})

test('if supported by browser', async () => {
    const service = new DevToolsService({}, [{}], {})
    service.isSupported = true
    await service._setupHandler()
    expect(service.session.send).toBeCalledWith('Network.enable')
    expect(service.session.send).toBeCalledWith('Console.enable')
    expect(service.session.send).toBeCalledWith('Page.enable')
    expect(global.browser.addCommand).toBeCalledWith(
        'enablePerformanceAudits', expect.any(Function))
    expect(global.browser.addCommand).toBeCalledWith(
        'disablePerformanceAudits', expect.any(Function))
    expect(global.browser.addCommand).toBeCalledWith(
        'emulateDevice', expect.any(Function))

    const rawEventListener = service.puppeteer._connection._transport._ws.addEventListener
    expect(rawEventListener).toBeCalledTimes(1)
    expect(rawEventListener).toBeCalledWith('message', expect.any(Function))

    const rawWsEvent = rawEventListener.mock.calls.pop().pop()
    service.devtoolsGatherer = { onMessage: jest.fn() }
    rawWsEvent({ data: '{"method": "foo", "params": "bar"}' })
    expect(service.devtoolsGatherer.onMessage).toBeCalledTimes(1)
    expect(service.devtoolsGatherer.onMessage).toBeCalledWith({ method:'foo', params: 'bar' })
    expect(global.browser.emit).toBeCalledTimes(1)
    expect(global.browser.emit).toBeCalledWith('foo', 'bar')
})

test('beforeCommand', () => {
    const service = new DevToolsService({}, [{}], {})
    service.traceGatherer = { startTracing: jest.fn() }
    service._setThrottlingProfile = jest.fn()

    service.networkThrottling = 1
    service.cpuThrottling = 2
    service.cacheEnabled = 3

    service.beforeCommand()
    expect(service.traceGatherer.startTracing).toBeCalledTimes(0)

    service.shouldRunPerformanceAudits = true
    service.beforeCommand()
    expect(service.traceGatherer.startTracing).toBeCalledTimes(0)

    service.beforeCommand('foobar')
    expect(service.traceGatherer.startTracing).toBeCalledTimes(0)

    service.beforeCommand('navigateTo', ['some page'])
    expect(service.traceGatherer.startTracing).toBeCalledTimes(1)
    expect(service.traceGatherer.startTracing).toBeCalledWith('some page')
    expect(service._setThrottlingProfile).toBeCalledWith(1, 2, 3)

    service.beforeCommand('url', ['next page'])
    expect(service.traceGatherer.startTracing).toBeCalledTimes(2)
    expect(service.traceGatherer.startTracing).toBeCalledWith('next page')
    expect(service._setThrottlingProfile).toBeCalledWith(1, 2, 3)

    service.beforeCommand('click', ['some other page'])
    expect(service.traceGatherer.startTracing).toBeCalledTimes(3)
    expect(service.traceGatherer.startTracing).toBeCalledWith('click transition')
})

test('afterCommand', () => {
    const service = new DevToolsService({}, [{}], {})
    service.traceGatherer = { once: jest.fn() }

    service.afterCommand()
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.traceGatherer.isTracing = true
    service.afterCommand()
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.afterCommand('foobar')
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.afterCommand('navigateTo')
    expect(service.traceGatherer.once).toBeCalledTimes(3)

    service.afterCommand('url')
    expect(service.traceGatherer.once).toBeCalledTimes(6)

    service.afterCommand('click')
    expect(service.traceGatherer.once).toBeCalledTimes(9)
})

test('afterCommand: should create a new auditor instance and should update the browser commands', () => {
    const service = new DevToolsService({}, [{}], {})
    service.traceGatherer = new EventEmitter()
    service.traceGatherer.isTracing = true
    service.devtoolsGatherer = { getLogs: jest.fn() }
    global.browser = 'some browser'
    service.afterCommand('url')
    service.traceGatherer.emit('tracingComplete', { some: 'events' })

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser')
})

test('afterCommand: should update browser commands even if failed', () => {
    const service = new DevToolsService({}, [{}], {})
    service.traceGatherer = new EventEmitter()
    service.traceGatherer.isTracing = true
    service.devtoolsGatherer = { getLogs: jest.fn() }
    global.browser = 'some browser'
    service.afterCommand('url')
    service.traceGatherer.emit('tracingError', new Error('boom'))

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser', expect.any(Function))
})

test('afterCommand: should continue with command after tracingFinished was emitted', async () => {
    const service = new DevToolsService({}, [{}], {})
    service.traceGatherer = new EventEmitter()
    service.traceGatherer.isTracing = true
    service._setThrottlingProfile = jest.fn()

    const start = Date.now()
    setTimeout(() => service.traceGatherer.emit('tracingFinished'), 100)
    await service.afterCommand('navigateTo')

    expect(Date.now() - start).toBeGreaterThan(98)
    expect(service._setThrottlingProfile).toBeCalledWith('online', 0, true)
})

test('_enablePerformanceAudits: throws if network or cpu properties have wrong types', () => {
    const service = new DevToolsService({}, [{}], {})
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'super fast 3g' })
    ).toThrow()
    expect(
        () => service._enablePerformanceAudits({ cpuThrottling: '34' })
    ).toThrow()
})

test('_enablePerformanceAudits: applies some default values', () => {
    const service = new DevToolsService({}, [{}], {})
    service._enablePerformanceAudits()

    expect(service.networkThrottling).toBe('Good 3G')
    expect(service.cpuThrottling).toBe(4)
    expect(service.cacheEnabled).toBe(false)
})

test('_enablePerformanceAudits: applies some custom values', () => {
    const service = new DevToolsService({}, [{}], {})
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
    })

    expect(service.networkThrottling).toBe('Regular 2G')
    expect(service.cpuThrottling).toBe(42)
    expect(service.cacheEnabled).toBe(true)
})

test('_disablePerformanceAudits', () => {
    const service = new DevToolsService({}, [{}], {})
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
    })
    service._disablePerformanceAudits()
    expect(service.shouldRunPerformanceAudits).toBe(false)
})

test('_setThrottlingProfile', async () => {
    const service = new DevToolsService({}, [{}], {})
    service.page = pageMock
    service.session = sessionMock

    await service._setThrottlingProfile('Good 3G', 4, true)
    expect(pageMock.setCacheEnabled).toBeCalledWith(true)
    expect(sessionMock.send).toBeCalledWith('Emulation.setCPUThrottlingRate', { rate: 4 })
    expect(sessionMock.send).toBeCalledWith('Network.emulateNetworkConditions', {
        downloadThroughput: 188743,
        latency: 562.5,
        offline: false,
        uploadThroughput: 86400
    })
})

test('_emulateDevice', async () => {
    const service = new DevToolsService({}, [{}], {})
    service.page = pageMock
    service.session = sessionMock
    await service._emulateDevice('Nexus 6P')

    expect(pageMock.emulate.mock.calls).toMatchSnapshot()
    pageMock.emulate.mockClear()
    await service._emulateDevice({ foo: 'bar' })
    expect(pageMock.emulate.mock.calls).toEqual([[{ foo: 'bar' }]])

    const isSuccessful = await service._emulateDevice('not existing').then(
        () => true,
        () => false)
    expect(isSuccessful).toBe(false)
})

test('before hook', async () => {
    const service = new DevToolsService({}, [{}], {})
    service._setupHandler = jest.fn()
    service.before()
    expect(service._setupHandler).toBeCalledTimes(1)
})

test('onReload hook', async () => {
    const service = new DevToolsService({}, [{}], {})
    service._setupHandler = jest.fn()
    service.onReload()
    expect(service._setupHandler).toBeCalledTimes(1)
})

afterEach(() => {
})
