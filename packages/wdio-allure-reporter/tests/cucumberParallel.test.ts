import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

// the real base: the scenario of each context and the feature of each scenario come from its units and tree
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

const CID = '0-0'
// fullName is the path relative to the working directory
const LOGIN = path.join(process.cwd(), 'features/login.feature')
const CART = path.join(process.cwd(), 'features/cart.feature')

type Result = Record<string, any>
type Mode = 'parallel' | 'sequential'
type Feature = { uid: string, title: string, file: string }
type Scenario = { uid: string, title: string, feature: Feature, steps: string[], contextId: string }

const login: Feature = { uid: 'f-login', title: 'Login', file: LOGIN }
const cart: Feature = { uid: 'f-cart', title: 'Cart', file: CART }

function createRun(mode: Mode, cucumberOpts: Record<string, unknown> = {}) {
    const outputDir = temporaryDirectory()
    const reporter = new AllureReporter({ outputDir, addConsoleLogs: true, writeStream: { write: () => true } } as any)
    let context: string | undefined
    reporter.setContextIdResolver(() => context)
    const emit = (type: string, payload: Record<string, unknown>) => reporter.emit(type, { type, cid: CID, specs: [LOGIN, CART], ...payload })
    const ctx = (s: Scenario) => mode === 'parallel' ? { contextId: s.contextId } : {}
    // the code of a scenario runs in its context
    const inContext = (s: Scenario, fn: () => void) => {
        context = mode === 'parallel' ? s.contextId : undefined
        try {
            fn()
        } finally {
            context = undefined
        }
    }
    const featureEvent = (event: string, f: Feature) => emit(event, { uid: f.uid, title: f.title, type: 'feature', file: f.file, parentUid: null })
    const scenarioPayload = (s: Scenario) => ({ uid: s.uid, title: s.title, type: 'scenario', parent: s.feature.uid, parentUid: s.feature.uid, file: s.feature.file })
    const stepPayload = (s: Scenario, index: number) => ({ uid: `${s.uid}-step-${index}`, title: s.steps[index], fullTitle: `${s.title}: ${s.steps[index]}`, parent: s.uid, parentUid: s.uid, file: s.feature.file })
    const failure = { name: 'Error', message: 'step exploded', stack: 'Error: step exploded\n    at step' }
    const run = {
        reporter,
        outputDir,
        start() {
            emit('runner:start', {
                capabilities: { browserName: 'chrome' }, config: { framework: 'cucumber', cucumberOpts: { ...(mode === 'parallel' ? { parallelMode: true } : {}), ...cucumberOpts } },
                isMultiRemote: false, sessionId: 's', instanceOptions: {},
            })
        },
        featureStart: (f: Feature) => featureEvent('suite:start', f),
        featureEnd: (f: Feature) => featureEvent('suite:end', f),
        scenarioStart: (s: Scenario) => inContext(s, () => emit('suite:start', { ...scenarioPayload(s), ...ctx(s) })),
        scenarioRetry: (s: Scenario) => inContext(s, () => emit('suite:retry', { ...scenarioPayload(s), ...ctx(s) })),
        // Cucumber sends no contextId on the end of a scenario
        scenarioEnd: (s: Scenario) => inContext(s, () => emit('suite:end', scenarioPayload(s))),
        contextEnd: (s: Scenario) => {
            if (mode === 'parallel') {
                emit('context:end', { uid: `${s.uid}-step-${s.steps.length - 1}`, contextId: s.contextId })
            }
        },
        hook: (s: Scenario, title: string, hookKind: string) => inContext(s, () => {
            const payload = { uid: `${s.uid}-${title}`, title, parent: s.uid, parentUid: s.uid, file: s.feature.file, hookKind }
            emit('hook:start', { ...payload, ...ctx(s) })
            emit('hook:end', { ...payload, state: 'PASSED' })
        }),
        stepStart: (s: Scenario, index: number) => inContext(s, () => emit('test:start', { ...stepPayload(s, index), ...ctx(s) })),
        stepEnd: (s: Scenario, index: number, outcome: 'pass' | 'retry' = 'pass') => inContext(s, () => {
            const payload = { ...stepPayload(s, index), ...ctx(s) }
            emit(`test:${outcome}`, { ...payload, ...(outcome === 'pass' ? { state: 'passed' } : { state: 'failed', error: failure }) })
            emit('test:end', payload)
        }),
        log: (s: Scenario, text: string) => inContext(s, () => { process.stdout.write(text) }),
        command: (s: Scenario, name: string) => inContext(s, () => {
            emit('client:beforeCommand', { command: name, method: 'POST', endpoint: '/x', body: {}, sessionId: 's', ...ctx(s) })
            emit('client:afterCommand', { command: name, method: 'POST', endpoint: '/x', result: { value: null }, sessionId: 's', ...ctx(s) })
        }),
        async end() {
            emit('runner:end', { failures: 0, retries: 0 })
            await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
            return getResults(outputDir) as { results: Result[] }
        },
    }
    return run
}

