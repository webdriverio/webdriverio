import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type local } from 'webdriver'
import WebDriverInterception from '../../../src/utils/interception/index.js'
import logger from '@wdio/logger'

type WebDriverInterceptionClass = typeof WebDriverInterception

const { loggerMock } = vi.hoisted(() => ({
    loggerMock: {
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
            } satisfies Partial<local.NetworkRequestData> as unknown as     local.NetworkRequestData,
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
                const browser = getResponseCollectionBrowserMock({ maxSpyCollectedBodySize: 1024 }, {
                    networkGetData: vi.fn().mockImplementation(() => new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                bytes: { type: 'string', value: 'response-body' }
                            })
                        }, 50)
                    }))
                })
                const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
                const request = getResponseCollectionRequestStub()

                browser.emit('network.responseStarted', request)
                browser.emit('network.responseCompleted', { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters)

                await waitForAsyncHandlers(25)
                expect(mock.hasAtLeastOneResponseReceived).toBe(false)

                await waitForAsyncHandlers(100)
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
})
