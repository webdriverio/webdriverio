import { describe, expect, beforeEach, test } from 'vitest'
import type { SelectorPerformanceData } from '../../src/mobileSelectorPerformanceOptimizer/types.js'
import * as store from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'

describe('mspo-store', () => {
    beforeEach(() => {
        store.clearStore()
    })

    describe('suite name', () => {
        test('should set and get current suite name', () => {
            expect(store.getCurrentSuiteName()).toBeUndefined()

            store.setCurrentSuiteName('My Test Suite')
            expect(store.getCurrentSuiteName()).toBe('My Test Suite')
        })

        test('should overwrite existing suite name', () => {
            store.setCurrentSuiteName('First Suite')
            expect(store.getCurrentSuiteName()).toBe('First Suite')

            store.setCurrentSuiteName('Second Suite')
            expect(store.getCurrentSuiteName()).toBe('Second Suite')
        })
    })

    describe('test file', () => {
        test('should set and get current test file', () => {
            expect(store.getCurrentTestFile()).toBeUndefined()

            store.setCurrentTestFile('test/spec.spec.ts')
            expect(store.getCurrentTestFile()).toBe('test/spec.spec.ts')
        })

        test('should overwrite existing test file', () => {
            store.setCurrentTestFile('test/file1.ts')
            expect(store.getCurrentTestFile()).toBe('test/file1.ts')

            store.setCurrentTestFile('test/file2.ts')
            expect(store.getCurrentTestFile()).toBe('test/file2.ts')
        })
    })

    describe('test name', () => {
        test('should set and get current test name', () => {
            expect(store.getCurrentTestName()).toBeUndefined()

            store.setCurrentTestName('My Test Name')
            expect(store.getCurrentTestName()).toBe('My Test Name')
        })

        test('should overwrite existing test name', () => {
            store.setCurrentTestName('First Test')
            expect(store.getCurrentTestName()).toBe('First Test')

            store.setCurrentTestName('Second Test')
            expect(store.getCurrentTestName()).toBe('Second Test')
        })
    })

    describe('performance data', () => {
        const createMockPerformanceData = (overrides?: Partial<SelectorPerformanceData>): SelectorPerformanceData => {
            return {
                testFile: 'test.spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                selector: '//xpath',
                selectorType: 'xpath',
                duration: 100,
                timestamp: Date.now(),
                ...overrides
            }
        }

        test('should add and get performance data', () => {
            expect(store.getPerformanceData()).toEqual([])

            const data1 = createMockPerformanceData({ selector: '//button' })
            const data2 = createMockPerformanceData({ selector: '//input' })

            store.addPerformanceData(data1)
            store.addPerformanceData(data2)

            const allData = store.getPerformanceData()
            expect(allData).toHaveLength(2)
            expect(allData[0]).toEqual(data1)
            expect(allData[1]).toEqual(data2)
        })

        test('should clear performance data', () => {
            const data1 = createMockPerformanceData()
            const data2 = createMockPerformanceData()

            store.addPerformanceData(data1)
            store.addPerformanceData(data2)
            expect(store.getPerformanceData()).toHaveLength(2)

            store.clearPerformanceData()
            expect(store.getPerformanceData()).toEqual([])
        })

        test('should maintain separate arrays for different data', () => {
            const data1 = createMockPerformanceData({ selector: '//button' })
            store.addPerformanceData(data1)

            const data2 = createMockPerformanceData({ selector: '//input' })
            store.addPerformanceData(data2)

            const allData = store.getPerformanceData()
            expect(allData).toHaveLength(2)
            expect(allData[0].selector).toBe('//button')
            expect(allData[1].selector).toBe('//input')
        })
    })

    describe('clearStore', () => {
        test('should clear all state', () => {
            store.setCurrentSuiteName('Test Suite')
            store.setCurrentTestFile('test.spec.ts')
            store.setCurrentTestName('Test Name')
            store.addPerformanceData({
                testFile: 'test.spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                selector: '//xpath',
                selectorType: 'xpath',
                duration: 100,
                timestamp: Date.now()
            })

            expect(store.getCurrentSuiteName()).toBe('Test Suite')
            expect(store.getCurrentTestFile()).toBe('test.spec.ts')
            expect(store.getCurrentTestName()).toBe('Test Name')
            expect(store.getPerformanceData()).toHaveLength(1)

            store.clearStore()

            expect(store.getCurrentSuiteName()).toBeUndefined()
            expect(store.getCurrentTestFile()).toBeUndefined()
            expect(store.getCurrentTestName()).toBeUndefined()
            expect(store.getPerformanceData()).toEqual([])
        })

        test('should clear state even when partially set', () => {
            store.setCurrentSuiteName('Test Suite')
            store.addPerformanceData({
                testFile: 'test.spec.ts',
                suiteName: 'Test Suite',
                testName: 'Test Name',
                selector: '//xpath',
                selectorType: 'xpath',
                duration: 100,
                timestamp: Date.now()
            })

            store.clearStore()

            expect(store.getCurrentSuiteName()).toBeUndefined()
            expect(store.getCurrentTestFile()).toBeUndefined()
            expect(store.getCurrentTestName()).toBeUndefined()
            expect(store.getPerformanceData()).toEqual([])
        })
    })
})

