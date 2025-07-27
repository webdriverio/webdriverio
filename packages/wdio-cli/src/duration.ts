import chalk from 'chalk'

class DurationTracker {
    private timers: Record<string, number> = {}
    private durations: Record<string, number> = {}

    start(phase: string): void {
        this.timers[phase] = performance.now()
    }

    end(phase: string): number {
        if (!this.timers[phase]) {return 0}
        const duration = Math.round(performance.now() - this.timers[phase])
        delete this.timers[phase]

        this.durations[phase] = duration
        return duration
    }

    getSummary(): string {
        const { setup = 0, prepare = 0, execute = 0, complete = 0 } = this.durations
        const total = setup + prepare + execute + complete

        const breakdown = [
            `setup ${formatDuration(setup)}`,
            `prepare ${formatDuration(prepare)}`,
            `execute ${formatDuration(execute)}`,
            `complete ${formatDuration(complete)}`
        ].join(', ')

        return `Duration: ${chalk.green(formatDuration(total))} (${breakdown})`
    }

    reset(): void {
        this.timers = {}
        this.durations = {}
    }
}

function formatDuration(ms: number): string {
    if (ms >= 60000) {return `${(ms / 60000).toFixed(1)}m`}
    if (ms >= 1000) {return `${(ms / 1000).toFixed(1)}s`}
    return `${ms}ms`
}

const defaultTracker = new DurationTracker()

export default {
    start: defaultTracker.start.bind(defaultTracker),
    end: defaultTracker.end.bind(defaultTracker),
    getSummary: defaultTracker.getSummary.bind(defaultTracker),
    reset: defaultTracker.reset.bind(defaultTracker),
    formatDuration
}
