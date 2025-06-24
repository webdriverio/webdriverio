import type { Mock } from 'vitest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import WebdriverIOModule from '../../../src/cli/modules/webdriverIOModule.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { AutomationFrameworkConstants } from '../../../src/cli/frameworks/constants/automationFrameworkConstants.js'
import { GrpcClient } from '../../../src/cli/grpcClient.js'
import { isBrowserstackSession } from '../../../src/util.js'

// Mock all dependencies
vi.mock('../../../src/cli/frameworks/automationFramework.js', () => ({
    default: {
        registerObserver: vi.fn(),
        getTrackedInstance: vi.fn(),
        getState: vi.fn(),
        setState: vi.fn(),
        setDriver: vi.fn()
    }
}))

vi.mock('../../../src/cli/grpcClient.js', () => ({
    GrpcClient: {
        getInstance: vi.fn(() => ({
            driverInitEvent: vi.fn()
        }))
    }
}))

vi.mock('../../../src/util.js', () => ({
    isBrowserstackSession: vi.fn()
}))

vi.mock('../../../src/cli/cliLogger.js', () => ({
    BStackLogger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}))

describe('WebdriverIOModule', () => {
    let webdriverIOModule: WebdriverIOModule
    let mockGrpcClient: any
    let mockAutomationInstance: any
    let mockBrowser: any
    let registerObserverSpy: Mock

    beforeEach(() => {
        vi.clearAllMocks()

        mockGrpcClient = {
            driverInitEvent: vi.fn().mockResolvedValue({
                success: true,
                capabilities: Buffer.from(JSON.stringify({
                    browserName: 'chrome',
                    'bstack:options': { buildTag: 'test-build' }
                })),
                hubUrl: 'https://hub.browserstack.com'
            })
        }

        mockAutomationInstance = {
            getRef: vi.fn(() => 'auto-ref-123'),
            getAllData: vi.fn(() => new Map([
                ['sessionId', 'test-session-123'],
                ['capabilities', JSON.stringify({ browserName: 'chrome' })]
            ]))
        }

        mockBrowser = {
            sessionId: 'test-session-123',
            capabilities: {
                browserName: 'chrome',
                browserVersion: '91.0.4472.124',
                platformName: 'Windows 10'
            }
        }

        registerObserverSpy = vi.mocked(AutomationFramework.registerObserver).mockImplementation(() => {})
        vi.mocked(GrpcClient.getInstance).mockReturnValue(mockGrpcClient)
        vi.mocked(AutomationFramework.getTrackedInstance).mockReturnValue(mockAutomationInstance)
        vi.mocked(isBrowserstackSession).mockReturnValue(true)

        process.env.WDIO_WORKER_ID = '0-1'

        webdriverIOModule = new WebdriverIOModule()
    })

    afterEach(() => {
        vi.resetAllMocks()
        delete process.env.WDIO_WORKER_ID
    })

    describe('constructor', () => {
        it('should initialize WebdriverIOModule correctly', () => {
            expect(webdriverIOModule.name).toBe('WebdriverIOModule')
            expect(webdriverIOModule.browserName).toBeNull()
            expect(webdriverIOModule.browserVersion).toBeNull()
            expect(webdriverIOModule.platforms).toEqual([])
            expect(webdriverIOModule.testRunId).toBeNull()
        })

        it('should register observers for automation framework events', () => {
            registerObserverSpy.mockClear()
            new WebdriverIOModule()

            expect(AutomationFramework.registerObserver).toHaveBeenCalledWith(
                AutomationFrameworkState.CREATE,
                HookState.PRE,
                expect.any(Function)
            )
            expect(AutomationFramework.registerObserver).toHaveBeenCalledWith(
                AutomationFrameworkState.CREATE,
                HookState.POST,
                expect.any(Function)
            )
            expect(AutomationFramework.registerObserver).toHaveBeenCalledTimes(2)
        })

        it('should have correct module name', () => {
            expect(webdriverIOModule.getModuleName()).toBe('WebdriverIOModule')
            expect(WebdriverIOModule.MODULE_NAME).toBe('WebdriverIOModule')
        })
    })

    describe('onBeforeDriverCreate', () => {
        it('should handle before driver create event successfully', async () => {
            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'chrome',
                browserVersion: '91.0.4472.124'
            }

            const args = {
                instance: mockAutomationInstance,
                caps: mockCapabilities
            }

            const getBinDriverCapabilitiesSpy = vi.spyOn(webdriverIOModule, 'getBinDriverCapabilities').mockResolvedValue()

            await webdriverIOModule.onBeforeDriverCreate(args)

            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_INPUT_CAPABILITIES,
                mockCapabilities
            )
            expect(getBinDriverCapabilitiesSpy).toHaveBeenCalledWith(mockAutomationInstance, mockCapabilities)
        })

        it('should handle missing capabilities gracefully', async () => {
            const args = {
                instance: mockAutomationInstance,
                caps: null
            }

            await webdriverIOModule.onBeforeDriverCreate(args)

            expect(AutomationFramework.setState).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            const args = {
                instance: mockAutomationInstance,
                caps: { browserName: 'chrome' }
            }

            vi.spyOn(webdriverIOModule, 'getBinDriverCapabilities').mockRejectedValue(new Error('Test error'))

            await webdriverIOModule.onBeforeDriverCreate(args)

            expect(true).toBe(true) // Test passes if no error is thrown
        })
    })

    describe('onDriverCreated', () => {
        it('should handle driver created event successfully', async () => {
            const args = {
                instance: mockAutomationInstance,
                browser: mockBrowser,
                hubUrl: 'https://hub.browserstack.com'
            }

            await webdriverIOModule.onDriverCreated(args)

            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_HUB_URL,
                'https://hub.browserstack.com'
            )
            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID,
                'test-session-123'
            )
            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_CAPABILITIES,
                mockBrowser.capabilities
            )
            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB,
                true
            )
            expect(AutomationFramework.setDriver).toHaveBeenCalledWith(mockAutomationInstance, mockBrowser)
        })

        it('should handle missing instance or browser gracefully', async () => {
            const args = {
                instance: null,
                browser: mockBrowser
            }

            await webdriverIOModule.onDriverCreated(args)

            expect(AutomationFramework.setState).not.toHaveBeenCalled()
        })

        it('should handle browser without sessionId gracefully', async () => {
            const browserWithoutSession = {
                capabilities: mockBrowser.capabilities
            }

            const args = {
                instance: mockAutomationInstance,
                browser: browserWithoutSession,
                hubUrl: 'https://hub.browserstack.com'
            }

            await webdriverIOModule.onDriverCreated(args)

            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_HUB_URL,
                'https://hub.browserstack.com'
            )
        })

        it('should handle errors during driver creation gracefully', async () => {
            const args = {
                instance: mockAutomationInstance,
                browser: mockBrowser
            }

            vi.mocked(isBrowserstackSession).mockImplementation(() => {
                throw new Error('Test error')
            })

            await webdriverIOModule.onDriverCreated(args)

            expect(true).toBe(true) // Test passes if no error is thrown
        })
    })

    describe('getBinDriverCapabilities', () => {
        it('should get capabilities from gRPC client successfully', async () => {
            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'chrome',
                browserVersion: '91.0.4472.124'
            }

            await webdriverIOModule.getBinDriverCapabilities(mockAutomationInstance, mockCapabilities)

            expect(mockGrpcClient.driverInitEvent).toHaveBeenCalledWith({
                platformIndex: 0,
                ref: 'auto-ref-123',
                userInputParams: Buffer.from(JSON.stringify(mockCapabilities)),
                binSessionId: ''
            })

            expect(AutomationFramework.setState).toHaveBeenCalledWith(
                mockAutomationInstance,
                AutomationFrameworkConstants.KEY_CAPABILITIES,
                expect.objectContaining({
                    browserName: 'chrome'
                })
            )
        })

        it('should remove buildTag from bstack:options', async () => {
            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'chrome'
            }

            await webdriverIOModule.getBinDriverCapabilities(mockAutomationInstance, mockCapabilities)

            const setStateCall = vi.mocked(AutomationFramework.setState).mock.calls.find(
                call => call[1] === AutomationFrameworkConstants.KEY_CAPABILITIES
            )
            const capabilitiesArg = setStateCall?.[2] as any

            expect(capabilitiesArg['bstack:options']).toEqual({})
        })

        it('should handle capabilities with browserstack.buildTag', async () => {
            mockGrpcClient.driverInitEvent.mockResolvedValue({
                success: true,
                capabilities: Buffer.from(JSON.stringify({
                    browserName: 'chrome',
                    'browserstack.buildTag': 'test-build'
                })),
                hubUrl: 'https://hub.browserstack.com'
            })

            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'chrome'
            }

            await webdriverIOModule.getBinDriverCapabilities(mockAutomationInstance, mockCapabilities)

            const setStateCall = vi.mocked(AutomationFramework.setState).mock.calls.find(
                call => call[1] === AutomationFrameworkConstants.KEY_CAPABILITIES
            )
            const capabilitiesArg = setStateCall?.[2] as any

            expect(capabilitiesArg).not.toHaveProperty('browserstack.buildTag')
        })

        it('should handle WDIO_WORKER_ID environment variable', async () => {
            process.env.WDIO_WORKER_ID = '2-5'

            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'firefox'
            }

            await webdriverIOModule.getBinDriverCapabilities(mockAutomationInstance, mockCapabilities)

            expect(mockGrpcClient.driverInitEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    platformIndex: 2
                })
            )
        })

        it('should handle errors gracefully', async () => {
            mockGrpcClient.driverInitEvent.mockRejectedValue(new Error('gRPC error'))

            const mockCapabilities: WebdriverIO.Capabilities = {
                browserName: 'chrome'
            }

            await webdriverIOModule.getBinDriverCapabilities(mockAutomationInstance, mockCapabilities)

            expect(true).toBe(true) // Test passes if no error is thrown
        })
    })
})
