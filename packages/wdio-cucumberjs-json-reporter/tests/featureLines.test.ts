import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { readFeatureLines, takeScenarioLines, findStepLine, scenarioNameOf } from '../src/featureLines.js'

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
        expect(takeScenarioLines(lines, 'S1')?.line).toBe(4)
        expect(takeScenarioLines(lines, 'S2', { rule: 'R' })?.line).toBe(9)
        // an example of an outline has the line of its Examples row
        // the outline comes after `Rule: R`, so it is in that Rule
        expect(takeScenarioLines(lines, 'O 1', { rule: 'R' })?.line).toBe(15)
        expect(takeScenarioLines(lines, 'unknown')).toBeUndefined()
    })

    it('finds the line of each step in order, background steps included', () => {
        const lines = readFeatureLines(file, 'en')!
        const scenario = takeScenarioLines(lines, 'S1')!.scenario
        const used = new Set<number>()
        expect(findStepLine(scenario, 'bg', used)).toBe(3)
        expect(findStepLine(scenario, 'a', used)).toBe(5)
        expect(findStepLine(scenario, 'b', used)).toBe(6)
        expect(findStepLine(scenario, 'a', used)).toBe(7)
        expect(findStepLine(takeScenarioLines(lines, 'O 1', { rule: 'R' })!.scenario, 'c 1', new Set())).toBe(12)
    })

    it('uses only the backgrounds of the feature and of the rule of the scenario', () => {
        const rulesFile = path.join(path.dirname(file), 'rules.feature')
        fs.writeFileSync(rulesFile, [
            'Feature: F',                   // 1
            '  Background:',                // 2
            '    Given feature setup',      // 3
            '  Rule: R1',                   // 4
            '    Background:',              // 5
            '      Given rule setup',       // 6
            '    Scenario: S1',             // 7
            '      Given rule setup',       // 8
            '  Rule: R2',                   // 9
            '    Background:',              // 10
            '      Given rule setup',       // 11
            '    Scenario: S2',             // 12
            '      Given other',            // 13
            ''
        ].join('\n'))
        const lines = readFeatureLines(rulesFile, 'en')!

        const s1 = takeScenarioLines(lines, 'S1', { rule: 'R1' })!.scenario
        const used1 = new Set<number>()
        expect(findStepLine(s1, 'feature setup', used1)).toBe(3)
        expect(findStepLine(s1, 'rule setup', used1)).toBe(6)
        expect(findStepLine(s1, 'rule setup', used1)).toBe(8)

        const s2 = takeScenarioLines(lines, 'S2', { rule: 'R2' })!.scenario
        const used2 = new Set<number>()
        expect(findStepLine(s2, 'feature setup', used2)).toBe(3)
        expect(findStepLine(s2, 'rule setup', used2)).toBe(11)
        expect(findStepLine(s2, 'other', used2)).toBe(13)
    })

    it('removes the tags that cucumberOpts.tagsInTitle adds to the title', () => {
        expect(scenarioNameOf('@smoke, @login: Login', ['@smoke', '@login'])).toBe('Login')
        expect(scenarioNameOf('@smoke: Login', [{ name: '@smoke' }])).toBe('Login')
        expect(scenarioNameOf('Login', ['@smoke'])).toBe('Login')
        expect(scenarioNameOf('Ratio: 2', [])).toBe('Ratio: 2')
        expect(scenarioNameOf('Ratio: 2', undefined)).toBe('Ratio: 2')
    })

    it('returns undefined for a file it cannot read', () => {
        expect(readFeatureLines('/does/not/exist.feature', 'en')).toBeUndefined()
    })
})
