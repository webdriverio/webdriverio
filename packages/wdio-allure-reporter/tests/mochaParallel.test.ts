import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { events } from '../src/constants.js'
import { getResults } from './helpers/wdio-allure-helper.js'

// the shared mock replaces the base class, but the lane key comes from the real resolver
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

const CID = '0-0'
const SPEC = '/tmp/user/mocha.spec.js'
const HOOK_KINDS = ['before all', 'before each', 'after each', 'after all'] as const

type Outcome = 'pass' | 'fail' | 'skip-static' | 'skip-runtime' | 'hook-fail'
type Mode = 'parallel' | 'sequential'
type PlannedTest = {
    id: string
    title: string
    suites: string[]
    outcome: Outcome
    hooks?: boolean
    /** sequential Mocha runs a suite's all-hooks once, around all of its tests */
    noBeforeAll?: boolean
    noAfterAll?: boolean
    /** leave the lane open: no pass/fail/end */
    unfinished?: boolean
    /** a framework that sends the after hooks of a parallel test before its test:end, and no context:end */
    afterHooksBeforeEnd?: boolean
    afterEachFails?: boolean
    /** an afterEach that calls the Allure runtime API */
    afterEachApi?: boolean
    afterAllFails?: boolean
}

const A1: PlannedTest = { id: 'a1', title: 'passes', suites: ['A'], outcome: 'pass' }
const B1: PlannedTest = { id: 'b1', title: 'fails', suites: ['B'], outcome: 'fail' }
const E1: PlannedTest = { id: 'e1', title: 'skips at runtime', suites: ['E'], outcome: 'skip-runtime' }
const F1: PlannedTest = { id: 'f1', title: 'skips statically', suites: ['F'], outcome: 'skip-static', hooks: false }
const D1: PlannedTest = { id: 'd1', title: 'nested', suites: ['C', 'D'], outcome: 'pass' }

const suiteUids = (tests: PlannedTest[]) => {
    const uids = new Map<string, string>()
    const parents = new Map<string, string | null>()
    for (const test of tests) {
        test.suites.forEach((title, depth) => {
            const key = test.suites.slice(0, depth + 1).join('>')
            if (!uids.has(key)) {
                uids.set(key, `suite-${CID}-${uids.size + 1}`)
                parents.set(key, depth === 0 ? null : uids.get(test.suites.slice(0, depth).join('>'))!)
            }
        })
    }
    return { uids, parents }
}

type Harness = ReturnType<typeof createHarness>

function createHarness(mode: Mode, tests: PlannedTest[], options: Record<string, unknown> = {}) {
    const outputDir = temporaryDirectory()
    const { uids, parents } = suiteUids(tests)
    let currentContext: string | undefined
    const reporter = new AllureReporter({
        outputDir,
        addConsoleLogs: true,
        writeStream: { write: () => true },
        ...options,
    } as any)
    if (mode === 'parallel') {
        reporter.setContextIdResolver(() => currentContext)
    }
    const emit = (event: string, payload: Record<string, unknown>) => reporter.emit(event, payload)
    const inContext = (test: PlannedTest, fn: () => void) => {
        currentContext = mode === 'parallel' ? `ctx-${test.id}` : undefined
        try {
            fn()
        } finally {
            currentContext = undefined
        }
    }
    const leafKey = (test: PlannedTest) => test.suites.join('>')
    const message = (type: string, test: PlannedTest, uid: string, extra: Record<string, unknown> = {}) => ({
        type,
        cid: CID,
        specs: [SPEC],
        uid,
        title: test.title,
        fullTitle: `${test.suites.join(' ')} ${test.title}`,
        parent: test.suites.at(-1),
        file: SPEC,
        parentUid: uids.get(leafKey(test)),
        ...(mode === 'parallel' ? { contextId: `ctx-${test.id}` } : {}),
        ...extra,
    })
    const hookMessage = (type: string, kind: string, test: PlannedTest, uid: string, extra: Record<string, unknown> = {}) => ({
        ...message(type, test, uid, extra),
        title: `"${kind}" hook for ${test.suites.at(-1)}`,
        fullTitle: `${test.suites.at(-1)}.${kind} hook`,
    })
    const command = (type: 'client:beforeCommand' | 'client:afterCommand', test: PlannedTest, name: string) => ({
        command: name,
        params: [],
        cid: CID,
        sessionId: 'session',
        ...(mode === 'parallel' ? { contextId: `ctx-${test.id}` } : {}),
        ...(type === 'client:afterCommand' ? { result: undefined } : {}),
    })
    const suiteMessage = (type: string, key: string) => {
        const titles = key.split('>')
        return {
            type, cid: CID, specs: [SPEC], uid: uids.get(key), title: titles.at(-1), fullTitle: titles.join(' '),
            parent: '', file: SPEC, parentUid: parents.get(key),
        }
    }
    return { outputDir, reporter, emit, inContext, message, hookMessage, command, suiteMessage, uids, mode }
}

