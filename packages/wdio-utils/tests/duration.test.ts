import { describe, it, expect, beforeEach, vi } from 'vitest'
import duration, { formatDuration } from '../src/duration.js'

describe('duration', () => {
    beforeEach(() => {
        duration.reset()
        vi.clearAllMocks()
    })

    describe('formatDuration', () => {
        it('should format milliseconds correctly', () => {
            expect(formatDuration(0)).toBe('0ms')
            expect(formatDuration(50)).toBe('50ms')
            expect(formatDuration(999)).toBe('999ms')
        })

        it('should format seconds correctly', () => {
            expect(formatDuration(1000)).toBe('1.0s')
            expect(formatDuration(1500)).toBe('1.5s')
            expect(formatDuration(12000)).toBe('12.0s')
        })

        it('should format minutes correctly', () => {
            expect(formatDuration(60000)).toBe('1.0m')
            expect(formatDuration(90000)).toBe('1.5m')
            expect(formatDuration(125000)).toBe('2.1m')
        })
    })

    describe('start and end', () => {
        it('should measure basic timing', () => {
            duration.start('test')
            const durationValue = duration.end('test')

            expect(typeof durationValue).toBe('number')
            expect(durationValue).toBeGreaterThanOrEqual(0)
        })

        it('should return 0 for non-existent phase', () => {
            expect(duration.end('nonexistent')).toBe(0)
        })

        it('should handle multiple phases independently', () => {
            duration.start('setup')
            duration.start('execute')

            const setupDuration = duration.end('setup')
            const executeDuration = duration.end('execute')

            expect(setupDuration).toBeGreaterThanOrEqual(0)
            expect(executeDuration).toBeGreaterThanOrEqual(0)
        })

        it('should clean up timers after measuring', () => {
            duration.start('test')
            duration.end('test')

            expect(duration.end('test')).toBe(0)
        })
    })

    describe('getSummary method', () => {
        it('should return formatted duration string', () => {
            duration.start('setup')
            duration.end('setup')
            duration.start('execute')
            duration.end('execute')

            const summaryText = duration.getSummary()

            expect(typeof summaryText).toBe('string')
            expect(summaryText).toMatch(/^.* \(setup .*, prepare .*, execute .*, complete .*\)$/)
        })
    })

    describe('reset functionality', () => {
        it('should reset all timers and durations', () => {
            duration.start('setup')
            duration.end('setup')
            duration.start('execute')

            duration.reset()

            // After reset, should return 0
            expect(duration.end('setup')).toBe(0)
            expect(duration.end('execute')).toBe(0)
        })
    })

    describe('realistic timing', () => {
        it('should measure actual time with setTimeout', async () => {
            duration.start('async-test')

            await new Promise(resolve => setTimeout(resolve, 10))
            const durationValue = duration.end('async-test')
            expect(durationValue).toBeGreaterThanOrEqual(9)
            expect(durationValue).toBeLessThan(50)
        })
    })
})
