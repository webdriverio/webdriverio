import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Mock TestFramework as a proper class that can be extended
vi.mock('../../../src/cli/frameworks/testFramework.js', () => {
    const MockTestFramework = class TestFramework {
        static registerObserver = vi.fn()
        static getTrackedInstance = vi.fn()
        static getState = vi.fn()
        static setState = vi.fn()
        static setTrackedInstance = vi.fn()

        constructor() {}

        getTestFrameworks() { return ['mocha'] }
        getTestFrameworksVersions() { return { mocha: '1.0.0' } }
        updateInstanceState() {}
        runHooks() {}
        trackEvent() {}
    }

    return {
        default: MockTestFramework
    }
})

vi.mock('../../../src/cli/frameworks/automationFramework.js', () => ({
    default: {
        registerObserver: vi.fn(),
        getTrackedInstance: vi.fn(),
        getDriver: vi.fn(),
        getState: vi.fn()
    }
}))

vi.mock('../../../src/scripts/accessibility-scripts.js', () => ({
    default: {
        commandsToWrap: [],
        performScan: 'mock-perform-scan-script',
        getResults: 'mock-get-results-script',
        getResultsSummary: 'mock-get-results-summary-script',
        saveTestResults: 'mock-save-test-results-script'
    }
}))

vi.mock('../../../src/util.js', () => ({
    validateCapsWithA11y: vi.fn().mockReturnValue(true),
    validateCapsWithAppA11y: vi.fn().mockReturnValue(true),
    validateCapsWithNonBstackA11y: vi.fn().mockReturnValue(true),
    shouldScanTestForAccessibility: vi.fn().mockReturnValue(true),
    getAppA11yResults: vi.fn().mockResolvedValue([]),
    getAppA11yResultsSummary: vi.fn().mockResolvedValue({}),
    _getParamsForAppAccessibility: vi.fn().mockReturnValue('{}'),
    formatString: vi.fn().mockReturnValue('formatted-script'),
    isBrowserstackSession: vi.fn().mockReturnValue(true)
}))

vi.mock('../../../src/cli/grpcClient.js', () => ({
    GrpcClient: {
        getInstance: vi.fn().mockReturnValue({
            fetchDriverExecuteParamsEvent: vi.fn().mockResolvedValue({
                success: true,
                accessibilityExecuteParams: Buffer.from('{}').toString('base64')
            })
        })
    }
}))

vi.mock('../../../src/cli/index.js', () => ({
    BrowserstackCLI: {
        getInstance: vi.fn().mockReturnValue({
            options: {
                accessibilityOptions: {
                    autoScanning: true
                }
            }
        })
    }
}))

import AccessibilityModule from '../../../src/cli/modules/accessibilityModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'
import { BrowserstackCLI } from '../../../src/cli/index.js'
import { shouldScanTestForAccessibility, validateCapsWithA11y } from '../../../src/util.js'

