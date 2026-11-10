import { createHash } from 'node:crypto'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

// the real base: the hook owner comes from its tree
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

const CID = '0-0'
// fullName is the path relative to the working directory
const SPEC = path.join(process.cwd(), 'specs/hooks.spec.js')

type Result = Record<string, any>
type HookKind = 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'
const PHRASE: Record<HookKind, string> = { beforeAll: 'before all', beforeEach: 'before each', afterEach: 'after each', afterAll: 'after all' }

function createRun(framework = 'mocha', withKind = true) {
    const outputDir = temporaryDirectory()
    const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
    const emit = (type: string, payload: Record<string, unknown>) => reporter.emit(type, { type, cid: CID, specs: [SPEC], file: SPEC, ...payload })
    const open: string[] = []
    let hooks = 0
    const run = {
        reporter,
        outputDir,
        start() {
            emit('runner:start', { capabilities: { browserName: 'chrome' }, config: { framework }, isMultiRemote: false, sessionId: 's', instanceOptions: {} })
        },
        suite(title: string, body: () => void) {
            const uid = `suite-${title}`
            emit('suite:start', { uid, title, fullTitle: title, parent: open.at(-1) ?? '', parentUid: open.length ? `suite-${open.at(-1)}` : null })
            open.push(title)
            body()
            open.pop()
            emit('suite:end', { uid, title, fullTitle: title, parent: open.at(-1) ?? '', parentUid: open.length ? `suite-${open.at(-1)}` : null })
        },
        hook(kind: HookKind, error?: Error, step?: string) {
            const uid = `hook-${hooks++}`
            const suite = open.at(-1)
            const title = suite ? `"${PHRASE[kind]}" hook for ${suite}` : `"${PHRASE[kind]}" hook in "{root}"`
            const allHook = kind === 'beforeAll' || kind === 'afterAll'
            const payload = {
                uid, title, fullTitle: title, parent: suite ?? '',
                ...(suite ? { parentUid: `suite-${suite}` } : {}),
                ...(withKind ? { hookKind: kind, ...(allHook && suite ? { hookSuiteUid: `suite-${suite}` } : {}) } : {}),
            }
            emit('hook:start', payload)
            if (step) {
                emit('client:beforeCommand', { command: step, method: 'POST', endpoint: '/x', body: {}, sessionId: 's' })
                emit('client:afterCommand', { command: step, method: 'POST', endpoint: '/x', result: { value: null }, sessionId: 's' })
            }
            emit('hook:end', { ...payload, ...(error ? { error: { name: error.name, message: error.message, stack: error.stack }, state: 'fail' } : { state: 'pass' }) })
        },
        test(title: string, outcome: 'pass' | 'fail' = 'pass') {
            const suite = open.at(-1)
            const payload = { uid: `test-${title}`, title, fullTitle: `${open.join(' ')} ${title}`, parent: suite, parentUid: `suite-${suite}` }
            emit('test:start', payload)
            if (outcome === 'pass') {
                emit('test:pass', { ...payload, passed: true })
            } else {
                emit('test:fail', { ...payload, passed: false, error: { name: 'AssertionError', message: `expected ${title}`, stack: 'AssertionError' } })
            }
            emit('test:end', payload)
        },
        async end() {
            emit('runner:end', { failures: 0, retries: 0 })
            await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
            return getResults(outputDir) as { results: Result[], containers: Result[] }
        },
    }
    return run
}

const byName = (results: Result[], name: string) => results.find((r) => r.name === name)!
// the fixtures of every container that has this result as a child
const fixturesOf = (containers: Result[], result: Result) => containers
    .filter((c) => c.children.includes(result.uuid))
    .flatMap((c) => [...c.befores.map((f: Result) => `before ${f.name}`), ...c.afters.map((f: Result) => `after ${f.name}`)])
    .sort()

let writeSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(() => {
    writeSpy.mockRestore()
})

const md5 = (text: string) => createHash('md5').update(text).digest('hex')
const steps = (fixture: Result) => fixture.steps.map((step: Result) => step.name)
const ROOT_BEFORE = '"before all" hook in "{root}"'
const ROOT_AFTER = '"after all" hook in "{root}"'

