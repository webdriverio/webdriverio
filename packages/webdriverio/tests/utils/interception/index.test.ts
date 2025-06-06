import { EventEmitter } from 'node:events'
import { describe, it, expect, vi } from 'vitest'
import { type local, type remote } from 'webdriver'
import WebDriverInterception from '../../../src/utils/interception/index.js'
import logger from '@wdio/logger'

describe('WebDriverInterception', () => {
    it('initiate', async () => {
        const browser: any = {
            on: vi.fn(),
            sessionSubscribe: vi.fn().mockReturnValue(Promise.resolve()),
            networkAddIntercept: vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' }))
        }
        const mock = await WebDriverInterception.initiate('http://foobar.com:1234/foo/bar.html?foo=bar', {
            method: 'GET',
            requestHeaders: { foo: 'bar' },
            responseHeaders: { bar: 'foo' },
            statusCode: 200
        }, browser)
        expect(mock).toBeInstanceOf(WebDriverInterception)
        expect(browser.on).toHaveBeenCalledTimes(2)
        expect(browser.sessionSubscribe).toHaveBeenCalledTimes(1)
        expect(browser.networkAddIntercept).toHaveBeenCalledTimes(1)
        expect(browser.networkAddIntercept.mock.calls).toMatchInlineSnapshot(`
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
        const browser: any = new EventEmitter()
        browser.sessionSubscribe = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkAddIntercept = vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' }))
        browser.networkContinueRequest = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkFailRequest = vi.fn().mockReturnValue(Promise.resolve())
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
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()
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
        browser.networkContinueRequest.mockClear()

        mock.redirect('https://webdriver.io')
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({
            request: 123,
            url: 'https://webdriver.io'
        })
        browser.networkContinueRequest.mockClear()

        mock.abort()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()

        mock.request({ method: 'POST', headers: { foo: 'bar' }, body: 'foobar' })
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest.mock.calls).toMatchInlineSnapshot(`
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
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()

        /**
         * allows to overwrite mock behavior, e.g. by having a mock to abort
         */
        mock.abort()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()

        mock.requestOnce({ method: 'POST', headers: { foo: 'bar' }, body: 'foobar' })
        mock.abortOnce()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)
        expect(browser.networkContinueRequest.mock.calls).toMatchInlineSnapshot(`
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
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkContinueRequest).toHaveBeenCalledTimes(0)
        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()
        browser.emit('network.beforeRequestSent', blockedRequest)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 123 })
        expect(browser.networkFailRequest).toHaveBeenCalledTimes(0)

        browser.networkContinueRequest.mockClear()
        browser.networkFailRequest.mockClear()
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
        const browser: any = new EventEmitter()
        browser.sessionSubscribe = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkProvideResponse = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkAddIntercept = vi.fn().mockReturnValue(Promise.resolve({ intercept: '123' }))
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
        const browser: any = new EventEmitter()
        browser.sessionSubscribe = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkProvideResponse = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkAddIntercept = vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' }))

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
            },
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
        expect(browser.networkProvideResponse.mock.calls).toMatchInlineSnapshot(`
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
        const browser: any = new EventEmitter()
        browser.sessionSubscribe = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkProvideResponse = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkAddIntercept = vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' }))

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
            },
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
        expect(browser.networkProvideResponse.mock.calls).toMatchInlineSnapshot(`
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
        const browser: any = new EventEmitter()
        browser.sessionSubscribe = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkProvideResponse = vi.fn().mockReturnValue(Promise.resolve())
        browser.networkAddIntercept = vi.fn().mockReturnValue(Promise.resolve({ intercept: 'mock-id' }))

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
})
