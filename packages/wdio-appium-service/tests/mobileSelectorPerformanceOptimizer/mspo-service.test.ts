import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import { SevereServiceError } from 'webdriverio'
import type { Options, Reporters } from '@wdio/types'
import logger from '@wdio/logger'

import SelectorPerformanceService from '../../src/mobileSelectorPerformanceOptimizer/mspo-service.js'
import * as utils from '../../src/mobileSelectorPerformanceOptimizer/utils.js'
import * as store from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'
import * as overwrite from '../../src/mobileSelectorPerformanceOptimizer/overwrite.js'

const log = logger('@wdio/appium-service')

// Mock all dependencies
vi.mock('node:fs', () => ({
    default: {
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}))

vi.mock('node:path', () => ({
    default: {
        join: vi.fn((...args: string[]) => args.join('/'))
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/utils.js', () => ({
    extractSelectorFromArgs: vi.fn(),
    formatSelectorForDisplay: vi.fn(),
    getHighResTime: vi.fn(),
    findOptimizedSelector: vi.fn(),
    findMostRecentUnmatchedUserCommand: vi.fn(),
    findMatchingInternalCommandTiming: vi.fn(),
    storePerformanceData: vi.fn(),
    isNativeContext: vi.fn(),
    isSilentLogLevel: vi.fn().mockReturnValue(false),
    isReporterRegistered: vi.fn().mockReturnValue(false),
    determineReportDirectory: vi.fn().mockReturnValue('/test/report/dir')
}))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/mspo-store.js', () => ({
    getCurrentTestFile: vi.fn().mockReturnValue('test-file.ts'),
    getCurrentSuiteName: vi.fn().mockReturnValue('Test Suite'),
    getCurrentTestName: vi.fn().mockReturnValue('Test Name'),
    getPerformanceData: vi.fn().mockReturnValue([]),
    clearStore: vi.fn()
}))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/mspo-reporter.js', () => ({
    default: class MockReporter {}
}))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/overwrite.js', () => ({
    overwriteUserCommands: vi.fn()
}))

