import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import WebDriver from 'webdriver'
import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'

import detectBackend from '../src/utils/detectBackend.js'
import { remote, multiRemote, attach, Key, SevereServiceError, deviceDescriptorsSource } from '../src/index.js'
import { registerSessionManager } from '../src/session/index.js'
import type * as DriverModule from '../src/utils/driver.js'

vi.mock('../src/utils/detectBackend', () => ({ default: vi.fn() }))
/**
 * `getProtocolDriver` imports `webdriver` dynamically. When `multiRemote` starts
 * several sessions at once, Vitest can hand the concurrent imports the real
 * package instead of the mock (https://github.com/vitest-dev/vitest/issues/7040),
 * so pin the driver to the mocked class.
 */
vi.mock('../src/utils/driver.js', async (importOriginal) => {
    const actual = await importOriginal<typeof DriverModule>()
    const { default: WebDriverMock } = await import('webdriver')
    return {
        ...actual,
        getProtocolDriver: async (options: Parameters<typeof actual.getProtocolDriver>[0]) => {
            const result = await actual.getProtocolDriver(options)
            return (options.automationProtocol ?? 'webdriver') === 'webdriver'
                ? { ...result, Driver: WebDriverMock }
                : result
        }
    }
})
vi.mock('../src/session/index.js', () => ({ registerSessionManager: vi.fn() }))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('webdriver', () => {
    const client = {
        sessionId: 'foobar-123',
        options: {},
        addCommand: vi.fn(),
        overwriteCommand: vi.fn(),
        strategies: new Map(),
        isWebDriver: true,
        capabilities: { webSocketUrl: 'ws://' },
        on: vi.fn()
    }
    const newSessionMock = vi.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        const result = cb(client, params)
        // @ts-ignore mock feature
        if (params.test_multi_remote) {
            result.options = { logLevel: 'error' }
        }
        return result
    })
    const attachToSessionMock = vi.fn().mockReturnValue(client)
    return {
        DEFAULTS: {},
        default: class WebDriverMock {
            static newSession = newSessionMock
            static attachToSession = attachToSessionMock
        }
    }
})

vi.mock('@wdio/config', () => {
    const validateConfigMock = {
        validateConfig: vi.fn((_, args) => args),
        detectBackend: vi.fn(),
    }
    return validateConfigMock
})

vi.mock('http', () => {
    let response = { statusCode: 404 }
    const reqCall = { on: vi.fn(), end: vi.fn() }
    return {
        default: {
            request: vi.fn().mockImplementation((url, cb) => {
                cb(response)
                return reqCall
            }),
            setResonse: (res: any) => (response = res),
            Agent: vi.fn()
        }
    }
})

