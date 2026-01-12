import { describe, expect, test } from 'vitest'
import type { Options } from '@wdio/types'
import { isSilentLogLevel } from '../../../src/mobileSelectorPerformanceOptimizer/utils/config.js'

describe('config utils', () => {
    describe('isSilentLogLevel', () => {
        test('should return true when config logLevel is silent', () => {
            const config = { logLevel: 'silent' } as Options.Testrunner
            expect(isSilentLogLevel(config)).toBe(true)
        })

        test('should return false when config logLevel is not silent', () => {
            const config = { logLevel: 'info' } as Options.Testrunner
            expect(isSilentLogLevel(config)).toBe(false)
        })

        test('should return false when config is undefined', () => {
            expect(isSilentLogLevel()).toBe(false)
        })

        test('should default to info when logLevel is not set in config', () => {
            const config = {} as Options.Testrunner
            expect(isSilentLogLevel(config)).toBe(false)
        })
    })
})
