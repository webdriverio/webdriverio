import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest'
import path from 'node:path'
import WebDriver from 'webdriver'
import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'

import detectBackend from '../src/utils/detectBackend.js'
import type { RemoteOptions } from '../src/types.js'
import { remote, multiremote, attach, Key, SevereServiceError } from '../src/index.js'
import * as cjsExport from '../src/cjs/index.js'

vi.mock('../src/utils/detectBackend', () => ({ default: vi.fn() }))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('webdriver', () => {
    const client = {
        sessionId: 'foobar-123',
        addCommand: vi.fn(),
        overwriteCommand: vi.fn(),
        strategies: new Map(),
        isWebDriver: true
    }
    const newSessionMock = vi.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        const result = cb(client, params)
        // @ts-ignore mock feature
        if (params.test_multiremote) {
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

vi.mock('devtools', () => {
    const client = { sessionId: 'foobar-123', isDevTools: true }
    const newSessionMock = vi.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        const result = cb(client, params)
        // @ts-ignore mock feature
        if (params.test_multiremote) {
            result.options = { logLevel: 'error' }
        }
        return result
    })
    const attachToSessionMock = vi.fn().mockReturnValue(client)
    return {
        SUPPORTED_BROWSER: ['chrome'],
        DEFAULTS: {},
        default: class DevtoolsMock {
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
        vi.mocked(detectBackend).mockClear()
    })

    it('should provide all exports', () => {
        expect(typeof remote).toBe('function')
        expect(typeof attach).toBe('function')
        expect(typeof multiremote).toBe('function')
        expect(typeof Key).toBe('object')
        expect(typeof SevereServiceError).toBe('function')

        expect(typeof (cjsExport as any).remote).toBe('function')
        expect(typeof (cjsExport as any).attach).toBe('function')
        expect(typeof (cjsExport as any).multiremote).toBe('function')
        expect(typeof (cjsExport as any).Key).toBe('object')
        expect(typeof (cjsExport as any).SevereServiceError).toBe('function')
    })

    describe('remote function', () => {
        it('creates a webdriver session', async () => {
            const options: RemoteOptions = {
                automationProtocol: 'webdriver',
                capabilities: {},
                logLevel: 'trace'
            }
            const browser = await remote(options)
            expect(browser.sessionId).toBe('foobar-123')
            expect(logger.setLogLevelsConfig).toBeCalledWith(undefined, 'trace')
        })

        it('allows to propagate a modifier', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {}
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
                capabilities: {}
            })
            expect(detectBackend).toBeCalled()
        })

        it('should attach custom locators to the strategies', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {}
            })
            const fakeFn = () => { return 'test' as any as HTMLElement }

            browser.addLocatorStrategy('test-strat', fakeFn)
            expect(browser.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            // @ts-ignore uses expect-webdriverio
            expect.assertions(1)
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {}
            })

            try {
                const fakeFn = () => { return 'test' as any as HTMLElement }
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
            expect(browser.capabilities).toEqual({ browserName: 'chrome', chrome: true })

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
                isBidi: false
            })
        })
    })

    describe('multiremote', () => {
        it('register multiple clients', async () => {
            await multiremote({
                browserA: {
                    // @ts-ignore mock feature
                    test_multiremote: true,
                    automationProtocol: 'webdriver',
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    // @ts-ignore mock feature
                    test_multiremote: true,
                    automationProtocol: 'webdriver',
                    capabilities: { browserName: 'firefox' }
                }
            })
            expect(WebDriver.attachToSession).toBeCalled()
            expect(vi.mocked(WebDriver.newSession).mock.calls).toHaveLength(2)
        })

        it('should attach custom locators to the strategies', async () => {
            const driver = await multiremote({
                browserA: {
                    automationProtocol: 'webdriver',
                    // @ts-ignore mock feature
                    test_multiremote: true,
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    automationProtocol: 'webdriver',
                    // @ts-ignore mock feature
                    test_multiremote: true,
                    capabilities: { browserName: 'firefox' }
                }
            })

            const fakeFn = () => { return 'test' as any as HTMLElement }
            driver.addLocatorStrategy('test-strat', fakeFn)
            expect(driver.strategies.get('test-strat').toString()).toBe(fakeFn.toString())
        })

        it('throws error if trying to overwrite locator strategy', async () => {
            // @ts-ignore uses expect-webdriverio
            expect.assertions(1)
            const driver = await multiremote({
                // @ts-ignore mock feature
                browserA: { automationProtocol: 'webdriver', test_multiremote: true, capabilities: { browserName: 'chrome' } },
                // @ts-ignore mock feature
                browserB: { automationProtocol: 'webdriver', test_multiremote: true, capabilities: { browserName: 'firefox' } }
            })

            try {
                const fakeFn = () => { return 'test' as any as HTMLElement }
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
    })

    afterEach(() => {
        vi.mocked(WebDriver.attachToSession).mockClear()
        vi.mocked(WebDriver.newSession).mockClear()
    })
})
