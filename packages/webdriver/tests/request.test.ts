import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import path from 'node:path'

import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import '../src/browser.js'
import { FetchRequest } from '../src/request/web.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fetch')
const { warn, error } = logger('test')

const webdriverPath = '/session'
const defaultOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444
}
const baseUrl = `${defaultOptions.protocol}://${defaultOptions.hostname}:${defaultOptions.port}`

describe('webdriver request', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should have some default options', () => {
        const req = new FetchRequest('POST', '/foo/bar', { foo: 'bar' })
        expect(req.method).toBe('POST')
        expect(req.endpoint).toBe('/foo/bar')
    })

    it('should be able to make request', async () => {
        const req = new FetchRequest('POST', '/foo/bar', { foo: 'bar' })
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
        const req = new FetchRequest('POST', '/foo/bar', { foo: 'bar' })
        const transformRequest = vi.fn().mockImplementation((requestOptions) => ({
            ...requestOptions,
            body: { foo: 'baz' }
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
            expect.objectContaining({ body: JSON.stringify( { foo: 'baz' }) })
        )
    })

    it('should resolve with the body returned by transformResponse', async () => {
        const req = new FetchRequest('POST', 'session/:sessionId/element', { foo: 'requestBody' })

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
        expect(transformResponse.mock.calls[0][1].body).toEqual({ foo: 'requestBody' })
        await expect(responseBody).toEqual({ value: { foo: 'transformedResponse' } })
        vi.mocked(fetch).mockClear()
    })

    describe('createOptions', () => {
        it('fails if command requires sessionId but none given', async () => {
            const req = new FetchRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            await expect(() => req.createOptions({ logLevel: 'warn' })).rejects.toThrow('A sessionId is required')
        })

        it('creates proper options set', async () => {
            const req = new FetchRequest('POST', `${webdriverPath}/:sessionId/element`, {})
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
            const req = new FetchRequest('POST', '/grid/api/hub', {}, true)
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
            const req = new FetchRequest('POST', webdriverPath, { some: 'body' })
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
            expect(requestOptions.body).toEqual({ some: 'body' })
        })

        it('sets request body to "undefined" when request object is empty and DELETE is used', async () => {
            const req = new FetchRequest('DELETE', webdriverPath, {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(requestOptions.body)).toEqual(false)
        })

        it('sets request body to "undefined" when request object is empty and GET is used', async () => {
            const req = new FetchRequest('GET', `${webdriverPath}/title`, {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(requestOptions.body)).toEqual(false)
        })

        it('should attach an empty object body when POST is used', async () => {
            const req = new FetchRequest('POST', '/status', {})
            const { requestOptions } = await req.createOptions({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(requestOptions.body).toEqual({})
        })

        it('should add the Content-Length header when a request object has a body', async () => {
            const req = new FetchRequest('POST', webdriverPath, { foo: 'bar' })
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
            const req = new FetchRequest('POST', webdriverPath, { foo: 'bar' })
            const { requestOptions } = await req.createOptions({
                ...defaultOptions, path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            expect((requestOptions.headers as unknown as Map<string, string>).get('foo')).toContain('bar')
            expect((requestOptions.headers as unknown as Map<string, string>).get('Content-Length')).toBe('13')
        })

        it('should add only the headers provided if the request body is empty', async () => {
            const req = new FetchRequest('POST', webdriverPath)
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
            const req = new FetchRequest('POST', webdriverPath, {}, false, {
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
            const req = new FetchRequest('POST', 'session/:sessionId/element', {}, false, {
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
            const req = new FetchRequest('POST', webdriverPath, {}, false, {
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
            const req = new FetchRequest('POST', webdriverPath, {}, false, {
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
            const req = new FetchRequest('POST', webdriverPath, {}, false, {
                onResponse, onPerformance, onRetry
            })

            const url = new URL('/failing', baseUrl)
            const opts = Object.assign({ body: { foo: 'bar' } })
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

        it('should manage hub commands', async () => {
            const req = new FetchRequest('POST', '/grid/api/hub', {}, true)
            expect(await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar')).toEqual({ value: { some: 'config' } })
        })

        it('should fail if hub command is called on node', async () => {
            const req = new FetchRequest('POST', '/grid/api/testsession', {}, true)
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
                const req = new FetchRequest('POST', '/timeout', {}, true, { onRetry })
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
                const req = new FetchRequest('GET', '/timeout', {}, true, { onRetry, onRequest, onResponse, onPerformance })
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
            const req = new FetchRequest('POST', '/timeout', {}, true, { onRetry })
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
            const req = new FetchRequest('POST', '/connectionRefused', {}, false, { onRetry })
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
            const req = new FetchRequest('POST', '/sumoerror', {}, true)
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
    })

    afterEach(() => {
        // @ts-ignore
        vi.mocked(fetch).retryCnt = 0

        vi.mocked(fetch).mockClear()
        vi.mocked(warn).mockClear()
        vi.mocked(error).mockClear()
    })
})
