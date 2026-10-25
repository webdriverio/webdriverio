import { describe, expect, it, beforeEach } from 'vitest'
import tmp from 'tmp'

import WDIOReporter from '../src/index.js'
import SuiteStats from '../src/stats/suite.js'
import type HookStats from '../src/stats/hook.js'
import type TestStats from '../src/stats/test.js'
import type { ReporterUnit } from '../src/types.js'

const suite = (uid: string, title: string, parentUid?: string) => ({
    type: 'suite', uid, title, fullTitle: title, cid: '0-0', file: '/a.spec.js', ...(parentUid ? { parent: 'p', parentUid } : {})
})
const test = (uid: string, title: string, parentUid?: string) => ({
    type: 'test', uid, title, fullTitle: title, cid: '0-0', ...(parentUid ? { parentUid } : {})
})

describe('tree helpers', () => {
    let reporter: WDIOReporter

    beforeEach(() => {
        reporter = new WDIOReporter({ logFile: tmp.fileSync().name })
    })

    it('gives depth and path of a sequential nesting A > B > C', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('test:start', test('t1', 'in A'))
        reporter.emit('suite:start', suite('b', 'B'))
        reporter.emit('suite:start', suite('c', 'C'))
        reporter.emit('test:start', test('t3', 'in C'))

        const inC = reporter.tests.t3
        expect(reporter.depthOf(inC)).toBe(3)
        expect(reporter.pathOf(inC).map((s) => s.title)).toEqual(['A', 'B', 'C'])
        expect(reporter.parentOf(inC)).toBe(reporter.suites.c)
        expect(reporter.depthOf(reporter.tests.t1)).toBe(1)
        expect(reporter.depthOf(reporter.suites.c)).toBe(2)
        expect(reporter.pathOf(reporter.suites.c).map((s) => s.title)).toEqual(['A', 'B'])
    })

    it('gives the same values for parallel payloads with parentUid and interleaved tests', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('suite:start', suite('b', 'B', 'a'))
        reporter.emit('suite:start', suite('c', 'C', 'b'))
        reporter.emit('test:start', test('t1', 'in C', 'c'))
        reporter.emit('test:start', test('t2', 'in A', 'a'))
        reporter.emit('hook:start', { type: 'hook', uid: 'h1', title: 'hook', parentUid: 'b' })

        expect(reporter.depthOf(reporter.tests.t1)).toBe(3)
        expect(reporter.pathOf(reporter.tests.t1).map((s) => s.title)).toEqual(['A', 'B', 'C'])
        expect(reporter.depthOf(reporter.tests.t2)).toBe(1)
        expect(reporter.parentOf(reporter.hooks.h1)).toBe(reporter.suites.b)
        expect(reporter.depthOf(reporter.hooks.h1)).toBe(2)
    })

    it('gives no parent and depth 0 for a root-level test', () => {
        reporter.emit('test:start', test('t0', 'root test'))

        expect(reporter.parentOf(reporter.tests.t0)).toBeUndefined()
        expect(reporter.pathOf(reporter.tests.t0)).toEqual([])
        expect(reporter.depthOf(reporter.tests.t0)).toBe(0)
    })

    it('records the parent of a pending test that never started', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('test:pending', { ...test('p1', 'skipped', 'a'), state: 'pending' })

        expect(reporter.parentOf(reporter.tests.p1)).toBe(reporter.suites.a)
    })
})

type Stats = SuiteStats | HookStats | TestStats
type Events = [string, Record<string, unknown>][]
const name = (u?: ReporterUnit) => u ? `${u.contextId ?? 'seq'}:${u.stats?.title ?? '-'}#${u.attempt}` : 'none'

