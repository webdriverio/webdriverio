import { describe, expect, it, vi } from 'vitest'

import ConciseReporter from '../src/index.js'

vi.mock('chalk')

// the real base reporter: its stats, retries and tree, from the events that the frameworks send
const newReporter = () => {
    const reporter = new ConciseReporter({ writeStream: { write: vi.fn() } } as never)
    reporter.write = vi.fn()
    return reporter
}
const RUNNER = { cid: '0-0', capabilities: { browserName: 'chrome' }, specs: ['/spec.js'] }
const report = (reporter: ConciseReporter) => {
    reporter.onRunnerEnd(RUNNER as never)
    return String(vi.mocked(reporter.write).mock.calls[0][0]).split('\n').slice(2, -1)
}

const suite = (uid: string, type: string, parentUid?: string | null) => ({
    uid, title: uid, type, cid: '0-0', file: '/spec.js', ...(parentUid !== undefined && { parentUid })
})
const test = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, title: 'flaky', type: 'test', cid: '0-0', fullTitle: 'suite flaky', parentUid: 's', ...extra })
const failure = (message: string) => ({ error: { type: 'AssertionError', message } })

describe('concise reporter failure list (K27)', () => {
    // Mocha `retries`: a failed attempt ends with test:retry, the next attempt starts with a new uid
    const retryThen = (reporter: ConciseReporter, last: 'test:pass' | 'test:fail') => {
        reporter.emit('suite:start', suite('s', 'suite', null))
        reporter.emit('test:start', test('t1'))
        reporter.emit('test:retry', { ...test('t1'), ...failure('first attempt') })
        reporter.emit('test:start', test('t1-retry', { retries: 1 }))
        reporter.emit(last, { ...test('t1-retry'), ...(last === 'test:fail' && failure('last attempt')) })
        reporter.emit('test:end', test('t1-retry'))
        reporter.emit('suite:end', suite('s', 'suite'))
    }

    it('does not list the failed attempt of a test that passed on retry', () => {
        const reporter = newReporter()
        retryThen(reporter, 'test:pass')
        expect(report(reporter)).toEqual(['✅ All went well!'])
    })

    it('lists a test that failed in every attempt one time, with the error of its last attempt', () => {
        const reporter = newReporter()
        retryThen(reporter, 'test:fail')
        expect(report(reporter)).toEqual([
            '❌ Test failed (1):',
            '  Fail : red flaky',
            '    AssertionError : yellow last attempt'
        ])
    })
})

