import type { AgentSession } from '@wdio/session/agent'

import { redact, substitute } from './redact.js'
import { TARGET_KEYS } from './tools.js'
import type { ActStep } from './types.js'

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
     * the step that failed and why
     */
    failed?: { step: ActStep, index: number, error: string }
}

/**
 * Wait until the targets of a step exist, like an `await $(selector)` in a
 * spec would, then run the step.
 */
export async function runStep (agent: AgentSession, step: ActStep, values: Record<string, string>, waitTimeout: number, scope?: string) {
    const args = substitute(step.args, values)
    for (const key of TARGET_KEYS) {
        const selector = args[key]
        if (typeof selector === 'string' && selector) {
            await agent.browser.$(selector).waitForExist({ timeout: waitTimeout })
            await assertInScope(agent, scope, selector)
        }
    }
    return agent.run(step.action, args)
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
export async function healStep (agent: AgentSession, step: ActStep, values: Record<string, string>, scope?: string): Promise<ActStep | undefined> {
    for (const selector of alternativeSelectors(step)) {
        try {
            const matches = await agent.browser.$$(selector).getElements()
            if (matches.length !== 1 || (scope && !await agent.contains(scope, selector))) {
                continue
            }
            const args = { ...step.args, target: selector }
            const result = await agent.run(step.action, substitute(args, values))
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
 * Run recorded steps in order. A step whose target is gone, or outside the
 * element of a scoped call, is healed with an alternative selector. Stop at
 * the first step that cannot be healed.
 */
export async function replaySteps (agent: AgentSession, steps: ActStep[], values: Record<string, string>, waitTimeout: number, scope?: string): Promise<ReplayResult> {
    const done: ActStep[] = []
    const healed: HealedStep[] = []
    for (const [index, step] of steps.entries()) {
        try {
            await runStep(agent, step, values, waitTimeout, scope)
            done.push(step)
        } catch (err) {
            const fixed = await healStep(agent, step, values, scope)
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
