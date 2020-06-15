import NetworkInterception from '../../../src/utils/interception/devtools'

const cdpClient = {
    send: jest.fn().mockReturnValue(Promise.resolve({
        body: 'eyJmb28iOiJiYXIifQ==',
        base64Encoded: true
    }))
}

beforeEach(() => {
    cdpClient.send.mockClear()
})

test('allows to access network calls', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/barfoo/test.html' },
        responseHeaders: []
    })
    expect(mock.calls.length).toBe(1)
})

test('allows to filter network calls by header', async () => {
    const mock = new NetworkInterception('**/foobar/**', {
        headers: { 'Content-Type': 'text/xml' }
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'text/xml' }]
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'foobar' }]
    })
    expect(mock.calls.length).toBe(1)
})

test('allows to filter network calls by method', async () => {
    const mock = new NetworkInterception('**/foobar/**', {
        method: 'put'
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html', method: 'PUT' },
        responseHeaders: []
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html', method: 'POST' },
        responseHeaders: []
    })
    expect(mock.calls.length).toBe(1)
})

test('decodes base64 responses', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'foobar' }]
    })

    expect(mock.calls[0].body).toEqual({ foo: 'bar' })
    expect(mock.calls[1].body).toBe('{"foo":"bar"}')
})

test('abort request', async () => {
    const request = {
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    }
    const mock = new NetworkInterception('**/foobar/**')
    expect(::mock.abort).toThrow()
    expect(() => mock.abort('foobar')).toThrow()

    mock.abortOnce('NameNotResolved')
    mock.abort('ConnectionFailed')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])(request)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'NameNotResolved'
        }
    )

    await NetworkInterception.handleRequestInterception(cdpClient, [mock])(request)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'ConnectionFailed'
        }
    )

    await NetworkInterception.handleRequestInterception(cdpClient, [mock])(request)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'ConnectionFailed'
        }
    )
})

test('stub request with an object', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond({ foo: 'bar' })
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })

    expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
})

test('stub request with a text', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond('foobar')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })

    expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
})

test('allows to clear mocks', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.calls.length).toBe(1)
    mock.clear()
    expect(mock.calls.length).toBe(0)
})

test('allows to restore mocks', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respondOnce({ foo: 'bar' })
    mock.respond({ bar: 'foo' })

    expect(mock.respondOverwrites.length).toBe(2)
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.respondOverwrites.length).toBe(1)
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.respondOverwrites.length).toBe(1)

    mock.restore()
    expect(mock.respondOverwrites.length).toBe(0)
})