describe('concise reporter failed hooks: each one in its own part', () => {
    const hook = (uid: string, title: string, extra: Record<string, unknown> = {}) => ({ uid, title, type: 'hook', cid: '0-0', ...extra })
    const runHook = (reporter: ConciseReporter, payload: Record<string, unknown>, end: Record<string, unknown> = {}) => {
        reporter.emit('hook:start', payload)
        reporter.emit('hook:end', { ...payload, ...end })
    }
    const fails = (message: string) => ({ error: { type: 'Error', message } })
    const feature = (reporter: ConciseReporter, title: string, after: boolean) => {
        const featureHook = hook('run-hook', title, { parent: 'F', parentUid: 'F', hookKind: after ? 'afterAll' : 'beforeAll' })
        reporter.emit('suite:start', suite('F', 'feature', null))
        if (!after) {
            runHook(reporter, featureHook, fails(`${title} fails`))
        }
        reporter.emit('suite:start', suite('S1', 'scenario', 'F'))
        reporter.emit('test:start', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit(after ? 'test:pass' : 'test:skip', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit('test:end', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit('suite:end', suite('S1', 'scenario'))
        if (after) {
            runHook(reporter, featureHook, fails(`${title} fails`))
        }
        reporter.emit('suite:end', suite('F', 'feature'))
    }
    const passingSuite = (reporter: ConciseReporter, uid = 's') => {
        reporter.emit('suite:start', suite(uid, 'suite', null))
        reporter.emit('test:start', test(`${uid}-t1`, { parentUid: uid }))
        reporter.emit('test:pass', test(`${uid}-t1`, { parentUid: uid }))
        reporter.emit('test:end', test(`${uid}-t1`, { parentUid: uid }))
    }

    it('lists a failed Mocha after() when every test passed', () => {
        const reporter = newReporter()
        passingSuite(reporter)
        runHook(reporter, hook('h1', '"after all" hook for s', { parent: 's', parentUid: 's', hookKind: 'afterAll' }), fails('after fails'))
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(report(reporter)).toEqual([
            '❌ Hook failed (1):',
            '  Fail : red "after all" hook for s',
            '    Error : yellow after fails'
        ])
    })

    it('lists a failed before() that fails no test (failHookAffectedTests: false), and a failed root hook', () => {
        const reporter = newReporter()
        passingSuite(reporter)
        reporter.emit('suite:end', suite('s', 'suite'))
        reporter.emit('suite:start', suite('s2', 'suite', null))
        runHook(reporter, hook('h1', '"before all" hook for s2', { parent: 's2', parentUid: 's2', hookKind: 'beforeAll' }), fails('before fails'))
        reporter.emit('suite:end', suite('s2', 'suite'))
        runHook(reporter, hook('h2', '"after all" hook in "{root}"', { parent: '', hookKind: 'afterAll' }), fails('root fails'))
        expect(report(reporter)).toEqual([
            '❌ Hooks failed (2):',
            '  Fail : red "before all" hook for s2',
            '    Error : yellow before fails',
            '  Fail : red "after all" hook in "{root}"',
            '    Error : yellow root fails'
        ])
    })

    it.each([
        ['BeforeAll', false],
        ['AfterAll', true]
    ])('lists a failed Cucumber %s of the feature', (title, after) => {
        const reporter = newReporter()
        expect(() => feature(reporter, title, after)).not.toThrow()
        expect(report(reporter)).toEqual([
            '❌ Hook failed (1):',
            `  Fail : red ${title}`,
            `    Error : yellow ${title} fails`
        ])
    })

    it('lists the failed tests, then the failed hooks', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('s', 'suite', null))
        reporter.emit('test:start', test('t1'))
        reporter.emit('test:fail', { ...test('t1'), ...failure('test fails') })
        reporter.emit('test:end', test('t1'))
        runHook(reporter, hook('h1', '"after all" hook for s', { parent: 's', parentUid: 's', hookKind: 'afterAll' }), fails('after fails'))
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(report(reporter)).toEqual([
            '❌ Test failed (1):',
            '  Fail : red flaky',
            '    AssertionError : yellow test fails',
            '❌ Hook failed (1):',
            '  Fail : red "after all" hook for s',
            '    Error : yellow after fails'
        ])
    })

    it('does not list a hook that fails its test (Vitest failedTestUid): the test has the failure', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('s', 'suite', null))
        reporter.emit('test:start', test('t1'))
        runHook(reporter, hook('h1', 'beforeEach', { parent: 's', parentUid: 's', hookKind: 'beforeEach' }), { ...fails('hook fails'), failedTestUid: 't1' })
        reporter.emit('test:fail', { ...test('t1'), ...failure('hook fails') })
        reporter.emit('test:end', test('t1'))
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(report(reporter)).toEqual([
            '❌ Test failed (1):',
            '  Fail : red flaky',
            '    AssertionError : yellow hook fails'
        ])
    })

    it('does not list a failed hook of an attempt that runs again (retried)', () => {
        const reporter = newReporter()
        passingSuite(reporter)
        runHook(reporter, hook('h1', 'After', { parent: 's', parentUid: 's', hookKind: 'afterEach' }), { ...fails('first attempt'), retried: true })
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(report(reporter)).toEqual(['✅ All went well!'])
    })
})
