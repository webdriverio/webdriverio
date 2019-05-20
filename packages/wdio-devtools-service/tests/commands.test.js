import EventEmitter from 'events'
import CommandHandler from '../src/commands'

class MyEmitter extends EventEmitter {}

jest.mock('../src/utils', () => ({
    readIOStream: jest.fn().mockReturnValue('foobar'),
    sumByKey: jest.fn().mockReturnValue('foobar')
}))

test('initialization', () => {
    const clientMock = { on: jest.fn() }
    const browserMock = { addCommand: jest.fn(), emit: jest.fn() }
    new CommandHandler(clientMock, browserMock)
    expect(browserMock.addCommand.mock.calls).toHaveLength(8)
    expect(clientMock.on).toBeCalled()

    const event = { method: 'foobar.bar', params: 123 }
    expect(browserMock.emit).not.toBeCalled()
    clientMock.on.mock.calls[4][1](event)
    expect(browserMock.emit).toBeCalled()
})

test('cdp', async () => {
    const clientMock = {
        on: jest.fn(),
        Network: {
            enable: jest.fn().mockImplementation((args, cb) => cb(null, 'foobar'))
        }
    }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)

    expect(() => handler.cdp('foobar', 'enable')).toThrow()
    expect(() => handler.cdp('Network', 'foobar')).toThrow()
    expect(await handler.cdp('Network', 'enable')).toBe('foobar')
})

test('cdpConnection', () => {
    const clientMock = {
        on: jest.fn(),
        host: 'localhost',
        port: 8473,
        foo: 'bar'
    }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)

    expect(handler.cdpConnection()).toEqual({ host: 'localhost', port: 8473 })
})

test('getNodeId', async () => {
    const clientMock = { on: jest.fn() }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)

    handler.cdp = jest.fn()
        .mockReturnValueOnce({ root: { nodeId: 123 } })
        .mockReturnValueOnce({ nodeId: 42 })
    expect(await handler.getNodeId('selector')).toBe(42)
    expect(handler.cdp.mock.calls[0]).toEqual(['DOM', 'getDocument'])
    expect(handler.cdp.mock.calls[1]).toEqual(
        ['DOM', 'querySelector', { nodeId: 123, selector: 'selector' }])
})

test('getNodeIds', async () => {
    const clientMock = { on: jest.fn() }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)

    handler.cdp = jest.fn()
        .mockReturnValueOnce({ root: { nodeId: 123 } })
        .mockReturnValueOnce({ nodeIds: [1, 2, 3] })
    expect(await handler.getNodeIds('selector')).toEqual([1, 2, 3])
    expect(handler.cdp.mock.calls[0]).toEqual(['DOM', 'getDocument'])
    expect(handler.cdp.mock.calls[1]).toEqual(
        ['DOM', 'querySelectorAll', { nodeId: 123, selector: 'selector' }])
})

test('startTracing', () => {
    const clientMock = { on: jest.fn() }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)
    handler.cdp = jest.fn()

    handler.startTracing()

    expect(handler.isTracing).toBe(true)
    expect(::handler.startTracing).toThrow()
})

test('endTracing', async () => {
    const clientMock = { on: jest.fn() }
    const browserMock = new MyEmitter()
    browserMock.addCommand = jest.fn()

    const handler = new CommandHandler(clientMock, browserMock)
    handler.cdp = jest.fn()
    handler.isTracing = true

    process.nextTick(() => browserMock.emit('Tracing.tracingComplete', { stream: 42 }))
    const stream = await handler.endTracing()

    expect(handler.cdp).toBeCalledWith('Tracing', 'end')
    expect(stream).toBe(42)
    expect(handler.traceEvents).toBe('foobar')
    expect(handler.isTracing).toBe(false)
})

test('endTracing throws if not tracing', async () => {
    const clientMock = { on: jest.fn() }
    const browserMock = new MyEmitter()
    browserMock.addCommand = jest.fn()

    const handler = new CommandHandler(clientMock, browserMock)
    await expect(handler.endTracing()).rejects.toBeInstanceOf(Error)
})

test('getPageWeight', () => {
    const clientMock = { on: jest.fn() }
    const browserMock = { addCommand: jest.fn() }
    const handler = new CommandHandler(clientMock, browserMock)
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
