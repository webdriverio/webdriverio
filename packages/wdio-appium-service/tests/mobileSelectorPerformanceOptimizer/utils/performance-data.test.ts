import { describe, expect, test, vi } from 'vitest'
import type { CommandTiming, TestContext } from '../../../src/mobileSelectorPerformanceOptimizer/types.js'
import {
    createOptimizedSelectorData,
    storePerformanceData
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/performance-data.js'
import * as store from '../../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/mspo-store.js', async () => {
    const actual = await vi.importActual('../../../src/mobileSelectorPerformanceOptimizer/mspo-store.js')
    return {
        ...actual,
        addPerformanceData: vi.fn()
    }
})

describe('performance-data utils', () => {
    describe('createOptimizedSelectorData', () => {
        test('should create optimized selector data with positive improvement', () => {
            const testContext: TestContext = {
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                lineNumber: 42,
                selectorFile: 'test/page.ts'
            }

            const result = createOptimizedSelectorData(
                testContext,
                '//button',
                100, // original duration
                '~myButton',
                50 // optimized duration
            )

            expect(result).toMatchObject({
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                lineNumber: 42,
                selectorFile: 'test/page.ts',
                selector: '//button',
                selectorType: 'xpath',
                duration: 100,
                optimizedSelector: '~myButton',
                optimizedDuration: 50,
                improvementMs: 50,
                improvementPercent: 50
            })
            expect(result.timestamp).toBeDefined()
        })

        test('should handle negative improvement (slower)', () => {
            const testContext: TestContext = {
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name'
            }

            const result = createOptimizedSelectorData(
                testContext,
                '//button',
                50,
                '~myButton',
                100
            )

            expect(result.improvementMs).toBe(-50)
            expect(result.improvementPercent).toBe(-100)
        })

        test('should handle zero improvement', () => {
            const testContext: TestContext = {
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name'
            }

            const result = createOptimizedSelectorData(
                testContext,
                '//button',
                100,
                '~myButton',
                100
            )

            expect(result.improvementMs).toBe(0)
            expect(result.improvementPercent).toBe(0)
        })

        test('should handle zero original duration', () => {
            const testContext: TestContext = {
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name'
            }

            const result = createOptimizedSelectorData(
                testContext,
                '//button',
                0,
                '~myButton',
                50
            )

            expect(result.improvementMs).toBe(-50)
            expect(result.improvementPercent).toBe(0) // Avoid division by zero
        })

        test('should use "unknown" when testFile is undefined', () => {
            const testContext: TestContext = {
                testFile: undefined,
                suiteName: 'Test Suite',
                testName: 'Test Name'
            }

            const result = createOptimizedSelectorData(
                testContext,
                '//button',
                100,
                '~myButton',
                50
            )

            expect(result.testFile).toBe('unknown')
        })
    })

    describe('storePerformanceData', () => {
        test('should call addPerformanceData with correct data', () => {
            const timing: CommandTiming = {
                startTime: 1000,
                commandName: '$',
                selector: '//button',
                formattedSelector: '//button',
                selectorType: 'xpath',
                timingId: 'test-id',
                isUserCommand: true,
                lineNumber: 42
            }

            const testContext: TestContext = {
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                lineNumber: 42
            }

            storePerformanceData(timing, 150, testContext)

            expect(store.addPerformanceData).toHaveBeenCalledWith({
                testFile: 'test/spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                lineNumber: 42,
                selector: '//button',
                selectorType: 'xpath',
                duration: 150,
                timestamp: expect.any(Number)
            })
        })

        test('should handle unknown testFile', () => {
            const timing: CommandTiming = {
                startTime: 1000,
                commandName: '$',
                selector: '//button',
                formattedSelector: '//button',
                selectorType: 'xpath',
                timingId: 'test-id',
                isUserCommand: true
            }

            const testContext: TestContext = {
                suiteName: 'Test Suite',
                testName: 'Test Name'
            }

            storePerformanceData(timing, 150, testContext)

            expect(store.addPerformanceData).toHaveBeenCalledWith(
                expect.objectContaining({
                    testFile: 'unknown'
                })
            )
        })
    })
})
