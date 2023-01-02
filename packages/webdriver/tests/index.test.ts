import path from 'node:path'
import got from 'got'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// @ts-ignore mock feature
import logger, { logMock } from '@wdio/logger'
import { sessionEnvironmentDetector } from '@wdio/utils'
import type { Capabilities } from '@wdio/types'

import WebDriver, { getPrototype, DEFAULTS, command } from '../src/index.js'
// @ts-expect-error mock feature
import { initCount } from '../src/bidi.js'
import type { Client } from '../src/types.js'

vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fs')
vi.mock('ws')
vi.mock('got')

vi.mock('../src/bidi', () => {
    let initCount = 0
    return {
        BidiHandler: class BidiHandlerMock {
            connect = vi.fn()
            constructor () {
                ++initCount
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

const OUTPUT_DIR = path.join('some', 'output', 'dir')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'wdio.log')

const setUpLogCheck = (conditionFunction: () => boolean) => {
    const logCheck = (...args: string[]) => {
        if (!conditionFunction()) {
            throw new Error(
                'Log function was called before setting ' +
                'process.env.WDIO_LOG_PATH.\n' +
                'Passed arguments to log function:\n' +
                args.map((arg, index) => `  [${index}]: ${arg}`).join('\n')
            )
        }
    }

    logMock.error.mockImplementation(logCheck)
    logMock.warn.mockImplementation(logCheck)
    logMock.info.mockImplementation(logCheck)
    logMock.debug.mockImplementation(logCheck)
}

// @ts-expect-error
interface TestClient extends Client {
    getUrl (): string
    getApplicationCacheStatus (): void
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

        it('should allow to create a new session using jsonwire caps', async () => {
            const testDirPath = './logs'
            await WebDriver.newSession({
                path: '/',
                outputDir: testDirPath,
                capabilities: { browserName: 'firefox' }
            })

            expect(got).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session' }),
                expect.objectContaining({ json: {
                    capabilities: {
                        alwaysMatch: { browserName: 'firefox' },
                        firstMatch: [{}]
                    },
                    desiredCapabilities: { browserName: 'firefox' }
                } })
            )
            expect(process.env.WDIO_LOG_PATH).toEqual(path.join(testDirPath, 'wdio.log'))
        })

        it('should allow to create a new session using w3c compliant caps', async () => {
            await WebDriver.newSession({
                path: '/',
                capabilities: {
                    alwaysMatch: { browserName: 'firefox' },
                    firstMatch: [{}]
                }
            })

            expect(got).toHaveBeenCalledWith(
                expect.objectContaining({ pathname: '/session' }),
                expect.objectContaining({ json: {
                    capabilities: {
                        alwaysMatch: { browserName: 'firefox' },
                        firstMatch: [{}]
                    },
                    desiredCapabilities: { browserName: 'firefox' }
                } })
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

        it('should be possible to skip setting outputDir', async () => {
            setUpLogCheck(() => !('WDIO_LOG_PATH' in process.env))

            await WebDriver.newSession({
                capabilities: { browserName: 'chrome' },
            })

            expect('WDIO_LOG_PATH' in process.env).toBe(false)
        })

        it('should be possible to set outputDir', async () => {
            setUpLogCheck(() => process.env.WDIO_LOG_PATH === OUTPUT_FILE)

            await WebDriver.newSession({
                capabilities: { browserName: 'chrome' },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).toBe(OUTPUT_FILE)
        })

        it('should be possible to override outputDir with env var', async () => {
            const customPath = '/some/custom/path'

            setUpLogCheck(() => process.env.WDIO_LOG_PATH === customPath)

            process.env.WDIO_LOG_PATH = customPath

            await WebDriver.newSession({
                capabilities: { browserName: 'chrome' },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).not.toBe(OUTPUT_DIR)
            expect(process.env.WDIO_LOG_PATH).toBe(customPath)
        })

        it('propagates capabilities and requestedCapabilities', async () => {
            const browser = await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect((browser.capabilities as Capabilities.DesiredCapabilities).browserName).toBe('mockBrowser')
            expect((browser.requestedCapabilities as Capabilities.DesiredCapabilities).browserName).toBe('firefox')
        })

        it('attaches bidi handler if socket url is given', async () => {
            vi.mocked(got).mockResolvedValue({
                body: { value: { webSocketUrl: 'ws://foo/bar' } }
            })
            await WebDriver.newSession({
                path: '/',
                capabilities: { browserName: 'firefox' }
            })
            expect(initCount()).toBe(1)
        })
    })

    describe('attachToSession', () => {
        it('should allow to attach to existing session', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions, logLevel: 'error' }) as any as TestClient
            await client.getUrl()
            expect(got).toHaveBeenCalledWith(
                expect.objectContaining({ href: 'http://localhost:4444/session/foobar/url' }),
                expect.anything()
            )
            expect(logger.setLevel).toBeCalled()
        })

        it('should allow to attach to existing session2', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions }) as any as TestClient
            await client.getUrl()
            expect(got).toHaveBeenCalledWith(
                expect.objectContaining({ href: 'http://localhost:4444/session/foobar/url' }),
                expect.anything()
            )
            expect(logger.setLevel).not.toBeCalled()
        })

        it('should allow to attach to existing session - W3C', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions }) as any as TestClient
            await client.getUrl()

            expect(client.isChrome).toBeFalsy()
            expect(client.isMobile).toBeFalsy()
            expect(client.isSauce).toBeFalsy()
            expect(client.getApplicationCacheStatus).toBeFalsy()
            expect(client.takeElementScreenshot).toBeTruthy()
            expect(client.getDeviceTime).toBeFalsy()
        })

        it('should allow to attach to existing session - non W3C', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isW3C: false,
                isSauce: true,
            }) as any as TestClient

            await client.getUrl()

            expect(client.isSauce).toBe(true)
            expect(client.getApplicationCacheStatus).toBeTruthy()
            expect(client.takeElementScreenshot).toBeFalsy()
            expect(client.getDeviceTime).toBeFalsy()
        })

        it('should allow to attach to existing session - mobile', async () => {
            const client = WebDriver.attachToSession({ ...sessionOptions,
                isChrome: true,
                isMobile: true
            }) as any as TestClient

            await client.getUrl()

            expect(client.isChrome).toBe(true)
            expect(client.isMobile).toBe(true)
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

        it('should apply default connection details', () => {
            const client = WebDriver.attachToSession({ sessionId: '123' })
            expect(client.options.protocol).toBe('http')
            expect(client.options.hostname).toBe('localhost')
            expect(client.options.port).toBe(4444)
            expect(client.options.path).toBe('/')
        })

        it('should allow to attach to appium session', async () => {
            const client = WebDriver.attachToSession({
                ...sessionOptions,
                capabilities: {
                    'appium:automationName': 'foo',
                }
            }) as any as TestClient
            expect(client.isMobile).toBe(true)
            expect(client.isLocked).toBeTruthy()
            expect(client.shake).toBeTruthy()
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
            await WebDriver.reloadSession(session)
            expect(got).toHaveBeenCalledTimes(2)
        })
    })

    it('ensure that WebDriver interface exports protocols and other objects', () => {
        expect(WebDriver.WebDriver).not.toBe(undefined)
    })

    afterEach(() => {
        vi.mocked(logger.setLevel).mockClear()
        vi.mocked(got).mockClear()
        vi.mocked(sessionEnvironmentDetector).mockClear()
    })
})