describe('WebdriverIO module interface', () => {
    beforeEach(() => {
        vi.mocked(WebDriver.newSession).mockClear()
        vi.mocked(WebDriver.attachToSession).mockClear()
        vi.mocked(detectBackend).mockClear()
        vi.mocked(registerSessionManager).mockClear()
    })

    it('should provide all exports', () => {
        expect(typeof remote).toBe('function')
        expect(typeof attach).toBe('function')
        expect(typeof multiRemote).toBe('function')
        expect(typeof Key).toBe('object')
        expect(typeof SevereServiceError).toBe('function')
        expect(deviceDescriptorsSource['iPhone 15'].viewport).toEqual({ width: 393, height: 659 })
    })

    describe('remote function', () => {
        it('creates a webdriver session', async () => {
            const options: any = {
                capabilities: { browserName: 'chrome' },
                logLevel: 'trace'
            }
            const browser = await remote(options)
            expect(browser.sessionId).toBe('foobar-123')
            expect(logger.setLogLevelsConfig).toBeCalledWith(undefined, 'trace')
            expect(registerSessionManager).toBeCalledTimes(1)
        })

        /**
         * a spec that calls `remote()` in a worker: its logs stay in the worker's log file
         */
        it('keeps a log file that is already set', async () => {
            const outputDir = path.join(os.tmpdir(), 'wdio-remote-log-path')
            process.env.WDIO_LOG_PATH = path.join(outputDir, 'spec-0-0.log')

            try {
                await remote({ outputDir, capabilities: { browserName: 'chrome' } })
                expect(process.env.WDIO_LOG_PATH).toBe(path.join(outputDir, 'spec-0-0.log'))
            } finally {
                delete process.env.WDIO_LOG_PATH
            }
        })

        it('allows to propagate a modifier', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'chrome' }
            }, (client: any) => {
                client.foobar = 'barfoo'
                return client
            })
            expect(browser.sessionId).toBe('foobar-123')
            // @ts-ignore mock feature
            expect(browser.foobar).toBe('barfoo')
        })

        it('should try to detect the backend', async () => {
            await remote({
                automationProtocol: 'webdriver',
                user: 'foo',
                key: 'bar',
                capabilities: { browserName: 'chrome' }
            })
            expect(detectBackend).toBeCalled()
        })

        it('should attach custom locators to the strategies', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'chrome' }
            })
            const fakeFn = () => { return 'test' as unknown as HTMLElement }

            browser.addLocatorStrategy('test-strat', fakeFn)
            expect(browser.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            // @ts-ignore uses expect-webdriverio
            expect.assertions(1)
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'chrome' }
            })

            try {
                const fakeFn = () => { return 'test' as unknown as HTMLElement }
                browser.addLocatorStrategy('test-strat', fakeFn)
            } catch (error: any) {
                browser.strategies.delete('test-strat')
                expect(error.message).toBe('Strategy test-strat already exists')
            }
        })

        it('should properly create stub instance', async () => {
            vi.mocked(validateConfig).mockReturnValueOnce({
                automationProtocol: './protocol-stub.js'
            })
            const browser = await remote({ capabilities: { browserName: 'chrome' } })

            expect(browser.sessionId).toBeUndefined()
            expect(browser.capabilities).toEqual({
                browserName: 'chrome',
                'goog:chromeOptions': {}
            })

            const flags: any = {}
            Object.entries(browser).forEach(([key, value]) => {
                if (key.startsWith('is')) {
                    flags[key] = value
                }
            })
            expect(flags).toEqual({
                isAndroid: false,
                isChrome: true,
                isChromium: true,
                isFirefox: false,
                isIOS: false,
                isMobile: false,
                isSauce: false,
                isBidi: false,
                isWindowsApp: false,
                isMacApp: false,
            })
            expect(registerSessionManager).not.toBeCalled()
        })

        it('should not initialize session managers for protocol stub sessions', async () => {
            const browser = await remote({
                automationProtocol: './protocol-stub.js',
                capabilities: {
                    browserName: 'Safari',
                    platformName: 'iOS',
                    'appium:options': { automationName: 'XCUITest' }
                }
            })

            expect(browser.isMobile).toBe(true)
            expect(registerSessionManager).not.toBeCalled()
        })

        it('should use the element disable implicitWait exclusion list', async () => {
            await remote({
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'chrome' }
            })

            expect(WebDriver.newSession).toHaveBeenCalledWith(
                expect.anything(),
                expect.any(Function),
                expect.any(Object),
                expect.any(Function),
                expect.arrayContaining([
                    'getElement',
                    'getElements',
                    'emit',
                ])
            )
        })
    })

    describe('multi-remote', () => {
        it('deletes sessions that already started when another instance fails to start', async () => {
            const started = {
                sessionId: 'started-session',
                options: { logLevel: 'error' },
                capabilities: {},
                addCommand: vi.fn(),
                overwriteCommand: vi.fn(),
                strategies: new Map(),
                deleteSession: vi.fn().mockResolvedValue(undefined)
            }
            let calls = 0
            let releaseStarted = () => {}
            const startedGate = new Promise<void>((resolve) => {
                releaseStarted = resolve
            })
            const original = vi.mocked(WebDriver.newSession).getMockImplementation()
            vi.mocked(WebDriver.newSession).mockImplementation((params: any, cb: any) => {
                calls += 1
                if (params.capabilities?.browserName === 'firefox') {
                    return Promise.reject(new Error('second session failed'))
                }
                return startedGate.then(() => {
                    const result = cb(started, params)
                    result.options = { logLevel: 'error' }
                    return result
                })
            })

            try {
                const pending = multiRemote({
                    browserA: {
                        automationProtocol: 'webdriver',
                        capabilities: { browserName: 'chrome' }
                    },
                    browserB: {
                        automationProtocol: 'webdriver',
                        capabilities: { browserName: 'firefox' }
                    }
                })
                // Startup can reject before the assertion below is attached.
                void pending.catch(() => {})
                await vi.waitFor(() => {
                    expect(calls).toBe(2)
                })
                expect(started.deleteSession).not.toHaveBeenCalled()
                releaseStarted()
                await expect(pending).rejects.toThrow('second session failed')
                expect(started.deleteSession).toHaveBeenCalledTimes(1)
            } finally {
                vi.mocked(WebDriver.newSession).mockImplementation(original!)
            }
        })

        it('closes a live session when another startup fails while a third is still connecting', async () => {
            const live = {
                sessionId: 'live-session',
                options: { logLevel: 'error' },
                capabilities: {},
                addCommand: vi.fn(),
                overwriteCommand: vi.fn(),
                strategies: new Map(),
                deleteSession: vi.fn().mockResolvedValue(undefined)
            }
            const slow = {
                sessionId: 'slow-session',
                options: { logLevel: 'error' },
                capabilities: {},
                addCommand: vi.fn(),
                overwriteCommand: vi.fn(),
                strategies: new Map(),
                deleteSession: vi.fn().mockResolvedValue(undefined)
            }
            let releaseSlow = () => {}
            const slowGate = new Promise<void>((resolve) => {
                releaseSlow = resolve
            })
            const original = vi.mocked(WebDriver.newSession).getMockImplementation()
            vi.mocked(WebDriver.newSession).mockImplementation((params: any, cb: any) => {
                const browserName = params.capabilities?.browserName
                if (browserName === 'safari') {
                    return slowGate.then(() => {
                        const result = cb(slow, params)
                        result.options = { logLevel: 'error' }
                        return result
                    })
                }
                if (browserName === 'firefox') {
                    return Promise.reject(new Error('second session failed'))
                }
                const result = cb(live, params)
                result.options = { logLevel: 'error' }
                return result
            })

            try {
                const pending = multiRemote({
                    browserA: {
                        automationProtocol: 'webdriver',
                        capabilities: { browserName: 'chrome' }
                    },
                    browserB: {
                        automationProtocol: 'webdriver',
                        capabilities: { browserName: 'firefox' }
                    },
                    browserC: {
                        automationProtocol: 'webdriver',
                        capabilities: { browserName: 'safari' }
                    }
                })
                // Startup can reject before the assertion below is attached.
                void pending.catch(() => {})
                await vi.waitFor(() => {
                    expect(live.deleteSession).toHaveBeenCalledTimes(1)
                })
                await expect(pending).rejects.toThrow('second session failed')
                expect(slow.deleteSession).not.toHaveBeenCalled()
                releaseSlow()
                await vi.waitFor(() => {
                    expect(slow.deleteSession).toHaveBeenCalledTimes(1)
                })
            } finally {
                releaseSlow()
                vi.mocked(WebDriver.newSession).mockImplementation(original!)
            }
        })

        it('register multiple clients', async () => {
            await multiRemote({
                browserA: {
                    // @ts-ignore mock feature
                    test_multi_remote: true,
                    automationProtocol: 'webdriver',
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    // @ts-ignore mock feature
                    test_multi_remote: true,
                    automationProtocol: 'webdriver',
                    capabilities: { browserName: 'firefox' }
                }
            })
            expect(WebDriver.attachToSession).toBeCalled()
            expect(WebDriver.newSession).toHaveBeenCalledTimes(2)
        })

        it('should attach custom locators to the strategies', async () => {
            const driver = await multiRemote({
                browserA: {
                    automationProtocol: 'webdriver',
                    // @ts-ignore mock feature
                    test_multi_remote: true,
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    automationProtocol: 'webdriver',
                    // @ts-ignore mock feature
                    test_multi_remote: true,
                    capabilities: { browserName: 'firefox' }
                }
            })

            const fakeFn = () => { return 'test' as unknown as HTMLElement }
            driver.addLocatorStrategy('test-strat', fakeFn)
            expect(driver.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            // @ts-ignore uses expect-webdriverio
            expect.assertions(1)
            const driver = await multiRemote({
                // @ts-ignore mock feature
                browserA: { automationProtocol: 'webdriver', test_multi_remote: true, capabilities: { browserName: 'chrome' } },
                // @ts-ignore mock feature
                browserB: { automationProtocol: 'webdriver', test_multi_remote: true, capabilities: { browserName: 'firefox' } }
            })

            try {
                const fakeFn = () => { return 'test' as unknown as HTMLElement }
                driver.addLocatorStrategy('test-strat', fakeFn)
            } catch (error: any) {
                driver.strategies.delete('test-strat')
                expect(error.message).toBe('Strategy test-strat already exists')
            }
        })
    })

    describe('attach', () => {
        it('attaches', async () => {
            const browser = {
                sessionId: 'foobar',
                capabilities: {
                    browserName: 'chrome',
                    platformName: 'MacOS'
                },
                requestedCapabilities: {
                    browserName: 'chrome'
                }
            }
            await attach(browser)
            expect(WebDriver.attachToSession).toBeCalledTimes(1)
            expect(vi.mocked(WebDriver.attachToSession).mock.calls[0][0]).toMatchSnapshot()
        })

        it('should apply attach parameters with priority to Driver.attachToSession', async () => {

            let capturedParams
            const actualDetectBackend = await vi.importActual('../src/utils/detectBackend') as { default: typeof detectBackend }
            vi.mocked(detectBackend).mockImplementation(actualDetectBackend.default)

            const originalMockImplementation = vi.mocked(WebDriver.attachToSession).getMockImplementation()

            vi.mocked(WebDriver.attachToSession).mockImplementation((params, modifier, prototype, commandWrapper) => {
                capturedParams = params
                return originalMockImplementation!(params, modifier, prototype, commandWrapper)
            })

            await attach({
                sessionId: 'test-session-id',
                port: 1234,
                path: '/wd/hub',
            })

            expect(capturedParams).toMatchObject({
                port: 1234,
                path: '/wd/hub',
            })
        })

        it('should have defined locatorStrategy', async () => {
            const browser = {
                sessionId: 'foobar',
                capabilities: {
                    browserName: 'chrome',
                    platformName: 'MacOS'
                },
                requestedCapabilities: {
                    browserName: 'chrome'
                }
            }
            const newBrowser = await attach(browser)
            expect(newBrowser).toHaveProperty('addLocatorStrategy')
        })

        it('should apply waitforTimeout and waitforInterval from options (issue #14715)', async () => {
            let capturedParams: any
            const actualDetectBackend = await vi.importActual('../src/utils/detectBackend') as { default: typeof detectBackend }
            vi.mocked(detectBackend).mockImplementation(actualDetectBackend.default)

            const originalMockImplementation = vi.mocked(WebDriver.attachToSession).getMockImplementation()

            vi.mocked(WebDriver.attachToSession).mockImplementation((params, modifier, prototype, commandWrapper) => {
                capturedParams = params
                return originalMockImplementation!(params, modifier, prototype, commandWrapper)
            })

            await attach({
                sessionId: 'test-session-id',
                options: {
                    waitforTimeout: 5000,
                    waitforInterval: 500,
                }
            })

            expect(capturedParams).toMatchObject({
                waitforTimeout: 5000,
                waitforInterval: 500,
            })
        })
    })

    it('should use the element disable implicitWait exclusion list', async () => {
        await multiRemote({
            browserA: {
                // @ts-ignore mock feature
                test_multi_remote: true,
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'chrome' }
            },
            browserB: {
                // @ts-ignore mock feature
                test_multi_remote: true,
                automationProtocol: 'webdriver',
                capabilities: { browserName: 'firefox' }
            }
        })

        expect(WebDriver.newSession).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(Function),
            expect.any(Object),
            expect.any(Function),
            expect.arrayContaining([
                'getElement',
                'getElements',
                'emit',
            ])

        )
        expect(WebDriver.newSession).toHaveBeenCalledTimes(2)
    })

    afterEach(() => {
        vi.mocked(WebDriver.attachToSession).mockClear()
        vi.mocked(WebDriver.newSession).mockClear()
    })
})
