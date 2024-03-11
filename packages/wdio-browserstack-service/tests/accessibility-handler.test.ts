/// <reference path="../../webdriverio/src/@types/async.d.ts" />
/// <reference path="../src/@types/bstack-service-types.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'

import AccessibilityHandler from '../src/accessibility-handler.js'
import * as utils from '../src/util.js'
import type { Capabilities } from '@wdio/types'
import * as bstackLogger from '../src/bstackLogger.js'

const log = logger('test')
let accessibilityHandler: AccessibilityHandler
let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
let caps: Capabilities.RemoteCapability
let accessibilityOpts: { [key: string]: any; }

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

beforeEach(() => {
    vi.mocked(log.info).mockClear()
    vi.mocked(got).mockClear()
    vi.mocked(got.put).mockClear()
    vi.mocked(got).mockResolvedValue({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    })
    vi.mocked(got.put).mockResolvedValue({})

    browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Catalina',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: vi.fn(),
        executeAsync: async () => { 'done' },
        getUrl: () => { return 'https://www.google.com/'},
        on: vi.fn(),
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    caps = {
        browserName: 'chrome',
        'bstack:options': {
            os: 'OS X',
            osVersion: 'Catalina',
            accessibility: true
        } } as Capabilities.RemoteCapability
    accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true)
})

it('should initialize correctly', () => {
    accessibilityOpts = {
        wcagVersion: 'wcag2a',
        includeIssueType: {
            bestPractice: true,
            needsReview: true
        }
    }
    accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
    expect(accessibilityHandler['_platformA11yMeta']).toEqual({ browser_name: 'chrome', browser_version: 'latest', os_name: 'OS X', os_version: 'Catalina' })
    expect(accessibilityHandler['_accessibility']).toEqual(true)
    expect(accessibilityHandler['_caps']).toEqual(caps)
    expect(accessibilityHandler['_framework']).toEqual('framework')
})

describe('before', () => {
    // let _getCapabilityValueSpy
    const isBrowserstackSessionSpy = vi.spyOn(utils, 'isBrowserstackSession')
    const getA11yResultsSummarySpy = vi.spyOn(utils, 'getA11yResultsSummary')
    const getA11yResultsSpy = vi.spyOn(utils, 'getA11yResults')
    const isAccessibilityAutomationSessionSpy = vi.spyOn(utils, 'isAccessibilityAutomationSession')

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
        getA11yResultsSpy.mockClear()
        isBrowserstackSessionSpy.mockClear()
        getA11yResultsSummarySpy.mockClear()
        isAccessibilityAutomationSessionSpy.mockClear()
    })

    it('calls isBrowserstackSession', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before()
        expect(isBrowserstackSessionSpy).toBeCalledTimes(1)
    })

    it('isBrowserstackSession returns true', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before()
        expect(isBrowserstackSessionSpy).toBeCalledTimes(1)
    })

    it('calls isAccessibilityAutomationSession', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before()
        expect(isAccessibilityAutomationSessionSpy).toBeCalledTimes(1)
    })

    it('calls validateCapsWithA11y', async () => {
        const _getCapabilityValueSpy = vi.spyOn(accessibilityHandler, '_getCapabilityValue').mockReturnValue(true)
        const validateCapsWithA11ySpy = vi.spyOn(utils, 'validateCapsWithA11y')
        isBrowserstackSessionSpy.mockReturnValue(true)
        isAccessibilityAutomationSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before()
        expect(_getCapabilityValueSpy).toBeCalledTimes(3)
        expect(validateCapsWithA11ySpy).toBeCalledTimes(1)
    })

    it('calls getA11yResultsSummary', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        isAccessibilityAutomationSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before();
        (browser as WebdriverIO.Browser).getAccessibilityResultsSummary()
        expect(getA11yResultsSummarySpy).toBeCalledTimes(1)
    })

    it('calls getA11yResults', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        isAccessibilityAutomationSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before();
        (browser as WebdriverIO.Browser).getAccessibilityResults()
        expect(getA11yResultsSpy).toBeCalledTimes(1)
    })
})

