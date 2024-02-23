import path from 'node:path'
import { EventEmitter } from 'node:events'
import { expect, test, vi, beforeEach } from 'vitest'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import Auditor from '../src/auditor.js'

import CommandHandler from '../src/commands.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../src/utils', () => ({
    readIOStream: vi.fn().mockReturnValue('foobar'),
    sumByKey: vi.fn().mockReturnValue('foobar')
}))

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
    emulate: vi.fn(),
    on: vi.fn(),
    tracing: {
        start: vi.fn(),
        stop: vi.fn()
    }
}

const sessionMock = {
    on: vi.fn(),
    emit: vi.fn(),
    send: vi.fn()
}

const driverMock = {}

const options = {}

const browser: any = {
    addCommand: vi.fn(),
    emit: vi.fn()
}

beforeEach(() => {
    pageMock.on.mockClear()
    pageMock.tracing.start.mockClear()
    pageMock.tracing.stop.mockClear()
    sessionMock.on.mockClear()
    // sessionMock.emit.mockClear()
    sessionMock.send.mockClear()
    browser.addCommand.mockReset()
})

test('initialization', async () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        {
            coverageReporter: {
                enable: true
            }
        },
        browser as any
    )
    await handler._initCommand()

    expect(browser.addCommand.mock.calls).toHaveLength(14)
    expect(sessionMock.on).toBeCalled()
    expect(pageMock.on).toBeCalled()

    expect(handler['_session']?.send).toBeCalledWith('Network.enable')
    expect(handler['_session']?.send).toBeCalledWith('Runtime.enable')
    expect(handler['_session']?.send).toBeCalledWith('Page.enable')

    handler['_devtoolsGatherer'] = { onMessage: vi.fn() } as any
    handler['_propagateWSEvents']({ method: 'foo', params: 'bar' })
    expect(handler['_devtoolsGatherer']?.onMessage).toBeCalledTimes(1)
    expect(handler['_devtoolsGatherer']?.onMessage).toBeCalledWith({ method:'foo', params: 'bar' })
    expect((handler['_browser'] as any).emit).toBeCalledTimes(1)
    expect((handler['_browser'] as any).emit).toBeCalledWith('foo', 'bar')
    expect(handler['_coverageGatherer']!.init).toBeCalledTimes(1)
})

test('getTraceLogs', () => {
    const commander = new CommandHandler(
        sessionMock as unknown as CDPSession,
        pageMock as unknown as Page,
        driverMock as any,
        options as any,
        browser
    )
    commander['_traceEvents'] = [{ foo: 'bar' }] as any
    expect(commander.getTraceLogs()).toEqual([{ foo: 'bar' }])
})

test('cdp', async () => {
    sessionMock.send.mockReturnValue(Promise.resolve('foobar'))
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    expect(await handler.cdp('Network', 'enable')).toBe('foobar')
    expect(sessionMock.send).toBeCalledWith('Network.enable', {})
})

test('getNodeId', async () => {
    sessionMock.send.mockResolvedValueOnce({ root: { nodeId: 123 } })
    sessionMock.send.mockResolvedValueOnce({ nodeId: 42 })
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )

    expect(await handler.getNodeId('selector')).toBe(42)
    expect(sessionMock.send).toBeCalledWith('DOM.getDocument')
    expect(sessionMock.send).toBeCalledWith(
        'DOM.querySelector',
        { nodeId: 123, selector: 'selector' })
})

test('getNodeIds', async () => {
    sessionMock.send.mockResolvedValueOnce({ root: { nodeId: 123 } })
    sessionMock.send.mockResolvedValueOnce({ nodeIds: [42, 43] })
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )

    expect(await handler.getNodeIds('selector')).toEqual([42, 43])
    expect(sessionMock.send).toBeCalledWith('DOM.getDocument')
    expect(sessionMock.send).toBeCalledWith(
        'DOM.querySelectorAll',
        { nodeId: 123, selector: 'selector' })
})

test('startTracing', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler.startTracing()

    expect(handler['_isTracing']).toBe(true)
    expect(handler.startTracing.bind(handler)).toThrow()
    expect(pageMock.tracing.start).toBeCalledTimes(1)
})

test('endTracing', async () => {
    pageMock.tracing.stop.mockResolvedValue(Buffer.from('{ "traceEvents": "foobar" }'))
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_isTracing'] = true

    const traceEvents = await handler.endTracing()
    expect(pageMock.tracing.stop).toBeCalledTimes(1)
    expect(traceEvents).toEqual({ traceEvents: 'foobar' })
    expect(handler['_isTracing']).toBe(false)
})

test('endTracing throws if not tracing', async () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    const err = await handler.endTracing().catch((err) => err)
    expect(err.message).toContain('No tracing was initiated')
})

test('endTracing throws if parsing of trace events fails', async () => {
    pageMock.tracing.stop.mockResolvedValue(Buffer.from('{ "traceEven'))
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_isTracing'] = true
    const err = await handler.endTracing().catch((err) => err)
    expect(err.message).toContain("Couldn't parse trace events")
})

test('getPageWeight', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_networkHandler'].requestTypes = {
        Document: { size: 23343, encoded: 7674, count: 1 },
        Image: { size: 53479, encoded: 53479, count: 6 },
        Other: { size: 0, encoded: 0, count: 1 }
    }

    const { pageWeight, transferred, requestCount, details } = handler.getPageWeight()
    expect(pageWeight).toBe('foobar')
    expect(transferred).toBe('foobar')
    expect(requestCount).toBe('foobar')
    expect(details).toEqual(handler['_networkHandler'].requestTypes)
})

