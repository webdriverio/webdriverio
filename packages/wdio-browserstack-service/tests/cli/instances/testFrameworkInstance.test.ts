import { describe, it, expect, beforeEach, vi } from 'vitest'
import TestFrameworkInstance from '../../../src/cli/instances/testFrameworkInstance.js'
import TrackedInstance from '../../../src/cli/instances/trackedInstance.js'
import TrackedContext from '../../../src/cli/instances/trackedContext.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'

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

describe('TestFrameworkInstance', () => {
    let testFrameworkInstance: TestFrameworkInstance
    let mockContext: TrackedContext
    const mockTestFrameworks = ['mocha', 'jasmine']
    const mockTestFrameworkVersions = { 'mocha': '8.0.0', 'jasmine': '3.6.0' }

    beforeEach(() => {
        vi.resetAllMocks()
        mockContext = new TrackedContext('test-id', 111, 222, 'test-type')
        testFrameworkInstance = new TestFrameworkInstance(
            mockContext,
            mockTestFrameworks,
            mockTestFrameworkVersions,
            TestFrameworkState.NONE,
            HookState.NONE
        )
    })

    describe('constructor', () => {
        it('should create TestFrameworkInstance with correct parameters', () => {
            expect(testFrameworkInstance).toBeInstanceOf(TestFrameworkInstance)
            expect(testFrameworkInstance).toBeInstanceOf(TrackedInstance)
        })

        it('should initialize with correct test frameworks', () => {
            expect(testFrameworkInstance.testFrameworks).toEqual(mockTestFrameworks)
            expect(testFrameworkInstance.testFrameworks).toHaveLength(2)
        })

        it('should initialize with correct test framework versions', () => {
            expect(testFrameworkInstance.testFrameworksVersions).toEqual(mockTestFrameworkVersions)
        })

        it('should initialize with provided states', () => {
            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.NONE)
            expect(testFrameworkInstance.getCurrentHookState()).toBe(HookState.NONE)
            expect(testFrameworkInstance.getLastTestState()).toBe(TestFrameworkState.NONE)
            expect(testFrameworkInstance.getLastHookState()).toBe(HookState.NONE)
        })

        it('should set createdAt timestamp', () => {
            expect(testFrameworkInstance.getCreatedAt()).toBeDefined()
            expect(typeof testFrameworkInstance.getCreatedAt()).toBe('string')
        })

        it('should inherit TrackedInstance functionality', () => {
            expect(testFrameworkInstance.getContext()).toBe(mockContext)
            expect(testFrameworkInstance.getAllData()).toBeInstanceOf(Map)
            testFrameworkInstance.updateMultipleEntries({ 'test-name': 'example test' })
            expect(testFrameworkInstance.getData('test-name')).toBe('example test')
        })
    })

    describe('constructor with different states', () => {
        it('should initialize with custom states', () => {
            const customInstance = new TestFrameworkInstance(
                mockContext,
                mockTestFrameworks,
                mockTestFrameworkVersions,
                TestFrameworkState.TEST,
                HookState.PRE
            )

            expect(customInstance.getCurrentTestState()).toBe(TestFrameworkState.TEST)
            expect(customInstance.getCurrentHookState()).toBe(HookState.PRE)
            expect(customInstance.getLastTestState()).toBe(TestFrameworkState.NONE)
            expect(customInstance.getLastHookState()).toBe(HookState.NONE)
        })
    })

    describe('getCurrentTestState', () => {
        it('should return current test state', () => {
            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.NONE)
        })
    })

    describe('getCurrentHookState', () => {
        it('should return current hook state', () => {
            expect(testFrameworkInstance.getCurrentHookState()).toBe(HookState.NONE)
        })
    })

    describe('getLastTestState', () => {
        it('should return last test state', () => {
            expect(testFrameworkInstance.getLastTestState()).toBe(TestFrameworkState.NONE)
        })
    })

    describe('getLastHookState', () => {
        it('should return last hook state', () => {
            expect(testFrameworkInstance.getLastHookState()).toBe(HookState.NONE)
        })
    })

    describe('setCurrentTestState', () => {
        it('should set current test state', () => {
            testFrameworkInstance.setCurrentTestState(TestFrameworkState.TEST)
            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.TEST)
        })

        it('should handle different test framework states', () => {
            const states = [
                TestFrameworkState.NONE,
                TestFrameworkState.INIT_TEST,
                TestFrameworkState.TEST,
                TestFrameworkState.LOG,
                TestFrameworkState.LOG_REPORT
            ]

            states.forEach(state => {
                testFrameworkInstance.setCurrentTestState(state)
                expect(testFrameworkInstance.getCurrentTestState()).toBe(state)
            })
        })
    })

    describe('setCurrentHookState', () => {
        it('should set current hook state', () => {
            testFrameworkInstance.setCurrentHookState(HookState.PRE)
            expect(testFrameworkInstance.getCurrentHookState()).toBe(HookState.PRE)
        })

        it('should handle different hook states', () => {
            const states = [HookState.NONE, HookState.PRE, HookState.POST]

            states.forEach(state => {
                testFrameworkInstance.setCurrentHookState(state)
                expect(testFrameworkInstance.getCurrentHookState()).toBe(state)
            })
        })
    })

    describe('setLastTestState', () => {
        it('should set last test state', () => {
            testFrameworkInstance.setLastTestState(TestFrameworkState.TEST)
            expect(testFrameworkInstance.getLastTestState()).toBe(TestFrameworkState.TEST)
        })
    })

    describe('setLastHookState', () => {
        it('should set last hook state', () => {
            testFrameworkInstance.setLastHookState(HookState.POST)
            expect(testFrameworkInstance.getLastHookState()).toBe(HookState.POST)
        })
    })

    describe('getCreatedAt', () => {
        it('should return valid createdAt timestamp', () => {
            const createdAt = testFrameworkInstance.getCreatedAt()
            expect(typeof createdAt).toBe('string')
            expect(() => new Date(createdAt)).not.toThrow()
        })
    })

    describe('state workflow', () => {
        it('should handle complete test workflow', () => {
            // Initial state
            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.NONE)
            expect(testFrameworkInstance.getCurrentHookState()).toBe(HookState.NONE)

            // should save current state as last, and then update current state
            testFrameworkInstance.setCurrentTestState(TestFrameworkState.TEST)
            testFrameworkInstance.setCurrentHookState(HookState.PRE)

            expect(testFrameworkInstance.getLastTestState()).toBe(TestFrameworkState.NONE)
            expect(testFrameworkInstance.getLastHookState()).toBe(HookState.NONE)
            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.TEST)
            expect(testFrameworkInstance.getCurrentHookState()).toBe(HookState.PRE)
        })
    })

    describe('multiple instances', () => {
        it('should create independent instances', () => {
            const context2 = new TrackedContext('test-id-2', 222, 333, 'test-type-2')
            const instance2 = new TestFrameworkInstance(
                context2,
                ['jest'],
                { 'jest': '27.0.0' },
                TestFrameworkState.TEST,
                HookState.PRE
            )

            expect(testFrameworkInstance.getCurrentTestState()).toBe(TestFrameworkState.NONE)
            expect(instance2.getCurrentTestState()).toBe(TestFrameworkState.TEST)
            expect(testFrameworkInstance.testFrameworks).toEqual(['mocha', 'jasmine'])
            expect(instance2.testFrameworks).toEqual(['jest'])
        })

        it('should share the same createdAt timestamp due to module-level const', () => {
            const context2 = new TrackedContext('test-id-2', 222, 333, 'test-type-2')
            const instance2 = new TestFrameworkInstance(
                context2,
                ['jest'],
                { 'jest': '27.0.0' },
                TestFrameworkState.TEST,
                HookState.PRE
            )

            // Both instances should have the same createdAt because of module-level const now = new Date()
            expect(testFrameworkInstance.getCreatedAt()).toBe(instance2.getCreatedAt())
        })
    })
})