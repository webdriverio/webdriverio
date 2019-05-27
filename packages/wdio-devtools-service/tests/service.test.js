import EventEmitter from 'events'

import DevToolsService from '../src'
import Auditor from '../src/auditor'

import logger from '@wdio/logger'
import { getCDPClient } from '../src/utils'

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
    let wasCalled = false

    const cdpClientMock = {
        Network: { enable: jest.fn() },
        Console: { enable: jest.fn() },
        Page: { enable: jest.fn() },
        on: jest.fn()
    }

    return {
        findCDPInterface: jest.fn().mockImplementation(() => {
            if (!wasCalled) {
                wasCalled = true
                return 42
            }
            throw new Error('boom')
        }),
        getCDPClient: jest.fn().mockReturnValue(cdpClientMock)
    }
})

test('beforeSession', () => {
    const service = new DevToolsService()
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'firefox' })
    expect(service.isSupported).toBe(false)
    service.beforeSession(null, { browserName: 'chrome', version: 62 })
    expect(service.isSupported).toBe(false)

    service.beforeSession(null, { browserName: 'chrome', version: 65 })
    expect(service.isSupported).toBe(true)
})

test('if not supported by browser', async () => {
    global.browser = { addCommand: jest.fn() }

    const service = new DevToolsService()
    service.isSupported = false

    await service.before()
    expect(global.browser.addCommand.mock.calls).toHaveLength(1)
    expect(global.browser.addCommand.mock.calls[0][0]).toBe('cdp')
    expect(global.browser.addCommand.mock.calls[0][1].toString()).toContain('throw new Error')
})

test('if supported by browser', async () => {
    global.browser = { addCommand: jest.fn() }
    const service = new DevToolsService()
    service.isSupported = true
    await service.before()
    expect(service.client.Network.enable).toBeCalledTimes(1)
    service.client.Network.enable.mockClear()
    expect(service.client.Console.enable).toBeCalledTimes(1)
    service.client.Console.enable.mockClear()
    expect(service.client.Page.enable).toBeCalledTimes(1)
    service.client.Page.enable.mockClear()
})

test('initialised with the debuggerAddress as option', async () => {
    const options = {
        debuggerAddress: 'localhost:4444'
    }
    global.browser = { addCommand: jest.fn() }
    const service = new DevToolsService(options)
    service.isSupported = true
    await service.before()
    expect(getCDPClient).toBeCalledWith({ host: 'localhost', port: 4444 })
    expect(service.client.Network.enable).toBeCalledTimes(1)
    expect(service.client.Console.enable).toBeCalledTimes(1)
    expect(service.client.Page.enable).toBeCalledTimes(1)
})

test('initialization fails', async () => {
    global.browser = { addCommand: jest.fn() }

    const service = new DevToolsService()
    service.isSupported = true
    await service.before()

    expect(service.commandHandler).toBe(undefined)
    expect(logger().error.mock.calls.pop()[0]).toContain('Couldn\'t connect to chrome: Error: boom')
})

test('beforeCommand', () => {
    const service = new DevToolsService()
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

    service.beforeCommand('click', ['some other page'])
    expect(service.traceGatherer.startTracing).toBeCalledTimes(2)
    expect(service.traceGatherer.startTracing).toBeCalledWith('click transition')
})

test('afterCommand', () => {
    const service = new DevToolsService()
    service.traceGatherer = { once: jest.fn() }

    service.afterCommand()
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.traceGatherer.isTracing = true
    service.afterCommand()
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.afterCommand('foobar')
    expect(service.traceGatherer.once).toBeCalledTimes(0)

    service.afterCommand('navigateTo')
    expect(service.traceGatherer.once).toBeCalledTimes(2)

    service.afterCommand('click')
    expect(service.traceGatherer.once).toBeCalledTimes(4)
})

test('afterCommand: should create a new auditor instance and should update the browser commands', () => {
    const service = new DevToolsService()
    service.traceGatherer = new EventEmitter()
    service.traceGatherer.isTracing = true
    service.devtoolsGatherer = { getLogs: jest.fn() }
    global.browser = 'some browser'
    service.afterCommand('navigateTo')
    service.traceGatherer.emit('tracingComplete', { some: 'events' })

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser')
    delete global.browser
})

test('afterCommand: should continue with command after tracingFinished was emitted', async () => {
    const service = new DevToolsService()
    service.traceGatherer = new EventEmitter()
    service.traceGatherer.isTracing = true
    service._setThrottlingProfile = jest.fn()

    const start = Date.now()
    setTimeout(() => service.traceGatherer.emit('tracingFinished'), 100)
    await service.afterCommand('navigateTo')

    expect(Date.now() - start).toBeGreaterThan(99)
    expect(service._setThrottlingProfile).toBeCalledWith('online', 0, true)
})

test('_enablePerformanceAudits: throws if network or cpu properties have wrong types', () => {
    const service = new DevToolsService()
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'super fast 3g' })
    ).toThrow()
    expect(
        () => service._enablePerformanceAudits({ cpuThrottling: '34' })
    ).toThrow()
})

test('_enablePerformanceAudits: applies some default values', () => {
    const service = new DevToolsService()
    service._enablePerformanceAudits()

    expect(service.networkThrottling).toBe('Good 3G')
    expect(service.cpuThrottling).toBe(4)
    expect(service.cacheEnabled).toBe(false)
})

test('_enablePerformanceAudits: applies some custom values', () => {
    const service = new DevToolsService()
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
    const service = new DevToolsService()
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
    })
    service._disablePerformanceAudits()
    expect(service.shouldRunPerformanceAudits).toBe(false)
})

test('_setThrottlingProfile', async () => {
    const pageMock = { setCacheEnabled: jest.fn() }
    const service = new DevToolsService()
    service.devtoolsDriver = {
        getActivePage: jest.fn().mockReturnValue(Promise.resolve(pageMock)),
        send: jest.fn()
    }

    await service._setThrottlingProfile('Good 3G', 4, true)
    expect(pageMock.setCacheEnabled).toBeCalledWith(true)
    expect(service.devtoolsDriver.send).toBeCalledWith('Emulation.setCPUThrottlingRate', { rate: 4 })
    expect(service.devtoolsDriver.send).toBeCalledWith('Network.emulateNetworkConditions', {
        downloadThroughput: 188743,
        latency: 562.5,
        offline: false,
        uploadThroughput: 86400
    })
})

afterEach(() => {
    delete global.browser
})
