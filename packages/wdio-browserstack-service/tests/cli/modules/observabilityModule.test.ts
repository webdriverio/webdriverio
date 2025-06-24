import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/cli/frameworks/automationFramework.js', () => ({
    default: {
        registerObserver: vi.fn()
    }
}))

vi.mock('../../../src/instrumentation/performance/performance-tester.js', () => ({
    default: {
        start: vi.fn(),
        end: vi.fn()
    }
}))

vi.mock('../../../src/util.js', () => ({
    performO11ySync: vi.fn()
}))

import ObservabilityModule from '../../../src/cli/modules/observabilityModule.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import PerformanceTester from '../../../src/instrumentation/performance/performance-tester.js'
import { performO11ySync } from '../../../src/util.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'

describe('ObservabilityModule', () => {
    let observabilityModule: ObservabilityModule
    let mockObservabilityConfig: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockObservabilityConfig = {
            enabled: true
        }
        observabilityModule = new ObservabilityModule(mockObservabilityConfig)
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should register observer for automation framework', () => {
            expect(AutomationFramework.registerObserver).toHaveBeenCalledTimes(1)
            expect(AutomationFramework.registerObserver).toHaveBeenCalledWith(
                AutomationFrameworkState.CREATE,
                HookState.POST,
                expect.any(Function)
            )
        })

        it('should initialize with correct properties', () => {
            expect(observabilityModule.name).toBe('ObservabilityModule')
            expect(observabilityModule.observabilityConfig).toBe(mockObservabilityConfig)
        })
    })

    describe('getModuleName', () => {
        it('should return the correct module name', () => {
            expect(observabilityModule.getModuleName()).toBe('ObservabilityModule')
            expect(ObservabilityModule.MODULE_NAME).toBe('ObservabilityModule')
        })
    })

    describe('onBeforeTest', () => {
        it('should perform observability sync when browser is defined', async () => {
            const mockBrowser = {
                sessionId: 'test-session-id'
            } as any

            await observabilityModule.onBeforeTest({ browser: mockBrowser })

            expect(PerformanceTester.start).toHaveBeenCalledWith(expect.any(String))
            expect(performO11ySync).toHaveBeenCalledWith(mockBrowser)
            expect(PerformanceTester.end).toHaveBeenCalledWith(expect.any(String))
        })

        it('should log error when browser is not defined', async () => {
            await observabilityModule.onBeforeTest({})

            expect(PerformanceTester.start).not.toHaveBeenCalled()
            expect(performO11ySync).not.toHaveBeenCalled()
            expect(PerformanceTester.end).not.toHaveBeenCalled()
        })

        it('should handle null browser gracefully', async () => {
            await observabilityModule.onBeforeTest({ browser: null })

            expect(PerformanceTester.start).not.toHaveBeenCalled()
            expect(performO11ySync).not.toHaveBeenCalled()
            expect(PerformanceTester.end).not.toHaveBeenCalled()
        })

        it('should handle undefined browser gracefully', async () => {
            await observabilityModule.onBeforeTest({ browser: undefined })

            expect(PerformanceTester.start).not.toHaveBeenCalled()
            expect(performO11ySync).not.toHaveBeenCalled()
            expect(PerformanceTester.end).not.toHaveBeenCalled()
        })
    })
})