const md5 = (text: string) => createHash('md5').update(text).digest('hex')
const labelOf = (result: Result, name: string) => result.labels.filter((l: Result) => l.name === name).map((l: Result) => l.value)
const stepNames = (steps: Result[] = []): string[] => steps.flatMap((s) => [s.name, ...stepNames(s.steps)])
const consoleLogs = (outputDir: string, steps: Result[] = []): string[] => steps.flatMap((s) => [
    ...s.attachments.filter((a: Result) => a.name === 'Console Logs').map((a: Result) => fs.readFileSync(path.join(outputDir, a.source), 'utf8').replace('.........Console Logs.........\n\n', '')),
    ...consoleLogs(outputDir, s.steps),
])
const view = (outputDir: string) => (result: Result) => ({
    name: result.name,
    status: result.status,
    steps: stepNames(result.steps),
    logs: consoleLogs(outputDir, result.steps),
    feature: labelOf(result, 'feature'),
    parentSuite: labelOf(result, 'parentSuite'),
    suite: labelOf(result, 'suite'),
    fullName: result.fullName,
    historyId: result.historyId,
    testCaseId: result.testCaseId,
})
const byName = (results: Result[]) => [...results].sort((a, b) => a.name.localeCompare(b.name) || a.start - b.start)

let writeSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(() => {
    writeSpy.mockRestore()
})

// the historyId and testCaseId of today: md5 of the feature, the scenario and the browser (no cid, no file)
const SEQUENTIAL = {
    ok: { fullName: 'features/login.feature#Login ok', historyId: md5('Login ok#chrome') },
    add: { fullName: 'features/cart.feature#Cart add', historyId: md5('Cart add#chrome') },
}

/** 2 grouped feature files; the scenario of each feature runs in its own context */
function playGrouped(mode: Mode) {
    const ok: Scenario = { uid: 's-ok', title: 'ok', feature: login, steps: ['Given a', 'Then b'], contextId: 'ctx-ok' }
    const add: Scenario = { uid: 's-add', title: 'add', feature: cart, steps: ['Given c'], contextId: 'ctx-add' }
    const run = createRun(mode)
    run.start()
    if (mode === 'parallel') {
        // parallel mode starts every feature first, and ends them at the end
        run.featureStart(login)
        run.featureStart(cart)
        run.scenarioStart(ok)
        run.scenarioStart(add)
        run.stepStart(ok, 0)
        run.stepStart(add, 0)
        run.command(ok, 'ok-a')
        run.log(add, 'log of add\n')
        run.command(add, 'add-c')
        run.log(ok, 'log of ok a\n')
        run.stepEnd(ok, 0)
        run.stepStart(ok, 1)
        run.stepEnd(add, 0)
        run.hook(add, 'After', 'afterEach')
        run.scenarioEnd(add)
        run.contextEnd(add)
        // the scenario that ended does not close the steps of the scenario that still runs
        run.log(ok, 'log of ok b\n')
        run.command(ok, 'ok-b')
        run.stepEnd(ok, 1)
        run.scenarioEnd(ok)
        run.contextEnd(ok)
        run.featureEnd(cart)
        run.featureEnd(login)
    } else {
        run.featureStart(login)
        run.scenarioStart(ok)
        run.stepStart(ok, 0)
        run.command(ok, 'ok-a')
        run.log(ok, 'log of ok a\n')
        run.stepEnd(ok, 0)
        run.stepStart(ok, 1)
        run.log(ok, 'log of ok b\n')
        run.command(ok, 'ok-b')
        run.stepEnd(ok, 1)
        run.scenarioEnd(ok)
        run.featureEnd(login)
        run.featureStart(cart)
        run.scenarioStart(add)
        run.stepStart(add, 0)
        run.log(add, 'log of add\n')
        run.command(add, 'add-c')
        run.stepEnd(add, 0)
        run.hook(add, 'After', 'afterEach')
        run.scenarioEnd(add)
        run.featureEnd(cart)
    }
    return run
}

