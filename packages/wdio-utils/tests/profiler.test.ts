import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TimingTracker } from '../src/profiler.js'

describe('TimingTracker', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('should return empty timings when phases not marked', () => {
        const tracker = new TimingTracker()
        const timings = tracker.getTimings()
        expect(timings).toEqual({})
        expect(tracker.formatTimingOutput()).toBe('')
    })

    it('should track timing phases', () => {
        const tracker = new TimingTracker()

        const now = vi.spyOn(performance, 'now')
        now.mockReturnValueOnce(0)      // setupStart
        now.mockReturnValueOnce(1000)   // setupEnd
        now.mockReturnValueOnce(1000)   // executionStart
        now.mockReturnValueOnce(5000)   // executionEnd
        now.mockReturnValueOnce(5000)   // teardownStart
        now.mockReturnValueOnce(6000)   // teardownEnd

        tracker.markTiming('setupStart')
        tracker.markTiming('setupEnd')
        tracker.markTiming('executionStart')
        tracker.markTiming('executionEnd')
        tracker.markTiming('teardownStart')
        tracker.markTiming('teardownEnd')

        const timings = tracker.getTimings()
        expect(timings.setup).toBe(1)
        expect(timings.execution).toBe(4)
        expect(timings.teardown).toBe(1)
        expect(timings.total).toBe(6)
    })

    it('should format timing output with all phases', () => {
        const tracker = new TimingTracker()

        const now = vi.spyOn(performance, 'now')
        now.mockReturnValueOnce(0)
        now.mockReturnValueOnce(1000)
        now.mockReturnValueOnce(1000)
        now.mockReturnValueOnce(5000)
        now.mockReturnValueOnce(5000)
        now.mockReturnValueOnce(6000)

        tracker.markTiming('setupStart')
        tracker.markTiming('setupEnd')
        tracker.markTiming('executionStart')
        tracker.markTiming('executionEnd')
        tracker.markTiming('teardownStart')
        tracker.markTiming('teardownEnd')

        const output = tracker.formatTimingOutput()
        expect(output).toContain('Performance Metrics:')
        expect(output).toContain('Setup:')
        expect(output).toContain('Execution:')
        expect(output).toContain('Teardown:')
        expect(output).toContain('Total:')
    })

    it('should omit missing phases', () => {
        const tracker = new TimingTracker()
        const now = vi.spyOn(performance, 'now')
        now.mockReturnValueOnce(0)
        now.mockReturnValueOnce(1000)

        tracker.markTiming('setupStart')
        tracker.markTiming('setupEnd')

        const output = tracker.formatTimingOutput()
        expect(output).toContain('Setup:')
        expect(output).not.toContain('Execution:')
        expect(output).not.toContain('Teardown:')
        expect(output).not.toContain('Total:')
    })
})
