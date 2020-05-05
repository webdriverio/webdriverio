import got from 'got'
import logger from '@wdio/logger'

import WebDriver from '../src'

const sessionOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/',
    sessionId: 'foobar'
}

describe('WebDriver', () => {
    describe('newSession', () => {
        it('should allow to create a new session using jsonwire caps', async () => {
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })

            const req = got.mock.calls[0][1]
            expect(req.uri.pathname).toBe('/session')
            expect(req.json).toEqual({
                capabilities: {
                    alwaysMatch: { browserName: 'firefox' },
                    firstMatch: [{}]
                },
                desiredCapabilities: { browserName: 'firefox' }
            })
        })

        it('should allow to create a new session using w3c compliant caps', async () => {
            await WebDriver.newSession({
                path: '/',
                capabilities: {
                    alwaysMatch: { browserName: 'firefox' },
                    firstMatch: [{}]
                }
            })

            const req = got.mock.calls[0][1]
            expect(req.uri.pathname).toBe('/session')
            expect(req.json).toEqual({
                capabilities: {
                    alwaysMatch: { browserName: 'firefox' },
                    firstMatch: [{}]
                },
                desiredCapabilities: { browserName: 'firefox' }
            })
        })

        it('should be possible to skip setting logLevel', async () => {
            await WebDriver.newSession({
                capabilities: { browserName: 'chrome' },
                logLevel: 'info',
                logLevels: { webdriver: 'silent' }
            })

            expect(logger.setLevel).not.toBeCalled()
        })

        it('should be possible to set logLevel', async () => {
            await WebDriver.newSession({
                capabilities: { browserName: 'chrome' },
                logLevel: 'info'
            })

            expect(logger.setLevel).toBeCalled()
        })

        it('propagates capabilities and requestedCapabilities', async () => {
            const browser = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect(browser.capabilities.browserName).toBe('mockBrowser')
            expect(browser.requestedCapabilities.browserName).toBe('firefox')
        })
    })

    describe('attachToSession', () => {
        it('should allow to attach to existing session', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions, logLevel: 'info' })
            await client.getUrl()
            const req = got.mock.calls[0][1]
            expect(req.uri.href).toBe('http://localhost:4444/session/foobar/url')
            expect(logger.setLevel).toBeCalled()
        })

        it('should allow to attach to existing session2', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions })
            await client.getUrl()
            const req = got.mock.calls[0][1]
            expect(req.uri.href).toBe('http://localhost:4444/session/foobar/url')
            expect(logger.setLevel).not.toBeCalled()
        })

        it('should allow to attach to existing session - W3C', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions })
            await client.getUrl()

            expect(client.options.isChrome).toBeFalsy()
            expect(client.options.isMobile).toBeFalsy()
            expect(client.options.isSauce).toBeFalsy()
            expect(client.getApplicationCacheStatus).toBeFalsy()
            expect(client.takeElementScreenshot).toBeTruthy()
            expect(client.getDeviceTime).toBeFalsy()
        })

        it('should allow to attach to existing session - non W3C', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: false,
                isSauce: true,
            })

            await client.getUrl()

            expect(client.options.isSauce).toBe(true)
            expect(client.getApplicationCacheStatus).toBeTruthy()
            expect(client.takeElementScreenshot).toBeFalsy()
            expect(client.getDeviceTime).toBeFalsy()
        })

        it('should allow to attach to existing session - mobile', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isChrome: true,
                isMobile: true
            })

            await client.getUrl()

            expect(client.options.isChrome).toBe(true)
            expect(client.options.isMobile).toBe(true)
            expect(client.getApplicationCacheStatus).toBeTruthy()
            expect(client.takeElementScreenshot).toBeTruthy()
            expect(client.getDeviceTime).toBeTruthy()
        })

        it('it should propagate all environment flags', () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: false,
                isMobile: false,
                isIOS: false,
                isAndroid: false,
                isChrome: false,
                isSauce: false
            })
            expect(client.isW3C).toBe(false)
            expect(client.isMobile).toBe(false)
            expect(client.isIOS).toBe(false)
            expect(client.isAndroid).toBe(false)
            expect(client.isChrome).toBe(false)
            expect(client.isSauce).toBe(false)

            const anotherClient = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: true,
                isMobile: true,
                isIOS: true,
                isAndroid: true,
                isChrome: true,
                isSauce: true
            })
            expect(anotherClient.isW3C).toBe(true)
            expect(anotherClient.isMobile).toBe(true)
            expect(anotherClient.isIOS).toBe(true)
            expect(anotherClient.isAndroid).toBe(true)
            expect(anotherClient.isChrome).toBe(true)
            expect(anotherClient.isSauce).toBe(true)
        })

        it('should fail attaching to session if sessionId is not given', () => {
            expect(() => WebDriver.attachToSession({})).toThrow(/sessionId is required/)
        })
    })

    describe('reloadSession', () => {
        it('should reload session', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            await WebDriver.reloadSession(session)
            expect(got.mock.calls).toHaveLength(2)
        })
    })

    it('ensure that WebDriver interface exports protocols and other objects', () => {
        expect(WebDriver.WebDriver).not.toBe(undefined)
        expect(WebDriver.DEFAULTS).not.toBe(undefined)
    })

    afterEach(() => {
        logger.setLevel.mockClear()
        got.mockClear()
    })
})
