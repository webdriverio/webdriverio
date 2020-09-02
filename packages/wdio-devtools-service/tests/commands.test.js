import CommandHandler from '../src/commands'

jest.mock('../src/utils', () => ({
    readIOStream: jest.fn().mockReturnValue('foobar'),
    sumByKey: jest.fn().mockReturnValue('foobar')
}))

const pageMock = {
    tracing: {
        start: jest.fn(),
        stop: jest.fn()
    }
}

const sessionMock = {
    on: jest.fn(),
    emit: jest.fn(),
    send: jest.fn()
}

beforeEach(() => {
    pageMock.tracing.start.mockClear()
    pageMock.tracing.stop.mockClear()
    sessionMock.on.mockClear()
    sessionMock.emit.mockClear()
    sessionMock.send.mockClear()
    global.browser = {
        addCommand: jest.fn()
    }
})

test('initialization', () => {
    new CommandHandler(sessionMock, pageMock)
    expect(global.browser.addCommand.mock.calls).toHaveLength(7)
    expect(sessionMock.on).toBeCalled()
})

test('cdp', async () => {
    sessionMock.send.mockReturnValue(Promise.resolve('foobar'))
    const handler = new CommandHandler(sessionMock, pageMock)
    expect(await handler.cdp('Network', 'enable')).toBe('foobar')
    expect(sessionMock.send).toBeCalledWith('Network.enable', {})
})

test('getNodeId', async () => {
    sessionMock.send.mockResolvedValueOnce({ root: { nodeId: 123 } })
    sessionMock.send.mockResolvedValueOnce({ nodeId: 42 })
    const handler = new CommandHandler(sessionMock, pageMock)

    expect(await handler.getNodeId('selector')).toBe(42)
    expect(sessionMock.send).toBeCalledWith('DOM.getDocument')
    expect(sessionMock.send).toBeCalledWith(
        'DOM.querySelector',
        { nodeId: 123, selector: 'selector' })
})

test('getNodeIds', async () => {
    sessionMock.send.mockResolvedValueOnce({ root: { nodeId: 123 } })
    sessionMock.send.mockResolvedValueOnce({ nodeIds: [42, 43] })
    const handler = new CommandHandler(sessionMock, pageMock)

    expect(await handler.getNodeIds('selector')).toEqual([42, 43])
    expect(sessionMock.send).toBeCalledWith('DOM.getDocument')
    expect(sessionMock.send).toBeCalledWith(
        'DOM.querySelectorAll',
        { nodeId: 123, selector: 'selector' })
})

test('startTracing', () => {
    const handler = new CommandHandler(sessionMock, pageMock)
    handler.startTracing()

    expect(handler.isTracing).toBe(true)
    expect(handler.startTracing.bind(handler)).toThrow()
    expect(pageMock.tracing.start).toBeCalledTimes(1)
})

test('endTracing', async () => {
    pageMock.tracing.stop.mockResolvedValue(Buffer.from('{ "traceEvents": "foobar" }'))
    const handler = new CommandHandler(sessionMock, pageMock)
    handler.isTracing = true

    const traceEvents = await handler.endTracing()
    expect(pageMock.tracing.stop).toBeCalledTimes(1)
    expect(traceEvents).toEqual({ traceEvents: 'foobar' })
    expect(handler.isTracing).toBe(false)
})

test('endTracing throws if not tracing', async () => {
    const handler = new CommandHandler(sessionMock, pageMock)
    await expect(handler.endTracing()).rejects.toBeInstanceOf(Error)
})

test('getPageWeight', () => {
    const handler = new CommandHandler(sessionMock, pageMock)
    handler.networkHandler.requestTypes = {
        Document: { size: 23343, encoded: 7674, count: 1 },
        Image: { size: 53479, encoded: 53479, count: 6 },
        Other: { size: 0, encoded: 0, count: 1 }
    }

    const { pageWeight, transferred, requestCount, details } = handler.getPageWeight()
    expect(pageWeight).toBe('foobar')
    expect(transferred).toBe('foobar')
    expect(requestCount).toBe('foobar')
    expect(details).toEqual(handler.networkHandler.requestTypes)
})
