import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import {
    formatSelectorForDisplay,
    formatSelectorLocations,
    logOptimizationConclusion
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/formatting.js'
import type { SelectorLocation } from '../../../src/mobileSelectorPerformanceOptimizer/utils/selector-location.js'

describe('formatting utils', () => {
    describe('formatSelectorForDisplay', () => {
        test('should return selector as-is when under max length', () => {
            const selector = '//button[@id="test"]'
            expect(formatSelectorForDisplay(selector)).toBe(selector)
        })

        test('should truncate long selectors', () => {
            const longSelector = 'a'.repeat(150)
            const result = formatSelectorForDisplay(longSelector, 100)
            expect(result).toBe('a'.repeat(100) + '...')
            expect(result.length).toBe(103)
        })

        test('should handle custom max length', () => {
            const selector = 'a'.repeat(60)
            const result = formatSelectorForDisplay(selector, 50)
            expect(result).toBe('a'.repeat(50) + '...')
        })

        test('should convert object to string', () => {
            const selector = { id: 'test', tag: 'button' }
            expect(formatSelectorForDisplay(selector)).toBe('[object Object]')
        })
    })

    describe('formatSelectorLocations', () => {
        test('should return empty string for empty locations', () => {
            expect(formatSelectorLocations([])).toBe('')
        })

        test('should format single location', () => {
            const locations: SelectorLocation[] = [{
                file: 'test/spec.ts',
                line: 42,
                isPageObject: false
            }]
            expect(formatSelectorLocations(locations)).toBe(' at test/spec.ts:42')
        })

        test('should format single page object location', () => {
            const locations: SelectorLocation[] = [{
                file: 'test/page.ts',
                line: 10,
                isPageObject: true
            }]
            expect(formatSelectorLocations(locations)).toBe(' at test/page.ts (page object):10')
        })

        test('should format multiple locations', () => {
            const locations: SelectorLocation[] = [
                { file: 'test/spec.ts', line: 42, isPageObject: false },
                { file: 'test/page.ts', line: 10, isPageObject: true }
            ]
            const result = formatSelectorLocations(locations)
            expect(result).toContain('at multiple locations')
            expect(result).toContain('test/spec.ts:42')
            expect(result).toContain('test/page.ts (page object):10')
            expect(result).toContain('found in 2 files')
        })
    })

    describe('logOptimizationConclusion', () => {
        let consoleLogSpy: ReturnType<typeof vi.spyOn>

        beforeEach(() => {
            consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        })

        afterEach(() => {
            consoleLogSpy.mockRestore()
        })

        test('should log positive improvement', () => {
            logOptimizationConclusion(
                50, // 50ms faster
                25, // 25% improvement
                '//button',
                '~myButton'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('50.00ms faster')
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('25.0% improvement')
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Consider using the optimized selector')
            )
        })

        test('should log negative improvement (slower)', () => {
            logOptimizationConclusion(
                -20, // 20ms slower
                -10, // 10% slower
                '//button',
                '~myButton'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('20.00ms slower')
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('no improvement')
            )
        })

        test('should log same performance', () => {
            logOptimizationConclusion(
                0, // no difference
                0,
                '//button',
                '~myButton'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('same performance')
            )
        })

        test('should use single quotes for iOS class chain', () => {
            logOptimizationConclusion(
                50,
                25,
                '//button',
                '-ios class chain:**/XCUIElementTypeButton'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("'-ios class chain:")
            )
        })

        test('should use double quotes for accessibility ID', () => {
            logOptimizationConclusion(
                50,
                25,
                '//button',
                '~myButton'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('"~myButton"')
            )
        })

        test('should include location info when provided', () => {
            logOptimizationConclusion(
                50,
                25,
                '//button',
                '~myButton',
                ' at test/spec.ts:42'
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('at test/spec.ts:42')
            )
        })
    })
})