/** the steps one test emits, in the order its Mocha lifecycle produces them */
function scriptOf(h: Harness, test: PlannedTest): Array<() => void> {
    const { emit, message, hookMessage, command } = h
    const steps: Array<() => void> = []
    const run = (fn: () => void) => steps.push(() => h.inContext(test, fn))
    let hookCount = 0
    const cmd = (name: string) => {
        run(() => emit('client:beforeCommand', command('client:beforeCommand', test, name)))
        run(() => emit('client:afterCommand', command('client:afterCommand', test, name)))
    }
    const log = (text: string) => run(() => { process.stdout.write(text) })
    const hook = (kind: typeof HOOK_KINDS[number], body: () => void, error?: Error) => {
        if (test.hooks === false || (kind === 'before all' && test.noBeforeAll) || (kind === 'after all' && test.noAfterAll)) { return }
        const uid = `hook-${test.id}-${hookCount++}`
        run(() => emit('hook:start', hookMessage('hook:start', kind, test, uid)))
        body()
        run(() => emit('hook:end', hookMessage('hook:end', kind, test, uid, {
            state: error ? 'fail' : 'pass',
            ...(error ? { error: { name: error.name, message: error.message, stack: error.stack } } : {}),
        })))
    }
    const hookBody = (kind: string, withStep = false) => () => {
        cmd(`${test.id}-${kind}`)
        if (withStep) {
            run(() => process.emit(events.startStep as any, `${test.id}-${kind}-step` as any))
            run(() => process.emit(events.endStep as any, 'passed' as any))
        }
        log(`${kind}-log-${test.id}\n`)
    }
    const failure = { name: 'AssertionError', message: `expected ${test.id}`, stack: `AssertionError: expected ${test.id}\n    at test` }
    const finish = (kind: 'test:pass' | 'test:fail' | 'test:pending') => {
        const extra = kind === 'test:fail' ? { error: failure, passed: false } : kind === 'test:pending' ? { pending: true } : { passed: true }
        run(() => emit(kind, message(kind, test, test.id, { duration: 1, ...extra })))
        run(() => emit('test:end', message('test:end', test, test.id, { duration: 1, ...extra })))
    }
    const start = () => run(() => emit('test:start', message('test:start', test, test.id)))
    const contextEnd = () => {
        if (h.mode === 'parallel' && !test.afterHooksBeforeEnd) {
            run(() => emit('context:end', { type: 'context:end', cid: CID, specs: [SPEC], uid: test.id, contextId: `ctx-${test.id}` }))
        }
    }
    const body = () => {
        run(() => process.emit(events.startStep as any, `${test.id}-step` as any))
        run(() => h.reporter.addAttachment({ name: `${test.id}-attachment`, content: `content of ${test.id}`, type: 'text/plain' }))
        run(() => process.emit(events.endStep as any, 'passed' as any))
        cmd(`${test.id}-body`)
        log(`body-log-${test.id}\n`)
    }
    const finishKind = test.outcome === 'fail' || test.outcome === 'hook-fail' ? 'test:fail'
        : test.outcome === 'pass' ? 'test:pass' : 'test:pending'

    if (test.outcome === 'skip-static') {
        finish('test:pending')
        contextEnd()
        return steps
    }
    if (test.outcome === 'hook-fail') {
        hook('before all', hookBody('before all'), new Error('before all exploded'))
        hook('after all', hookBody('after all'))
        start()
        finish('test:fail')
        contextEnd()
        return steps
    }

    const afterHooks = () => {
        hook('after each', () => {
            hookBody('after each')()
            if (test.afterEachApi) {
                run(() => h.reporter.addAttachment({ name: `${test.id}-ae-attachment`, content: 'from afterEach', type: 'text/plain' }))
                run(() => process.emit(events.startStep as any, `${test.id}-ae-api-step` as any))
                run(() => process.emit(events.endStep as any, 'passed' as any))
            }
        }, test.afterEachFails ? new Error('after each exploded') : undefined)
        hook('after all', hookBody('after all'), test.afterAllFails ? new Error('after all exploded') : undefined)
    }
    hook('before all', hookBody('before all', true))
    start()
    hook('before each', hookBody('before each'))
    body()
    if (test.unfinished) { return steps }
    if (h.mode === 'parallel' && test.afterHooksBeforeEnd) {
        afterHooks()
        finish(finishKind)
    } else {
        finish(finishKind)
        afterHooks()
    }
    contextEnd()
    return steps
}

