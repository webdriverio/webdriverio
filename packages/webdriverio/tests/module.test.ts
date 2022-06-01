import http from 'node:http'
import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'
import { runFnInFiberContext } from '@wdio/utils'

import detectBackend from '../src/utils/detectBackend'
import { remote, multiremote, attach, RemoteOptions } from '../src'

jest.mock('../src/utils/detectBackend', () => jest.fn())

jest.mock('webdriver', () => {
    const WebDriverModule = jest.requireActual('webdriver')
    const client = {
        sessionId: 'foobar-123',
        addCommand: jest.fn(),
        overwriteCommand: jest.fn(),
        strategies: new Map(),
        isWebDriver: true
    }
    const newSessionMock = jest.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        let result = cb(client, params)
        // @ts-ignore mock feature
        if (params.test_multiremote) {
            result.options = { logLevel: 'error' }
        }
        return result
    })

    const module = {
        newSession: newSessionMock,
        attachToSession: jest.fn().mockReturnValue(client),
        DEFAULTS: WebDriverModule.DEFAULTS
    }

    return {
        ...module,
        default: module
    }
})

jest.mock('devtools', () => {
    const DevTools = jest.requireActual('devtools').default
    const client = { sessionId: 'foobar-123', isDevTools: true }
    const newSessionMock = jest.fn()
    newSessionMock.mockReturnValue(new Promise((resolve) => resolve(client)))
    newSessionMock.mockImplementation((params, cb) => {
        let result = cb(client, params)
        // @ts-ignore mock feature
        if (params.test_multiremote) {
            result.options = { logLevel: 'error' }
        }
        return result
    })

    const module = {
        newSession: newSessionMock,
        attachToSession: jest.fn().mockReturnValue(client),
        SUPPORTED_BROWSER: ['chrome'],
        DEFAULTS: DevTools.DEFAULTS
    }

    return {
        ...module,
        default: module
    }
})

jest.mock('@wdio/config', () => {
    const validateConfigMock = {
        validateConfig: jest.fn((_, args) => args),
        detectBackend: jest.fn(),
    }
    return validateConfigMock
})

jest.mock('http', () => {
    let response = { statusCode: 404 }
    const reqCall = { on: jest.fn(), end: jest.fn() }
    return {
        request: jest.fn().mockImplementation((url, cb) => {
            cb(response)
            return reqCall
        }),
        setResonse: (res) => (response = res),
        Agent: jest.fn()
    }
})

const WebDriver = require('webdriver').default

describe('WebdriverIO module interface', () => {
    beforeEach(() => {
        WebDriver.newSession.mockClear()
        ;(detectBackend as jest.Mock).mockClear()
    })

    it('should provide remote and multiremote access', () => {
        expect(typeof remote).toBe('function')
        expect(typeof attach).toBe('function')
        expect(typeof multiremote).toBe('function')
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
            expect(detectBackend).toBeCalledWith(options)
            expect(logger.setLogLevelsConfig).toBeCalledWith(undefined, 'trace')
        })

        it('allows to propagate a modifier', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {}
            }, (client) => {
                client.foobar = 'barfoo'
                return client
            })
            expect(browser.sessionId).toBe('foobar-123')
            // @ts-ignore mock feature
            expect(browser.foobar).toBe('barfoo')
        })

        it('should try to detect the backend', async () => {
            await remote({
                user: 'foo',
                key: 'bar',
                capabilities: {}
            })
            expect(detectBackend).toBeCalled()
        })

        it('should properly detect automation protocol', async () => {
            const devtoolsBrowser = await remote({ capabilities: { browserName: 'chrome' } })
            expect(devtoolsBrowser.isDevTools).toBe(true)

            // @ts-ignore mock feature
            http.setResonse({ statusCode: 200 })
            const webdriverBrowser = await remote({ capabilities: { browserName: 'chrome' } })
            // @ts-ignore mock feature
            expect(webdriverBrowser.isWebDriver).toBe(true)

            const anotherWebdriverBrowser = await remote({
                path: '/',
                capabilities: { browserName: 'chrome' }
            })

            // @ts-ignore mock feature
            expect(anotherWebdriverBrowser.isWebDriver).toBe(true)
        })

        it('should not wrap custom commands into fiber context if used as standalone', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {}
            })
            const customCommand = jest.fn()
            browser.addCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(0)

            browser.overwriteCommand('deleteCookies', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(0)
        })

        it('should wrap custom commands into fiber context', async () => {
            const browser = await remote({
                automationProtocol: 'webdriver',
                capabilities: {},
                framework: 'mocha'
            })
            const customCommand = jest.fn()
            browser.addCommand('someCommand', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(1)

            browser.overwriteCommand('deleteCookies', customCommand)
            expect(runFnInFiberContext).toBeCalledTimes(2)
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
            } catch (error) {
                browser.strategies.delete('test-strat')
                expect(error.message).toBe('Strategy test-strat already exists')
            }
        })

        it('should properly create stub instance', async () => {
            (validateConfig as jest.Mock).mockReturnValueOnce({
                automationProtocol: './protocol-stub.js'
            })
            const browser = await remote({ capabilities: { browserName: 'chrome' } })

            expect(browser.sessionId).toBeUndefined()
            expect(browser.capabilities).toEqual({ browserName: 'chrome', chrome: true })
            // @ts-ignore test types
            expect(() => browser.addCommand()).toThrow()
            // @ts-ignore test types
            expect(() => browser.overwriteCommand()).toThrow()

            const flags = {}
            Object.entries(browser).forEach(([key, value]) => {
                if (key.startsWith('is')) {
                    flags[key] = value
                }
            })
            expect(flags).toEqual({
                isAndroid: false,
                isChrome: true,
                isFirefox: false,
                isIOS: false,
                isMobile: false,
                isSauce: false
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
            expect(WebDriver.newSession.mock.calls).toHaveLength(2)
        })

        it('should attach custom locators to the strategies', async () => {
            const driver = await multiremote({
                browserA: {
                    // @ts-ignore mock feature
                    test_multiremote: true,
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
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
                browserA: { test_multiremote: true, capabilities: { browserName: 'chrome' } },
                // @ts-ignore mock feature
                browserB: { test_multiremote: true, capabilities: { browserName: 'firefox' } }
            })

            try {
                const fakeFn = () => { return 'test' as any as HTMLElement }
                driver.addLocatorStrategy('test-strat', fakeFn)
            } catch (error) {
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
            expect(WebDriver.attachToSession.mock.calls[0][0]).toMatchSnapshot()
        })
    })

    afterEach(() => {
        WebDriver.attachToSession.mockClear()
        WebDriver.newSession.mockClear()
    })
})
