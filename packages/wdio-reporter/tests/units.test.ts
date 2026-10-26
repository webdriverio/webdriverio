import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import tmp from 'tmp'

import WDIOReporter from '../src/index.js'
import SuiteStats from '../src/stats/suite.js'
import type HookStats from '../src/stats/hook.js'
import type TestStats from '../src/stats/test.js'
import type { ReporterUnit } from '../src/types.js'
import { Unit } from '../src/units.js'

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

    /** what onSuiteRetry sees: the steps, the hooks and the start of the scenario */
    class RetryRecorder extends Recorder {
        retrySuites: string[] = []
        retryStarts: number[] = []
        onSuiteRetry (s: SuiteStats) {
            super.onSuiteRetry(s)
            this.retrySuites.push(`${s.title} tests=${s.tests.map((t) => `${t.title}:${t.state}`).join(',')} hooks=${s.hooks.map((h) => h.uid).join(',')} order=${s.hooksAndTests.length}`)
            this.retryStarts.push(s.start.getTime())
        }
    }

    it('K12: onSuiteRetry sees the tests and hooks of the failed attempt, then the base clears them', () => {
        const r = new RetryRecorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
            ...steps('sc1', undefined, 'test:retry'),
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario' })],
        ])
        expect(r.retrySuites).toEqual(['S1 tests=Given one:passed,Then two:failed hooks=sc1-before order=3'])
        expect(r.log).toContain('suite:retry S1 -> seq:S1#1')
        expect(r.suites.sc1).toMatchObject({ tests: [], hooks: [], hooksAndTests: [], retries: 1 })
        expect(r.counts).toMatchObject({ tests: 0, passes: 0, failures: 0 })
    })

    it('I1: onSuiteRetry sees the new retry count, as on main, with the failed attempt', () => {
        const retries: string[] = []
        class CountRecorder extends Recorder {
            onSuiteRetry (s: SuiteStats) { retries.push(`${s.title} retries=${s.retries} tests=${s.tests.length}`) }
        }
        const r = new CountRecorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
            ...steps('sc1', undefined, 'test:retry'),
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario' })],
            ...steps('sc1', undefined, 'test:retry'),
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario' })],
        ])
        expect(retries).toEqual(['S1 retries=1 tests=2', 'S1 retries=2 tests=2'])
        expect(r.suites.sc1).toMatchObject({ tests: [], retries: 2 })
    })

    it('K12 parallel: onSuiteRetry sees only the failed attempt of its scenario, with interleaved payloads', () => {
        const r = new RetryRecorder()
        // the parallel adapter gives the hooks the uid of their scenario
        const withParent = (events: Events, sc: string): Events => events.map(([e, p]) => [e, e === 'hook:start' ? { ...p, parentUid: sc } : p])
        const a = withParent(steps('sc1', 'A', 'test:retry'), 'sc1'), b = withParent(steps('sc2', 'B'), 'sc2')
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature', parentUid: null })],
            ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f', parentUid: 'f', contextId: 'A' })],
            ['suite:start', suiteEv('sc2', 'S2', { type: 'scenario', parent: 'f', parentUid: 'f', contextId: 'B' })],
            a[0], b[0], a[1], b[1], a[2], b[2], b[3], a[3], b[4], a[4], a[5], b[5], a[6], b[6], a[7], b[7],
            ['suite:retry', suiteEv('sc1', 'S1', { type: 'scenario', contextId: 'A' })],
        ])
        expect(r.retrySuites).toEqual(['S1 tests=Given one:passed,Then two:failed hooks=sc1-before order=3'])
        expect(r.log).toContain('suite:retry S1 -> A:S1#1')
        expect(r.suites.sc1.tests).toEqual([])
        expect(r.suites.sc2.tests.map((t) => t.title)).toEqual(['Given one', 'Then two'])
        expect(r.suites.sc2.hooks.map((h) => h.uid)).toEqual(['sc2-before'])
    })

    it('K12: a retried scenario keeps the start of its first attempt, as main; onSuiteRetry sees the failed attempt', () => {
        vi.useFakeTimers({ now: 1000 })
        try {
            const r = new RetryRecorder()
            play(r, [
                ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })],
                ['suite:start', suiteEv('sc1', 'S1', { type: 'scenario', parent: 'f' })],
                ...steps('sc1', undefined, 'test:retry'),
            ])
            vi.setSystemTime(5000)
            r.emit('suite:retry', { type: 'suite:retry', ...suiteEv('sc1', 'S1', { type: 'scenario' }) })
            expect(r.retryStarts).toEqual([1000])
            expect(r.suites.sc1.start.getTime()).toBe(1000)
            vi.setSystemTime(7000)
            r.emit('suite:end', { type: 'suite:end', ...suiteEv('sc1', 'S1', { type: 'scenario' }) })
            // the duration covers all attempts
            expect(r.suites.sc1.duration).toBe(6000)
        } finally {
            vi.useRealTimers()
        }
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
    it('unitState survives context:end, and runner:end: the units stay for the life of the reporter', () => {
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

    it('M2: onRunnerStart and onRunnerEnd get no unit and no state, also in the resolver context of a unit', () => {
        const seen: string[] = []
        class RunnerRecorder extends Recorder {
            onRunnerStart () { seen.push(`start ${name(this.getContextUnit())} ${this.unitState('k', () => 1) ?? '-'}`) }
            onRunnerEnd () { seen.push(`end ${name(this.getContextUnit())} ${this.unitState('k', () => 1) ?? '-'}`) }
        }
        const sequential = new RunnerRecorder()
        play(sequential, [['test:start', testEv('t1', 'x')], ['test:end', testEv('t1', 'x')]])
        end(sequential)
        const parallel = new RunnerRecorder()
        parallel.setContextIdResolver(() => 'A')
        play(parallel, [['test:start', testEv('t1', 'x', { contextId: 'A' })]])
        end(parallel)
        expect(seen).toEqual(['start none -', 'end none -', 'start none -', 'end none -'])
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

/**
 * Event streams of the Vitest bridge, recorded on this branch (headless Chrome, 2026-10-25) by an event probe: per event
 * the payload fields that the base reads and the resolver context of the bridge (the module hash of a Vitest id is `m`)
 */
type Recorded = [string, Record<string, unknown>, string | null]
const vitest: Record<string, Recorded[]> = JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__', 'vitest-streams.json'), 'utf-8'))
const runnerEv = { ...base, capabilities: {}, config: {}, sessionId: 's', isMultiRemote: false, instanceOptions: {}, retry: 0, failures: 0, retries: 0 }

class VitestRecorder extends Recorder {
    // the attemptState that each hook sees: the uid of the test that started the attempt
    attempts: string[] = []
    #scopeFree (event: string, title = '') {
        this.log.push(`${event} ${title} -> ${name(this.getContextUnit())} state=${this.unitState('k', () => 'made') ?? '-'}`)
    }
    onRunnerStart () { this.#scopeFree('runner:start') }
    onSuiteStart (s: SuiteStats) { this.#scopeFree('suite:start', s.title) }
    onSuiteEnd (s: SuiteStats) { this.#scopeFree('suite:end', s.title) }
    onTestStart (t: TestStats) {
        super.onTestStart(t)
        this.attemptState('first', () => t.uid)
    }
    onHookEnd (h: HookStats) {
        super.onHookEnd(h)
        this.attempts.push(`${h.title} -> ${this.attemptState('first', () => '(new)')}`)
    }
}

function replayVitest (stream: string, skip: (event: string) => boolean = () => false) {
    const r = new VitestRecorder()
    const resolved: { id?: string } = {}
    r.setContextIdResolver(() => resolved.id)
    for (const event of ['allure:runtimeMessage', 'junit:addProperty']) {
        r.on(event, (p: { kind?: string }) => r.log.push(`${event} ${p.kind} -> ${name(r.getContextUnit())}`))
    }
    for (const [event, payload, als] of vitest[stream]) {
        if (skip(event)) {
            continue
        }
        resolved.id = als ?? undefined
        r.emit(event, { type: event, ...(event.startsWith('runner:') ? runnerEv : base), ...payload })
    }
    return r
}
const count = (r: Recorder, prefix: string) => r.log.filter((l) => l.startsWith(prefix)).length

describe('units: Vitest bridge (recorded streams)', () => {
    it('lane modules: one unit per test with its contextId, ends at context:end', () => {
        for (const c of ['conc', 'mixed', 'skip-conc', 'runtime-conc']) {
            const r = replayVitest(c)
            const tests = Object.values(r.tests)
            expect(count(r, 'UNIT+'), c).toBe(tests.length)
            for (const t of tests) {
                expect(r.unitOf(t), `${c} ${t.title}`).toMatchObject({ contextId: t.contextId, ended: true, attempt: 0 })
            }
        }
        // the results come in another order than the starts: each unit still ends after its own test
        expect(unitLines(replayVitest('conc'))).toEqual([
            'UNIT+ m_0_0:c1 slow 1500#0', 'UNIT+ m_0_1:c2 fast fail 200#0', 'UNIT+ m_0_2:c3 mid 700#0',
            'UNIT- m_0_1:c2 fast fail 200#0 test=c2 fast fail 200', 'UNIT- m_0_2:c3 mid 700#0 test=c3 mid 700', 'UNIT- m_0_0:c1 slow 1500#0 test=c1 slow 1500',
        ])
    })

    it('non-lane modules: a sequential unit per test, also when the module-level wrapper suite opens again', () => {
        const r = replayVitest('seq')
        expect(unitLines(r).filter((l) => l.startsWith('UNIT+'))).toEqual([
            'UNIT+ seq:s0 module first#0', 'UNIT+ seq:s1 pass#0', 'UNIT+ seq:s2 fail#0', 'UNIT+ seq:s3 after inner#0',
            'UNIT+ seq:s4 module after describe#0', 'UNIT+ seq:s5 pass#0',
        ])
        expect(count(r, 'UNIT-')).toBe(6)
        expect(r.pathOf(r.tests['test-0-0-2']).map((s) => s.title)).toEqual(['S outer', 'S inner'])
        expect(r.pathOf(r.tests['test-0-0-4']).map((s) => s.title)).toEqual(['src/specs/vt-seq.ts'])
    })

    it('retries: onUnitRetry once per failed attempt, although test:retry, a new uid with the same title and payload retries all come', () => {
        for (const c of ['retry-seq', 'retry-conc']) {
            const r = replayVitest(c)
            const retries = (title: string) => r.log.filter((l) => l.startsWith('UNIT~') && l.includes(`:${title}#`)).map((l) => l.slice(-2))
            expect([retries('r1 fails twice then passes'), retries('r2 always fails'), retries('r3 plain pass')], c).toEqual([['#0', '#1'], ['#0', '#1'], []])
            expect(count(r, 'UNIT+'), c).toBe(3)
            expect(count(r, 'UNIT-'), c).toBe(3)
            expect(r.unitOf(r.tests['test-0-0-0-retry-2']), c).toBe(r.unitOf(r.tests['test-0-0-0']))
            expect(r.unitOf(r.tests['test-0-0-0-retry-2'])?.attempt, c).toBe(2)
        }
    })

    it('D15: the hooks of a failed attempt keep that attempt and its attemptState, also the afterEach after test:retry', () => {
        for (const c of ['hook-each-seq', 'hook-each-conc']) {
            const r = replayVitest(c)
            expect(r.log.filter((l) => l.startsWith('hook:end "before each" hook for "h1')).map((l) => l.slice(-2)), c).toEqual(['#0', '#1'])
            expect(r.attempts.filter((l) => l.includes('"h1')), c).toEqual([
                '"before each" hook for "h1 passes on retry" -> test-0-0-0', '"before each" hook for "h1 passes on retry" -> test-0-0-0-retry-1',
            ])
        }
        for (const c of ['hook-after-seq', 'hook-after-conc']) {
            const r = replayVitest(c)
            const after = r.log.filter((l) => l.startsWith('hook:') && l.includes('"after each" hook for "h1'))
            expect(after.map((l) => l.replace(/m_0_0|seq/, '*')), c).toEqual([
                'hook:start "after each" hook for "h1 passes on retry" -> *:h1 passes on retry#0',
                'hook:end "after each" hook for "h1 passes on retry" -> *:h1 passes on retry#0',
                'hook:start "after each" hook for "h1 passes on retry" -> *:h1 passes on retry#1',
                'hook:end "after each" hook for "h1 passes on retry" -> *:h1 passes on retry#1',
            ])
            // the failed afterEach comes after test:retry of attempt 0
            expect(r.log.indexOf(after[0]), c).toBeGreaterThan(r.log.findIndex((l) => l.startsWith('test:retry h1')))
            expect(r.hooks['test-0-0-0-afterEach'], c).toMatchObject({ retried: true, failedTestUid: 'test-0-0-0' })
            expect(r.attempts.filter((l) => l.includes('"h1')), c).toEqual([
                '"after each" hook for "h1 passes on retry" -> test-0-0-0', '"after each" hook for "h1 passes on retry" -> test-0-0-0-retry-1',
            ])
        }
    })

    it('failed beforeAll / afterAll: no unit in a lane module (latch), the ended unit of the last test in a non-lane module', () => {
        const conc = replayVitest('hookall-conc')
        expect(conc.log.filter((l) => l.startsWith('hook:'))).toEqual([
            'hook:start "before all" hook in "A conc before all fails" -> none', 'hook:end "before all" hook in "A conc before all fails" -> none',
            'hook:start "after all" hook in "B conc after all fails" -> none', 'hook:end "after all" hook in "B conc after all fails" -> none',
        ])
        const seq = replayVitest('hookall-seq')
        expect(seq.unitOf(seq.hooks['hook-0-0-0'])).toBe(seq.unitOf(seq.tests['test-0-0-1']))
        expect(seq.log).toContain('hook:end "before all" hook in "A seq before all fails" -> seq:a2#0')
        expect(seq.unitOf(seq.tests['test-0-0-1'])?.ended).toBe(true)
        expect(replayVitest('rootall-conc').log).toContain('hook:end "before all" hook in "{root}" -> none')
    })

    it('runtime calls replayed by the bridge get the unit of the test that made them (resolver in lane modules, open unit else)', () => {
        for (const c of ['runtime-seq', 'runtime-conc', 'runtime-mixed']) {
            const r = replayVitest(c)
            const calls = r.log.filter((l) => /^(allure|junit):/.test(l))
            const recorded = vitest[c].filter(([e]) => /^(allure|junit):/.test(e))
            expect(calls.length, c).toBe(recorded.length)
            expect(calls.length, c).toBeGreaterThan(0)
            for (const [event, p] of recorded) {
                expect(calls.shift(), c).toMatch(new RegExp(`^${event} ${p.kind} -> [^:]+:${p.test}#0$`))
            }
        }
    })

    it('D16: a test:start in a context that ended opens a new unit (Vitest bail reports each test again); the first unit stays ended', () => {
        const r = replayVitest('bail')
        expect(count(r, 'UNIT+')).toBe(7)
        expect(Object.values(r.tests).filter((t) => t.title === 'bl1 fails fast')).toHaveLength(2)
        const first = r.unitOf(r.tests['test-0-0-0'])!
        const again = r.unitOf(r.tests['test-0-0-3'])!
        expect(again).not.toBe(first)
        expect(first).toMatchObject({ contextId: 'm_0_0', ended: true, stats: r.tests['test-0-0-0'], test: r.tests['test-0-0-0'] })
        expect(again).toMatchObject({ contextId: 'm_0_0', ended: true, stats: r.tests['test-0-0-3'], attempt: 0 })
        expect(r.getContextUnit('m_0_0')).toBe(again)
        const second = r.log.indexOf('test:start bl1 fails fast -> m_0_0:bl1 fails fast#0', r.log.indexOf('UNIT- m_0_2:bl3 slow 3000#0 test=bl3 slow 3000'))
        expect(r.log.slice(second - 1, r.log.indexOf('suite:end BL conc -> none state=-') + 1)).toEqual([
            'UNIT+ m_0_0:bl1 fails fast#0',
            'test:start bl1 fails fast -> m_0_0:bl1 fails fast#0',
            'test:fail bl1 fails fast -> m_0_0:bl1 fails fast#0',
            'test:end bl1 fails fast -> m_0_0:bl1 fails fast#0',
            'context:end -> m_0_0:bl1 fails fast#0',
            'UNIT- m_0_0:bl1 fails fast#0 test=bl1 fails fast',
            'UNIT+ m_0_1:bl2 slow 2000#0',
            'test:start bl2 slow 2000 -> m_0_1:bl2 slow 2000#0',
            'test:skip bl2 slow 2000 -> m_0_1:bl2 slow 2000#0',
            'test:end bl2 slow 2000 -> m_0_1:bl2 slow 2000#0',
            'context:end -> m_0_1:bl2 slow 2000#0',
            'UNIT- m_0_1:bl2 slow 2000#0 test=bl2 slow 2000',
            'UNIT+ m_0_2:bl3 slow 3000#0',
            'test:start bl3 slow 3000 -> m_0_2:bl3 slow 3000#0',
            'test:skip bl3 slow 3000 -> m_0_2:bl3 slow 3000#0',
            'test:end bl3 slow 3000 -> m_0_2:bl3 slow 3000#0',
            'context:end -> m_0_2:bl3 slow 3000#0',
            'UNIT- m_0_2:bl3 slow 3000#0 test=bl3 slow 3000',
            'suite:end BL conc -> none state=-',
        ])
    })

    it('D17: runner:start, suite:start and suite:end get no unit, also in the resolver context of an open unit', () => {
        const r = replayVitest('d17-conc')
        const wrapper = 'suite:start src/specs/vt-d17-conc.ts -> none state=-'
        // the bridge opens the module-level wrapper again in the replay of x, whose unit is open
        expect(r.log.lastIndexOf(wrapper)).toBeGreaterThan(r.log.indexOf('test:start x module level slow -> m_0:x module level slow#0'))
        expect(r.log.lastIndexOf(wrapper)).toBeLessThan(r.log.indexOf('UNIT- m_0:x module level slow#0 test=x module level slow'))
        expect(r.log[0]).toBe('runner:start  -> none state=-')
        for (const c of ['d17-conc', 'rootall-conc', 'mixed']) {
            const events = replayVitest(c).log.filter((l) => /^(runner|suite):/.test(l))
            expect(events.length, c).toBeGreaterThan(2)
            expect(events.filter((l) => !l.endsWith(' -> none state=-')), c).toEqual([])
        }
    })

    it('no context:end (the bridge closes unfinished tests): the units end at runner:end', () => {
        const r = replayVitest('conc', (event) => event === 'context:end')
        expect(r.log.slice(-4)).toEqual([
            'suite:end C group -> none state=-',
            'UNIT- m_0_0:c1 slow 1500#0 test=c1 slow 1500', 'UNIT- m_0_1:c2 fast fail 200#0 test=c2 fast fail 200', 'UNIT- m_0_2:c3 mid 700#0 test=c3 mid 700',
        ])
        expect(Object.values(r.tests).every((t) => r.unitOf(t)?.ended)).toBe(true)
    })
})

describe('units: hook owner (hookKind, hookSuiteUid)', () => {
    // m04: an inner `before` after an outer test; with `kind`, the adapter sends hookKind and hookSuiteUid
    const m04 = (kind: boolean, suiteUid = true): Events => {
        const all = (hookKind: string, uid: string) => kind ? { hookKind, ...(suiteUid ? { hookSuiteUid: uid } : {}) } : {}
        return [
            ['suite:start', suiteEv('s1', 'outer')],
            ['test:start', testEv('t1', 'o1')],
            ['test:pass', testEv('t1', 'o1')],
            ['test:end', testEv('t1', 'o1')],
            ['suite:start', suiteEv('s2', 'inner')],
            ['hook:start', hookEv('h1', '"before all" hook for inner', all('beforeAll', 's2'))],
            ['hook:end', hookEv('h1', '"before all" hook for inner', all('beforeAll', 's2'))],
            ['test:start', testEv('t2', 'i1')],
            ['test:pass', testEv('t2', 'i1')],
            ['test:end', testEv('t2', 'i1')],
            ['hook:start', hookEv('h2', '"after all" hook for inner', all('afterAll', 's2'))],
            ['hook:end', hookEv('h2', '"after all" hook for inner', all('afterAll', 's2'))],
            ['suite:end', suiteEv('s2', 'inner')],
            ['hook:start', hookEv('h3', '"after all" hook for outer', all('afterAll', 's1'))],
            ['hook:end', hookEv('h3', '"after all" hook for outer', all('afterAll', 's1'))],
            ['suite:end', suiteEv('s1', 'outer')],
        ]
    }
    const hookLines = (r: Recorder) => r.log.filter((l) => l.startsWith('hook:'))

    it('contextless beforeAll of a nested describe has no unit and its suite as owner', () => {
        const r = new Recorder()
        play(r, m04(true))
        expect(r.log).toContain('hook:start "before all" hook for inner -> none')
        expect(r.log).toContain('hook:end "before all" hook for inner -> none')
        expect(r.unitOf(r.hooks.h1)).toBeUndefined()
        expect(r.hookOwner(r.hooks.h1)).toBe(r.suites.s2)
        // no hookSuiteUid: the suite that the base inserted the hook in
        const noUid = new Recorder()
        play(noUid, m04(true, false))
        expect(noUid.hookOwner(noUid.hooks.h1)).toBe(noUid.suites.s2)
        expect(noUid.unitOf(noUid.hooks.h1)).toBeUndefined()
    })

    it('afterAll owner is its suite, not the last test', () => {
        const r = new Recorder()
        play(r, m04(true))
        expect(hookLines(r).filter((l) => l.includes('after all'))).toEqual([
            'hook:start "after all" hook for inner -> none',
            'hook:end "after all" hook for inner -> none',
            'hook:start "after all" hook for outer -> none',
            'hook:end "after all" hook for outer -> none',
        ])
        expect(r.hookOwner(r.hooks.h2)).toBe(r.suites.s2)
        expect(r.hookOwner(r.hooks.h3)).toBe(r.suites.s1)
        // an unknown hookSuiteUid falls back to the suite of the hook
        r.emit('suite:start', { type: 'suite:start', ...suiteEv('s3', 'last') })
        r.emit('hook:start', { type: 'hook:start', ...hookEv('h4', '"after all" hook for last', { hookKind: 'afterAll', hookSuiteUid: 'nope' }) })
        expect(r.hookOwner(r.hooks.h4)).toBe(r.suites.s3)
        // hookSuiteUid wins over the suite that the base inserted the hook in
        r.emit('hook:start', { type: 'hook:start', ...hookEv('h5', '"after all" hook for outer', { parentUid: 's3', hookKind: 'afterAll', hookSuiteUid: 's1' }) })
        expect(r.parentOf(r.hooks.h5)).toBe(r.suites.s3)
        expect(r.hookOwner(r.hooks.h5)).toBe(r.suites.s1)
    })

    it('a contextless all-hook under the root suite has no owner', () => {
        const r = new Recorder()
        play(r, [['hook:start', hookEv('h0', '"before all" hook in "{root}"', { hookKind: 'beforeAll' })]])
        expect(r.hookOwner(r.hooks.h0)).toBeUndefined()
        expect(r.unitOf(r.hooks.h0)).toBeUndefined()
    })

    it('all-hook with contextId belongs to the context unit', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
            ['hook:start', hookEv('h1', '"before all" hook', { contextId: 'A', parentUid: 's1', hookKind: 'beforeAll', hookSuiteUid: 's1' })],
            ['hook:end', hookEv('h1', '"before all" hook', { contextId: 'A', parentUid: 's1', hookKind: 'beforeAll', hookSuiteUid: 's1' })],
            ['test:start', testEv('t1', 'a1', { contextId: 'A', parentUid: 's1' })],
        ])
        expect(hookLines(r)).toEqual(['hook:start "before all" hook -> A:-#0', 'hook:end "before all" hook -> A:-#0'])
        expect(r.hookOwner(r.hooks.h1)).toBe(r.getContextUnit('A'))
        expect(r.unitOf(r.hooks.h1)).toBe(r.getContextUnit('A'))
    })

    it('each-hooks and step hooks with hookKind keep the current unit, and their commands go to its test', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['test:start', testEv('t1', 'a1')],
            ['hook:start', hookEv('h1', '"before each" hook', { hookKind: 'beforeEach' })],
            ['hook:end', hookEv('h1', '"before each" hook', { hookKind: 'beforeEach' })],
            ['hook:start', hookEv('h2', 'before step', { hookKind: 'beforeStep' })],
            ['hook:end', hookEv('h2', 'before step', { hookKind: 'beforeStep' })],
            ['test:pass', testEv('t1', 'a1')],
            ['test:end', testEv('t1', 'a1')],
            ['hook:start', hookEv('h3', '"after each" hook', { hookKind: 'afterEach' })],
        ])
        r.emit('client:beforeCommand', { sessionId: 's', method: 'POST', endpoint: '/screenshot', body: {} })
        expect(hookLines(r)).toEqual([
            'hook:start "before each" hook -> seq:a1#0',
            'hook:end "before each" hook -> seq:a1#0',
            'hook:start before step -> seq:a1#0',
            'hook:end before step -> seq:a1#0',
            'hook:start "after each" hook -> seq:a1#0',
        ])
        expect(r.hookOwner(r.hooks.h3)).toBe(r.unitOf(r.tests.t1))
        expect(r.tests.t1.output).toHaveLength(1)
        expect(r.getContextTest()).toBe(r.tests.t1)
    })

    const afterAll = (kind: boolean): Events => [
        ['suite:start', suiteEv('s1', 'A')],
        ['test:start', testEv('t1', 'a1')],
        ['test:pass', testEv('t1', 'a1')],
        ['test:end', testEv('t1', 'a1')],
        ['hook:start', hookEv('h1', '"after all" hook', kind ? { hookKind: 'afterAll', hookSuiteUid: 's1' } : {})],
    ]
    const command = (r: Recorder) => r.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {} })

    it('commands between hook:start and hook:end of a contextless all-hook get no test', () => {
        const r = new Recorder()
        const resolved: { id?: string } = {}
        r.setContextIdResolver(() => resolved.id)
        play(r, afterAll(true))
        command(r)
        expect(r.log.at(-1)).toBe('command -> none')
        expect(r.tests.t1.output).toHaveLength(0)
        expect(r.getContextTest()).toBe(r.tests.t1)
        expect(r.getContextUnit()).toBeUndefined()
        expect(r.unitState('k', () => 1)).toBeUndefined()
        // a call in a parallel context keeps its context
        resolved.id = 'X'
        expect(r.getContextId()).toBe('X')
        resolved.id = undefined
        r.emit('hook:end', { type: 'hook:end', ...hookEv('h1', '"after all" hook', { hookKind: 'afterAll', hookSuiteUid: 's1' }) })
        // after hook:end: today's behavior
        expect(r.getContextTest()).toBe(r.tests.t1)
        command(r)
        expect(r.tests.t1.output).toHaveLength(1)
    })

    it('no hookKind keeps today\'s owner', () => {
        const r = new Recorder()
        play(r, m04(false))
        expect(hookLines(r)).toEqual([
            'hook:start "before all" hook for inner -> seq:o1#0',
            'hook:end "before all" hook for inner -> seq:o1#0',
            'hook:start "after all" hook for inner -> seq:i1#0',
            'hook:end "after all" hook for inner -> seq:i1#0',
            'hook:start "after all" hook for outer -> seq:i1#0',
            'hook:end "after all" hook for outer -> seq:i1#0',
        ])
        expect(r.hookOwner(r.hooks.h1)).toBe(r.unitOf(r.tests.t1))
        expect(r.hookOwner(r.hooks.h3)).toBe(r.unitOf(r.tests.t2))
        expect('hookKind' in r.hooks.h1).toBe(false)
        // calls in the hook: the last test, as today
        const c = new Recorder()
        play(c, afterAll(false))
        command(c)
        expect(c.log.at(-1)).toBe('command -> seq:a1#0')
        expect(c.tests.t1.output).toHaveLength(1)
        expect(c.getContextTest()).toBe(c.tests.t1)
        // no hook before the first test: no owner
        const first = new Recorder()
        play(first, [['suite:start', suiteEv('s1', 'A')], ['hook:start', hookEv('h0', '"before all" hook')]])
        expect(first.hookOwner(first.hooks.h0)).toBeUndefined()
    })

    const allEv = (uid: string, title: string, extra: Record<string, unknown> = {}) => hookEv(uid, title, { hookKind: 'afterAll', hookSuiteUid: 's1', ...extra })
    const emit = (r: Recorder, event: string, payload: Record<string, unknown>) => r.emit(event, { type: event, ...payload })

    it('commands inside a contextless all-hook land in hook.output and in no test', () => {
        const r = new Recorder()
        play(r, afterAll(true))
        command(r)
        r.emit('client:afterCommand', { sessionId: 's', method: 'GET', endpoint: '/url', result: {} })
        expect(r.tests.t1.output).toHaveLength(0)
        expect(r.hooks.h1.output?.map((o) => o.type)).toEqual(['command', 'result'])
        expect(r.hookOwner(r.hooks.h1)).toBe(r.suites.s1)
        // no hookKind: the test of today, no output on the hook
        const c = new Recorder()
        play(c, afterAll(false))
        command(c)
        expect(c.tests.t1.output).toHaveLength(1)
        expect('output' in c.hooks.h1).toBe(false)
    })

    it('the open all-hook ends also when onHookEnd throws', () => {
        const r = new Recorder()
        r.onHookEnd = () => { throw new Error('reporter bug') }
        play(r, afterAll(true))
        expect(() => emit(r, 'hook:end', allEv('h1', '"after all" hook'))).toThrow('reporter bug')
        expect(r.getContextTest()).toBe(r.tests.t1)
    })

    it('a missing hook:end ends at the next contextless test:start', () => {
        const r = new Recorder()
        play(r, afterAll(true))
        emit(r, 'test:start', testEv('t2', 'next'))
        command(r)
        expect(r.getContextTest()).toBe(r.tests.t2)
        expect(r.tests.t2.output).toHaveLength(1)
        expect(r.hooks.h1.output).toBeUndefined()
    })

    it('a missing hook:end ends at a suite:end in a sequential run', () => {
        const r = new Recorder()
        play(r, [...afterAll(true), ['suite:start', suiteEv('s2', 'B')], ['suite:end', suiteEv('s2', 'B')]])
        expect(r.getContextTest()).toBe(r.tests.t1)
        command(r)
        expect(r.tests.t1.output).toHaveLength(1)
    })

    it('a missing hook:end ends at the suite:end of its owner after a parallel context', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
            ['suite:start', suiteEv('s2', 'B', { parentUid: null })],
            ['test:start', testEv('t1', 'a1', { contextId: 'A', parentUid: 's1' })],
            ['test:end', testEv('t1', 'a1', { contextId: 'A' })],
            ctxEnd('t1', 'A'),
            ['hook:start', allEv('h1', '"after all" hook for B', { parentUid: 's2', hookSuiteUid: 's2' })],
            ['suite:end', suiteEv('s1', 'A')],
        ])
        command(r)
        expect(r.hooks.h1.output).toHaveLength(1)
        emit(r, 'suite:end', suiteEv('s2', 'B'))
        command(r)
        expect(r.hooks.h1.output).toHaveLength(1)
        // R6: the test of the unit that opened last
        expect(r.tests.t1.output).toHaveLength(1)
    })

    it('a missing hook:end ends at runner:end', () => {
        const r = new Recorder()
        play(r, afterAll(true))
        end(r)
        expect(r.getContextTest()).toBe(r.tests.t1)
    })

    it('a hook:start with a uid that is open replaces the open entry', () => {
        const r = new Recorder()
        play(r, [...afterAll(true), ['hook:start', allEv('h1', '"after all" hook')], ['hook:end', allEv('h1', '"after all" hook')]])
        expect(r.getContextTest()).toBe(r.tests.t1)
        command(r)
        expect(r.tests.t1.output).toHaveLength(1)
    })

    it('nested all-hooks: commands go to the inner one, then to the outer one', () => {
        const r = new Recorder()
        play(r, afterAll(true))
        emit(r, 'hook:start', allEv('h2', 'inner', { hookKind: 'beforeAll' }))
        command(r)
        emit(r, 'hook:end', allEv('h2', 'inner', { hookKind: 'beforeAll' }))
        command(r)
        command(r)
        expect(r.hooks.h2.output).toHaveLength(1)
        expect(r.hooks.h1.output).toHaveLength(2)
        expect(r.tests.t1.output).toHaveLength(0)
    })

    it('a context-id hook during a contextless all-hook keeps its context', () => {
        const r = new Recorder()
        play(r, [
            ...afterAll(true),
            ['hook:start', hookEv('hc', '"before each" hook', { contextId: 'A', hookKind: 'beforeEach' })],
            ['test:start', testEv('ta', 'a1', { contextId: 'A' })],
        ])
        r.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {}, contextId: 'A' })
        command(r)
        expect(r.tests.ta.output).toHaveLength(1)
        expect(r.hooks.h1.output).toHaveLength(1)
        expect(r.log).toContain('hook:start "before each" hook -> A:-#0')
    })

    it('hook:end gives hookKind and hookSuiteUid when only the end knows them', () => {
        const r = new Recorder()
        play(r, afterAll(false))
        r.emit('hook:end', { type: 'hook:end', ...hookEv('h1', '"after all" hook', { hookKind: 'afterAll', hookSuiteUid: 's1' }) })
        expect(r.hooks.h1).toMatchObject({ hookKind: 'afterAll', hookSuiteUid: 's1' })
        expect(r.hookOwner(r.hooks.h1)).toBe(r.suites.s1)
        expect(r.unitOf(r.hooks.h1)).toBeUndefined()
        expect(r.log.at(-1)).toBe('hook:end "after all" hook -> none')
    })
})

