import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import aiSDK from '@browserstack/ai-sdk-node'

import AiHandler from '../src/ai-handler'
import * as bstackLogger from '../src/bstackLogger'
import * as funnelInstrumentation from '../src/instrumentation/funnelInstrumentation'
import type { Capabilities } from '@wdio/types'

// Mock only the external dependency
// jest.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
jest.mock('@browserstack/ai-sdk-node')
// jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))
jest.mock('node:fs', () => ({
    readFileSync: jest.fn().mockReturnValue(Buffer.from('extension-content'))
}))

const bstackLoggerSpy = jest.spyOn(bstackLogger.BStackLogger, 'info')
bstackLoggerSpy.mockImplementation(() => '')

describe('AiHandler', () => {
    let config: any
    let browser: any

    beforeEach(() => {
        jest.resetAllMocks()
        jest.resetModules()
        config = {
            user: 'foobaruser',
            key: '12345678901234567890',
            selfHeal: true // Default to true
        }

        browser = {
            sessionId: 'test-session-id',
            execute: jest.fn(),
            installAddOn: jest.fn(),
            overwriteCommand: jest.fn()
        }
    })

    describe('setToken', () => {
        it('setToken calls aiSDK.BrowserstackHealing.setToken', async () => {
            const setTokenSpy = jest.spyOn(aiSDK.BrowserstackHealing, 'setToken')
            AiHandler.setToken('test-session-id', 'test-session-token')
            expect(setTokenSpy).toHaveBeenCalledTimes(1)
        })

        it('should not call setToken if authResult is empty but selfHeal is true', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {} as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            browser.capabilities = caps
            config.selfHeal = true
            await AiHandler.handleSelfHeal(config, browser)

            expect(setTokenSpy).not.toHaveBeenCalled()
        })
    })

    describe('authenticateUser', () => {
        it('should authenticate user', async () => {
            const authResponse = {
                message: 'Authentication successful',
                isAuthenticated: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: true,
                sessionToken: 'test-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true,
            }

            const initSpy = jest.spyOn(aiSDK.BrowserstackHealing, 'init')
                .mockReturnValue(Promise.resolve(authResponse) as any)

            const result = await AiHandler.authenticateUser(config.user, config.key)

            expect(initSpy).toHaveBeenCalledTimes(1)
            expect(initSpy).toHaveBeenCalledWith(
                config.key,
                config.user,
                'https://tcg.browserstack.com',
                expect.any(String)
            )
            expect(result).toEqual(authResponse)
        })
    })

    describe('updateCaps', () => {
        it('should add the AI extension to capabilities', async () => {
            const authResult = {
                isAuthenticated: true,
                defaultLogDataEnabled: true,
            } as any

            const caps = {
                'goog:chromeOptions': {}
            }
            const mockExtension = 'mock-extension'

            jest.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ ...caps, 'goog:chromeOptions': { extensions: [mockExtension] } })

            const updatedCaps = await AiHandler.updateCaps(authResult, config, caps) as any

            expect(updatedCaps['goog:chromeOptions'].extensions).toEqual([mockExtension])
        })

        it('should not update capabilities if authentication failed', async () => {
            const authResult = {
                isAuthenticated: false,
                message: 'Authentication failed'
            } as any

            const caps = { browserName: 'chrome' }
            const updatedCaps = await AiHandler.updateCaps(authResult, config, caps)

            expect(updatedCaps).toEqual(caps)
        })

        it('should not update capabilities if selfHeal is false', async () => {
            const authResult = {
                isAuthenticated: false,
                message: 'Authentication failed'
            } as any

            config.selfHeal = false

            const caps = { browserName: 'chrome' }
            const updatedCaps = await AiHandler.updateCaps(authResult, config, caps)

            expect(updatedCaps).toEqual(caps)
        })

        it('should handle array of capabilities', async () => {
            const authResult = {
                isAuthenticated: true,
                defaultLogDataEnabled: true,
            } as any

            const caps = [{ browserName: 'chrome' }]
            const mockExtension = 'mock-extension'

            jest.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ browserName: 'chrome', 'goog:chromeOptions': { extensions: [mockExtension] } })

            const updatedCaps = await AiHandler.updateCaps(authResult, config, caps) as any

            expect(updatedCaps[0]['goog:chromeOptions'].extensions).toEqual([mockExtension])
        })

        it('should handle mixed array and object capabilities', async () => {
            const authResult = {
                isAuthenticated: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: true,
            } as any

            const capsArray = [{
                browserName: 'chrome',
                'goog:chromeOptions': {}
            }]

            const capsObject = {
                browserName: 'firefox',
                'moz:firefoxOptions': {}
            }

            const mockChromeExtension = 'mock-chrome-extension'
            const mockFirefoxExtension = 'mock-firefox-extension'

            const initializeCapabilitiesSpy = jest.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValueOnce({
                    browserName: 'chrome',
                    'goog:chromeOptions': { extensions: [mockChromeExtension] }
                })
                .mockReturnValueOnce({
                    browserName: 'firefox',
                    'moz:firefoxOptions': { extensions: [mockFirefoxExtension] }
                })

            const updatedCapsArray = await AiHandler.updateCaps(authResult, config, capsArray) as Array<Capabilities.RemoteCapability>
            const updatedCapsObject = await AiHandler.updateCaps(authResult, config, capsObject)

            expect(initializeCapabilitiesSpy).toHaveBeenCalledTimes(2)

            expect(initializeCapabilitiesSpy).toHaveBeenNthCalledWith(2, capsObject)

            expect(updatedCapsArray).toBeInstanceOf(Array)
            expect(updatedCapsArray[0]).toEqual({
                browserName: 'chrome',
                'goog:chromeOptions': { extensions: [mockChromeExtension] }
            })

            expect(updatedCapsObject).toEqual({
                browserName: 'firefox',
                'moz:firefoxOptions': { extensions: [mockFirefoxExtension] }
            })
        })

        it('should update caps if selfHeal is true but defaultLogDataEnabled is false', async () => {
            const authResult = {
                isAuthenticated: true,
                defaultLogDataEnabled: false,
            } as any

            const caps = { browserName: 'chrome' }
            const updatedCaps = await AiHandler.updateCaps(authResult, config, caps)

            expect(updatedCaps).not.toEqual(caps)
        })
    })

    describe('handleHealing', () => {
        it('should attempt healing if findElement fails', async () => {
            const originalFunc = jest.fn().mockReturnValueOnce({ error: 'no such element' })
                .mockReturnValueOnce({})

            const healFailureResponse = { script: 'healing-script' }
            const pollResultResponse = { selector: 'css selector', value: '.healed-element' }

            AiHandler['authResult'] = {
                isAuthenticated: true,
                isHealingEnabled: true,
                sessionToken: 'test-session-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true
            } as any

            jest.spyOn(aiSDK.BrowserstackHealing, 'healFailure')
                .mockResolvedValue(healFailureResponse.script as string)
            jest.spyOn(aiSDK.BrowserstackHealing, 'pollResult')
                .mockResolvedValue(pollResultResponse as any)
            jest.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script' as string)

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(aiSDK.BrowserstackHealing.healFailure).toHaveBeenCalledTimes(1)
            expect(aiSDK.BrowserstackHealing.pollResult).toHaveBeenCalledTimes(1)
            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(browser.execute).toHaveBeenCalledWith('healing-script')
            expect(result).toEqual({})
        })

        it('should attempt logging if findElement successfully runs', async () => {
            const originalFunc = jest.fn().mockReturnValueOnce({ element: 'mock-element' })
                .mockReturnValueOnce({})

            AiHandler['authResult'] = {
                isAuthenticated: true,
                isHealingEnabled: true,
                sessionToken: 'test-session-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true
            } as any

            jest.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script' as any)

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(1)
            expect(browser.execute).toHaveBeenCalledWith('logging-script')
            expect(result).toEqual({ 'element': 'mock-element' })
        })

        it('should call originalFunc if there is an error in try block', async () => {
            const originalFunc = jest.fn().mockImplementationOnce(() => {
                throw new Error('Some error occurred.')
            })

            AiHandler['authResult'] = {
                isAuthenticated: true,
                isHealingEnabled: true,
                sessionToken: 'test-session-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true
            } as any

            const warnSpy = jest.spyOn(bstackLogger.BStackLogger, 'warn')

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Something went wrong while healing. Disabling healing for this command'))
            expect(result).toEqual(undefined)
        })

        it('should return original error if selfHeal is false', async () => {
            const originalFunc = jest.fn().mockImplementationOnce(() => {
                throw new Error('Some error occurred.')
            })

            config.selfHeal = false

            const warnSpy = jest.spyOn(bstackLogger.BStackLogger, 'warn')

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(warnSpy).toHaveBeenCalledTimes(1)
            expect(result).toEqual(undefined)
        })

        it('should return original result error if healed element is also missing', async () => {

            const originalFunc = jest.fn().mockReturnValueOnce({ error: 'no such element' })
                .mockReturnValueOnce({ error: 'no such element' })

            const healFailureResponse = { script: 'healing-script' }
            const pollResultResponse = { selector: 'css selector', value: '.healed-element' }

            AiHandler['authResult'] = {
                isAuthenticated: true,
                isHealingEnabled: true,
                sessionToken: 'test-session-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true
            } as any

            jest.spyOn(aiSDK.BrowserstackHealing, 'healFailure')
                .mockResolvedValue(healFailureResponse.script as string)
            jest.spyOn(aiSDK.BrowserstackHealing, 'pollResult')
                .mockResolvedValue(pollResultResponse as any)
            jest.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script' as string)

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(aiSDK.BrowserstackHealing.healFailure).toHaveBeenCalledTimes(1)
            expect(aiSDK.BrowserstackHealing.pollResult).toHaveBeenCalledTimes(1)
            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(browser.execute).toHaveBeenCalledWith('healing-script')
            expect(result).toEqual({ error: 'no such element' })
        })
    })

    describe('setup', () => {
        it('should authenticate user and update capabilities for supported browser', async () => {
            const caps = { browserName: 'chrome', 'goog:chromeOptions': {} }
            const mockAuthResult = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true,
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true,
            }

            jest.resetAllMocks()
            jest.resetModules()
            const authenticateUserSpy = jest.spyOn(AiHandler, 'authenticateUser')
                .mockResolvedValue(mockAuthResult as any)
            const handleHealingInstrumentationSpy = jest.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = jest.spyOn(AiHandler, 'updateCaps')
                .mockReturnValue({ ...caps, 'goog:chromeOptions': { extensions: ['mock-extension'] } })

            const mockExtension = 'mock-extension'
            jest.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ ...caps, 'goog:chromeOptions': { extensions: [mockExtension] } })

            const emptyObj = {} as any
            await AiHandler.setup(config, emptyObj, emptyObj, caps, false)

            expect(authenticateUserSpy).toHaveBeenCalledTimes(1)
            expect(handleHealingInstrumentationSpy).toHaveBeenCalledTimes(1)
            expect(updateCapsSpy).toHaveBeenCalledTimes(1)
        })

        it('should skip setup if accessKey is not present', async () => {
            const oldBrowserStackAccessKey = process.env.BROWSERSTACK_ACCESS_KEY
            config.key = ''
            const caps = { browserName: 'chrome' }

            const authenticateUserSpy = jest.spyOn(AiHandler, 'authenticateUser')
            const handleHealingInstrumentationSpy = jest.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = jest.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            process.env.BROWSERSTACK_ACCESS_KEY = ''
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, false)
            expect(authenticateUserSpy).not.toHaveBeenCalled()
            expect(handleHealingInstrumentationSpy).not.toHaveBeenCalled()
            expect(updateCapsSpy).not.toHaveBeenCalled()
            expect(updatedCaps).toEqual(caps) // Expect caps to remain unchanged
            process.env.BROWSERSTACK_ACCESS_KEY = oldBrowserStackAccessKey
        })

        it('should skip setup if userName is not present', async () => {
            const oldBrowserStackUserName = process.env.BROWSERSTACK_USERNAME
            config.user = ''
            const caps = { browserName: 'chrome' }

            const authenticateUserSpy = jest.spyOn(AiHandler, 'authenticateUser')
            const handleHealingInstrumentationSpy = jest.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = jest.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            process.env.BROWSERSTACK_USERNAME = ''
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, false)
            expect(authenticateUserSpy).not.toHaveBeenCalled()
            expect(handleHealingInstrumentationSpy).not.toHaveBeenCalled()
            expect(updateCapsSpy).not.toHaveBeenCalled()
            expect(updatedCaps).toEqual(caps) // Expect caps to remain unchanged
            process.env.BROWSERSTACK_USERNAME = oldBrowserStackUserName
        })

        it('should handle errors in setup', async () => {
            const caps = { browserName: 'chrome' }
            const authenticateUserSpy = jest.spyOn(AiHandler, 'authenticateUser')
                .mockRejectedValue(new Error('Authentication failed'))

            const warnSpy = jest.spyOn(bstackLogger.BStackLogger, 'warn')

            const options = { selfHeal: true } as any
            const emptyObj = {} as any
            const updatedCaps = await AiHandler.setup(config, emptyObj, options, caps, false)

            expect(authenticateUserSpy).toHaveBeenCalledTimes(1)
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error while initiliazing Browserstack healing Extension'))
            expect(updatedCaps).toEqual(caps)
        })
    })

    describe('selfHeal', () => {
        it('should set token, install extension for Firefox', async () => {
            const caps = { browserName: 'firefox' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = jest.spyOn(AiHandler, 'installFirefoxExtension')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
            expect(installFirefoxExtensionSpy).toHaveBeenCalledTimes(1)
            expect(installFirefoxExtensionSpy).toHaveBeenCalledWith(browser)
        })

        it('should set token for Chrome', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
        })

        it('should skip self-healing if authResult is empty', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {} as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')

            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).not.toHaveBeenCalled()
        })

        it('should call overwriteCommand for Chrome', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            const overwriteCommandSpy = jest.spyOn(browser, 'overwriteCommand')

            jest.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
            expect(overwriteCommandSpy).toHaveBeenCalledTimes(1)
            expect(overwriteCommandSpy).toHaveBeenCalledWith('findElement', expect.any(Function))
        })

        it('should call overwriteCommand for Edge', async () => {
            const caps = { browserName: 'microsoftedge' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            const overwriteCommandSpy = jest.spyOn(browser, 'overwriteCommand')

            jest.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalled()
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
            expect(overwriteCommandSpy).toHaveBeenCalled()
            expect(overwriteCommandSpy).toHaveBeenCalledWith('findElement', expect.any(Function))
        })

        it('should skip selfHeal for unsupported browser', async () => {
            const caps = { browserName: 'safari' } as Capabilities.RemoteCapability

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = jest.spyOn(AiHandler, 'installFirefoxExtension')
            const overwriteCommandSpy = jest.spyOn(browser, 'overwriteCommand')

            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).not.toHaveBeenCalled()
            expect(installFirefoxExtensionSpy).not.toHaveBeenCalled()
            expect(overwriteCommandSpy).not.toHaveBeenCalled()
        })

        it('should handle error in selfHeal function', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken').mockImplementationOnce(() => {
                throw new Error('Some error occurred in setToken')
            })

            const warnSpy = jest.spyOn(bstackLogger.BStackLogger, 'warn')

            config.selfHeal = true
            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(warnSpy).toHaveBeenCalledWith('Error while setting up self-healing: Error: Some error occurred in setToken. Disabling healing for this session.')
        })

        it('should not set token if isAuthenticated is false', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {
                isAuthenticated: false,
                sessionToken: 'mock-session-token',
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken').mockImplementation(jest.fn() as any)

            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).not.toHaveBeenCalled()
        })

        it('should not overwrite findElement command if defaultLogDataEnabled and selfHeal are false', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            config.selfHeal = false
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: false,
            } as any

            const overwriteCommandSpy = jest.spyOn(browser, 'overwriteCommand')

            await AiHandler.selfHeal(config, caps, browser)

            expect(overwriteCommandSpy).not.toHaveBeenCalled()
        })
    })

    describe('handle multi remote browser session', () => {
        let config: any
        let browserMock: any
        let caps: any
        const mockAuthResult = {
            isAuthenticated: true,
            sessionToken: 'mock-session-token',
            defaultLogDataEnabled: true,
            isHealingEnabled: true,
            groupId: 123123,
            userId: 342423,
            isGroupAIEnabled: true,
        }

        beforeEach(() => {
            config = {
                capabilities: {
                    myChromeBrowser: {
                        hostname: 'localhost',
                        port: 4444,
                        protocol: 'http',
                        capabilities: {
                            browserName: 'chrome',
                            'goog:chromeOptions': {}
                        }
                    },
                    myFirefoxBrowser: {
                        hostname: 'localhost',
                        port: 4444,
                        protocol: 'http',
                        capabilities: {
                            browserName: 'firefox',
                            'moz:firefoxOptions': {}
                        }
                    }
                },
                maxInstances: 15,
                user: 'foobaruser',
                key: '12345',
                selfHeal: true
            }

            caps = {
                myChromeBrowser: {
                    hostname: 'localhost',
                    port: 4444,
                    protocol: 'http',
                    capabilities: {
                        browserName: 'chrome',
                        'goog:chromeOptions': {}
                    }
                },
                myFirefoxBrowser: {
                    hostname: 'localhost',
                    port: 4444,
                    protocol: 'http',
                    capabilities: {
                        browserName: 'firefox',
                        'moz:firefoxOptions': {}
                    }
                }
            }

            browserMock = {
                myChromeBrowser: {
                    sessionId: 'chrome-session-id',
                    capabilities: { browserName: 'chrome' },
                    overwriteCommand: jest.fn(),
                },
                myFirefoxBrowser: {
                    sessionId: 'firefox-session-id',
                    capabilities: { browserName: 'firefox' },
                    overwriteCommand: jest.fn(),
                    installAddOn: jest.fn()
                }
            }
        })

        it('should setup capabilities for multiremote session not running on BrowserStack', async () => {
            const mockExtension = 'mock-extension'

            const handleHealingInstrumentationSpy = jest.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = jest.spyOn(AiHandler, 'updateCaps')
                .mockReturnValue({ 'goog:chromeOptions': { extensions: [mockExtension] } })

            jest.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ 'goog:chromeOptions': { extensions: [mockExtension] } })

            const emptyObj = {} as any
            AiHandler.handleMultiRemoteSetup(mockAuthResult, config, emptyObj, emptyObj, config.capabilities)
            expect(handleHealingInstrumentationSpy).toHaveBeenCalledTimes(2)
            expect(updateCapsSpy).toHaveBeenCalledTimes(2)
        })

        it('should call handleSelfHeal for each browser in multiremote setup', async () => {
            AiHandler['authResult'] = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            const setTokenSpy = jest.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = jest.spyOn(AiHandler, 'installFirefoxExtension')
            const handleSelfHealSpy = jest.spyOn(AiHandler, 'handleSelfHeal')

            await AiHandler.selfHeal(config, caps, browserMock)

            expect(handleSelfHealSpy).toHaveBeenCalledTimes(2)
            expect(handleSelfHealSpy).toHaveBeenCalledWith(config, browserMock.myChromeBrowser)
            expect(handleSelfHealSpy).toHaveBeenCalledWith(config, browserMock.myFirefoxBrowser)
            expect(setTokenSpy).toHaveBeenCalledWith('chrome-session-id', 'mock-session-token')
            expect(setTokenSpy).toHaveBeenCalledWith('firefox-session-id', 'mock-session-token')
            expect(installFirefoxExtensionSpy).toHaveBeenCalledTimes(1)
            expect(installFirefoxExtensionSpy).toHaveBeenCalledWith(browserMock.myFirefoxBrowser)
        })

        it('should skip setup for multiremote session if accessKey is not present', async () => {
            config.key = ''
            process.env.BROWSERSTACK_ACCESS_KEY = '' // Set environment variable

            const authenticateUserSpy = jest.spyOn(AiHandler, 'authenticateUser')
                .mockResolvedValue(mockAuthResult as any)
            const handleHealingInstrumentationSpy = jest.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = jest.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            const authResult = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any

            AiHandler.handleMultiRemoteSetup(authResult, config, emptyObj, emptyObj, config.capabilities)

            expect(authenticateUserSpy).not.toHaveBeenCalled()
            expect(handleHealingInstrumentationSpy).not.toHaveBeenCalled()
            expect(updateCapsSpy).not.toHaveBeenCalled()
        })

        it('should handle multiremote setup', async () => {
            const caps = {
                browserA: {
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    capabilities: { browserName: 'firefox' }
                }
            } as any

            const handleMultiRemoteSetupSpy = jest.spyOn(AiHandler, 'handleMultiRemoteSetup')

            const emptyObj = {} as any
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, true)

            expect(handleMultiRemoteSetupSpy).toHaveBeenCalledTimes(1)
            expect(updatedCaps).toEqual(caps)

        })
    })
})
