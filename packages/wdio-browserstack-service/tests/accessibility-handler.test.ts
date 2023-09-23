/// <reference path="../../webdriverio/src/@types/async.d.ts" />

import got from 'got'
import logger from '@wdio/logger'

import AccessibilityHandler from '../src/accessibility-handler'
import * as utils from '../src/util'
import type { Capabilities } from '@wdio/types'
import { Browser, MultiRemoteBrowser } from 'webdriverio'
import { BrowserAsync } from '../src/@types/bstack-service-types'

const log = logger('test')
let accessibilityHandler: AccessibilityHandler
let browser: Browser<'async'> | MultiRemoteBrowser<'async'>
let caps: Capabilities.RemoteCapability
let accessibilityOpts: { [key: string]: any; }

jest.mock('got')
// jest.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

beforeEach(() => {
    jest.mocked(log.info).mockClear()
    jest.mocked(got).mockClear()
    jest.mocked(got.put).mockClear()
    jest.mocked(got).mockResolvedValue({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    })
    jest.mocked(got.put).mockResolvedValue({})

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
        getInstance: jest.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: jest.fn(),
        executeAsync: async () => { 'done' },
        getUrl: () => { return 'https://www.google.com/'},
        on: jest.fn(),
    } as any as Browser<'async'> | MultiRemoteBrowser<'async'>
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
    const isBrowserstackSessionSpy = jest.spyOn(utils, 'isBrowserstackSession')
    const getA11yResultsSummarySpy = jest.spyOn(utils, 'getA11yResultsSummary')
    const getA11yResultsSpy = jest.spyOn(utils, 'getA11yResults')
    const isAccessibilityAutomationSessionSpy = jest.spyOn(utils, 'isAccessibilityAutomationSession')

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
        const _getCapabilityValueSpy = jest.spyOn(accessibilityHandler, '_getCapabilityValue').mockReturnValue(true)
        const validateCapsWithA11ySpy = jest.spyOn(utils, 'validateCapsWithA11y')
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
        (browser as BrowserAsync).getAccessibilityResultsSummary()
        expect(getA11yResultsSummarySpy).toBeCalledTimes(1)
    })

    it('calls getA11yResults', async () => {
        isBrowserstackSessionSpy.mockReturnValue(true)
        isAccessibilityAutomationSessionSpy.mockReturnValue(true)
        await accessibilityHandler.before();
        (browser as BrowserAsync).getAccessibilityResults()
        expect(getA11yResultsSpy).toBeCalledTimes(1)
    })
})

describe('beforeScenario', () => {
    let executeAsyncSpy: any
    let executeSpy: any

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
        executeAsyncSpy = jest.spyOn(browser, 'executeAsync')
        executeSpy = jest.spyOn(browser, 'execute')
        jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
    })

    it('should execute test started if page opened and can scan the page', async () => {
        const logInfoMock = jest.spyOn(log, 'info')
        jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

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

        expect(executeAsyncSpy).toBeCalledTimes(1)
        expect(logInfoMock.mock.calls[1][0])
            .toContain('Automate test case execution has started.')
    })

    it('should not execute test started if url is invalid', async () => {
        browser.getUrl = async () => {
            return ':data;'
        }

        jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)

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
        jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)

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

        expect(executeSpy).toBeCalledTimes(1)
    })

    it('should not execute test started if shouldRunTestHooks is false', async () => {
        accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return false })
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
        const logErrorMock = jest.spyOn(log, 'error')
        jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)
        accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return true })
        accessibilityHandler['sendTestStartEvent'] = jest.fn().mockImplementation(() => { throw new Error() })
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
            .toContain('Exception in starting accessibility automation scan for this test case Error')
    })
})

describe('afterScenario', () => {
    let executeAsyncSpy: any
    let accessibilityHandler: AccessibilityHandler

    beforeEach(() => {
        accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'framework', true, accessibilityOpts)
        executeAsyncSpy = jest.spyOn(browser, 'executeAsync')
        jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        jest.spyOn(utils, 'getUniqueIdentifierForCucumber').mockReturnValue('test title')
        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: true,
            scanTestForAccessibility: true
        }
        accessibilityHandler['sendTestStopEvent'] = jest.fn().mockImplementation(() => { return [] })
    })

    it('should execute test end if scanTestForAccessibility is true', async () => {
        const logInfoMock = jest.spyOn(log, 'info')

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
        accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return false })
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
        const logErrorMock = jest.spyOn(log, 'error')
        accessibilityHandler['sendTestStopEvent'] = jest.fn().mockImplementation(() => { throw new Error() })

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
            .toContain('Exception in starting accessibility automation scan for this test case Error')
    })
})

