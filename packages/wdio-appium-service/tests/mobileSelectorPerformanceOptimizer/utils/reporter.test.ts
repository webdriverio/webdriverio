import { normalize } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { Reporters, Options } from '@wdio/types'
import type { AppiumServiceConfig } from '../../../src/types.js'
import {
    isReporterRegistered,
    determineReportDirectory
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/reporter.js'

describe('reporter utils', () => {
    describe('isReporterRegistered', () => {
        test('should return true when reporter class name matches', () => {
            class MyReporter {}
            const reporters: Reporters.ReporterEntry[] = [
                MyReporter as unknown as Reporters.ReporterClass
            ]
            expect(isReporterRegistered(reporters, 'MyReporter')).toBe(true)
        })

        test('should return true when reporter in array matches', () => {
            class MyReporter {}
            const reporters: Reporters.ReporterEntry[] = [
                [MyReporter as unknown as Reporters.ReporterClass, {}]
            ]
            expect(isReporterRegistered(reporters, 'MyReporter')).toBe(true)
        })

        test('should return false when reporter not found', () => {
            class OtherReporter {}
            const reporters: Reporters.ReporterEntry[] = [
                OtherReporter as unknown as Reporters.ReporterClass
            ]
            expect(isReporterRegistered(reporters, 'MyReporter')).toBe(false)
        })

        test('should return false for empty reporters array', () => {
            expect(isReporterRegistered([], 'MyReporter')).toBe(false)
        })

        test('should handle non-function reporter entries', () => {
            const reporters: Reporters.ReporterEntry[] = [
                'spec' as unknown as Reporters.ReporterClass
            ]
            expect(isReporterRegistered(reporters, 'MyReporter')).toBe(false)
        })

        test('should handle array with non-function first element', () => {
            const reporters: Reporters.ReporterEntry[] = [
                ['spec', {}]
            ]
            expect(isReporterRegistered(reporters, 'MyReporter')).toBe(false)
        })
    })

    describe('determineReportDirectory', () => {
        const originalCwd = process.cwd()

        test('should use reportPath when provided (absolute)', () => {
            const result = determineReportDirectory('/absolute/path')
            expect(result).toBe('/absolute/path')
        })

        test('should use reportPath when provided (relative)', () => {
            const result = determineReportDirectory('relative/path')
            expect(result).toContain(normalize('relative/path'))
            expect(result).toContain(originalCwd)
        })

        test('should use config.outputDir when reportPath not provided (absolute)', () => {
            const config = { outputDir: '/config/output' } as Options.Testrunner
            const result = determineReportDirectory(undefined, config)
            expect(result).toBe('/config/output')
        })

        test('should use config.outputDir when reportPath not provided (relative)', () => {
            const config = { outputDir: 'config/output' } as Options.Testrunner
            const result = determineReportDirectory(undefined, config)
            expect(result).toContain(normalize('config/output'))
            expect(result).toContain(originalCwd)
        })

        test('should use appiumServiceOptions.logPath when no reportPath or outputDir (absolute)', () => {
            const appiumOptions = { logPath: '/appium/log' } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, undefined, appiumOptions)
            expect(result).toBe('/appium/log')
        })

        test('should use appiumServiceOptions.logPath when no reportPath or outputDir (relative)', () => {
            const appiumOptions = { logPath: 'appium/log' } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, undefined, appiumOptions)
            expect(result).toContain(normalize('appium/log'))
            expect(result).toContain(originalCwd)
        })

        test('should use directory from appiumServiceOptions.args.log (absolute)', () => {
            const appiumOptions = { args: { log: '/appium/logs/app.log' } } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, undefined, appiumOptions)
            expect(result).toBe('/appium/logs')
        })

        test('should use directory from appiumServiceOptions.args.log (relative)', () => {
            const appiumOptions = { args: { log: 'appium/logs/app.log' } } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, undefined, appiumOptions)
            expect(result).toContain(normalize('appium/logs'))
            expect(result).toContain(originalCwd)
        })

        test('should prioritize reportPath over config.outputDir', () => {
            const config = { outputDir: '/config/output' } as Options.Testrunner
            const result = determineReportDirectory('/report/path', config)
            expect(result).toBe('/report/path')
        })

        test('should prioritize config.outputDir over appiumServiceOptions.logPath', () => {
            const config = { outputDir: '/config/output' } as Options.Testrunner
            const appiumOptions = { logPath: '/appium/log' } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, config, appiumOptions)
            expect(result).toBe('/config/output')
        })

        test('should prioritize appiumServiceOptions.logPath over args.log', () => {
            const appiumOptions = {
                logPath: '/appium/log',
                args: { log: '/appium/args.log' }
            } as AppiumServiceConfig
            const result = determineReportDirectory(undefined, undefined, appiumOptions)
            expect(result).toBe('/appium/log')
        })

        test('should throw error when no paths provided', () => {
            expect(() => {
                determineReportDirectory()
            }).toThrow('JSON report cannot be created')
        })

        test('should throw error when all options are undefined', () => {
            expect(() => {
                determineReportDirectory(undefined, undefined, undefined)
            }).toThrow('Please provide one of the following')
        })

        test('should throw error with helpful message', () => {
            expect(() => {
                determineReportDirectory()
            }).toThrow(/reportPath[\s\S]*outputDir[\s\S]*logPath[\s\S]*log/)
        })
    })
})
