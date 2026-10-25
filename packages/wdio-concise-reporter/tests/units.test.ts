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

describe('concise reporter hook of a feature (K26)', () => {
    const feature = (reporter: ConciseReporter, hookUid: string, title: string, after: boolean) => {
        const hook = { uid: hookUid, title, type: 'hook', cid: '0-0', parent: 'F', parentUid: 'F', hookKind: after ? 'afterAll' : 'beforeAll' }
        reporter.emit('suite:start', suite('F', 'feature', null))
        if (!after) {
            reporter.emit('hook:start', hook)
            reporter.emit('hook:end', { ...hook, error: { type: 'Error', message: `${title} fails` } })
        }
        reporter.emit('suite:start', suite('S1', 'scenario', 'F'))
        reporter.emit('test:start', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit(after ? 'test:pass' : 'test:skip', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit('test:end', { ...test('step-1', { parentUid: 'S1' }), title: 'step' })
        reporter.emit('suite:end', suite('S1', 'scenario'))
        if (after) {
            reporter.emit('hook:start', hook)
            reporter.emit('hook:end', { ...hook, error: { type: 'Error', message: `${title} fails` } })
        }
        reporter.emit('suite:end', suite('F', 'feature'))
    }

    it.each([
        ['BeforeAll', false],
        ['AfterAll', true]
    ])('counts and lists a failed Cucumber %s of the feature', (title, after) => {
        const reporter = newReporter()
        expect(() => feature(reporter, 'run-hook', title, after)).not.toThrow()
        expect(report(reporter)).toEqual([
            '❌ Test failed (1):',
            `  Fail : red ${title}`,
            `    Error : yellow ${title} fails`
        ])
    })

    it('does not count a failed hook of a Mocha suite that fails no test (no change)', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('s', 'suite', null))
        reporter.emit('test:start', test('t1'))
        reporter.emit('test:pass', test('t1'))
        reporter.emit('test:end', test('t1'))
        const hook = { uid: 'h1', title: '"after all" hook', type: 'hook', cid: '0-0', parent: 's', parentUid: 's', hookKind: 'afterAll' }
        reporter.emit('hook:start', hook)
        reporter.emit('hook:end', { ...hook, error: { type: 'Error', message: 'fails' } })
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(report(reporter)).toEqual(['✅ All went well!'])
    })
})
