import NetworkInterception from '../../../src/utils/interception/webdriver'

const browserMock = {
    mockRequest: jest.fn().mockReturnValue({ mockId: 123 }),
    mockCalls: jest.fn().mockReturnValue([1, 2, 3]),
    clearMockCalls: jest.fn().mockReturnValue({}),
    restoreMockCalls: jest.fn().mockReturnValue({}),
    respondMock: jest.fn().mockReturnValue({}),
    call: jest.fn((cb) => cb())
}

beforeEach(() => {
    browserMock.mockRequest.mockClear()
    browserMock.mockCalls.mockClear()
    browserMock.clearMockCalls.mockClear()
    browserMock.restoreMockCalls.mockClear()
    browserMock.respondMock.mockClear()
    browserMock.call.mockClear()
})

test('init', async () => {
    const mock = new NetworkInterception('**/foobar/**', { foo: 'bar' }, browserMock)
    await mock.init()
    expect(browserMock.mockRequest).toBeCalledWith('**/foobar/**', { foo: 'bar' })
    expect(mock.mockId).toBe(123)
})

test('calls', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.calls).toEqual([1, 2, 3])
    expect(browserMock.mockCalls).toBeCalledWith(123)
})

test('clear', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.clear()).toEqual({})
    expect(browserMock.clearMockCalls).toBeCalledWith(123)
})

test('restore', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.restore()).toEqual({})
    expect(browserMock.clearMockCalls).toBeCalledWith(123, true)
})

test('respond', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.respond('foo', 'bar')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            overwrite: 'foo',
            params: 'bar',
            sticky: true
        }
    )
})

test('respond without params', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.respond('foo')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            overwrite: 'foo',
            params: {},
            sticky: true
        }
    )
})

test('respondOnce', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.respondOnce('foo', 'bar')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            overwrite: 'foo',
            params: 'bar'
        }
    )
})

test('respondOnce without params', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()
    expect(await mock.respondOnce('foo')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            overwrite: 'foo',
            params: {}
        }
    )
})

test('abort', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()

    expect(await mock.abort('InternetDisconnected')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            errorReason: 'InternetDisconnected',
            sticky: true
        }
    )
})

test('abort fails if invalid error reason was provided', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    expect.assertions(1)

    try {
        await mock.abort('foo')
    } catch (err) {
        expect(err.message).toContain('Invalid value for errorReason')
    }
})

test('abortOnce', async () => {
    const mock = new NetworkInterception('**/foobar/**', {}, browserMock)
    await mock.init()

    expect(await mock.abortOnce('InternetDisconnected')).toEqual({})
    expect(browserMock.respondMock).toBeCalledWith(
        123,
        {
            errorReason: 'InternetDisconnected',
            sticky: false
        }
    )
})
