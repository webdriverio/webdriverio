import { EventEmitter } from 'node:events'
import { Buffer } from 'node:buffer'
import { runInNewContext } from 'node:vm'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { type local } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'
import WebDriverInterception, { parseUrlPattern } from '../../../src/utils/interception/index.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'

type WebDriverInterceptionClass = typeof WebDriverInterception

const { loggerMock } = vi.hoisted(() => ({
    loggerMock: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn()
    }
}))

vi.mock('@wdio/logger', () => {
    return {
        default: () => loggerMock
    }
})

describe('WebDriverInterception', () => {
    const waitForAsyncHandlers = (timeout = 50) => new Promise((resolve) => setTimeout(resolve, timeout))

    const getResponseCollectionBrowserMock = (
        options: WebdriverIO.Browser['options'] = {},
        overrides: Partial<WebdriverIO.Browser> = {}
    ) => {
        const defaults = {
            options,
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' })),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkGetData: vi.fn().mockImplementation(({ dataType }) => Promise.resolve({
                bytes: { type: 'string', value: dataType === 'request' ? 'request-body' : 'response-body' }
            })),
            networkContinueRequest: vi.fn().mockReturnValue(Promise.resolve()),
            networkFailRequest: vi.fn().mockReturnValue(Promise.resolve()),
            call: vi.fn(),
        } satisfies Partial<WebdriverIO.Browser>
        const browser = Object.assign(new EventEmitter(), defaults, overrides) as unknown as WebdriverIO.Browser
        return browser
    }

    const getResponseCollectionRequestStub = () => ({
        request: {
            request: 'req-123',
            url: 'http://test.com/foo',
            method: 'GET',
            headers: []
        } satisfies Partial<local.NetworkRequestData> as unknown as local.NetworkRequestData,
        response: {
            headers: [],
            status: 200
        } satisfies Partial<local.NetworkResponseData> as unknown as local.NetworkResponseData,
        isBlocked: true
    } satisfies Partial<local.NetworkResponseStartedParameters> as local.NetworkResponseStartedParameters)

    const getBlockedRequestStub = (requestId = 'req-123') => ({
        isBlocked: true,
        intercepts: ['mock-id'],
        request: {
            request: requestId,
            url: 'http://test.com/api',
            method: 'GET',
            headers: []
        }
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initiate', async () => {
        const browser = {
            options: {},
            on: vi.fn(),
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser> as unknown as WebdriverIO.Browser
        const mock = await WebDriverInterception.initiate('http://foobar.com:1234/foo/bar.html?foo=bar', {
            method: 'GET',
            requestHeaders: { foo: 'bar' },
            responseHeaders: { bar: 'foo' },
            statusCode: 200
        }, browser)
        expect(mock).toBeInstanceOf(WebDriverInterception)
        expect(browser.on).toHaveBeenCalledTimes(3)
        expect(browser.sessionSubscribe).toHaveBeenCalledTimes(1)
        expect(browser.networkAddIntercept).toHaveBeenCalledTimes(1)
        expect(vi.mocked(browser.networkAddIntercept).mock.calls).toMatchInlineSnapshot(`
          [
            [
              {
                "phases": [
                  "beforeRequestSent",
                  "responseStarted",
                ],
                "urlPatterns": [
                  {
                    "hostname": "foobar.com",
                    "pathname": "/foo/bar.html",
                    "port": "1234",
                    "protocol": "http",
                    "search": "foo=bar",
                    "type": "pattern",
                  },
                ],
              },
            ],
          ]
        `)
    })

    it('subscribes to the network events one time for each session', async () => {
        vi.resetModules()
        const { default: Interception } = await import('../../../src/utils/interception/index.js')
        const sessionBrowser = (sessionId: string) => ({
            sessionId,
            options: {},
            on: vi.fn(),
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser> as unknown as WebdriverIO.Browser)

        const first = sessionBrowser('session-1')
        await Interception.initiate('http://foobar.com/a', {}, first)
        await Interception.initiate('http://foobar.com/b', {}, first)
        expect(first.sessionSubscribe).toHaveBeenCalledTimes(1)
        expect(first.networkAddDataCollector).toHaveBeenCalledTimes(1)

        // a second session in the same process, e.g. another multi-remote instance
        const second = sessionBrowser('session-2')
        await Interception.initiate('http://foobar.com/a', {}, second)
        expect(second.sessionSubscribe).toHaveBeenCalledTimes(1)
        expect(second.networkAddDataCollector).toHaveBeenCalledTimes(1)

        // `reloadSession()` keeps the browser object but changes its session id
        ;(first as { sessionId: string }).sessionId = 'session-3'
        await Interception.initiate('http://foobar.com/a', {}, first)
        expect(first.sessionSubscribe).toHaveBeenCalledTimes(2)
        expect(first.networkAddDataCollector).toHaveBeenCalledTimes(2)
    })

    it('responds with JSON and text without a global Buffer', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/foo', {}, browser)
        vi.stubGlobal('Buffer', undefined)
        try {
            mock.respondOnce({ foo: 'bar' }).respondOnce('Hello World')
            browser.emit('network.responseStarted', getResponseCollectionRequestStub())
            expect(browser.networkProvideResponse).toHaveBeenCalledWith(expect.objectContaining({
                body: { type: 'string', value: '{"foo":"bar"}' }
            }))
            browser.emit('network.responseStarted', getResponseCollectionRequestStub())
            expect(browser.networkProvideResponse).toHaveBeenLastCalledWith(expect.objectContaining({
                body: { type: 'string', value: 'Hello World' }
            }))
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it.each([
        ['imported Buffer', Buffer.from([137, 80, 78, 71])],
        ['Uint8Array', new Uint8Array([137, 80, 78, 71])],
        ['offset view', new Uint8Array([0, 137, 80, 78, 71, 0]).subarray(1, 5)],
        ['Uint16Array', new Uint16Array([0x0102, 0x0304])],
        ['Int8Array', new Int8Array([-1, 0, 1])],
        ['Uint8ClampedArray', new Uint8ClampedArray([255, 0, 1])],
        ['offset DataView', new DataView(new Uint8Array([0, 137, 80, 78, 71, 0]).buffer, 1, 4)],
        ['ArrayBuffer', new Uint8Array([137, 80, 78, 71]).buffer],
        ['ArrayBuffer with throwing species', Object.defineProperty(new Uint8Array([137, 80, 78, 71]).buffer, 'constructor', {
            value: {
                get [Symbol.species]() {
                    throw new Error('Symbol.species must not be read')
                }
            }
        })],
        ['cross-realm Uint8Array', runInNewContext('new Uint8Array([137, 80, 78, 71])') as Uint8Array],
        ['cross-realm offset view', runInNewContext('new Uint8Array([0, 137, 80, 78, 71, 0]).subarray(1, 5)') as Uint8Array],
        ['cross-realm Float32Array', runInNewContext('new Float32Array([1])') as Float32Array],
        ['cross-realm ArrayBuffer', runInNewContext('new Uint8Array([137, 80, 78, 71]).buffer') as ArrayBuffer],
        ['empty bytes', new Uint8Array()],
        ['one byte', new Uint8Array([255])],
        ['two bytes', new Uint8Array([255, 254])],
        ['large payload', Uint8Array.from({ length: 200003 }, (_, index) => index % 256)]
    ])('responds with %s without a global Buffer', async (_name, payload) => {
        const bytes = ArrayBuffer.isView(payload)
            ? Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength)
            : new Uint8Array(payload)
        const expected = Buffer.from(bytes).toString('base64')
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/foo', {}, browser)
        vi.stubGlobal('Buffer', undefined)
        try {
            mock.respondOnce(payload).respondOnce(() => payload)
            browser.emit('network.responseStarted', getResponseCollectionRequestStub())
            browser.emit('network.responseStarted', getResponseCollectionRequestStub())
            expect(browser.networkProvideResponse).toHaveBeenCalledTimes(2)
            expect(browser.networkProvideResponse).toHaveBeenNthCalledWith(1, expect.objectContaining({
                body: { type: 'base64', value: expected }
            }))
            expect(browser.networkProvideResponse).toHaveBeenNthCalledWith(2, expect.objectContaining({
                body: { type: 'base64', value: expected }
            }))
            expect(mock.getBinaryResponse('req-123')).toEqual(new Uint8Array(bytes))
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it('serializes JSON tagged as ArrayBuffer instead of treating it as binary', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/foo', {}, browser)
        mock.respond({ foo: 'bar', [Symbol.toStringTag]: 'ArrayBuffer' })
        browser.emit('network.responseStarted', getResponseCollectionRequestStub())
        expect(browser.networkProvideResponse).toHaveBeenCalledWith(expect.objectContaining({
            body: { type: 'string', value: '{"foo":"bar"}' }
        }))
    })

    it('rejects a detached ArrayBuffer instead of serializing it as JSON', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/foo', {}, browser)
        const payload = new ArrayBuffer(4)
        structuredClone(payload, { transfer: [payload] })
        expect(() => mock.respond(payload)).toThrow(TypeError)
    })

    it.each(['requestHeaders', 'responseHeaders'] as const)(
        'decodes base64 %s without a global Buffer', async (filterName) => {
            const headerValue = '\uFEFFcafé'
            const header = {
                name: 'example',
                value: { type: 'base64' as const, value: Buffer.from(headerValue).toString('base64') }
            }
            vi.stubGlobal('Buffer', undefined)
            try {
                for (const filter of [{ example: headerValue }, (headers: Record<string, string>) => headers.example === headerValue]) {
                    const browser = getResponseCollectionBrowserMock()
                    const mock = await WebDriverInterception.initiate('http://test.com/foo', { [filterName]: filter }, browser)
                    const request = getResponseCollectionRequestStub()
                    request.request.headers = [header]
                    request.response.headers = [header]
                    mock.respond('matched')
                    browser.emit('network.responseStarted', request)
                    expect(browser.networkProvideResponse).toHaveBeenCalledWith(expect.objectContaining({
                        body: { type: 'string', value: 'matched' }
                    }))
                }
            } finally {
                vi.unstubAllGlobals()
            }
        }
    )

    it('initiate even when networkAddDataCollector is not supported', async () => {
        vi.resetModules()
        const FreshWebDriverInterception = (await import('../../../src/utils/interception/index.js')).default

        const browser = getResponseCollectionBrowserMock({}, {
            networkAddDataCollector: vi.fn().mockImplementation(() => {
                throw new Error('not supported')
            })
        })
        const mock = await FreshWebDriverInterception.initiate('http://foobar.com:1234/foo/bar.html?foo=bar', {}, browser)

        expect(browser.networkAddIntercept).toHaveBeenCalledTimes(1)
        expect(loggerMock.warn).toHaveBeenCalledWith('[BiDi] network.addDataCollector not supported: not supported')
    })

    it('handleBeforeRequestSent', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://foobar.com:1234/foo/bar.html?foo=bar', {
            method: 'GET',
            requestHeaders: { foo: 'bar' },
            responseHeaders: { bar: 'foo' },
            statusCode: 200
        }, browser)
        browser.emit('network.beforeRequestSent', {
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        })
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)

        mock.abort()
        browser.emit('network.beforeRequestSent', {
            isBlocked: true,
            request: {
                request: 123,
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'POST',
                headers: []
            }
        })
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()
        mock.reset()

        const blockedRequest = {
            isBlocked: true,
            request: {
                request: 123,
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        }
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        vi.mocked(browser.networkContinueRequest).mockClear()

        mock.redirect('https://webdriver.io')
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({
            request: 123,
            url: 'https://webdriver.io'
        })
        vi.mocked(browser.networkContinueRequest).mockClear()

        mock.abort()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()

        mock.request({ method: 'POST', headers: { foo: 'bar' }, body: 'foobar' })
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(vi.mocked(browser.networkContinueRequest).mock.calls).toMatchInlineSnapshot(`
          [
            [
              {
                "body": {
                  "type": "string",
                  "value": "foobar",
                },
                "headers": [
                  {
                    "name": "foo",
                    "value": {
                      "type": "string",
                      "value": "bar",
                    },
                  },
                ],
                "method": "POST",
                "request": 123,
              },
            ],
          ]
        `)
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()

        /**
         * allows to overwrite mock behavior, e.g. by having a mock to abort
         */
        mock.abort()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()

        mock.requestOnce({ method: 'POST', headers: { foo: 'bar' }, body: 'foobar' })
        mock.abortOnce()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(vi.mocked(browser.networkContinueRequest).mock.calls).toMatchInlineSnapshot(`
          [
            [
              {
                "body": {
                  "type": "string",
                  "value": "foobar",
                },
                "headers": [
                  {
                    "name": "foo",
                    "value": {
                      "type": "string",
                      "value": "bar",
                    },
                  },
                ],
                "method": "POST",
                "request": 123,
              },
            ],
          ]
        `)
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)

        vi.mocked(browser.networkContinueRequest).mockClear()
        vi.mocked(browser.networkFailRequest).mockClear()
        const binaryBody = Buffer.from('binary data')
        mock.request({ body: binaryBody })
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({
            request: 123,
            body: {
                type: 'base64',
                value: Buffer.from(JSON.stringify(binaryBody)).toString('base64')
            }
        })
    })

    it('should respond without fetching when fetchResponse is false', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond('mocked response', { fetchResponse: false })
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkContinueRequest).not.toHaveBeenCalled()
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })

        vi.mocked(browser.networkProvideResponse).mockClear()
        browser.emit('network.responseStarted', {
            ...getBlockedRequestStub(),
            response: {
                status: 200,
                headers: []
            }
        })

        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
        expect(mock.calls).toHaveLength(1)
    })

    it('answers before the request is sent in Firefox, which can only replace the body then', async () => {
        const browser = getResponseCollectionBrowserMock({}, { isFirefox: true } as Partial<WebdriverIO.Browser>)
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond('mocked response')
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkContinueRequest).not.toHaveBeenCalled()
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })
    })

    it('still fetches the backend in Firefox when the mock filters on the response', async () => {
        const browser = getResponseCollectionBrowserMock({}, { isFirefox: true } as Partial<WebdriverIO.Browser>)
        const mock = await WebDriverInterception.initiate('http://test.com/**', { statusCode: 200 }, browser)

        mock.respond('mocked response')
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-123' })
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('lets the real response through when the browser rejects the replaced body', async () => {
        const browser = getResponseCollectionBrowserMock()
        vi.mocked(browser.networkProvideResponse)
            .mockRejectedValueOnce(new Error('unsupported operation: The "body" parameter is only supported for the beforeRequestSent phase'))
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond('mocked response')
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())
        browser.emit('network.responseStarted', {
            ...getBlockedRequestStub(),
            response: { status: 200, headers: [] }
        })
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(2)
        expect(browser.networkProvideResponse).toHaveBeenLastCalledWith({ request: 'req-123' })
    })

    it('should fetch the backend by default', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond('mocked response')
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkContinueRequest).toHaveBeenCalledWith({
            request: 'req-123'
        })
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('should expose a binary response when fetchResponse is false', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
        const binaryData = Buffer.from('binary data')

        mock.respond(binaryData, { fetchResponse: false })
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(mock.getBinaryResponse('req-123')).toEqual(binaryData)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            statusCode: 200,
            body: {
                type: 'base64',
                value: binaryData.toString('base64')
            }
        })
    })

    it('should only respond once without fetching when respondOnce is used', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respondOnce('mocked response', { fetchResponse: false })

        browser.emit('network.beforeRequestSent', getBlockedRequestStub('req-1'))
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-1',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })

        vi.mocked(browser.networkProvideResponse).mockClear()
        browser.emit('network.beforeRequestSent', getBlockedRequestStub('req-2'))

        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-2' })
    })

    it('should abort before answering with fetchResponse false', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.abortOnce()
        mock.respond('mocked response', { fetchResponse: false })
        browser.emit('network.beforeRequestSent', getBlockedRequestStub('req-1'))

        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 'req-1' })
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()

        vi.mocked(browser.networkFailRequest).mockClear()
        browser.emit('network.beforeRequestSent', getBlockedRequestStub('req-2'))

        expect(browser.networkFailRequest).not.toHaveBeenCalled()
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-2',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })
    })

    it('should reject fetchResponse false when the mock filters on the response', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', { statusCode: 404 }, browser)

        expect(() => mock.respond('missing', { fetchResponse: false }))
            .toThrow(/fetchResponse: false cannot be used when the mock filters on statusCode or responseHeaders/)
        expect(() => mock.respondOnce('missing', { fetchResponse: false }))
            .toThrow(/fetchResponse: false cannot be used when the mock filters on statusCode or responseHeaders/)
    })

    it('should reject fetchResponse false when the mock filters on response headers', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {
            responseHeaders: (headers) => headers['x-mock'] === 'yes'
        }, browser)

        expect(() => mock.respond('header match', { fetchResponse: false }))
            .toThrow(/fetchResponse: false cannot be used when the mock filters on statusCode or responseHeaders/)
    })

    it('should still skip the backend when fetchResponse is false and the mock filters on the request', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {
            method: 'GET'
        }, browser)

        mock.respond('mocked response', { fetchResponse: false })
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkContinueRequest).not.toHaveBeenCalled()
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })
    })

    it('should let a fetchResponse callback read a response', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond('mocked response', {
            fetchResponse: false,
            statusCode: (event) => event.response.status
        })
        browser.emit('network.beforeRequestSent', getBlockedRequestStub())

        expect(browser.networkFailRequest).not.toHaveBeenCalled()
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            statusCode: 200,
            body: { type: 'string', value: 'mocked response' }
        })
    })

    it('handleResponseStarted', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://foobar.com:1234/foo/bar.html?foo=bar', {
            method: 'get',
            requestHeaders: { foo: 'bar' },
            responseHeaders: { bar: 'foo' },
            statusCode: 200
        }, browser)
        browser.emit('network.responseStarted', {
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        })
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(0)

        browser.emit('network.responseStarted', {
            isBlocked: true,
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                request: 123,
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        })
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 123,
        })
        vi.mocked(browser.networkProvideResponse).mockClear()

        mock.respondOnce({ foo: 'bar' })
        browser.emit('network.responseStarted', {
            isBlocked: true,
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                request: 123,
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        })
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 123,
            body: { type: 'string', value: '{"foo":"bar"}' }
        })
        browser.emit('network.responseStarted', {
            isBlocked: true,
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'GET',
                request: 123,
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            }
        })
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(2)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 123
        })
        vi.mocked(browser.networkProvideResponse).mockClear()

        mock.clear()
        vi.mocked(browser.networkProvideResponse).mockClear()
        mock.respondOnce('hello')
        browser.emit('network.responseStarted', {
            isBlocked: true,
            request: {
                url: 'http://foobar.com:1234/foo/bar.html?foo=bar',
                method: 'get',
                request: 123,
                headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
            },
            response: {
                status: 200,
                headers: [{ name: 'bar', value: { type: 'string', value: 'foo' } }]
            }
        })
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 123,
            body: { type: 'string', value: 'hello' }
        })
        expect(mock.getBinaryResponse('123')).toBeNull()
    })

    it('should record matching requests that the driver reports as not blocked (regression test)', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        // subresource loaded while a navigation is in progress: the driver emits
        // responseStarted with isBlocked: false even though the URL matches the mock
        browser.emit('network.responseStarted', {
            isBlocked: false,
            request: {
                request: 'req-123',
                url: 'http://test.com/api',
                method: 'GET',
                headers: []
            }
        })

        expect(mock.calls.length).toBe(1)
        // non-blocked requests are not paused, so no networkProvideResponse should be sent
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('should not provide a response for a non-blocked request that carries the intercept id (regression test)', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        // even when the driver reports the intercept id for a non-blocked request,
        // calling networkProvideResponse would fail at the protocol layer, so the
        // mock must only record the request
        browser.emit('network.responseStarted', {
            isBlocked: false,
            intercepts: ['mock-id'],
            request: {
                request: 'req-123',
                url: 'http://test.com/api',
                method: 'GET',
                headers: []
            }
        })

        expect(mock.calls.length).toBe(1)
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('should not record requests that do not match the mock pattern', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        browser.emit('network.responseStarted', {
            isBlocked: false,
            request: {
                request: 'req-123',
                url: 'http://other.com/api',
                method: 'GET',
                headers: []
            }
        })

        expect(mock.calls.length).toBe(0)
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('does not collect response data once the mock is restored', async () => {
        const browser = getResponseCollectionBrowserMock({
            waitforTimeout: 5000,
            waitforInterval: 100
        }, {
            call: vi.fn().mockImplementation((fn) => fn())
        })
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser, { sessionKey: 'window-1' })
        Object.assign(browser, { networkRemoveIntercept: vi.fn().mockResolvedValue({}) })
        await mock.restore()
        vi.mocked(browser.networkGetData).mockClear()

        browser.emit('network.responseCompleted', {
            isBlocked: false,
            request: { request: 'req-1', url: 'http://test.com/api', method: 'GET', headers: [] },
            response: { status: 200, headers: [] }
        })
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(browser.networkGetData).not.toHaveBeenCalled()
        expect(mock.calls).toHaveLength(0)
    })

    it('should resolve waitForResponse for a matching response reported as not blocked (regression test)', async () => {
        const browser = getResponseCollectionBrowserMock({
            waitforTimeout: 5000,
            waitforInterval: 100
        }, {
            call: vi.fn().mockImplementation((fn) => fn())
        })
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        // subresource loaded while navigating: isBlocked is false on both events
        browser.emit('network.responseStarted', {
            isBlocked: false,
            request: {
                request: 'req-123',
                url: 'http://test.com/api',
                method: 'GET',
                headers: []
            }
        })
        browser.emit('network.responseCompleted', {
            isBlocked: false,
            request: {
                request: 'req-123',
                url: 'http://test.com/api',
                method: 'GET',
                headers: []
            },
            response: {
                status: 200,
                headers: []
            }
        })

        await waitForAsyncHandlers()
        await expect(mock.waitForResponse()).resolves.toBeDefined()
    })

    it('should apply a dynamic respond payload when the request is intercepted', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
        const payload = vi.fn((request: local.NetworkResponseCompletedParameters) => ({
            requestId: request.request.request,
            foo: 'bar'
        }))

        mock.respond(payload, { statusCode: 200 })
        expect(payload).not.toHaveBeenCalled()

        browser.emit('network.responseStarted', getResponseCollectionRequestStub())

        expect(payload).toHaveBeenCalledTimes(1)
        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            body: { type: 'string', value: '{"requestId":"req-123","foo":"bar"}' },
            statusCode: 200
        })
    })

    it('should allow a dynamic respond payload to return a string or Buffer', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond((request) => `id=${request.request.request}`)
        browser.emit('network.responseStarted', getResponseCollectionRequestStub())
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            body: { type: 'string', value: 'id=req-123' }
        })

        vi.mocked(browser.networkProvideResponse).mockClear()
        mock.reset()
        mock.respond(() => Buffer.from('hello'))
        browser.emit('network.responseStarted', getResponseCollectionRequestStub())
        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            body: { type: 'base64', value: Buffer.from('hello').toString('base64') }
        })
    })

    it('should apply function overwrites for status code and headers with a dynamic body', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond((request) => ({ id: request.request.request }), {
            statusCode: () => 201,
            headers: () => ({ foo: 'bar' })
        })
        browser.emit('network.responseStarted', getResponseCollectionRequestStub())

        expect(browser.networkProvideResponse).toHaveBeenCalledWith({
            request: 'req-123',
            body: { type: 'string', value: '{"id":"req-123"}' },
            statusCode: 201,
            headers: [{ name: 'foo', value: { type: 'string', value: 'bar' } }]
        })
    })

    it('should throw when a mock.respond payload cannot be serialized', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        expect(() => mock.respond(undefined as never)).toThrow(/Failed to serialize mock.respond/)
    })

    it('should fail the intercepted request when a dynamic respond payload cannot be serialized', async () => {
        const browser = getResponseCollectionBrowserMock()
        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        mock.respond(() => undefined as never)
        expect(() => browser.emit('network.responseStarted', getResponseCollectionRequestStub()))
            .not.toThrow()

        expect(loggerMock.error).toHaveBeenCalledWith(
            expect.stringMatching(/Failed to apply mock.respond\(\) overwrite: Failed to serialize mock.respond/)
        )
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 'req-123' })
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('handles non-binary response correctly', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://localhost/test/*', {}, browser)

        const mockResponse = { data: { someProperty: 123 } }
        mock.respond(mockResponse)

        const mockRequest: local.NetworkResponseCompletedParameters = {
            context: 'mock-context',
            navigation: null,
            redirectCount: 0,
            timestamp: 0,
            request: {
                request: 'req-123',
                url: 'http://localhost/test/api',
                method: 'POST',
                headers: [],
                cookies: [],
                headersSize: 0,
                bodySize: 0,
                timings: {
                    timeOrigin: 0,
                    requestTime: 0,
                    redirectStart: 0,
                    redirectEnd: 0,
                    fetchStart: 0,
                    dnsStart: 0,
                    dnsEnd: 0,
                    connectStart: 0,
                    connectEnd: 0,
                    tlsStart: 0,
                    requestStart: 0,
                    responseStart: 0,
                    responseEnd: 0,
                },
            } satisfies Partial<local.NetworkRequestData> as unknown as local.NetworkRequestData,
            response: {
                url: 'http://localhost/test/api',
                status: 200,
                headers: [],
                mimeType: 'application/json',
                bytesReceived: 0,
                headersSize: 0,
                bodySize: 0,
                content: { size: 0 },
                protocol: 'http',
                statusText: 'OK',
                fromCache: false,
            },
            isBlocked: true,
        }

        mock.simulateResponseStarted(mockRequest)

        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(vi.mocked(browser.networkProvideResponse).mock.calls).toMatchInlineSnapshot(`
        [
          [
            {
              "body": {
                "type": "string",
                "value": "{"data":{"someProperty":123}}",
              },
              "request": "req-123",
            },
          ],
        ]
      `)
        expect(mock.getBinaryResponse('req-123')).toBeNull()
    })

    it('handles binary response body and clear', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://localhost/test/*', {}, browser)

        const binaryData = Buffer.from('binary data')
        mock.respond(binaryData)

        const mockRequest: local.NetworkResponseCompletedParameters = {
            context: 'mock-context',
            navigation: null,
            redirectCount: 0,
            timestamp: 0,
            request: {
                request: 'req-123',
                url: 'http://localhost/test/bin',
                method: 'GET',
                headers: [],
                cookies: [],
                headersSize: 0,
                bodySize: 0,
                timings: {
                    timeOrigin: 0,
                    requestTime: 0,
                    redirectStart: 0,
                    redirectEnd: 0,
                    fetchStart: 0,
                    dnsStart: 0,
                    dnsEnd: 0,
                    connectStart: 0,
                    connectEnd: 0,
                    tlsStart: 0,
                    requestStart: 0,
                    responseStart: 0,
                    responseEnd: 0,
                },
            } satisfies Partial<local.NetworkRequestData> as unknown as local.NetworkRequestData,
            response: {
                url: 'http://localhost/test/bin',
                status: 200,
                headers: [],
                mimeType: 'application/octet-stream',
                bytesReceived: 0,
                headersSize: 0,
                bodySize: 0,
                content: { size: 0 },
                protocol: 'http',
                statusText: 'OK',
                fromCache: false,
            },
            isBlocked: true,
        }

        mock.simulateResponseStarted(mockRequest)

        expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        expect(vi.mocked(browser.networkProvideResponse).mock.calls).toMatchInlineSnapshot(`
        [
          [
            {
              "body": {
                "type": "base64",
                "value": "YmluYXJ5IGRhdGE=",
              },
              "request": "req-123",
            },
          ],
        ]
      `)
        expect(mock.getBinaryResponse('req-123')).toEqual(binaryData)

        mock.clear()
        expect(mock.getBinaryResponse('req-123')).toBeNull()
    })

    it('handles invalid and unusual base64 data in getBinaryResponse', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://localhost/test/*', {}, browser)
        const logWarnSpy = vi.spyOn(logger('WebDriverInterception'), 'warn')

        mock.debugResponseBodies().set('req-123', { type: 'base64', value: 'invalid!' })
        expect(mock.getBinaryResponse('req-123')).toBeNull()
        expect(logWarnSpy).toHaveBeenCalledTimes(1)
        expect(logWarnSpy.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Invalid base64 data for request req-123",
          ],
        ]
      `)

        mock.debugResponseBodies().set('req-123', { type: 'string', value: 'text' })
        expect(mock.getBinaryResponse('req-123')).toBeNull()
        expect(logWarnSpy).toHaveBeenCalledTimes(1)

        mock.debugResponseBodies().set('req-123', { type: 'base64', value: '' })
        expect(mock.getBinaryResponse('req-123')).toEqual(Buffer.from(''))
        expect(logWarnSpy).toHaveBeenCalledTimes(1)

        mock.debugResponseBodies().set('req-123', { type: 'base64', value: '  YmluYXJ5IGRhdGE=  ' })
        expect(mock.getBinaryResponse('req-123')).toEqual(Buffer.from('binary data'))
        expect(logWarnSpy).toHaveBeenCalledTimes(1)

        logWarnSpy.mockRestore()
    })

    it('should fetch response body on responseCompleted', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
        const request = getResponseCollectionRequestStub()

        // Response started populates calls
        browser.emit('network.responseStarted', request)
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].body).toBeUndefined()

        // Response completed fetches body
        // responseCompleted is not blocked
        const completedRequest = { ...request, isBlocked: false } satisfies Partial<local.NetworkResponseCompletedParameters> as unknown as local.NetworkResponseCompletedParameters
        browser.emit('network.responseCompleted', completedRequest)

        await waitForAsyncHandlers()

        expect(browser.networkGetData).toHaveBeenCalledWith({
            request: 'req-123',
            dataType: 'response'
        })
        expect(mock.calls[0].body).toBe('response-body')
    })

    it('should expose request postData on calls', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
        const request = getResponseCollectionRequestStub()

        browser.emit('network.responseStarted', request)
        browser.emit('network.responseCompleted', { ...request, isBlocked: false })

        await waitForAsyncHandlers()

        expect(browser.networkGetData).toHaveBeenCalledWith({
            request: 'req-123',
            dataType: 'request'
        })
        expect(mock.calls[0].postData).toBe('request-body')
    })

    it('should skip request postData lookup when cheaper responseCompleted filters do not match', async () => {
        const browser = getResponseCollectionBrowserMock()

        await WebDriverInterception.initiate('http://test.com/**', {
            method: 'POST'
        }, browser)
        const request = getResponseCollectionRequestStub()

        browser.emit('network.responseCompleted', { ...request, isBlocked: false })

        await waitForAsyncHandlers()

        expect(browser.networkGetData).not.toHaveBeenCalled()
    })

    it('should evict cached request postData after responseCompleted attaches it to a call', async () => {
        const requestBodies = ['first-request-body', 'second-request-body']
        const browser = getResponseCollectionBrowserMock({}, {
            networkGetData: vi.fn().mockImplementation(({ dataType }) => Promise.resolve({
                bytes: {
                    type: 'string',
                    value: dataType === 'request' ? requestBodies.shift() : 'response-body'
                }
            }))
        })

        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
        const firstRequest = getResponseCollectionRequestStub()

        browser.emit('network.responseStarted', firstRequest)
        browser.emit('network.responseCompleted', { ...firstRequest, isBlocked: false })

        await waitForAsyncHandlers()

        const secondRequest = getResponseCollectionRequestStub()

        browser.emit('network.responseStarted', secondRequest)
        browser.emit('network.responseCompleted', { ...secondRequest, isBlocked: false })

        await waitForAsyncHandlers()

        const requestBodyCalls = vi.mocked(browser.networkGetData).mock.calls
            .filter(([params]) => params.dataType === 'request')

        expect(requestBodyCalls).toHaveLength(2)
        expect(mock.calls[0].postData).toBe('first-request-body')
        expect(mock.calls[1].postData).toBe('second-request-body')
    })

    it('should filter requests by postData', async () => {
        const browser = getResponseCollectionBrowserMock()

        const mock = await WebDriverInterception.initiate('http://test.com/**', {
            postData: (postData) => postData === 'request-body'
        }, browser)
        const request = getResponseCollectionRequestStub()
        const onRequest = vi.fn()

        mock.on('request', onRequest)
        browser.emit('network.beforeRequestSent', request)

        await waitForAsyncHandlers()

        expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({
            postData: 'request-body'
        }))
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({
            request: 'req-123'
        })
    })

    describe('parseUrlPattern', () => {
        it('collapses repeated wildcards, which match the same URLs', () => {
            const pattern = parseUrlPattern('**/api/users')
            expect(pattern.pathname).toBe('*/api/users')
            expect(pattern.test('https://example.test/v1/api/users')).toBe(true)
            expect(pattern.test('https://example.test/api/users')).toBe(true)
            expect(pattern.test('https://example.test/api/other')).toBe(false)
            expect(parseUrlPattern('https://**.example.test/**').hostname).toBe('*.example.test')
        })

        it('tests a long URL that does not match without backtracking', () => {
            const pattern = parseUrlPattern('**/api/nothing')
            const start = Date.now()
            expect(pattern.test(`data:image/png;base64,${'A'.repeat(100_000)}`)).toBe(false)
            expect(Date.now() - start).toBeLessThan(1000)
        })
    })

    describe('WebDriverInterception options', () => {
        let WebDriverInterception: WebDriverInterceptionClass

        beforeEach(async () => {
            vi.resetModules()
            WebDriverInterception = (await import('../../../src/utils/interception/index.js')).default
        })

        it('initiate should NOT add data collector if maxSpyCollectedBodySize is 0', async () => {
            const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 0 })
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).not.toHaveBeenCalled()
        })

        it('initiate should add data collector with default size if maxSpyCollectedBodySize is not provided', async () => {
            const browser = getResponseCollectionBrowserMock()
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).toHaveBeenCalledWith({
                dataTypes: ['request', 'response'],
                maxEncodedDataSize: 10 * 1024 * 1024
            })
        })

        it('initiate should add data collector with custom size', async () => {
            const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 })
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).toHaveBeenCalledWith({
                dataTypes: ['request', 'response'],
                maxEncodedDataSize: 1024
            })
        })

        it('should NOT fetch response body on responseCompleted if maxSpyCollectedBodySize is 0', async () => {
            const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 0 })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            // Response started populates calls
            browser.emit('network.responseStarted', request)
            expect(mock.calls.length).toBe(1)

            // Response completed fetches body
            const completedRequest = { ...request, isBlocked: false } satisfies Partial<local.NetworkResponseCompletedParameters> as unknown as local.NetworkResponseCompletedParameters
            browser.emit('network.responseCompleted', completedRequest)

            await waitForAsyncHandlers()

            expect(browser.networkGetData).not.toHaveBeenCalled()
        })

        it('should fetch response body on responseCompleted if maxSpyCollectedBodySize is > 0', async () => {
            const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            // Response started populates calls
            browser.emit('network.responseStarted', request)
            expect(mock.calls.length).toBe(1)

            // Response completed fetches body
            const completedRequest = { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters
            browser.emit('network.responseCompleted', completedRequest)

            await waitForAsyncHandlers()

            expect(browser.networkGetData).toHaveBeenCalledWith({
                request: 'req-123',
                dataType: 'response'
            })
        })
    })

    describe('isResponseReceived getter', () => {
        let WebDriverInterception: WebDriverInterceptionClass

        beforeEach(async () => {
            vi.resetModules()
            WebDriverInterception = (await import('../../../src/utils/interception/index.js')).default
        })

        describe('when network collection is disabled', () => {

            let browser: WebdriverIO.Browser

            beforeEach(async () => {
                browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 0 })
            })

            it('should return true if calls are recorded and response body is not collected', async () => {
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers()

                expect(mock.hasAtLeastOneResponseReceived).toBe(true)
                expect(browser.networkGetData).not.toHaveBeenCalled()
                expect(mock.calls[0].body).toBeUndefined()
            })
        })

        describe('when network collection is enabled', () => {

            it('should return false if no calls are recorded', async () => {
                const browser = getResponseCollectionBrowserMock()
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

                await waitForAsyncHandlers()

                expect(mock.hasAtLeastOneResponseReceived).toBe(false)
                expect(browser.networkGetData).not.toHaveBeenCalled()

            })

            it('should return true if calls are recorded and at least one call has response body collected', async () => {
                const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 })
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers()

                expect(mock.hasAtLeastOneResponseReceived).toBe(true)
                expect(browser.networkGetData).toHaveBeenCalled()

            })

            it('should return true if response collected but undefined', async () => {
                const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 }, {
                    networkGetData: vi.fn().mockResolvedValue({
                        bytes: undefined
                    })
                })
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers()

                expect(mock.hasAtLeastOneResponseReceived).toBe(true)
            })

            it('should return true if response collected but empty string', async () => {
                const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 }, {
                    networkGetData: vi.fn().mockResolvedValue({
                        bytes: { type: 'string', value: '' }
                    })
                })
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers()

                expect(mock.hasAtLeastOneResponseReceived).toBe(true)
            })

            it('should return false then true if response take time to collect', async () => {
                let resolveGetData: (value: unknown) => void
                const getDataPromise = new Promise((resolve) => {
                    resolveGetData = resolve
                })
                const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 }, {
                    networkGetData: vi.fn().mockReturnValue(getDataPromise)
                })
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers()
                expect(mock.hasAtLeastOneResponseReceived).toBe(false)

                resolveGetData!({
                    bytes: { type: 'string', value: 'response-body' }
                })
                await waitForAsyncHandlers()
                expect(mock.hasAtLeastOneResponseReceived).toBe(true)
            })
        })
    })

    describe('waitForResponse', () => {
        it('should resolve when a response has been received', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 5000,
                waitforInterval: 100
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            // Simulate response arriving
            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            await expect(mock.waitForResponse()).resolves.toBeDefined()
        })

        it('should throw timeout error when no response is received', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            await expect(mock.waitForResponse()).rejects.toThrow('waitForResponse timed out after 100ms')
        })

        it('should throw custom timeout message when provided', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            await expect(mock.waitForResponse({ timeoutMsg: 'Custom timeout message' }))
                .rejects.toThrow('Custom timeout message')
        })

        it('should use provided timeout and interval options', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 5000,
                waitforInterval: 100
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            await expect(mock.waitForResponse({ timeout: 50, interval: 10 }))
                .rejects.toThrow('waitForResponse timed out after 50ms')
        })

        it('should use browser defaults when timeout/interval are not numbers', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            await expect(mock.waitForResponse({ timeout: undefined, interval: undefined }))
                .rejects.toThrow('waitForResponse timed out after 100ms')
        })

        it('should resolve when response arrives during wait', async () => {
            const browser = getResponseCollectionBrowserMock({
                waitforTimeout: 5000,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            setTimeout(() => {
                // Simulate response arriving
                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            }, 100)

            await expect(mock.waitForResponse()).resolves.toBeDefined()
        })

        it('should resolve without the body when the browser does not answer the response body read', async () => {
            let resolveGetData: (value: unknown) => void
            const getDataPromise = new Promise((resolve) => {
                resolveGetData = resolve
            })
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockImplementation(({ dataType }) => dataType === 'response'
                    ? getDataPromise
                    : Promise.reject(new Error('no such network data')))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()
            loggerMock.warn.mockClear()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            await expect(mock.waitForResponse()).resolves.toBe(true)
            expect(mock.calls[0].body).toBeUndefined()
            expect(loggerMock.warn).toHaveBeenCalledWith(
                'waitForResponse: a response was received, but its body was not collected within 100ms, continuing without it'
            )

            resolveGetData!({
                bytes: { type: 'string', value: 'late-body' }
            })
            await waitForAsyncHandlers()
            expect(mock.calls[0].body).toBe('late-body')
            expect(mock.hasAtLeastOneResponseReceived).toBe(true)
        })

        it('should keep a body that the browser returns before the timeout', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 1000,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockImplementation(({ dataType }) => dataType === 'response'
                    ? new Promise((resolve) => setTimeout(() => resolve({ bytes: { type: 'string', value: 'slow-body' } }), 200))
                    : Promise.reject(new Error('no such network data')))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            await expect(mock.waitForResponse()).resolves.toBe(true)
            expect(mock.calls[0].body).toBe('slow-body')
        })

        it('should resolve without the custom timeout message when a response arrived without its body', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockImplementation(({ dataType }) => dataType === 'response'
                    ? new Promise(() => {})
                    : Promise.reject(new Error('no such network data')))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            await expect(mock.waitForResponse({ timeoutMsg: 'Custom timeout message' })).resolves.toBe(true)
        })

        it('should resolve without a warning when the browser rejects the body read', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 5000,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockRejectedValue(new Error('no such network data'))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()
            loggerMock.warn.mockClear()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            const start = Date.now()
            await expect(mock.waitForResponse()).resolves.toBe(true)
            expect(Date.now() - start).toBeLessThan(1000)
            expect(mock.calls[0].body).toBeUndefined()
            expect(loggerMock.warn).not.toHaveBeenCalled()
        })

        it('should resolve without reading the body when data collection is disabled', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 0,
                waitforTimeout: 5000,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            loggerMock.warn.mockClear()

            browser.emit('network.responseStarted', getResponseCollectionRequestStub())

            await expect(mock.waitForResponse()).resolves.toBe(true)
            expect(browser.networkGetData).not.toHaveBeenCalled()
            expect(loggerMock.warn).not.toHaveBeenCalled()
        })

        it('should resolve with the body of a later response when an earlier body read gets no reply', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 5000,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockImplementation(({ request, dataType }) => dataType === 'request'
                    ? Promise.reject(new Error('no such network data'))
                    : request === 'req-1'
                        ? new Promise(() => {})
                        : Promise.resolve({ bytes: { type: 'string', value: 'second-body' } }))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            loggerMock.warn.mockClear()

            for (const id of ['req-1', 'req-2']) {
                const request = getResponseCollectionRequestStub()
                request.request = { ...request.request, request: id }
                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)
            }

            await expect(mock.waitForResponse()).resolves.toBe(true)
            expect(mock.calls.map((call) => call.body)).toEqual([undefined, 'second-body'])
            expect(loggerMock.warn).not.toHaveBeenCalled()
        })

        it('should not count a body read that settles after clear() for the next response', async () => {
            const reads = new Map<string, (value: unknown) => void>()
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn()),
                networkGetData: vi.fn().mockImplementation(({ request, dataType }) => dataType === 'request'
                    ? Promise.reject(new Error('no such network data'))
                    : new Promise((resolve) => reads.set(request, resolve)))
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const emitResponse = (id: string) => {
                const request = getResponseCollectionRequestStub()
                request.request = { ...request.request, request: id }
                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)
            }

            emitResponse('req-1')
            await expect(mock.waitForResponse()).resolves.toBe(true)
            mock.clear()
            reads.get('req-1')!({ bytes: { type: 'string', value: 'cleared-body' } })
            await waitForAsyncHandlers()
            expect(mock.hasAtLeastOneResponseReceived).toBe(false)

            emitResponse('req-2')
            await waitForAsyncHandlers()
            expect(mock.hasAtLeastOneResponseReceived).toBe(false)
            const wait = mock.waitForResponse({ timeout: 2000 })
            reads.get('req-2')!({ bytes: { type: 'string', value: 'second-body' } })
            await expect(wait).resolves.toBe(true)
            expect(mock.calls.map((call) => call.body)).toEqual(['second-body'])
        })

        it('should still time out when a response started but did not complete', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            // e.g. the request failed after its headers arrived: no `network.responseCompleted`
            browser.emit('network.responseStarted', getResponseCollectionRequestStub())

            expect(mock.calls).toHaveLength(1)
            await expect(mock.waitForResponse()).rejects.toThrow('waitForResponse timed out after 100ms')
            await expect(mock.waitForResponse({ timeout: 50, timeoutMsg: 'Custom timeout message' }))
                .rejects.toThrow('Custom timeout message')
            expect(browser.networkGetData).not.toHaveBeenCalled()
        })

        it('should still time out when the only response does not match the mock filter', async () => {
            const browser = getResponseCollectionBrowserMock({
                maxSpyCollectedBodySize: 1024,
                waitforTimeout: 100,
                waitforInterval: 10
            }, {
                call: vi.fn().mockImplementation((fn) => fn())
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', { method: 'post' }, browser)
            const request = getResponseCollectionRequestStub()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            expect(mock.calls).toHaveLength(0)
            await expect(mock.waitForResponse()).rejects.toThrow('waitForResponse timed out after 100ms')
        })
    })

    describe('clear', () => {
        it('should reset calls array', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            // Trigger a response to populate calls
            browser.emit('network.responseStarted', request)
            expect(mock.calls.length).toBe(1)

            mock.clear()
            expect(mock.calls.length).toBe(0)
        })

        it('should reset hasAtLeastOneResponseReceived to false', async () => {
            const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            browser.emit('network.responseStarted', request)
            browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

            await waitForAsyncHandlers()
            expect(mock.hasAtLeastOneResponseReceived).toBe(true)

            mock.clear()
            expect(mock.hasAtLeastOneResponseReceived).toBe(false)
        })

        it('should clear overwritten response bodies', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getResponseCollectionRequestStub()

            mock.respond('mocked response')
            browser.emit('network.responseStarted', request)

            expect(mock.debugResponseBodies().size).toBe(1)

            mock.clear()
            expect(mock.debugResponseBodies().size).toBe(0)
        })

        it('should return the mock instance for chaining', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            const result = mock.clear()
            expect(result).toBe(mock)
        })

        it('should not remove request or response overwrites', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

            mock.respond('mocked response')
            mock.clear()

            // After clear, respond overwrites should still be active
            const request = getResponseCollectionRequestStub()
            browser.emit('network.responseStarted', request)

            expect(browser.networkProvideResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: { type: 'string', value: 'mocked response' }
                })
            )
        })
    })

    describe('restore', () => {
        it('should continue in-flight blocked requests before removing the intercept', async () => {
            let resolveProvideResponse: () => void
            const provideResponsePromise = new Promise<void>((resolve) => {
                resolveProvideResponse = resolve
            })
            const browser = getResponseCollectionBrowserMock({}, {
                networkProvideResponse: vi.fn().mockReturnValue(provideResponsePromise),
                networkRemoveIntercept: vi.fn().mockResolvedValue(undefined),
                getWindowHandle: vi.fn().mockResolvedValue('handle-1'),
            })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            SESSION_MOCKS['handle-1'] = new Set([mock])

            mock.respond({ ok: true })
            browser.emit('network.responseStarted', {
                ...getResponseCollectionRequestStub(),
                intercepts: ['mock-id']
            })

            // provideResponse is still pending, so the request id must still be tracked
            // through restore even though reset()/clear() would otherwise wipe the set
            await mock.restore()

            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-123' })
            expect(browser.networkRemoveIntercept).toHaveBeenCalledWith({ intercept: 'mock-id' })

            resolveProvideResponse!()
            delete SESSION_MOCKS['handle-1']
        })
    })

    describe('url pattern matching', () => {
        const emitBlockedRequest = (browser: WebdriverIO.Browser, url: string) => browser.emit('network.beforeRequestSent', {
            isBlocked: true,
            request: {
                request: 123,
                url,
                method: 'GET',
                headers: []
            }
        })

        it('should match a glob pattern without leading slash', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate('**/api/users*', {}, browser)

            mock.abort()
            emitBlockedRequest(browser, 'https://foobar.com/api/users/123')

            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        })

        it('should accept a URLPattern', async () => {
            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate(new URLPattern({ pathname: '/api/users/*' }), {}, browser)

            mock.abort()
            emitBlockedRequest(browser, 'https://foobar.com/api/users/123')

            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        })

        /**
         * Node.js 24 has a global `URLPattern`. On Node.js 22 the polyfill import
         * above installs itself as the global, so there is no native one to test.
         */
        const NativeURLPattern = globalThis.URLPattern
        it.skipIf(NativeURLPattern === URLPattern)('should accept a native URLPattern', async () => {
            const polyfillBrowser = getResponseCollectionBrowserMock()
            await WebDriverInterception.initiate(new URLPattern({ pathname: '/api/users/*' }), {}, polyfillBrowser)

            const browser = getResponseCollectionBrowserMock()
            const mock = await WebDriverInterception.initiate(new NativeURLPattern({ pathname: '/api/users/*' }), {}, browser)

            expect(browser.networkAddIntercept).toHaveBeenCalledWith(
                vi.mocked(polyfillBrowser.networkAddIntercept).mock.calls[0][0]
            )
            expect(mock.isSameDefinition('/api/users/*')).toBe(true)
            expect(mock.isSameDefinition(new URLPattern({ pathname: '/api/users/*' }))).toBe(true)
            expect(mock.isSameDefinition(new NativeURLPattern({ pathname: '/api/users/*' }))).toBe(true)
            expect(mock.isSameDefinition(new NativeURLPattern({ pathname: '/api/posts/*' }))).toBe(false)

            mock.abort()
            emitBlockedRequest(browser, 'https://foobar.com/api/users/123')

            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        })
    })

    /**
     * `mock()` replaces a mock that has an identical definition, so the mocks that
     * can still overlap are the ones whose definitions differ while their patterns
     * match the same request. The driver then reports both intercepts on the event
     * and only the first release is accepted.
     */
    describe('a request blocked by more than one mock', () => {
        const TARGET_URL = 'https://foobar.com/api/users/123'

        const getBrowserMockWithUniqueIntercepts = () => {
            let interceptCount = 0
            return getResponseCollectionBrowserMock({}, {
                networkAddIntercept: vi.fn().mockImplementation(
                    () => Promise.resolve({ intercept: `mock-id-${++interceptCount}` })
                )
            })
        }

        const initiateOverlappingMocks = (browser: WebdriverIO.Browser) => Promise.all([
            WebDriverInterception.initiate(TARGET_URL, {}, browser),
            WebDriverInterception.initiate(TARGET_URL, { method: 'get' }, browser)
        ])

        const blockedBy = (intercepts: string[]) => ({
            isBlocked: true,
            intercepts,
            request: { request: 123, url: TARGET_URL, method: 'GET', headers: [] }
        })

        it('is continued once, not once per mock', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            await initiateOverlappingMocks(browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))

            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        })

        it('is responded to once, not once per mock', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            const [first, second] = await initiateOverlappingMocks(browser)
            first.respond({ from: 'first' })
            second.respond({ from: 'second' })

            browser.emit('network.responseStarted', {
                ...blockedBy(['mock-id-1', 'mock-id-2']),
                response: { headers: [], status: 200 }
            })

            expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        })

        it('is failed once when both mocks abort', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            const [first, second] = await initiateOverlappingMocks(browser)
            first.abort()
            second.abort()

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))

            expect(browser.networkFailRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        })

        it('lets the mock that matches win over one that only declines', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            // registered first, and it declines a GET
            await WebDriverInterception.initiate(TARGET_URL, { method: 'post' }, browser)
            // registered second, and this is the one the request belongs to
            const handling = await WebDriverInterception.initiate(TARGET_URL, { method: 'get' }, browser)
            handling.respond({ from: 'the matching mock' })

            browser.emit('network.responseStarted', {
                ...blockedBy(['mock-id-1', 'mock-id-2']),
                response: { headers: [], status: 200 }
            })
            await waitForAsyncHandlers()

            expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
            expect(browser.networkProvideResponse).toHaveBeenCalledWith(expect.objectContaining({
                request: 123,
                body: { type: 'string', value: JSON.stringify({ from: 'the matching mock' }) }
            }))
        })

        const deferredRequestBody = () => {
            let resolveBody!: (body: string) => void
            const lookup = new Promise<{ bytes: { type: 'string', value: string } }>((resolve) => {
                resolveBody = (body) => resolve({ bytes: { type: 'string', value: body } })
            })
            return { lookup, resolveBody }
        }

        const flushMicrotasks = async () => {
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
            await Promise.resolve()
        }

        it('does not let a declining mock release a request before a postData mock aborts it', async () => {
            const { lookup, resolveBody } = deferredRequestBody()
            const browser = getBrowserMockWithUniqueIntercepts()
            vi.mocked(browser.networkGetData).mockReturnValue(lookup)
            // registered first, and it declines a GET
            await WebDriverInterception.initiate(TARGET_URL, { method: 'post' }, browser)
            const handling = await WebDriverInterception.initiate(TARGET_URL, { postData: 'request-body' }, browser)
            handling.abort()

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))
            await Promise.resolve()

            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
            expect(browser.networkFailRequest).not.toHaveBeenCalled()

            resolveBody('request-body')
            await lookup
            await flushMicrotasks()

            expect(browser.networkFailRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
        })

        it('does not let a declining mock release a request before a postData mock overwrites it', async () => {
            const { lookup, resolveBody } = deferredRequestBody()
            const browser = getBrowserMockWithUniqueIntercepts()
            vi.mocked(browser.networkGetData).mockReturnValue(lookup)
            const handling = await WebDriverInterception.initiate(TARGET_URL, { postData: 'request-body' }, browser)
            handling.request({ method: 'PUT' })
            // registered second, so its microtask is queued after the body lookup starts
            await WebDriverInterception.initiate(TARGET_URL, { method: 'post' }, browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))
            await Promise.resolve()

            expect(browser.networkContinueRequest).not.toHaveBeenCalled()

            resolveBody('request-body')
            await lookup
            await flushMicrotasks()

            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledWith(expect.objectContaining({
                request: 123,
                method: 'PUT'
            }))
        })

        it('does not wait on a body lookup once a cheaper filter has declined', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            vi.mocked(browser.networkGetData).mockReturnValue(new Promise(() => {}))
            await WebDriverInterception.initiate(TARGET_URL, {
                method: 'post',
                postData: 'request-body'
            }, browser)
            await WebDriverInterception.initiate(TARGET_URL, { method: 'put' }, browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))
            await flushMicrotasks()

            expect(browser.networkGetData).not.toHaveBeenCalled()
            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        })

        it('still continues once when a postData mock declines after the body arrives', async () => {
            const { lookup, resolveBody } = deferredRequestBody()
            const browser = getBrowserMockWithUniqueIntercepts()
            vi.mocked(browser.networkGetData).mockReturnValue(lookup)
            await WebDriverInterception.initiate(TARGET_URL, { method: 'post' }, browser)
            await WebDriverInterception.initiate(TARGET_URL, { postData: 'request-body' }, browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))
            await Promise.resolve()

            expect(browser.networkContinueRequest).not.toHaveBeenCalled()

            resolveBody('other-body')
            await lookup
            await flushMicrotasks()

            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
            expect(browser.networkFailRequest).not.toHaveBeenCalled()
        })

        it('evaluates a function method filter once when the mock also filters postData', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            let methodChecks = 0
            const handling = await WebDriverInterception.initiate(TARGET_URL, {
                method: () => {
                    methodChecks += 1
                    return methodChecks === 1
                },
                postData: 'request-body'
            }, browser)
            handling.abort()

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1']))
            await flushMicrotasks()

            expect(methodChecks).toBe(1)
            expect(browser.networkFailRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
            expect(browser.networkContinueRequest).not.toHaveBeenCalled()
        })

        it('still releases a request that every mock declines', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            await WebDriverInterception.initiate(TARGET_URL, { method: 'post' }, browser)
            await WebDriverInterception.initiate(TARGET_URL, { method: 'put' }, browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1', 'mock-id-2']))
            await waitForAsyncHandlers()

            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        })

        it('still lets a single mock release the same request in both phases', async () => {
            const browser = getBrowserMockWithUniqueIntercepts()
            await WebDriverInterception.initiate(TARGET_URL, {}, browser)

            browser.emit('network.beforeRequestSent', blockedBy(['mock-id-1']))
            browser.emit('network.responseStarted', {
                ...blockedBy(['mock-id-1']),
                response: { headers: [], status: 200 }
            })

            expect(browser.networkContinueRequest).toHaveBeenCalledTimes(1)
            expect(browser.networkProvideResponse).toHaveBeenCalledTimes(1)
        })
    })
})
