import logger from 'wdio-logger'
import request from 'request'

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

        it('should add auth if user and key is given', () => {
            const req = new WebDriverRequest('POST', '/session')
            const options = req._createOptions({
                user: 'foo',
                key: 'bar'
            })
            expect(options.auth).toEqual({pass: 'bar', user: 'foo'})
        })
    })

    describe('_request', () => {
        it('should make a request', async () => {
            const expectedResponse = { value: { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } }
            const req = new WebDriverRequest()
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/session/foobar-123/element' } })
            const res = await req._request(opts)

            expect(res).toEqual(expectedResponse)
            expect(req.emit).toBeCalledWith('response', { result: expectedResponse })
        })

        it('should retry requests but still fail', async () => {
            const req = new WebDriverRequest()
            req.emit = jest.fn()

            const opts = Object.assign(req.defaultOptions, { uri: { path: '/wd/hub/failing' } })
            expect(req._request(opts, 2)).rejects.toEqual(new Error('Error: Could not send request'))
            expect(req.emit.mock.calls).toHaveLength(3)
            expect(warn.mock.calls).toHaveLength(2)
            expect(error.mock.calls).toHaveLength(1)

            request.retryCnt = 0
            warn.mockClear()
            error.mockClear()
        })

        it('should retry and eventually respond', async () => {
            const req = new WebDriverRequest()
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
