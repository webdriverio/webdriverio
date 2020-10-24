import TraceGatherer from '../../src/gatherer/trace'
import { FRAME_LOAD_START_TIMEOUT, CLICK_TRANSITION } from '../../src/constants'

import TRACELOG from '../__fixtures__/tracelog.json'

let traceGatherer

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
    id: 123,
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
    traceGatherer = new TraceGatherer(sessionMock, pageMock)
    traceGatherer.emit = jest.fn()
})

test('should register eventlisteners for network monitor', () => {
    traceGatherer.networkStatusMonitor = { dispatch: jest.fn() }
    for (const fn of Object.values(traceGatherer.networkListeners)) {
        fn({ some: 'params' })
    }
    expect(traceGatherer.networkStatusMonitor.dispatch.mock.calls)
        .toMatchSnapshot()
})

test('onFrameLoadFail', () => {
    traceGatherer.onFrameLoadFail({ frame: () => ({ _id: 123 }) })
    expect(traceGatherer.failingFrameLoadIds).toEqual([123])
})

test('getter isTracing', () => {
    expect(traceGatherer.isTracing).toBe(false)

    traceGatherer.traceStart = Date.now()
    expect(traceGatherer.isTracing).toBe(true)
})

test('finishTracing', async () => {
    traceGatherer.pageLoadDetected = true
    traceGatherer.networkStatusMonitor = true
    traceGatherer.traceStart = true
    traceGatherer.frameId = true
    traceGatherer.loaderId = true
    traceGatherer.pageUrl = true
    traceGatherer.waitForNetworkIdleEvent = { cancel: jest.fn() }
    traceGatherer.waitForCPUIdleEvent = { cancel: jest.fn() }

    traceGatherer.finishTracing()
    await new Promise((resolve) => process.nextTick(resolve))

    expect(traceGatherer.pageLoadDetected).toBe(false)
    expect(traceGatherer.networkStatusMonitor).toBe(undefined)
    expect(traceGatherer.traceStart).toBe(undefined)
    expect(traceGatherer.frameId).toBe(undefined)
    expect(traceGatherer.loaderId).toBe(undefined)
    expect(traceGatherer.pageUrl).toBe(undefined)

    expect(sessionMock.removeListener).toHaveBeenCalledTimes(7)
    expect(traceGatherer.waitForNetworkIdleEvent.cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForCPUIdleEvent.cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.emit).toBeCalledWith('tracingFinished')
})

test('onFrameNavigated', () => {
    expect(traceGatherer.frameId).toBe(undefined)
    expect(traceGatherer.loaderId).toBe(undefined)
    expect(traceGatherer.pageUrl).toBe(undefined)
    traceGatherer.traceStart = Date.now()

    traceGatherer.onFrameNavigated({ frame })
    expect(traceGatherer.emit).toBeCalledWith('tracingStarted', 123)

    expect(traceGatherer.frameId).toBe(123)
    expect(traceGatherer.loaderId).toBe('foobar123')
    expect(traceGatherer.pageUrl).toBe('http://foobar.com')
})

test('onFrameNavigated: should not start if frame was detected', () => {
    traceGatherer.frameId = 123
    traceGatherer.onFrameNavigated({ frame })
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if a subframe was detected', () => {
    const subFrame = Object.assign({}, frame, { parentId: 122 })
    traceGatherer.onFrameNavigated({ frame: subFrame })
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if url is not supported', () => {
    const subFrame = Object.assign({}, frame, { url: 'data:,foobar' })
    traceGatherer.onFrameNavigated({ frame: subFrame })
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should not start if tracing is not started', () => {
    traceGatherer.traceStart = undefined
    traceGatherer.finishTracing = jest.fn()
    traceGatherer.failingFrameLoadIds.push(123)
    traceGatherer.waitForNetworkIdleEvent = { cancel: jest.fn() }
    traceGatherer.waitForCPUIdleEvent = { cancel: jest.fn() }
    traceGatherer.onFrameNavigated({ frame })
    expect(traceGatherer.emit).toHaveBeenCalledTimes(0)
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(0)
    expect(traceGatherer.waitForNetworkIdleEvent.cancel).toHaveBeenCalledTimes(0)
    expect(traceGatherer.waitForCPUIdleEvent.cancel).toHaveBeenCalledTimes(0)
})

test('onFrameNavigated: should cancel trace if page load failed', () => {
    traceGatherer.traceStart = Date.now()
    traceGatherer.finishTracing = jest.fn()
    traceGatherer.failingFrameLoadIds.push(123)
    traceGatherer.waitForNetworkIdleEvent = { cancel: jest.fn() }
    traceGatherer.waitForCPUIdleEvent = { cancel: jest.fn() }
    traceGatherer.onFrameNavigated({ frame })
    expect(traceGatherer.emit).toHaveBeenCalledWith('tracingError', expect.any(Error))
    expect(traceGatherer.finishTracing).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForNetworkIdleEvent.cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForCPUIdleEvent.cancel).toHaveBeenCalledTimes(1)
})

test('onFrameNavigated: can detect page load', () => {
    traceGatherer.clickTraceTimeout = true
    traceGatherer.traceStart = Date.now()

    expect(traceGatherer.pageLoadDetected).toBe(false)
    traceGatherer.onFrameNavigated({ frame })
    expect(traceGatherer.pageLoadDetected).toBe(true)
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
    traceGatherer.traceStart = Date.now()
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    traceGatherer.waitForNetworkIdleEvent = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(50)
            resolve()
        }),
        cancel: jest.fn()
    }
    traceGatherer.waitForCPUIdleEvent = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(100)
            resolve()
        }),
        cancel: jest.fn()
    }

    process.nextTick(() => jest.advanceTimersByTime(10000))
    await traceGatherer.onLoadEventFired()
    expect(traceGatherer.waitForNetworkIdleEvent.cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.waitForCPUIdleEvent.cancel).toHaveBeenCalledTimes(1)
    expect(traceGatherer.completeTracing).toHaveBeenCalledTimes(1)
})

test('onLoadEventFired: using min trace time', async () => {
    traceGatherer.traceStart = Date.now() - 9700
    traceGatherer.completeTracing = jest.fn().mockReturnValue(Promise.resolve('yeahh'))

    const doneCb = jest.fn()
    traceGatherer.waitForNetworkIdleEvent = {
        promise: new Promise((resolve) => {
            jest.advanceTimersByTime(50)
            resolve()
        }),
        cancel: jest.fn()
    }
    traceGatherer.waitForCPUIdleEvent = {
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
