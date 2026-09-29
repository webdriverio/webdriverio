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
    })

    describe('test file', () => {
        test('should set and get current test file', () => {
            expect(store.getCurrentTestFile()).toBeUndefined()

            store.setCurrentTestFile('test/spec.spec.ts')
            expect(store.getCurrentTestFile()).toBe('test/spec.spec.ts')
        })
    })

    describe('test name', () => {
        test('should set and get current test name', () => {
            expect(store.getCurrentTestName()).toBeUndefined()

            store.setCurrentTestName('My Test Name')
            expect(store.getCurrentTestName()).toBe('My Test Name')
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

        test('should clear performance data without clearing context', () => {
            store.setCurrentSuiteName('Test Suite')
            store.addPerformanceData(createMockPerformanceData())
            store.addPerformanceData(createMockPerformanceData())

            store.clearPerformanceData()

            expect(store.getPerformanceData()).toEqual([])
            expect(store.getCurrentSuiteName()).toBe('Test Suite')
        })
    })

    describe('clearStore', () => {
        test('should clear all state', () => {
            store.setCurrentSuiteName('Test Suite')
            store.setCurrentTestFile('test.spec.ts')
            store.setCurrentTestName('Test Name')
            store.setCurrentDeviceName('Pixel')
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
            expect(store.getCurrentDeviceName()).toBe('Pixel')
            expect(store.getPerformanceData()).toHaveLength(1)

            store.clearStore()

            expect(store.getCurrentSuiteName()).toBeUndefined()
            expect(store.getCurrentTestFile()).toBeUndefined()
            expect(store.getCurrentTestName()).toBeUndefined()
            expect(store.getCurrentDeviceName()).toBeUndefined()
            expect(store.getPerformanceData()).toEqual([])
        })
    })
})
