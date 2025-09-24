import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/cli/frameworks/testFramework.js', () => ({
    default: {
        registerObserver: vi.fn(),
        getState: vi.fn()
    }
}))

vi.mock('../../../src/cli/frameworks/automationFramework.js', () => ({
    default: {
        registerObserver: vi.fn()
    }
}))

vi.mock('../../../src/Percy/Percy-Handler.js', () => ({
    default: vi.fn().mockImplementation(() => ({
        before: vi.fn().mockResolvedValue(undefined),
        _setSessionName: vi.fn(),
        percyAutoCapture: vi.fn().mockResolvedValue(undefined),
        teardown: vi.fn().mockResolvedValue(undefined),
        browserBeforeCommand: vi.fn(),
        browserAfterCommand: vi.fn()
    }))
}))

vi.mock('../../../src/cli/cliLogger.js', () => ({
    BStackLogger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        logToFile: vi.fn()
    }
}))

import PercyModule from '../../../src/cli/modules/percyModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import PercyHandler from '../../../src/Percy/Percy-Handler.js'
import { AutomationFrameworkState } from '../../../src/cli/states/automationFrameworkState.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import { TestFrameworkConstants } from '../../../src/cli/frameworks/constants/testFrameworkConstants.js'
import * as cliLogger from '../../../src/cli/cliLogger.js'

const bstackLoggerSpy = vi.spyOn(cliLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => { })
vi.spyOn(cliLogger.BStackLogger, 'info').mockImplementation(() => { })
vi.spyOn(cliLogger.BStackLogger, 'warn').mockImplementation(() => { })
vi.spyOn(cliLogger.BStackLogger, 'error').mockImplementation(() => { })

