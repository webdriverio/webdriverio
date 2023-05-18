import { test, expect, vi, beforeEach, describe, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import NetworkInterception from '../../../src/utils/interception/devtools.js'
import type { Browser } from '../../../src/types'

vi.mock('node:fs/promise', () => ({
    default: {
        access: async (filepath: string) => {
            if (filepath.endsWith('/missing/mock-file.txt')) {
                throw new Error('fse mock')
            }
        },
        readFile: async () => Buffer.from('<89>PNG\r^Z\n^@^@^@^MI', 'binary')
    }
}))

const cdpClient: any = {
    send: vi.fn().mockReturnValue(Promise.resolve({
        body: 'eyJmb28iOiJiYXIifQ==',
        base64Encoded: true
    }))
}

const browserMock = {} as any as Browser

const fetchListener = async (mock: any, params: any, client = cdpClient) => {
    const mocks = Array.isArray(mock) ? mock : [mock]
    const reponseParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (!['responseHeaders', 'responseStatusCode'].includes(key)) {
            (acc as any)[key] = val
        }
        return acc
    }, {}) as any

    // Request
    await NetworkInterception.handleRequestInterception(client, mocks as any)(reponseParams)
    // Response
    return NetworkInterception.handleRequestInterception(client, mocks as any)(params)
}

beforeEach(() => {
    cdpClient.send.mockClear()
})

test('allows to access network calls', async () => {
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    await fetchListener(mock, {
        request: { url: 'http://test.com/barfoo/test.html' },
        responseHeaders: []
    })
    expect(mock.calls.length).toBe(1)
})

describe('filter network calls by header', () => {
    const mockWithCall = async (filter: any) => {
        const mock = new NetworkInterception('**/foobar/**', filter, browserMock)
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test1.html', method: 'put' },
            responseHeaders: [{ name: 'Content-Type', value: 'text/xml' }]
        })
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test2.html', method: 'put' },
            responseHeaders: [{ name: 'Content-Type', value: 'foobar' }]
        })
        return mock
    }

    test('1 match', async () => {
        const mock = await mockWithCall({
            method: 'put',
            headers: { 'Content-Type': 'text/xml' }
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })

    test('no match value', async () => {
        const mock = await mockWithCall({
            headers: { 'Content-Type': 'no match' }
        })
        expect(mock.calls.length).toBe(0)
    })

    test('no match key', async () => {
        const mock = await mockWithCall({
            headers: { 'foo': 'bar' }
        })
        expect(mock.calls.length).toBe(0)
    })

    test('comparator fn', async () => {
        const mock = await mockWithCall({
            headers: (headers: any) => Object.entries(headers)
                .some(([, value]: any[]) => value.includes('xml'))
        })
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })
})

describe('filter network calls by postData', () => {
    const mockWithCall = async (filter: any) => {
        const mock = new NetworkInterception('**/foobar/**', filter, browserMock)
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test1.html', method: 'post', postData: JSON.stringify({ foo: { bar: 'baz' } }) },
            responseHeaders: []
        })
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test2.html', method: 'post', postData: 'foobar' },
            responseHeaders: []
        })
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test3.html', method: 'get' },
            responseHeaders: []
        })
        return mock
    }

    test('exact match', async () => {
        const mock = await mockWithCall({
            postData: 'foobar'
        } as any)

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test2.html')
    })

    test('function comparator', async () => {
        const mock = await mockWithCall({
            postData: (postData: any) => {
                if (typeof postData !== 'string') {
                    return false
                }
                try {
                    return JSON.parse(postData).foo.bar === 'baz'
                } catch {
                    return false
                }
            }
        } as any)

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })
})

describe('filter network calls by statusCode', () => {
    const mockWithCall = async (filter: any) => {
        const mock = new NetworkInterception('**/foobar/**', filter, browserMock)
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test1.html', method: 'post' },
            responseHeaders: [],
            responseStatusCode: 200
        })
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test2.html', method: 'post' },
            responseHeaders: [],
            responseStatusCode: 203
        })
        return mock
    }

    test('exact match', async () => {
        const mock = await mockWithCall({
            statusCode: 203
        } as any)

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test2.html')
    })

    test('comparator fn', async () => {
        const mock = await mockWithCall({
            statusCode: (statusCode: number) => statusCode >= 200 && statusCode <= 201
        } as any)

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })
})

describe('filter network calls by method', () => {
    const mockWithCall = async (filter: any) => {
        const mock = new NetworkInterception('**/foobar/**', filter, browserMock)
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test1.html', method: 'PUT' },
            responseHeaders: []
        })
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test2.html', method: 'POST' },
            responseHeaders: []
        })
        return mock
    }

    test('exact match', async () => {
        const mock = await mockWithCall({
            method: 'put'
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test1.html')
    })

    test('comparator fn', async () => {
        const mock = await mockWithCall({
            method: (method: string) => method.toLowerCase() === 'post'
        })

        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].url).toBe('http://test.com/foobar/test2.html')
    })
})