/** one line for each hook: the event, the unit of the event; and the unit lifecycle */
class Recorder extends WDIOReporter {
    log: string[] = []
    retrySeen: string[] = []
    constructor () {
        super({ logFile: tmp.fileSync().name })
    }
    #line (event: string, stats?: Stats) {
        this.log.push(`${event} ${stats?.title ?? ''} -> ${name(this.getContextUnit())}`)
    }
    onUnitStart (unit: ReporterUnit) { this.log.push(`UNIT+ ${name(unit)}`) }
    onUnitEnd (unit: ReporterUnit) { this.log.push(`UNIT- ${name(unit)} test=${unit.test?.title ?? '-'}`) }
    onUnitRetry (unit: ReporterUnit) {
        const tests = unit.stats instanceof SuiteStats ? unit.stats.tests : [unit.stats as TestStats]
        this.retrySeen.push(`${name(unit)} tests=${tests.map((t) => `${t.title}:${t.state}`).join(',')}`)
        this.log.push(`UNIT~ ${name(unit)}`)
    }
    onSuiteStart (s: SuiteStats) { this.#line('suite:start', s) }
    onSuiteEnd (s: SuiteStats) { this.#line('suite:end', s) }
    onSuiteRetry (s: SuiteStats) { this.#line('suite:retry', s) }
    onHookStart (h: HookStats) { this.#line('hook:start', h) }
    onHookEnd (h: HookStats) { this.#line('hook:end', h) }
    onTestStart (t: TestStats) { this.#line('test:start', t) }
    onTestPass (t: TestStats) { this.#line('test:pass', t) }
    onTestFail (t: TestStats) { this.#line('test:fail', t) }
    onTestRetry (t: TestStats) { this.#line('test:retry', t) }
    onTestPending (t: TestStats) { this.#line('test:pending', t) }
    onTestSkip (t: TestStats) { this.#line('test:skip', t) }
    onTestEnd (t: TestStats) { this.#line('test:end', t) }
    onContextEnd () { this.log.push(`context:end -> ${name(this.getContextUnit())}`) }
    onBeforeCommand () { this.log.push(`command -> ${name(this.getContextUnit())}`) }
}

const base = { cid: '0-0', specs: ['/spec.js'] }
const suiteEv = (uid: string, title: string, extra: Record<string, unknown> = {}) => ({ ...base, uid, title, fullTitle: title, file: '/spec.js', ...extra })
const testEv = (uid: string, title: string, extra: Record<string, unknown> = {}) => ({ ...base, uid, title, fullTitle: title, parent: '', pending: false, ...extra })
const hookEv = (uid: string, title: string, extra: Record<string, unknown> = {}) => ({ ...base, uid, title, parent: '', ...extra })
const ctxEnd = (uid: string, contextId: string): [string, Record<string, unknown>] => ['context:end', { ...base, uid, contextId }]

function play (reporter: WDIOReporter, events: Events) {
    reporter.emit('runner:start', { ...base, capabilities: {}, config: {}, sessionId: 's', isMultiRemote: false, instanceOptions: {}, retry: 0 })
    for (const [event, payload] of events) {
        reporter.emit(event, { type: event, ...payload })
    }
}
const end = (reporter: WDIOReporter) => reporter.emit('runner:end', { ...base, failures: 0, retries: 0 })
const unitLines = (r: Recorder) => r.log.filter((l) => l.startsWith('UNIT'))

describe('units: Mocha', () => {
    it('sequential: a unit per test, ends at its test:end; after hooks get the ended unit', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['hook:start', hookEv('h1', '"before all" hook')],
            ['hook:end', hookEv('h1', '"before all" hook')],
            ['test:start', testEv('t1', 'a1')],
            ['hook:start', hookEv('h2', '"before each" hook')],
            ['hook:end', hookEv('h2', '"before each" hook')],
            ['test:pass', testEv('t1', 'a1')],
            ['test:end', testEv('t1', 'a1')],
            ['hook:start', hookEv('h3', '"after each" hook')],
            ['hook:end', hookEv('h3', '"after each" hook')],
            ['test:pending', testEv('t2', 'a2 skip', { pending: true, state: 'pending' })],
            ['test:end', testEv('t2', 'a2 skip')],
            ['suite:start', suiteEv('s2', 'B')],
            ['test:start', testEv('t3', 'b1')],
            ['test:pass', testEv('t3', 'b1')],
            ['test:end', testEv('t3', 'b1')],
            ['suite:end', suiteEv('s2', 'B')],
            ['suite:end', suiteEv('s1', 'A')],
        ])
        end(r)
        expect(r.log).toEqual([
            'suite:start A -> none',
            'hook:start "before all" hook -> none',
            'hook:end "before all" hook -> none',
            'UNIT+ seq:a1#0',
            'test:start a1 -> seq:a1#0',
            'hook:start "before each" hook -> seq:a1#0',
            'hook:end "before each" hook -> seq:a1#0',
            'test:pass a1 -> seq:a1#0',
            'test:end a1 -> seq:a1#0',
            'UNIT- seq:a1#0 test=a1',
            'hook:start "after each" hook -> seq:a1#0',
            'hook:end "after each" hook -> seq:a1#0',
            'UNIT+ seq:a2 skip#0',
            'test:pending a2 skip -> seq:a2 skip#0',
            'test:end a2 skip -> seq:a2 skip#0',
            'UNIT- seq:a2 skip#0 test=a2 skip',
            'suite:start B -> none',
            'UNIT+ seq:b1#0',
            'test:start b1 -> seq:b1#0',
            'test:pass b1 -> seq:b1#0',
            'test:end b1 -> seq:b1#0',
            'UNIT- seq:b1#0 test=b1',
            'suite:end B -> none',
            'suite:end A -> none',
        ])
        expect(r.unitOf(r.hooks.h3)).toMatchObject({ ended: true, stats: r.tests.t1 })
        expect(r.unitOf(r.hooks.h1)).toBeUndefined()
    })

    it('parallel: a unit per context from its first event, interleaved, ends at context:end', () => {
        const ctx = (contextId: string, parentUid: string) => ({ contextId, parentUid })
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
            ['suite:start', suiteEv('s2', 'B', { parentUid: null })],
            ['hook:start', hookEv('h1', '"before all" hook', ctx('A', 's1'))],
            ['hook:start', hookEv('h2', '"before all" hook', ctx('B', 's2'))],
            ['hook:end', hookEv('h1', '"before all" hook', ctx('A', 's1'))],
            ['test:start', testEv('t1', 'a1', ctx('A', 's1'))],
            ['hook:end', hookEv('h2', '"before all" hook', ctx('B', 's2'))],
            ['test:start', testEv('t2', 'b1', ctx('B', 's2'))],
            ['test:pass', testEv('t2', 'b1', ctx('B', 's2'))],
            ['test:end', testEv('t2', 'b1', ctx('B', 's2'))],
            ['hook:start', hookEv('h3', '"after each" hook', ctx('B', 's2'))],
            ['hook:end', hookEv('h3', '"after each" hook', ctx('B', 's2'))],
            ctxEnd('t2', 'B'),
            ['test:pass', testEv('t1', 'a1', ctx('A', 's1'))],
            ['test:end', testEv('t1', 'a1', ctx('A', 's1'))],
            ctxEnd('t1', 'A'),
            ['suite:end', suiteEv('s2', 'B')],
            ['suite:end', suiteEv('s1', 'A')],
        ])
        end(r)
        expect(r.log).toEqual([
            'suite:start A -> none',
            'suite:start B -> none',
            'UNIT+ A:-#0',
            'hook:start "before all" hook -> A:-#0',
            'UNIT+ B:-#0',
            'hook:start "before all" hook -> B:-#0',
            'hook:end "before all" hook -> A:-#0',
            'test:start a1 -> A:a1#0',
            'hook:end "before all" hook -> B:-#0',
            'test:start b1 -> B:b1#0',
            'test:pass b1 -> B:b1#0',
            'test:end b1 -> B:b1#0',
            'hook:start "after each" hook -> B:b1#0',
            'hook:end "after each" hook -> B:b1#0',
            'context:end -> B:b1#0',
            'UNIT- B:b1#0 test=b1',
            'test:pass a1 -> A:a1#0',
            'test:end a1 -> A:a1#0',
            'context:end -> A:a1#0',
            'UNIT- A:a1#0 test=a1',
            'suite:end B -> none',
            'suite:end A -> none',
        ])
    })

    it('retries: one unit for all attempts of the same full title, onUnitRetry once with the failed attempt', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['test:start', testEv('t1', 'flaky')],
            ['test:retry', testEv('t1', 'flaky', { error: { message: 'x' } })],
            ['hook:start', hookEv('h1', '"after each" hook')],
            ['hook:end', hookEv('h1', '"after each" hook')],
            ['test:start', testEv('t2', 'flaky')],
            ['test:pass', testEv('t2', 'flaky')],
            ['test:end', testEv('t2', 'flaky')],
            ['suite:end', suiteEv('s1', 'A')],
        ])
        expect(unitLines(r)).toEqual(['UNIT+ seq:flaky#0', 'UNIT~ seq:flaky#0', 'UNIT- seq:flaky#1 test=flaky'])
        expect(r.retrySeen).toEqual(['seq:flaky#0 tests=flaky:failed'])
        // the afterEach after test:retry is still in the attempt that failed
        expect(r.log).toContain('hook:start "after each" hook -> seq:flaky#0')
        expect(r.unitOf(r.tests.t2)).toBe(r.unitOf(r.tests.t1))
    })

    it('K8: a retried test with no test:end ends at the next unit start', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['test:start', testEv('t1', 'k8')],
            ['test:retry', testEv('t1', 'k8', { error: { message: 'x' } })],
            ['hook:start', hookEv('h1', '"after each" hook')],
            ['hook:end', hookEv('h1', '"after each" hook', { error: { message: 'afterEach' } })],
            ['test:start', testEv('t2', 'next')],
            ['test:end', testEv('t2', 'next')],
        ])
        expect(unitLines(r)).toEqual([
            'UNIT+ seq:k8#0',
            'UNIT~ seq:k8#0',
            'UNIT- seq:k8#0 test=k8',
            'UNIT+ seq:next#0',
            'UNIT- seq:next#0 test=next',
        ])
    })
})