describe('K32: hooks that the framework skips', () => {
    const hookEnd = (uid: string, extra: Record<string, unknown>): Events => [
        ['hook:start', hookEv(uid, uid, extra)],
        ['hook:end', hookEv(uid, uid, extra)],
    ]
    const stateAtEnd = (extra: Record<string, unknown>) => {
        const seen: (string | undefined)[] = []
        const r = new (class extends Recorder {
            onHookEnd (h: HookStats) { seen.push(h.state) }
        })()
        play(r, [['suite:start', suiteEv('s1', 'A')], ...hookEnd('h1', extra)])
        expect(seen).toEqual([r.hooks.h1.state])
        return r.hooks.h1.state
    }

    it('Mocha `this.skip()` (sequential and parallel payloads): pending with no state', () => {
        expect(stateAtEnd({ hookKind: 'beforeAll', pending: true })).toBe('skipped')
        expect(stateAtEnd({ hookKind: 'beforeEach', pending: true })).toBe('skipped')
        expect(stateAtEnd({ hookKind: 'beforeEach', pending: true, contextId: 'A', parentUid: 's1' })).toBe('skipped')
    })

    it('Cucumber hook result SKIPPED (a Before that returns \'skipped\'), sequential and parallel', () => {
        expect(stateAtEnd({ hookKind: 'beforeEach', state: 'SKIPPED' })).toBe('skipped')
        expect(stateAtEnd({ hookKind: 'beforeEach', state: 'SKIPPED', parentUid: 's1' })).toBe('skipped')
    })

    it('a hook that ran or failed is not skipped', () => {
        // Mocha sequential hook:end, Mocha parallel config hook (pending of a skipped first suite), Vitest ctx.skip(), Cucumber
        expect(stateAtEnd({ pending: false })).toBeUndefined()
        expect(stateAtEnd({ state: 'pass', pending: true })).toBeUndefined()
        expect(stateAtEnd({ state: 'pass' })).toBeUndefined()
        expect(stateAtEnd({ state: 'PASSED' })).toBeUndefined()
        expect(stateAtEnd({ state: 'PENDING' })).toBeUndefined()
        expect(stateAtEnd({ pending: true, error: { message: 'x' } })).toBe('failed')
        expect(stateAtEnd({ state: 'SKIPPED', error: { message: 'x' } })).toBe('failed')
    })
})

