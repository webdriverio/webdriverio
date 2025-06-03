import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'

import AccessibilityHandler from '../src/accessibility-handler.js'
import * as utils from '../src/util.js'
import type { Capabilities, Options } from '@wdio/types'
import * as bstackLogger from '../src/bstackLogger.js'
import type { BrowserstackConfig, BrowserstackOptions } from '../src/types.js'

const log = logger('test')
let accessibilityHandler: AccessibilityHandler
let browser: WebdriverIO.Browser
let caps: Capabilities.RemoteCapability
let options: BrowserstackConfig & BrowserstackOptions
let config : Options.Testrunner
let accessibilityOpts: { [key: string]: any }

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('App Automate Accessibility Handler', () => {
    beforeEach(() => {
        vi.mocked(log.info).mockClear()
        vi.mocked(got).mockClear()
        vi.mocked(got.put).mockClear()

        browser = {
            sessionId: 'app123',
            capabilities: {
                app: 'bs://123456789',
                deviceName: 'Google Pixel',
                platformName: 'Android',
                platformVersion: '12.0'
            },
            execute: vi.fn(),
            executeAsync: async () => 'done',
            getUrl: () => 'app://myapp',
        } as any as WebdriverIO.Browser

        caps = {
            'bstack:options': {
                deviceName: 'Google Pixel',
                platformName: 'Android',
                platformVersion: '12.0',
                accessibility: true
            }
        } as Capabilities.RemoteCapability

        accessibilityOpts = {
            wcagVersion: 'wcag2a',
            includeIssueType: {
                bestPractice: true,
                needsReview: true
            }
        }
        options = {
            accessibility: true
        } as BrowserstackConfig & BrowserstackOptions

        config = {} as Options.Testrunner

        accessibilityHandler = new AccessibilityHandler(browser, caps, options, true, config, 'mocha', true, false, accessibilityOpts)
    })

    describe('initialization', () => {
        it('should initialize with app automate capabilities', () => {
            expect(accessibilityHandler['_platformA11yMeta']).toEqual({
                browser_name: undefined,
                browser_version: 'latest',
                platform_name: 'Android',
                platform_version: '12.0',
                os_name: undefined,
                os_version: undefined
            })
            expect(accessibilityHandler['isAppAutomate']).toBe(true)
        })
    })

    describe('before hook', () => {
        const isBrowserstackSessionSpy = vi.spyOn(utils, 'isBrowserstackSession')
        const isAppAccessibilityAutomationSessionSpy = vi.spyOn(utils, 'isAppAccessibilityAutomationSession')
        const validateCapsWithAppA11ySpy = vi.spyOn(utils, 'validateCapsWithAppA11y')

        beforeEach(() => {
            isBrowserstackSessionSpy.mockClear()
            isAppAccessibilityAutomationSessionSpy.mockClear()
            validateCapsWithAppA11ySpy.mockClear()
        })

        it('should validate app automate session', async () => {
            isBrowserstackSessionSpy.mockReturnValue(true)
            isAppAccessibilityAutomationSessionSpy.mockReturnValue(true)
            validateCapsWithAppA11ySpy.mockReturnValue(true)

            await accessibilityHandler.before('app123')

            expect(isBrowserstackSessionSpy).toBeCalledTimes(0)
            expect(isAppAccessibilityAutomationSessionSpy).toBeCalledTimes(1)
            expect(validateCapsWithAppA11ySpy).toBeCalledTimes(1)
        })

        it('should set up accessibility methods', async () => {
            isBrowserstackSessionSpy.mockReturnValue(true)
            isAppAccessibilityAutomationSessionSpy.mockReturnValue(true)

            await accessibilityHandler.before('app123')

            expect(typeof (browser as any).getAccessibilityResultsSummary).toBe('function')
            expect(typeof (browser as any).getAccessibilityResults).toBe('function')
            expect(typeof (browser as any).performScan).toBe('function')
        })
    })

    describe('beforeTest hook', () => {
        it('should handle app specific test metadata', async () => {
            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

            accessibilityHandler['getIdentifier'] = vi.fn().mockReturnValue('parent test app accessibility')

            accessibilityHandler['_framework'] = 'mocha'
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockReturnValue(true)
            accessibilityHandler['_sessionId'] = 'session123'

            await accessibilityHandler.beforeTest('App Test Suite', {
                title: 'test app accessibility',
                parent: 'parent'
            } as any)

            const testId = 'parent test app accessibility'
            expect(accessibilityHandler['_testMetadata'][testId]).toBeDefined()
            expect(accessibilityHandler['_testMetadata'][testId].scanTestForAccessibility).toBe(true)
            expect(accessibilityHandler['_testMetadata'][testId].accessibilityScanStarted).toBe(true)
        })

        it('should handle errors in beforeTest', async () => {
            const logErrorMock = vi.spyOn(bstackLogger.BStackLogger, 'error')

            accessibilityHandler['_framework'] = 'mocha'
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockReturnValue(true)

            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockImplementation(() => {
                throw new Error('Test Error')
            })

            await accessibilityHandler.beforeTest('App Test Suite', {
                title: 'test app accessibility',
                parent: 'parent'
            } as any)

            expect(logErrorMock).toHaveBeenCalled()
            expect(logErrorMock.mock.calls[0][0]).toContain('Exception in starting accessibility automation scan')
        })
    })

    describe('afterTest hook', () => {
        beforeEach(() => {
            const testId = 'parent test app accessibility'
            accessibilityHandler['_testMetadata'][testId] = {
                accessibilityScanStarted: true,
                scanTestForAccessibility: true
            }
        })

        it('should handle app specific test completion', async () => {
            const logInfoMock = vi.spyOn(bstackLogger.BStackLogger, 'info')

            accessibilityHandler['_framework'] = 'mocha'
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockReturnValue(true)
            accessibilityHandler['getIdentifier'] = vi.fn().mockReturnValue('test-id')
            accessibilityHandler['sendTestStopEvent'] = vi.fn().mockResolvedValue(undefined)

            accessibilityHandler['_testMetadata']['test-id'] = {
                accessibilityScanStarted: true,
                scanTestForAccessibility: true
            }

            await accessibilityHandler.afterTest('App Test Suite', {
                title: 'test app accessibility',
                parent: 'parent'
            } as any)

            expect(logInfoMock).toHaveBeenCalledWith('Accessibility testing for this test case has ended.')
        })

        it('should handle errors in afterTest', async () => {
            const logErrorMock = vi.spyOn(bstackLogger.BStackLogger, 'error')

            accessibilityHandler['_framework'] = 'mocha'
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockReturnValue(true)
            accessibilityHandler['getIdentifier'] = vi.fn().mockReturnValue('test-id')

            accessibilityHandler['_testMetadata']['test-id'] = {
                accessibilityScanStarted: true,
                scanTestForAccessibility: true
            }

            accessibilityHandler['sendTestStopEvent'] = vi.fn().mockImplementation(() => {
                throw new Error('Test Error')
            })

            const testData = {
                title: 'test app accessibility',
                parent: 'parent'
            } as any

            await accessibilityHandler.afterTest('App Test Suite', testData)

            expect(logErrorMock).toHaveBeenCalled()
            expect(logErrorMock.mock.calls[0][0]).toContain('Accessibility results could not be processed')
        })
    })
})