describe('units: fallback ends', () => {
    it('a test with no test:end and no next unit ends at the end of its suite, else at runner:end', () => {
        const r = new Recorder()
        r.onRunnerEnd = () => { r.log.push('runner:end') }
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['suite:start', suiteEv('s2', 'B')],
            // a failed beforeEach with failHookAffectedTests: false sends no test:end
            ['test:start', testEv('t1', 'no end')],
            ['suite:end', suiteEv('s2', 'B')],
            ['hook:start', hookEv('h1', '"after each" hook')],
            ['test:start', testEv('t2', 'open at the end')],
            ['test:start', testEv('t3', 'parallel open', { contextId: 'A' })],
        ])
        end(r)
        expect(r.log.slice(r.log.indexOf('suite:end B -> none'))).toEqual([
            'suite:end B -> none',
            'UNIT- seq:no end#0 test=no end',
            'hook:start "after each" hook -> seq:no end#0',
            'UNIT+ seq:open at the end#0',
            'test:start open at the end -> seq:open at the end#0',
            'UNIT+ A:parallel open#0',
            'test:start parallel open -> A:parallel open#0',
            'UNIT- A:parallel open#0 test=parallel open',
            'UNIT- seq:open at the end#0 test=open at the end',
            'runner:end',
        ])
    })

    it('a retried test that ended with its suite takes no next attempt (2 describe blocks with the same title)', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['test:start', testEv('t1', 'A x')],
            ['test:retry', testEv('t1', 'A x', { error: { message: 'x' } })],
            // a failed afterEach stops the suite
            ['suite:end', suiteEv('s1', 'A')],
            ['suite:start', suiteEv('s2', 'A')],
            ['test:start', testEv('t2', 'A x')],
            ['test:end', testEv('t2', 'A x')],
        ])
        expect(unitLines(r)).toEqual(['UNIT+ seq:A x#0', 'UNIT~ seq:A x#0', 'UNIT- seq:A x#0 test=A x', 'UNIT+ seq:A x#0', 'UNIT- seq:A x#0 test=A x'])
        expect(r.unitOf(r.tests.t2)).not.toBe(r.unitOf(r.tests.t1))
    })
})

