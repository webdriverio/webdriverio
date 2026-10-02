import type { AgentSession } from '@wdio/session/agent'

import { substitute } from './redact.js'
import type { ActStep } from './types.js'

export interface ReplayResult {
    /**
     * steps that ran
     */
    done: ActStep[]
    /**
     * the step that failed and why
     */
    failed?: { step: ActStep, index: number, error: string }
}

const TARGET_KEYS = ['target', 'from', 'to'] as const

/**
 * Wait until the targets of a step exist, like an `await $(selector)` in a
 * spec would, then run the step.
 */
export async function runStep (agent: AgentSession, step: ActStep, values: Record<string, string>, waitTimeout: number) {
    const args = substitute(step.args, values)
    for (const key of TARGET_KEYS) {
        const selector = args[key]
        if (typeof selector === 'string' && selector) {
            await agent.browser.$(selector).waitForExist({ timeout: waitTimeout })
        }
    }
    return agent.run(step.action, args)
}

/**
 * Run recorded steps in order and stop at the first one that fails.
 */
export async function replaySteps (agent: AgentSession, steps: ActStep[], values: Record<string, string>, waitTimeout: number): Promise<ReplayResult> {
    const done: ActStep[] = []
    for (const [index, step] of steps.entries()) {
        try {
            await runStep(agent, step, values, waitTimeout)
            done.push(step)
        } catch (err) {
            return { done, failed: { step, index, error: (err as Error).message } }
        }
    }
    return { done }
}
