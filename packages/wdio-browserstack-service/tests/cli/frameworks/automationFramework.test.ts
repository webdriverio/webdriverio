import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import type AutomationFrameworkInstance from '../../../src/cli/instances/automationFrameworkInstance.js'
import type TrackedContext from '../../../src/cli/instances/trackedContext.js'
import { AutomationFrameworkConstants } from '../../../src/cli/frameworks/constants/automationFrameworkConstants.js'

// Mock dependencies
vi.mock('../../../src/bstackLogger.js')
vi.mock('../../../src/cli/eventDispatcher.js', () => ({
    eventDispatcher: {
        notifyObserver: vi.fn(),
        registerObserver: vi.fn()
    }
}))
vi.mock('../../../src/cli/cliUtils.js', () => ({
    CLIUtils: {
        getHookRegistryKey: vi.fn(() => 'test-hook-key'),
        getCurrentInstanceName: vi.fn(() => 'test-instance')
    }
}))
vi.mock('../../../src/cli/instances/trackedInstance.js', () => ({
    default: {
        createContext: vi.fn((name: string) => ({ getId: () => name }))
    }
}))

describe('AutomationFramework', () => {
    let automationFramework: AutomationFramework
    let mockInstance: AutomationFrameworkInstance
    let mockContext: TrackedContext

    beforeEach(() => {
        vi.resetAllMocks()
        automationFramework = new AutomationFramework('testFramework', '1.0.0')

        mockContext = {
            getId: vi.fn(() => 'test-context-id')
        } as any

        mockInstance = {
            getAllData: vi.fn(() => new Map()),
            getFrameworkName: vi.fn(() => 'testFramework'),
            getFrameworkVersion: vi.fn(() => '1.0.0')
        } as any

        AutomationFramework.instances.clear()
    })

    afterEach(() => {
        vi.resetAllMocks()
        AutomationFramework.instances.clear()
    })

    describe('constructor and getters', () => {
        it('should create an instance with framework name and version', () => {
            expect(automationFramework.getAutomationFrameworkName()).toBe('testFramework')
            expect(automationFramework.getAutomationFrameworkVersion()).toBe('1.0.0')
        })
    })

    describe('instance management', () => {
        it('should set and get tracked instance', () => {
            AutomationFramework.setTrackedInstance(mockContext, mockInstance)
            expect(AutomationFramework.instances.get('test-context-id')).toBe(mockInstance)
        })
    })

    describe('state management', () => {
        it('should set and get state', () => {
            const mockDataMap = new Map()
            mockInstance.getAllData = vi.fn(() => mockDataMap)

            AutomationFramework.setState(mockInstance, 'testKey', 'testValue')
            const result = AutomationFramework.getState(mockInstance, 'testKey')

            expect(result).toBe('testValue')
        })
    })

    describe('isAutomationSession', () => {
        it('should return true when KEY_IS_BROWSERSTACK_HUB is truthy', () => {
            const mockDataMap = new Map()
            mockDataMap.set(AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB, true)
            mockInstance.getAllData = vi.fn(() => mockDataMap)

            expect(AutomationFramework.isAutomationSession(mockInstance)).toBe(true)
        })

        it('should return false when KEY_IS_BROWSERSTACK_HUB is falsy', () => {
            const mockDataMap = new Map()
            mockDataMap.set(AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB, false)
            mockInstance.getAllData = vi.fn(() => mockDataMap)

            expect(AutomationFramework.isAutomationSession(mockInstance)).toBe(false)
        })
    })

    describe('driver management', () => {
        it('should set and get driver for automation session', () => {
            const mockDataMap = new Map()
            const mockDriver = { sessionId: 'test-session' }
            mockDataMap.set(AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB, true)
            mockInstance.getAllData = vi.fn(() => mockDataMap)

            AutomationFramework.setDriver(mockInstance, mockDriver)
            const result = AutomationFramework.getDriver(mockInstance)

            expect(result).toBe(mockDriver)
        })

        it('should set and get driver for non-automation session', () => {
            const mockDataMap = new Map()
            const mockDriver = { sessionId: 'test-session' }
            mockDataMap.set(AutomationFrameworkConstants.KEY_IS_BROWSERSTACK_HUB, false)
            mockInstance.getAllData = vi.fn(() => mockDataMap)

            AutomationFramework.setDriver(mockInstance, mockDriver)
            const result = AutomationFramework.getDriver(mockInstance)

            expect(result).toBe(mockDriver)
        })
    })

    describe('static properties', () => {
        it('should have correct static key constants', () => {
            expect(AutomationFramework.KEY_AUTOMATION_SESSIONS).toBe('automation_sessions')
            expect(AutomationFramework.KEY_NON_BROWSERSTACK_AUTOMATION_SESSIONS).toBe('non_browserstack_automation_sessions')
            expect(AutomationFramework.instances).toBeInstanceOf(Map)
        })
    })
})