describe('PercyModule', () => {
    let percyModule: PercyModule
    let mockPercyConfig: any
    let mockInstance: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockInstance = {
            before: vi.fn().mockResolvedValue(undefined),
            _setSessionName: vi.fn(),
            percyAutoCapture: vi.fn().mockResolvedValue(undefined),
            teardown: vi.fn().mockResolvedValue(undefined),
            browserBeforeCommand: vi.fn(),
            browserAfterCommand: vi.fn()
        }
        ;(PercyHandler as any).mockImplementation(() => mockInstance)

        mockPercyConfig = {
            percyCaptureMode: 'auto'
        }
        percyModule = new PercyModule(mockPercyConfig)
        percyModule.config = {}
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should register observers with correct parameters', () => {
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
            expect(AutomationFramework.registerObserver).toHaveBeenCalledTimes(1)
            expect(TestFramework.registerObserver).toHaveBeenCalledTimes(2)
        })

        it('should initialize with correct properties', () => {
            expect((percyModule as any).percyConfig).toBe(mockPercyConfig)
            expect((percyModule as any).isAppAutomate).toBe(false)
        })

        it('should log initialization message', () => {
            expect(cliLogger.BStackLogger.info).toHaveBeenCalledWith(
                'PercyModule: Initializing Percy Module'
            )
        })
    })

    describe('getModuleName', () => {
        it('should return the correct module name from parent BaseModule', () => {
            expect(percyModule.getModuleName()).toBe('PercyModule')
        })

        it('should have correct static MODULE_NAME', () => {
            expect(PercyModule.MODULE_NAME).toBe('PercyModule')
        })
    })

    describe('onAfterCreate', () => {
        it('should not initialize Percy handler when browser is not defined', async () => {
            await percyModule.onAfterCreate({})
            expect(PercyHandler).not.toHaveBeenCalled()
        })

        it('should initialize Percy handler when browser is defined', async () => {
            const mockBrowser = {
                sessionId: 'test-session-id',
                on: vi.fn()
            } as any

            percyModule.config = { app: undefined }

            await percyModule.onAfterCreate({ browser: mockBrowser })

            expect(PercyHandler).toHaveBeenCalledWith(
                'auto',
                mockBrowser,
                {},
                true,
                ''
            )
            expect(mockInstance.before).toHaveBeenCalled()
            expect(mockBrowser.on).toHaveBeenCalledWith('command', expect.any(Function))
            expect(mockBrowser.on).toHaveBeenCalledWith('result', expect.any(Function))
        })

        it('should set isAppAutomate when app config is present', async () => {
            const mockBrowser = {
                sessionId: 'test-session-id',
                on: vi.fn()
            } as any

            percyModule.config = { app: 'some-app' }

            await percyModule.onAfterCreate({ browser: mockBrowser })

            expect(PercyHandler).toHaveBeenCalledWith(
                'auto',
                mockBrowser,
                {},
                true,
                ''
            )
        })

        it('should not initialize Percy handler when percyCaptureMode is not defined', async () => {
            percyModule = new PercyModule({})
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any

            await percyModule.onAfterCreate({ browser: mockBrowser })

            expect(PercyHandler).not.toHaveBeenCalled()
            expect(cliLogger.BStackLogger.warn).toHaveBeenCalledWith(
                'PercyModule: Percy capture mode is not defined in the configuration, skipping Percy initialization'
            )
        })

        it('should log error when browser is not defined', async () => {
            await percyModule.onAfterCreate({})

            expect(cliLogger.BStackLogger.error).toHaveBeenCalledWith(
                'PercyModule: Browser instance is not defined in onAfterCreate'
            )
            expect(PercyHandler).not.toHaveBeenCalled()
        })
    })

    describe('onBeforeTest', () => {
        it('should not call _setSessionName when Percy handler is not initialized', async () => {
            await percyModule.onBeforeTest({ instance: {} })
            expect(PercyHandler).not.toHaveBeenCalled()
        })

        it('should call _setSessionName when Percy handler is initialized', async () => {
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            const getStateSpy = vi.spyOn(TestFramework, 'getState')
            getStateSpy.mockReturnValue('test-session-name')
            const mockTestInstance = {
                getAllData: vi.fn().mockReturnValue(new Map([
                    ['automate_session_name', 'test-session-name']
                ]))
            }

            await percyModule.onBeforeTest({ instance: mockTestInstance })

            expect(getStateSpy).toHaveBeenCalledWith(
                mockTestInstance,
                TestFrameworkConstants.KEY_AUTOMATE_SESSION_NAME
            )
            expect(mockInstance._setSessionName).toHaveBeenCalledWith('test-session-name')
        })

        it('should warn when Percy handler is not initialized', async () => {
            await percyModule.onBeforeTest({ instance: {} })

            expect(cliLogger.BStackLogger.warn).toHaveBeenCalledWith(
                'PercyModule: Percy handler is not initialized, skipping pre execute actions'
            )
            expect(mockInstance._setSessionName).not.toHaveBeenCalled()
        })
    })

    describe('onAfterTest', () => {
        it('should warn when Percy handler is not initialized', async () => {
            await percyModule.onAfterTest()

            expect(cliLogger.BStackLogger.warn).toHaveBeenCalledWith(
                'PercyModule: Percy handler is not initialized, skipping post execute actions'
            )
            expect(mockInstance.percyAutoCapture).not.toHaveBeenCalled()
            expect(mockInstance.teardown).not.toHaveBeenCalled()
        })

        it('should call percyAutoCapture when percyCaptureMode is testcase', async () => {
            percyModule = new PercyModule({ percyCaptureMode: 'testcase' })
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            await percyModule.onAfterTest()

            expect(mockInstance.percyAutoCapture).toHaveBeenCalledWith('testcase', null)
            expect(mockInstance.teardown).toHaveBeenCalled()
        })

        it('should only call teardown when percyCaptureMode is not testcase', async () => {
            percyModule = new PercyModule({ percyCaptureMode: 'auto' })
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            await percyModule.onAfterTest()

            expect(mockInstance.percyAutoCapture).not.toHaveBeenCalled()
            expect(mockInstance.teardown).toHaveBeenCalled()
        })

        it('should handle errors gracefully and log them', async () => {
            percyModule = new PercyModule({ percyCaptureMode: 'testcase' })
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            const error = new Error('Percy error')
            mockInstance.percyAutoCapture.mockRejectedValue(error)

            await percyModule.onAfterTest()

            expect(cliLogger.BStackLogger.error).toHaveBeenCalledWith(
                'Percy post execute failed: Error: Percy error'
            )
        })
    })
})