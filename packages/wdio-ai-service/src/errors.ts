import type { ActStep } from './types.js'

export interface ActErrorDetails {
    instruction: string
    reason: string
    steps?: ActStep[]
    /**
     * the last snapshot the model saw
     */
    snapshot?: string
    usage?: TokenUsage
    /**
     * evidence folder of the test
     */
    workspace?: string
}

export interface TokenUsage {
    input: number
    output: number
}

/**
 * An `act` call that could not complete: the model called `fail`, the step
 * limit or the timeout was reached, or a cached step failed in `locked` mode.
 */
export class ActError extends Error {
    readonly instruction: string
    readonly reason: string
    readonly steps: ActStep[]
    readonly snapshot?: string
    readonly usage?: TokenUsage
    readonly workspace?: string

    constructor (details: ActErrorDetails) {
        super(`act("${details.instruction}") failed: ${details.reason}${details.workspace ? `\nEvidence: ${details.workspace}` : ''}`)
        this.name = 'ActError'
        this.instruction = details.instruction
        this.reason = details.reason
        this.steps = details.steps || []
        this.snapshot = details.snapshot
        this.usage = details.usage
        this.workspace = details.workspace
    }
}
