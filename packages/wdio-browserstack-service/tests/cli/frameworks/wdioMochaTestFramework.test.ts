import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import WdioMochaTestFramework from '../../../src/cli/frameworks/wdioMochaTestFramework.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'

// Mock dependencies
vi.mock('../../../src/bstackLogger.js')
vi.mock('../../../src/cli/cliLogger.js')
vi.mock('../../../src/util.js')
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid')
}))

// Mock TestFramework with minimal implementation
vi.mock('../../../src/cli/frameworks/testFramework.js', () => {
    const mockGetTrackedInstance = vi.fn()
    const mockSetTrackedInstance = vi.fn()
    const mockSuperTrackEvent = vi.fn()
    const mockGetState = vi.fn()
    const mockRunHooks = vi.fn()

    class MockTestFramework {
        #testFrameworks: string[]
        #testFrameworkVersions: Record<string, string>
        #binSessionId: string
        static getTrackedInstance = mockGetTrackedInstance
        static setTrackedInstance = mockSetTrackedInstance
        static getState = mockGetState

        constructor(testFrameworks: string[], testFrameworkVersions: Record<string, string>, binSessionId: string) {
            this.#testFrameworks = testFrameworks
            this.#testFrameworkVersions = testFrameworkVersions
            this.#binSessionId = binSessionId
        }

        getTestFrameworks() {
            return this.#testFrameworks
        }

        getTestFrameworksVersions() {
            return this.#testFrameworkVersions
        }

        trackEvent = mockSuperTrackEvent
        runHooks = mockRunHooks
        updateInstanceState = vi.fn()
    }

    return {
        default: MockTestFramework
    }
})

// Mock CLIUtils
vi.mock('../../../src/cli/cliUtils.js', () => ({
    CLIUtils: {
        matchHookRegex: vi.fn(() => false),
        getCurrentInstanceName: vi.fn(() => 'mock-instance')
    }
}))

// Mock TrackedInstance
vi.mock('../../../src/cli/instances/trackedInstance.js', () => ({
    default: {
        createContext: vi.fn(() => ({
            getId: vi.fn(() => 'mock-context-id')
        }))
    }
}))

// Mock TestFrameworkInstance
vi.mock('../../../src/cli/instances/testFrameworkInstance.js', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            updateMultipleEntries: vi.fn(),
            getAllData: vi.fn(() => new Map()),
            getCurrentTestState: vi.fn(() => TestFrameworkState.TEST)
        }))
    }
})

describe('WdioMochaTestFramework', () => {
    let framework: WdioMochaTestFramework
    const mockTestFrameworks = ['mocha']
    const mockVersions = { mocha: '10.0.0' }
    const mockBinSessionId = 'test-session-id'

    beforeEach(() => {
        vi.clearAllMocks()
        framework = new WdioMochaTestFramework(mockTestFrameworks, mockVersions, mockBinSessionId)
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with test frameworks, versions, and session ID', () => {
            expect(framework).toBeInstanceOf(WdioMochaTestFramework)
            expect(framework.getTestFrameworks()).toEqual(mockTestFrameworks)
            expect(framework.getTestFrameworksVersions()).toEqual(mockVersions)
        })
    })

    describe('resolveInstance', () => {
        it('should call trackWdioMochaInstance for INIT_TEST state', () => {
            const trackSpy = vi.spyOn(framework, 'trackWdioMochaInstance').mockImplementation(() => {})

            framework.resolveInstance(TestFrameworkState.INIT_TEST, HookState.PRE, {})

            expect(trackSpy).toHaveBeenCalledWith(TestFrameworkState.INIT_TEST, {})
        })

        it('should call trackWdioMochaInstance for NONE state', () => {
            const trackSpy = vi.spyOn(framework, 'trackWdioMochaInstance').mockImplementation(() => {})

            framework.resolveInstance(TestFrameworkState.NONE, HookState.PRE, {})

            expect(trackSpy).toHaveBeenCalledWith(TestFrameworkState.NONE, {})
        })

        it('should not call trackWdioMochaInstance for other states', () => {
            const trackSpy = vi.spyOn(framework, 'trackWdioMochaInstance').mockImplementation(() => {})

            framework.resolveInstance(TestFrameworkState.TEST, HookState.PRE, {})

            expect(trackSpy).not.toHaveBeenCalled()
        })
    })

    describe('static methods', () => {
        it('should have KEY_HOOK_LAST_STARTED constant', () => {
            expect(WdioMochaTestFramework.KEY_HOOK_LAST_STARTED).toBe('test_hook_last_started')
        })

        it('should have KEY_HOOK_LAST_FINISHED constant', () => {
            expect(WdioMochaTestFramework.KEY_HOOK_LAST_FINISHED).toBe('test_hook_last_finished')
        })
    })

    describe('getTestData', () => {
        it('should return test data object with basic properties', async () => {
            const mockInstance = {
                updateMultipleEntries: vi.fn(),
                getAllData: vi.fn(() => new Map()),
                getCurrentTestState: vi.fn(() => TestFrameworkState.TEST)
            }

            const mockTest = {
                title: 'test title',
                file: '/path/to/test.js',
                body: 'test body'
            }

            // Mock the dependencies
            const TestFramework = await import('../../../src/cli/frameworks/testFramework.js')
            vi.mocked(TestFramework.default.getState).mockReturnValue('mocha')

            const result = await framework.getTestData(mockInstance as any, mockTest as any)

            expect(result).toHaveProperty('test_name', 'test title')
            expect(result).toHaveProperty('test_code', 'test body')
        })
    })

    describe('loadTestResult', () => {
        it('should update instance with passed result', () => {
            const mockInstance = {
                updateMultipleEntries: vi.fn()
            }

            const mockResult = {
                passed: true,
                error: null
            }

            framework.loadTestResult(mockInstance as any, { result: mockResult })

            expect(mockInstance.updateMultipleEntries).toHaveBeenCalledWith(
                expect.objectContaining({
                    test_result: 'passed'
                })
            )
        })

        it('should update instance with failed result when test fails', () => {
            const mockInstance = {
                updateMultipleEntries: vi.fn()
            }

            const mockResult = {
                passed: false,
                error: { message: 'Test failed', stack: 'stack trace' }
            }

            framework.loadTestResult(mockInstance as any, { result: mockResult })

            expect(mockInstance.updateMultipleEntries).toHaveBeenCalledWith(
                expect.objectContaining({
                    test_result: 'failed'
                })
            )
        })
    })
})
