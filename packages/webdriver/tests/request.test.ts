import logger from '@wdio/logger'
import * as gotOrig from 'got'
import http from 'http'
import https from 'https'

import WebDriverRequest from '../src/request'
import { WebDriverLogTypes } from '../src/types'

type LogMock = {
    warn: jest.Mock,
    error: jest.Mock
}

const { warn, error } = logger('test') as unknown as LogMock
const got = gotOrig.default as unknown as jest.Mock

const path = '/session'
const defaultOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444
}

describe('webdriver request', () => {
    beforeEach(() => {
        got.mockClear()
    })

    it('should have some default options', () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        expect(req.method).toBe('POST')
        expect(req.endpoint).toBe('/foo/bar')
    })

    it('should be able to make request', () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        req['_createOptions'] = jest.fn().mockImplementation((opts, sessionId) => ({
            foo: 'bar',
            sessionId
        }))
        req.emit = jest.fn()
        req['_request'] = jest.fn()

        req.makeRequest({ connectionRetryCount: 43, logLevel: 'warn' }, 'some_id')
        expect((req['_request'] as jest.Mock).mock.calls[0][0].foo).toBe('bar')
        expect((req['_request'] as jest.Mock).mock.calls[0][0].sessionId).toBe('some_id')
        expect((req['_request'] as jest.Mock).mock.calls[0][2]).toBe(43)
    })

    it('should pick up the fullRequestOptions returned by transformRequest', async () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        const transformRequest = jest.fn().mockImplementation((requestOptions) => ({
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

        expect(got.mock.calls[0][1].json).toEqual({ foo: 'baz' })
    })

    it('should resolve with the body returned by transformResponse', async () => {
        const req = new WebDriverRequest('POST', 'session/:sessionId/element', { foo: 'requestBody' })

        const transformResponse = jest.fn().mockImplementation((response) => ({
            ...response,
            body: { value: { foo: 'transformedResponse' } },
        }))

        got.mockClear()
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
        got.mockClear()
    })

    describe('createOptions', () => {
        it('fails if command requires sessionId but none given', () => {
            const req = new WebDriverRequest('POST', `${path}/:sessionId/element`, {})
            expect(() => req['_createOptions']({ logLevel: 'warn' })).toThrow()
        })

        it('creates proper options set', () => {
            const req = new WebDriverRequest('POST', `${path}/:sessionId/element`, {})
            const options: gotOrig.Options = req['_createOptions']({
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
            expect(options.timeout).toBe(10 * 1000)
        })

        it('passes a custom agent', () => {
            const req = new WebDriverRequest('POST', `${path}/:sessionId/element`, {})
            const agent = {
                http: new http.Agent({ keepAlive: true }),
                https: new https.Agent({ keepAlive: true })
            }
            const options = req['_createOptions']({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn',
                agent
            }, 'foobar12345')

            expect((options.agent! as gotOrig.Agents).http).toBe(agent.http)
            expect((options.agent! as gotOrig.Agents).https).toBe(agent.https)
        })

        it('ignors path when command is a hub command', () => {
            const req = new WebDriverRequest('POST', '/grid/api/hub', {}, true)
            const options = req['_createOptions']({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/',
                logLevel: 'warn'
            }, 'foobar12345')
            expect((options.url as URL).href).toBe('https://localhost:4445/grid/api/hub')
        })

        it('should add auth if user and key is given', () => {
            const req = new WebDriverRequest('POST', path, { some: 'body' })
            const options = req['_createOptions']({
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

        it('sets request body to "undefined" when request object is empty and DELETE is used', () => {
            const req = new WebDriverRequest('DELETE', path, {})
            const options = req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(options.json)).toEqual(false)
        })

        it('sets request body to "undefined" when request object is empty and GET is used', () => {
            const req = new WebDriverRequest('GET', `${path}/title`, {})
            const options = req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Boolean(options.json)).toEqual(false)
        })

        it('should attach an empty object body when POST is used', () => {
            const req = new WebDriverRequest('POST', '/status', {})
            const options = req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(options.json).toEqual({})
        })

        it('should add the Content-Length header when a request object has a body', () => {
            const req = new WebDriverRequest('POST', path, { foo: 'bar' })
            const options = req['_createOptions']({
                ...defaultOptions,
                path: '/',
                logLevel: 'warn'
            })
            expect(Object.keys(options.headers as Record<string, string>))
                .toEqual(['Content-Type', 'Connection', 'Accept', 'User-Agent', 'Content-Length'])
            expect((options.headers as Record<string, string>)['Content-Length']).toBe('13')
        })

        it('should add Content-Length as well any other header provided in the request options if there is body in the request object', () => {
            const req = new WebDriverRequest('POST', path, { foo: 'bar' })
            const options = req['_createOptions']({
                ...defaultOptions, path: '/',
                headers: { foo: 'bar' },
                logLevel: 'warn'
            })
            const headers = options.headers as Record<string, string>
            expect(Object.keys(headers)).toContain('Content-Length')
            expect(headers.foo).toContain('bar')
            expect(headers['Content-Length']).toBe('13')
        })

        it('should add only the headers provided if the request body is empty', () => {
            const req = new WebDriverRequest('POST', path)
            const options = req['_createOptions']({
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
                logLevel: 'warn' as WebDriverLogTypes
            }

            beforeEach(function() {
                delete process.env.STRICT_SSL
                delete process.env.strict_ssl
            })

            it('should contain key "rejectUnauthorized" with value "false" when "strictSSL" argument is given with false', () => {
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions']({ ...defaults, strictSSL: false })

                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "false" when environment variable "STRICT_SSL" is defined with value "false"', () => {
                process.env['STRICT_SSL'] = 'false'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "false" when environment variable "strict_ssl" is defined with value "false"', () => {
                process.env['strict_ssl'] = 'false'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(false)
            })

            it('should contain key "rejectUnauthorized" with value "true" when "strictSSL" argument is given with true', () => {
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions']({ ...defaults, strictSSL: true })
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" is defined with value "true"', () => {
                process.env['STRICT_SSL'] = 'true'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "strict_ssl" is defined with value "true"', () => {
                process.env['strict_ssl'] = 'true'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" / "strict_ssl" is not defined', () => {
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "STRICT_SSL" is defined with any other value than "false"', () => {
                process.env['STRICT_SSL'] = 'foo'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })

            it('should contain key "rejectUnauthorized" with value "true" when environment variable "strict_ssl" is defined with any other value than "false"', () => {
                process.env['strict_ssl'] = 'foo'
                const req = new WebDriverRequest('POST', path, {})
                const options = req['_createOptions'](defaults)
                expect(options.https?.rejectUnauthorized).toEqual(true)
            })
        })
    })

    describe('_request', () => {
        it('should make a request', async () => {
            const expectedResponse = { value: { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } }
            const req = new WebDriverRequest('POST', path, {})
            req.emit = jest.fn()

            const opts = Object.assign(
                req.defaultOptions,
                { url: { pathname: '/session/foobar-123/element' } }
            )
            const res = await req['_request'](opts)

            expect(res).toEqual(expectedResponse)
            expect(req.emit).toBeCalledWith('response', { result: expectedResponse })
        })

        it('should short circuit if request throws a stale element exception', async () => {
            const req = new WebDriverRequest('POST', 'session/:sessionId/element', {})
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, {
                url: { pathname: '/session/foobar-123/element/some-sub-sub-elem-231/click' },
                body: { foo: 'bar' }
            })

            const error = await req['_request'](opts).catch(err => err)
            expect(error.message).toBe('element is not attached to the page document')
            expect((req.emit as jest.Mock).mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        })

        it('should not fail code due to an empty server response', async () => {
            const req = new WebDriverRequest('POST', path, {})
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/empty' } })
            await expect(req['_request'](opts)).rejects.toEqual(new Error('Response has empty body'))
            expect((req.emit as jest.Mock).mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toHaveLength(0)
            expect(error.mock.calls).toHaveLength(1)
        })

        it('should retry requests but still fail', async () => {
            const req = new WebDriverRequest('POST', path, {})
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/failing' } })
            await expect(req['_request'](opts, undefined, 2)).rejects.toEqual(new Error('unknown error'))
            expect((req.emit as jest.Mock).mock.calls).toHaveLength(3)
            expect(warn.mock.calls).toHaveLength(2)
            expect(error.mock.calls).toHaveLength(1)
        })

        it('should retry and eventually respond', async () => {
            const req = new WebDriverRequest('POST', path, {})
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { url: { pathname: '/failing' }, json: { foo: 'bar' } })
            expect(await req['_request'](opts, undefined, 3)).toEqual({ value: 'caught' })
            expect((req.emit as jest.Mock).mock.calls).toHaveLength(4)
            expect(warn.mock.calls).toHaveLength(3)
            expect(error.mock.calls).toHaveLength(0)
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

        it('should throw if timeout happens too often', async () => {
            const retryCnt = 3
            const req = new WebDriverRequest('POST', '/timeout', {}, true)
            const reqRetryCnt = jest.fn()
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
            expect(result.code).toBe('ETIMEDOUT')
            expect(reqRetryCnt).toBeCalledTimes(retryCnt)
        })

        it('should return proper response if retry passes', async () => {
            const retryCnt = 7
            const req = new WebDriverRequest('POST', '/timeout', {}, true)
            const reqRetryCnt = jest.fn()
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

        got.mockClear()
        warn.mockClear()
        error.mockClear()
    })
})