function interleave(scripts: Array<Array<() => void>>) {
    const longest = Math.max(...scripts.map((s) => s.length))
    for (let i = 0; i < longest; i++) {
        scripts.forEach((script) => script[i]?.())
    }
}

async function play(mode: Mode, tests: PlannedTest[], extra?: (h: Harness) => void | Promise<void>, parallelConfigured = mode === 'parallel', options?: Record<string, unknown>) {
    const h = createHarness(mode, tests, options)
    const config = { framework: 'mocha', mochaOpts: parallelConfigured ? { parallelMode: true } : {} }
    h.emit('runner:start', {
        cid: CID, specs: [SPEC], capabilities: { browserName: 'chrome' }, config,
        isMultiRemote: false, sessionId: 'session', instanceOptions: {},
    })
    const suiteKeys = [...h.uids.keys()]
    if (mode === 'parallel') {
        suiteKeys.forEach((key) => h.emit('suite:start', h.suiteMessage('suite:start', key)))
        interleave(tests.map((test) => scriptOf(h, test)))
        await extra?.(h)
        suiteKeys.reverse().forEach((key) => h.emit('suite:end', h.suiteMessage('suite:end', key)))
    } else {
        // tests of one top-level suite run one after another, suites nested in order
        const open: string[] = []
        const leafKey = (test: PlannedTest) => test.suites.join('>')
        for (const test of tests) {
            const keys = test.suites.map((_, i) => test.suites.slice(0, i + 1).join('>'))
            while (open.length && open.at(-1) !== keys[open.length - 1]) {
                h.emit('suite:end', h.suiteMessage('suite:end', open.pop()!))
            }
            keys.slice(open.length).forEach((key) => {
                open.push(key)
                h.emit('suite:start', h.suiteMessage('suite:start', key))
            })
            const siblings = tests.filter((other) => leafKey(other) === leafKey(test))
            const shared = { ...test, noBeforeAll: siblings[0] !== test, noAfterAll: siblings.at(-1) !== test }
            scriptOf(h, shared).forEach((step) => step())
        }
        while (open.length) { h.emit('suite:end', h.suiteMessage('suite:end', open.pop()!)) }
        await extra?.(h)
    }
    h.emit('runner:end', { cid: CID, failures: 0, retries: 0 })
    await vi.waitFor(() => expect(h.reporter.isSynchronised).toBe(true))
    return { h, ...getResults(h.outputDir) }
}

type Result = Record<string, any>
const byName = (results: Result[], name: string) => results.find((r) => r.name === name)!
const stepNames = (steps: Result[] = []): string[] => steps.flatMap((s) => [s.name, ...stepNames(s.steps)])
const labelValues = (result: Result, name: string) =>
    result.labels.filter((l: Result) => l.name === name).map((l: Result) => l.value)
const childrenOf = (containers: Result[], result: Result) => containers.filter((c) => c.children.includes(result.uuid))
const fixtures = (container: Result, kind: 'befores' | 'afters') => container[kind] as Result[]
const attachmentText = (outputDir: string, attachment: Result) =>
    fs.readFileSync(path.join(outputDir, attachment.source), 'utf8')

