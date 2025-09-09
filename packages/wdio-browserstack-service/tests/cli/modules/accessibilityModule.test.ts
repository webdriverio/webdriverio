import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/cli/frameworks/testFramework.js', () => ({
    default: {
        registerObserver: vi.fn(),
        getTrackedInstance: vi.fn(),
        getState: vi.fn(),
        setState: vi.fn()
    }
}))

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
    shouldScanTestForAccessibility: vi.fn().mockReturnValue(true),
    getAppA11yResults: vi.fn().mockResolvedValue([]),
    getAppA11yResultsSummary: vi.fn().mockResolvedValue({}),
    _getParamsForAppAccessibility: vi.fn().mockReturnValue('{}'),
    formatString: vi.fn().mockReturnValue('formatted-script')
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

import AccessibilityModule from '../../../src/cli/modules/accessibilityModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'

describe('AccessibilityModule', () => {
    let accessibilityModule: AccessibilityModule
    let mockAccessibilityConfig: any
    let mockBrowser: any
    let mockAutoInstance: any
    let mockTestInstance: any

    beforeEach(() => {
        vi.clearAllMocks()

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
            if (key.includes('SESSION_ID')) {
                return 12345
            }
            return {}
        })

        vi.mocked(TestFramework.getTrackedInstance).mockReturnValue(mockTestInstance)

        accessibilityModule = new AccessibilityModule(mockAccessibilityConfig)

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
            expect(accessibilityModule.accessibilityConfig).toBe(mockAccessibilityConfig)
            expect(accessibilityModule.accessibilityMap).toBeInstanceOf(Map)
            expect(accessibilityModule.LOG_DISABLED_SHOWN).toBeInstanceOf(Map)
        })

        it('should set isAppAccessibility from config', () => {
            const appConfig = { isAppAccessibility: true }
            const module = new AccessibilityModule(appConfig)
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
    })

    describe('onBeforeTest', () => {
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
        it('should return empty array when accessibility is disabled', async () => {
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
