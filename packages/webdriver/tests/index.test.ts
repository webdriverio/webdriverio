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
import { initCount } from '../src/bidi/core.js'
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
        DEFAULT_RESPONSE_TIMEOUT: 1000 * 180,
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
    getAppiumCommands (): void
    appiumLock (): void
    findElement (): void
    elementClick (elementId: string): unknown
    overwriteCommand (name: string, fn: Function): void
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

        it('should allow to create a new session using jsonwire caps', async () => {
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
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({ value: { webSocketUrl: 'ws://foo/bar' } }))
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
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({ value: { webSocketUrl } }))
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
                DEFAULTS.bidiResponseTimeout.default
            )
        })

        it('should pass a custom "bidiResponseTimeout" to "initiateBidi"', async () => {
            const webSocketUrl = 'ws://foo/bar'

            vi.spyOn(utils, 'initiateBidi')
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({ value: { webSocketUrl } }))
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' },
                bidiResponseTimeout: 300000
            })

            expect(utils.initiateBidi).toHaveBeenCalledWith(
                webSocketUrl,
                undefined,
                undefined,
                300000
            )
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

        it('it should propagate all environment flags', () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: false,
                isMobile: false,
                isIOS: false,
                isAndroid: false,
                isChromium: false,
                isSauce: false,
                isWindowsApp: false,
                isMacApp: false
            })
            expect(client.isW3C).toBe(false)
            expect(client.isMobile).toBe(false)
            expect(client.isIOS).toBe(false)
            expect(client.isAndroid).toBe(false)
            expect(client.isChromium).toBe(false)
            expect(client.isSauce).toBe(false)
            expect(client.isWindowsApp).toBe(false)
            expect(client.isMacApp).toBe(false)

            const anotherClient = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: true,
                isMobile: true,
                isIOS: true,
                isAndroid: true,
                isChromium: true,
                isSauce: true,
                isWindowsApp: true,
                isMacApp: true
            })
            expect(anotherClient.isW3C).toBe(true)
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
            expect(client.appiumIsLocked).toBeTruthy()
            expect(client.appiumShake).toBeTruthy()
        })

        it('should fail attaching to session if sessionId is not given', () => {
            // @ts-ignore
            expect(() => WebDriver.attachToSession({}))
                .toThrow(/sessionId is required/)
        })
    })

    describe('reloadSession', () => {
        it('should reload session', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            vi.mocked(startWebDriver).mockClear()
            vi.mocked(fetch).mockResolvedValueOnce(Response.json({ value: { webSocketUrl: 'ws://foo/bar' } }))
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

        it('refreshes the environment flags and adds Appium commands when reloading into a non-mobile Appium session', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect(session.isAppium).toBe(false)
            // @ts-expect-error mock feature
            expect((session as TestClient).getAppiumCommands).toBeUndefined()

            vi.mocked(startWebDriver).mockClear()
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/session/, {
                value: {
                    sessionId: 'appium-session',
                    capabilities: { 'appium:automationName': 'chrome', browserName: 'chrome' }
                },
                sessionId: 'appium-session'
            })
            await WebDriver.reloadSession(session, { 'appium:automationName': 'chrome', browserName: 'chrome' })

            expect(session.isAppium).toBe(true)
            expect(session.isMobile).toBe(false)
            expect(typeof (session as TestClient).getAppiumCommands).toBe('function')
            expect(typeof (session as TestClient).appiumLock).toBe('function')
        })

        it('clears stale Appium state when reloading into a regular browser session', async () => {
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/session/, {
                value: {
                    sessionId: 'appium-session',
                    capabilities: { 'appium:automationName': 'chrome', browserName: 'chrome' }
                },
                sessionId: 'appium-session'
            })
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { 'appium:automationName': 'chrome', browserName: 'chrome' }
            })
            expect(session.isAppium).toBe(true)
            expect(typeof (session as TestClient).getAppiumCommands).toBe('function')

            vi.mocked(startWebDriver).mockClear()
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/session/, {
                value: {
                    sessionId: 'browser-session',
                    capabilities: { browserName: 'firefox' }
                },
                sessionId: 'browser-session'
            })
            await WebDriver.reloadSession(session, { browserName: 'firefox' })

            expect(session.isAppium).toBe(false)
            expect((session as TestClient).getAppiumCommands).toBeUndefined()
            expect((session as TestClient).appiumLock).toBeUndefined()
            // non-Appium commands should still be available
            expect(typeof (session as TestClient).findElement).toBe('function')
        })

        it('does not shadow commands overridden via overwriteCommand on reload', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            ;(session as TestClient).overwriteCommand(
                'elementClick',
                async function (this: unknown, orig: Function) {
                    return `custom elementClick (${orig.name})`
                }
            )
            expect(await (session as TestClient).elementClick('some-id')).toBe('custom elementClick ()')

            await WebDriver.reloadSession(session, { browserName: 'chrome' })

            expect(await (session as TestClient).elementClick('some-id')).toBe('custom elementClick ()')
        })

        it('keeps the command closures when the URL variable encoding policy does not change on reload', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            const origElementClick = Object.getOwnPropertyDescriptor(session as TestClient, 'elementClick')?.value

            await WebDriver.reloadSession(session, { browserName: 'chrome' })

            expect(Object.getOwnPropertyDescriptor(session as TestClient, 'elementClick')?.value).toBe(origElementClick)
        })

        it('recreates protocol commands when the URL variable encoding policy changes on reload', async () => {
            const session = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            const endpoints: string[] = []
            // @ts-expect-error mock event
            session.on('command', (command: { endpoint: string }) => endpoints.push(command.endpoint))
            await (session as TestClient).elementClick('some id').catch(() => {})
            expect(endpoints.pop()).toBe('/session/:sessionId/element/some%20id/click')

            vi.mocked(startWebDriver).mockClear()
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/session/, {
                value: {
                    sessionId: 'standalone-session',
                    capabilities: { browserName: 'chrome', 'se:cdp': {} }
                },
                sessionId: 'standalone-session'
            })
            await WebDriver.reloadSession(session, { browserName: 'chrome' })

            await (session as TestClient).elementClick('some id').catch(() => {})
            expect(endpoints.pop()).toBe('/session/:sessionId/element/some%2520id/click')
        })

        it('rebuilds recreated commands through the command wrapper on reload', async () => {
            const wrappedCommands: string[] = []
            const customCommandWrapper = function (name: string, fn: Function) {
                return async function (this: unknown, ...args: unknown[]) {
                    wrappedCommands.push(name)
                    return fn.apply(this, args)
                }
            }
            const session = await WebDriver.newSession(
                { path: '/', capabilities: { browserName: 'firefox' } },
                undefined,
                {},
                customCommandWrapper
            )
            await (session as TestClient).elementClick('some-id')
            expect(wrappedCommands).toEqual(['elementClick'])

            wrappedCommands.length = 0
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/session/, {
                value: {
                    sessionId: 'standalone-session',
                    capabilities: { browserName: 'chrome', 'se:cdp': {} }
                },
                sessionId: 'standalone-session'
            })
            await WebDriver.reloadSession(session, { browserName: 'chrome' })

            await (session as TestClient).elementClick('some-id').catch(() => {})
            expect(wrappedCommands).toContain('elementClick')
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