describe('SelectorPerformanceService', () => {
    let mockBrowser: WebdriverIO.Browser
    let mockConfig: Options.Testrunner

    beforeEach(() => {
        vi.clearAllMocks()

        mockBrowser = {
            isIOS: true,
            isAndroid: false
        } as unknown as WebdriverIO.Browser

        mockConfig = {
            reporters: []
        } as Options.Testrunner

        // Reset process.pid mock
        Object.defineProperty(process, 'pid', {
            value: 12345,
            writable: true
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        test('should initialize with disabled state when trackSelectorPerformance is undefined', () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            expect(service['_enabled']).toBe(false)
        })

        test('should initialize with disabled state when trackSelectorPerformance is null', () => {
            const service = new SelectorPerformanceService({ trackSelectorPerformance: null as any }, mockConfig)
            expect(service['_enabled']).toBe(false)
        })

        test('should throw error when trackSelectorPerformance is not an object', () => {
            const expectedError = 'trackSelectorPerformance must be an object. ' +
                'Expected format: { enabled: boolean, usePageSource?: boolean, replaceWithOptimizedSelector?: boolean }'

            expect(() => {
                new SelectorPerformanceService({ trackSelectorPerformance: 'invalid' as any }, mockConfig)
            }).toThrow(new SevereServiceError(expectedError))
            expect(() => {
                new SelectorPerformanceService({ trackSelectorPerformance: [] as any }, mockConfig)
            }).toThrow(new SevereServiceError(expectedError))
        })

        test('should initialize with enabled state when enabled is true', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enabled']).toBe(true)
            // Defaults to true when not explicitly set
            expect(service['_usePageSource']).toBe(true)
            expect(service['_replaceWithOptimized']).toBe(true)
            expect(service['_enableReporter']).toBe(true)
        })

        test('should initialize with custom options', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    usePageSource: false,
                    replaceWithOptimizedSelector: false,
                    enableReporter: false,
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enabled']).toBe(true)
            expect(service['_usePageSource']).toBe(false)
            expect(service['_replaceWithOptimized']).toBe(false)
            expect(service['_enableReporter']).toBe(false)
        })

        test('should call determineReportDirectory when enabled', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    reportPath: '/custom/path'
                }
            }
            new SelectorPerformanceService(options, mockConfig)
            expect(vi.mocked(utils.determineReportDirectory)).toHaveBeenCalledWith('/custom/path', mockConfig, options)
        })

        test('should not call determineReportDirectory when disabled', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: false
                }
            }
            new SelectorPerformanceService(options, mockConfig)
            expect(vi.mocked(utils.determineReportDirectory)).not.toHaveBeenCalled()
        })
    })

    describe('beforeSession', () => {
        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            const config = { reporters: [] } as Options.Testrunner
            await service.beforeSession(config, {} as never, [] as never)
            expect(config.reporters).toEqual([])
        })

        test('should register reporter when enabled and not already registered', async () => {
            vi.mocked(utils.isReporterRegistered).mockReturnValue(false)

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            const config = { reporters: [] } as Options.Testrunner

            await service.beforeSession(config, {} as never, [] as never)

            expect(vi.mocked(utils.isReporterRegistered)).toHaveBeenCalledWith(
                expect.any(Array),
                'MobileSelectorPerformanceReporter'
            )
            expect(config.reporters).toBeDefined()
            expect(config.reporters!).toHaveLength(1)
            expect(config.reporters![0]).toHaveLength(2)
            expect(config.reporters![0][1]).toEqual({ reportDirectory: service['_reportDirectory'] })
        })

        test('should not register reporter when already registered', async () => {
            vi.mocked(utils.isReporterRegistered).mockReturnValue(true)

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            const config = { reporters: [] } as Options.Testrunner

            await service.beforeSession(config, {} as never, [] as never)

            expect(config.reporters).toHaveLength(0)
        })
    })

    describe('before', () => {
        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.before({} as never, [] as never, mockBrowser)
            expect(log.info).not.toHaveBeenCalled()
        })

        test('should log BETA messages and enable for iOS', async () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = true
            mockBrowser.isAndroid = false

            await service.before({} as never, [] as never, mockBrowser)

            expect(log.info).toHaveBeenCalledWith('🧪 Mobile Selector Performance Optimizer (BETA)')
            expect(log.info).toHaveBeenCalledWith('   → All feedback is welcome!')
            expect(log.info).toHaveBeenCalledWith('   → Currently optimized for iOS (shows the most significant performance and stability gains)')
            expect(log.info).toHaveBeenCalledWith('✅ Mobile Selector Performance Optimizer enabled for iOS')
        })

        test('should disable service and log warning for Android', async () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = false
            mockBrowser.isAndroid = true

            await service.before({} as never, [] as never, mockBrowser)

            expect(log.info).toHaveBeenCalledWith('🧪 Mobile Selector Performance Optimizer (BETA)')
            expect(log.info).toHaveBeenCalledWith('   → All feedback is welcome!')
            expect(log.info).toHaveBeenCalledWith('   → Currently optimized for iOS (shows the most significant performance and stability gains)')
            expect(log.info).toHaveBeenCalledWith('⚠️  Mobile Selector Performance Optimizer is disabled for Android')
            expect(log.info).toHaveBeenCalledWith('   → Android support coming in a future release')
            expect(service['_enabled']).toBe(false)
        })

        test('should call overwriteUserCommands when enabled and replaceWithOptimized is true', async () => {
            vi.mocked(utils.isSilentLogLevel).mockReturnValue(false)

            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    replaceWithOptimizedSelector: true,
                    usePageSource: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = true
            mockBrowser.isAndroid = false

            await service.before({} as never, [] as never, mockBrowser)

            expect(vi.mocked(overwrite.overwriteUserCommands)).toHaveBeenCalledWith(mockBrowser, {
                usePageSource: true,
                browser: service['_browser'],
                isReplacingSelector: service['_isReplacingSelectorRef'],
                isSilentLogLevel: false
            })
            expect(vi.mocked(utils.isSilentLogLevel)).toHaveBeenCalledWith(mockConfig)
        })

        test('should not call overwriteUserCommands when replaceWithOptimized is false', async () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    replaceWithOptimizedSelector: false
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = true
            mockBrowser.isAndroid = false

            await service.before({} as never, [] as never, mockBrowser)

            expect(vi.mocked(overwrite.overwriteUserCommands)).not.toHaveBeenCalled()
        })
    })

    describe('afterSession', () => {
        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.afterSession()
            expect(fs.mkdirSync).not.toHaveBeenCalled()
            expect(fs.writeFileSync).not.toHaveBeenCalled()
        })

        test('should warn and return when report directory is not set', async () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = undefined

            await service.afterSession()

            expect(log.warn).toHaveBeenCalledWith('Report directory not set, cannot write worker selector performance data')
            expect(fs.mkdirSync).not.toHaveBeenCalled()
            expect(fs.writeFileSync).not.toHaveBeenCalled()
        })

        test('should write performance data to file', async () => {
            const mockData = [
                {
                    testFile: 'test1.ts',
                    suiteName: 'Suite 1',
                    testName: 'Test 1',
                    selector: '//xpath',
                    selectorType: 'xpath',
                    duration: 100,
                    timestamp: Date.now()
                }
            ]
            vi.mocked(store.getPerformanceData).mockReturnValue(mockData)

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(vi.mocked(store.getPerformanceData)).toHaveBeenCalled()
            expect(path.join).toHaveBeenCalledWith('/test/report/dir', 'selector-performance-worker-data')
            expect(path.join).toHaveBeenCalledWith('/test/report/dir/selector-performance-worker-data', `worker-data-${process.pid}.json`)
            expect(fs.mkdirSync).toHaveBeenCalledWith('/test/report/dir/selector-performance-worker-data', { recursive: true })
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                `/test/report/dir/selector-performance-worker-data/worker-data-${process.pid}.json`,
                JSON.stringify(mockData, null, 2)
            )
            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('Worker selector performance data written to:')
            )
        })

        test('should handle empty performance data', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue([])

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                `/test/report/dir/selector-performance-worker-data/worker-data-${process.pid}.json`,
                JSON.stringify([], null, 2)
            )
            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('(0 entries)')
            )
        })

        test('should handle file write errors', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue([])
            const mockError = new Error('File write failed')
            vi.mocked(fs.writeFileSync).mockImplementation(() => {
                throw mockError
            })

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(log.error).toHaveBeenCalledWith('Failed to write worker selector performance data:', mockError)
        })

        test('should handle directory creation errors', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue([])
            const mockError = new Error('Directory creation failed')
            vi.mocked(fs.mkdirSync).mockImplementation(() => {
                throw mockError
            })

            const options = {
                trackSelectorPerformance: {
                    enabled: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(log.error).toHaveBeenCalledWith('Failed to write worker selector performance data:', mockError)
        })
    })

    describe('beforeCommand', () => {
        test.skip('should be tested separately', () => {
            // Skipped as requested
        })
    })

    describe('afterCommand', () => {
        test.skip('should be tested separately', () => {
            // Skipped as requested
        })
    })
})

