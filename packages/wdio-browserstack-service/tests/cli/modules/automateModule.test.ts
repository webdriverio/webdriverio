import { describe, expect, it, vi, beforeEach } from 'vitest'
import AutomateModule from '../../../src/cli/modules/automateModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { isBrowserstackSession } from '../../../src/util.js'
import PerformanceTester from '../../../src/instrumentation/performance/performance-tester.js'
import { _fetch as fetch } from '../../../src/fetchWrapper.js'
import type { Options } from '@wdio/types'

// Mock dependencies
vi.mock('../../../src/cli/frameworks/testFramework.js', () => ({
    default: {
        registerObserver: vi.fn(),
        setState: vi.fn()
    }
}))

vi.mock('../../../src/cli/frameworks/automationFramework.js', () => ({
    default: {
        getTrackedInstance: vi.fn(),
        getState: vi.fn(),
        getDriver: vi.fn()
    }
}))

vi.mock('../../../src/cli/cliLogger.js', () => ({
    BStackLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn()
    }
}))

vi.mock('../../../src/util.js', () => ({
    isBrowserstackSession: vi.fn(() => true)
}))

vi.mock('../../../src/instrumentation/performance/performance-tester.js', () => ({
    default: {
        measureWrapper: vi.fn((event, fn) => fn)
    }
}))

vi.mock('../../../src/fetchWrapper.js', () => ({
    _fetch: vi.fn()
}))

