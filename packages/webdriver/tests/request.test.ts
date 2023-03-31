import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import type { Agents } from 'got'
import got from 'got'
import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import * as utils from '../src/utils.js'
import WebDriverRequest from '../src/request/node.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('got')
const { warn, error } = logger('test')

const webdriverPath = '/session'
const defaultOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444
}

describe('webdriver request', () => {
    beforeEach(() => {
        vi.mocked(got).mockClear()
    })

    it('should have some default options', () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        expect(req.method).toBe('POST')
        expect(req.endpoint).toBe('/foo/bar')
    })

    it('should be able to make request', async () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        req['_createOptions'] = vi.fn().mockImplementation((opts, sessionId) => ({
            foo: 'bar',
            sessionId
        }))
        req.emit = vi.fn()
        req['_request'] = vi.fn()

        await req.makeRequest({ connectionRetryCount: 43, logLevel: 'warn' }, 'some_id')
        expect(req['_request']).toHaveBeenCalledWith(
            expect.objectContaining({ foo: 'bar', sessionId: 'some_id' }),
            undefined,
            43,
            0
        )
    })

    it('should pick up the fullRequestOptions returned by transformRequest', async () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        const transformRequest = vi.fn().mockImplementation((requestOptions) => ({
            ...requestOptions,
            json: { foo: 'baz' }
        }))

        await req.makeRequest({
            transformRequest,
            protocol: 'https',
            hostname: 'localhost',
            port: 4445,
            path: '/wd/hub/',
            logLevel: 'warn'
        }, 'some_id')
        expect(got).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({ json: { foo: 'baz' } })
        )
    })

    it('should resolve with the body returned by transformResponse', async () => {
        const req = new WebDriverRequest('POST', 'session/:sessionId/element', { foo: 'requestBody' })

        const transformResponse = vi.fn().mockImplementation((response) => ({
            ...response,
            body: { value: { foo: 'transformedResponse' } },
        }))

        vi.mocked(got).mockClear()
        const responseBody = await req.makeRequest({
            transformResponse,
            protocol: 'https',
            hostname: 'localhost',
            port: 4445,
            path: '/wd/hub/',
            logLevel: 'warn'
        }, 'foobar-123')

        expect(transformResponse.mock.calls[0][0]).toHaveProperty('body')
        expect(transformResponse.mock.calls[0][1].json).toEqual({ foo: 'requestBody' })
        await expect(responseBody).toEqual({ value: { foo: 'transformedResponse' } })
        vi.mocked(got).mockClear()
    })

    describe('createOptions', () => {
        it('fails if command requires sessionId but none given', async () => {
            const req = new WebDriverRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            await expect(() => req['_createOptions']({ logLevel: 'warn' })).rejects.toThrow()
        })

        it('creates proper options set', async () => {
            const req = new WebDriverRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            const options: Options.RequestLibOptions = await req['_createOptions']({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                headers: { foo: 'bar' },
                connectionRetryTimeout: 10 * 1000,
                logLevel: 'warn'
            }, 'foobar12345')

            // @ts-ignore
            expect((options.agent! as gotOrig.Agents).https!.protocol).toBe('https:')
            // @ts-ignore
            expect((options.agent! as gotOrig.Agents).http!.protocol).toBe('http:')
            expect((options.url! as URL).href)
                .toBe('https://localhost:4445/session/foobar12345/element')
            expect(Object.keys(options.headers as Record<string, string>))
                .toEqual(['Content-Type', 'Connection', 'Accept', 'User-Agent', 'foo', 'Content-Length'])
            expect(options.timeout).toEqual({ response: 10 * 1000 })
        })

        it('passes a custom agent', async () => {
            const req = new WebDriverRequest('POST', `${webdriverPath}/:sessionId/element`, {})
            const agent = {
                http: new http.Agent({ keepAlive: true }),
                https: new https.Agent({ keepAlive: true })
            }
            const options = await req['_createOptions']({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn',
                agent
            }, 'foobar12345')

            expect((options.agent! as Agents).http).toBe(agent.http)
            expect((options.agent! as Agents).https).toBe(agent.https)
        })

        it('ignors path when command is a hub command', async () => {
            const req = new WebDriverRequest('POST', '/grid/api/hub', {}, true)
            const options = await req['_createOptions']({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar12345')
            expect((options.url as URL).href).toBe('https://localhost:4445/grid/api/hub')
        })

        it('should add auth if user and key is given', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, { some: 'body' })
            const options = await req['_createOptions']({
                ...defaultOptions,
                user: 'foo',
                key: 'bar',
                path: '/',
                logLevel: 'warn'
            })
            expect(options.username).toEqual('foo')
            expect(options.password).toEqual('bar')
            expect(options.json).toEqual({ some: 'body' })
        })

        it('sets request body to "undefined" when request object is empty and DELETE is used', async () => {
            const req = new WebDriverRequest('DELETE', webdriverPath, {})
            const options = await req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(options.json)).toEqual(false)
        })

        it('sets request body to "undefined" when request object is empty and GET is used', async () => {
            const req = new WebDriverRequest('GET', `${webdriverPath}/title`, {})
            const options = await req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(options.json)).toEqual(false)
        })

        it('should attach an empty object body when POST is used', async () => {
            const req = new WebDriverRequest('POST', '/status', {})
            const options = await req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(options.json).toEqual({})
        })

        it('should add the Content-Length header when a request object has a body', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, { foo: 'bar' })
            const options = await req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Object.keys(options.headers as Record<string, string>))
                .toEqual(['Content-Type', 'Connection', 'Accept', 'User-Agent', 'Content-Length'])
            expect((options.headers as Record<string, string>)['Content-Length']).toBe('13')
        })

        it('should add Content-Length as well any other header provided in the request options if there is body in the request object', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, { foo: 'bar' })
            const options = await req['_createOptions']({
                ...defaultOptions, path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            const headers = options.headers as Record<string, string>
            expect(Object.keys(headers)).toContain('Content-Length')
            expect(headers.foo).toContain('bar')
            expect(headers['Content-Length']).toBe('13')
        })

        it('should add only the headers provided if the request body is empty', async () => {
            const req = new WebDriverRequest('POST', webdriverPath)
            const options = await req['_createOptions']({
                ...defaultOptions,
                path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            const headers = options.headers as Record<string, string>
            expect(Object.keys(headers)).not.toContain('Content-Length')
            expect(headers.foo).toContain('bar')
        })

        describe('rejectUnauthorized', () => {
            const defaults = {
                ...defaultOptions,
                path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn' as Options.WebDriverLogTypes
            }

            beforeEach(function() {
                delete process.env.STRICT_SSL
                delete process.env.strict_ssl
            })

            it('should contain key "rejectUnauthorized" with value "false" when "strictSSL" argument is given with false', async () => {
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions']({ ...defaults, strictSSL: false })

                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "false" when environment variable "STRICT_SSL" is defined with value "false"', async () => {
                process.env['STRICT_SSL'] = 'false'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "false" when environment variable "strict_ssl" is defined with value "false"', async () => {
                process.env['strict_ssl'] = 'false'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "true" when "strictSSL" argument is given with true', async () => {
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions']({ ...defaults, strictSSL: true })
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" is defined with value "true"', async () => {
                process.env['STRICT_SSL'] = 'true'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "strict_ssl" is defined with value "true"', async () => {
                process.env['strict_ssl'] = 'true'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" / "strict_ssl" is not defined', async () => {
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" is defined with any other value than "false"', async () => {
                process.env['STRICT_SSL'] = 'foo'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "strict_ssl" is defined with any other value than "false"', async () => {
                process.env['strict_ssl'] = 'foo'
                const req = new WebDriverRequest('POST', webdriverPath, {})
                const options = await req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })
        })
    })

    describe('_request', () => {
        it('should make a request', async () => {
            const expectedResponse = { value: { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } }
            const req = new WebDriverRequest('POST', webdriverPath, {})
            req.emit = vi.fn()

            const opts = Object.assign(
                req.defaultOptions,
                { url: { pathname: '/session/foobar-123/element' } }
            )
            const res = await req['_request'](opts)

            expect(res).toEqual(expectedResponse)
            expect(vi.mocked(req.emit).mock.calls).toHaveLength(2)
            expect(req.emit).toHaveBeenNthCalledWith(1, 'response', { result: expectedResponse })
            expect(req.emit).toHaveBeenNthCalledWith(2, 'performance', expect.objectContaining({
                request: opts,
                durationMillisecond: expect.any(Number),
                retryCount: 0,
                success: true,
            }))
        })

        it('should short circuit if request throws a stale element exception', async () => {
            const req = new WebDriverRequest('POST', 'session/:sessionId/element', {})
            req.emit = vi.fn()

            const opts = Object.assign(req.defaultOptions, {
                url: { pathname: '/session/foobar-123/element/some-sub-sub-elem-231/click' },
                body: { foo: 'bar' }
            })

            const error = await req['_request'](opts).catch(err => err)
            expect(error.message).toBe('element is not attached to the page document')
            expect(vi.mocked(req.emit).mock.calls).toHaveLength(2)
            expect(req.emit).toHaveBeenNthCalledWith(1, 'response', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(2, 'performance', expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(1)
            expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        })

        it('should not fail code due to an empty server response', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, {})
            req.emit = vi.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/empty' } })
            await expect(req['_request'](opts)).rejects.toEqual(new Error('Response has empty body'))
            expect(vi.mocked(req.emit).mock.calls).toHaveLength(2)
            expect(req.emit).toHaveBeenNthCalledWith(1, 'response', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(2, 'performance', expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(0)
            expect(vi.mocked(error).mock.calls).toHaveLength(1)
        })

        it('should retry requests but still fail', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, {})
            req.emit = vi.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/failing' } })
            await expect(req['_request'](opts, undefined, 2)).rejects.toEqual(new Error('unknown error'))
            expect(vi.mocked(req.emit).mock.calls).toHaveLength(6)
            expect(req.emit).toHaveBeenNthCalledWith(1, 'retry', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(2, 'performance', expect.objectContaining({ success: false }))
            expect(req.emit).toHaveBeenNthCalledWith(3, 'retry', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(4, 'performance', expect.objectContaining({ success: false }))
            expect(req.emit).toHaveBeenNthCalledWith(5, 'response', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(6, 'performance', expect.objectContaining({ success: false }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(2)
            expect(vi.mocked(error).mock.calls).toHaveLength(1)
        })

        it('should retry and eventually respond', async () => {
            const req = new WebDriverRequest('POST', webdriverPath, {})
            req.emit = vi.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/failing' }, json: { foo: 'bar' } })
            expect(await req['_request'](opts, undefined, 3)).toEqual({ value: 'caught' })
            expect(vi.mocked(req.emit).mock.calls).toHaveLength(8)
            expect(req.emit).toHaveBeenNthCalledWith(1, 'retry', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(2, 'performance', expect.objectContaining({ success: false }))
            expect(req.emit).toHaveBeenNthCalledWith(3, 'retry', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(4, 'performance', expect.objectContaining({ success: false }))
            expect(req.emit).toHaveBeenNthCalledWith(5, 'retry', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(6, 'performance', expect.objectContaining({ success: false }))
            expect(req.emit).toHaveBeenNthCalledWith(7, 'response', expect.anything())
            expect(req.emit).toHaveBeenNthCalledWith(8, 'performance', expect.objectContaining({ success: true }))
            expect(vi.mocked(warn).mock.calls).toHaveLength(3)
            expect(vi.mocked(error).mock.calls).toHaveLength(0)
        })

        it('should manage hub commands', async () => {
            const req = new WebDriverRequest('POST', '/grid/api/hub', {}, true)
            expect(await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar')).toEqual({ value: { some: 'config' } })
        })

        it('should fail if hub command is called on node', async () => {
            const req = new WebDriverRequest('POST', '/grid/api/testsession', {}, true)
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
                const req = new WebDriverRequest('POST', '/timeout', {}, true)
                const reqRetryCnt = vi.fn()
                req.on('retry', reqRetryCnt)
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
                expect(reqRetryCnt).toBeCalledTimes(retryCnt)
            })

            it('should use error from "getTimeoutError" helper', async () => {
                const timeoutErr = new Error('Timeout')
                const spy = vi.spyOn(utils, 'getTimeoutError').mockReturnValue(timeoutErr)

                const req = new WebDriverRequest('GET', '/timeout', {}, true)
                req.emit = vi.fn()
                const reqOpts = {
                    protocol: 'https',
                    hostname: 'localhost',
                    port: 4445,
                    path: '/',
                } as Options.WebDriver
                await req.makeRequest(reqOpts, 'foobar')
                    // ignore error
                    .catch((e) => e)

                expect(spy).toBeCalledTimes(1)
                expect(spy).toBeCalledWith(expect.any(Error), expect.objectContaining({ method: 'GET' }))
                expect(vi.mocked(req.emit).mock.calls).toHaveLength(3)
                expect(req.emit).toHaveBeenNthCalledWith(1, 'request', expect.anything())
                expect(req.emit).toHaveBeenNthCalledWith(2, 'response', { error: timeoutErr })
                expect(req.emit).toHaveBeenNthCalledWith(3, 'performance', expect.objectContaining({ success: false }))

                spy.mockRestore()
            })
        })

        it('should return proper response if retry passes', async () => {
            const retryCnt = 7
            const req = new WebDriverRequest('POST', '/timeout', {}, true)
            const reqRetryCnt = vi.fn()
            req.on('retry', reqRetryCnt)
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
            expect(result).toEqual({ value: { value: {} } })
            expect(reqRetryCnt).toBeCalledTimes(5)
        })

        it('should retry on connection refused error', async () => {
            const retryCnt = 7
            const req = new WebDriverRequest('POST', '/connectionRefused', {}, true)
            const reqRetryCnt = vi.fn()
            req.on('retry', reqRetryCnt)
            const result = await req.makeRequest({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/connectionRefused',
                connectionRetryCount: retryCnt,
                logLevel: 'warn'
            }, 'foobar').then(
                (res) => res,
                (e) => e
            )
            expect(result).toEqual({ value: { value: { foo: 'bar' } } })
            expect(reqRetryCnt).toBeCalledTimes(5)
        })

        it('should throw if request error is unknown', async () => {
            const req = new WebDriverRequest('POST', '/sumoerror', {}, true)
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
            expect(result.message).toBe('ups')
        })
    })

    afterEach(() => {
        // @ts-ignore
        got.retryCnt = 0

        vi.mocked(got).mockClear()
        vi.mocked(warn).mockClear()
        vi.mocked(error).mockClear()
    })
})
