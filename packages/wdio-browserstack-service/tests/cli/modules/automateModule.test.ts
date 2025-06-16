import type { Mock } from 'vitest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AutomateModule from '../../../src/cli/modules/automateModule.js'
import TestFramework from '../../../src/cli/frameworks/testFramework.js'
import { TestFrameworkState } from '../../../src/cli/states/testFrameworkState.js'
import { HookState } from '../../../src/cli/states/hookState.js'
import got from 'got'
import type { Frameworks, Options } from '@wdio/types'

// vi.mock('../../src/cli/frameworks/testFramework.ts')
vi.mock('got')
vi.mock('../../src/cli/frameworks/testFramework.js', () => ({
    default: {
        registerObserver: vi.fn()
    }
}))

// Mock global browser
const mockBrowser = {
    sessionId: 'mock-session-id-12345'
}
Object.defineProperty(globalThis, 'browser', {
    value: mockBrowser,
    writable: true,
    configurable: true
})

describe('AutomateModule', () => {
    let automateModule: AutomateModule
    let mockGot: Mock
    let mockConfig: any
    let mockOptions: Options.Testrunner
    let registerObserverSpy: Mock

    beforeEach(() => {
        vi.clearAllMocks()

        mockConfig = {
            userName: 'test-user',
            accessKey: 'test-key'
        }
        mockOptions = {
            user: 'testuser',
            key: 'testkey',
        } as Options.Testrunner

        mockGot = vi.mocked(got)
        mockGot.mockResolvedValue({
            body: { success: true, message: 'Session updated' }
        })

        registerObserverSpy = vi.spyOn(TestFramework, 'registerObserver').mockImplementation(() => {}) as Mock
        automateModule = new AutomateModule(mockOptions)

        Object.defineProperty(automateModule, 'config', {
            value: mockConfig
        })
    })

    afterEach(() => {
        vi.resetAllMocks()
        registerObserverSpy.mockRestore()
    })

    describe('constructor', () => {
        it('should initialize AutomateModule correctly', () => {
            expect(TestFramework.registerObserver).toHaveBeenCalledTimes(2)
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

        it('should have correct module name', () => {
            expect(automateModule.getModuleName()).toBe('AutomateModule')
            expect(AutomateModule.MODULE_NAME).toBe('AutomateModule')
        })
    })

    describe('onBeforeTest', () => {
        const mockTest: Frameworks.Test = {
            title: 'Test Login Functionality'
        } as Frameworks.Test

        const mockArgs = {
            test: mockTest,
            suiteTitle: 'Login Suite'
        }

        it('should call markSessionName with correct parameters', async () => {
            const markSessionNameSpy = vi.spyOn(automateModule, 'markSessionName').mockResolvedValue()

            await automateModule.onBeforeTest(mockArgs)

            expect(markSessionNameSpy).toHaveBeenCalledWith(
                'mock-session-id-12345',
                'Login Suite - Test Login Functionality',
                {
                    user: 'test-user',
                    key: 'test-key'
                }
            )
        })

        it('should handle missing sessionId gracefully', async () => {
            // Mock missing sessionId
            Object.defineProperty(globalThis, 'browser', {
                value: { sessionId: null }
            })

            const markSessionNameSpy = vi.spyOn(automateModule, 'markSessionName').mockResolvedValue()

            await automateModule.onBeforeTest(mockArgs)

            expect(markSessionNameSpy).toHaveBeenCalledWith(
                null,
                'Login Suite - Test Login Functionality',
                {
                    user: 'test-user',
                    key: 'test-key'
                }
            )
        })

        it('should use config credentials correctly', async () => {
            const customConfig = {
                userName: 'custom-user',
                accessKey: 'custom-key',
                app: './custom-app.apk'
            }

            // Update the config on the instance
            Object.defineProperty(automateModule, 'config', {
                value: customConfig
            })

            Object.defineProperty(globalThis, 'browser', {
                value: { sessionId: 'mock-session-id-12345' }
            })

            const markSessionNameSpy = vi.spyOn(automateModule, 'markSessionName').mockResolvedValue()

            await automateModule.onBeforeTest(mockArgs)

            expect(markSessionNameSpy).toHaveBeenCalledWith(
                'mock-session-id-12345',
                'Login Suite - Test Login Functionality',
                {
                    user: 'custom-user',
                    key: 'custom-key'
                }
            )
        })
    })

    describe('onAfterTest', () => {
        const mockResults = {
            passed: false,
            error: new Error('Test failed due to assertion error'),
            duration: 5000,
            retries: 1
        }

        const mockArgs = {
            results: mockResults
        }

        it('should call markSessionStatus with failed status', async () => {
            const markSessionStatusSpy = vi.spyOn(automateModule, 'markSessionStatus').mockResolvedValue()

            await automateModule.onAfterTest(mockArgs)

            expect(markSessionStatusSpy).toHaveBeenCalledWith(
                'mock-session-id-12345',
                'failed',
                'Test failed due to assertion error',
                {
                    user: 'test-user',
                    key: 'test-key'
                }
            )
        })

        it('should call markSessionStatus with passed status', async () => {
            const passedResults = {
                passed: true,
                error: null
            }

            const passedArgs = {
                result: passedResults
            }

            const markSessionStatusSpy = vi.spyOn(automateModule, 'markSessionStatus').mockResolvedValue()

            await automateModule.onAfterTest(passedArgs)

            expect(markSessionStatusSpy).toHaveBeenCalledWith(
                'mock-session-id-12345',
                'passed',
                undefined,
                {
                    user: 'test-user',
                    key: 'test-key'
                }
            )
        })

        it('should handle missing error gracefully for failed tests', async () => {
            const resultsWithoutError = {
                passed: false,
                error: null
            }

            const argsWithoutError = {
                result: resultsWithoutError
            }

            const markSessionStatusSpy = vi.spyOn(automateModule, 'markSessionStatus').mockResolvedValue()

            await automateModule.onAfterTest(argsWithoutError)

            expect(markSessionStatusSpy).toHaveBeenCalledWith(
                'mock-session-id-12345',
                'failed',
                'Unknown Error',
                {
                    user: 'test-user',
                    key: 'test-key'
                }
            )
        })
    })

    describe('markSessionName', () => {
        const mockCredentials = {
            user: 'test-user',
            key: 'test-key'
        }

        it('should make API call to App Automate when app is present', async () => {
            // Mock config app
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk'
                }
            })
            await automateModule.markSessionName('session-123', 'Test Session Name', mockCredentials)

            expect(mockGot).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.browserstack.com/app-automate/sessions/session-123.json',
                headers: {
                    Authorization: 'Basic dGVzdC11c2VyOnRlc3Qta2V5',
                    'Content-Type': 'application/json'
                },
                json: {
                    name: 'Test Session Name'
                },
                responseType: 'json'
            })
        })

        it('should make API call to Browser Automate when app is not present', async () => {

            await automateModule.markSessionName('session-123', 'Test Session Name', mockCredentials)

            expect(mockGot).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.browserstack.com/automate/sessions/session-123.json',
                headers: {
                    Authorization: 'Basic dGVzdC11c2VyOnRlc3Qta2V5',
                    'Content-Type': 'application/json'
                },
                json: {
                    name: 'Test Session Name'
                },
                responseType: 'json'
            })
        })

        it('should handle proxy configuration', async () => {
            // Mock config with proxy
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk',
                    proxy: 'http://proxy:8080'
                }
            })

            await automateModule.markSessionName('session-123', 'Test Session Name', mockCredentials)

            expect(mockGot).toHaveBeenCalledWith(
                expect.objectContaining({
                    agent: {
                        https: expect.any(Object)
                    }
                })
            )
        })
    })

    describe('markSessionStatus', () => {
        const mockCredentials = {
            user: 'test-user',
            key: 'test-key'
        }

        it('should make API call to App Automate for failed status', async () => {
            // Mock config without app
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk'
                }
            })
            await automateModule.markSessionStatus('session-123', 'failed', 'Test failure reason', mockCredentials)

            expect(mockGot).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.browserstack.com/app-automate/sessions/session-123.json',
                headers: {
                    Authorization: 'Basic dGVzdC11c2VyOnRlc3Qta2V5',
                    'Content-Type': 'application/json'
                },
                json: {
                    status: 'failed',
                    reason: 'Test failure reason'
                },
                responseType: 'json'
            })
        })

        it('should make API call for passed status without reason', async () => {
            // Mock config without app
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk'
                }
            })
            await automateModule.markSessionStatus('session-123', 'passed', undefined, mockCredentials)

            expect(mockGot).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.browserstack.com/app-automate/sessions/session-123.json',
                headers: {
                    Authorization: 'Basic dGVzdC11c2VyOnRlc3Qta2V5',
                    'Content-Type': 'application/json'
                },
                json: {
                    status: 'passed'
                },
                responseType: 'json'
            })
        })

        it('should make API call to Browser Automate when app is not present', async () => {
            await automateModule.markSessionStatus('session-123', 'passed', undefined, mockCredentials)

            expect(mockGot).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.browserstack.com/automate/sessions/session-123.json',
                headers: {
                    Authorization: 'Basic dGVzdC11c2VyOnRlc3Qta2V5',
                    'Content-Type': 'application/json'
                },
                json: {
                    status: 'passed'
                },
                responseType: 'json'
            })
        })

        it('should handle proxy configuration', async () => {
            // Mock config with proxy
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk',
                    proxy: 'http://proxy:8080'
                }
            })

            await automateModule.markSessionStatus('session-123', 'passed', undefined, mockCredentials)

            expect(mockGot).toHaveBeenCalledWith(
                expect.objectContaining({
                    agent: {
                        https: expect.any(Object)
                    }
                })
            )
        })
    })

    describe('App Automate Detection', () => {
        it('should detect App Automate when app property exists', async () => {
            // Mock config app
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key',
                    app: './test-app.apk'
                }
            })
            const markSessionNameSpy = vi.spyOn(automateModule, 'markSessionName').mockResolvedValue()

            await automateModule.onBeforeTest({
                test: { title: 'Test', fullName: 'Test' },
                suiteTitle: { suiteTitle: 'Suite' }
            })

            expect(markSessionNameSpy).toHaveBeenCalled()
            expect(automateModule.config.app).toBe('./test-app.apk')
        })

        it('should detect Browser Automate when app property is missing', async () => {
            Object.defineProperty(automateModule, 'config', {
                value: {
                    userName: 'test-user',
                    accessKey: 'test-key'
                    // no app property
                },
                writable: true,
                configurable: true
            })

            const markSessionNameSpy = vi.spyOn(automateModule, 'markSessionName').mockResolvedValue()

            await automateModule.onBeforeTest({
                test: { title: 'Test', fullName: 'Test' },
                suiteTitle: { suiteTitle: 'Suite' }
            })

            expect(markSessionNameSpy).toHaveBeenCalled()
            expect(automateModule.config.app).toBeUndefined()
        })
    })
})
