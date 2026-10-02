import type { AgentSession } from '@wdio/session/agent'

import { redact, substitute } from './redact.js'
import { EffectMismatchError, missingEffects, observableWithoutBidi, type EffectsMode } from './effects.js'
import type { EffectRecorder } from './recorder.js'
import type { ActStep } from './types.js'

export interface EffectCheck {
    recorder: EffectRecorder
    mode: EffectsMode
}

export interface HealedStep {
    index: number
    /**
     * selector that failed
     */
    from: string
    /**
     * selector that worked
     */
    to: string
}

export interface ReplayResult {
    /**
     * steps that ran, healed steps with their new selector
     */
    done: ActStep[]
    /**
     * steps healed without the model
     */
    healed: HealedStep[]
    /**
     * the step that failed and why. `effect` when the step ran but did not
     * do what it did when it was recorded.
     */
    failed?: { step: ActStep, index: number, error: string, kind?: 'effect' }
}

const TARGET_KEYS = ['target', 'from', 'to'] as const

/**
 * Wait until the targets of a step exist, like an `await $(selector)` in a
 * spec would, then run the step.
 */
export async function runStep (agent: AgentSession, step: ActStep, values: Record<string, string>, waitTimeout: number, effects?: EffectCheck) {
    const args = substitute(step.args, values)
    for (const key of TARGET_KEYS) {
        const selector = args[key]
        if (typeof selector === 'string' && selector) {
            await agent.browser.$(selector).waitForExist({ timeout: waitTimeout })
        }
    }
    return runChecked(agent, step, args, values, effects)
}

/**
 * run a step and check that it has the effect it had when it was recorded
 */
async function runChecked (agent: AgentSession, step: ActStep, args: Record<string, unknown>, values: Record<string, string>, effects?: EffectCheck) {
    if (!effects || effects.mode === 'off') {
        return agent.run(step.action, args)
    }
    await effects.recorder.start()
    const result = await agent.run(step.action, args)
    const actual = redact(await effects.recorder.settle(), values)
    const expected = effects.recorder.bidi ? step.effect : observableWithoutBidi(step.effect)
    const missing = missingEffects(expected, actual, effects.mode)
    if (missing.length) {
        throw new EffectMismatchError(missing)
    }
    return result
}

export function roleSelector (role: string, name: string) {
    return `role/${role}[name="${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
}

/**
 * Other ways to find the target of a step, without the model: the other
 * recorded selector candidates, then role and accessible name through the
 * `role/` selector, which uses the browser's accessibility engine on BiDi
 * sessions.
 */
export function alternativeSelectors (step: ActStep): string[] {
    const target = step.target
    if (!target) {
        return []
    }
    const alternatives = target.candidates.filter((candidate) => candidate !== target.selector)
    if (target.role && target.name) {
        const byRole = roleSelector(target.role, target.name)
        if (!alternatives.includes(byRole) && byRole !== target.selector) {
            alternatives.push(byRole)
        }
    }
    return alternatives
}

/**
 * Run a step with each alternative selector until one matches exactly one
 * element and the action succeeds. The page already had the wait timeout of
 * the original selector to settle, so alternatives are not waited for.
 */
export async function healStep (agent: AgentSession, step: ActStep, values: Record<string, string>, effects?: EffectCheck): Promise<ActStep | undefined> {
    for (const selector of alternativeSelectors(step)) {
        try {
            const matches = await agent.browser.$$(selector).getElements()
            if (matches.length !== 1) {
                continue
            }
            const args = { ...step.args, target: selector }
            const result = await runChecked(agent, step, substitute(args, values), values, effects)
            return {
                ...step,
                args,
                code: result.code ? redact(result.code, values) : step.code.split(step.target!.selector).join(selector),
                target: { ...step.target!, selector }
            }
        } catch {
            // invalid or stale selector, try the next one
        }
    }
    return undefined
}

/**
 * Run recorded steps in order. A step whose target is gone is healed with
 * an alternative selector. Stop at the first step that cannot be healed.
 */
export async function replaySteps (agent: AgentSession, steps: ActStep[], values: Record<string, string>, waitTimeout: number, effects?: EffectCheck): Promise<ReplayResult> {
    const done: ActStep[] = []
    const healed: HealedStep[] = []
    for (const [index, step] of steps.entries()) {
        try {
            await runStep(agent, step, values, waitTimeout, effects)
            done.push(step)
        } catch (err) {
            /**
             * the element was there and the step ran, it just did something
             * else: another selector would hit the same element again
             */
            if (err instanceof EffectMismatchError) {
                return { done, healed, failed: { step, index, error: err.message, kind: 'effect' } }
            }
            const fixed = await healStep(agent, step, values, effects)
            if (fixed) {
                done.push(fixed)
                healed.push({ index, from: step.target!.selector, to: fixed.target!.selector })
                continue
            }
            return { done, healed, failed: { step, index, error: (err as Error).message } }
        }
    }
    return { done, healed }
}