describe('units: Cucumber', () => {
    // a failing step of an attempt that Cucumber retries sends test:retry (#16226)
    const steps = (sc: string, ctx?: string, failing?: 'test:fail' | 'test:retry'): Events => [
        ['hook:start', hookEv(`${sc}-before`, '', { contextId: ctx, parent: sc })],
        ['hook:end', hookEv(`${sc}-before`, '', { parent: sc })],
        ['test:start', testEv(`${sc}-1`, 'Given one', { contextId: ctx, parentUid: ctx && sc })],
        ['test:pass', testEv(`${sc}-1`, 'Given one', { contextId: ctx })],
        ['test:end', testEv(`${sc}-1`, 'Given one', { contextId: ctx })],
        ['test:start', testEv(`${sc}-2`, 'Then two', { contextId: ctx, parentUid: ctx && sc })],
        [failing ?? 'test:pass', testEv(`${sc}-2`, 'Then two', { contextId: ctx, error: failing ? { message: 'x' } : undefined })],
        ['test:end', testEv(`${sc}-2`, 'Then two', { contextId: ctx })],
    ]

    it('step level with suite:retry: one unit per scenario, the attempt changes at the next attempt start', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
            ...steps('sc1', undefined, 'test:retry'),
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario' })],
            ...steps('sc1'),
            ['suite:end', suiteEv('sc1', 'S1', { type: 'scenario' })],
            ['suite:start', suiteEv('sc2', 'S2', { type: 'scenario', parent: 'f' })],
            ...steps('sc2'),
            ['suite:end', suiteEv('sc2', 'S2', { type: 'scenario' })],
            ['suite:end', suiteEv('f', 'Feature', { type: 'feature' })],
        ])
        expect(unitLines(r)).toEqual([
            'UNIT+ seq:S1#0', 'UNIT~ seq:S1#0', 'UNIT- seq:S1#1 test=Then two',
            'UNIT+ seq:S2#0', 'UNIT- seq:S2#0 test=Then two',
        ])
        expect(r.log).toContain('test:retry Then two -> seq:S1#0')
        expect(r.log).toContain('suite:retry S1 -> seq:S1#1')
        expect(r.log).toContain('hook:end  -> seq:S2#0')
        expect(r.log).toContain('suite:start Feature -> none')
    })

    it('K12: onUnitRetry sees the tests of the failed attempt before retry() clears them', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
            ...steps('sc1', undefined, 'test:retry'),
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario' })],
        ])
        expect(r.retrySeen).toEqual(['seq:S1#0 tests=Given one:passed,Then two:failed'])
        expect(r.suites.sc1.tests).toEqual([])
    })

    it('scenario level with test:retry: the same uid started again is the next attempt, in both modes', () => {
        for (const contextId of [undefined, 'A']) {
            const r = new Recorder()
            play(r, [
                ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
                ['test:start', testEv('p1', 'R flaky', { contextId })],
                ['test:retry', testEv('p1', 'R flaky', { contextId, error: { message: 'x' } })],
                ['test:start', testEv('p1', 'R flaky', { contextId })],
                ['test:pass', testEv('p1', 'R flaky', { contextId })],
                ['test:end', testEv('p1', 'R flaky', { contextId })],
                ...(contextId ? [ctxEnd('p1', contextId)] : []),
                ['test:start', testEv('p2', 'R other')],
                ['test:end', testEv('p2', 'R other')],
            ])
            const tag = contextId ?? 'seq'
            expect(unitLines(r), tag).toEqual([
                `UNIT+ ${tag}:R flaky#0`, `UNIT~ ${tag}:R flaky#0`, `UNIT- ${tag}:R flaky#1 test=R flaky`,
                'UNIT+ seq:R other#0', 'UNIT- seq:R other#0 test=R other',
            ])
        }
    })

    it('step level parallel: 2 overlapping scenarios, end events with no contextId use the unit of their stats', () => {
        const r = new Recorder()
        const a = steps('sc1', 'A', 'test:retry'), b = steps('sc2', 'B')
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature', parentUid: null })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f', parentUid: 'f', contextId: 'A' })],
            ['suite:start', suiteEv('sc2', 'S2', { type: 'scenario', parent: 'f', parentUid: 'f', contextId: 'B' })],
            a[0], b[0], a[1], b[1], a[2], b[2], b[3], a[3], b[4], a[4], a[5], b[5], a[6], b[6], a[7], b[7],
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario', contextId: 'A' })],
            ...steps('sc1', 'A'),
            // the scenario suite:end has no contextId
            ['suite:end', suiteEv('sc1', 'S1', { type: 'scenario' })],
            ['suite:end', suiteEv('sc2', 'S2', { type: 'scenario' })],
            ctxEnd('sc2', 'B'),
            ctxEnd('sc1', 'A'),
            ['suite:end', suiteEv('f', 'Feature', { type: 'feature' })],
        ])
        expect(r.log).toContain('hook:end  -> A:S1#0')
        expect(r.log).toContain('hook:end  -> B:S2#0')
        expect(r.log).toContain('test:retry Then two -> A:S1#0')
        expect(r.log).toContain('suite:end S1 -> A:S1#1')
        expect(r.log).toContain('suite:end S2 -> B:S2#0')
        expect(r.retrySeen).toEqual(['A:S1#0 tests=Given one:passed,Then two:failed'])
        expect(unitLines(r)).toEqual([
            'UNIT+ A:S1#0', 'UNIT+ B:S2#0', 'UNIT~ A:S1#0', 'UNIT- B:S2#0 test=Then two', 'UNIT- A:S1#1 test=Then two',
        ])
    })

    it('failFast skip scenarios with no context after a parallel run open their own units', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature', parentUid: null })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parentUid: 'f', contextId: 'A' })],
            ['suite:end', suiteEv('sc1', 'S1', { type: 'scenario' })],
            ctxEnd('sc1', 'A'),
            ['suite:start', suiteEv('sc2', 'S2', { type: 'scenario', parentUid: 'f' })],
            ['hook:start', hookEv('sc2-before', '', { parent: 'sc2' })],
            ['test:start', testEv('s2-1', 'Given skipped', { parentUid: 'sc2' })],
            ['test:end', testEv('s2-1', 'Given skipped')],
            ['suite:end', suiteEv('sc2', 'S2', { type: 'scenario' })],
        ])
        expect(r.log).toContain('hook:start  -> seq:S2#0')
        expect(r.log).toContain('test:start Given skipped -> seq:S2#0')
        expect(unitLines(r)).toEqual(['UNIT+ A:S1#0', 'UNIT- A:S1#0 test=-', 'UNIT+ seq:S2#0', 'UNIT- seq:S2#0 test=Given skipped'])
        // the skip scenario ended: code outside every context gets no unit again
        expect(r.getContextUnit()).toBeUndefined()
    })
})

