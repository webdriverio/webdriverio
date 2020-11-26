import type Protocol from 'devtools-protocol'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { HTTPRequest } from 'puppeteer-core/lib/cjs/puppeteer/common/HTTPRequest'
import type { WaitPromise } from '../../src/gatherer/trace'

import TraceGatherer from '../../src/gatherer/trace'
import { FRAME_LOAD_START_TIMEOUT, CLICK_TRANSITION } from '../../src/constants'

import TRACELOG from '../__fixtures__/tracelog.json'

let traceGatherer: TraceGatherer

const pageMock = {
    on: jest.fn(),
    tracing: {
        start: jest.fn(),
        stop: jest.fn().mockReturnValue(Promise.resolve(Buffer.from(JSON.stringify(TRACELOG))))
    },
    evaluateOnNewDocument: jest.fn()
}

const sessionMock = {
    on: jest.fn(),
    emit: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn()
}

const frame = {
    id: '123',
    loaderId: 'foobar123',
    url: 'http://foobar.com'
}

jest.useFakeTimers()

beforeEach(() => {
    pageMock.on.mockClear()
    pageMock.tracing.start.mockClear()
    pageMock.tracing.stop.mockClear()
    pageMock.evaluateOnNewDocument.mockClear()
    sessionMock.on.mockClear()
    traceGatherer = new TraceGatherer(
        sessionMock as unknown as CDPSession,
        pageMock as unknown as Page
    )
    traceGatherer.emit = jest.fn()
})

test('should register eventlisteners for network monitor', () => {
    traceGatherer['_networkStatusMonitor'] = { dispatch: jest.fn() }
    for (const fn of Object.values(traceGatherer['_networkListeners'])) {
        fn({ some: 'params' })
    }
    expect(traceGatherer['_networkStatusMonitor'].dispatch.mock.calls)
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
    traceGatherer['_networkStatusMonitor'] = true
    traceGatherer['_traceStart'] = 123
    traceGatherer['_frameId'] = 'true'
    traceGatherer['_loaderId'] = 'true'
    traceGatherer['_pageUrl'] = 'http://some.url'
    traceGatherer['_waitForNetworkIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise
    traceGatherer['_waitForCPUIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise

    traceGatherer.finishTracing()
    await new Promise((resolve) => process.nextTick(resolve))

    expect(traceGatherer['_pageLoadDetected']).toBe(false)
    expect(traceGatherer['_networkStatusMonitor']).toBe(undefined)
    expect(traceGatherer['_traceStart']).toBe(undefined)
    expect(traceGatherer['_frameId']).toBe(undefined)
    expect(traceGatherer['_loaderId']).toBe(undefined)
    expect(traceGatherer['_pageUrl']).toBe(undefined)

    expect(sessionMock.removeListener).toHaveBeenCalledTimes(7)
    expect(traceGatherer['_waitForNetworkIdleEvent'].cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer['_waitForCPUIdleEvent'].cancel).toHaveBeenCalledTimes(1)
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
    traceGatherer['_waitForNetworkIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise
    traceGatherer['_waitForCPUIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(0)
    expect(traceGatherer['_waitForNetworkIdleEvent'].cancel).toHaveBeenCalledTimes(0)
    expect(traceGatherer['_waitForCPUIdleEvent'].cancel).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should cancel trace if page load failed', () => {
    traceGatherer['_traceStart'] = Date.now()
    traceGatherer.finishTracing = jest.fn()
    traceGatherer['_failingFrameLoadIds'].push('123')
    traceGatherer['_waitForNetworkIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise
    traceGatherer['_waitForCPUIdleEvent'] = { cancel: jest.fn() } as unknown as WaitPromise
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer.emit).toHaveBeenCalledWith('tracingError', expect.any(Error))
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
    expect(traceGatherer['_waitForNetworkIdleEvent'].cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer['_waitForCPUIdleEvent'].cancel).toHaveBeenCalledTimes(1)
})

test('onFrameNavigated: can detect page load', () => {
    traceGatherer['_clickTraceTimeout'] = 123 as unknown as NodeJS.Timeout
    traceGatherer['_traceStart'] = Date.now()

    expect(traceGatherer['_pageLoadDetected']).toBe(false)
    traceGatherer.onFrameNavigated({ frame } as unknown as Protocol.Page.FrameNavigatedEvent)
    expect(traceGatherer['_pageLoadDetected']).toBe(true)
})

test('startTracing', async () => {
    traceGatherer.waitForNetworkIdle = jest.fn()
    traceGatherer.waitForCPUIdle = jest.fn()
    await traceGatherer.startTracing('http://foobar.com')

    expect(sessionMock.on).toHaveBeenCalledTimes(7)
    expect(pageMock.tracing.start).toHaveBeenCalledTimes(1)
    expect(pageMock.evaluateOnNewDocument).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForNetworkIdle).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForCPUIdle).toHaveBeenCalledTimes(1)
})

test('startTracing: registers timeout for click events', async () => {
    traceGatherer.waitForNetworkIdle = jest.fn()
    traceGatherer.waitForCPUIdle = jest.fn()
    traceGatherer.finishTracing = jest.fn()

    await traceGatherer.startTracing(CLICK_TRANSITION)
    jest.advanceTimersByTime(FRAME_LOAD_START_TIMEOUT + 10)
    expect(pageMock.tracing.stop).toHaveBeenCalledTimes(1)
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
    pageMock.tracing.stop.mockReturnValue(Promise.reject(new Error('boom')))
    await traceGatherer.completeTracing()
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
    expect(traceGatherer.emit).toBeCalledWith('tracingError', expect.any(Error))
})

test('onLoadEventFired', async () => {
    await traceGatherer.onLoadEventFired()
    traceGatherer['_traceStart'] = Date.now()
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    traceGatherer['_waitForNetworkIdleEvent'] = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(50)
            resolve()
        }),
        cancel: jest.fn()
    }
    traceGatherer['_waitForCPUIdleEvent'] = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(100)
            resolve()
        }),
        cancel: jest.fn()
    }

    process.nextTick(() => jest.advanceTimersByTime(10000))
    await traceGatherer.onLoadEventFired()
    expect(traceGatherer['_waitForNetworkIdleEvent'].cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer['_waitForCPUIdleEvent'].cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.completeTracing).toHaveBeenCalledTimes(1)
})

test('onLoadEventFired: using min trace time', async () => {
    traceGatherer['_traceStart'] = Date.now() - 9700
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    const doneCb = jest.fn()
    traceGatherer['_waitForNetworkIdleEvent'] = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(50)
            resolve()
        }),
        cancel: jest.fn()
    }
    traceGatherer['_waitForCPUIdleEvent'] = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(10)
            resolve()
        }),
        cancel: jest.fn()
    }
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
