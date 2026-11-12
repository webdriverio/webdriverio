import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { StepResult } from 'allure-js-commons'
import { Stage, Status } from 'allure-js-commons'
import { joinRepeats } from '@wdio/reporter'

// the worst first: a group step shows the worst status of its steps
const STATUS_ORDER = [Status.FAILED, Status.BROKEN, Status.SKIPPED, Status.PASSED]

/**
 * The step tree with the identical repeated siblings joined as `× N` (see `joinRepeats` of `@wdio/reporter`).
 * Steps are identical when their name, status, message, parameters, attachments (by content) and children are.
 * The attachment files of the joined repeats are deleted from `resultsDir`.
 */
export function joinSteps (steps: StepResult[], resultsDir: string): StepResult[] {
    let unique = 0
    const memo = (compute: (step: StepResult) => string) => {
        const keys = new WeakMap<StepResult, string>()
        return (step: StepResult) => {
            let key = keys.get(step)
            if (key === undefined) {
                key = compute(step)
                keys.set(step, key)
            }
            return key
        }
    }
    const digest = (source: string) => {
        try {
            return createHash('sha1').update(fs.readFileSync(path.join(resultsDir, source))).digest('hex')
        } catch {
            // a file that cannot be read is never joined
            return `\u0000${unique++}`
        }
    }
    // no file is read for this key
    const cheapKey = memo((step) => JSON.stringify([
        step.name, step.status, step.statusDetails?.message, step.parameters,
        step.attachments.map((attachment) => attachment.name), step.steps.map(cheapKey)
    ]))
    // also the attachment contents: only for a step that can be in a run
    const fullKey = memo((step) => JSON.stringify([
        cheapKey(step), step.attachments.map((attachment) => digest(attachment.source)), step.steps.map(fullKey)
    ]))
    const drop = (dropped: readonly StepResult[], kept: Set<string>) => {
        for (const step of dropped) {
            for (const { source } of step.attachments) {
                if (!kept.has(source)) {
                    fs.rmSync(path.join(resultsDir, source), { force: true })
                }
            }
            drop(step.steps, kept)
        }
    }
    const sources = (list: readonly StepResult[]): string[] => list.flatMap((step) => [...step.attachments.map(({ source }) => source), ...sources(step.steps)])
    const joinLevel = (level: StepResult[]): StepResult[] => {
        return joinRepeats(
            level.map((step) => ({ ...step, steps: joinLevel(step.steps) })),
            cheapKey,
            (group, count, repeats) => {
                drop(repeats.flat(), new Set(sources(group)))
                const stop = repeats.at(-1)!.at(-1)!.stop
                return group.length === 1
                    ? { ...group[0], name: `${group[0].name} × ${count}`, stop }
                    : {
                        name: `× ${count}`, status: STATUS_ORDER.find((status) => group.some((step) => step.status === status)) ?? group[0].status, statusDetails: {}, stage: Stage.FINISHED,
                        parameters: [], attachments: [], steps: [...group], start: group[0].start, stop
                    }
            },
            fullKey
        )
    }
    return joinLevel(steps)
}