describe('Cucumber parallelMode, step level', () => {
    const expected = [
        {
            name: 'add', status: 'passed', steps: ['Given c', 'add-c'], logs: ['log of add\n'],
            feature: ['Cart'], parentSuite: ['Cart'], suite: [], ...SEQUENTIAL.add, testCaseId: SEQUENTIAL.add.historyId,
        },
        {
            name: 'ok', status: 'passed', steps: ['Given a', 'ok-a', 'Then b', 'ok-b'], logs: ['log of ok a\n', 'log of ok b\n'],
            feature: ['Login'], parentSuite: ['Login'], suite: [], ...SEQUENTIAL.ok, testCaseId: SEQUENTIAL.ok.historyId,
        },
    ]

    it('keeps today\'s output of a sequential run (historyId, testCaseId, fullName and labels)', async () => {
        const run = playGrouped('sequential')
        const { results } = await run.end()

        expect(byName(results).map(view(run.outputDir))).toEqual(expected)
    })

    it('keeps the steps, commands and logs of 2 overlapping scenarios of grouped features with their own scenario, feature and historyId (R4, K14)', async () => {
        const run = playGrouped('parallel')
        const { results } = await run.end()

        expect(byName(results).map(view(run.outputDir))).toEqual(expected)
    })

    it('gives every attempt of a retried scenario the same historyId, and the failed attempt its error (K12)', async () => {
        const flaky: Scenario = { uid: 's-flaky', title: 'flaky', feature: login, steps: ['Given a'], contextId: 'ctx-flaky' }
        const results: Result[][] = []
        for (const mode of ['sequential', 'parallel'] as const) {
            const run = createRun(mode)
            run.start()
            run.featureStart(login)
            run.scenarioStart(flaky)
            run.stepStart(flaky, 0)
            run.stepEnd(flaky, 0, 'retry')
            run.scenarioRetry(flaky)
            run.stepStart(flaky, 0)
            run.stepEnd(flaky, 0)
            run.scenarioEnd(flaky)
            run.contextEnd(flaky)
            run.featureEnd(login)
            // the retried attempt first
            results.push((await run.end()).results.sort((a, b) => labelOf(b, 'tag').length - labelOf(a, 'tag').length))
        }

        for (const attempts of results) {
            expect(attempts.map((r) => [r.status, r.statusDetails?.message, labelOf(r, 'tag')])).toEqual([
                ['broken', 'step exploded', ['retried']],
                ['passed', undefined, []],
            ])
            expect(attempts.map((r) => r.historyId)).toEqual([md5('Login flaky#chrome'), md5('Login flaky#chrome')])
            expect(attempts.map((r) => r.fullName)).toEqual(['features/login.feature#Login flaky', 'features/login.feature#Login flaky'])
        }
    })
})

// G2: the test plan skips a scenario in its own unit, not in every scenario of the worker
describe('Cucumber parallelMode with a test plan', () => {
    const included: Scenario = { uid: 's-ok', title: 'ok', feature: login, steps: ['Given a'], contextId: 'ctx-ok' }
    const excluded: Scenario = { uid: 's-out', title: 'out', feature: login, steps: ['Given x'], contextId: 'ctx-out' }

    function planRun(mode: Mode) {
        const dir = temporaryDirectory()
        const plan = path.join(dir, 'testplan.json')
        fs.writeFileSync(plan, JSON.stringify({ version: '1.0', tests: [{ id: '1', selector: 'Login ok' }, { id: '2', selector: 'Login.ok' }] }))
        process.env.ALLURE_TESTPLAN_PATH = plan
        try {
            return createRun(mode)
        } finally {
            delete process.env.ALLURE_TESTPLAN_PATH
        }
    }

    // the included scenario ends while the excluded one runs
    async function play(order: 'included-first' | 'excluded-first', mode: Mode = 'parallel') {
        const run = planRun(mode)
        run.start()
        run.featureStart(login)
        const [first, second] = order === 'included-first' ? [included, excluded] : [excluded, included]
        run.scenarioStart(first)
        run.stepStart(first, 0)
        run.scenarioStart(second)
        run.stepStart(second, 0)
        run.command(included, 'ok-command')
        run.stepEnd(included, 0)
        run.scenarioEnd(included)
        run.contextEnd(included)
        run.command(excluded, 'out-command')
        run.stepEnd(excluded, 0)
        run.scenarioEnd(excluded)
        run.contextEnd(excluded)
        run.featureEnd(login)
        const { results } = await run.end()
        return results.map((r) => ({ name: r.name, status: r.status, stage: r.stage, steps: stepNames(r.steps) }))
    }

    it.each(['included-first', 'excluded-first'] as const)('ends the included scenario with its command step (%s)', async (order) => {
        expect(await play(order)).toEqual([{ name: 'ok', status: 'passed', stage: 'finished', steps: ['Given a', 'ok-command'] }])
    })
})

