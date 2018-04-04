import WebDriverRequest from '../src/request'

describe('webdriver request', () => {
    let request

    beforeEach(() => {
        request = new WebDriverRequest('POST', '/foo/bar', { foo: 'bar' })
    })

    it('should have some default options', () => {
        expect(request.method).toBe('POST')
        expect(request.endpoint).toBe('/foo/bar')
        expect(Object.keys(request.defaultOptions.headers)).toContain('User-Agent')
    })

    it('should be able to make request', () => {
        request._createOptions = jest.fn().mockImplementation((opts, sessionId) => ({
            foo: 'bar',
            sessionId
        }))
        request.emit = jest.fn()
        request._request = jest.fn()

        request.makeRequest({ connectionRetryCount: 43 }, 'some_id')
        expect(request._request.mock.calls[0][0].foo).toBe('bar')
        expect(request._request.mock.calls[0][0].sessionId).toBe('some_id')
        expect(request._request.mock.calls[0][1]).toBe(43)
    })
})
