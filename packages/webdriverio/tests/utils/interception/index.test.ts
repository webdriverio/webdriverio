import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type local } from 'webdriver'
import WebDriverInterception from '../../../src/utils/interception/index.js'
import logger from '@wdio/logger'

type WebDriverInterceptionClass = typeof WebDriverInterception

describe('WebDriverInterception', () => {
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

    it('handleBeforeRequestSent', async () => {
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' })),
            networkContinueRequest: vi.fn().mockReturnValue(Promise.resolve()),
            networkFailRequest: vi.fn().mockReturnValue(Promise.resolve())
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser
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
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser
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
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser

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
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser

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
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' }))
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser

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
        const browser = Object.assign(new EventEmitter(), {
            options: {},
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
            networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' })),
            networkGetData: vi.fn().mockImplementation(() => {
                return Promise.resolve({ bytes: { type: 'string', value: 'response-body' } })
            })
        } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser

        const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)

        const request = {
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
        } satisfies Partial<local.NetworkResponseStartedParameters> as local.NetworkResponseStartedParameters

        // Response started populates calls
        browser.emit('network.responseStarted', request)
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0].body).toBeUndefined()

        // Response completed fetches body
        // responseCompleted is not blocked
        const completedRequest = { ...request, isBlocked: false } satisfies Partial<local.NetworkResponseCompletedParameters> as unknown as local.NetworkResponseCompletedParameters
        browser.emit('network.responseCompleted', completedRequest)

        // Use setImmediate to wait for promise resolution in handler
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(browser.networkGetData).toHaveBeenCalledWith({
            request: 'req-123',
            dataType: 'response'
        })
        expect(mock.calls[0].body).toBe('response-body')
    })

    describe('WebDriverInterception options', () => {
        let WebDriverInterception: WebDriverInterceptionClass

        const getBrowserMock = (options: WebdriverIO.Browser['options'] = {}) => {
            const browser = Object.assign(new EventEmitter(), {
                options,
                sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
                networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' })),
                networkAddDataCollector: vi.fn().mockReturnValue(Promise.resolve({ collector: '123' })),
                networkProvideResponse: vi.fn().mockReturnValue(Promise.resolve()),
                networkGetData: vi.fn().mockReturnValue(Promise.resolve({ bytes: { type: 'string', value: 'response-body' } }))
            } satisfies Partial<WebdriverIO.Browser>) as unknown as WebdriverIO.Browser
            vi.spyOn(browser, 'on')
            return browser
        }

        const getRequestStub = () => ({
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

        beforeEach(async () => {
            vi.resetModules()
            WebDriverInterception = (await import('../../../src/utils/interception/index.js')).default
        })

        it('initiate should NOT add data collector if maxEncodedDataSize is 0', async () => {
            const browser = getBrowserMock({ maxEncodedDataSize: 0 })
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).not.toHaveBeenCalled()
        })

        it('initiate should add data collector with default size if maxEncodedDataSize is not provided', async () => {
            const browser = getBrowserMock()
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).toHaveBeenCalledWith({
                dataTypes: ['response'],
                maxEncodedDataSize: 10 * 1024 * 1024
            })
        })

        it('initiate should add data collector with custom size', async () => {
            const browser = getBrowserMock({ maxEncodedDataSize: 1024 })
            await WebDriverInterception.initiate('http://foobar.com', {}, browser)
            expect(browser.networkAddDataCollector).toHaveBeenCalledWith({
                dataTypes: ['response'],
                maxEncodedDataSize: 1024
            })
        })

        it('should NOT fetch response body on responseCompleted if maxEncodedDataSize is 0', async () => {
            const browser = getBrowserMock({ maxEncodedDataSize: 0 })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getRequestStub()

            // Response started populates calls
            browser.emit('network.responseStarted', request)
            expect(mock.calls.length).toBe(1)

            // Response completed fetches body
            const completedRequest = { ...request, isBlocked: false } satisfies Partial<local.NetworkResponseCompletedParameters> as unknown as local.NetworkResponseCompletedParameters
            browser.emit('network.responseCompleted', completedRequest)

            // Use setImmediate to wait for promise resolution in handler
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(browser.networkGetData).not.toHaveBeenCalled()
        })

        it('should fetch response body on responseCompleted if maxEncodedDataSize is > 0', async () => {
            const browser = getBrowserMock({ maxEncodedDataSize: 1024 })
            const mock = await WebDriverInterception.initiate('http://test.com/**', {}, browser)
            const request = getRequestStub()

            // Response started populates calls
            browser.emit('network.responseStarted', request)
            expect(mock.calls.length).toBe(1)

            // Response completed fetches body
            const completedRequest = { ...request, isBlocked: false } as Partial<local.NetworkResponseCompletedParameters> as local.NetworkResponseCompletedParameters
            browser.emit('network.responseCompleted', completedRequest)

            // Use setImmediate to wait for promise resolution in handler
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(browser.networkGetData).toHaveBeenCalledWith({
                request: 'req-123',
                dataType: 'response'
            })
        })
    })
})