test('beforeCmd', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_traceGatherer'] = { startTracing: vi.fn() } as any
    handler.setThrottlingProfile = vi.fn()

    handler['_networkThrottling'] = 'offline'
    handler['_cpuThrottling'] = 2
    handler['_cacheEnabled'] = true

    // @ts-ignore test without paramater
    handler._beforeCmd()
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    handler['_shouldRunPerformanceAudits'] = true
    // @ts-ignore test without paramater
    handler._beforeCmd()
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    // @ts-ignore test with only one paramater
    handler._beforeCmd('foobar')
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(0)

    handler._beforeCmd('navigateTo', ['some page'])
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(1)
    expect(handler['_traceGatherer']?.startTracing).toBeCalledWith('some page')
    expect(handler.setThrottlingProfile).toBeCalledWith('offline', 2, true)

    handler._beforeCmd('url', ['next page'])
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(2)
    expect(handler['_traceGatherer']?.startTracing).toBeCalledWith('next page')
    expect(handler.setThrottlingProfile).toBeCalledWith('offline', 2, true)

    handler._beforeCmd('click', ['some other page'])
    expect(handler['_traceGatherer']?.startTracing).toBeCalledTimes(3)
    expect(handler['_traceGatherer']?.startTracing).toBeCalledWith('click transition')
})

test('afterCmd', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_traceGatherer'] = { once: vi.fn() } as any

    // @ts-ignore test without paramater
    handler._afterCmd()
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(0)

    // @ts-ignore access mock
    handler['_traceGatherer']['isTracing'] = true
    // @ts-ignore test without paramater
    handler._afterCmd()
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(0)

    handler._afterCmd('foobar')
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(0)

    handler._afterCmd('navigateTo')
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(3)

    handler._afterCmd('url')
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(6)

    handler._afterCmd('click')
    expect(handler['_traceGatherer']?.once).toBeCalledTimes(9)
})

test('afterCmd: should create a new auditor instance and should update the browser commands', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    handler['_traceGatherer']['isTracing'] = true
    handler['_devtoolsGatherer'] = { getLogs: vi.fn() } as any
    handler['_browser'] = 'some browser' as any
    handler._afterCmd('url')
    handler['_traceGatherer']?.emit('tracingComplete', { some: 'events' })

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser')
})

test('afterCmd: should update browser commands even if failed', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    handler['_traceGatherer']['isTracing'] = true
    handler['_devtoolsGatherer'] = { getLogs: vi.fn() } as any
    handler['_browser'] = 'some browser' as any
    handler._afterCmd('url')
    handler['_traceGatherer']?.emit('tracingError', new Error('boom'))

    const auditor = new Auditor()
    expect(auditor.updateCommands).toBeCalledWith('some browser', expect.any(Function))
})

test('afterCmd: should continue with command after tracingFinished was emitted', async () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler['_traceGatherer'] = new EventEmitter() as any

    // @ts-ignore access mock
    handler['_traceGatherer']['isTracing'] = true
    handler.setThrottlingProfile = vi.fn()

    const start = Date.now()
    setTimeout(() => handler['_traceGatherer']?.emit('tracingFinished'), 100)
    await handler._afterCmd('navigateTo')

    expect(Date.now() - start).toBeGreaterThan(98)
    expect(handler.setThrottlingProfile).toBeCalledWith('online', 0, true)
})

test('enablePerformanceAudits: applies some default values', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler.enablePerformanceAudits()

    expect(handler['_networkThrottling']).toBe('online')
    expect(handler['_cpuThrottling']).toBe(0)
    expect(handler['_cacheEnabled']).toBe(false)
    expect(handler['_formFactor']).toBe('desktop')
})

test('enablePerformanceAudits: applies some custom values', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler.enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })

    expect(handler['_networkThrottling']).toBe('Regular 2G')
    expect(handler['_cpuThrottling']).toBe(42)
    expect(handler['_cacheEnabled']).toBe(true)
    expect(handler['_formFactor']).toBe('mobile')
})

test('disablePerformanceAudits', () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )
    handler.enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })
    handler.disablePerformanceAudits()
    expect(handler['_shouldRunPerformanceAudits']).toBe(false)
})

test('setThrottlingProfile', async () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )

    await handler.setThrottlingProfile('GPRS', 42, true)
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
    await handler.setThrottlingProfile()
    expect(pageMock.setCacheEnabled).toBeCalledWith(false)
    expect(sessionMock.send).toBeCalledWith('Emulation.setCPUThrottlingRate', { rate: 0 })
    expect(sessionMock.send).toBeCalledWith('Network.emulateNetworkConditions', {
        downloadThroughput: -1,
        latency: 0,
        offline: false,
        uploadThroughput: -1
    })
})

test('emulateDevice', async () => {
    const handler = new CommandHandler(
        sessionMock as any,
        pageMock as any,
        driverMock as any,
        options as any,
        browser as any
    )

    handler['_page'] = pageMock as any
    handler['_session'] = sessionMock as any
    await handler.emulateDevice('Nexus 6P')

    expect(pageMock.emulate.mock.calls).toMatchSnapshot()
    pageMock.emulate.mockClear()
    await handler.emulateDevice({ foo: 'bar' } as any)
    expect(pageMock.emulate.mock.calls).toEqual([[{ foo: 'bar' }]])

    const isSuccessful = await handler.emulateDevice('not existing').then(
        () => true,
        () => false)
    expect(isSuccessful).toBe(false)
})
