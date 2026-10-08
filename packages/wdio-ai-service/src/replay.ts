import type { AgentSession } from '@wdio/session/agent'

import { redact, substitute } from './redact.js'
import { DEFAULT_SETTLE_TIMEOUT, EffectMismatchError, EffectTimeoutError, missingEffects, observableWithoutBidi, type EffectsMode } from './effects.js'
import type { EffectRecorder } from './recorder.js'
import type { HealHooks } from './evidence.js'
import { TARGET_KEYS } from './tools.js'
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
    failed?: {
        step: ActStep
        index: number
        error: string
        /**
         * the step ran and did something else. It is never run again, by
         * another selector or by the model: it may have submitted a form.
         */
        kind?: 'effect' | 'timeout'
        /**
         * the alternative selector the step ran with
         */
        healedWith?: string
    }
}

/**
 * `frame top` and `frame parent` name no element to wait for
 */
const FRAME_KEYWORDS = new Set(['top', 'parent'])

/**
 * Wait until the targets of a step exist, like an `await $(selector)` in a
 * spec would, then run the step.
 */
export async function runStep (agent: AgentSession, step: ActStep, values: Record<string, string>, waitTimeout: number, effects?: EffectCheck, scope?: string) {
    const args = substitute(step.args, values)
    for (const key of TARGET_KEYS) {
        const selector = args[key]
        if (typeof selector === 'string' && selector && !(step.action === 'frame' && FRAME_KEYWORDS.has(selector))) {
            await agent.scope.$(selector).waitForExist({ timeout: waitTimeout })
            await assertInScope(agent, scope, selector)
        }
    }
    return runChecked(agent, step, args, values, effects, Math.max(DEFAULT_SETTLE_TIMEOUT, waitTimeout))
}

/**
 * run a step and check that it has the effect it had when it was recorded
 */
async function runChecked (agent: AgentSession, step: ActStep, args: Record<string, unknown>, values: Record<string, string>, effects?: EffectCheck, timeout = DEFAULT_SETTLE_TIMEOUT) {
    if (!effects || effects.mode === 'off') {
        return agent.runAction(step.action, args)
    }
    await effects.recorder.start()
    const result = await agent.runAction(step.action, args)
    const actual = redact(await effects.recorder.settle({ timeout }), values)
    const expected = effects.recorder.bidi ? step.effect : observableWithoutBidi(step.effect)
    const missing = missingEffects(expected, actual, effects.mode)
    if (missing.length) {
        const pending = effects.recorder.unsettled
        throw pending.length ? new EffectTimeoutError(timeout, pending) : new EffectMismatchError(missing)
    }
    return result
}

/**
 * A step of a call scoped to an element must not act outside it, even when
 * its selector also matches something else on the page.
 */
async function assertInScope (agent: AgentSession, scope: string | undefined, selector: string) {
    if (scope && !await agent.contains(scope, selector)) {
        throw new Error(`${selector} is outside the element this act() call is limited to`)
    }
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
export async function healStep (agent: AgentSession, step: ActStep, values: Record<string, string>, effects?: EffectCheck, scope?: string): Promise<ActStep | undefined> {
    for (const selector of alternativeSelectors(step)) {
        try {
            const matches = await agent.scope.$$(selector).getElements()
            if (matches.length !== 1 || (scope && !await agent.contains(scope, selector))) {
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
        } catch (err) {
            /**
             * the action ran on the alternative element and did something
             * else, trying the next one could run another wrong action
             */
            if (err instanceof EffectMismatchError) {
                throw new HealMismatchError(selector, err.missing)
            }
            if (err instanceof EffectTimeoutError) {
                throw err
            }
            // invalid or stale selector, try the next one
        }
    }
    return undefined
}

/**
 * an alternative selector found an element, the step ran on it and did not
 * have its recorded effect
 */
export class HealMismatchError extends Error {
    readonly selector: string
    constructor (selector: string, missing: string[]) {
        super(`the step ran on ${selector}, which does not cause ${missing.join(', ')}`)
        this.name = 'HealMismatchError'
        this.selector = selector
    }
}

/**
 * Run recorded steps in order. A step whose target is gone, or outside the
 * element of a scoped call, is healed with an alternative selector. Stop at
 * the first step that cannot be healed.
 */
export async function replaySteps (agent: AgentSession, steps: ActStep[], values: Record<string, string>, waitTimeout: number, effects?: EffectCheck, heal?: HealHooks, scope?: string): Promise<ReplayResult> {
    const done: ActStep[] = []
    const healed: HealedStep[] = []
    for (const [index, step] of steps.entries()) {
        try {
            await runStep(agent, step, values, waitTimeout, effects, scope)
            done.push(step)
        } catch (err) {
            await heal?.begin()
            /**
             * the element was there and the step ran, it just did something
             * else: another selector would hit the same element again
             */
            if (err instanceof EffectMismatchError) {
                return { done, healed, failed: { step, index, error: err.message, kind: 'effect' } }
            }
            if (err instanceof EffectTimeoutError) {
                return { done, healed, failed: { step, index, error: err.message, kind: 'timeout' } }
            }
            let fixed: ActStep | undefined
            try {
                fixed = await healStep(agent, step, values, effects, scope)
            } catch (healErr) {
                if (healErr instanceof HealMismatchError) {
                    return { done, healed, failed: { step, index, error: healErr.message, kind: 'effect', healedWith: healErr.selector } }
                }
                if (healErr instanceof EffectTimeoutError) {
                    return { done, healed, failed: { step, index, error: healErr.message, kind: 'timeout' } }
                }
                throw healErr
            }
            if (fixed) {
                await heal?.after()
                done.push(fixed)
                healed.push({ index, from: step.target!.selector, to: fixed.target!.selector })
                continue
            }
            return { done, healed, failed: { step, index, error: (err as Error).message } }
        }
    }
    return { done, healed }
}
