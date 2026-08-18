import { describe, expect, test, vi } from 'vitest'
import { isNativeContext } from '../../../src/mobileSelectorPerformanceOptimizer/utils/browser-utils.js'

describe('browser-utils', () => {
    describe('isNativeContext', () => {
        test('should return false when browser is undefined', () => {
            expect(isNativeContext(undefined)).toBe(false)
        })

        test('should return true when isNativeContext is true', () => {
            const browser = {
                isNativeContext: true
            } as any
            expect(isNativeContext(browser)).toBe(true)
        })

        test('should return false when isNativeContext is false', () => {
            const browser = {
                isNativeContext: false
            } as any
            expect(isNativeContext(browser)).toBe(false)
        })

        test('should return false when isNativeContext is undefined', () => {
            const browser = {} as any
            expect(isNativeContext(browser)).toBe(false)
        })

        test('should return false for MultiRemote browser', () => {
            const browser = {
                instances: ['browser1', 'browser2'],
                isNativeContext: true
            } as any

            expect(isNativeContext(browser)).toBe(false)
        })

        test('should return false when checking context throws error', () => {
            const browser = {
                get isNativeContext() {
                    throw new Error('Context check failed')
                }
            } as any

            expect(isNativeContext(browser)).toBe(false)
        })
    })
})
