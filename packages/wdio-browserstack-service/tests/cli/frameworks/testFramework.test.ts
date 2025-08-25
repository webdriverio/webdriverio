import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'

// Mock dependencies
vi.mock('../../../src/bstackLogger.js')
vi.mock('../../../src/cli/cliLogger.js')
vi.mock('../../../src/cli/eventDispatcher.js', () => ({
    eventDispatcher: {
        notifyObserver: vi.fn(),
        registerObserver: vi.fn()
    }
}))

// Mock CLIUtils
vi.mock('../../../src/cli/cliUtils.js', () => ({
    CLIUtils: {
        getCurrentInstanceName: vi.fn(() => 'mock-instance'),
        getHookRegistryKey: vi.fn((state, hook) => `${state}-${hook}`)
    }
}))

// Mock TrackedInstance
vi.mock('../../../src/cli/instances/trackedInstance.js', () => ({
    default: {
        createContext: vi.fn().mockReturnValue({
            getId: () => 'mock-context-id'
        })
    }
}))

describe('TestFramework', () => {
    let framework: TestFramework
    const mockTestFrameworks = ['mocha', 'jasmine']
    const mockVersions = { mocha: '10.0.0', jasmine: '4.0.0' }
    const mockBinSessionId = 'test-session-id'

    beforeEach(() => {
        vi.clearAllMocks()
        // Clear static instances before each test
        TestFramework.instances.clear()
        framework = new TestFramework(mockTestFrameworks, mockVersions, mockBinSessionId)
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with test frameworks, versions, and session ID', () => {
            expect(framework).toBeInstanceOf(TestFramework)
            expect(framework.getTestFrameworks()).toEqual(mockTestFrameworks)
            expect(framework.getTestFrameworksVersions()).toEqual(mockVersions)
            expect(framework.binSessionId).toBe(mockBinSessionId)
        })
    })

    describe('getInstances', () => {
        it('should return the static instances map', () => {
            const instances = framework.getInstances()
            expect(instances).toBe(TestFramework.instances)
            expect(instances).toBeInstanceOf(Map)
        })
    })

    describe('setInstance', () => {
        it('should set instance in the static instances map', () => {
            const mockContext = { getId: 'test-id' }
            const mockInstance = { test: 'instance' }

            framework.setInstance(mockContext as any, mockInstance as any)

            expect(TestFramework.instances.get('test-id')).toBe(mockInstance)
        })
    })

    describe('static methods', () => {
        describe('setTrackedInstance', () => {
            it('should set tracked instance in instances map', () => {
                const mockContext = { getId: () => 'test-context-id' }
                const mockInstance = { test: 'instance' }

                TestFramework.setTrackedInstance(mockContext as any, mockInstance as any)

                expect(TestFramework.instances.get('test-context-id')).toBe(mockInstance)
            })
        })

        describe('getState', () => {
            it('should get state from instance data', () => {
                const mockData = new Map([['testKey', 'testValue']])
                const mockInstance = {
                    getAllData: vi.fn(() => mockData)
                }

                const result = TestFramework.getState(mockInstance as any, 'testKey')

                expect(result).toBe('testValue')
                expect(mockInstance.getAllData).toHaveBeenCalled()
            })
        })

        describe('hasState', () => {
            it('should check if instance has data for key', () => {
                const mockInstance = {
                    hasData: vi.fn(() => true)
                }

                const result = TestFramework.hasState(mockInstance as any, 'testKey')

                expect(result).toBe(true)
                expect(mockInstance.hasData).toHaveBeenCalledWith('testKey')
            })
        })

        describe('setState', () => {
            it('should set state in instance data', () => {
                const mockData = new Map()
                const mockInstance = {
                    getAllData: vi.fn(() => mockData)
                }

                TestFramework.setState(mockInstance as any, 'testKey', 'testValue')

                expect(mockData.get('testKey')).toBe('testValue')
                expect(mockInstance.getAllData).toHaveBeenCalled()
            })
        })

        describe('registerObserver', () => {
            it('should register observer with event dispatcher', async () => {
                const mockCallback = vi.fn()
                const mockState = 'TEST_STATE'
                const mockHook = 'PRE_HOOK'

                const { eventDispatcher } = await import('../../../src/cli/eventDispatcher.js')
                const { CLIUtils } = await import('../../../src/cli/cliUtils.js')

                // Ensure CLIUtils.getHookRegistryKey returns the expected value
                vi.mocked(CLIUtils.getHookRegistryKey).mockReturnValue('TEST_STATE-PRE_HOOK')

                TestFramework.registerObserver(mockState as any, mockHook as any, mockCallback)

                expect(eventDispatcher.registerObserver).toHaveBeenCalledWith('TEST_STATE-PRE_HOOK', mockCallback)
            })
        })
    })

    describe('trackEvent', () => {
        it('should log event tracking information', () => {
            const mockState = 'TEST_STATE'
            const mockHook = 'PRE_HOOK'
            const mockArgs = { test: 'args' }

            // Should not throw and complete successfully
            expect(() => {
                framework.trackEvent(mockState as any, mockHook as any, mockArgs)
            }).not.toThrow()
        })
    })

    describe('runHooks', () => {
        it('should notify event dispatcher with hook registry key', async () => {
            const mockInstance = { test: 'instance' }
            const mockState = 'TEST_STATE'
            const mockHook = 'PRE_HOOK'
            const mockArgs = { test: 'args' }

            const { eventDispatcher } = await import('../../../src/cli/eventDispatcher.js')
            const { CLIUtils } = await import('../../../src/cli/cliUtils.js')

            // Ensure CLIUtils.getHookRegistryKey returns the expected value
            vi.mocked(CLIUtils.getHookRegistryKey).mockReturnValue('TEST_STATE-PRE_HOOK')

            await framework.runHooks(mockInstance as any, mockState as any, mockHook as any, mockArgs)

            expect(eventDispatcher.notifyObserver).toHaveBeenCalledWith('TEST_STATE-PRE_HOOK', mockArgs)
        })
    })

    describe('updateInstanceState', () => {
        it('should update instance state correctly', () => {
            const mockInstance = {
                getCurrentTestState: vi.fn(() => 'CURRENT_TEST'),
                getCurrentHookState: vi.fn(() => 'CURRENT_HOOK'),
                setLastTestState: vi.fn(),
                setLastHookState: vi.fn(),
                setCurrentTestState: vi.fn(),
                setCurrentHookState: vi.fn()
            }
            const newTestState = 'NEW_TEST_STATE'
            const newHookState = 'NEW_HOOK_STATE'

            framework.updateInstanceState(mockInstance as any, newTestState as any, newHookState as any)

            expect(mockInstance.setLastTestState).toHaveBeenCalledWith('CURRENT_TEST')
            expect(mockInstance.setLastHookState).toHaveBeenCalledWith('CURRENT_HOOK')
            expect(mockInstance.setCurrentTestState).toHaveBeenCalledWith(newTestState)
            expect(mockInstance.setCurrentHookState).toHaveBeenCalledWith(newHookState)
        })
    })
})