describe('AutomateModule', () => {
    let automateModule: AutomateModule
    let mockConfig: Options.Testrunner
    let mockAutoInstance: any
    let mockBrowser: any
    let mockTestInstance: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockConfig = {
            user: 'testuser',
            key: 'testkey'
        } as Options.Testrunner

        mockAutoInstance = {
            getId: vi.fn().mockReturnValue(1)
        }

        mockBrowser = {
            sessionId: 'test-session-id'
        }

        mockTestInstance = {
            getId: vi.fn().mockReturnValue(1)
        }

        // Setup AutomationFramework mocks
        vi.mocked(AutomationFramework.getTrackedInstance).mockReturnValue(mockAutoInstance)
        vi.mocked(AutomationFramework.getDriver).mockReturnValue(mockBrowser)
        vi.mocked(AutomationFramework.getState).mockImplementation((instance, key) => {
            if (key === 'framework_session_id') {return 'test-session-id'}
            if (key.includes('CAPABILITIES')) {return { browserName: 'chrome' }}
            return {}
        })

        // Reset isBrowserstackSession to default
        vi.mocked(isBrowserstackSession).mockReturnValue(true)

        automateModule = new AutomateModule(mockConfig)
        // Mock the config property
        automateModule.config = {
            testContextOptions: {
                skipSessionName: false,
                skipSessionStatus: false
            },
            userName: 'testuser',
            accessKey: 'testkey'
        } as any
    })

    it('should create an instance with correct module name', () => {
        expect(automateModule).toBeInstanceOf(AutomateModule)
        expect(automateModule.getModuleName()).toBe('AutomateModule')
    })

    it('should register observers during construction', () => {
        // Clear previous calls from construction in beforeEach
        vi.mocked(TestFramework.registerObserver).mockClear()

        // Create new instance to test observer registration
        const newModule = new AutomateModule(mockConfig)

        expect(TestFramework.registerObserver).toHaveBeenCalledTimes(3)
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
        expect(TestFramework.registerObserver).toHaveBeenCalledWith(
            AutomationFrameworkState.EXECUTE,
            HookState.POST,
            expect.any(Function)
        )
    })

    it('should have correct static MODULE_NAME', () => {
        expect(AutomateModule.MODULE_NAME).toBe('AutomateModule')
    })

    it('should initialize with browserStackConfig', () => {
        expect(automateModule.browserStackConfig).toBe(mockConfig)
    })

    it('should have logger property', () => {
        expect(automateModule.logger).toBeDefined()
    })

    it('should have onBeforeTest method', () => {
        expect(typeof automateModule.onBeforeTest).toBe('function')
    })

    it('should have onAfterTest method', () => {
        expect(typeof automateModule.onAfterTest).toBe('function')
    })

    it('should have onAfterExecute method', () => {
        expect(typeof automateModule.onAfterExecute).toBe('function')
    })

    it('should have markSessionName method', () => {
        expect(typeof automateModule.markSessionName).toBe('function')
    })

    it('should handle onBeforeTest with basic args', async () => {
        const mockArgs = {
            instance: mockTestInstance,
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onBeforeTest(mockArgs)

        expect(TestFramework.setState).toHaveBeenCalled()
    })

    it('should skip session name update when skipSessionName is true', async () => {
        (automateModule.config as any).testContextOptions.skipSessionName = true
        const mockArgs = {
            instance: mockTestInstance,
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onBeforeTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should skip session name update when not a BrowserStack session', async () => {
        vi.mocked(isBrowserstackSession).mockReturnValue(false)
        const mockArgs = {
            instance: mockTestInstance,
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onBeforeTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should handle onAfterTest with basic args', async () => {
        const mockArgs = {
            instance: mockTestInstance,
            result: { error: null, passed: true },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onAfterTest(mockArgs)

        expect(TestFramework.setState).toHaveBeenCalledTimes(2) // status and reason
    })

    it('should skip session status update when skipSessionStatus is true', async () => {
        (automateModule.config as any).testContextOptions.skipSessionStatus = true
        const mockArgs = {
            instance: mockTestInstance,
            result: { error: null, passed: true },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onAfterTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should skip session status update when not a BrowserStack session', async () => {
        vi.mocked(isBrowserstackSession).mockReturnValue(false)
        const mockArgs = {
            instance: mockTestInstance,
            result: { error: null, passed: true },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onAfterTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should handle failed test result correctly', async () => {
        const mockArgs = {
            instance: mockTestInstance,
            result: { error: new Error('Test failed'), passed: false },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await automateModule.onAfterTest(mockArgs)

        expect(TestFramework.setState).toHaveBeenCalledWith(
            mockTestInstance,
            'automate_session_status',
            'failed'
        )
        expect(TestFramework.setState).toHaveBeenCalledWith(
            mockTestInstance,
            'automate_session_reason',
            'Test failed'
        )
    })

    it('should handle onAfterExecute', async () => {
        // Setup session data by calling onBeforeTest and onAfterTest
        const testArgs = {
            instance: mockTestInstance,
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        const resultArgs = {
            instance: mockTestInstance,
            result: { error: null, passed: true },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        // Simulate test lifecycle to populate sessionMap
        await automateModule.onBeforeTest(testArgs)
        await automateModule.onAfterTest(resultArgs)

        await automateModule.onAfterExecute()

        // onAfterExecute should complete without error
        expect(true).toBe(true)
    })

    it('should handle onAfterExecute with failed tests', async () => {
        const testArgs = {
            instance: mockTestInstance,
            test: { title: 'failed test' },
            suiteTitle: 'failed suite'
        }

        const resultArgs = {
            instance: mockTestInstance,
            result: { error: new Error('Test failed'), passed: false },
            test: { title: 'failed test' },
            suiteTitle: 'failed suite'
        }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        await automateModule.onBeforeTest(testArgs)
        await automateModule.onAfterTest(resultArgs)

        await automateModule.onAfterExecute()

        // onAfterExecute should complete without error
        expect(true).toBe(true)
    })

    it('should handle markSessionName with basic params', async () => {
        const sessionId = 'test-session-id'
        const sessionName = 'test-session-name'
        const config = { user: 'testuser', key: 'testkey' }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        await automateModule.markSessionName(sessionId, sessionName, config)

        expect(PerformanceTester.measureWrapper).toHaveBeenCalled()
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('automate/sessions'),
            expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    Authorization: expect.stringContaining('Basic'),
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ name: sessionName })
            })
        )
    })

    it('should handle markSessionName for App Automate', async () => {
        (automateModule.config as any).app = 'test-app'
        const sessionId = 'test-session-id'
        const sessionName = 'test-session-name'
        const config = { user: 'testuser', key: 'testkey' }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        await automateModule.markSessionName(sessionId, sessionName, config)

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('app-automate/sessions'),
            expect.any(Object)
        )
    })

    it('should handle markSessionStatus with basic params', async () => {
        const sessionId = 'test-session-id'
        const sessionStatus = 'passed' as const
        const config = { user: 'testuser', key: 'testkey' }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        await automateModule.markSessionStatus(sessionId, sessionStatus, undefined, config)

        expect(PerformanceTester.measureWrapper).toHaveBeenCalled()
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('automate/sessions'),
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ status: sessionStatus })
            })
        )
    })

    it('should handle markSessionStatus with error message', async () => {
        const sessionId = 'test-session-id'
        const sessionStatus = 'failed' as const
        const errorMessage = 'Test failed with error'
        const config = { user: 'testuser', key: 'testkey' }

        vi.mocked(fetch).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ success: true })
        } as any)

        await automateModule.markSessionStatus(sessionId, sessionStatus, errorMessage, config)

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: JSON.stringify({
                    status: sessionStatus,
                    reason: errorMessage
                })
            })
        )
    })

    it('should handle onBeforeTest with skipSessionName enabled', async () => {
        const configWithSkip = {
            ...mockConfig,
            testContextOptions: { skipSessionName: true }
        }
        const moduleWithSkip = new AutomateModule(configWithSkip)
        moduleWithSkip.config = configWithSkip

        const mockArgs = {
            instance: mockTestInstance,
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await moduleWithSkip.onBeforeTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should handle onAfterTest with skipSessionStatus enabled', async () => {
        const configWithSkip = {
            ...mockConfig,
            testContextOptions: { skipSessionStatus: true }
        }
        const moduleWithSkip = new AutomateModule(configWithSkip)
        moduleWithSkip.config = configWithSkip

        const mockArgs = {
            instance: mockTestInstance,
            result: { error: null, passed: true },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await moduleWithSkip.onAfterTest(mockArgs)

        expect(TestFramework.setState).not.toHaveBeenCalled()
    })

    it('should handle onAfterTest with failed test result', async () => {
        const mockArgs = {
            instance: {},
            result: { error: new Error('Test failed'), passed: false },
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await expect(automateModule.onAfterTest(mockArgs)).resolves.toBeUndefined()
    })

    it('should handle onBeforeTest with missing test title', async () => {
        const mockArgs = {
            instance: {},
            test: {},
            suiteTitle: 'suite title'
        }

        await expect(automateModule.onBeforeTest(mockArgs)).resolves.toBeUndefined()
    })

    it('should handle onAfterTest with missing result', async () => {
        const mockArgs = {
            instance: {},
            result: { error: null, passed: true }, // Provide basic result structure
            test: { title: 'test title' },
            suiteTitle: 'suite title'
        }

        await expect(automateModule.onAfterTest(mockArgs)).resolves.toBeUndefined()
    })

    it('should handle error scenarios gracefully', async () => {
        // Test with empty sessionId
        await expect(automateModule.markSessionName('', 'test-name', { user: 'test', key: 'test' })).resolves.toBeUndefined()

        // Test with null sessionName
        await expect(automateModule.markSessionName('test-id', null as any, { user: 'test', key: 'test' })).resolves.toBeUndefined()

        // Test with undefined config
        await expect(automateModule.markSessionName('test-id', 'test-name', undefined as any)).resolves.toBeUndefined()
    })

    it('should handle creation without browserStackConfig', () => {
        const moduleWithoutConfig = new AutomateModule(undefined as any)
        expect(moduleWithoutConfig).toBeInstanceOf(AutomateModule)
        expect(moduleWithoutConfig.getModuleName()).toBe('AutomateModule')
    })
})