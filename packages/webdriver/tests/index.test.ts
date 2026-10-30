import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// @ts-ignore mock feature
import logger, { logMock } from '@wdio/logger'
import { sessionEnvironmentDetector } from '@wdio/utils'
import { startWebDriver } from '@wdio/utils'
import type { Capabilities } from '@wdio/types'

import '../src/browser.js'

import WebDriver, { getPrototype, DEFAULTS, command } from '../src/index.js'
// @ts-expect-error mock feature
import { initCount, BidiCore } from '../src/bidi/core.js'
import * as utils from '../src/utils.js'
import type { Client } from '../src/types.js'

vi.mock('geckodriver', () => ({ start: vi.fn() }))
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/utils/node', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils/node')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fs')
vi.mock('wait-port')
vi.mock('ws')
vi.mock('fetch')

vi.mock('../src/bidi/core.js', () => {
    let initCount = 0
    return {
        BidiCore: class BidiHandlerMock {
            connect = vi.fn().mockResolvedValue({})
            reconnect = vi.fn().mockResolvedValue({})
            constructor () {
                ++initCount
            }
            waitForConnected() {
                return Promise.resolve()
            }
            get socket () {
                return {
                    on: vi.fn(),
                    send: vi.fn(),
                    close: vi.fn()
                }
            }
        },
        initCount: () => initCount
    }
})

const sessionOptions = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/',
    sessionId: 'foobar'
}

// @ts-expect-error
interface TestClient extends Client {
    getUrl (): string
    rotateDevice (): void
    takeElementScreenshot (): void
    getDeviceTime (): void
}

beforeEach(() => {
    vi.mocked(sessionEnvironmentDetector).mockClear()
})