describe('units: test:pending', () => {
    it('a started test that ends as pending stays in its unit, a pending step in its scenario', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            // Jasmine pending() after the start
            ['test:start', testEv('j1', 'jp')],
            ['test:pending', testEv('j1', 'jp', { pending: true, state: 'pending' })],
            ['test:end', testEv('j1', 'jp')],
            ['suite:end', suiteEv('s1', 'A')],
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
            ['test:start', testEv('st1', 'Given pending')],
            ['test:pending', testEv('st1', 'Given pending', { pending: true, state: 'pending' })],
            ['test:pending', testEv('st2', 'Then skipped', { pending: true, state: 'skipped' })],
            ['suite:end', suiteEv('sc1', 'S1', { type: 'scenario' })],
        ])
        expect(unitLines(r)).toEqual(['UNIT+ seq:jp#0', 'UNIT- seq:jp#0 test=jp', 'UNIT+ seq:S1#0', 'UNIT- seq:S1#0 test=Then skipped'])
        expect(r.unitOf(r.tests.j1)).toMatchObject({ stats: r.tests.j1, ended: true })
        expect(r.log).toContain('test:pending Given pending -> seq:S1#0')
        expect(r.log).toContain('test:skip Then skipped -> seq:S1#0')
    })

    it('a pending test in a parallel context replaces the started test of its unit', () => {
        const r = new Recorder()
        play(r, [
            ['test:start', testEv('p1', 'x', { contextId: 'A' })],
            // the Cucumber parallel scenario payload has no contextId
            ['test:pending', testEv('p1', 'x', { pending: true, state: 'pending' })],
        ])
        expect(r.unitOf(r.tests.p1)).toMatchObject({ contextId: 'A', stats: r.tests.p1, test: r.tests.p1 })
        expect(r.log).toContain('test:pending x -> A:x#0')
    })
})