test('decodes base64 responses', async () => {
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'content-Type', value: 'application/json' }]
    })
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'Content-Type', value: 'foobar' }]
    })

    expect(mock.calls[0].body).toEqual({ foo: 'bar' })
    expect(mock.calls[1].body).toBe('{"foo":"bar"}')
})

test('undefined response', async () => {
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    cdpClient.send.mockReturnValueOnce(Promise.resolve({}))
    cdpClient.send.mockReturnValueOnce(Promise.resolve({}))
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'content-Type', value: 'application/json' }]
    })

    expect(mock.calls[0].body).toBeUndefined()
})

test('null response', async () => {
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    cdpClient.send.mockReturnValueOnce(Promise.resolve({ body: 'null' }))
    cdpClient.send.mockReturnValueOnce(Promise.resolve({ body: 'null' }))
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: [{ name: 'content-Type', value: 'application/json' }]
    })

    expect(mock.calls[0].body).toBe('null')
})

test('abort request', async () => {
    const request = {
        requestId: 123,
        request: { url: 'http://test.com/foobar/test.html' },
    }
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    expect(mock.abort.bind(mock)).toThrow()
    expect(() => mock.abort('foobar' as any)).toThrow()

    mock.abortOnce('NameNotResolved')
    mock.abort('ConnectionFailed')

    // Request stage only
    await NetworkInterception.handleRequestInterception(cdpClient, [mock] as any)(request as any)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'NameNotResolved'
        }
    )

    // Request stage only
    await NetworkInterception.handleRequestInterception(cdpClient, [mock] as any)(request as any)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'ConnectionFailed'
        }
    )

    // Request stage only
    await NetworkInterception.handleRequestInterception(cdpClient, [mock] as any)(request as any)
    expect(cdpClient.send).toBeCalledWith(
        'Fetch.failRequest',
        {
            requestId: 123,
            errorReason: 'ConnectionFailed'
        }
    )
})

