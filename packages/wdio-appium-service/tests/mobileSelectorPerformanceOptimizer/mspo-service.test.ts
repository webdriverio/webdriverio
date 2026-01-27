import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import { SevereServiceError } from 'webdriverio'
import type { Options, Reporters } from '@wdio/types'
import logger from '@wdio/logger'

import SelectorPerformanceService from '../../src/mobileSelectorPerformanceOptimizer/mspo-service.js'
import * as utils from '../../src/mobileSelectorPerformanceOptimizer/utils/index.js'
import * as store from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'
import * as overwrite from '../../src/mobileSelectorPerformanceOptimizer/overwrite.js'
import type { AppiumServiceConfig } from '../../src/types.js'

const log = logger('@wdio/appium-service:selector-optimizer')

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

vi.mock('../../src/mobileSelectorPerformanceOptimizer/utils/index.js', async () => {
    const actual = await vi.importActual('../../src/mobileSelectorPerformanceOptimizer/utils/index.js')
    return {
        ...actual,
        extractSelectorFromArgs: vi.fn(),
        formatSelectorForDisplay: vi.fn(),
        getHighResTime: vi.fn(),
        findMostRecentUnmatchedUserCommand: vi.fn(),
        findMatchingInternalCommandTiming: vi.fn(),
        storePerformanceData: vi.fn(),
        isNativeContext: vi.fn(),
        isReporterRegistered: vi.fn().mockReturnValue(false),
        determineReportDirectory: vi.fn().mockReturnValue('/test/report/dir'),
        findSelectorLocation: vi.fn().mockReturnValue([])
    }
})

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

    const createDefaultOptions = (): AppiumServiceConfig => ({
        trackSelectorPerformance: {
            enabled: true,
            pageObjectPaths: ['./tests/pageobjects']
        }
    })
    const createAndInitializeService = async (options: AppiumServiceConfig = createDefaultOptions()) => {
        const service = new SelectorPerformanceService(options, mockConfig)
        await service.before({} as never, [] as never, mockBrowser)
        return service
    }

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
                'Expected format: { enabled: boolean, pageObjectPaths: string[], enableCliReport?: boolean, enableMarkdownReport?: boolean, reportPath?: string, maxLineLength?: number }'

            expect(() => {
                new SelectorPerformanceService({ trackSelectorPerformance: 'invalid' as any }, mockConfig)
            }).toThrow(new SevereServiceError(expectedError))
            expect(() => {
                new SelectorPerformanceService({ trackSelectorPerformance: [] as any }, mockConfig)
            }).toThrow(new SevereServiceError(expectedError))
        })

        test('should initialize with enabled state when enabled is true', () => {
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enabled']).toBe(true)
            // Defaults
            expect(service['_enableCliReport']).toBe(false)
            expect(service['_enableMarkdownReport']).toBe(false)
        })

        test('should initialize with custom options', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects'],
                    enableCliReport: true,
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enabled']).toBe(true)
            expect(service['_enableCliReport']).toBe(true)
        })

        test('should initialize enableCliReport to false by default', () => {
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enableCliReport']).toBe(false)
        })

        test('should initialize enableMarkdownReport to false by default', () => {
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enableMarkdownReport']).toBe(false)
        })

        test('should enable markdown report when enableMarkdownReport is true', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects'],
                    enableMarkdownReport: true
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)

            expect(service['_enableMarkdownReport']).toBe(true)
        })

        test('should call determineReportDirectory when enabled', () => {
            const options = {
                ...createDefaultOptions(),
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects'],
                    reportPath: '/custom/path'
                }
            }
            new SelectorPerformanceService(options, mockConfig)
            expect(vi.mocked(utils.determineReportDirectory)).toHaveBeenCalledWith('/custom/path', mockConfig, options)
        })

        test('should not call determineReportDirectory when disabled', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: false,
                    pageObjectPaths: []
                }
            }
            new SelectorPerformanceService(options, mockConfig)
            expect(vi.mocked(utils.determineReportDirectory)).not.toHaveBeenCalled()
        })

        test('should always call determineReportDirectory when enabled is true (enableReporter removed)', () => {
            // enableReporter has been removed - JSON is always written when enabled=true
            const options = {
                ...createDefaultOptions(),
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects'],
                    reportPath: '/custom/path'
                }
            }
            new SelectorPerformanceService(options, mockConfig)
            expect(vi.mocked(utils.determineReportDirectory)).toHaveBeenCalledWith('/custom/path', mockConfig, options)
        })

        test('should throw SevereServiceError when enabled but pageObjectPaths is not provided', () => {
            expect(() => {
                new SelectorPerformanceService({
                    trackSelectorPerformance: {
                        enabled: true
                    }
                } as any, mockConfig)
            }).toThrow(SevereServiceError)
            expect(() => {
                new SelectorPerformanceService({
                    trackSelectorPerformance: {
                        enabled: true
                    }
                } as any, mockConfig)
            }).toThrow('trackSelectorPerformance.pageObjectPaths is required when we want to track the selector performance.')
        })

        test('should throw SevereServiceError when enabled but pageObjectPaths is empty array', () => {
            expect(() => {
                new SelectorPerformanceService({
                    trackSelectorPerformance: {
                        enabled: true,
                        pageObjectPaths: []
                    }
                }, mockConfig)
            }).toThrow(SevereServiceError)
        })

        test('should not throw when enabled with valid pageObjectPaths', () => {
            expect(() => {
                new SelectorPerformanceService({
                    trackSelectorPerformance: {
                        enabled: true,
                        pageObjectPaths: ['./tests/pageobjects']
                    }
                }, mockConfig)
            }).not.toThrow()
        })

        test('should not throw when disabled even without pageObjectPaths', () => {
            expect(() => {
                new SelectorPerformanceService({
                    trackSelectorPerformance: {
                        enabled: false
                    }
                } as any, mockConfig)
            }).not.toThrow()
        })

        test('should store pageObjectPaths when provided', () => {
            const options = {
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects']
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            expect(service['_pageObjectPaths']).toEqual(['./tests/pageobjects'])
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

            const options = createDefaultOptions()
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
            expect((config.reporters![0] as [string, any])[1]).toEqual({ reportDirectory: service['_reportDirectory'] })
        })

        test('should not register reporter when already registered', async () => {
            vi.mocked(utils.isReporterRegistered).mockReturnValue(true)

            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            const config = { reporters: [] } as Options.Testrunner

            await service.beforeSession(config, {} as never, [] as never)

            expect(config.reporters).toHaveLength(0)
        })

        test('should always register reporter when enabled is true (enableReporter removed)', async () => {
            // enableReporter has been removed - reporter is always registered when enabled=true
            // to collect test context information for the JSON report
            vi.mocked(utils.isReporterRegistered).mockReturnValue(false)

            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            const config = { reporters: [] } as Options.Testrunner

            await service.beforeSession(config, {} as never, [] as never)

            expect(vi.mocked(utils.isReporterRegistered)).toHaveBeenCalled()
            expect(config.reporters).toHaveLength(1)
        })

        test('should initialize reporters array if not present', async () => {
            vi.mocked(utils.isReporterRegistered).mockReturnValue(false)

            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            const config = {} as Options.Testrunner

            await service.beforeSession(config, {} as never, [] as never)

            expect(config.reporters).toBeDefined()
            expect(Array.isArray(config.reporters)).toBe(true)
            expect(config.reporters!).toHaveLength(1)
        })
    })

    describe('before', () => {
        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.before({} as never, [] as never, mockBrowser)
            expect(log.info).not.toHaveBeenCalled()
        })

        test('should log BETA messages and enable for iOS', async () => {
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = true
            mockBrowser.isAndroid = false

            await service.before({} as never, [] as never, mockBrowser)

            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer (BETA)')
            expect(log.info).toHaveBeenCalledWith('   → All feedback is welcome!')
            expect(log.info).toHaveBeenCalledWith('   → Currently optimized for iOS (shows the most significant performance and stability gains)')
            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer enabled for iOS')
        })

        test('should disable service and log warning for Android', async () => {
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = false
            mockBrowser.isAndroid = true

            await service.before({} as never, [] as never, mockBrowser)

            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer (BETA)')
            expect(log.info).toHaveBeenCalledWith('   → All feedback is welcome!')
            expect(log.info).toHaveBeenCalledWith('   → Currently optimized for iOS (shows the most significant performance and stability gains)')
            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer is disabled for Android')
            expect(log.info).toHaveBeenCalledWith('   → Android support coming in a future release')
            expect(service['_enabled']).toBe(false)
        })

        test('should call overwriteUserCommands when enabled', async () => {
            const options = {
                ...createDefaultOptions(),
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects']
                }
            }
            const service = new SelectorPerformanceService(options, mockConfig)
            mockBrowser.isIOS = true
            mockBrowser.isAndroid = false

            await service.before({} as never, [] as never, mockBrowser)

            expect(vi.mocked(overwrite.overwriteUserCommands)).toHaveBeenCalledWith(mockBrowser, {
                browser: service['_browser'],
                isReplacingSelector: service['_isReplacingSelectorRef'],
                pageObjectPaths: ['./tests/pageobjects'],
            })
        })
    })

    describe('afterSession', () => {
        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.afterSession()
            expect(fs.mkdirSync).not.toHaveBeenCalled()
            expect(fs.writeFileSync).not.toHaveBeenCalled()
        })

        test('should always write worker data when enabled is true (enableReporter removed)', async () => {
            // enableReporter has been removed - JSON is always written when enabled=true
            vi.mocked(store.getPerformanceData).mockReturnValue([])

            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(fs.mkdirSync).toHaveBeenCalled()
            expect(fs.writeFileSync).toHaveBeenCalled()
        })

        test('should warn and return when report directory is not set', async () => {
            const warnSpy = vi.spyOn(log, 'warn')
            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = undefined

            await service.afterSession()

            expect(warnSpy).toHaveBeenCalledWith('Report directory not set, cannot write worker selector performance data')
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

            const options = createDefaultOptions()
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

            const options = createDefaultOptions()
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

            const options = createDefaultOptions()
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

            const options = createDefaultOptions()
            const service = new SelectorPerformanceService(options, mockConfig)
            service['_reportDirectory'] = '/test/report/dir'

            await service.afterSession()

            expect(log.error).toHaveBeenCalledWith('Failed to write worker selector performance data:', mockError)
        })
    })

    describe('beforeCommand', () => {
        let options: AppiumServiceConfig
        let xpath: string
        let formattedSelector: string

        beforeEach(() => {
            options = {
                trackSelectorPerformance: {
                    enabled: true,
                    pageObjectPaths: ['./tests/pageobjects']
                }
            }
            xpath = '//xpath'
            formattedSelector = 'formatted selector'
            vi.mocked(utils.isNativeContext).mockReturnValue(true)
            vi.mocked(utils.findSelectorLocation).mockReturnValue([])
        })

        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.beforeCommand('$', ['//xpath'])

            expect(vi.mocked(utils.extractSelectorFromArgs)).not.toHaveBeenCalled()
            expect(service['_commandTimings'].size).toBe(0)
        })

        test('should log warning and return when not in native context', async () => {
            vi.mocked(utils.isNativeContext).mockReturnValue(false)

            const service = await createAndInitializeService()
            await service.beforeCommand('$', ['//xpath'])

            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer is disabled for non-native context')
            expect(vi.mocked(utils.extractSelectorFromArgs)).not.toHaveBeenCalled()
        })

        describe('user commands', () => {
            test('should track user command with valid selector', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(xpath)
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()
                await service.beforeCommand('$', [xpath])

                expect(vi.mocked(utils.extractSelectorFromArgs)).toHaveBeenCalledWith([xpath])
                expect(vi.mocked(utils.formatSelectorForDisplay)).toHaveBeenCalledWith(xpath)
                expect(service['_commandTimings'].size).toBe(1)
                const timing = Array.from(service['_commandTimings'].values())[0]
                expect(timing.commandName).toBe('$')
                expect(timing.selector).toBe(xpath)
                expect(timing.formattedSelector).toBe(formattedSelector)
                expect(timing.isUserCommand).toBe(true)
            })

            test('should not track when selector is not extracted', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(null)

                const service = await createAndInitializeService()
                await service.beforeCommand('$', [])

                expect(service['_commandTimings'].size).toBe(0)
            })

            test('should not track when selector is not a string', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(123 as any)

                const service = await createAndInitializeService()
                await service.beforeCommand('$', [123])

                expect(service['_commandTimings'].size).toBe(0)
            })

            test('should track all user commands', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(xpath)
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()

                await service.beforeCommand('$', [xpath])
                await service.beforeCommand('$$', [xpath])
                await service.beforeCommand('custom$', [xpath])
                await service.beforeCommand('custom$$', [xpath])

                expect(service['_commandTimings'].size).toBe(4)
            })

            test('should not track non-user commands', async () => {
                const service = await createAndInitializeService()
                await service.beforeCommand('click', ['//xpath'])

                expect(vi.mocked(utils.extractSelectorFromArgs)).not.toHaveBeenCalled()
                expect(service['_commandTimings'].size).toBe(0)
            })
        })

        describe('internal commands', () => {
            test('should return early when args length is less than 2', async () => {
                const service = new SelectorPerformanceService(options, mockConfig)
                await service.before({} as never, [] as never, mockBrowser)
                await service.beforeCommand('findElement', ['xpath'])

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
            })

            test('should return early when not xpath selector', async () => {
                const service = new SelectorPerformanceService(options, mockConfig)
                await service.before({} as never, [] as never, mockBrowser)
                await service.beforeCommand('findElement', ['accessibility id', 'button'])

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
                expect(vi.mocked(utils.findMostRecentUnmatchedUserCommand)).not.toHaveBeenCalled()
            })

            test('should return early when value is not a string', async () => {
                const service = new SelectorPerformanceService(options, mockConfig)
                await service.before({} as never, [] as never, mockBrowser)
                await service.beforeCommand('findElement', ['xpath', 123])

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
            })

            test('should create timing entry when matching user command found', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(xpath)
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)
                vi.mocked(utils.findMostRecentUnmatchedUserCommand).mockReturnValue([
                    'timing-id',
                    {
                        commandName: '$',
                        selector: xpath,
                        formattedSelector,
                        startTime: 50,
                        timingId: 'timing-id',
                        isUserCommand: true
                    }
                ])

                const service = await createAndInitializeService()

                // First create a user command timing
                await service.beforeCommand('$', [xpath])

                // Then the internal command should match it
                await service.beforeCommand('findElement', ['xpath', xpath])

                expect(vi.mocked(utils.findMostRecentUnmatchedUserCommand)).toHaveBeenCalled()
                expect(service['_commandTimings'].size).toBe(2)

                const timings = Array.from(service['_commandTimings'].values())
                const internalTiming = timings.find(t => !t.isUserCommand)

                expect(internalTiming).toBeDefined()
                expect(internalTiming?.commandName).toBe('$')
                expect(internalTiming?.selectorType).toBe('xpath')
            })

            test('should not create timing entry when no matching user command found', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMostRecentUnmatchedUserCommand).mockReturnValue(undefined)

                const service = await createAndInitializeService()
                await service.beforeCommand('findElement', ['xpath', xpath])

                expect(service['_commandTimings'].size).toBe(0)
            })

            test('should work with findElements command', async () => {
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(xpath)
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)
                vi.mocked(utils.findMostRecentUnmatchedUserCommand).mockReturnValue([
                    'timing-id',
                    {
                        commandName: '$$',
                        selector: xpath,
                        formattedSelector,
                        startTime: 50,
                        timingId: 'timing-id',
                        isUserCommand: true
                    }
                ])

                const service = await createAndInitializeService()
                await service.beforeCommand('$$', [xpath])
                await service.beforeCommand('findElements', ['xpath', xpath])

                expect(service['_commandTimings'].size).toBe(2)
            })
        })

        describe('selector location tracking in beforeCommand', () => {
            test('should always call findSelectorLocation for user commands', async () => {
                const options: AppiumServiceConfig = {
                    trackSelectorPerformance: {
                        enabled: true,
                        pageObjectPaths: ['./tests/pageobjects'],
                    }
                }
                vi.mocked(store.getCurrentTestFile).mockReturnValue('test-file.ts')
                vi.mocked(utils.extractSelectorFromArgs).mockReturnValue(xpath)
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)
                vi.mocked(utils.findSelectorLocation).mockReturnValue([
                    { file: 'TabBar.ts', line: 3, isPageObject: true }
                ])

                const service = await createAndInitializeService(options)
                await service.beforeCommand('$', [xpath])

                expect(vi.mocked(utils.findSelectorLocation)).toHaveBeenCalledWith(
                    'test-file.ts',
                    xpath,
                    ['./tests/pageobjects']
                )

                const timing = Array.from(service['_commandTimings'].values())[0]
                expect(timing.lineNumber).toBe(3)
            })
        })
    })

    describe('afterCommand', () => {
        let options: AppiumServiceConfig
        let xpath: string
        let formattedSelector: string

        const createMockTiming = (overrides?: Partial<{
            commandName: string
            selector: string
            selectorType?: string
            startTime: number
            timingId: string
        }>) => {
            const timing: any = {
                commandName: overrides?.commandName || '$',
                selector: overrides?.selector !== undefined ? overrides.selector : xpath,
                formattedSelector,
                startTime: overrides?.startTime ?? 50,
                timingId: overrides?.timingId || 'timing-id',
                isUserCommand: false
            }
            if ('selectorType' in (overrides || {})) {
                if (overrides?.selectorType !== undefined) {
                    timing.selectorType = overrides.selectorType
                }
            } else {
                timing.selectorType = 'xpath'
            }
            return [overrides?.timingId || 'timing-id', timing] as [string, any]
        }

        beforeEach(() => {
            options = createDefaultOptions()
            xpath = '//xpath'
            formattedSelector = 'formatted selector'
            vi.mocked(utils.isNativeContext).mockReturnValue(true)
        })

        test('should do nothing when service is disabled', async () => {
            const service = new SelectorPerformanceService({}, mockConfig)
            await service.afterCommand('findElement', ['xpath', xpath], {})

            expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
            expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
        })

        test('should log warning and return when not in native context', async () => {
            vi.mocked(utils.isNativeContext).mockReturnValue(false)

            const service = await createAndInitializeService()
            await service.afterCommand('findElement', ['xpath', xpath], {})

            expect(log.info).toHaveBeenCalledWith('Mobile Selector Performance Optimizer is disabled for non-native context')
            expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
        })

        describe('internal commands', () => {
            test('should return early when args length is less than 2', async () => {
                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath'], {})

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
                expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
            })

            test('should return early when not xpath selector', async () => {
                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['accessibility id', 'button'], {})

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
                expect(vi.mocked(utils.findMatchingInternalCommandTiming)).not.toHaveBeenCalled()
            })

            test('should return early when value is not a string', async () => {
                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', 123], {})

                expect(vi.mocked(utils.formatSelectorForDisplay)).not.toHaveBeenCalled()
            })

            test('should return early when no matching timing found', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(undefined)

                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', xpath], {})

                expect(vi.mocked(utils.findMatchingInternalCommandTiming)).toHaveBeenCalled()
                expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
            })

            test('should return early when duration is negative', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(createMockTiming({ startTime: 100 }))
                vi.mocked(utils.getHighResTime).mockReturnValue(50) // Negative duration

                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', xpath], {})

                expect(service['_commandTimings'].size).toBe(0)
                expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
            })

            test('should return early when selector is missing', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(createMockTiming({ selector: '' }))
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', xpath], {})

                expect(service['_commandTimings'].size).toBe(0)
                expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
            })

            test('should return early when selectorType is missing', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                const timingWithoutSelectorType = createMockTiming()
                // Remove selectorType from the timing object to simulate missing property
                delete (timingWithoutSelectorType[1] as any).selectorType
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(timingWithoutSelectorType)
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', xpath], {})

                expect(service['_commandTimings'].size).toBe(0)
                expect(vi.mocked(utils.storePerformanceData)).not.toHaveBeenCalled()
            })

            test('should store performance data when all conditions pass', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(createMockTiming())
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()
                await service.afterCommand('findElement', ['xpath', xpath], {})

                expect(vi.mocked(utils.storePerformanceData)).toHaveBeenCalledWith(
                    expect.objectContaining({
                        commandName: '$',
                        selector: xpath,
                        selectorType: 'xpath'
                    }),
                    50, // duration: 100 - 50
                    expect.objectContaining({
                        testFile: expect.any(String),
                        suiteName: expect.any(String),
                        testName: expect.any(String)
                    })
                )
                expect(service['_commandTimings'].size).toBe(0)
            })

            test('should work with findElements command', async () => {
                vi.mocked(utils.formatSelectorForDisplay).mockReturnValue(formattedSelector)
                vi.mocked(utils.findMatchingInternalCommandTiming).mockReturnValue(createMockTiming({ commandName: '$$' }))
                vi.mocked(utils.getHighResTime).mockReturnValue(100)

                const service = await createAndInitializeService()
                await service.afterCommand('findElements', ['xpath', xpath], [])

                expect(vi.mocked(utils.storePerformanceData)).toHaveBeenCalled()
                expect(service['_commandTimings'].size).toBe(0)
            })
        })
    })
})