describe('Cucumber parallelMode, scenario level', () => {
    // scenario level: the scenario is the test; a retried attempt ends with test:retry and starts again in its context
    async function playRetried(mode: Mode) {
        const flaky: Scenario = { uid: 's-flaky', title: 'flaky', feature: login, steps: [], contextId: 'ctx-flaky' }
        const other: Scenario = { uid: 's-other', title: 'other', feature: cart, steps: [], contextId: 'ctx-other' }
        const run = createRun(mode, { scenarioLevelReporter: true })
        const test = (s: Scenario, event: string, extra: Record<string, unknown> = {}) => run.reporter.emit(event, {
            type: event, cid: CID, specs: [LOGIN, CART], uid: s.uid, title: s.title, parent: s.feature.uid, parentUid: s.feature.uid,
            file: s.feature.file, ...(mode === 'parallel' ? { contextId: s.contextId } : {}), ...extra,
        })
        const inContext = (s: Scenario, fn: () => void) => {
            run.reporter.setContextIdResolver(() => mode === 'parallel' ? s.contextId : undefined)
            fn()
            run.reporter.setContextIdResolver(() => undefined)
        }
        run.start()
        run.featureStart(login)
        if (mode === 'sequential') {
            inContext(flaky, () => test(flaky, 'test:start'))
            inContext(flaky, () => { process.stdout.write('log 0\n') })
            inContext(flaky, () => test(flaky, 'test:retry', { state: 'failed', error: { name: 'Error', message: 'attempt 0 fails', stack: 'Error' } }))
            inContext(flaky, () => test(flaky, 'test:start'))
            inContext(flaky, () => { process.stdout.write('log 1\n') })
            inContext(flaky, () => test(flaky, 'test:pass', { state: 'passed' }))
            inContext(flaky, () => test(flaky, 'test:end'))
            run.featureEnd(login)
            run.featureStart(cart)
            inContext(other, () => test(other, 'test:start'))
            inContext(other, () => test(other, 'test:pass', { state: 'passed' }))
            inContext(other, () => test(other, 'test:end'))
            run.featureEnd(cart)
        } else {
            run.featureStart(cart)
            inContext(flaky, () => test(flaky, 'test:start'))
            inContext(other, () => test(other, 'test:start'))
            inContext(flaky, () => { process.stdout.write('log 0\n') })
            inContext(flaky, () => test(flaky, 'test:retry', { state: 'failed', error: { name: 'Error', message: 'attempt 0 fails', stack: 'Error' } }))
            inContext(other, () => test(other, 'test:pass', { state: 'passed' }))
            inContext(other, () => test(other, 'test:end'))
            run.contextEnd({ ...other, steps: ['x'] })
            inContext(flaky, () => test(flaky, 'test:start'))
            inContext(flaky, () => { process.stdout.write('log 1\n') })
            inContext(flaky, () => test(flaky, 'test:pass', { state: 'passed' }))
            inContext(flaky, () => test(flaky, 'test:end'))
            run.contextEnd({ ...flaky, steps: ['x'] })
            run.featureEnd(cart)
            run.featureEnd(login)
        }
        const { results } = await run.end()
        return results
            .map((r) => ({
                name: r.name, status: r.status, retried: labelOf(r, 'tag').includes('retried'), parentSuite: labelOf(r, 'parentSuite'),
                logs: consoleLogs(run.outputDir, [r]), historyId: r.historyId, fullName: r.fullName,
            }))
            .sort((a, b) => a.name.localeCompare(b.name) || Number(b.retried) - Number(a.retried))
    }

    it('gives both attempts of a retried scenario one historyId, their own logs, and the same results as a sequential run', async () => {
        const sequential = await playRetried('sequential')

        expect(sequential).toEqual([
            { name: 'flaky', status: 'broken', retried: true, parentSuite: ['Login'], logs: ['log 0\n'], historyId: md5('Login flaky#chrome'), fullName: 'features/login.feature#flaky' },
            { name: 'flaky', status: 'passed', retried: false, parentSuite: ['Login'], logs: ['log 1\n'], historyId: md5('Login flaky#chrome'), fullName: 'features/login.feature#flaky' },
            { name: 'other', status: 'passed', retried: false, parentSuite: ['Cart'], logs: [], historyId: md5('Cart other#chrome'), fullName: 'features/cart.feature#other' },
        ])
        expect(await playRetried('parallel')).toEqual(sequential)
    })
})