describe('units: commands of a parallel context before its test', () => {
    const emit = (r: Recorder, event: string, payload: Record<string, unknown>) => r.emit(event, { type: event, ...payload })
    const command = (r: Recorder) => r.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {} })
    const afterAll: Events = [
        ['suite:start', suiteEv('s1', 'A')],
        ['test:start', testEv('t1', 'a1')],
        ['test:pass', testEv('t1', 'a1')],
        ['test:end', testEv('t1', 'a1')],
        ['hook:start', hookEv('h1', '"after all" hook', { hookKind: 'afterAll', hookSuiteUid: 's1' })],
    ]
    const ctxCommand = (r: WDIOReporter, contextId: string, script?: string) => r.emit('client:beforeCommand', {
        sessionId: 's', method: 'POST', endpoint: '/session/:sessionId/execute/sync', body: script ? { script, args: [] } : {}, contextId
    })
    const beforeAll = (uid: string, contextId: string) => hookEv(uid, `"before all" hook ${uid}`, { contextId, hookKind: 'beforeAll', parentUid: 's1' })

    it('a command of a context with no test goes to the open hook of that context, with its script shortened', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
            ['hook:start', beforeAll('h1', 'c1')],
            ['hook:start', beforeAll('h2', 'c2')],
        ])
        ctxCommand(r, 'c1', 'function first () { return 1 }')
        ctxCommand(r, 'c2')
        emit(r, 'hook:end', beforeAll('h1', 'c1'))
        ctxCommand(r, 'c1')
        emit(r, 'test:start', testEv('t2', 'b1', { contextId: 'c2', parentUid: 's1' }))
        ctxCommand(r, 'c2')

        expect(r.hooks.h1.output).toHaveLength(1)
        expect((r.hooks.h1.output![0] as { body: { script: string } }).body.script).toBe('<script> [30 bytes]')
        expect(r.hooks.h2.output).toHaveLength(1)
        expect(r.tests.t2.output).toHaveLength(1)
        expect(r.getContextOwner()).toBeUndefined()
    })

    it('getContextOwner gives the stats of the caller: its test, else its open hook', () => {
        const r = new Recorder()
        let contextId: string | undefined
        r.setContextIdResolver(() => contextId)
        play(r, [['suite:start', suiteEv('s1', 'A', { parentUid: null })], ['hook:start', beforeAll('h1', 'c1')]])
        contextId = 'c1'
        expect(r.getContextOwner()).toBe(r.hooks.h1)
        expect(r.getContextTest()).toBeUndefined()
        emit(r, 'test:start', testEv('t1', 'a1', { contextId: 'c1', parentUid: 's1' }))
        expect(r.getContextOwner()).toBe(r.tests.t1)
        contextId = undefined
        // a contextless all-hook of a sequential run
        const s = new Recorder()
        play(s, afterAll)
        expect(s.getContextOwner()).toBe(s.hooks.h1)
        expect(s.getContextTest()).toBe(s.tests.t1)
    })

    it('a context:end ends the open hooks of its context', () => {
        const r = new Recorder()
        play(r, [['suite:start', suiteEv('s1', 'A', { parentUid: null })], ['hook:start', beforeAll('h1', 'c1')], ctxEnd('h1', 'c1')])
        ctxCommand(r, 'c1')
        expect(r.hooks.h1.output).toBeUndefined()
    })

    it('a parallel Cucumber retry gives the Before commands of the next attempt to its hook, not to the step of the failed attempt', () => {
        const r = new Recorder()
        const scenario = suiteEv('sc1', 'S1', { type: 'scenario', contextId: 'c1', parentUid: 'f1' })
        const before = (uid: string) => hookEv(uid, 'Before', { contextId: 'c1', parentUid: 'sc1', hookKind: 'beforeEach' })
        play(r, [
            ['suite:start', suiteEv('f1', 'F', { type: 'feature', parentUid: null })],
            ['suite:start', scenario],
            ['test:start', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1' })],
            ['test:retry', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1', error: { message: 'x' } })],
            ['test:end', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1' })],
            ['suite:retry', scenario],
            ['hook:start', before('b2')],
        ])
        const failedStep = r.tests.st1
        ctxCommand(r, 'c1')
        expect(failedStep.output).toHaveLength(0)
        expect(r.hooks.b2.output).toHaveLength(1)
    })

    it('a sequential hook keeps the commands on the test (no change)', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('s1', 'A')],
            ['test:start', testEv('t1', 'a1')],
            ['test:end', testEv('t1', 'a1')],
            ['hook:start', hookEv('h1', '"before each" hook', { hookKind: 'beforeEach' })],
        ])
        command(r)
        expect(r.tests.t1.output).toHaveLength(1)
        expect(r.hooks.h1.output).toBeUndefined()
    })
})