describe('beforeScenario', () => {
    let executeAsyncSpy: any
    let executeSpy: any

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
        executeAsyncSpy = vi.spyOn((browser as WebdriverIO.Browser), 'executeAsync')
        executeSpy = vi.spyOn((browser as WebdriverIO.Browser), 'execute')
        vi.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    })

    it('should execute test started if page opened and can scan the page', async () => {
        const logInfoMock = vi.spyOn(log, 'info')
        vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

        await accessibilityHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(logInfoMock.mock.calls[0][0])
            .toContain('Automate test case execution has started.')
    })

    it('should not execute test started if url is invalid', async () => {
        browser.getUrl = async () => {
            return ':data;'
        }

        vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)

        await accessibilityHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(executeSpy).toBeCalledTimes(0)
        expect(executeAsyncSpy).toBeCalledTimes(0)
    })

    it('should not execute test started if page opened but cannot start scan', async () => {
        vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)

        await accessibilityHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(executeSpy).toBeCalledTimes(0)
    })

    it('should not execute test started if shouldRunTestHooks is false', async () => {
        accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return false })
        await accessibilityHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(executeSpy).toBeCalledTimes(0)
    })

    it('should throw error in before scenario if exception occurs', async () => {
        const logErrorMock = vi.spyOn(log, 'error')
        vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)
        accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return true })
        accessibilityHandler['checkIfPageOpened'] = vi.fn().mockImplementation(() => { throw new Error() })
        await accessibilityHandler.beforeScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(logErrorMock.mock.calls[0][0])
            .toContain('Exception in starting accessibility automation scan for this test case')
    })
})

describe('afterScenario', () => {
    let executeAsyncSpy: any
    let accessibilityHandler: AccessibilityHandler

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
        executeAsyncSpy = vi.spyOn((browser as WebdriverIO.Browser), 'executeAsync')
        vi.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: true,
            scanTestForAccessibility: true
        }
        accessibilityHandler['sendTestStopEvent'] = vi.fn().mockImplementation(() => { return [] })
    })

    it('should execute test end if scanTestForAccessibility is true', async () => {
        const logInfoMock = vi.spyOn(log, 'info')

        await accessibilityHandler.afterScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(accessibilityHandler['sendTestStopEvent']).toBeCalledTimes(1)
        expect(logInfoMock.mock.calls[1][0])
            .toContain('Accessibility testing for this test case has ended.')
    })

    it('should return if shouldRunTestHooks is false', async () => {
        accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return false })
        await accessibilityHandler.afterScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(executeAsyncSpy).toBeCalledTimes(0)
    })

    it('should return if accessibilityScanStarted is false', async () => {
        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: false,
            scanTestForAccessibility: true
        }
        await accessibilityHandler.afterScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(executeAsyncSpy).toBeCalledTimes(0)
    })

    it('should throw error in after scenario if exception occurs', async () => {
        const logErrorMock = vi.spyOn(log, 'error')
        accessibilityHandler['sendTestStopEvent'] = vi.fn().mockImplementation(() => { throw new Error() })

        await accessibilityHandler.afterScenario({
            pickle: {
                name: 'pickle-name',
                tags: []
            },
            gherkinDocument: {
                uri: '',
                feature: {
                    name: 'feature-name',
                    description: ''
                }
            }
        } as any)

        expect(logErrorMock.mock.calls[0][0])
            .toContain('Accessibility results could not be processed for the test case')
    })
})

