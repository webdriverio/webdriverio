import request from 'request'

import WebDriver from '../src'

test('should allow to create a new session using jsonwire caps', async () => {
    await WebDriver.newSession({
        path: '/',
        capabilities: { browserName: 'firefox' }
    })

    const req = request.mock.calls[0][0]
    expect(req.uri.pathname).toBe('/session')
    expect(req.body).toEqual({
        capabilities: {
            alwaysMatch: { browserName: 'firefox' },
            firstMatch: [{}]
        },
        desiredCapabilities: { browserName: 'firefox' }
    })
})

test('should allow to create a new session using w3c compliant caps', async () => {
    await WebDriver.newSession({
        path: '/',
        capabilities: {
            alwaysMatch: { browserName: 'firefox' },
            firstMatch: [{}]
        }
    })

    const req = request.mock.calls[0][0]
    expect(req.uri.pathname).toBe('/session')
    expect(req.body).toEqual({
        capabilities: {
            alwaysMatch: { browserName: 'firefox' },
            firstMatch: [{}]
        },
        desiredCapabilities: { browserName: 'firefox' }
    })
})

test('should allow to attach to existing session', async () => {
    const client = WebDriver.attachToSession({
        protocol: 'http',
        hostname: 'localhost',
        port: 4444,
        path: '/',
        sessionId: 'foobar'
    })

    await client.getUrl()
    const req = request.mock.calls[0][0]
    expect(req.uri.href).toBe('http://localhost:4444/session/foobar/url')
})

test('should fail attaching to session if sessionId is not given', () => {
    expect(() => WebDriver.attachToSession({})).toThrow(/sessionId is required/)
})

test('ensure that WebDriver interface exports protocols and other objects', () => {
    expect(WebDriver.WebDriver).not.toBe(undefined)
    expect(WebDriver.DEFAULTS).not.toBe(undefined)
    expect(WebDriver.WebDriverProtocol).not.toBe(undefined)
    expect(WebDriver.JsonWProtocol).not.toBe(undefined)
    expect(WebDriver.MJsonWProtocol).not.toBe(undefined)
    expect(WebDriver.AppiumProtocol).not.toBe(undefined)
    expect(WebDriver.ChromiumProtocol).not.toBe(undefined)
})

afterEach(() => {
    request.mockClear()
})