function playRootHooks(withKind: boolean, framework = 'mocha') {
    const run = createRun(framework, withKind)
    run.start()
    run.hook('beforeAll', undefined, 'rootBefore')
    run.suite('A', () => {
        run.test('t1')
        run.test('t2')
    })
    run.suite('B', () => run.test('t3'))
    run.hook('afterAll', undefined, 'rootAfter')
    return run.end()
}

describe('fixture scope from the hook kind', () => {
    it('gives every test the root before all and after all hooks, with their commands', async () => {
        const { results, containers } = await playRootHooks(true)

        for (const name of ['t1', 't2', 't3']) {
            expect(fixturesOf(containers, byName(results, name)), name).toEqual([`after ${ROOT_AFTER}`, `before ${ROOT_BEFORE}`])
        }
        const rootFixtures = containers.flatMap((c) => [...c.befores, ...c.afters]).filter((f: Result) => f.name.endsWith('"{root}"'))
        expect(rootFixtures.map((f: Result) => [f.name, f.status, steps(f)]).sort()).toEqual([
            [ROOT_AFTER, 'passed', ['rootAfter']],
            [ROOT_BEFORE, 'passed', ['rootBefore']],
        ])
    })

    it('keeps the hook of today for a framework that sends no hook kind', async () => {
        const { results, containers } = await playRootHooks(false)

        expect(fixturesOf(containers, byName(results, 't1'))).toEqual([`before ${ROOT_BEFORE}`])
        expect(fixturesOf(containers, byName(results, 't2'))).toEqual([])
        expect(containers.flatMap((c) => c.afters)).toEqual([])
    })

    it('stops the list of test uuids when the root scope exists, and the root still has every test', async () => {
        const run = createRun()
        run.start()
        run.suite('A', () => run.test('t1'))
        run.hook('beforeAll')
        run.suite('B', () => {
            run.test('t2')
            run.test('t3')
        })
        run.hook('afterAll')
        await vi.waitFor(() => expect(run.reporter.isSynchronised).toBe(true))
        expect(run.reporter.allureStatesByCid.get(CID)!['_testUuids']).toEqual([])
        const { results, containers } = await run.end()

        for (const name of ['t1', 't2', 't3']) {
            expect(fixturesOf(containers, byName(results, name)), name).toEqual([`after ${ROOT_AFTER}`, `before ${ROOT_BEFORE}`])
        }
    })

    // the earlier hook code gives the same fixtures: its gate `!hook.parent && !_isGlobalHook(hook)` never returns
    it.each([['jasmine', null], ['mocha', '']])('keeps the earlier fixtures for a %s hook with no parent and no hook kind in an open suite', async (framework, parent) => {
        const run = createRun(framework)
        const emit = (type: string, payload: Record<string, unknown>) => run.reporter.emit(type, { type, cid: CID, specs: [SPEC], file: SPEC, ...payload })
        run.start()
        run.suite('S', () => {
            emit('hook:start', { uid: 'h1', title: '"before all" hook', parent })
            emit('hook:end', { uid: 'h1', title: '"before all" hook', parent, state: 'pass' })
            run.test('t1')
            emit('hook:start', { uid: 'h2', title: '"after all" hook', parent })
            emit('hook:end', { uid: 'h2', title: '"after all" hook', parent, state: 'pass' })
        })
        const { results, containers } = await run.end()

        expect(fixturesOf(containers, byName(results, 't1'))).toEqual(['after "after all" hook', 'before "before all" hook'])
    })

    it('keeps an afterEach that runs after a failed afterEach under its test', async () => {
        const run = createRun()
        run.start()
        run.suite('outer', () => {
            run.suite('inner', () => {
                run.test('i1', 'fail')
                run.hook('afterEach')
                run.hook('afterEach', new Error('second afterEach fails'))
                run.hook('afterEach', undefined, 'outerAfterEach')
            })
        })
        const { results, containers } = await run.end()

        const i1 = byName(results, 'i1')
        const hookResult = byName(results, '"after each" hook for inner')
        expect(fixturesOf(containers, i1)).toEqual(new Array(3).fill('after "after each" hook for inner'))
        expect(fixturesOf(containers, hookResult)).toEqual([])
        const afters = containers.filter((c) => c.children.includes(i1.uuid)).flatMap((c) => c.afters)
        expect(afters.map((f: Result) => [f.status, steps(f)]).sort()).toEqual([['broken', []], ['passed', []], ['passed', ['outerAfterEach']]])
        // the hook failure keeps its own result, now with a historyId of its own
        expect(hookResult.status).toBe('broken')
        expect(hookResult.historyId).toBe(md5('outer inner "after each" hook for inner#chrome'))
    })
})