describe('stub request', () => {
    let mock: any
    const fetchListenerWrapper = (responseHeaders = [{ name: 'Content-Type', value: 'application/json' }]) =>
        fetchListener(mock, {
            requestId: 123,
            request: { url: 'http://test.com/foobar/test.html' },
            responseHeaders
        })

    beforeEach(() => {
        mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    })

    test('with a function', async () => {
        mock.respond(() => 'foobar')
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with a function returning undefined', async () => {
        mock.respond(() => undefined)
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with a function returning empty body', async () => {
        mock.respond(() => '')
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with an object', async () => {
        mock.respond({ foo: 'bar' })
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with a text', async () => {
        mock.respond('foobar')
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with a file', async () => {
        const fileContent = (await fs.readFile(__filename)).toString('base64')
        mock.respond(__filename)
        await fetchListenerWrapper()

        const response = cdpClient.send.mock.calls.pop()[1]
        expect(response.body).toEqual(fileContent)
    })

    test('with a missing file', async () => {
        const filepath = __filename + '/missing/mock-file.txt'
        mock.respond(filepath)
        await fetchListenerWrapper()

        const response = cdpClient.send.mock.calls.pop()[1]
        expect(response.body).toEqual(Buffer.from(filepath, 'binary').toString('base64'))
    })

    test('utf8 chars', async () => {
        const inputStr = 'Coöperatief'
        mock.respond(inputStr)
        await fetchListenerWrapper()

        const response = cdpClient.send.mock.calls.pop()[1]
        expect(Buffer.from(response.body, 'base64').toString()).toEqual(inputStr)
    })

    test('with a different web resource', async () => {
        mock.respond('http://json.org/image.svg')
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()[1].responseHeaders).toMatchSnapshot()
    })

    test('with a different web resource containing different location header', async () => {
        mock.respond('http://json.org/image.svg')
        const responseHeaders = [
            { name: 'Location', value: 'http://some.other/picture.png' },
            { name: 'Content-Type', value: 'application/json' }
        ]
        await fetchListenerWrapper(responseHeaders)

        expect(cdpClient.send.mock.calls.pop()[1].responseHeaders).toMatchSnapshot()
    })

    test('with modified headers', async () => {
        mock.respond((r: any) => r.body, { headers: {
            removed: undefined,
            added: 'string'
        } })
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with modified headers fn', async () => {
        mock.respond((r: any) => r.body, { headers: (r: any) => {
            return r.responseHeaders['Content-Type'] === 'application/json' ? {
                'Content-Type': 'text/xml',
            } : {}
        } })
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with modified status code', async () => {
        mock.respond((r: any) => r.body, { statusCode: 1234 })
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('with modified status code fn', async () => {
        mock.respond((r: any) => r.body, { statusCode: (r: any) => {
            return r.url.includes('test') ? 5678 : 1234
        } })
        await fetchListenerWrapper()

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })

    test('do not fetch request', async () => {
        mock.respond('foobar', { fetchResponse: false })

        // Request stage only
        await NetworkInterception.handleRequestInterception(cdpClient, [mock] as any)({
            requestId: 123,
            request: { url: 'http://test.com/foobar/test.html' }
        } as any)

        expect(cdpClient.send.mock.calls.pop()).toMatchSnapshot()
    })
})

describe('emit events', () => {
    let mock: NetworkInterception
    const onRequestStub = vi.fn()
    const onContinueStub = vi.fn()
    const onOverwriteStub = vi.fn()
    const onFailStub = vi.fn()
    const onMatchStub = vi.fn()

    const handleResponse = async (mocks: NetworkInterception[], event: any = {}) => {
        event.requestId ||= 123
        event.request ||= {}
        event.request.url ||= 'http://test.com/foobar/test.html'
        event.responseHeaders ||= []

        await NetworkInterception.handleRequestInterception(cdpClient, mocks as any)(event)
    }

    beforeEach(() => {
        mock = new NetworkInterception('**/foobar/**', undefined, browserMock)

        mock
            .on('request', onRequestStub)
            .on('continue', onContinueStub)
            .on('overwrite', onOverwriteStub)
            .on('fail', onFailStub)
            .on('match', onMatchStub)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    test('"request"', async () => {
        await handleResponse([mock])

        expect(onRequestStub).toHaveBeenCalledOnce()
        expect(onRequestStub).toBeCalledWith({
            requestId: 123,
            request: {
                body: '{"foo":"bar"}',
                responseHeaders: {},
                statusCode: 200,
                url: 'http://test.com/foobar/test.html'
            },
            responseHeaders: [],
            responseStatusCode: 200
        })
    })

    test('"continue"', async () => {
        await handleResponse([mock])

        expect(onOverwriteStub).not.toBeCalled()
        expect(onFailStub).not.toBeCalled()
        expect(onContinueStub).toHaveBeenCalledOnce()
        expect(onContinueStub).toBeCalledWith(123)
    })

    test('"overwrite"', async () => {
        mock.respond({ bar: 'foo' })
        await handleResponse([mock])

        expect(onFailStub).not.toBeCalled()
        expect(onContinueStub).not.toBeCalled()
        expect(onOverwriteStub).toHaveBeenCalledOnce()
        expect(onOverwriteStub).toBeCalledWith({
            requestId: 123,
            body: '{"bar":"foo"}',
            responseCode: 200,
            responseHeaders: []
        })
    })

    test('"fail"', async () => {
        mock.abort('ConnectionFailed')
        await handleResponse([mock])

        expect(onOverwriteStub).not.toBeCalled()
        expect(onContinueStub).not.toBeCalled()
        expect(onFailStub).toHaveBeenCalledOnce()
        expect(onFailStub).toBeCalledWith({
            requestId: 123,
            errorReason: 'ConnectionFailed'
        })
    })

    test('"match"', async () => {
        await fetchListener(mock, {
            request: { url: 'http://test.com/foobar/test.html' },
            responseHeaders: [{ name: 'content-Type', value: 'application/json' }]
        })

        expect(onMatchStub).toHaveBeenCalledOnce()
        expect(onMatchStub).toBeCalledWith({
            body: { foo: 'bar' },
            responseHeaders: {
                'content-Type': 'application/json'
            },
            statusCode: 200,
            url: 'http://test.com/foobar/test.html'
        })
    })

    describe('multiple', () => {
        let mockSecond: NetworkInterception
        const onRequestSecondStub = vi.fn()
        const onContinueSecondStub = vi.fn()
        const onOverwriteSecondStub = vi.fn()
        const onFailSecondStub = vi.fn()
        const onMatchSecondStub = vi.fn()

        beforeEach(() => {
            mockSecond = new NetworkInterception('**/foobar/**', undefined, browserMock)

            mockSecond
                .on('request', onRequestSecondStub)
                .on('continue', onContinueSecondStub)
                .on('overwrite', onOverwriteSecondStub)
                .on('fail', onFailSecondStub)
                .on('match', onMatchSecondStub)
        })

        test('request spies', async () => {
            await handleResponse([mock, mockSecond])

            expect(onRequestStub).toHaveBeenCalledOnce()
            expect(onRequestSecondStub).toHaveBeenCalledOnce()
        })

        test('response spies', async () => {
            await handleResponse([mock, mockSecond])

            expect(onContinueStub).toHaveBeenCalledOnce()
            expect(onContinueSecondStub).toHaveBeenCalledOnce()
            expect(onContinueStub).toBeCalledWith(123)
            expect(onContinueSecondStub).toBeCalledWith(123)
        })

        test('match spies', async () => {
            const match = {
                body: { foo: 'bar' },
                responseHeaders: {
                    'content-Type': 'application/json'
                },
                statusCode: 200,
                url: 'http://test.com/foobar/test.html'
            }
            await fetchListener([mock, mockSecond], {
                request: { url: 'http://test.com/foobar/test.html' },
                responseHeaders: [{ name: 'content-Type', value: 'application/json' }]
            })

            expect(onMatchStub).toHaveBeenCalledOnce()
            expect(onMatchSecondStub).toHaveBeenCalledOnce()
            expect(onMatchStub).toBeCalledWith(match)
            expect(onMatchSecondStub).toBeCalledWith(match)
        })

        test('spy and respond mock', async () => {
            mockSecond.respond({ bar: 'foo' })
            await handleResponse([mock, mockSecond])

            expect(onContinueSecondStub).not.toHaveBeenCalled()
            expect(onContinueStub).toHaveBeenCalledOnce()
            expect(onOverwriteSecondStub).toHaveBeenCalledOnce()
            expect(onOverwriteStub).not.toBeCalled()
        })

        test('spy and abort mock', async () => {
            mockSecond.abort('ConnectionFailed')
            await handleResponse([mock, mockSecond])

            expect(onContinueSecondStub).not.toHaveBeenCalled()
            expect(onContinueStub).toHaveBeenCalledOnce()
            expect(onFailSecondStub).toHaveBeenCalledOnce()
            expect(onFailStub).not.toBeCalled()
        })

        test('two respond mocks', async () => {
            mock.respond({ bar: 'foo1' })
            mockSecond.respond({ bar: 'foo2' })
            await handleResponse([mock, mockSecond])

            expect(onContinueSecondStub).toHaveBeenCalled()
            expect(onContinueStub).not.toHaveBeenCalledOnce()
            expect(onOverwriteSecondStub).not.toHaveBeenCalledOnce()
            expect(onOverwriteStub).toBeCalled()
        })
    })
})

test('allows to clear mocks', async () => {
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.calls.length).toBe(1)
    mock.clear()
    expect(mock.calls.length).toBe(0)
})

test('allows to restore mocks', async () => {
    const browserMock = {
        getWindowHandle: vi.fn().mockResolvedValue('window-handle')
    } as any as Browser
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    const sessionMocks = { 'window-handle': new Set([mock]) }
    const cdpSessions = { 'window-handle': cdpClient }
    mock.respondOnce({ foo: 'bar' })
    mock.respond({ bar: 'foo' })

    expect(mock.respondOverwrites.length).toBe(2)
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.respondOverwrites.length).toBe(1)
    await fetchListener(mock, {
        request: { url: 'http://test.com/foobar/test.html' },
        responseHeaders: []
    })
    expect(mock.respondOverwrites.length).toBe(1)

    mock.restore(sessionMocks, cdpSessions)
    expect(mock.respondOverwrites.length).toBe(0)
})

test('removes mock after restore', async () => {
    const browserMock = {
        getWindowHandle: vi.fn().mockResolvedValue('window-handle')
    } as any as Browser
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    const sessionMocks = { 'window-handle': new Set([mock]) }
    const cdpSessions = { 'window-handle': cdpClient }

    await mock.restore(sessionMocks, cdpSessions)

    expect(sessionMocks).toEqual({})
})

test('disables fetch domain after restore, if there are no other mocks', async () => {
    const browserMock = {
        getWindowHandle: vi.fn().mockResolvedValue('window-handle')
    } as any as Browser
    const mock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    const sessionMocks = { 'window-handle': new Set([mock]) }
    const cdpSessions = { 'window-handle': cdpClient }

    await mock.restore(sessionMocks, cdpSessions)

    expect(cdpClient.send).toBeCalledWith('Fetch.disable')
    expect(cdpSessions).toEqual({})
})

test('does not disable fetch domain after restore, if there are other mocks', async () => {
    const browserMock = {
        getWindowHandle: vi.fn().mockResolvedValue('window-handle')
    } as any as Browser
    const firstMock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    const secondMock = new NetworkInterception('**/foobar/**', undefined, browserMock)
    const sessionMocks = { 'window-handle': new Set([firstMock, secondMock]) }
    const cdpSessions = { 'window-handle': cdpClient }

    await firstMock.restore(sessionMocks, cdpSessions)

    expect(cdpClient.send).not.toBeCalledWith('Fetch.disable')
    expect(sessionMocks).toEqual({ 'window-handle': new Set([secondMock]) })
    expect(cdpSessions).toEqual({ 'window-handle': cdpClient })
})
