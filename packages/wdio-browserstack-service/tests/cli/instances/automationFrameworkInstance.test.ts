import { describe, it, expect, beforeEach, vi } from 'vitest'
import AutomationFrameworkInstance from '../../../src/cli/instances/automationFrameworkInstance.js'
import TrackedInstance from '../../../src/cli/instances/trackedInstance.js'
import TrackedContext from '../../../src/cli/instances/trackedContext.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'

// Mock crypto and worker_threads for TrackedInstance
vi.mock('node:crypto', () => ({
    default: {
        randomInt: vi.fn(() => 12345),
        createHash: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
                digest: vi.fn().mockReturnValue('mocked-sha256-hash')
            })
        })
    }
}))

vi.mock('node:worker_threads', () => ({
    threadId: 111
}))

describe('AutomationFrameworkInstance', () => {
    let automationFrameworkInstance: AutomationFrameworkInstance
    let mockContext: TrackedContext
    const mockFrameworkName = 'webdriverio'
    const mockFrameworkVersion = '8.0.0'
    const mockState = AutomationFrameworkState.NONE

    beforeEach(() => {
        vi.resetAllMocks()
        mockContext = new TrackedContext('automation-test-id', 111, 222, 'automation-type')
        automationFrameworkInstance = new AutomationFrameworkInstance(
            mockContext,
            mockFrameworkName,
            mockFrameworkVersion,
            AutomationFrameworkState.NONE
        )
    })

    describe('constructor', () => {
        it('should create AutomationFrameworkInstance extending TrackedInstance', () => {
            expect(automationFrameworkInstance).toBeInstanceOf(AutomationFrameworkInstance)
            expect(automationFrameworkInstance).toBeInstanceOf(TrackedInstance)
        })

        it('should initialize with correct context', () => {
            expect(automationFrameworkInstance.getContext()).toBe(mockContext)
        })

        it('should initialize frameworkName property', () => {
            expect(automationFrameworkInstance.frameworkName).toBe(mockFrameworkName)
        })

        it('should initialize frameworkVersion property', () => {
            expect(automationFrameworkInstance.frameworkVersion).toBe(mockFrameworkVersion)
        })

        it('should initialize state property', () => {
            expect(automationFrameworkInstance.state).toBe(mockState)
        })

        it('should inherit TrackedInstance functionality', () => {
            expect(automationFrameworkInstance.getAllData()).toBeInstanceOf(Map)
            automationFrameworkInstance.updateMultipleEntries({ 'test-name': 'example test' })
            expect(automationFrameworkInstance.getData('test-name')).toBe('example test')
        })
    })

    describe('getFrameworkName method', () => {
        it('should return framework name', () => {
            expect(automationFrameworkInstance.getFrameworkName()).toBe(mockFrameworkName)
        })

        it('should return updated value after modification', () => {
            const updatedName = 'playwright'
            automationFrameworkInstance.frameworkName = updatedName
            expect(automationFrameworkInstance.getFrameworkName()).toBe(updatedName)
        })
    })

    describe('getFrameworkVersion method', () => {
        it('should return framework version', () => {
            expect(automationFrameworkInstance.getFrameworkVersion()).toBe(mockFrameworkVersion)
        })

        it('should return updated value after modification', () => {
            const updatedVersion = '8.1.0'
            automationFrameworkInstance.frameworkVersion = updatedVersion
            expect(automationFrameworkInstance.getFrameworkVersion()).toBe(updatedVersion)
        })

        it('should handle different version formats', () => {
            const versions = ['1.0', '2.1.3', 'latest', 'beta-1.0.0']
            versions.forEach(version => {
                automationFrameworkInstance.frameworkVersion = version
                expect(automationFrameworkInstance.getFrameworkVersion()).toBe(version)
            })
        })
    })

    describe('getState method', () => {
        it('should return current state', () => {
            expect(automationFrameworkInstance.getState()).toBe(mockState)
        })

        it('should return updated value after modification', () => {
            const updatedState = AutomationFrameworkState.CREATE
            automationFrameworkInstance.state = updatedState
            expect(automationFrameworkInstance.getState()).toBe(updatedState)
        })
    })

    describe('setState method', () => {
        it('should set state', () => {
            const newState = AutomationFrameworkState.CREATE
            automationFrameworkInstance.setState(newState)
            expect(automationFrameworkInstance.state).toBe(newState)
            expect(automationFrameworkInstance.getState()).toBe(newState)
        })

        it('should overwrite existing state', () => {
            automationFrameworkInstance.setState(AutomationFrameworkState.CREATE)
            automationFrameworkInstance.setState(AutomationFrameworkState.EXECUTE)
            expect(automationFrameworkInstance.getState()).toBe(AutomationFrameworkState.EXECUTE)
        })
    })

    describe('multiple instances', () => {
        it('should create independent instances', () => {
            const context2 = new TrackedContext('automation-id-2', 333, 444, 'automation-type-2')
            const instance2 = new AutomationFrameworkInstance(
                context2,
                'cypress',
                '12.0.0',
                AutomationFrameworkState.NONE
            )

            // Verify initial values
            expect(automationFrameworkInstance.getFrameworkName()).toBe('webdriverio')
            expect(instance2.getFrameworkName()).toBe('cypress')

            // Modify first instance
            automationFrameworkInstance.setState(AutomationFrameworkState.CREATE)
            automationFrameworkInstance.frameworkVersion = '8.1.0'

            // Modify second instance
            instance2.setState(AutomationFrameworkState.EXECUTE)
            instance2.frameworkVersion = '12.1.0'

            // Verify independence
            expect(automationFrameworkInstance.getState()).toBe(AutomationFrameworkState.CREATE)
            expect(instance2.getState()).toBe(AutomationFrameworkState.EXECUTE)
            expect(automationFrameworkInstance.getFrameworkVersion()).toBe('8.1.0')
            expect(instance2.getFrameworkVersion()).toBe('12.1.0')
        })
    })
})