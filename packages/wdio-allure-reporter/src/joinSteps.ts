import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { StepResult } from 'allure-js-commons'
import { Stage } from 'allure-js-commons'
import { joinRepeats } from '@wdio/reporter'

/**
 * The step tree with the identical repeated siblings joined as `× N` (see `joinRepeats` of `@wdio/reporter`).
 * Steps are identical when their name, status, message, parameters, attachments (by content) and children are.
 * The attachment files of the joined repeats are deleted from `resultsDir`.
 */
export function joinSteps (steps: StepResult[], resultsDir: string): StepResult[] {
    const keys = new WeakMap<StepResult, string>()
    const digest = (source: string) => {
        try {
            return createHash('sha1').update(fs.readFileSync(path.join(resultsDir, source))).digest('hex')
        } catch {
            // a file that cannot be read is never joined
            return source
        }
    }
    const keyOf = (step: StepResult): string => {
        let key = keys.get(step)
        if (key === undefined) {
            key = JSON.stringify([
                step.name, step.status, step.statusDetails?.message, step.parameters,
                step.attachments.map((attachment) => [attachment.name, digest(attachment.source)]),
                step.steps.map(keyOf)
            ])
            keys.set(step, key)
        }
        return key
    }
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
    const joinLevel = (level: StepResult[]): StepResult[] => joinRepeats(
        level.map((step) => ({ ...step, steps: joinLevel(step.steps) })),
        keyOf,
        (group, count, repeats) => {
            drop(repeats.flat(), new Set(sources(group)))
            const stop = repeats.at(-1)!.at(-1)!.stop
            return group.length === 1
                ? { ...group[0], name: `${group[0].name} × ${count}`, stop }
                : {
                    name: `× ${count}`, status: group[0].status, statusDetails: {}, stage: Stage.FINISHED,
                    parameters: [], attachments: [], steps: [...group], start: group[0].start, stop
                }
        }
    )
    return joinLevel(steps)
}
