/**
 * Eval-sharpening helpers shared by wdio-deepagent tests.
 * [tool_use]      the model selects the right tool with the right args.
 * [heal]          recovery from failed tool calls: retries, alternative tools, lean trajectories.
 * [memory]        state persists across turns; threadId isolation prevents cross-test contamination.
 * [conversation]  turn plumbing — replies, interrupts, resume commands.
 * Ideal-trajectory pattern: observed run vs. declared lean run, ratio-capped.
 */

import { expect } from 'vitest'
import type { TurnResult } from '../src/commands/turn.js'

/** Names of every tool call recorded in a turn's result, in call order. */
export function getToolCallNames(result: TurnResult): string[] {
    return result.toolCalls.map((call) => call.name)
}

/** Asserts the collected tool calls include at least one with `name` whose args satisfy `matchArgs`; throws a vitest `expect` failure (carrying `msg`) otherwise. */
export function assertCalledWith(
    toolCalls: TurnResult['toolCalls'],
    name: string,
    matchArgs: (args: unknown) => boolean,
    msg = `expected a tool call to \`${name}\` with matching args`,
): void {
    const matching = toolCalls.filter((call) => call.name === name && matchArgs(call.args))
    expect(matching.length, msg).toBeGreaterThan(0)
}

/** Lean-run blueprint for a scenario: the fewest steps and tool calls it can take. */
export interface IdealTrajectory {
    /** Ideal number of steps (agent turns / pipeline iterations). */
    steps: number
    /** Ideal number of tool invocations (agent tool calls / loop tool uses). */
    toolCalls: number
}

/** Observed / ideal steps — 1.0 is the exact lean trajectory, >1 means waste. */
export function stepRatio(actualSteps: number, ideal: IdealTrajectory): number {
    return actualSteps / ideal.steps
}

/** Observed / ideal tool calls — 1.0 is the exact lean trajectory, >1 means redundant calls. */
export function toolCallRatio(actualToolCalls: number, ideal: IdealTrajectory): number {
    return actualToolCalls / ideal.toolCalls
}

/** Asserts an observed trajectory stays within `caps` of the ideal (step and tool-call ratios at or below their caps); throws a vitest `expect` failure (carrying `msg`) when a cap is exceeded. */
export function assertEfficiency(
    actual: { steps: number; toolCalls: number },
    ideal: IdealTrajectory,
    caps: { maxStepRatio: number; maxToolCallRatio: number },
    msg = 'trajectory exceeds the declared efficiency caps',
): void {
    const steps = stepRatio(actual.steps, ideal)
    const toolCalls = toolCallRatio(actual.toolCalls, ideal)
    expect(
        steps,
        `${msg}: step ratio ${steps} exceeds cap ${caps.maxStepRatio} ` +
        `(ideal ${ideal.steps}, observed ${actual.steps})`,
    ).toBeLessThanOrEqual(caps.maxStepRatio)
    expect(
        toolCalls,
        `${msg}: tool-call ratio ${toolCalls} exceeds cap ${caps.maxToolCallRatio} ` +
        `(ideal ${ideal.toolCalls}, observed ${actual.toolCalls})`,
    ).toBeLessThanOrEqual(caps.maxToolCallRatio)
}