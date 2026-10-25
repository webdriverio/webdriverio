import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, test, expect, vi } from 'vitest'
import * as Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'

import { runParallelCucumber } from '../src/parallel.js'
import { DEFAULT_OPTS } from '../src/constants.js'
import AllureReporter from '../../wdio-allure-reporter/src/index.js'
import { addAttachment } from '../../wdio-allure-reporter/src/common/api.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const uuidFn = IdGenerator.uuid()
const FEATURE = path.join(process.cwd(), 'plan', 'plan.feature')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function mockBrowser(store: AsyncLocalStorage<string>) {
    let idx = 0
    return {
        isBidi: true,
        __parallelContextStore: store,
        __parallelContexts: new Set<string>(),
        __bidiCommandsEnabled: true,
        browsingContextCreate: vi.fn().mockImplementation(async () => ({ context: `ctx-${idx++}` })),
        browsingContextClose: vi.fn().mockResolvedValue(undefined)
    } as never
}

function supportCode(stepDefinitions: unknown[]) {
    return {
        originalCoordinates: { requireModules: [], requirePaths: [], importPaths: [], loaders: [] },
        beforeTestRunHookDefinitions: [], afterTestRunHookDefinitions: [],
        beforeTestCaseHookDefinitions: [], afterTestCaseHookDefinitions: [],
        beforeTestStepHookDefinitions: [], afterTestStepHookDefinitions: [],
        defaultTimeout: 60000,
        stepDefinitions,
        undefinedParameterTypes: [],
        parameterTypeRegistry: { parameterTypes: [], defineParameterType: () => {} },
        World: class {},
        parallelCanAssign: () => true
    } as never
}

function stepDef(text: string, code: Function) {
    return {
        id: `sd-${text}`, code, keyword: 'Given', pattern: text, uri: '/steps', line: 1, options: {},
        expression: { match: (t: string) => (t === text ? [] : null) },
        matchesStepName: (t: string) => t === text,
        getInvocationParameters: async () => ({ parameters: [], validCodeLengths: [0, 1], getInvalidCodeLengthMessage: () => 'invalid' })
    }
}

function featureDoc(order: 'A-first' | 'B-first') {
    const a = '  Scenario: A included\n    Given step A'
    const b = '  Scenario: B excluded\n    Given step B'
    const text = `Feature: Plan feature\n\n${order === 'A-first' ? `${a}\n\n${b}` : `${b}\n\n${a}`}\n`
    const parser = new Gherkin.Parser(new Gherkin.AstBuilder(uuidFn), new Gherkin.GherkinClassicTokenMatcher())
    return { ...parser.parse(text), uri: FEATURE }
}

/** the real parallel adapter, the real base and the real Allure reporter, with a test plan that excludes B */
async function run(order: 'A-first' | 'B-first', maxParallelContexts: number) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'allure-plan-'))
    const plan = path.join(dir, 'testplan.json')
    fs.writeFileSync(plan, JSON.stringify({ version: '1.0', tests: [{ id: '1', selector: 'Plan feature A included' }, { id: '2', selector: 'Plan feature.A included' }] }))
    process.env.ALLURE_TESTPLAN_PATH = plan
    const outputDir = path.join(dir, 'allure')
    const allure = new AllureReporter({ outputDir, writeStream: { write: () => true } } as never)
    delete process.env.ALLURE_TESTPLAN_PATH
    const store = new AsyncLocalStorage<string>()
    allure.setContextIdResolver(() => store.getStore())

    const bus = new EventEmitter()
    const emit = bus.emit.bind(bus)
    bus.emit = ((event: string, payload: unknown) => {
        allure.emit(event, payload)
        return emit(event, payload)
    }) as never
    const cucumberOpts = { ...DEFAULT_OPTS, scenarioLevelReporter: false, parallelMode: 'contexts', maxParallelContexts }
    bus.emit('runner:start', { cid: '0-0', specs: [FEATURE], capabilities: { browserName: 'chrome' }, config: { framework: 'cucumber', cucumberOpts }, sessionId: 's', isMultiRemote: false, instanceOptions: {}, retry: 0 })

    const command = { sessionId: 's', method: 'GET', endpoint: '/session/:sessionId/title', command: 'getTitleFromA', body: {} }
    const steps = [
        stepDef('step A', async () => {
            await sleep(20)
            await addAttachment('A-attachment', 'from A', 'text/plain')
            bus.emit('client:beforeCommand', command)
            bus.emit('client:afterCommand', { ...command, result: { value: 'A' } })
            await sleep(20)
        }),
        stepDef('step B', async () => { await sleep(150) })
    ]
    const failures = await runParallelCucumber({
        browser: mockBrowser(store),
        reporter: bus,
        eventEmitter: new EventEmitter(),
        cid: '0-0',
        specs: [FEATURE],
        gherkinDocuments: [featureDoc(order)],
        supportCodeLibrary: supportCode(steps),
        cucumberOpts
    } as never)
    bus.emit('runner:end', { failures, cid: '0-0', retries: 0 })
    await vi.waitFor(() => expect(allure.isSynchronised).toBe(true))

    const flat = (list: any[] = []): string[] => list.flatMap((s) => [s.name, ...flat(s.steps)])
    return fs.readdirSync(outputDir).filter((f) => f.endsWith('-result.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(outputDir, f), 'utf8')))
        .map((r) => ({ name: r.name, status: r.status, stage: r.stage, steps: flat(r.steps) }))
}

// G2: the scenario that the test plan excludes does not skip the included scenario that runs at the same time
describe('Cucumber parallelMode with the Allure test plan', () => {
    test.each([['A-first', 1], ['A-first', 2], ['B-first', 2]] as const)('the included scenario ends with its attachment and command (%s, maxParallelContexts %i)', async (order, max) => {
        expect(await run(order, max)).toEqual([
            { name: 'A included', status: 'passed', stage: 'finished', steps: ['Given step A', 'A-attachment', 'getTitleFromA'] }
        ])
    }, 30000)
})