// U4: a sequential Cucumber `Before` runs after its scenario suite:start and before the first step
describe('units: commands of a sequential Cucumber Before', () => {
    const command = (r: Recorder) => r.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {} })
    const before = (uid: string, sc: string, extra: Record<string, unknown> = {}): Events => [['hook:start', hookEv(uid, 'Before', { parent: sc, hookKind: 'beforeEach', ...extra })]]
    const beforeEnd = (uid: string, sc: string, extra: Record<string, unknown> = {}): Events => [['hook:end', hookEv(uid, 'Before', { parent: sc, hookKind: 'beforeEach', ...extra })]]
    const step = (uid: string, sc: string, result = 'test:pass'): Events => [
        ['test:start', testEv(uid, 'Given step', { parent: sc })],
        [result, testEv(uid, 'Given step', { parent: sc, ...(result === 'test:retry' && { error: { message: 'x' } }) })],
        ['test:end', testEv(uid, 'Given step', { parent: sc })],
    ]
    const scenario = (uid: string) => suiteEv(uid, uid, { type: 'scenario', parent: 'f' })

    it('each Before gets the commands of its own scenario, also in the first scenario of the worker', () => {
        const r = new Recorder()
        r.setContextIdResolver(() => undefined)
        play(r, [['suite:start', suiteEv('f', 'Feature', { type: 'feature' })], ['suite:start', scenario('sc1')], ...before('b1', 'sc1')])
        command(r)
        expect(r.getContextOwner()).toBe(r.hooks.b1)
        // Q2: getContextTest() does not change
        expect(r.getContextTest()).toBeUndefined()
        play(r, [...beforeEnd('b1', 'sc1'), ...step('s1', 'sc1'), ['suite:end', scenario('sc1')], ['suite:start', scenario('sc2')], ...before('b2', 'sc2')])
        command(r)
        expect(r.getContextOwner()).toBe(r.hooks.b2)
        expect(r.getContextTest()).toBe(r.tests.s1)
        play(r, [...beforeEnd('b2', 'sc2'), ...step('s2', 'sc2')])
        command(r)
        expect(r.hooks.b1.output).toHaveLength(1)
        expect(r.hooks.b2.output).toHaveLength(1)
        expect(r.tests.s1.output).toHaveLength(0)
        expect(r.tests.s2.output).toHaveLength(1)
    })

    it('after a suite:retry, the Before of the next attempt gets its commands', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })], ['suite:start', scenario('sc1')],
            ...before('b1', 'sc1'), ...beforeEnd('b1', 'sc1'), ...step('s1', 'sc1', 'test:retry'),
            ['suite:retry', scenario('sc1')], ...before('b2', 'sc1'),
        ])
        const failedStep = r.tests.s1
        command(r)
        expect(r.hooks.b2.output).toHaveLength(1)
        expect(failedStep.output).toHaveLength(0)
    })

    it('a Before with no hookKind keeps the target of today: the step that started last', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'Feature', { type: 'feature' })], ['suite:start', scenario('sc1')], ...step('s1', 'sc1'),
            ['suite:end', scenario('sc1')], ['suite:start', scenario('sc2')], ...before('b2', 'sc2', { hookKind: undefined }),
        ])
        command(r)
        expect(r.tests.s1.output).toHaveLength(1)
        expect(r.hooks.b2.output).toBeUndefined()
    })
})

