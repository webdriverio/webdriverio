import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/cli/frameworks/testFramework.js', () => ({
    default: {
        registerObserver: vi.fn()
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

import PercyModule from '../../../src/cli/modules/percyModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import AutomationFramework from '../../../src/cli/frameworks/automationFramework.js'
import PercyHandler from '../../../src/Percy/Percy-Handler.js'
import * as bstackLogger from '../../../src/bstackLogger.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => { })
vi.spyOn(bstackLogger.BStackLogger, 'info').mockImplementation(() => { })
vi.spyOn(bstackLogger.BStackLogger, 'warn').mockImplementation(() => { })
vi.spyOn(bstackLogger.BStackLogger, 'error').mockImplementation(() => { })

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
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('constructor', () => {
        it('should register observers', () => {
            expect(AutomationFramework.registerObserver).toHaveBeenCalledTimes(1)
            expect(TestFramework.registerObserver).toHaveBeenCalledTimes(2)
        })
    })

    describe('getModuleName', () => {
        it('should return the correct module name', () => {
            expect(percyModule.getModuleName()).toBe('PercyModule')
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

            await percyModule.onAfterCreate({ browser: mockBrowser })

            expect(PercyHandler).toHaveBeenCalledWith(
                'auto',
                mockBrowser,
                expect.any(Object),
                false,
                ''
            )
            expect(mockBrowser.on).toHaveBeenCalledWith('command', expect.any(Function))
            expect(mockBrowser.on).toHaveBeenCalledWith('result', expect.any(Function))
        })

        it('should not initialize Percy handler when percyCaptureMode is not defined', async () => {
            percyModule = new PercyModule({})
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any

            await percyModule.onAfterCreate({ browser: mockBrowser })

            expect(PercyHandler).not.toHaveBeenCalled()
        })
    })

    describe('onBeforeTest', () => {
        it('should not call _setSessionName when Percy handler is not initialized', async () => {
            await percyModule.onBeforeTest({ sessionName: 'test-session' })
            expect(PercyHandler).not.toHaveBeenCalled()
        })

        it('should call _setSessionName when Percy handler is initialized', async () => {
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            await percyModule.onBeforeTest({ sessionName: 'test-session' })

            expect(mockInstance._setSessionName).toHaveBeenCalledWith('test-session')
        })
    })

    describe('onAfterTest', () => {
        it('should not call percyAutoCapture when Percy handler is not initialized', async () => {
            await percyModule.onAfterTest({})
            expect(PercyHandler).not.toHaveBeenCalled()
        })

        it('should call percyAutoCapture when percyCaptureMode is testcase', async () => {
            percyModule = new PercyModule({ percyCaptureMode: 'testcase' })
            const mockBrowser = { sessionId: 'test-session-id', on: vi.fn() } as any
            await percyModule.onAfterCreate({ browser: mockBrowser })

            await percyModule.onAfterTest({})

            expect(mockInstance.percyAutoCapture).toHaveBeenCalledWith('testcase', null)
            expect(mockInstance.teardown).toHaveBeenCalled()
        })
    })
})