describe('beforeTest', () => {
    let executeAsyncSpy: any
    let executeSpy: any

    describe('mocha', () => {
        beforeEach(() => {
            accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'mocha', true, accessibilityOpts)
            vi.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
            vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
            vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

            executeAsyncSpy = vi.spyOn((browser as WebdriverIO.Browser), 'executeAsync')
            executeSpy = vi.spyOn((browser as WebdriverIO.Browser), 'execute')
        })

        it('should execute test started if page opened and can scan the page', async () => {
            const logInfoMock = vi.spyOn(log, 'info')
            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(logInfoMock.mock.calls[0][0])
                .toContain('Automate test case execution has started.')
            vi.fn().mockRestore()
        })

        it('should not execute test started if url is invalid', async () => {
            browser.getUrl = async () => {
                return ':data;'
            }

            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(0)
            expect(executeAsyncSpy).toBeCalledTimes(0)
        })

        it('should not execute test started if page opened but cannot start scan', async () => {
            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(0)
        })

        it('should not execute test started if shouldRunTestHooks is false', async () => {
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return false })
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(0)
        })

        it('should throw error in before test if exception occurs', async () => {
            const logErrorMock = vi.spyOn(log, 'error')
            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)
            accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { throw new Error() })
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(logErrorMock.mock.calls[0][0])
                .toContain('Exception in starting accessibility automation scan for this test case Error')
        })
    })

    describe('jasmine', () => {
        let isBrowserstackSession: any
        beforeEach(() => {
            accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'jasmine', true, accessibilityOpts)
            isBrowserstackSession = vi.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        })

        it('should execute test started in case of jasmine', async () => {
            vi.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(isBrowserstackSession).toBeCalledTimes(0)
        })
    })
})

describe('afterTest', () => {
    let executeAsyncSpy: any
    let accessibilityHandler: AccessibilityHandler

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'mocha', true, accessibilityOpts)
        executeAsyncSpy = vi.spyOn((browser as WebdriverIO.Browser), 'executeAsync')
        vi.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        vi.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        vi.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: true,
            scanTestForAccessibility: true
        }
    })

    it('should execute test end if scanTestForAccessibility is true', async () => {
        const logInfoMock = vi.spyOn(log, 'info')
        await accessibilityHandler.afterTest('suite title', { parent: 'parent', title: 'test' } as any)

        expect(logInfoMock.mock.calls[1][0])
            .toContain('Accessibility testing for this test case has ended.')
    })

    it('should not return if accessibilityScanStarted is false', async () => {
        accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return false })
        await accessibilityHandler.afterTest('suite title', { parent: 'parent', title: 'test' } as any)

        expect(executeAsyncSpy).toBeCalledTimes(0)
    })

    it('should not return if shouldRunTestHooks is false', async () => {
        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: false,
            scanTestForAccessibility: true
        }
        await accessibilityHandler.afterTest('suite title', { parent: 'parent', title: 'test' } as any)

        expect(executeAsyncSpy).toBeCalledTimes(0)
    })

    it('should throw error in after test if exception occurs', async () => {
        const logErrorMock = vi.spyOn(log, 'error')
        accessibilityHandler['shouldRunTestHooks'] = vi.fn().mockImplementation(() => { return true })
        accessibilityHandler['sendTestStopEvent'] = vi.fn().mockImplementation(() => { throw new Error() })
        await accessibilityHandler.afterTest('suite title', { parent: 'parent', title: 'test' } as any)

        expect(logErrorMock.mock.calls[0][0])
            .toContain('Accessibility results could not be processed for the test case test. Error :')
    })
})

describe('getIdentifier', () => {
    let getUniqueIdentifierSpy: any
    let getUniqueIdentifierForCucumberSpy: any

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)

        getUniqueIdentifierSpy = vi.spyOn(utils, 'getUniqueIdentifier')
        getUniqueIdentifierForCucumberSpy = vi.spyOn(utils, 'getUniqueIdentifierForCucumber')
    })

    it('non cucumber', () => {
        accessibilityHandler['getIdentifier']({ parent: 'parent', title: 'title' } as any)
        expect(getUniqueIdentifierSpy).toBeCalledTimes(1)
    })

    it('cucumber', () => {
        accessibilityHandler['getIdentifier']({ pickle: { uri: 'uri', astNodeIds: ['9', '8'] } } as any)
        expect(getUniqueIdentifierForCucumberSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        getUniqueIdentifierSpy.mockReset()
        getUniqueIdentifierForCucumberSpy.mockReset()
    })
})
