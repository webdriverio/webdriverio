import type Protocol from 'devtools-protocol'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { HTTPRequest } from 'puppeteer-core/lib/cjs/puppeteer/common/HTTPRequest'

import TraceGatherer from '../../src/gatherer/trace'
import { FRAME_LOAD_START_TIMEOUT, CLICK_TRANSITION } from '../../src/constants'
import type { GathererDriver } from '../../src/types'

import TRACELOG from '../__fixtures__/tracelog.json'

let traceGatherer: TraceGatherer

const pageMock = {
    on: jest.fn(),
    evaluateOnNewDocument: jest.fn()
}

const sessionMock = {
    on: jest.fn(),
    emit: jest.fn(),
    send: jest.fn(),
    off: jest.fn(),
    _connection: {
        _transport: {
            _ws: { addEventListener: jest.fn() }
        }
    }
}

const frame = {
    id: '123',
    loaderId: 'foobar123',
    url: 'http://foobar.com'
}

const driver = {
    beginTrace: jest.fn(),
    endTrace: jest.fn().mockReturnValue(Promise.resolve(TRACELOG))
} as any as GathererDriver

jest.useFakeTimers('legacy')

beforeEach(() => {
    pageMock.on.mockClear()
    pageMock.evaluateOnNewDocument.mockClear()
    sessionMock.on.mockClear()
    traceGatherer = new TraceGatherer(
        sessionMock as unknown as CDPSession,
        pageMock as unknown as Page,
        driver
    )
    traceGatherer.emit = jest.fn()
    ;(traceGatherer['_driver'] as any).beginTrace.mockClear()
    ;(driver.beginTrace as jest.Mock).mockClear()
    ;(driver.endTrace as jest.Mock).mockClear()
})

test('should register eventlisteners for network monitor', () => {
    const statusMonitor = { dispatch: jest.fn() }
    traceGatherer['_networkStatusMonitor'] = statusMonitor as any
    for (const fn of Object.values(traceGatherer['_networkListeners'])) {
        fn({ some: 'params' })
    }
    expect(statusMonitor.dispatch.mock.calls)
        .toMatchSnapshot()
})

test('onFrameLoadFail', () => {
    traceGatherer.onFrameLoadFail({
        frame: () => undefined
    } as unknown as HTTPRequest)
    expect(traceGatherer['_failingFrameLoadIds']).toEqual([])
    traceGatherer.onFrameLoadFail({
        frame: () => ({ _id: '123' })
    } as unknown as HTTPRequest)
    expect(traceGatherer['_failingFrameLoadIds']).toEqual(['123'])
})

test('getter isTracing', () => {
    expect(traceGatherer.isTracing).toBe(false)

    traceGatherer['_traceStart'] = Date.now()
    expect(traceGatherer.isTracing).toBe(true)
})

test('finishTracing', async () => {
    traceGatherer['_pageLoadDetected'] = true
    traceGatherer['_networkStatusMonitor'] = {} as any
    traceGatherer['_traceStart'] = 123
    traceGatherer['_frameId'] = 'true'
    traceGatherer['_loaderId'] = 'true'
    traceGatherer['_pageUrl'] = 'http://some.url'

    traceGatherer.finishTracing()
    await new Promise((resolve) => process.nextTick(resolve))

    expect(traceGatherer['_pageLoadDetected']).toBe(false)
    expect(traceGatherer['_networkStatusMonitor']).toBe(undefined)
    expect(traceGatherer['_traceStart']).toBe(undefined)
    expect(traceGatherer['_frameId']).toBe(undefined)
    expect(traceGatherer['_loaderId']).toBe(undefined)
    expect(traceGatherer['_pageUrl']).toBe(undefined)

    expect(sessionMock.off).toHaveBeenCalledTimes(7)
    expect(traceGatherer.emit).toBeCalledWith('tracingFinished')
})

test('onFrameNavigated', () => {
    expect(traceGatherer['_frameId']).toBe(undefined)
    expect(traceGatherer['_loaderId']).toBe(undefined)
    expect(traceGatherer['_pageUrl']).toBe(undefined)
    traceGatherer['_traceStart'] = Date.now()

    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toBeCalledWith('tracingStarted', '123')

    expect(traceGatherer['_frameId']).toBe('123')
    expect(traceGatherer['_loaderId']).toBe('foobar123')
    expect(traceGatherer['_pageUrl']).toBe('http://foobar.com')
})