describe('WebDriver', () => {
    it('exports getPrototype, DEFAULTS', () => {
        expect(typeof getPrototype).toBe('function')
        expect(typeof DEFAULTS).toBe('object')
        expect(typeof command).toBe('function')
    })

    describe('newSession', () => {
        afterEach(() => {
            delete process.env.WDIO_LOG_PATH

            logMock.error.mockRestore()
            logMock.warn.mockRestore()
            logMock.info.mockRestore()
            logMock.debug.mockRestore()
        })

        it('should wrap flat capabilities into a W3C capabilities object', async () => {
            const testDirPath = './logs'
            await WebDriver.newSession({
                path: '/',
                outputDir: testDirPath,
                capabilities: { browserName: 'firefox' }
            })

            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session' }),
                expect.objectContaining({ body: JSON.stringify({
                    capabilities: {
                        alwaysMatch: {
                            browserName: 'firefox',
                            webSocketUrl: true,
                            unhandledPromptBehavior: 'ignore'
                        },
                        firstMatch: [{}]
                    }
                }) })
            )
        })

        it('should allow to create a new session using w3c compliant caps', async () => {
            await WebDriver.newSession({
                path: '/',
                capabilities: {
                    alwaysMatch: { browserName: 'firefox' },
                    firstMatch: [{}]
                }
            })

            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session' }),
                expect.objectContaining({ body: JSON.stringify({
                    capabilities: {
                        alwaysMatch: {
                            browserName: 'firefox',
                            webSocketUrl: true,
                            unhandledPromptBehavior: 'ignore'
                        },
                        firstMatch: [{}]
                    }
                }) })
            )

            expect(vi.mocked(sessionEnvironmentDetector).mock.calls)
                .toMatchSnapshot()
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
            expect((browser.requestedCapabilities as WebdriverIO.Capabilities).browserName).toBe('firefox')
        })

        it('attaches bidi handler if socket url is given', async () => {
            const wid = process.env.WDIO_UNIT_TESTS
            delete process.env.WDIO_UNIT_TESTS
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                value: {
                    sessionId: 'bidi-session',
                    capabilities: { webSocketUrl: 'ws://foo/bar' }
                }
            }))
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect(initCount()).toBe(1)
            process.env.WDIO_UNIT_TESTS = wid
        })

        it('should call "initiateBidi" with correct arguments', async () => {
            const webSocketUrl = 'ws://foo/bar'
            const strictSSL = true
            const headers = { 'Authorization': 'OAuth 12345' }

            vi.spyOn(utils, 'initiateBidi')
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                value: {
                    sessionId: 'bidi-session',
                    capabilities: { webSocketUrl }
                }
            }))
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' },
                strictSSL,
                headers
            })

            expect(utils.initiateBidi).toHaveBeenCalledWith(
                webSocketUrl,
                strictSSL,
                headers,
                DEFAULTS.bidiResponseTimeout.default,
                DEFAULTS.bidiConnectTimeout.default
            )
        })

        it('should pass a custom "bidiResponseTimeout" to "initiateBidi"', async () => {
            const webSocketUrl = 'ws://foo/bar'

            vi.spyOn(utils, 'initiateBidi')
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                value: {
                    sessionId: 'bidi-session',
                    capabilities: { webSocketUrl }
                }
            }))
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' },
                bidiResponseTimeout: 300000
            })

            expect(utils.initiateBidi).toHaveBeenCalledWith(
                webSocketUrl,
                undefined,
                undefined,
                300000,
                DEFAULTS.bidiConnectTimeout.default
            )
        })

        it('should pass a custom "bidiConnectTimeout" to "initiateBidi"', async () => {
            const webSocketUrl = 'ws://foo/bar'

            vi.spyOn(utils, 'initiateBidi')
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                value: {
                    sessionId: 'bidi-session',
                    capabilities: { webSocketUrl }
                }
            }))
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' },
                bidiConnectTimeout: 30000
            })

            expect(utils.initiateBidi).toHaveBeenCalledWith(
                webSocketUrl,
                undefined,
                undefined,
                DEFAULTS.bidiResponseTimeout.default,
                30000
            )
        })

        describe('Appium browser session', () => {
            const appiumCaps = { platformName: 'Android', browserName: 'Chrome', 'appium:automationName': 'UiAutomator2' }
            let wid: string | undefined

            beforeEach(() => {
                wid = process.env.WDIO_UNIT_TESTS
                delete process.env.WDIO_UNIT_TESTS
                vi.spyOn(BidiCore.prototype, 'waitForConnected').mockResolvedValue(true)
            })

            afterEach(() => {
                if (wid === undefined) {
                    delete process.env.WDIO_UNIT_TESTS
                } else {
                    process.env.WDIO_UNIT_TESTS = wid
                }
                vi.restoreAllMocks()
            })

            const startSession = (capabilities: WebdriverIO.Capabilities, options: Partial<Capabilities.RemoteConfig> = {}) => {
                vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                    value: { sessionId: 'bidi-session', capabilities: { ...capabilities, webSocketUrl: 'ws://foo/bar' } }
                }))
                return WebDriver.newSession({ path: '/', capabilities, ...options })
            }

            it('checks that the WebDriver Bidi server can run browser commands, within bidiConnectTimeout', async () => {
                const discard = vi.spyOn(utils, 'discardBidiWithoutBrowsingContext').mockResolvedValue(false)
                const browser = await startSession(appiumCaps)
                expect(discard).toHaveBeenCalledOnce()
                expect(discard).toHaveBeenCalledWith((browser as any)._bidiHandler, DEFAULTS.bidiConnectTimeout.default, 'For WebDriver Bidi with Chrome on Android, use Appium 3.9.0 or later with the UiAutomator2 driver 8.7.3 or later. ')
                await startSession(appiumCaps, { bidiConnectTimeout: 30_000 })
                expect(discard).toHaveBeenLastCalledWith(expect.anything(), 30_000, expect.any(String))
            })

            it('drops webSocketUrl after a discard, so a later attach does not connect again', async () => {
                const discard = vi.spyOn(utils, 'discardBidiWithoutBrowsingContext')
                discard.mockResolvedValueOnce(false)
                expect((await startSession(appiumCaps)).capabilities.webSocketUrl).toBe(undefined)
                discard.mockResolvedValueOnce(true)
                expect((await startSession(appiumCaps)).capabilities.webSocketUrl).toBe('ws://foo/bar')
            })

            it('does not check a desktop browser session', async () => {
                const discard = vi.spyOn(utils, 'discardBidiWithoutBrowsingContext')
                await startSession({ browserName: 'chrome' })
                expect(discard).not.toHaveBeenCalled()
            })

            it('does not check a native app session, which keeps the events of Appium', async () => {
                const discard = vi.spyOn(utils, 'discardBidiWithoutBrowsingContext')
                await startSession({ platformName: 'Android', 'appium:automationName': 'UiAutomator2', 'appium:app': '/app.apk' })
                expect(discard).not.toHaveBeenCalled()
            })
        })
    })

    describe('attachToSession', () => {
        it('should allow to attach to existing session', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions, logLevel: 'error' }) as unknown as TestClient
            await client.getUrl()
            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ href: 'http://localhost:4444/session/foobar/url' }),
                expect.anything()
            )
            expect(logger.setLevel).toBeCalled()
        })

        it('should allow to attach to existing session2', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions }) as unknown as TestClient
            await client.getUrl()
            expect(fetch).toHaveBeenCalledWith(
                expect.objectContaining({ href: 'http://localhost:4444/session/foobar/url' }),
                expect.anything()
            )
            expect(logger.setLevel).not.toBeCalled()
        })

        it('should allow to attach to existing session - W3C', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions }) as unknown as TestClient
            await client.getUrl()

            expect(client.isChromium).toBeFalsy()
            expect(client.isMobile).toBeFalsy()
            expect(client.isSauce).toBeFalsy()
            expect(client.rotateDevice).toBeFalsy()
            expect(client.takeElementScreenshot).toBeTruthy()
            expect(client.getDeviceTime).toBeFalsy()
        })

        it('should allow to attach to existing session - mobile', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isChromium: true,
                isMobile: true
            }) as unknown as TestClient

            await client.getUrl()

            expect(client.isChromium).toBe(true)
            expect(client.isMobile).toBe(true)
            expect(client.rotateDevice).toBeTruthy()
            expect(client.takeElementScreenshot).toBeTruthy()
            expect(client.getDeviceTime).toBeTruthy()
        })

        it('drops a legacy isW3C attach option', () => {
            const client = WebDriver.attachToSession({
                ...sessionOptions,
                isW3C: false
            } as typeof sessionOptions & { isW3C?: boolean })

            expect('isW3C' in client).toBe(false)
            expect(client.options).not.toHaveProperty('isW3C')
            expect(typeof client.sessionStatus).toBe('function')
        })

        it('it should propagate all environment flags', () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isMobile: false,
                isIOS: false,
                isAndroid: false,
                isChromium: false,
                isSauce: false,
                isWindowsApp: false,
                isMacApp: false
            })
            expect(client.isMobile).toBe(false)
            expect(client.isIOS).toBe(false)
            expect(client.isAndroid).toBe(false)
            expect(client.isChromium).toBe(false)
            expect(client.isSauce).toBe(false)
            expect(client.isWindowsApp).toBe(false)
            expect(client.isMacApp).toBe(false)

            const anotherClient = WebDriver.attachToSession({ ...sessionOptions,
                isMobile: true,
                isIOS: true,
                isAndroid: true,
                isChromium: true,
                isSauce: true,
                isWindowsApp: true,
                isMacApp: true
            })
            expect(anotherClient.isMobile).toBe(true)
            expect(anotherClient.isIOS).toBe(true)
            expect(anotherClient.isAndroid).toBe(true)
            expect(anotherClient.isChromium).toBe(true)
            expect(anotherClient.isSauce).toBe(true)
            expect(anotherClient.isWindowsApp).toBe(true)
            expect(anotherClient.isMacApp).toBe(true)
        })

        it('should apply default connection details', () => {
            const client = WebDriver.attachToSession({ sessionId: '123', port: 4321 })
            expect(client.options.protocol).toBe('http')
            expect(client.options.hostname).toBe('localhost')
            expect(client.options.port).toBe(4321)
            expect(client.options.path).toBe('/')
        })

        it('should allow to attach to appium session', async () => {
            const client = WebDriver.attachToSession({
                ...sessionOptions,
                capabilities: {
                    'appium:automationName': 'foo',
                    'platformName': 'ios',
                }
            }) as unknown as TestClient
            expect(client.isMobile).toBe(true)
            expect(client.installApp).toBeTruthy()
            expect(client.getGeoLocation).toBeTruthy()
        })

        it('should pass "bidiConnectTimeout" to "initiateBidi"', () => {
            vi.spyOn(utils, 'initiateBidi')
            const capabilities = { browserName: 'firefox', webSocketUrl: 'ws://foo/bar' } as WebdriverIO.Capabilities
            WebDriver.attachToSession({ sessionId: '123', capabilities, bidiConnectTimeout: 30000 })
            expect(utils.initiateBidi).toHaveBeenLastCalledWith('ws://foo/bar', undefined, undefined, undefined, 30000)
        })

        it('listens to the Bidi messages of an attached session once it connects', async () => {
            const socket = { on: vi.fn() }
            vi.spyOn(utils, 'initiateBidi').mockReturnValueOnce({
                _bidiHandler: { value: { waitForConnected: () => Promise.resolve(true), socket } }
            })
            const capabilities = { browserName: 'chrome', webSocketUrl: 'ws://foo/bar' } as WebdriverIO.Capabilities
            WebDriver.attachToSession({ ...sessionOptions, capabilities })
            await vi.waitFor(() => expect(socket.on).toHaveBeenCalledWith('message', expect.any(Function)))
        })

        it('does not crash the process when the Bidi connection of an attached session fails (#16240)', async () => {
            const onUnhandledRejection = vi.fn()
            process.on('unhandledRejection', onUnhandledRejection)
            try {
                /**
                 * a failed connection has no socket
                 */
                vi.spyOn(utils, 'initiateBidi').mockReturnValueOnce({
                    _bidiHandler: { value: { waitForConnected: () => Promise.resolve(false), socket: undefined } }
                })
                const capabilities = { browserName: 'chrome', webSocketUrl: 'ws://foo/bar' } as WebdriverIO.Capabilities
                const client = WebDriver.attachToSession({ ...sessionOptions, capabilities })
                await new Promise((resolve) => setTimeout(resolve, 10))

                expect(onUnhandledRejection).not.toHaveBeenCalled()
                expect(client.sessionId).toBe('foobar')
            } finally {
                process.off('unhandledRejection', onUnhandledRejection)
            }
        })

        it('should fail attaching to session if sessionId is not given', () => {
            // @ts-ignore
            expect(() => WebDriver.attachToSession({}))
                .toThrow(/sessionId is required/)
        })
    })

    describe('reloadSession', () => {
        it('checks the WebDriver Bidi server of a new Appium browser session', async () => {
            const capabilities = { platformName: 'Android', browserName: 'Chrome', 'appium:automationName': 'UiAutomator2' }
            for (const usable of [false, true]) {
                // the first session is a desktop one: the check follows the new session
                const session = await WebDriver.newSession({ path: '/', capabilities: { browserName: 'firefox' } })
                vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                    value: { sessionId: 'bidi-session', capabilities: { ...capabilities, webSocketUrl: 'ws://foo/bar' } }
                }))
                const on = vi.fn()
                const handler = { reconnect: vi.fn().mockResolvedValue(true), socket: { on } }
                ;(session as any)._bidiHandler = handler
                const discard = vi.spyOn(utils, 'discardBidiWithoutBrowsingContext').mockResolvedValue(usable)
                await WebDriver.reloadSession(session, capabilities)
                expect(discard).toHaveBeenCalledWith(handler, DEFAULTS.bidiConnectTimeout.default, 'For WebDriver Bidi with Chrome on Android, use Appium 3.9.0 or later with the UiAutomator2 driver 8.7.3 or later. ')
                expect(on).toHaveBeenCalledTimes(usable ? 1 : 0)
                expect(session.capabilities.webSocketUrl).toBe(usable ? 'ws://foo/bar' : undefined)
                discard.mockRestore()
            }
        })

        it('should reload session', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            vi.mocked(startWebDriver).mockClear()
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({
                value: {
                    sessionId: 'bidi-session',
                    capabilities: { webSocketUrl: 'ws://foo/bar' }
                }
            }))
            const reconnect = vi.fn().mockResolvedValue(undefined)
            ;(session as any)._bidiHandler = { reconnect, socket: { on: vi.fn() } }
            session.options.strictSSL = false
            session.options.headers = { Authorization: 'OAuth 12345' }
            await WebDriver.reloadSession(session)
            expect(startWebDriver).not.toHaveBeenCalledOnce()
            expect(fetch).toHaveBeenCalledTimes(2)
            expect(reconnect).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    followRedirects: true,
                    maxRedirects: 10,
                    rejectUnauthorized: false,
                    headers: { Authorization: 'OAuth 12345' }
                })
            )
        })

        it('starts a new driver process if browserName is given', async () => {
            vi.mocked(startWebDriver).mockImplementation((params) => {
                params.hostname = 'localhost'
                params.port = 4444
                return { pid: 1234 } as any
            })
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            vi.mocked(startWebDriver).mockClear()
            await WebDriver.reloadSession(session, { browserName: 'chrome' })
            expect(startWebDriver).toHaveBeenCalledOnce()
            expect((session.capabilities as WebdriverIO.Capabilities)['wdio:driverPID']).toBe(1234)
        })

        it('keeps the PID of the newly spawned driver after reload', async () => {
            const spawnDriver = (pid: number) => (params: Capabilities.RemoteConfig) => {
                params.hostname = 'localhost'
                params.port = 4444
                return { pid } as any
            }
            vi.mocked(startWebDriver)
                .mockImplementationOnce(spawnDriver(1234))
                .mockImplementationOnce(spawnDriver(5678))
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect((session.capabilities as WebdriverIO.Capabilities)['wdio:driverPID']).toBe(1234)
            await WebDriver.reloadSession(session, { browserName: 'chrome' })
            expect((session.capabilities as WebdriverIO.Capabilities)['wdio:driverPID']).toBe(5678)
        })

        it('connects to the new remote', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            vi.mocked(startWebDriver).mockClear()
            await WebDriver.reloadSession(session, { protocol: 'https', hostname: '1.1.1.1', port: 5555, browserName: 'chrome' })
            expect(startWebDriver).not.toHaveBeenCalledOnce()
            expect(session.options.protocol).toBe('https')
            expect(session.options.hostname).toBe('1.1.1.1')
            expect(session.options.port).toBe(5555)

            await WebDriver.reloadSession(session, { protocol: 'http', hostname: 'localhost', browserName: 'firefox' })
            expect(startWebDriver).toHaveBeenCalledOnce()
            expect(session.options.protocol).toBe('http')
            expect(session.options.hostname).toBe('localhost')
            expect((session.requestedCapabilities as WebdriverIO.Capabilities)['browserName']).toBe('firefox')
        })
    })

    it('ensure that WebDriver interface exports protocols and other objects', () => {
        expect(WebDriver.WebDriver).not.toBe(undefined)
    })

    afterEach(() => {
        vi.mocked(logger.setLevel).mockClear()
        vi.mocked(fetch).mockClear()
        vi.mocked(sessionEnvironmentDetector).mockClear()
        vi.mocked(startWebDriver).mockClear()
    })
})