// the result of a failed afterEach of a test that ended has the error of the hook
describe('the result of a failed afterEach of an ended test', () => {
    it('has the message and the trace of the hook error', async () => {
        const run = createRun()
        run.start()
        run.suite('A', () => {
            run.test('t1')
            run.hook('afterEach', new Error('AFTER_EACH_BOOM'))
        })
        const { results } = await run.end()

        const hookResult = byName(results, '"after each" hook for A')
        expect([hookResult.status, hookResult.statusDetails.message, hookResult.statusDetails.trace]).toEqual(['broken', 'AFTER_EACH_BOOM', expect.stringContaining('AFTER_EACH_BOOM')])
        // the standalone result of an ended test carries the id too, not an empty one
        expect(hookResult.historyId).toBe(md5('A "after each" hook for A#chrome'))
    })
})

describe('historyId, testCaseId and fullName (HI rules)', () => {
    it.each(['mocha', 'jasmine'])('stay as today in a sequential %s run: md5 of the full title and the browser', async (framework) => {
        const { results } = await playRootHooks(true, framework)

        expect(results.map((r) => [r.name, r.historyId, r.testCaseId, r.fullName]).sort()).toEqual([
            ['t1', md5('A t1#chrome'), md5('A t1#chrome'), 'specs/hooks.spec.js#A t1'],
            ['t2', md5('A t2#chrome'), md5('A t2#chrome'), 'specs/hooks.spec.js#A t2'],
            ['t3', md5('B t3#chrome'), md5('B t3#chrome'), 'specs/hooks.spec.js#B t3'],
        ])
    })

    it('pins the historyId of a failed before all hook to its suite path', async () => {
        const run = createRun()
        run.start()
        run.suite('A', () => run.hook('beforeAll', new Error('before all fails')))
        const { results } = await run.end()

        // one pinned md5: the suite path, the hook title and the capability key
        expect(results.map((r) => [r.name, r.status, r.historyId])).toEqual([
            ['"before all" hook for A', 'broken', md5('A "before all" hook for A#chrome')],
        ])
    })
})

describe('parameters of a failed root before all', () => {
    const params = (result: Result) => result.parameters.map((p: Result) => `${p.name}=${p.value}`)

    it.each(['mocha', 'jasmine'])('give each test and the hook result the browser parameter once, as before (%s)', async (framework) => {
        const run = createRun(framework)
        run.start()
        run.hook('beforeAll', new Error('root before fails'))
        run.suite('A', () => {
            run.test('t1', 'fail')
            run.test('t2', 'fail')
        })
        const { results, containers } = await run.end()

        expect(results.map((r) => [r.name, params(r), r.historyId]).sort()).toEqual([
            [ROOT_BEFORE, ['browser=chrome'], md5(`${ROOT_BEFORE}#chrome`)],
            ['t1', ['browser=chrome'], md5('A t1#chrome')],
            ['t2', ['browser=chrome'], md5('A t2#chrome')],
        ])
        // the root before all stays a fixture of every result
        for (const result of results) {
            expect(fixturesOf(containers, result), result.name).toContain(`before ${ROOT_BEFORE}`)
        }
    })

    it('give the result of a failed root after all the browser parameter, as before', async () => {
        const run = createRun()
        run.start()
        run.suite('A', () => run.test('t1'))
        run.hook('afterAll', new Error('root after fails'))
        const { results } = await run.end()

        expect(results.map((r) => [r.name, r.status, params(r)]).sort()).toEqual([
            [ROOT_AFTER, 'broken', ['browser=chrome']],
            ['t1', 'passed', ['browser=chrome']],
        ])
    })
})