describe('units: parallel latch and late events', () => {
    const ctx = (contextId: string) => ({ contextId, parentUid: 's1' })
    const events: Events = [
        ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
        ['hook:start', hookEv('bs', '"before all" hook in "{root}"')],
        ['hook:end', hookEv('bs', '"before all" hook in "{root}"')],
        ['hook:start', hookEv('ha', '"before all" hook', ctx('A'))],
        ['hook:start', hookEv('hb', '"before all" hook', ctx('B'))],
        ['test:start', testEv('t2', 'b1', ctx('B'))],
        ['test:start', testEv('t1', 'a1', ctx('A'))],
        // a hook with no context while 2 contexts run
        ['hook:start', hookEv('hx', 'no context')],
        ['test:pass', testEv('t2', 'b1', ctx('B'))],
        ['test:end', testEv('t2', 'b1', ctx('B'))],
        ctxEnd('t2', 'B'),
        // late events of B: an afterEach screenshot after context:end
        ['hook:start', hookEv('hl', '"after each" hook', ctx('B'))],
        ['test:pass', testEv('t1', 'a1', ctx('A'))],
        ['test:end', testEv('t1', 'a1', ctx('A'))],
        ctxEnd('t1', 'A'),
        ['hook:start', hookEv('as', '"after all" hook in "{root}"')],
    ]

    it('events with no context during a parallel run get no unit', () => {
        const r = new Recorder()
        play(r, events)
        expect(r.log).toContain('hook:start "before all" hook in "{root}" -> none')
        expect(r.log).toContain('hook:start no context -> none')
        expect(r.log).toContain('hook:start "after all" hook in "{root}" -> none')
        expect(r.unitOf(r.hooks.hx)).toBeUndefined()
        const resolved: { id?: string } = {}
        r.setContextIdResolver(() => resolved.id)
        expect(r.getContextUnit()).toBeUndefined()
        expect(r.unitState('k', () => 1)).toBeUndefined()
        resolved.id = 'B'
        expect(name(r.getContextUnit())).toBe('B:b1#0')
    })

    it('events after context:end get the ended unit', () => {
        const r = new Recorder()
        play(r, events)
        expect(r.log).toContain('hook:start "after each" hook -> B:b1#0')
        expect(r.unitOf(r.hooks.hl)).toMatchObject({ contextId: 'B', ended: true })
        r.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {}, contextId: 'B' })
        expect(r.log.at(-1)).toBe('command -> B:b1#0')
        expect(r.getContextUnit('B')).toMatchObject({ ended: true, test: r.tests.t2 })
    })

    it('R6: DELETE /session with no context after the run goes to the test of the unit that opened last', () => {
        const r = new Recorder()
        play(r, events)
        // B opened last, A started its test last
        r.emit('client:beforeCommand', { sessionId: 's', method: 'DELETE', endpoint: '/session/s', body: {} })
        expect(r.tests.t2.output).toHaveLength(1)
        expect(r.tests.t1.output).toHaveLength(0)
    })

    it('getContextTest() and getContextId() keep their behavior', () => {
        const r = new Recorder()
        const resolved: { id?: string } = {}
        r.setContextIdResolver(() => resolved.id)
        play(r, events.slice(0, 8))
        expect(r.getContextTest()).toBeUndefined()
        resolved.id = 'B'
        expect(r.getContextTest()).toBe(r.tests.t2)
        expect(r.getContextId()).toBe('B')
    })
})