const listeners: Array<[string, (...args: any[]) => void]> = []
let onSpy: ReturnType<typeof vi.spyOn>
let writeSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
    const originalOn = process.on.bind(process)
    onSpy = vi.spyOn(process, 'on').mockImplementation(((event: string, listener: (...args: any[]) => void) => {
        listeners.push([event, listener])
        return originalOn(event, listener)
    }) as any)
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(() => {
    listeners.splice(0).forEach(([event, listener]) => process.off(event, listener))
    onSpy.mockRestore()
    writeSpy.mockRestore()
})

describe('Mocha parallel mode', () => {
    describe('overlapping tests', () => {
        const NOT_STARTED: PlannedTest = { id: 'n1', title: 'never starts', suites: ['N'], outcome: 'hook-fail' }
        const UNFINISHED: PlannedTest = { id: 'x1', title: 'never ends', suites: ['X'], outcome: 'pass', unfinished: true }
        let results: Result[]
        let containers: Result[]
        let outputDir: string

        beforeEach(async () => {
            const played = await play('parallel', [A1, B1, E1, F1, D1, NOT_STARTED, UNFINISHED], (h) => {
                // the lane of a1 is closed: nothing resolving to it may reach any result any more
                h.inContext(A1, () => {
                    process.emit(events.startStep as any, 'late step' as any)
                    h.emit('client:beforeCommand', h.command('client:beforeCommand', A1, 'late command'))
                    h.emit('client:afterCommand', h.command('client:afterCommand', A1, 'late command'))
                    process.stdout.write('late log')
                })
            })
            results = played.results
            containers = played.containers
            outputDir = played.h.outputDir
        })

        it('keeps steps, attachments and console logs with the test that produced them', () => {
            const passed = byName(results, A1.title)
            const failed = byName(results, B1.title)

            expect(passed.status).toBe('passed')
            expect(failed.status).toBe('failed')
            expect(failed.statusDetails.message).toBe('expected b1')
            expect(stepNames(passed.steps)).toEqual(['a1-step', 'a1-body'])
            expect(stepNames(failed.steps)).toEqual(['b1-step', 'b1-body'])

            const attachments = (result: Result) => result.attachments.concat(...result.steps.map((s: Result) => s.attachments))
            expect(attachments(passed).map((a: Result) => a.name)).toEqual(['Console Logs', 'a1-attachment'])
            const logs = attachmentText(outputDir, attachments(passed)[0])
            expect(logs).toContain('before each-log-a1')
            expect(logs).toContain('body-log-a1')
            expect(logs).not.toMatch(/b1|late log|after each-log|before all-log/)
            expect(attachmentText(outputDir, attachments(failed)[0])).toContain('body-log-b1')
        })

        it('gives every test its own suite labels and title path', () => {
            const passed = byName(results, A1.title)
            expect(labelValues(passed, 'parentSuite')).toEqual(['A'])
            expect(labelValues(byName(results, B1.title), 'parentSuite')).toEqual(['B'])
            const nested = byName(results, D1.title)
            expect(labelValues(nested, 'parentSuite')).toEqual(['C'])
            expect(labelValues(nested, 'suite')).toEqual(['D'])
            expect(nested.titlePath).toEqual(expect.arrayContaining(['C', 'D']))
            expect(passed.titlePath).toContain('A')
            expect(passed.titlePath).not.toContain('B')
            expect(passed.fullName).toContain('A passes')
        })

        it('creates before and after fixtures per test with only that test\'s steps', () => {
            const passed = byName(results, A1.title)
            const own = childrenOf(containers, passed)
            const befores = own.flatMap((c) => fixtures(c, 'befores') ?? [])
            const afters = own.flatMap((c) => fixtures(c, 'afters') ?? [])

            expect(befores.map((f) => f.name).sort()).toEqual(['"before all" hook for A', '"before each" hook for A'])
            expect(afters.map((f) => f.name).sort()).toEqual(['"after all" hook for A', '"after each" hook for A'])
            expect(stepNames(befores.find((f) => f.name.includes('before all'))!.steps)).toEqual(['a1-before all', 'a1-before all-step'])
            expect(stepNames(befores.find((f) => f.name.includes('before each'))!.steps)).toEqual(['a1-before each'])
            expect(stepNames(afters.find((f) => f.name.includes('after each'))!.steps)).toEqual(['a1-after each'])
            expect(stepNames(afters.find((f) => f.name.includes('after all'))!.steps)).toEqual(['a1-after all'])
            // names only: the random uuids of the JSON can contain `b1-`
            expect(stepNames([...befores, ...afters]).filter((name) => name.includes('b1-'))).toEqual([])
        })

        it('reports a failing after all hook after test:end as broken, for each test', async () => {
            const first: PlannedTest = { id: 'h1', title: 'first', suites: ['H'], outcome: 'pass', afterAllFails: true }
            const second: PlannedTest = { id: 'h2', title: 'second', suites: ['H'], outcome: 'pass', afterAllFails: true }
            const played = await play('parallel', [first, second])

            expect(played.results.map((r) => `${r.status} ${r.name}`).sort()).toEqual([
                'broken "after all" hook for H', 'broken "after all" hook for H', 'passed first', 'passed second',
            ])
        })

        it.each([
            ['after each', {}], ['after all', {}],
            ['after each', { disableMochaHooks: true }], ['after all', { disableMochaHooks: true }],
        ] as const)('reports a failing %s hook after test:end as a sequential run does (%j)', async (kind, options) => {
            const fails = kind === 'after each' ? { afterEachFails: true } : { afterAllFails: true }
            const tests: PlannedTest[] = [
                { id: 'h1', title: 'first', suites: ['H'], outcome: 'pass', ...fails },
                { id: 'i1', title: 'second', suites: ['I'], outcome: 'pass', ...fails },
            ]
            const summary = (played: { results: Result[] }) => played.results.map((r) => `${r.status} ${r.name}`).sort()
            const sequential = summary(await play('sequential', tests, undefined, false, options))

            expect(sequential.filter((r) => r.includes(`"${kind}" hook`))).toHaveLength(2)
            expect(summary(await play('parallel', tests, undefined, true, options))).toEqual(sequential)
        })

        it('gives a test the steps of its hooks as a sequential run does, with disableMochaHooks', async () => {
            const tests: PlannedTest[] = [
                { id: 'h1', title: 'first', suites: ['H'], outcome: 'pass' },
                { id: 'i1', title: 'second', suites: ['I'], outcome: 'fail' },
            ]
            const steps = (played: { results: Result[] }) => Object.fromEntries(played.results.map((r) => [r.name, stepNames(r.steps)]))
            const options = { disableMochaHooks: true }

            const sequential = steps(await play('sequential', tests, undefined, false, options))
            expect(steps(await play('parallel', tests, undefined, true, options))).toEqual(sequential)
        })

        it('keeps the Allure API calls of an afterEach on its test as a sequential run does, with disableMochaHooks', async () => {
            const tests: PlannedTest[] = [
                { id: 'h1', title: 'first', suites: ['H'], outcome: 'pass', afterEachApi: true },
                { id: 'i1', title: 'second', suites: ['I'], outcome: 'fail', afterEachApi: true },
            ]
            const content = (played: { results: Result[] }) => Object.fromEntries(played.results.map((r) => [
                r.name, { steps: stepNames(r.steps), attachments: (r.attachments as Result[]).map((a) => a.name) },
            ]))
            const options = { disableMochaHooks: true }
            const sequential = content(await play('sequential', tests, undefined, false, options))

            expect(JSON.stringify(sequential)).toContain('h1-ae-api-step')
            expect(content(await play('parallel', tests, undefined, true, options))).toEqual(sequential)
        })

        it('keeps the after hooks that an older framework sends before test:end', async () => {
            const legacy: PlannedTest = { ...A1, id: 'l1', title: 'legacy order', afterHooksBeforeEnd: true }
            const played = await play('parallel', [legacy, B1])
            const afters = childrenOf(played.containers, byName(played.results, legacy.title)).flatMap((c) => fixtures(c, 'afters') ?? [])

            expect(afters.map((f) => f.name).sort()).toEqual(['"after all" hook for A', '"after each" hook for A'])
            expect(stepNames(afters.find((f) => f.name.includes('after each'))!.steps)).toEqual(['l1-after each'])
        })

        it('reports skipped tests, with and without hooks', () => {
            expect(byName(results, E1.title).status).toBe('skipped')
            const staticSkip = byName(results, F1.title)
            expect(staticSkip.status).toBe('skipped')
            expect(staticSkip.steps).toEqual([])
            expect(labelValues(staticSkip, 'parentSuite')).toEqual([])
            expect(staticSkip.titlePath).toContain('F')
        })

        it('reports a test whose before hook failed without leaking into other tests', () => {
            const notStarted = byName(results, NOT_STARTED.title)
            expect(notStarted.status).toBe('failed')
            expect(stepNames(notStarted.steps)).toEqual([])
            expect(byName(results, '"before all" hook for N').status).toBe('broken')
            expect(JSON.stringify(byName(results, A1.title))).not.toContain('before all exploded')
        })

        it('writes a lane that never saw test:end when the runner ends', () => {
            const unfinished = byName(results, UNFINISHED.title)
            expect(stepNames(unfinished.steps)).toEqual(['x1-step', 'x1-body'])
        })

        it('drops messages that arrive after the test ended', () => {
            expect(JSON.stringify([results, containers])).not.toContain('late')
            expect(stepNames(byName(results, A1.title).steps)).toEqual(['a1-step', 'a1-body'])
        })

        it('writes exactly one result per test', () => {
            expect(results.map((r) => r.name).sort()).toEqual([
                '"before all" hook for N', A1.title, B1.title, D1.title, E1.title, F1.title, NOT_STARTED.title, UNFINISHED.title,
            ].sort())
        })
    })

    describe('against the sequential report of the same tests', () => {
        const normalize = (outputDir: string, results: Result[], containers: Result[]) => {
            const names = new Map(results.map((r) => [r.uuid, r.name]))
            const cleanStep = (step: Result): Result => ({
                name: step.name,
                status: step.status,
                attachments: (step.attachments ?? []).map((a: Result) => ({ name: a.name, type: a.type, content: attachmentText(outputDir, a) })),
                steps: (step.steps ?? []).map(cleanStep),
            })
            return {
                results: results.map((r) => ({
                    name: r.name,
                    status: r.status,
                    stage: r.stage,
                    fullName: r.fullName,
                    titlePath: r.titlePath,
                    historyId: r.historyId,
                    labels: r.labels.map((l: Result) => `${l.name}=${l.value}`).sort(),
                    parameters: r.parameters,
                    statusDetails: r.statusDetails?.message,
                    fixtures: r.fixtures,
                    ...cleanStep(r),
                })).sort((a, b) => a.name.localeCompare(b.name)),
                containers: containers.map((c) => ({
                    children: c.children.map((id: string) => names.get(id)).sort(),
                    befores: c.befores.map(cleanStep),
                    afters: c.afters.map(cleanStep),
                })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
            }
        }

        it('produces the same results and containers when each suite has one test', async () => {
            // first: sequential reporting leaks the previous test's trailing console output into a static skip
            const tests = [F1, A1, B1, E1, D1]
            const parallel = await play('parallel', tests)
            const sequential = await play('sequential', tests)

            expect(sequential.results).toHaveLength(tests.length)
            expect(normalize(parallel.h.outputDir, parallel.results, parallel.containers))
                .toEqual(normalize(sequential.h.outputDir, sequential.results, sequential.containers))
        })

        it('differs only in the container of a before all hook shared by tests', async () => {
            const first: PlannedTest = { id: 'p1', title: 'first', suites: ['Shared'], outcome: 'pass' }
            const second: PlannedTest = { id: 'p2', title: 'second', suites: ['Shared'], outcome: 'pass' }
            const parallel = await play('parallel', [first, second])
            const sequential = await play('sequential', [first, second])

            const allHookContainers = (containers: Result[]) =>
                containers.filter((c) => [...c.befores, ...c.afters].some((f: Result) => /^"(before|after) all"/.test(f.name)))
            const sequentialAll = allHookContainers(sequential.containers)
            const parallelAll = allHookContainers(parallel.containers)
            expect(sequentialAll).toHaveLength(2)
            sequentialAll.forEach((c) => expect(c.children).toHaveLength(2))
            expect(parallelAll).toHaveLength(4)
            parallelAll.forEach((c) => expect(c.children).toHaveLength(1))

            const parallelData = normalize(parallel.h.outputDir, parallel.results, parallel.containers)
            const sequentialData = normalize(sequential.h.outputDir, sequential.results, sequential.containers)
            // the shared hook is reported on the first test's result in sequential order, once per test in parallel
            const withoutFixtures = (data: typeof parallelData) => data.results.map(({ fixtures: _fixtures, ...rest }) => rest)
            expect(withoutFixtures(parallelData)).toEqual(withoutFixtures(sequentialData))
            const eachHookContainers = (data: typeof parallelData) =>
                data.containers.filter((c) => ![...c.befores, ...c.afters].some((f: Result) => /^"(before|after) all"/.test(f.name)))
            expect(eachHookContainers(parallelData)).toEqual(eachHookContainers(sequentialData))
        })
    })

    describe('failed before all hooks', () => {
        it('keeps a distinct history id when two suites share the same hook title', async () => {
            const first: PlannedTest = { id: 'h1', title: 'first', suites: ['Outer A', 'Shared'], outcome: 'hook-fail' }
            const second: PlannedTest = { id: 'h2', title: 'second', suites: ['Outer B', 'Shared'], outcome: 'hook-fail' }
            const { results } = await play('parallel', [first, second])

            const hookResults = results.filter((r) => r.name === '"before all" hook for Shared')
            expect(hookResults).toHaveLength(2)
            expect(hookResults.map((r) => r.statusDetails.message)).toEqual([
                'before all exploded',
                'before all exploded',
            ])
            const historyIds = hookResults.map((r) => r.historyId)
            expect(historyIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
            expect(new Set(historyIds).size).toBe(2)
        })
    })

    describe('result timing and console logs', () => {
        const writtenNames = (h: Harness) => getResults(h.outputDir).results.map((r: Result) => r.name)

        it('writes a test when its context ends, while another lane is open', async () => {
            const done: PlannedTest = { ...A1, noAfterAll: true }
            const unfinished: PlannedTest = { id: 'x1', title: 'never ends', suites: ['X'], outcome: 'pass', unfinished: true }
            let writtenEarly: string[] = []
            await play('parallel', [done, unfinished], async (h) => {
                await vi.waitFor(() => expect(writtenNames(h)).toContain(done.title))
                writtenEarly = writtenNames(h)
            })
            expect(writtenEarly).toEqual([done.title])
        })

        it('writes an ended test at the first suite:end when an older framework sends no context:end', async () => {
            const legacy: PlannedTest = { ...A1, afterHooksBeforeEnd: true }
            const h = createHarness('parallel', [legacy, B1])
            h.emit('runner:start', {
                cid: CID, specs: [SPEC], capabilities: { browserName: 'chrome' }, config: { framework: 'mocha', mochaOpts: { parallelMode: true } },
                isMultiRemote: false, sessionId: 'session', instanceOptions: {},
            })
            const keys = [...h.uids.keys()]
            keys.forEach((key) => h.emit('suite:start', h.suiteMessage('suite:start', key)))
            scriptOf(h, legacy).forEach((step) => step())
            scriptOf(h, { ...B1, unfinished: true }).forEach((step) => step())
            expect(writtenNames(h)).toEqual([])

            h.emit('suite:end', h.suiteMessage('suite:end', keys[0]))
            await vi.waitFor(() => expect(writtenNames(h)).toEqual([legacy.title]))
            h.emit('runner:end', { cid: CID, failures: 0, retries: 0 })
            await vi.waitFor(() => expect(h.reporter.isSynchronised).toBe(true))
        })

        it('keeps console logs and incremental writes when parallel mode falls back to sequential', async () => {
            const first: PlannedTest = { id: 's1', title: 'first', suites: ['S'], outcome: 'pass' }
            const second: PlannedTest = { id: 's2', title: 'second', suites: ['S'], outcome: 'pass' }
            let writtenEarly: string[] = []
            const { results, h } = await play('sequential', [first, second], async (h) => {
                await vi.waitFor(() => expect(writtenNames(h)).toContain(first.title))
                writtenEarly = writtenNames(h)
            }, true)

            expect(writtenEarly).toContain(first.title)
            for (const test of [first, second]) {
                const result = byName(results, test.title)
                const attachments = result.attachments.concat(...result.steps.map((s: Result) => s.attachments))
                const logs = attachments.find((a: Result) => a.name === 'Console Logs')
                expect(logs, `Console Logs of ${test.id}`).toBeDefined()
                expect(attachmentText(h.outputDir, logs)).toContain(`body-log-${test.id}`)
            }
        })
    })
})