test('onFrameNavigated: should not start if frame was detected', () => {
    traceGatherer['_frameId'] = '123'
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if a subframe was detected', () => {
    const subFrame = Object.assign({}, frame, { parentId: 122 })
    traceGatherer.onFrameNavigated({ frame: subFrame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if url is not supported', () => {
    const subFrame = Object.assign({}, frame, { url: 'data:,foobar' })
    traceGatherer.onFrameNavigated({ frame: subFrame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if tracing is not started', () => {
    traceGatherer['_traceStart'] = undefined
    traceGatherer.finishTracing = jest.fn()
    traceGatherer['_failingFrameLoadIds'].push('123')
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should cancel trace if page load failed', () => {
    traceGatherer['_traceStart'] = Date.now()
    traceGatherer.finishTracing = jest.fn()
    traceGatherer['_failingFrameLoadIds'].push('123')
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledWith('tracingError', expect.any(Error))
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
})

test('onFrameNavigated: can detect page load', () => {
    traceGatherer['_clickTraceTimeout'] = 123 as unknown as NodeJS.Timeout
    traceGatherer['_traceStart'] = Date.now()

    expect(traceGatherer['_pageLoadDetected']).toBe(false)
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer['_pageLoadDetected']).toBe(true)
})

test('startTracing', async () => {
    await traceGatherer.startTracing('http://foobar.com')

    expect(sessionMock.on).toHaveBeenCalledTimes(7)
    expect(pageMock.evaluateOnNewDocument).toHaveBeenCalledTimes(1)
    expect((traceGatherer['_driver'] as any).beginTrace).toHaveBeenCalledTimes(1)
})

test('startTracing: registers timeout for click events', async () => {
    traceGatherer.finishTracing = jest.fn()

    await traceGatherer.startTracing(CLICK_TRANSITION)
    jest.advanceTimersByTime(FRAME_LOAD_START_TIMEOUT + 10)
    expect((traceGatherer['_driver'] as any).beginTrace).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => process.nextTick(resolve))
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
})

test('completeTracing', async () => {
    traceGatherer.finishTracing = jest.fn()
    await traceGatherer.completeTracing()
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
    expect(traceGatherer.emit).toBeCalledWith('tracingComplete', expect.any(Object))
})

test('completeTracing: in failure case', async () => {
    traceGatherer.finishTracing = jest.fn()
    ;(traceGatherer['_driver'] as any).endTrace.mockReturnValue(Promise.reject(new Error('boom')))
    await traceGatherer.completeTracing()
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
    expect(traceGatherer.emit).toBeCalledWith('tracingError', expect.any(Error))
})

test('onLoadEventFired', async () => {
    await traceGatherer.onLoadEventFired()
    traceGatherer['_traceStart'] = Date.now()
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    traceGatherer['_waitForNetworkIdleEvent'] = {
        promise: new Promise<void>((resolve) => {
            jest.advanceTimersByTime(50)
            resolve()
        }),
        cancel: jest.fn()
    }
    traceGatherer['_waitForCPUIdleEvent'] = {
        promise: new Promise<void>((resolve) => {
            jest.advanceTimersByTime(100)
            resolve()
        }),
        cancel: jest.fn()
    }

    process.nextTick(() => jest.advanceTimersByTime(15000))
    await traceGatherer.onLoadEventFired()
    expect(traceGatherer.completeTracing).toHaveBeenCalledTimes(1)
})

test('onLoadEventFired: using min trace time', async () => {
    traceGatherer['_traceStart'] = Date.now() - 9700
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    const doneCb = jest.fn()
    traceGatherer.waitForMaxTimeout = jest.fn().mockReturnValue(new Promise((resolve) => {
        jest.advanceTimersByTime(150)
        resolve(doneCb)
    }))

    await traceGatherer.onLoadEventFired()
    expect(doneCb).toBeCalledTimes(1)
})

test('waitForMaxTimeout', async () => {
    traceGatherer.completeTracing = jest.fn()
    process.nextTick(() => jest.advanceTimersByTime(200))
    const done = await traceGatherer.waitForMaxTimeout(200)
    done()
    expect(traceGatherer.completeTracing).toHaveBeenCalledTimes(1)
})