describe('unit state', () => {
    it('unitState survives context:end until runner:end', () => {
        const r = new Recorder()
        play(r, [['test:start', testEv('t1', 'x', { contextId: 'A' })]])
        const state = r.unitState('k', () => ({ n: 0 }), 'A')!
        state.n++
        r.emit('context:end', { ...base, uid: 't1', contextId: 'A' })
        expect(r.getContextUnit('A')).toMatchObject({ ended: true })
        expect(r.unitState('k', () => ({ n: 0 }), 'A')).toBe(state)
        end(r)
        expect(r.unitState('k', () => ({ n: 0 }), 'A')).toEqual({ n: 1 })
    })

    it('attemptState is new after a retry, from the next test:start of the unit; unitState spans all attempts', () => {
        const r = new Recorder()
        const resolved: { id?: string } = { id: 'A' }
        r.setContextIdResolver(() => resolved.id)
        play(r, [['test:start', testEv('p1', 'x', { contextId: 'A' })]])
        r.unitState('n', () => ({ n: 0 }))!.n++
        r.attemptState('n', () => ({ n: 0 }))!.n++
        r.emit('test:retry', { type: 'test:retry', ...testEv('p1', 'x', { contextId: 'A', error: { message: 'e' } }) })
        // the afterEach hooks of the failed attempt still see its state
        expect(r.attemptState('n', () => ({ n: 0 }))!.n).toBe(1)
        r.emit('test:start', { type: 'test:start', ...testEv('p1-retry', 'x', { contextId: 'A' }) })
        expect(r.getContextUnit()?.attempt).toBe(1)
        expect(r.attemptState('n', () => ({ n: 0 }))!.n).toBe(0)
        expect(r.unitState('n', () => ({ n: 0 }))!.n).toBe(1)
        resolved.id = undefined
        expect(r.unitState('n', () => ({ n: 0 }))).toBeUndefined()
    })
})
