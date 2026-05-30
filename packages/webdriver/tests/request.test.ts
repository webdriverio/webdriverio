import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import path from 'node:path'

import logger from '@wdio/logger'
import type { Options } from '@wdio/types'
import { getGlobalDispatcher, ProxyAgent, Agent } from 'undici'

import '../src/browser.js'
import { FetchRequest as WebFetchRequest } from '../src/request/web.js'
import { FetchRequest, SESSION_DISPATCHERS } from '../src/request/node.js'
import { environment } from '../src/environment.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fetch')
vi.mock('undici', () => {
    return {
        fetch: vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })),
        Agent: vi.fn().mockImplementation(() => ({ close: vi.fn() })),
        ProxyAgent: vi.fn().mockImplementation(() => ({ close: vi.fn() })),
        getGlobalDispatcher: vi.fn(),
        setGlobalDispatcher: vi.fn()
    }
})

const { warn, error } = logger('test')

const webdriverPath = '/session'
const defaultOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    connectionRetryTimeout: 10000
}
const baseUrl = `${defaultOptions.protocol}://${defaultOptions.hostname}:${defaultOptions.port}`

describe('webdriver request', () => {
    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        SESSION_DISPATCHERS.clear()
        // Reset environment variables
        environment.value.variables.PROXY_URL = undefined
        environment.value.variables.NO_PROXY = []
        // Clear all mocks from undici
        const { getGlobalDispatcher, ProxyAgent, Agent } = vi.mocked(await import('undici'))
        vi.mocked(getGlobalDispatcher).mockClear()
        vi.mocked(ProxyAgent).mockClear()
        vi.mocked(Agent).mockClear()
    })

    it('should have some default options', () => {
        const req = new WebFetchRequest('POST', '/foo/bar', { foo: 'bar' })
        expect(req.method).toBe('POST')
        expect(req.endpoint).toBe('/foo/bar')
    })

    it('should be able to make request', async () => {
        const req = new WebFetchRequest('POST', '/foo/bar', { foo: 'bar' })
        const url =  new URL('/foo/bar', baseUrl)
        req.createOptions = vi.fn().mockImplementation((opts, sessionId) => ({
            url,
            requestOptions:{
                foo: 'bar',
                sessionId
            }
        }))
        req['_request'] = vi.fn()

        await req.makeRequest({ connectionRetryCount: 43, logLevel: 'warn' }, 'some_id')
        expect(req['_request']).toHaveBeenCalledWith(
            url,
            expect.objectContaining({ foo: 'bar', sessionId: 'some_id' }),
            undefined,
            43,
            0
        )
    })

    it('should pick up the fullRequestOptions returned by transformRequest', async () => {
        const req = new WebFetchRequest('POST', '/foo/bar', { foo: 'bar' })
        const transformRequest = vi.fn().mockImplementation((requestOptions) => ({
            ...requestOptions,
            body: JSON.stringify({ foo: 'baz' })
        }))

        await req.makeRequest({
            transformRequest,
            protocol: 'https',
            hostname: 'localhost',
            port: 4445,
            path: '/wd/hub/',
            logLevel: 'warn'
        }, 'some_id')
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ body: JSON.stringify({ foo: 'baz' }) })
        )
    })

    it('should resolve with the body returned by transformResponse', async () => {
        const req = new WebFetchRequest('POST', 'session/:sessionId/element', { foo: 'requestBody' })

        const transformResponse = vi.fn().mockImplementation((response) => ({
            ...response,
            body: { value: { foo: 'transformedResponse' } },
        }))

        vi.mocked(fetch).mockClear()
        const responseBody = await req.makeRequest({
            transformResponse,
            protocol: 'https',
            hostname: 'localhost',
            port: 4445,
            path: '/wd/hub/',
            logLevel: 'warn'
        }, 'foobar-123')

        expect(transformResponse.mock.calls[0][0]).toHaveProperty('body')
        expect(transformResponse.mock.calls[0][1].body).toEqual(JSON.stringify({ foo: 'requestBody' }))
        await expect(responseBody).toEqual({ value: { foo: 'transformedResponse' } })
        vi.mocked(fetch).mockClear()
    })

    describe('createOptions', () => {
        it('fails if command requires sessionId but none given', async () => {
            const req = new WebFetchRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            await expect(() => req.createOptions({ logLevel: 'warn' })).rejects.toThrow('A sessionId is required')
        })

        it('creates proper options set', async () => {
            const req = new WebFetchRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            const { url, requestOptions } = await req.createOptions({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                headers: { foo: 'bar' },
                connectionRetryTimeout: 10 * 1000,
                logLevel: 'warn'
            }, 'foobar12345')

            expect((url! as URL).href)
                .toBe('https://localhost:4445/session/foobar12345/element')
            expect([...(requestOptions.headers as unknown as Map<string, string>).keys()])
                .toEqual(['accept', 'connection', 'content-length', 'content-type', 'foo', 'user-agent'])
            expect(requestOptions.signal?.aborted).toBeFalsy()
        })

        it('ignors path when command is a hub command', async () => {
            const req = new WebFetchRequest('POST', '/grid/api/hub', {}, undefined, true)
            const options = await req.createOptions({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar12345')
            expect((options.url as URL).href).toBe('https://localhost:4445/grid/api/hub')
        })

        it('should add authorization header if user and key is given', async () => {
            const req = new WebFetchRequest('POST', webdriverPath, { some: 'body' })
            const user = 'foo'
            const key = 'bar'
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                user,
                key,
                path: '/',
                logLevel: 'warn'
            })
            expect((requestOptions.headers as unknown as Map<string, string>).get('Authorization')).toEqual('Basic ' + btoa(user + ':' + key))
            expect(requestOptions.body).toEqual(JSON.stringify({ some: 'body' }))
        })

        it('sets request body to "undefined" when request object is empty and DELETE is used', async () => {
            const req = new WebFetchRequest('DELETE', webdriverPath, {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(requestOptions.body)).toEqual(false)
        })

        it('sets request body to "undefined" when request object is empty and GET is used', async () => {
            const req = new WebFetchRequest('GET', `${webdriverPath}/title`, {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(requestOptions.body)).toEqual(false)
        })

        it('should attach an empty object body when POST is used', async () => {
            const req = new WebFetchRequest('POST', '/status', {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(requestOptions.body).toEqual('{}')
        })

        it('should add the Content-Length header when a request object has a body', async () => {
            const req = new WebFetchRequest('POST', webdriverPath, { foo: 'bar' })
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect([...(requestOptions.headers as unknown as Map<string, string>).keys()])
                .toEqual(['accept', 'connection', 'content-length', 'content-type', 'user-agent'])
            expect((requestOptions.headers as unknown as Map<string, string>).get('Content-Length')).toBe('13')
        })

        it('should add Content-Length as well any other header provided in the request options if there is body in the request object', async () => {
            const req = new WebFetchRequest('POST', webdriverPath, { foo: 'bar' })
            const { requestOptions } = await req.createOptions({
                ...defaultOptions, path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            expect((requestOptions.headers as unknown as Map<string, string>).get('foo')).toContain('bar')
            expect((requestOptions.headers as unknown as Map<string, string>).get('Content-Length')).toBe('13')
        })

        it('should add only the headers provided if the request body is empty', async () => {
            const req = new WebFetchRequest('POST', webdriverPath)
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            expect([...(requestOptions.headers as unknown as Map<string, string>).keys()]).not.toContain('content-length')
            expect((requestOptions.headers as unknown as Map<string, string>).get('foo')).toContain('bar')
        })
    })

    describe('_request', () => {
        it('should make a request', async () => {
            const expectedResponse = { value: { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } }
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance
            })

            const url = new URL('/session/foobar-123/element', baseUrl)
            const opts = {}
            const res = await req['_request'](url, opts)

            expect(res).toEqual(expectedResponse)
            expect(onResponse).toHaveBeenNthCalledWith(1, { result: expectedResponse })
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({
                request: opts,
                durationMillisecond: expect.any(Number),
                retryCount: 0,
                success: true,
            }))
        })

        it('should short circuit if request throws a stale element exception', async () => {
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', 'session/:sessionId/element', {}, undefined, false, {
                onResponse, onPerformance
            })

            const url = new URL('/session/foobar-123/element/some-sub-sub-elem-231/click', baseUrl)
            const opts = Object.assign({
                body: JSON.stringify({ foo: 'bar' })
            })

            const error = await req['_request'](url, opts).catch(err => err)
            expect(error.message).toContain('element is not attached to the page document')
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(1)
            expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        })

        it('should not fail code due to an empty server response', async () => {
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance
            })

            const url = new URL('/empty', baseUrl)
            const opts = {}
            await expect(req['_request'](url, opts)).rejects.toEqual(expect.objectContaining({
                message: expect.stringContaining('Response has empty body')
            }))
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(0)
            expect(vi.mocked(error).mock.calls).toHaveLength(1)
        })

        it('should retry requests but still fail', async () => {
            const onRetry = vi.fn()
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance, onRetry
            })

            const url = new URL('/failing', baseUrl)
            const opts = {}
            await expect(req['_request'](url, opts, undefined, 2)).rejects.toEqual(expect.objectContaining({
                message: expect.stringContaining('unknown error')
            }))
            expect(onRetry).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(2, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(2, expect.objectContaining({ success: false }))
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(3, expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(2)
            expect(vi.mocked(error).mock.calls).toHaveLength(1)
        })

        it('should retry and eventually respond', async () => {
            const onRetry = vi.fn()
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance, onRetry
            })

            const url = new URL('/failing', baseUrl)
            const opts = Object.assign({ body: JSON.stringify({ foo: 'bar' }) })
            expect(await req['_request'](url, opts, undefined, 3)).toEqual({ value: 'caught' })
            expect(onRetry).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(2, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(2, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(3, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(3, expect.objectContaining({ success: false }))
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(4, expect.objectContaining({ success: true }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(3)
            expect(vi.mocked(error).mock.calls).toHaveLength(0)
        })

        it('should retry requests with html response but still fail', async () => {
            const onRetry = vi.fn()
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance, onRetry
            })

            const url = new URL('/failing-html', baseUrl)
            const opts = {}
            await expect(req['_request'](url, opts, undefined, 2)).rejects.toEqual(expect.objectContaining({
                message: expect.stringContaining('<title>504 Gateway Time-out</title>')
            }))
            expect(onRetry).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(2, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(2, expect.objectContaining({ success: false }))
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(3, expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(2)
            expect(vi.mocked(error).mock.calls).toHaveLength(1)
        })

        it('should retry request with html response and eventually respond', async () => {
            const onRetry = vi.fn()
            const onResponse = vi.fn()
            const onPerformance = vi.fn()
            const req = new WebFetchRequest('POST', webdriverPath, {}, undefined, false, {
                onResponse, onPerformance, onRetry
            })

            const url = new URL('/failing-html', baseUrl)
            const opts = Object.assign({ body: JSON.stringify({ foo: 'bar' }) })
            expect(await req['_request'](url, opts, undefined, 3)).toEqual({ value: 'caught-html' })
            expect(onRetry).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(2, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(2, expect.objectContaining({ success: false }))
            expect(onRetry).toHaveBeenNthCalledWith(3, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(3, expect.objectContaining({ success: false }))
            expect(onResponse).toHaveBeenNthCalledWith(1, expect.anything())
            expect(onPerformance).toHaveBeenNthCalledWith(4, expect.objectContaining({ success: true }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(3)
            expect(vi.mocked(error).mock.calls).toHaveLength(0)
        })

        it('should manage hub commands', async () => {
            const req = new WebFetchRequest('POST', '/grid/api/hub', {}, undefined, true)
            expect(await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar')).toEqual({ value: { some: 'config' } })
        })

        it('should fail if hub command is called on node', async () => {
            const req = new WebFetchRequest('POST', '/grid/api/testsession', {}, undefined, true)
            const result = await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar').then(
                (res) => res,
                (e) => e
            )
            expect(result.message).toBe('Command can only be called to a Selenium Hub')
        })

        describe('"ETIMEDOUT" error', () => {
            it('should throw if timeout happens too often', async () => {
                const retryCnt = 3
                const onRetry = vi.fn()
                const req = new WebFetchRequest('POST', '/timeout', {}, undefined, true, { onRetry })
                const result = await req.makeRequest({
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 4445,
                    path: '/',
                    connectionRetryCount: retryCnt,
                    logLevel: 'warn'
                }, 'foobar').then(
                    (res) => res,
                    (e) => e
                )
                expect(result.code).toBe('ETIMEDOUT')
                expect(onRetry).toBeCalledTimes(retryCnt)
            })

            it('should use error from "getRequestError" helper', async () => {
                const onRetry = vi.fn()
                const onRequest = vi.fn()
                const onResponse = vi.fn()
                const onPerformance = vi.fn()
                const req = new WebFetchRequest('GET', '/timeout', {}, undefined, true, { onRetry, onRequest, onResponse, onPerformance })
                const reqOpts = {
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 4445,
                    path: '/',
                } as Options.WebDriver
                await req.makeRequest(reqOpts, 'foobar')
                    // ignore error
                    .catch((e) => e)

                expect(vi.mocked(onRetry).mock.calls).toHaveLength(0)
                expect(onRequest).toHaveBeenNthCalledWith(1, expect.anything())
                expect(onResponse).toHaveBeenNthCalledWith(1, { error: expect.objectContaining({ code: 'ETIMEDOUT' }) })
                expect(onPerformance).toHaveBeenNthCalledWith(1, expect.objectContaining({ success: false }))
            })
        })

        it('should return proper response if retry passes', async () => {
            const retryCnt = 7
            const onRetry = vi.fn()
            const req = new WebFetchRequest('POST', '/timeout', {}, undefined, true, { onRetry })
            const result = await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/timeout',
                connectionRetryCount: retryCnt,
                logLevel: 'warn'
            }, 'foobar').then(
                (res) => res,
                (e) => e
            )
            expect(result).toEqual({ value: {} })
            expect(onRetry).toBeCalledTimes(5)
        }, 20_000)

        it('should retry on connection refused error', async () => {
            const retryCnt = 7
            const onRetry = vi.fn()
            const req = new WebFetchRequest('POST', '/connectionRefused', {}, undefined, false, { onRetry })
            const result = await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                connectionRetryCount: retryCnt,
                logLevel: 'warn'
            }, 'foobar').then(
                (res) => res,
                (e) => e
            )
            expect(result).toEqual({ value: { foo: 'bar' } })
            expect(onRetry).toBeCalledTimes(5)
        }, 20_000)

        it('should throw if request error is unknown', async () => {
            const req = new WebFetchRequest('POST', '/sumoerror', {}, undefined, true)
            const result = await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/sumoerror',
                connectionRetryCount: 0,
                logLevel: 'warn'
            }, 'foobar').then(
                (res) => res,
                (e) => e
            )
            expect(result.message).toEqual(expect.stringContaining('ups'))
        })

        it('should validate dispatcher is reused within the same session', async () => {
            const sessionId = 'reuse-session-id'

            const req1 = new FetchRequest('POST', `/session/${sessionId}/element`, {})
            const req2 = new FetchRequest('GET', `/session/${sessionId}/cookie`, {})
            await req1.makeRequest(defaultOptions, sessionId).then((res) => res, (e) => e)
            await req2.makeRequest(defaultOptions, sessionId).then((res) => res, (e) => e)

            expect(SESSION_DISPATCHERS.has(sessionId)).toBe(true)
            expect(SESSION_DISPATCHERS.size).toBe(1)
        })

        it('should validate a new dispatcher is created for each individual session', async () => {
            const sessionId1 = 'session-id-1'
            const sessionId2 = 'session-id-2'

            const req1 = new FetchRequest('POST', `/session/${sessionId1}/element`, {})
            const req2 = new FetchRequest('GET', `/session/${sessionId2}/cookie`, {})
            await req1.makeRequest(defaultOptions, sessionId1).then((res) => res, (e) => e)
            await req2.makeRequest(defaultOptions, sessionId2).then((res) => res, (e) => e)

            expect(SESSION_DISPATCHERS.has(sessionId1)).toBe(true)
            expect(SESSION_DISPATCHERS.has(sessionId2)).toBe(true)
            expect(SESSION_DISPATCHERS.size).toBe(2)
        })

        it('should cleanup session dispatcher on DELETE /session/:sessionId', async () => {
            const sessionId = 'delete-session-id'
            const deleteSessionRequest = new FetchRequest('DELETE', `/session/${sessionId}`, {})
            const getElementRequest = new FetchRequest('POST', `/session/${sessionId}/element`, {})

            // initial request to initialize the dispatcher map
            await getElementRequest.makeRequest(defaultOptions, sessionId).then((res) => res, (e) => e)
            expect(SESSION_DISPATCHERS.has(sessionId)).toBe(true)

            const currentDispatcher = SESSION_DISPATCHERS.get(sessionId) || { close:undefined }
            await deleteSessionRequest.makeRequest(defaultOptions, sessionId).then((res) => res, (e) => e)

            expect(currentDispatcher.close).toHaveBeenCalled()
            expect(SESSION_DISPATCHERS.has(sessionId)).toBe(false)
            expect(SESSION_DISPATCHERS.size).toBe(0)
        })

        it('should not cleanup session dispatcher on non delete session DELETE requests', async () => {
            const sessionId = 'other-delete-session-id'
            const deleteCookieRequest = new FetchRequest('DELETE', `/session/${sessionId}/cookie`, {})

            await deleteCookieRequest.makeRequest(defaultOptions, sessionId).then((res) => res, (e) => e)
            expect(SESSION_DISPATCHERS.has(sessionId)).toBe(true)

            const currentDispatcher = SESSION_DISPATCHERS.get(sessionId) || { close:undefined }

            expect(currentDispatcher.close).not.toHaveBeenCalled()
            expect(SESSION_DISPATCHERS.has(sessionId)).toBe(true)
            expect(SESSION_DISPATCHERS.size).toBe(1)
        })
    })

    describe('proxy configuration', () => {
        beforeEach(() => {
            // Reset environment variables before each test
            environment.value.variables.PROXY_URL = undefined
            environment.value.variables.NO_PROXY = []
            vi.mocked(getGlobalDispatcher).mockReturnValue({
                close: vi.fn(),
                constructor: { name: 'ProxyAgent' }
            } as any)
        })

        it('should use global dispatcher if set', async () => {
            const { getGlobalDispatcher, ProxyAgent } = await import('undici')
            const customDispatcher = { type: 'custom-proxy', close: vi.fn() }

            // Mock getGlobalDispatcher to return a custom dispatcher
            vi.mocked(getGlobalDispatcher).mockReturnValue(customDispatcher as any)

            const req = new FetchRequest('GET', '/test', {})
            const { requestOptions } = await req.createOptions(defaultOptions) as { requestOptions: any }

            expect(requestOptions.dispatcher).toBe(customDispatcher)
            expect(ProxyAgent).not.toHaveBeenCalled()
        })

        it('should fall back to environment variables if no global dispatcher is set', async () => {
            // Mock getGlobalDispatcher to return a default Agent (meaning no custom global dispatcher)
            const defaultAgent = { type: 'default-agent', close: vi.fn(), constructor: { name: 'Agent' } }
            vi.mocked(Agent).mockReturnValue(defaultAgent as any)
            vi.mocked(getGlobalDispatcher).mockReturnValue(defaultAgent as any)

            // Set proxy environment variable
            environment.value.variables.PROXY_URL = 'http://proxy.example.com:8080'

            const req = new FetchRequest('GET', '/test', {})
            await req.createOptions(defaultOptions)

            expect(ProxyAgent).toHaveBeenCalledWith({
                uri: 'http://proxy.example.com:8080',
                connectTimeout: defaultOptions.connectionRetryTimeout,
                headersTimeout: defaultOptions.connectionRetryTimeout,
                bodyTimeout: defaultOptions.connectionRetryTimeout,
            })
        })

        it('should use environment proxy unless excluded by NO_PROXY', async () => {
            // Mock getGlobalDispatcher to return a default Agent
            const defaultAgent = { type: 'default-agent', close: vi.fn(), constructor: { name: 'Agent' } }
            vi.mocked(Agent).mockReturnValue(defaultAgent as any)
            vi.mocked(getGlobalDispatcher).mockReturnValue(defaultAgent as any)

            environment.value.variables.PROXY_URL = 'http://proxy.example.com:8080'
            environment.value.variables.NO_PROXY = ['localhost', '.internal.com']

            const req = new FetchRequest('GET', '/test', {})

            // Reset mocks before tests
            vi.mocked(ProxyAgent).mockClear()
            vi.mocked(Agent).mockClear()

            // Should use proxy for external host
            await req.createOptions({ ...defaultOptions, hostname: 'external.com' })
            expect(ProxyAgent).toHaveBeenCalledTimes(1)
            expect(Agent).toHaveBeenCalledTimes(0)

            vi.mocked(ProxyAgent).mockClear()
            vi.mocked(Agent).mockClear()

            // Should not use proxy for excluded host
            await req.createOptions({ ...defaultOptions, hostname: 'api.internal.com' })
            expect(ProxyAgent).not.toHaveBeenCalled()
            expect(Agent).toHaveBeenCalledTimes(1) // Once for global dispatcher mock, once for actual dispatcher
        })

        it('should handle getGlobalDispatcher errors gracefully', async () => {
            // Mock getGlobalDispatcher to throw an error
            vi.mocked(getGlobalDispatcher).mockImplementation(() => {
                throw new Error('getGlobalDispatcher not available')
            })

            environment.value.variables.PROXY_URL = 'http://proxy.example.com:8080'

            const req = new FetchRequest('GET', '/test', {})
            await req.createOptions(defaultOptions)

            // Should fall back to environment variables
            expect(ProxyAgent).toHaveBeenCalledWith({
                uri: 'http://proxy.example.com:8080',
                connectTimeout: defaultOptions.connectionRetryTimeout,
                headersTimeout: defaultOptions.connectionRetryTimeout,
                bodyTimeout: defaultOptions.connectionRetryTimeout,
            })
        })

        it('should not use proxy if neither global dispatcher nor env vars are set', async () => {
            // Mock getGlobalDispatcher to return a default Agent
            const defaultAgent = { type: 'default-agent', close: vi.fn(), constructor: { name: 'Agent' } }
            vi.mocked(Agent).mockReturnValue(defaultAgent as any)
            vi.mocked(getGlobalDispatcher).mockReturnValue(defaultAgent as any)

            // Ensure no proxy environment variables are set
            environment.value.variables.PROXY_URL = undefined

            const req = new FetchRequest('GET', '/test', {})
            await req.createOptions(defaultOptions)

            expect(ProxyAgent).not.toHaveBeenCalled()
            expect(Agent).toHaveBeenCalledTimes(1)
        })
    })

    afterEach(() => {
        // @ts-ignore
        vi.mocked(fetch).retryCnt = 0

        vi.mocked(fetch).mockClear()
        vi.mocked(warn).mockClear()
        vi.mocked(error).mockClear()

        SESSION_DISPATCHERS.clear()

        // Reset environment variables
        environment.value.variables.PROXY_URL = undefined
        environment.value.variables.NO_PROXY = []
    })
})
