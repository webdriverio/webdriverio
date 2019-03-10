import logger from '@wdio/logger'
import request from 'request'
import https from 'https'

import WebDriverRequest from '../src/request'

const { warn, error } = logger()

describe('webdriver request', () => {
    it('should have some default options', () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        expect(req.method).toBe('POST')
        expect(req.endpoint).toBe('/foo/bar')
        expect(Object.keys(req.defaultOptions.headers)).toContain('User-Agent')
    })

    it('should be able to make request', () => {
        const req = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
        req._createOptions = jest.fn().mockImplementation((opts, sessionId) => ({
            foo: 'bar',
            sessionId
        }))
        req.emit = jest.fn()
        req._request = jest.fn()

        req.makeRequest({ connectionRetryCount: 43 }, 'some_id')
        expect(req._request.mock.calls[0][0].foo).toBe('bar')
        expect(req._request.mock.calls[0][0].sessionId).toBe('some_id')
        expect(req._request.mock.calls[0][1]).toBe(43)
    })

    describe('createOptions', () => {
        it('fails if command requires sessionId but none given', () => {
            const req = new WebDriverRequest('POST', '/wd/hub/session/:sessionId/element')
            expect(() => req._createOptions({})).toThrow()
        })

        it('creates proper options set', () => {
            const req = new WebDriverRequest('POST', 'session/:sessionId/element')
            const options = req._createOptions({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/wd/hub/',
                headers: { foo: 'bar' }
            }, 'foobar12345')

            expect(options.agent.protocol).toBe('https:')
            expect(options.uri.href).toBe('https://localhost:4445/wd/hub/session/foobar12345/element')
            expect(options.headers.foo).toBe('bar')
        })

        it('passes a custom agent', () => {
            const req = new WebDriverRequest('POST', 'session/:sessionId/element')
            const agent = new https.Agent({ keepAlive: true })
            const options = req._createOptions({
                protocol: 'https',
                hostname: 'localhost',
                port: 4445,
                path: '/wd/hub/',
                agent
            }, 'foobar12345')

            expect(options.agent.protocol).toBe('https:')
            expect(options.agent).toBe(agent)
        })

        it('should add auth if user and key is given', () => {
            const req = new WebDriverRequest('POST', '/session', { some: 'body' })
            const options = req._createOptions({
                user: 'foo',
                key: 'bar',
                path: '/'
            })
            expect(options.auth).toEqual({ pass: 'bar', user: 'foo' })
            expect(options.body).toEqual({ some: 'body' })
        })

        it('sets request body to "undefined" when request object is empty and DELETE is used', () => {
            const req = new WebDriverRequest('DELETE', '/session', {})
            const options = req._createOptions({ path: '/' })
            expect(Boolean(options.body)).toEqual(false)
        })

        it('sets request body to "undefined" when request object is empty and GET is used', () => {
            const req = new WebDriverRequest('GET', '/title', {})
            const options = req._createOptions({ path: '/' })
            expect(Boolean(options.body)).toEqual(false)
        })

        it('should attach an empty object body when POST is used', () => {
            const req = new WebDriverRequest('POST', '/status', {})
            const options = req._createOptions({ path: '/' })
            expect(options.body).toEqual({})
        })

        it('should add the Content-Length header when a request object has a body', () => {
            const req = new WebDriverRequest('POST', '/session', { foo: 'bar' })
            const options = req._createOptions({ path: '/' })
            expect(Object.keys(options.headers)).toContain('Content-Length')
            expect(options.headers['Content-Length']).toBe(13)
        })

        it('should add Content-Length as well any other header provided in the request options if there is body in the request object', () => {
            const req = new WebDriverRequest('POST', '/session', { foo: 'bar' })
            const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
            expect(Object.keys(options.headers)).toContain('Content-Length')
            expect(options.headers.foo).toContain('bar')
            expect(options.headers['Content-Length']).toBe(13)
        })

        it('should add only the headers provided if the request body is empty', () => {
            const req = new WebDriverRequest('POST', '/session')
            const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
            expect(Object.keys(options.headers)).not.toContain('Content-Length')
            expect(options.headers.foo).toContain('bar')
        })

        describe('strictSSL', () => {
            beforeEach(function() {
                delete process.env.STRICT_SSL
                delete process.env.strict_ssl
            })

            it('should contain key "strictSSL" with value "false" when environment variable "STRICT_SSL" is defined with value "false"', () => {
                process.env['STRICT_SSL'] = 'false'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(false)
            })

            it('should contain key "strictSSL" with value "false" when environment variable "strict_ssl" is defined with value "false"', () => {
                process.env['strict_ssl'] = 'false'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(false)
            })

            it('should contain key "strictSSL" with value "true" when environment variable "STRICT_SSL" is defined with value "true"', () => {
                process.env['STRICT_SSL'] = 'true'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(true)
            })

            it('should contain key "strictSSL" with value "true" when environment variable "strict_ssl" is defined with value "true"', () => {
                process.env['strict_ssl'] = 'true'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(true)
            })

            it('should contain key "strictSSL" with value "true" when environment variable "STRICT_SSL" / "strict_ssl" is not defined', () => {
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(true)
            })

            it('should contain key "strictSSL" with value "true" when environment variable "STRICT_SSL" is defined with any other value than "false"', () => {
                process.env['STRICT_SSL'] = 'foo'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(true)
            })

            it('should contain key "strictSSL" with value "true" when environment variable "strict_ssl" is defined with any other value than "false"', () => {
                process.env['strict_ssl'] = 'foo'
                const req = new WebDriverRequest('POST', '/session')
                const options = req._createOptions({ path: '/', headers: { foo: 'bar' } })
                expect(options.strictSSL).toEqual(true)
            })
        })
    })

    describe('_request', () => {
        it('should make a request', async () => {
            const expectedResponse = { value: { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } }
            const req = new WebDriverRequest('POST', '/session')
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/session/foobar-123/element' } })
            const res = await req._request(opts)

            expect(res).toEqual(expectedResponse)
            expect(req.emit).toBeCalledWith('response', { result: expectedResponse })
        })

        it('should short circuit if request throws a stale element exception', async () => {
            const req = new WebDriverRequest('POST', 'session/:sessionId/element')
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, {
                uri: { path: '/wd/hub/session/foobar-123/element/some-sub-sub-elem-231/click' }, body: { foo: 'bar' } })

            let error
            try {
                await req._request(opts)
            } catch (e) {
                error = e
            }

            expect(error.message).toBe('element is not attached to the page document')
            expect(req.emit.mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toEqual([['Request encountered a stale element - terminating request']])

            request.retryCnt = 0
            warn.mockClear()
            request.mockClear()
        })

        it('should not fail code due to an empty server response', async () => {
            const req = new WebDriverRequest('POST', '/session')
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/empty' } })
            await expect(req._request(opts)).rejects.toEqual(new Error('Response has empty body'))
            expect(req.emit.mock.calls).toHaveLength(1)
            expect(warn.mock.calls).toHaveLength(0)
            expect(error.mock.calls).toHaveLength(1)

            request.retryCnt = 0
            warn.mockClear()
            error.mockClear()
        })

        it('should retry requests but still fail', async () => {
            const req = new WebDriverRequest('POST', '/session')
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/failing' } })
            await expect(req._request(opts, 2)).rejects.toEqual(new Error('Could not send request'))
            expect(req.emit.mock.calls).toHaveLength(3)
            expect(warn.mock.calls).toHaveLength(2)
            expect(error.mock.calls).toHaveLength(1)

            request.retryCnt = 0
            warn.mockClear()
            error.mockClear()
        })

        it('should retry and eventually respond', async () => {
            const req = new WebDriverRequest('POST', '/session')
            req.emit = jest.fn()

            request.mockClear()
            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/failing' }, body: { foo: 'bar' } })
            expect(await req._request(opts, 3)).toEqual({ value: 'caught' })
            expect(req.emit.mock.calls).toHaveLength(4)
            expect(logger().warn.mock.calls).toHaveLength(3)
            expect(logger().error.mock.calls).toHaveLength(0)
        })
    })
})
