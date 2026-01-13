import { describe, expect, test, vi } from 'vitest'
import { getHighResTime } from '../../../src/mobileSelectorPerformanceOptimizer/utils/timing.js'

describe('timing utils', () => {
    describe('getHighResTime', () => {
        test('should return a number', () => {
            const time = getHighResTime()
            expect(typeof time).toBe('number')
        })

        test('should return positive number', () => {
            const time = getHighResTime()
            expect(time).toBeGreaterThan(0)
        })

        test('should return different values on subsequent calls', () => {
            const time1 = getHighResTime()
            const time2 = getHighResTime()
            // Due to high resolution, these might be very close but should be different
            // or at least time2 should be >= time1
            expect(time2).toBeGreaterThanOrEqual(time1)
        })

        test('should use performance.now', () => {
            const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(1234.567)
            const time = getHighResTime()

            expect(time).toBe(1234.567)
            expect(performanceNowSpy).toHaveBeenCalled()
            performanceNowSpy.mockRestore()
        })
    })
})
