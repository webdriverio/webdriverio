import { describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'
import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import * as cucumberHelper from './__fixtures__/cucumber.js'

// the real base: it gives the user commands to the reporter
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

type Result = Record<string, any>
const user = (id: number, command: string, parent?: number) => ({ id, command, body: [], protocol: 'bidi', sessionId: 's', ...(parent ? { parent } : {}) })

describe('the join of repeated steps with useCucumberStepReporter', () => {
    it('never joins the Gherkin steps of a scenario, and joins the commands inside them', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true, writeStream: { write: () => true } } as any)
        reporter.emit('runner:start', runnerStart())
        reporter.emit('suite:start', cucumberHelper.featureStart())
        reporter.emit('suite:start', cucumberHelper.scenarioStart())
        let id = 1
        for (const uid of ['step-1', 'step-2']) {
            const step = { ...cucumberHelper.testStart(), uid }
            reporter.emit('test:start', step)
            const wait = id++
            reporter.emit('client:beforeUserCommand', user(wait, 'waitUntil'))
            for (let poll = 0; poll < 3; poll++) {
                const read = id++
                reporter.emit('client:beforeUserCommand', user(read, 'getText', wait))
                reporter.emit('client:afterUserCommand', { ...user(read, 'getText', wait), result: { value: 'x' } })
            }
            reporter.emit('client:afterUserCommand', { ...user(wait, 'waitUntil'), result: { value: true } })
            reporter.emit('test:pass', { ...cucumberHelper.testPass(), uid })
            reporter.emit('test:end', { ...cucumberHelper.testPass(), uid })
        }
        const results = { tests: [cucumberHelper.testPass()], hooks: [] }
        reporter.emit('suite:end', cucumberHelper.scenarioEnd(results))
        reporter.emit('suite:end', cucumberHelper.featureEnd(results))
        reporter.emit('runner:end', runnerEnd())
        await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
        const tree = (r: Result): unknown[] => r.steps.map((s: Result) => s.steps.length ? [s.name, tree(s)] : s.name)
        const [scenario] = getResults(outputDir).results as Result[]
        expect(tree(scenario)).toEqual([
            ['I do something', [['waitUntil() → true', ['getText() → "x" × 3']]]],
            ['I do something', [['waitUntil() → true', ['getText() → "x" × 3']]]]
        ])
    })

    it('joins the repeated user commands of a scenario that is a test (scenarioLevelReporter)', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir, useCucumberStepReporter: true, writeStream: { write: () => true } } as any)
        reporter.emit('runner:start', { ...runnerStart(), config: { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter: true } } })
        reporter.emit('suite:start', cucumberHelper.featureStart())
        const scenario = { ...cucumberHelper.testStart(), uid: 'scenario-1', title: 'MyScenario' }
        reporter.emit('test:start', scenario)
        for (let id = 1; id <= 3; id++) {
            reporter.emit('client:beforeUserCommand', user(id, 'getTitle'))
            reporter.emit('client:afterUserCommand', { ...user(id, 'getTitle'), result: { value: 'T' } })
        }
        reporter.emit('test:pass', { ...cucumberHelper.testPass(), uid: 'scenario-1', title: 'MyScenario' })
        reporter.emit('test:end', { ...cucumberHelper.testPass(), uid: 'scenario-1', title: 'MyScenario' })
        reporter.emit('suite:end', cucumberHelper.featureEnd({ tests: [cucumberHelper.testPass()], hooks: [] }))
        reporter.emit('runner:end', runnerEnd())
        await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
        const results = getResults(outputDir).results as Result[]
        const withSteps = results.find((r) => r.steps.length)!
        expect(withSteps.steps.map((s: Result) => s.name)).toEqual(['getTitle() → "T" × 3'])
    })
})

