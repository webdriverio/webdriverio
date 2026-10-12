import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { readFeatureLines, findScenarioLines, findStepLine } from '../src/featureLines.js'

const FEATURE = `Feature: F
  Background:
    Given bg
  Scenario: S1
    Given a
    When b
    Then a
  Rule: R
    Scenario: S2
      Given r
  Scenario Outline: O <x>
    Given c <x>
    Examples:
      | x |
      | 1 |
`

describe('featureLines', () => {
    let file: string
    beforeAll(() => {
        file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cjson-lines-')), 'f.feature')
        fs.writeFileSync(file, FEATURE)
    })
    afterAll(() => {
        fs.rmSync(path.dirname(file), { recursive: true, force: true })
    })

    it('finds the line of the scenarios, also in rules and outlines', () => {
        const lines = readFeatureLines(file, 'en')!
        expect(findScenarioLines(lines, 'S1')?.line).toBe(4)
        expect(findScenarioLines(lines, 'S2')?.line).toBe(9)
        expect(findScenarioLines(lines, 'O 1')?.line).toBe(11)
        expect(findScenarioLines(lines, 'unknown')).toBeUndefined()
    })

    it('finds the line of each step in order, background steps included', () => {
        const lines = readFeatureLines(file, 'en')!
        const scenario = findScenarioLines(lines, 'S1')!
        const used = new Set<number>()
        expect(findStepLine(lines, scenario, 'bg', used)).toBe(3)
        expect(findStepLine(lines, scenario, 'a', used)).toBe(5)
        expect(findStepLine(lines, scenario, 'b', used)).toBe(6)
        expect(findStepLine(lines, scenario, 'a', used)).toBe(7)
        expect(findStepLine(lines, findScenarioLines(lines, 'O 1')!, 'c 1', new Set())).toBe(12)
    })

    it('returns undefined for a file it cannot read', () => {
        expect(readFeatureLines('/does/not/exist.feature', 'en')).toBeUndefined()
    })
})
