type DurationPhase = 'setup' | 'prepare' | 'execute' | 'complete'
export class DurationPhaseError extends Error {
    public phase: DurationPhase

    constructor(phase: DurationPhase, message: string) {
        super(message)
        this.name = 'DurationPhaseError'
        this.phase = phase
    }
}

class DurationTracker {
    private timers: Partial<Record<DurationPhase, number>> = {}
    private durations: Partial<Record<DurationPhase, number>> = {}

    start(phase: DurationPhase): void {
        if (this.timers[phase] !== undefined) {
            throw new DurationPhaseError(phase, `Cannot start phase: ${phase} phase is already running`)
        }
        this.timers[phase] = performance.now()
    }

    end(phase: DurationPhase): number {
        if (!this.timers[phase]) {
            throw new DurationPhaseError(phase, `Cannot end phase: ${phase} phase has not been started`)
        }
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

        return `${formatDuration(total)} (${breakdown})`
    }

    reset(): void {
        this.timers = {}
        this.durations = {}
    }
}

export function formatDuration(ms: number): string {
    if (ms >= 60000) {return `${(ms / 60000).toFixed(1)}m`}
    if (ms >= 1000) {return `${(ms / 1000).toFixed(1)}s`}
    return `${ms}ms`
}

export default new DurationTracker()
