import fs from 'node:fs'
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin'

import { escapeRegExp } from './utils.js'

export interface StepLine {
    text: string
    line: number
    /** line of the doc string of the step */
    docStringLine?: number
}

export interface ScenarioLines {
    name: string
    line: number
    /**
     * the background steps of the feature and of the rule of the scenario
     */
    background: StepLine[]
    steps: StepLine[]
    /** the lines of the Examples rows of a Scenario Outline (empty for a scenario) */
    examples: number[]
    /** how many pickles of the run already used this scenario */
    used: number
}

export interface FeatureLines {
    scenarios: ScenarioLines[]
}

interface GherkinStep { text: string, location: { line: number }, docString?: { location: { line: number } } }
interface GherkinScenario {
    name: string
    location: { line: number }
    steps: readonly GherkinStep[]
    examples?: readonly { tableBody: readonly { location: { line: number } }[] }[]
}
interface GherkinChild {
    background?: GherkinScenario
    scenario?: GherkinScenario
    rule?: { children: readonly GherkinChild[] }
}

const toSteps = (steps: readonly GherkinStep[]) => steps.map((step) => ({
    text: step.text,
    line: step.location.line,
    docStringLine: step.docString?.location.line
}))

/**
 * Read the line numbers of the scenarios and steps of a feature file. WebdriverIO
 * does not report them, and the Cucumber JSON format has them.
 * @returns `undefined` if the file cannot be read or parsed
 */
export function readFeatureLines (file: string, language: string): FeatureLines | undefined {
    try {
        let id = 0
        const parser = new Parser(new AstBuilder(() => String(id++)), new GherkinClassicTokenMatcher(language))
        const document = parser.parse(fs.readFileSync(file, 'utf-8'))
        const lines: FeatureLines = { scenarios: [] }
        /**
         * a background applies to the scenarios of its feature or of its rule
         */
        const walk = (children: readonly GherkinChild[], inherited: StepLine[]) => {
            let background = inherited
            for (const child of children) {
                if (child.background) {
                    background = [...inherited, ...toSteps(child.background.steps)]
                } else if (child.rule) {
                    walk(child.rule.children, background)
                } else if (child.scenario) {
                    const { name, location, steps, examples = [] } = child.scenario
                    lines.scenarios.push({
                        name,
                        line: location.line,
                        background,
                        steps: toSteps(steps),
                        examples: examples.flatMap((table) => table.tableBody.map((row) => row.location.line)),
                        used: 0
                    })
                }
            }
        }
        walk((document.feature?.children ?? []) as readonly GherkinChild[], [])
        return lines
    } catch {
        return undefined
    }
}

/**
 * `true` if the text matches the template of a scenario outline (`<name>` parts
 * are the values of the examples)
 */
function matchesTemplate (template: string, text: string) {
    if (template === text) {
        return true
    }
    if (!template.includes('<')) {
        return false
    }
    const pattern = template
        .split(/<[^>]+>/)
        .map(escapeRegExp)
        .join('.*')
    return new RegExp(`^${pattern}$`).test(text)
}

/**
 * The scenario name of a title: with `cucumberOpts.tagsInTitle`, the framework writes
 * the title as `@tag1, @tag2: Name`
 */
export function scenarioNameOf (title: string, tags?: readonly (string | { name: string })[] | string) {
    const names = Array.isArray(tags) ? tags.map((tag) => typeof tag === 'string' ? tag : tag.name) : []
    const prefix = `${names.join(', ')}: `
    return names.length && title.startsWith(prefix) ? title.slice(prefix.length) : title
}

/**
 * The lines of the next scenario with this name that the run did not use yet, and
 * its line as in the Cucumber JSON format: the line of its Examples row for an
 * example of a Scenario Outline. Scenarios with the same name (for example in
 * other Rules) are used in the order of the file.
 */
export function takeScenarioLines (lines: FeatureLines, name: string): { scenario: ScenarioLines, line: number } | undefined {
    const candidates = [
        ...lines.scenarios.filter((scenario) => scenario.name === name),
        ...lines.scenarios.filter((scenario) => scenario.name !== name && matchesTemplate(scenario.name, name))
    ]
    const isFree = (scenario: ScenarioLines) => scenario.used < Math.max(scenario.examples.length, 1)
    // all used: the same spec file runs again, start with the first one
    const scenario = candidates.find(isFree) ?? candidates[0]
    if (!scenario) {
        return undefined
    }
    const index = isFree(scenario) ? scenario.used : 0
    scenario.used++
    return { scenario, line: scenario.examples[index] ?? scenario.line }
}

/**
 * Line of the next step with this text that was not used yet: the background
 * steps of the scenario first, then its own steps
 */
export function findStepLine (scenario: ScenarioLines, text: string, usedLines: Set<number>) {
    const step = [...scenario.background, ...scenario.steps]
        .find((candidate) => !usedLines.has(candidate.line) && matchesTemplate(candidate.text, text))
    if (step) {
        usedLines.add(step.line)
    }
    return step?.line
}

/**
 * Line of the doc string of the step at `stepLine`
 */
export function findDocStringLine (scenario: ScenarioLines, stepLine: number) {
    return [...scenario.background, ...scenario.steps].find((step) => step.line === stepLine)?.docStringLine
}
