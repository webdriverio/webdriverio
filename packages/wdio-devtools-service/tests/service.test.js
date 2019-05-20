import DevToolsService from '../src'

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

afterEach(() => {
    delete global.browser
})
