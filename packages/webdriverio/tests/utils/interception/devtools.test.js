import { canAccess } from '@wdio/utils'

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

describe('filter by header', () => {
    const mockWithCall = async (filter) => {
        const mock = new NetworkInterception('**/foobar/**', filter)
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test1.html', method: 'put' },
            responseHeaders: [{ name: 'Content-Type', value: 'text/xml' }]
        })
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test2.html', method: 'put' },
            responseHeaders: [{ name: 'Content-Type', value: 'foobar' }]
        })
        return mock
    }

    test('filter network calls by header - 1 match', async () => {
        const mock = await mockWithCall({
            method: 'put',
            headers: { 'Content-Type': 'text/xml' }
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })

    test('filter network calls by header - no match value', async () => {
        const mock = await mockWithCall({
            headers: { 'Content-Type': 'no match' }
        })
        expect(mock.calls.length).toBe(0)
    })

    test('filter network calls by header - no match key', async () => {
        const mock = await mockWithCall({
            headers: { 'foo': 'bar' }
        })
        expect(mock.calls.length).toBe(0)
    })
})

describe('filter by postData', () => {
    const mockWithCall = async (filter) => {
        const mock = new NetworkInterception('**/foobar/**', filter)
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test1.html', method: 'post', postData: JSON.stringify({ foo: { bar: 'baz' } }) },
            responseHeaders: []
        })
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test2.html', method: 'post', postData: 'foobar' },
            responseHeaders: []
        })
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test3.html', method: 'get' },
            responseHeaders: []
        })
        return mock
    }

    test('filter network calls by postData - exact match', async () => {
        const mock = await mockWithCall({
            postData: 'foobar'
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test2.html')
    })

    test('filter network calls by postData - function comparator', async () => {
        const mock = await mockWithCall({
            postData: (postData) => {
                if (typeof postData !== 'string') {
                    return false
                }
                try {
                    return JSON.parse(postData).foo.bar === 'baz'
                } catch {
                    return false
                }
            }
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })
})

describe('filter by statusCode', () => {
    const mockWithCall = async (filter) => {
        const mock = new NetworkInterception('**/foobar/**', filter)
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test1.html', method: 'post' },
            responseHeaders: [],
            responseStatusCode: 200
        })
        await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
            request: { url: 'http://test.com/foobar/test2.html', method: 'post' },
            responseHeaders: [],
            responseStatusCode: 201
        })
        return mock
    }

    test('filter network calls by statusCode', async () => {
        const mock = await mockWithCall({
            statusCode: 201
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test2.html')
    })
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
    expect(mock.abort.bind(mock)).toThrow()
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

test('stub request with a function', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond(() => 'foobar')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })

    expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
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

test('stub request with a file', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond(__filename)
    canAccess.mockImplementation(() => true)
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })

    const response = cdpClient.send.mock.calls.pop()[1]
    const buff = Buffer.from(response.body, 'base64')
    expect(buff.toString('ascii')).toContain('stub request with a file')
})

test('stub request with a different web resource', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond('http://json.org/image.svg')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }]
    })

    expect(cdpClient.send.mock.calls.pop()[1].responseHeaders).toMatchSnapshot()
})

test('stub request with a different web resource containing different location header', async () => {
    const mock = new NetworkInterception('**/foobar/**')
    mock.respond('http://json.org/image.svg')
    await NetworkInterception.handleRequestInterception(cdpClient, [mock])({
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [
            { name: 'Location', value: 'http://some.other/picture.png' },
            { name: 'Content-Type', value: 'application/json' }
        ]
    })

    expect(cdpClient.send.mock.calls.pop()[1].responseHeaders).toMatchSnapshot()
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