describe('AccessibilityModule', () => {
    let accessibilityModule: AccessibilityModule
    let mockAccessibilityConfig: any
    let mockBrowser: any
    let mockAutoInstance: any
    let mockTestInstance: any

    beforeEach(() => {
        vi.clearAllMocks()

        vi.mocked(BrowserstackCLI.getInstance).mockReturnValue({
            options: {
                accessibilityOptions: {
                    autoScanning: true
                }
            }
        } as any)

        mockAccessibilityConfig = {
            isAppAccessibility: false
        }

        mockBrowser = {
            executeAsync: vi.fn().mockResolvedValue([]),
            execute: vi.fn().mockResolvedValue({}),
            overwriteCommand: vi.fn()
        }

        mockAutoInstance = {
            getId: vi.fn().mockReturnValue(1)
        }

        mockTestInstance = {
            getContext: vi.fn().mockReturnValue({ getId: vi.fn().mockReturnValue(1) }),
            getData: vi.fn(),
            setData: vi.fn()
        }

        vi.mocked(AutomationFramework.getTrackedInstance).mockReturnValue(mockAutoInstance)
        vi.mocked(AutomationFramework.getDriver).mockReturnValue(mockBrowser)
        vi.mocked(AutomationFramework.getState).mockImplementation((instance, key) => {
            if (key === 'framework_session_id') {
                return 12345
            }
            if (key.includes('IS_BROWSERSTACK_HUB')) {
                return true
            }
            if (key.includes('CAPABILITIES')) {
                return { browserName: 'chrome' }
            }
            if (key.includes('INPUT_CAPABILITIES')) {
                return {}
            }
            return {}
        })

        vi.mocked(TestFramework.getTrackedInstance).mockReturnValue(mockTestInstance)

        accessibilityModule = new AccessibilityModule(mockAccessibilityConfig, false)
        accessibilityModule.config = { accessibilityOptions: {} }
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should register observers for both automation and test frameworks', () => {
            expect(AutomationFramework.registerObserver).toHaveBeenCalledWith(
                AutomationFrameworkState.CREATE,
                HookState.POST,
                expect.any(Function)
            )
            expect(TestFramework.registerObserver).toHaveBeenCalledWith(
                TestFrameworkState.TEST,
                HookState.PRE,
                expect.any(Function)
            )
            expect(TestFramework.registerObserver).toHaveBeenCalledWith(
                TestFrameworkState.TEST,
                HookState.POST,
                expect.any(Function)
            )
        })

        it('should initialize with correct properties', () => {
            expect(accessibilityModule.name).toBe('AccessibilityModule')
            expect(accessibilityModule.accessibility).toBe(true)
            expect(accessibilityModule.isAppAccessibility).toBe(false)
            expect(accessibilityModule.isNonBstackA11y).toBe(false)
            expect(accessibilityModule.accessibilityConfig).toBe(mockAccessibilityConfig)
            expect(accessibilityModule.accessibilityMap).toBeInstanceOf(Map)
            expect(accessibilityModule.LOG_DISABLED_SHOWN).toBeInstanceOf(Map)
        })

        it('should set isAppAccessibility from config', () => {
            const appConfig = { isAppAccessibility: true } as any
            const module = new AccessibilityModule(appConfig, false)
            expect(module.isAppAccessibility).toBe(true)
        })
    })

    describe('getModuleName', () => {
        it('should return the correct module name', () => {
            expect(accessibilityModule.getModuleName()).toBe('BaseModule') // AccessibilityModule doesn't override getModuleName
            expect(AccessibilityModule.MODULE_NAME).toBe('AccessibilityModule')
        })
    })

    describe('onBeforeExecute', () => {
        it('should patch browser methods when automation instance exists', async () => {
            vi.mocked(AutomationFramework.getState).mockImplementation((instance, key) => {
                if (key.includes('CAPABILITIES')) {
                    return { browserName: 'chrome' }
                }
                if (key.includes('INPUT_CAPABILITIES')) {
                    return {}
                }
                return 12345
            })

            await accessibilityModule.onBeforeExecute()

            expect(mockBrowser.getAccessibilityResultsSummary).toBeDefined()
            expect(mockBrowser.getAccessibilityResults).toBeDefined()
            expect(mockBrowser.performScan).toBeDefined()
            expect(mockBrowser.startA11yScanning).toBeDefined()
            expect(mockBrowser.stopA11yScanning).toBeDefined()
        })

        it('should return early when no automation instance found', async () => {
            vi.mocked(AutomationFramework.getTrackedInstance).mockReturnValue(null)

            await accessibilityModule.onBeforeExecute()

            expect(mockBrowser.getAccessibilityResultsSummary).toBeUndefined()
            expect(mockBrowser.getAccessibilityResults).toBeUndefined()
            expect(mockBrowser.performScan).toBeUndefined()
        })

        it('should return early when no browser instance found', async () => {
            vi.mocked(AutomationFramework.getDriver).mockReturnValue(null)

            await accessibilityModule.onBeforeExecute()

            expect(mockBrowser.getAccessibilityResultsSummary).toBeUndefined()
        })

        it('should show warning when startA11yScanning is called outside test', async () => {
            const loggerWarnSpy = vi.spyOn(accessibilityModule.logger, 'warn')
            // Enable accessibility for this test
            accessibilityModule.accessibility = true
            // Mock validation to return true so accessibility stays enabled
            vi.mocked(validateCapsWithA11y).mockReturnValue(true)

            await accessibilityModule.onBeforeExecute()

            await mockBrowser.startA11yScanning()

            expect(loggerWarnSpy).toHaveBeenCalledWith('Accessibility scanning cannot be started from outside the test')
        })

        it('should show warning when stopA11yScanning is called outside test', async () => {
            const loggerWarnSpy = vi.spyOn(accessibilityModule.logger, 'warn')
            // Enable accessibility for this test
            accessibilityModule.accessibility = true
            // Mock validation to return true so accessibility stays enabled
            vi.mocked(validateCapsWithA11y).mockReturnValue(true)

            await accessibilityModule.onBeforeExecute()

            await mockBrowser.stopA11yScanning()

            expect(loggerWarnSpy).toHaveBeenCalledWith('Accessibility scanning cannot be stopped from outside the test')
        })
    })

    describe('onBeforeTest', () => {
        beforeEach(() => {
            // Mock shouldScanTestForAccessibility to return true for proper test behavior
            vi.mocked(shouldScanTestForAccessibility).mockReturnValue(true)
        })

        it('should patch browser methods when automation instance exists', async () => {
            const mockArgs = {
                suiteTitle: 'Test Suite',
                test: { title: 'Test Case' }
            }

            await accessibilityModule.onBeforeTest(mockArgs)

            expect(mockBrowser.performScan).toBeDefined()
            expect(mockBrowser.startA11yScanning).toBeDefined()
            expect(mockBrowser.stopA11yScanning).toBeDefined()
        })

        it('should set up accessibility metadata for test', async () => {
            const mockArgs = {
                suiteTitle: 'Test Suite',
                test: { title: 'Test Case' }
            }

            await accessibilityModule.onBeforeTest(mockArgs)

            expect(TestFramework.setState).toHaveBeenCalled()
        })

        it('should handle missing test arguments gracefully', async () => {
            await accessibilityModule.onBeforeTest({})

            expect(TestFramework.setState).toHaveBeenCalled()
        })

        it('should enable accessibility scanning for test when conditions are met', async () => {
            // Enable accessibility and auto scanning for this test
            accessibilityModule.accessibility = true
            accessibilityModule.autoScanning = true
            // Set up config property that's expected by onBeforeTest
            accessibilityModule.config = { accessibilityOptions: {} }

            const mockArgs = {
                suiteTitle: 'Test Suite',
                test: { title: 'Test Case' }
            }

            // Ensure the mock returns true
            vi.mocked(shouldScanTestForAccessibility).mockReturnValue(true)

            await accessibilityModule.onBeforeTest(mockArgs)

            expect(accessibilityModule.accessibilityMap.get(12345)).toBe(true)
        })
    })

    describe('onAfterTest', () => {
        it('should handle missing test metadata gracefully', async () => {
            vi.mocked(mockTestInstance.getData).mockReturnValue(null)

            await accessibilityModule.onAfterTest()

            expect(mockBrowser.executeAsync).not.toHaveBeenCalled()
        })

        it('should return early when accessibility scan was not started', async () => {
            vi.mocked(mockTestInstance.getData).mockReturnValue({
                accessibilityScanStarted: false,
                scanTestForAccessibility: false
            })

            await accessibilityModule.onAfterTest()

            expect(mockBrowser.executeAsync).not.toHaveBeenCalled()
        })

        it('should process accessibility results when scan was started', async () => {
            const loggerInfoSpy = vi.spyOn(accessibilityModule.logger, 'info')

            // Mock the getDriverExecuteParams method to avoid async issues
            vi.spyOn(accessibilityModule as any, 'getDriverExecuteParams').mockResolvedValue({})
            vi.spyOn(accessibilityModule as any, 'sendTestStopEvent').mockResolvedValue(undefined)

            vi.mocked(mockTestInstance.getData).mockReturnValue({
                accessibilityScanStarted: true,
                scanTestForAccessibility: true
            })

            await accessibilityModule.onAfterTest()

            expect(loggerInfoSpy).toHaveBeenCalledWith('Automate test case execution has ended. Processing for accessibility testing is underway.')
            expect(loggerInfoSpy).toHaveBeenCalledWith('Accessibility testing for this test case has ended.')
        })
    })

    describe('performScanCli', () => {
        it('should return early when accessibility is disabled', async () => {
            accessibilityModule.accessibility = false

            const result = await (accessibilityModule as any).performScanCli(mockBrowser)

            expect(result).toBeUndefined()
            expect(mockBrowser.execute).not.toHaveBeenCalled()
            expect(mockBrowser.executeAsync).not.toHaveBeenCalled()
        })

        it('should call execute for app accessibility', async () => {
            accessibilityModule.accessibility = true
            accessibilityModule.isAppAccessibility = true
            mockBrowser.execute.mockResolvedValue({ success: true })

            const result = await (accessibilityModule as any).performScanCli(mockBrowser)

            expect(mockBrowser.execute).toHaveBeenCalled()
            expect(result).toEqual({ success: true })
        })

        it('should call executeAsync for web accessibility', async () => {
            accessibilityModule.accessibility = true
            accessibilityModule.isAppAccessibility = false
            mockBrowser.executeAsync.mockResolvedValue({ violations: [] })

            const result = await (accessibilityModule as any).performScanCli(mockBrowser)

            expect(mockBrowser.executeAsync).toHaveBeenCalled()
            expect(result).toEqual({ violations: [] })
        })

        it('should handle errors gracefully', async () => {
            accessibilityModule.accessibility = true
            accessibilityModule.isAppAccessibility = false
            mockBrowser.executeAsync.mockRejectedValue(new Error('Scan failed'))

            const result = await (accessibilityModule as any).performScanCli(mockBrowser)

            expect(result).toBeUndefined()
        })

        it('should pass command name to executeAsync for web accessibility', async () => {
            accessibilityModule.accessibility = true
            accessibilityModule.isAppAccessibility = false
            const commandName = 'click'
            mockBrowser.executeAsync.mockResolvedValue({})

            await (accessibilityModule as any).performScanCli(mockBrowser, commandName)

            expect(mockBrowser.executeAsync).toHaveBeenCalledWith(
                'mock-perform-scan-script',
                { method: commandName }
            )
        })
    })

    describe('getA11yResults', () => {
        it('should return undefined when accessibility is disabled', async () => {
            accessibilityModule.accessibility = false

            const result = await accessibilityModule.getA11yResults(mockBrowser)

            expect(result).toBeUndefined()
            expect(mockBrowser.executeAsync).not.toHaveBeenCalled()
        })

        it('should return accessibility results when accessibility is enabled', async () => {
            accessibilityModule.accessibility = true
            const mockResults = [
                { id: 'test-1', impact: 'serious', description: 'Test violation' },
                { id: 'test-2', impact: 'moderate', description: 'Another violation' }
            ]
            mockBrowser.executeAsync.mockResolvedValue(mockResults)

            const result = await accessibilityModule.getA11yResults(mockBrowser)

            expect(mockBrowser.executeAsync).toHaveBeenCalledWith('mock-perform-scan-script', { method: '' })
            expect(mockBrowser.executeAsync).toHaveBeenCalledWith('mock-get-results-script')
            expect(result).toEqual(mockResults)
        })

        it('should handle errors gracefully and return empty array', async () => {
            accessibilityModule.accessibility = true
            mockBrowser.executeAsync.mockRejectedValue(new Error('Script execution failed'))

            const result = await accessibilityModule.getA11yResults(mockBrowser)

            expect(result).toEqual([])
        })
    })

    describe('getA11yResultsSummary', () => {
        it('should return undefined when accessibility is disabled', async () => {
            accessibilityModule.accessibility = false

            const result = await accessibilityModule.getA11yResultsSummary(mockBrowser)

            expect(result).toBeUndefined()
            expect(mockBrowser.executeAsync).not.toHaveBeenCalled()
        })

        it('should return accessibility results summary when accessibility is enabled', async () => {
            accessibilityModule.accessibility = true
            const mockSummary = {
                totalViolations: 5,
                criticalViolations: 2,
                moderateViolations: 3,
                url: 'https://example.com'
            }
            mockBrowser.executeAsync.mockResolvedValue(mockSummary)

            const result = await accessibilityModule.getA11yResultsSummary(mockBrowser)

            expect(mockBrowser.executeAsync).toHaveBeenCalledWith('mock-perform-scan-script', { method: '' })
            expect(mockBrowser.executeAsync).toHaveBeenCalledWith('mock-get-results-summary-script')
            expect(result).toEqual(mockSummary)
        })

        it('should handle errors gracefully and return empty object', async () => {
            accessibilityModule.accessibility = true
            mockBrowser.executeAsync.mockRejectedValue(new Error('Script execution failed'))

            const result = await accessibilityModule.getA11yResultsSummary(mockBrowser)

            expect(result).toEqual({})
        })
    })
})