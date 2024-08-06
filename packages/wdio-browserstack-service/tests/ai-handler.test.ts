/// <reference path="../../webdriverio/src/@types/async.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach } from 'vitest'
import aiSDK from '@browserstack/ai-sdk-node'

import AiHandler from '../src/ai-handler.js'
import * as bstackLogger from '../src/bstackLogger.js'
import * as funnelInstrumentation from '../src/instrumentation/funnelInstrumentation.js'
import type { Capabilities } from '@wdio/types'
import { TCG_URL } from '../src/constants.js'

// Mock only the external dependency
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@browserstack/ai-sdk-node')
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue(Buffer.from('extension-content'))
    }
}))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('AiHandler', () => {
    let config: any
    let browser: any

    beforeEach(() => {
        vi.resetModules()
        config = {
            user: 'foobaruser',
            key: '12345678901234567890',
            selfHeal: true // Default to true
        }

        browser = {
            sessionId: 'test-session-id',
            execute: vi.fn(),
            installAddOn: vi.fn(),
            overwriteCommand: vi.fn(),
            capabilities: {
                browserName: 'chrome'
            }
        }
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

            const initSpy = vi.spyOn(aiSDK.BrowserstackHealing, 'init')
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

            vi.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
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

            vi.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
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

            const initializeCapabilitiesSpy = vi.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
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
            const originalFunc = vi.fn().mockReturnValueOnce({ error: 'no such element' })
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

            vi.spyOn(aiSDK.BrowserstackHealing, 'healFailure')
                .mockResolvedValue(healFailureResponse.script as string)
            vi.spyOn(aiSDK.BrowserstackHealing, 'pollResult')
                .mockResolvedValue(pollResultResponse as any)
            vi.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script' as string)

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(aiSDK.BrowserstackHealing.healFailure).toHaveBeenCalledTimes(1)
            expect(aiSDK.BrowserstackHealing.pollResult).toHaveBeenCalledTimes(1)
            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(browser.execute).toHaveBeenCalledWith('healing-script')
            expect(result).toEqual({})
        })

        it('should attempt logging if findElement successfully runs', async () => {
            const originalFunc = vi.fn().mockReturnValueOnce({ element: 'mock-element' })
                .mockReturnValueOnce({})

            AiHandler['authResult'] = {
                isAuthenticated: true,
                isHealingEnabled: true,
                sessionToken: 'test-session-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true
            } as any

            vi.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script' as any)

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(1)
            expect(browser.execute).toHaveBeenCalledWith('logging-script')
            expect(result).toEqual({ 'element': 'mock-element' })
        })

        it('should call originalFunc if there is an error in try block', async () => {
            const originalFunc = vi.fn().mockImplementationOnce(() => {
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

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(result).toEqual(undefined)
        })

        it('should return original error if selfHeal is false', async () => {
            const originalFunc = vi.fn().mockImplementationOnce(() => {
                throw new Error('Some error occurred.')
            })

            config.selfHeal = false

            const warnSpy = vi.spyOn(bstackLogger.BStackLogger, 'warn')

            const result = await AiHandler.handleHealing(originalFunc, 'id', 'some-id', browser, config)

            expect(originalFunc).toHaveBeenCalledTimes(2)
            expect(warnSpy).toHaveBeenCalledTimes(1)
            expect(result).toEqual(undefined)
        })

        it('should return original result error if healed element is also missing', async () => {

            const originalFunc = vi.fn().mockReturnValueOnce({ error: 'no such element' })
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

            vi.spyOn(aiSDK.BrowserstackHealing, 'healFailure')
                .mockResolvedValue(healFailureResponse.script as string)
            vi.spyOn(aiSDK.BrowserstackHealing, 'pollResult')
                .mockResolvedValue(pollResultResponse as any)
            vi.spyOn(aiSDK.BrowserstackHealing, 'logData')
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
            const caps = { browserName: 'chrome' }
            const mockAuthResult = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true,
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true,
            }

            const authenticateUserSpy = vi.spyOn(AiHandler, 'authenticateUser')
                .mockResolvedValue(mockAuthResult as any)
            const handleHealingInstrumentationSpy = vi.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = vi.spyOn(AiHandler, 'updateCaps')
                .mockResolvedValue({ ...caps, 'goog:chromeOptions': { extensions: ['mock-extension'] } })

            const mockExtension = 'mock-extension'
            vi.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ ...caps, 'goog:chromeOptions': { extensions: [mockExtension] } })

            const emptyObj = {} as any
            await AiHandler.setup(config, emptyObj, emptyObj, caps, false)

            expect(authenticateUserSpy).toHaveBeenCalledTimes(1)
            expect(handleHealingInstrumentationSpy).toHaveBeenCalledTimes(1)
            expect(updateCapsSpy).toHaveBeenCalledTimes(1)
        })

        it('should skip setup if accessKey is not present', async () => {
            config.key = ''
            const caps = { browserName: 'chrome' }

            const authenticateUserSpy = vi.spyOn(AiHandler, 'authenticateUser')
            const handleHealingInstrumentationSpy = vi.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = vi.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            vi.stubEnv('BROWSERSTACK_ACCESS_KEY', '')
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, false)
            expect(authenticateUserSpy).not.toHaveBeenCalled()
            expect(handleHealingInstrumentationSpy).not.toHaveBeenCalled()
            expect(updateCapsSpy).not.toHaveBeenCalled()
            expect(updatedCaps).toEqual(caps) // Expect caps to remain unchanged
        })

        it('should skip setup if userName is not present', async () => {
            config.user = ''
            const caps = { browserName: 'chrome' }

            const authenticateUserSpy = vi.spyOn(AiHandler, 'authenticateUser')
            const handleHealingInstrumentationSpy = vi.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = vi.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            vi.stubEnv('BROWSERSTACK_USERNAME', '')
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, false)
            expect(authenticateUserSpy).not.toHaveBeenCalled()
            expect(handleHealingInstrumentationSpy).not.toHaveBeenCalled()
            expect(updateCapsSpy).not.toHaveBeenCalled()
            expect(updatedCaps).toEqual(caps) // Expect caps to remain unchanged
        })

        it('should handle errors in setup', async () => {
            const caps = { browserName: 'chrome' }
            const authenticateUserSpy = vi.spyOn(AiHandler, 'authenticateUser')
                .mockRejectedValue(new Error('Authentication failed'))

            const warnSpy = vi.spyOn(bstackLogger.BStackLogger, 'warn')

            const emptyObj = {} as any
            const options = { selfHeal: true } as any
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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = vi.spyOn(AiHandler, 'installFirefoxExtension')

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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
        })

        it('should skip self-healing if authResult is empty', async () => {
            const caps = { browserName: 'chrome' } as Capabilities.RemoteCapability
            AiHandler['authResult'] = {} as any

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')

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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')
            const overwriteCommandSpy = vi.spyOn(browser, 'overwriteCommand')

            vi.spyOn(aiSDK.BrowserstackHealing, 'logData')
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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')
            const overwriteCommandSpy = vi.spyOn(browser, 'overwriteCommand')

            vi.spyOn(aiSDK.BrowserstackHealing, 'logData')
                .mockResolvedValue('logging-script')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(setTokenSpy).toHaveBeenCalledTimes(1)
            expect(setTokenSpy).toHaveBeenCalledWith(browser.sessionId, 'mock-session-token')
            expect(overwriteCommandSpy).toHaveBeenCalledTimes(1)
            expect(overwriteCommandSpy).toHaveBeenCalledWith('findElement', expect.any(Function))
        })

        it('should skip selfHeal for unsupported browser', async () => {
            const caps = { browserName: 'safari' } as Capabilities.RemoteCapability

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = vi.spyOn(AiHandler, 'installFirefoxExtension')
            const overwriteCommandSpy = vi.spyOn(browser, 'overwriteCommand')

            browser.capabilities = caps
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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken').mockImplementationOnce(() => {
                throw new Error('Some error occurred in setToken')
            })

            const warnSpy = vi.spyOn(bstackLogger.BStackLogger, 'warn')

            config.selfHeal = true
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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')

            browser.capabilities = caps
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

            const overwriteCommandSpy = vi.spyOn(browser, 'overwriteCommand')

            browser.capabilities = caps
            await AiHandler.selfHeal(config, caps, browser)

            expect(overwriteCommandSpy).not.toHaveBeenCalled()
        })
    })

    describe('setToken', () => {
        it('should call setToken with correct parameters', async () => {
            const setTokenSpy = vi.spyOn(aiSDK.BrowserstackHealing, 'setToken')
                .mockResolvedValue(undefined)

            await AiHandler.setToken('test-session-id', 'test-token')

            expect(setTokenSpy).toHaveBeenCalledWith('test-session-id', 'test-token', TCG_URL)
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
                key: '12345678901234567890',
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
                    overwriteCommand: vi.fn(),
                },
                myFirefoxBrowser: {
                    sessionId: 'firefox-session-id',
                    capabilities: { browserName: 'firefox' },
                    overwriteCommand: vi.fn(),
                    installAddOn: vi.fn()
                }
            } as any
        })

        it('should setup capabilities for multiremote session not running on BrowserStack', async () => {
            const mockExtension = 'mock-extension'

            const handleHealingInstrumentationSpy = vi.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = vi.spyOn(AiHandler, 'updateCaps')
                .mockResolvedValue({ 'goog:chromeOptions': { extensions: [mockExtension] } })

            vi.spyOn(aiSDK.BrowserstackHealing, 'initializeCapabilities')
                .mockReturnValue({ 'goog:chromeOptions': { extensions: [mockExtension] } })

            const emptyObj = {} as any
            AiHandler.handleMultiRemoteSetup(mockAuthResult, config, emptyObj, emptyObj, config.capabilities) as any
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

            const setTokenSpy = vi.spyOn(AiHandler, 'setToken')
            const installFirefoxExtensionSpy = vi.spyOn(AiHandler, 'installFirefoxExtension')
            const handleSelfHealSpy = vi.spyOn(AiHandler, 'handleSelfHeal')

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
            const authenticateUserSpy = vi.spyOn(AiHandler, 'authenticateUser')
                .mockResolvedValue(mockAuthResult as any)
            const handleHealingInstrumentationSpy = vi.spyOn(funnelInstrumentation, 'handleHealingInstrumentation')
            const updateCapsSpy = vi.spyOn(AiHandler, 'updateCaps')

            const emptyObj = {} as any
            vi.stubEnv('BROWSERSTACK_ACCESS_KEY', '')
            const authResult = {
                isAuthenticated: true,
                sessionToken: 'mock-session-token',
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as any
            AiHandler.handleMultiRemoteSetup(authResult, config, emptyObj, emptyObj, config.capabilities) as any
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

            const handleMultiRemoteSetupSpy = vi.spyOn(AiHandler, 'handleMultiRemoteSetup')
                .mockResolvedValue(caps)

            const emptyObj = {} as any
            const updatedCaps = await AiHandler.setup(config, emptyObj, emptyObj, caps, true)

            expect(handleMultiRemoteSetupSpy).toHaveBeenCalledTimes(1)
            expect(updatedCaps).toEqual(caps)

        })
    })
})