// the values of main 2c6277f34 for the same events (Q2)
describe('getContextTest() returns what it returned before the unit API', () => {
    const passed = (uid: string, extra: Record<string, unknown> = {}): Events => [
        ['test:start', testEv(uid, uid, extra)],
        ['test:pass', testEv(uid, uid, extra)],
        ['test:end', testEv(uid, uid, extra)],
    ]

    it('in a sequential contextless all-hook: the test that started last; the owner is the hook', () => {
        const after = new Recorder()
        play(after, [['suite:start', suiteEv('s1', 'A')], ...passed('t1'), ['hook:start', hookEv('h1', '"after all" hook', { hookKind: 'afterAll', hookSuiteUid: 's1' })]])
        expect(after.getContextTest()).toBe(after.tests.t1)
        expect(after.getContextOwner()).toBe(after.hooks.h1)

        const nested = new Recorder()
        play(nested, [
            ['suite:start', suiteEv('s1', 'A')], ...passed('t1'), ['suite:start', suiteEv('s2', 'B')],
            ['hook:start', hookEv('h1', '"before all" hook', { hookKind: 'beforeAll', hookSuiteUid: 's2' })],
        ])
        expect(nested.getContextTest()).toBe(nested.tests.t1)
        expect(nested.getContextOwner()).toBe(nested.hooks.h1)

        const first = new Recorder()
        play(first, [['suite:start', suiteEv('s1', 'A')], ['hook:start', hookEv('h1', '"before all" hook', { hookKind: 'beforeAll', hookSuiteUid: 's1' })]])
        expect(first.getContextTest()).toBeUndefined()
    })

    it('in a parallel contextless all-hook: undefined outside a context, the test of the context inside it', () => {
        const r = new Recorder()
        const resolved: { id?: string } = {}
        r.setContextIdResolver(() => resolved.id)
        play(r, [
            ['suite:start', suiteEv('s1', 'A', { parentUid: null })],
            ['test:start', testEv('t1', 't1', { contextId: 'c1', parentUid: 's1' })],
            ['hook:start', hookEv('h1', '"before all" hook', { hookKind: 'beforeAll', hookSuiteUid: 's1', parentUid: 's1' })],
        ])
        expect(r.getContextTest()).toBeUndefined()
        resolved.id = 'c1'
        expect(r.getContextTest()).toBe(r.tests.t1)
    })

    it('after a parallel Cucumber suite:retry: the step that started last in the context; the owner is the Before hook', () => {
        const r = new Recorder()
        let contextId: string | undefined
        r.setContextIdResolver(() => contextId)
        const scenario = suiteEv('sc1', 'S1', { type: 'scenario', contextId: 'c1', parentUid: 'f1' })
        play(r, [
            ['suite:start', suiteEv('f1', 'F', { type: 'feature', parentUid: null })],
            ['suite:start', scenario],
            ['test:start', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1' })],
            ['test:retry', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1', error: { message: 'x' } })],
            ['test:end', testEv('st1', 'step', { contextId: 'c1', parentUid: 'sc1' })],
            ['suite:retry', scenario],
            ['hook:start', hookEv('b2', 'Before', { contextId: 'c1', parentUid: 'sc1', hookKind: 'beforeEach' })],
        ])
        const failedStep = r.tests.st1
        contextId = 'c1'
        expect(r.getContextTest()).toBe(failedStep)
        expect(r.getContextOwner()).toBe(r.hooks.b2)
        contextId = undefined
        expect(r.getContextTest()).toBe(failedStep)
        // the next attempt
        r.emit('test:start', { type: 'test:start', ...testEv('st2', 'step', { contextId: 'c1', parentUid: 'sc1' }) })
        contextId = 'c1'
        expect(r.getContextTest()).toBe(r.tests.st2)
        expect(r.getContextOwner()).toBe(r.tests.st2)
    })
})

describe('CR2: the open hooks of a sequential unit', () => {
    // the maps keyed by a unit that the reporter writes to
    const unitMaps = (spy: { mock: { contexts: unknown[], calls: unknown[][] } }) => new Set(spy.mock.contexts.filter((_, i) => spy.mock.calls[i][0] instanceof Unit) as Map<Unit, unknown>[])
    const each = (uid: string, kind: string, test: string) => hookEv(uid, `"${kind === 'beforeEach' ? 'before' : 'after'} each" hook for "${test}"`, { hookKind: kind })
    const tests = ['t1', 't2', 't3']

    it.each([
        ['Mocha', (t: string): Events => [['test:start', testEv(t, t)], ['hook:start', each(`b${t}`, 'beforeEach', t)], ['hook:end', each(`b${t}`, 'beforeEach', t)],
            ['test:pass', testEv(t, t)], ['test:end', testEv(t, t)], ['hook:start', each(`a${t}`, 'afterEach', t)], ['hook:end', each(`a${t}`, 'afterEach', t)]]],
        ['Cucumber', (t: string): Events => [['suite:start', suiteEv(`sc${t}`, `sc${t}`, { type: 'scenario' })], ['hook:start', each(`b${t}`, 'beforeEach', t)], ['hook:end', each(`b${t}`, 'beforeEach', t)],
            ['test:start', testEv(t, t)], ['test:pass', testEv(t, t)], ['test:end', testEv(t, t)], ['hook:start', each(`a${t}`, 'afterEach', t)], ['hook:end', each(`a${t}`, 'afterEach', t)],
            ['suite:end', suiteEv(`sc${t}`, `sc${t}`, { type: 'scenario' })]]],
    ])('%s order: no entry stays for an ended unit or an empty list', (_, perTest) => {
        const spy = vi.spyOn(Map.prototype, 'set')
        try {
            const r = new Recorder()
            play(r, [['suite:start', suiteEv('s', 'S')], ...tests.flatMap(perTest), ['suite:end', suiteEv('s', 'S')]])
            const maps = unitMaps(spy)
            expect(maps.size).toBe(1)
            expect([...maps].map((m) => m.size)).toEqual([0])
            end(r)
            expect([...maps].map((m) => m.size)).toEqual([0])
        } finally {
            spy.mockRestore()
        }
    })
})

describe('CR1: a contextless beforeEach before its test:start', () => {
    class HookProbe extends Recorder {
        seen: string[] = []
        onHookStart (h: HookStats) {
            super.onHookStart(h)
            const owner = this.hookOwner(h)
            this.seen.push(`${h.title} unitOf=${name(this.unitOf(h))} owner=${owner instanceof SuiteStats ? owner.title : name(owner)} context=${name(this.getContextUnit())} state=${this.unitState('k', (u) => u.stats?.title) ?? 'undefined'}`)
        }
    }
    const each = (uid: string, kind: string, test: string, extra: Record<string, unknown> = {}) => hookEv(uid, `${kind} ${test}`, { hookKind: kind, ...extra })
    const run = (t: string, kind = 'beforeEach', extra: Record<string, unknown> = {}): Events => [['hook:start', each(`b${t}`, kind, t, extra)], ['hook:end', each(`b${t}`, kind, t, extra)],
        ['test:start', testEv(t, t)], ['test:pass', testEv(t, t)], ['test:end', testEv(t, t)]]

    it('gets no unit, not the ended unit of the test before it', () => {
        const r = new HookProbe()
        play(r, [['suite:start', suiteEv('s', 'S')], ...run('t1'), ...run('t2'), ['suite:end', suiteEv('s', 'S')]])
        expect(r.seen).toEqual([
            'beforeEach t1 unitOf=none owner=none context=none state=undefined',
            'beforeEach t2 unitOf=none owner=none context=none state=undefined',
        ])
        expect(r.log).toContain('hook:end beforeEach t2 -> none')
    })

    it('an afterEach and a hook with no hookKind keep the ended unit of the test before them', () => {
        const r = new HookProbe()
        play(r, [['suite:start', suiteEv('s', 'S')], ...run('t1'), ['hook:start', each('at1', 'afterEach', 't1')], ['hook:end', each('at1', 'afterEach', 't1')],
            ['hook:start', hookEv('h', 'no kind')]])
        expect(r.seen).toEqual([
            'beforeEach t1 unitOf=none owner=none context=none state=undefined',
            'afterEach t1 unitOf=seq:t1#0 owner=seq:t1#0 context=seq:t1#0 state=t1',
            'no kind unitOf=seq:t1#0 owner=seq:t1#0 context=seq:t1#0 state=t1',
        ])
    })
})

describe('CR3: an event that opens a unit in a context that ended', () => {
    /** the CustomReporter.md "Units" example */
    class PerTestReporter extends WDIOReporter {
        out: string[] = []
        starts = 0
        constructor () { super({ logFile: tmp.fileSync().name }) }
        #lines = (unit: ReporterUnit) => this.unitState('lines', () => [] as string[], unit.contextId)!
        onUnitStart () { this.starts++ }
        onTestEnd (test: TestStats) {
            const unit = this.unitOf(test)
            if (unit) {
                this.#lines(unit).push(`${test.state} ${test.title}`)
            }
        }
        onUnitEnd (unit: ReporterUnit) {
            this.out.push(`${unit.stats?.title} (attempt ${unit.attempt}): ${this.#lines(unit).join(', ')}`)
        }
    }
    const ctx = { contextId: 'A' }

    it('a test:pending opens a new unit; a hook:start after context:end keeps the ended unit', () => {
        const r = new PerTestReporter()
        play(r, [
            ['suite:start', suiteEv('s', 'S')],
            ['test:start', testEv('t1', 't1', ctx)], ['test:pass', testEv('t1', 't1', ctx)], ['test:end', testEv('t1', 't1', ctx)],
            ctxEnd('t1', 'A'),
            ['hook:start', hookEv('h2', '"before each" hook for "t2"', { ...ctx, hookKind: 'beforeEach' })],
            ['hook:end', hookEv('h2', '"before each" hook for "t2"', { ...ctx, hookKind: 'beforeEach' })],
            ['test:pending', testEv('t2', 't2', { ...ctx, state: 'pending' })], ['test:end', testEv('t2', 't2', ctx)],
            ctxEnd('t2', 'A'),
            ['suite:end', suiteEv('s', 'S')],
        ])
        end(r)
        const first = r.unitOf(r.tests.t1)
        expect(r.unitOf(r.hooks.h2)).toBe(first)
        expect(r.unitOf(r.tests.t2)).not.toBe(first)
        expect(r.unitOf(r.tests.t2)).toMatchObject({ contextId: 'A', ended: true, stats: r.tests.t2 })
        expect(r.starts).toBe(2)
        expect(r.out).toEqual(['t1 (attempt 0): passed t1', 't2 (attempt 0): pending t2'])
    })

    it('a Cucumber scenario suite:start opens one new unit for its scenario', () => {
        const r = new PerTestReporter()
        const sc = (uid: string) => suiteEv(uid, uid, { type: 'scenario', ...ctx })
        play(r, [
            ['suite:start', suiteEv('f', 'F', { type: 'feature' })],
            ['suite:start', sc('sc1')], ['test:start', testEv('s1', 'step1', ctx)], ['test:pass', testEv('s1', 'step1', ctx)], ['test:end', testEv('s1', 'step1', ctx)], ['suite:end', sc('sc1')],
            ctxEnd('s1', 'A'),
            ['suite:start', sc('sc2')], ['test:start', testEv('s2', 'step2', ctx)], ['test:pass', testEv('s2', 'step2', ctx)], ['test:end', testEv('s2', 'step2', ctx)], ['suite:end', sc('sc2')],
            ctxEnd('s2', 'A'),
        ])
        end(r)
        expect(r.unitOf(r.suites.sc2)).not.toBe(r.unitOf(r.suites.sc1))
        expect(r.unitOf(r.tests.s2)).toBe(r.unitOf(r.suites.sc2))
        expect(r.unitOf(r.suites.sc2)?.stats).toBe(r.suites.sc2)
        expect(r.starts).toBe(2)
        expect(r.out).toEqual(['sc1 (attempt 0): passed step1', 'sc2 (attempt 0): passed step2'])
    })

    it('the recorded Vitest bail stream: the example writes each of the 7 tests', () => {
        const r = new PerTestReporter()
        const resolved: { id?: string } = {}
        r.setContextIdResolver(() => resolved.id)
        for (const [event, payload, als] of vitest.bail) {
            resolved.id = als ?? undefined
            r.emit(event, { type: event, ...(event.startsWith('runner:') ? runnerEv : base), ...payload })
        }
        expect(Object.values(r.tests)).toHaveLength(7)
        expect(r.starts).toBe(7)
        expect(r.out).toEqual([
            'bl1 fails fast (attempt 0): failed bl1 fails fast',
            'bl2 slow 2000 (attempt 0): skipped bl2 slow 2000',
            'bl3 slow 3000 (attempt 0): skipped bl3 slow 3000',
            'bl1 fails fast (attempt 0): failed bl1 fails fast',
            'bl2 slow 2000 (attempt 0): skipped bl2 slow 2000',
            'bl3 slow 3000 (attempt 0): skipped bl3 slow 3000',
            'bl4 never runs (attempt 0): skipped bl4 never runs',
        ])
    })
})

describe('isFeatureHook', () => {
    it('is true for a hook whose suite is a feature', () => {
        const r = new Recorder()
        play(r, [
            ['suite:start', suiteEv('f', 'F', { type: 'feature' })],
            ['hook:start', hookEv('ba', 'BeforeAll', { hookKind: 'beforeAll' })],
            ['suite:start', suiteEv('sc', 'S', { type: 'scenario' })],
            ['hook:start', hookEv('b', 'Before', { hookKind: 'beforeEach' })],
        ])
        expect(r.isFeatureHook(r.hooks.ba)).toBe(true)
        expect(r.isFeatureHook(r.hooks.b)).toBe(false)
        r.emit('hook:start', { type: 'hook:start', ...hookEv('root', 'root', { parentUid: null }) })
        expect(r.isFeatureHook(r.hooks.root)).toBe(false)
    })
})
