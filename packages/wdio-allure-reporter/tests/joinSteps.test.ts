import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import type { StepResult } from 'allure-js-commons'

import { joinSteps } from '../src/joinSteps.js'

vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

let files = 0
function step (dir: string, name: string, start: number, response?: string, steps: StepResult[] = []): StepResult {
    const attachments = response === undefined ? [] : [{ name: 'Response', source: `${files++}-attachment.txt`, type: 'text/plain' }]
    for (const attachment of attachments) {
        fs.writeFileSync(path.join(dir, attachment.source), response!)
    }
    return { name, status: 'passed', stage: 'finished', statusDetails: {}, parameters: [], attachments, steps, start, stop: start + 10 } as StepResult
}

describe('joinSteps', () => {
    it('joins identical steps as one × N step, and deletes the attachment files of the repeats', () => {
        const dir = temporaryDirectory()
        const steps = Array.from({ length: 8 }, (_, i) => step(dir, 'getText() → "Click"', i * 100, 'a long response'))
        const [joined] = joinSteps(steps, dir)
        expect(joined).toMatchObject({ name: 'getText() → "Click" × 8', start: 0, stop: 710 })
        expect(joined.attachments).toHaveLength(1)
        expect(fs.readdirSync(dir)).toEqual([joined.attachments[0].source])
    })

    it('does not join two steps with the same name and a different Response', () => {
        const dir = temporaryDirectory()
        expect(joinSteps([step(dir, 'getText() → "a…"', 0, 'a1'), step(dir, 'getText() → "a…"', 1, 'a2')], dir)).toHaveLength(2)
        expect(fs.readdirSync(dir)).toHaveLength(2)
    })

    it('joins a repeated group of steps as one × N step with one copy of the group', () => {
        const dir = temporaryDirectory()
        const poll = (i: number) => [step(dir, '$(`#x`) → found', i * 100), step(dir, 'getText() → "Click"', i * 100 + 50)]
        const [joined] = joinSteps([...poll(0), ...poll(1), ...poll(2)], dir)
        expect(joined).toMatchObject({ name: '× 3', status: 'passed', start: 0, stop: 260 })
        expect(joined.steps.map((s) => s.name)).toEqual(['$(`#x`) → found', 'getText() → "Click"'])
    })

    it('reads no attachment file of a step that no near sibling matches', () => {
        const dir = temporaryDirectory()
        const steps = ['a', 'b', 'c'].map((name, i) => step(dir, name, i, 'response'))
        const read = vi.spyOn(fs, 'readFileSync')
        try {
            joinSteps(steps, dir)
            expect(read).not.toHaveBeenCalled()
        } finally {
            read.mockRestore()
        }
    })

    it('joins the children of a step first', () => {
        const dir = temporaryDirectory()
        const children = Array.from({ length: 3 }, (_, i) => step(dir, 'isDisplayed() → false', i))
        const [wait] = joinSteps([step(dir, 'waitUntil() → true', 0, undefined, [...children, step(dir, 'isDisplayed() → true', 9)])], dir)
        expect(wait.steps.map((s) => s.name)).toEqual(['isDisplayed() → false × 3', 'isDisplayed() → true'])
    })
})
