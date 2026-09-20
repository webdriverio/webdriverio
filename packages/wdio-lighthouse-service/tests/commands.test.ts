import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/api/CDPSession.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import CommandHandler from '../src/commands.js'
import Auditor from '../src/auditor.js'

const startNavigation = vi.fn()
const endNavigation = vi.fn()
const navigate = vi.fn()
const createFlowResult = vi.fn()
const dispose = vi.fn()
const startFlow = vi.fn()

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('lighthouse', () => ({
    desktopConfig: { settings: { formFactor: 'desktop' } },
    startFlow: (...args: unknown[]) => startFlow(...args)
}))
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>
    return {
        ...actual,
        sumByKey: vi.fn().mockReturnValue('foobar')
    }
})
vi.mock('../src/auditor', () => {
    const updateCommandsMock = vi.fn()
    return {
        default: class {
            updateCommands = updateCommandsMock
        }
    }
})
vi.mock('../src/pwa', () => ({
    default: class {
        audit = vi.fn().mockResolvedValue({ passed: true, details: {} })
    }
}))

const pageMock = {
    setCacheEnabled: vi.fn(),
    url: vi.fn().mockReturnValue('https://webdriver.io'),
    browser: vi.fn(() => ({
        pages: vi.fn().mockResolvedValue([])
    })),
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

const options = {}
const browser: any = {
    addCommand: vi.fn(),
    emit: vi.fn(),
    getUrl: vi.fn().mockResolvedValue('https://webdriver.io/')
}

const successfulLhr = {
    audits: {
        'first-contentful-paint': { score: 1, numericValue: 200 },
        'largest-contentful-paint': { score: 1, numericValue: 300 },
        'speed-index': { score: 1, numericValue: 250 }
    },
    categories: { performance: { score: 0.9 } },
    finalDisplayedUrl: 'https://webdriver.io/'
}

function createHandler () {
    return new CommandHandler(
        sessionMock as unknown as CDPSession,
        pageMock as unknown as Page,
        options as any,
        browser
    )
}

beforeEach(() => {
    pageMock.setCacheEnabled.mockClear()
    pageMock.tracing.start.mockClear()
    pageMock.tracing.stop.mockClear()
    sessionMock.on.mockClear()
    sessionMock.send.mockClear()
    browser.addCommand.mockReset()
    browser.emit.mockClear()
    startNavigation.mockReset().mockResolvedValue(undefined)
    endNavigation.mockReset().mockResolvedValue(undefined)
    navigate.mockReset().mockResolvedValue(undefined)
    createFlowResult.mockReset().mockResolvedValue({
        steps: [{ lhr: successfulLhr }]
    })
    dispose.mockReset()
    startFlow.mockReset().mockResolvedValue({
        startNavigation,
        endNavigation,
        navigate,
        createFlowResult,
        dispose
    })
    browser.getUrl.mockReset().mockResolvedValue('https://webdriver.io/')
})

test('initialization', async () => {
    const handler = createHandler()
    await handler._initCommand()

    expect(browser.addCommand.mock.calls.length).toBeGreaterThanOrEqual(8)
    expect(sessionMock.on).toBeCalled()
    expect(handler['_session']?.send).toBeCalledWith('Network.enable')
    expect(handler['_session']?.send).toBeCalledWith('Runtime.enable')
    expect(handler['_session']?.send).toBeCalledWith('Page.enable')

    handler['_devtoolsGatherer'] = { onMessage: vi.fn() } as any
    handler['_propagateWSEvents']({ method: 'foo', params: 'bar' })
    expect(handler['_devtoolsGatherer']?.onMessage).toBeCalledTimes(1)
    expect((handler['_browser'] as any).emit).toBeCalledWith('foo', 'bar')
})

test('ignores non CDP websocket events', () => {
    const handler = createHandler()
    handler['_devtoolsGatherer'] = { onMessage: vi.fn() } as any
    handler['_propagateWSEvents']('not-an-event')
    handler['_propagateWSEvents']({ method: 'only-method' })
    expect(handler['_devtoolsGatherer']?.onMessage).not.toBeCalled()
})

test('getTraceLogs', () => {
    const handler = createHandler()
    handler['_traceEvents'] = [{ foo: 'bar' }] as any
    expect(handler.getTraceLogs()).toEqual([{ foo: 'bar' }])
})

test('startTracing', () => {
    const handler = createHandler()
    handler.startTracing()

    expect(handler['_isTracing']).toBe(true)
    expect(handler.startTracing.bind(handler)).toThrow()
    expect(pageMock.tracing.start).toBeCalledTimes(1)
})

test('endTracing', async () => {
    pageMock.tracing.stop.mockResolvedValue(Buffer.from(JSON.stringify({
        traceEvents: [{ name: 'navigationStart' }]
    })))
    const handler = createHandler()
    handler['_isTracing'] = true

    const traceEvents = await handler.endTracing()
    expect(pageMock.tracing.stop).toBeCalledTimes(1)
    expect(traceEvents).toEqual([{ name: 'navigationStart' }])
    expect(handler['_isTracing']).toBe(false)
})

test('endTracing decodes a Uint8Array trace buffer from Puppeteer', async () => {
    const payload = { traceEvents: [{ name: 'navigationStart' }] }
    pageMock.tracing.stop.mockResolvedValue(new TextEncoder().encode(JSON.stringify(payload)))
    const handler = createHandler()
    handler['_isTracing'] = true

    const traceEvents = await handler.endTracing()
    expect(traceEvents).toEqual(payload.traceEvents)
    expect(handler['_isTracing']).toBe(false)
})

test('endTracing throws if not tracing', async () => {
    const handler = createHandler()
    const err = await handler.endTracing().catch((error) => error)
    expect(err.message).toContain('No tracing was initiated')
})

test('endTracing throws if parsing of trace events fails', async () => {
    pageMock.tracing.stop.mockResolvedValue(Buffer.from('{ "traceEven'))
    const handler = createHandler()
    handler['_isTracing'] = true
    const err = await handler.endTracing().catch((error) => error)
    expect(err.message).toContain("Couldn't parse trace events")
    expect(handler['_isTracing']).toBe(false)
})

test('endTracing throws if no trace buffer was captured', async () => {
    pageMock.tracing.stop.mockResolvedValue(undefined)
    const handler = createHandler()
    handler['_isTracing'] = true
    const err = await handler.endTracing().catch((error) => error)
    expect(err.message).toContain("Couldn't parse trace events")
})

test('getPageWeight', () => {
    const handler = createHandler()
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

test('beforeCmd starts a Lighthouse navigation for url commands', async () => {
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_networkThrottling'] = 'offline'
    handler['_cpuThrottling'] = 2
    handler['_cacheEnabled'] = true
    handler['_formFactor'] = 'desktop'

    await handler._beforeCmd('enablePerformanceAudits', [])
    expect(startFlow).not.toHaveBeenCalled()

    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('foobar', [])
    expect(startFlow).not.toHaveBeenCalled()

    await handler._beforeCmd('url', ['https://webdriver.io'])
    expect(handler.setThrottlingProfile).toBeCalledWith('offline', 2, true)
    expect(startFlow).toHaveBeenCalledTimes(1)
    expect(startFlow.mock.calls[0][1].flags.screenEmulation).toBeUndefined()
    expect(startNavigation).toHaveBeenCalledWith({ name: 'WebdriverIO url' })
    expect(handler['_flowInProgress']).toBe(true)
})

test('beforeCmd starts a Lighthouse navigation for click commands', async () => {
    vi.useFakeTimers()
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true

    await handler._beforeCmd('click', [])
    expect(startNavigation).toHaveBeenCalledWith({ name: 'WebdriverIO click' })
    expect(handler['_clickTraceTimeout']).toBeDefined()

    vi.advanceTimersByTime(2000)
    expect(handler['_pageLoadDetected']).toBe(false)
    vi.useRealTimers()
})

test('beforeCmd resets when startFlow fails', async () => {
    startFlow.mockRejectedValueOnce(new Error('no page'))
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true

    await expect(handler._beforeCmd('navigateTo', ['https://webdriver.io'])).rejects.toThrow('no page')
    expect(handler['_flowInProgress']).toBe(false)
})

test('afterCmd updates browser commands after a successful Lighthouse run', async () => {
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('url', ['https://webdriver.io'])
    handler['_pageLoadDetected'] = true

    await handler._afterCmd('url')

    expect(endNavigation).toHaveBeenCalledTimes(1)
    expect(createFlowResult).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser)
    expect(handler.setThrottlingProfile).toHaveBeenLastCalledWith('online', 0, true)
    expect(handler['_flowInProgress']).toBe(false)
})

test('afterCmd falls back to Lighthouse navigate when the wrap has no metrics', async () => {
    createFlowResult
        .mockResolvedValueOnce({
            steps: [{
                lhr: {
                    runtimeError: { code: 'NO_FCP', message: 'Unable to find first contentful paint' },
                    categories: { performance: { score: null } }
                }
            }]
        })
        .mockResolvedValueOnce({
            steps: [{ lhr: successfulLhr }]
        })
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('url', ['https://webdriver.io'])
    handler['_pageLoadDetected'] = true

    await handler._afterCmd('url')

    expect(navigate).toHaveBeenCalledWith('https://webdriver.io/')
    expect(createFlowResult).toHaveBeenCalledTimes(2)
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser)
})

test('afterCmd does not fall back when the current URL is unsupported', async () => {
    createFlowResult.mockResolvedValue({
        steps: [{ lhr: { runtimeError: { code: 'NO_FCP', message: 'no paint' } } }]
    })
    browser.getUrl.mockResolvedValue('about:blank')
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('url', ['https://webdriver.io'])
    handler['_pageLoadDetected'] = true

    await handler._afterCmd('url')

    expect(navigate).not.toHaveBeenCalled()
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
})

test('afterCmd fails commands when fallback navigate also lacks metrics', async () => {
    createFlowResult.mockResolvedValue({
        steps: [{ lhr: { categories: { performance: { score: null } } } }]
    })
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('url', ['https://webdriver.io'])
    handler['_pageLoadDetected'] = true

    await handler._afterCmd('url')

    expect(navigate).toHaveBeenCalledWith('https://webdriver.io/')
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
})

test('afterCmd wraps failing commands when Lighthouse fails', async () => {
    endNavigation.mockRejectedValueOnce(new Error('NO_NAVSTART'))
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('url', ['https://webdriver.io'])

    await handler._afterCmd('url')

    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
    expect(dispose).toHaveBeenCalled()
})

test('afterCmd skips clicks that do not navigate', async () => {
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('click', [])

    await handler._afterCmd('click')

    expect(dispose).toHaveBeenCalled()
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
})

test('afterCmd ignores commands while no flow is running', async () => {
    const handler = createHandler()
    await handler._afterCmd('url')
    expect(endNavigation).not.toHaveBeenCalled()
})

test('frame navigation is ignored for unsupported or nested frames', async () => {
    const handler = createHandler()
    handler['_flowInProgress'] = true

    handler['_handleFrameNavigated']({ frame: { parentId: 'iframe', url: 'https://webdriver.io' } })
    handler['_handleFrameNavigated']({ frame: { url: 'data:,' } })
    expect(handler['_pageLoadDetected']).toBe(false)

    handler['_handleFrameNavigated']({ frame: { url: 'https://webdriver.io/' } })
    expect(handler['_pageLoadDetected']).toBe(true)
})

test('frame navigation clears the pending click timeout', async () => {
    vi.useFakeTimers()
    const handler = createHandler()
    handler['_flowInProgress'] = true
    handler['_clickTraceTimeout'] = setTimeout(() => {}, 45_000)

    handler['_handleFrameNavigated']({ frame: { url: 'https://webdriver.io/' } })

    expect(handler['_pageLoadDetected']).toBe(true)
    expect(handler['_clickTraceTimeout']).toBeUndefined()
    vi.useRealTimers()
})

test('afterCmd logs when cancelling a click whose navigation never starts', async () => {
    endNavigation.mockRejectedValueOnce(new Error('NO_NAVSTART'))
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('click', [])

    await handler._afterCmd('click')

    expect(dispose).toHaveBeenCalled()
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
})

test('enablePerformanceAudits: applies some default values', () => {
    const handler = createHandler()
    handler.enablePerformanceAudits()

    expect(handler['_networkThrottling']).toBe('online')
    expect(handler['_cpuThrottling']).toBe(0)
    expect(handler['_cacheEnabled']).toBe(false)
    expect(handler['_formFactor']).toBe('desktop')
})

test('enablePerformanceAudits: applies some custom values', () => {
    const handler = createHandler()
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

test('enablePerformanceAudits throws for invalid profiles', () => {
    const handler = createHandler()
    expect(() => handler.enablePerformanceAudits({ networkThrottling: 'super fast 3g' } as any))
        .toThrow(/Network throttling profile/)
    expect(() => handler.enablePerformanceAudits({
        networkThrottling: 'Good 3G',
        cpuThrottling: '34'
    } as any)).toThrow(/CPU throttling rate needs to be typeof number/)
})

test('disablePerformanceAudits', () => {
    const handler = createHandler()
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
    const handler = createHandler()

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

test('checkPWA', async () => {
    const handler = createHandler()
    await expect(handler.checkPWA(['viewport'])).resolves.toEqual({ passed: true, details: {} })
})

test('swallows dispose errors when cancelling a click without navigation', async () => {
    dispose.mockImplementation(() => {
        throw new Error('already closed')
    })
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    await handler._beforeCmd('click', [])

    await handler._afterCmd('click')
    expect(new Auditor().updateCommands).toHaveBeenCalledWith(browser, expect.any(Function))
})

test('setThrottlingProfile throws when the page is missing', async () => {
    const handler = createHandler()
    // @ts-expect-error simulate a missing page
    handler['_page'] = undefined
    await expect(handler.setThrottlingProfile()).rejects.toThrow('No page or session has been captured yet')
})

test('ignores websocket events that cannot be stringified', () => {
    const handler = createHandler()
    handler['_devtoolsGatherer'] = { onMessage: vi.fn() } as any
    const params = {} as { self?: unknown }
    params.self = params
    handler['_propagateWSEvents']({ method: 'Network.dataReceived', params })
    expect(handler['_devtoolsGatherer']?.onMessage).toBeCalledTimes(1)
    expect(browser.emit).toBeCalledWith('Network.dataReceived', params)
})

test('uses the mobile Lighthouse config when requested', async () => {
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    handler['_formFactor'] = 'mobile'

    await handler._beforeCmd('url', ['https://webdriver.io'])
    expect(startFlow.mock.calls[0][1].config).toBeUndefined()
    expect(startFlow.mock.calls[0][1].flags.formFactor).toBe('mobile')
    expect(startFlow.mock.calls[0][1].flags.screenEmulation).toBeUndefined()
})

test('disables Lighthouse screen emulation only for formFactor none', async () => {
    const handler = createHandler()
    handler.setThrottlingProfile = vi.fn()
    handler['_shouldRunPerformanceAudits'] = true
    handler['_formFactor'] = 'none'

    await handler._beforeCmd('url', ['https://webdriver.io'])
    expect(startFlow.mock.calls[0][1].flags.screenEmulation).toEqual({ disabled: true })
})
