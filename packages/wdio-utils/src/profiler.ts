export type TimingPhase =
    | 'setupStart'
    | 'setupEnd'
    | 'executionStart'
    | 'executionEnd'
    | 'teardownStart'
    | 'teardownEnd'

export interface TimingMetrics {
    setup?: number
    execution?: number
    teardown?: number
    total?: number
}

/**
 * Lightweight tracker for setup/execution/teardown timing metrics.
 */
export class TimingTracker {
    private timings: Partial<Record<TimingPhase, number>> = {}

    /**
     * Record a timing mark for the given phase.
     */
    markTiming(phase: TimingPhase): void {
        this.timings[phase] = performance.now()
    }

    /**
     * Get calculated timing metrics in seconds.
     */
    getTimings(): TimingMetrics {
        const result: TimingMetrics = {}

        if (this.timings.setupStart !== undefined && this.timings.setupEnd !== undefined) {
            result.setup = (this.timings.setupEnd - this.timings.setupStart) / 1000
        }

        if (this.timings.executionStart !== undefined && this.timings.executionEnd !== undefined) {
            result.execution = (this.timings.executionEnd - this.timings.executionStart) / 1000
        }

        if (this.timings.teardownStart !== undefined && this.timings.teardownEnd !== undefined) {
            result.teardown = (this.timings.teardownEnd - this.timings.teardownStart) / 1000
        }

        if (this.timings.setupStart !== undefined && this.timings.teardownEnd !== undefined) {
            result.total = (this.timings.teardownEnd - this.timings.setupStart) / 1000
        }

        return result
    }

    /**
     * Format timing metrics for console output.
     */
    formatTimingOutput(): string {
        const timings = this.getTimings()
        const hasAnyTiming = Object.keys(timings).length > 0
        if (!hasAnyTiming) {
            return ''
        }

        const lines: string[] = []
        lines.push('Performance Metrics:')
        lines.push('----------------------------------------')

        if (timings.setup !== undefined) {
            lines.push(`  Setup:     ${timings.setup.toFixed(2)}s`)
        }
        if (timings.execution !== undefined) {
            lines.push(`  Execution: ${timings.execution.toFixed(2)}s`)
        }
        if (timings.teardown !== undefined) {
            lines.push(`  Teardown:  ${timings.teardown.toFixed(2)}s`)
        }

        if (timings.total !== undefined) {
            lines.push('----------------------------------------')
            lines.push(`  Total:     ${timings.total.toFixed(2)}s`)
        }

        return lines.join('\n')
    }
}