describe('beforeTest', () => {
    let executeAsyncSpy: any
    let executeSpy: any

    describe('mocha', () => {
        beforeEach(() => {
            accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'mocha', true, accessibilityOpts)
            jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
            jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
            jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

            executeAsyncSpy = jest.spyOn(browser, 'executeAsync')
            executeSpy = jest.spyOn(browser, 'execute')
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        it('should execute test started if page opened and can scan the page', async () => {
            const logInfoMock = jest.spyOn(log, 'info')
            jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)
            accessibilityHandler['sendTestStartEvent'] = jest.fn().mockImplementation(() => { return [] })

            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(accessibilityHandler['sendTestStartEvent']).toBeCalledTimes(1)
            expect(logInfoMock.mock.calls[1][0])
                .toContain('Automate test case execution has started.')
            jest.fn().mockRestore()
        })

        it('should not execute test started if url is invalid', async () => {
            browser.getUrl = async () => {
                return ':data;'
            }

            jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(0)
            expect(executeAsyncSpy).toBeCalledTimes(0)
        })

        it('should not execute test started if page opened but cannot start scan', async () => {
            jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(false)
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(1)
        })

        it('should not execute test started if shouldRunTestHooks is false', async () => {
            accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return false })
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(executeSpy).toBeCalledTimes(0)
        })

        it('should throw error in before test if exception occurs', async () => {
            const logErrorMock = jest.spyOn(log, 'error')
            jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)
            accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return true })
            accessibilityHandler['sendTestStartEvent'] = jest.fn().mockImplementation(() => { throw new Error() })
            await accessibilityHandler.beforeTest('suite title', { parent: 'parent', title: 'test' } as any)

            expect(logErrorMock.mock.calls[0][0])
                .toContain('Exception in starting accessibility automation scan for this test case Error')
            jest.fn().mockRestore()
            logErrorMock.mockClear()
        })
    })

    describe('jasmine', () => {
        let isBrowserstackSession: any
        beforeEach(() => {
            accessibilityHandler = new AccessibilityHandler(browser, caps, false, 'jasmine', true, accessibilityOpts)
            isBrowserstackSession = jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        it('should execute test started in case of jasmine', async () => {
            jest.spyOn(utils, 'shouldScanTestForAccessibility').mockReturnValue(true)

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
        executeAsyncSpy = jest.spyOn(browser, 'executeAsync')
        jest.spyOn(utils, 'isBrowserstackSession').mockReturnValue(true)
        jest.spyOn(utils, 'isAccessibilityAutomationSession').mockReturnValue(true)
        jest.spyOn(utils, 'getUniqueIdentifier').mockReturnValue('test title')

        accessibilityHandler['_testMetadata']['test title'] = {
            accessibilityScanStarted: true,
            scanTestForAccessibility: true
        }
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should execute test end if scanTestForAccessibility is true', async () => {
        const logInfoMock = jest.spyOn(log, 'info')
        await accessibilityHandler.afterTest('suite title', { parent: 'parent', title: 'test' } as any)

        expect(logInfoMock.mock.calls[1][0])
            .toContain('Accessibility testing for this test case has ended.')
    })

    it('should not return if accessibilityScanStarted is false', async () => {
        accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return false })
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
        const logErrorMock = jest.spyOn(log, 'error')
        accessibilityHandler['shouldRunTestHooks'] = jest.fn().mockImplementation(() => { return true })
        accessibilityHandler['sendTestStopEvent'] = jest.fn().mockImplementation(() => { throw new Error() })
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

        getUniqueIdentifierSpy = jest.spyOn(utils, 'getUniqueIdentifier')
        getUniqueIdentifierForCucumberSpy = jest.spyOn(utils, 'getUniqueIdentifierForCucumber')
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
