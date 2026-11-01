import { describe, expect, it, vi } from 'vitest'

import JSONReporter from '../src/index.js'

vi.mock('node:fs', () => ({
    default: {
        mkdirSync: vi.fn(),
        createWriteStream: vi.fn()
    }
}))

describe('JSONReporter', () => {
    it('should create a report', async () => {
        const reporter = new JSONReporter({
            logFile: '/foo/bar.log',
            stdout: true
        })
        expect(reporter.options.logFile).toBe('/foo/bar.json')
    })

    it('should prepare json', () => {
        const reporter = new JSONReporter({ stdout: true })
        reporter.write = vi.fn()
        reporter.suites = {
            '0-0': {
                title: 'foo',
                fullTitle: 'foo',
                state: 'passed',
                duration: 1,
                hooks: [{
                    title: 'before each',
                    fullTitle: 'foo "before each"',
                    state: 'failed',
                    errors: [new Error('ups')],
                    duration: 1
                }],
                tests: [{
                    title: 'foo',
                    fullTitle: 'foo',
                    state: 'passed',
                    duration: 1
                }],
            } as any,
            '0-1': {
                title: 'bar',
                fullTitle: 'bar',
                state: 'failed',
                duration: 2,
                error: new Error('ahh'),
                hooks: [{
                    title: 'before each',
                    fullTitle: 'foo "before each"',
                    state: 'passed',
                    duration: 1
                }],
                tests: [{
                    title: 'bar',
                    fullTitle: 'bar',
                    state: 'failed',
                    duration: 2,
                    error: new Error('ahh')
                }],
            } as any
        }
        reporter.onRunnerEnd({
            start: 0,
            end: 1,
            capabilities: {},
            config: {
                framework: 'mocha',
                mochaOpts: {}
            },
            specs: ['foo.js', 'bar.js']
        } as any)
        expect(vi.mocked(reporter.write).mock.calls).toMatchSnapshot()
    })

    it('writes each suite and count once for grouped specs', () => {
        const reporter = new JSONReporter({ stdout: true })
        reporter.write = vi.fn()
        reporter.suites = {
            '0-0': {
                title: 'suite A',
                fullTitle: 'suite A',
                state: 'passed',
                duration: 1,
                hooks: [],
                tests: [{ title: 'a passes', fullTitle: 'suite A a passes', state: 'passed', duration: 1 }],
            } as any,
            '0-1': {
                title: 'suite B',
                fullTitle: 'suite B',
                state: 'failed',
                duration: 1,
                hooks: [],
                tests: [{ title: 'b fails', fullTitle: 'suite B b fails', state: 'failed', duration: 1 }],
            } as any
        }
        // Two spec files run in one worker: the reporter must not write the
        // worker's suites once per spec.
        reporter.onRunnerEnd({
            start: 0,
            end: 1,
            capabilities: {},
            config: { framework: 'mocha', mochaOpts: {} },
            specs: ['a.spec.js', 'b.spec.js']
        } as any)

        const report = JSON.parse(vi.mocked(reporter.write).mock.calls[0][0] as string)
        expect(report.specs).toEqual(['a.spec.js', 'b.spec.js'])
        expect(report.suites.map((suite: any) => suite.name)).toEqual(['suite A', 'suite B'])
        expect(report.state).toEqual({ passed: 1, failed: 1, skipped: 0 })
    })

    describe('retried attempts', () => {
        const runner = { cid: '0-0', specs: ['/a.spec.ts'], config: { framework: 'vitest' }, capabilities: {}, sessionId: 's' }
        const suite = { type: 'suite', cid: '0-0', uid: 'suite-1', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null }
        const test = (uid: string) => ({ type: 'test', cid: '0-0', uid, title: 'passes on retry', fullTitle: 'retry passes on retry', parent: 'retry', parentUid: 'suite-1' })
        const hook = (uid: string, kind: string) => ({ type: 'hook', cid: '0-0', uid, title: `"${kind}" hook for "passes on retry"`, parent: 'retry', parentUid: 'suite-1' })
        const error = { message: 'fails on attempt 0' }

        const output = (events: [string, object][]) => {
            const reporter = new JSONReporter({ stdout: true })
            reporter.write = vi.fn()
            reporter.emit('runner:start', runner)
            reporter.emit('suite:start', suite)
            for (const [event, payload] of events) {
                reporter.emit(event, payload)
            }
            reporter.emit('suite:end', suite)
            reporter.emit('runner:end', { cid: '0-0', failures: 0, retries: 0 })
            return JSON.parse(vi.mocked(reporter.write).mock.calls[0][0] as string)
        }
        const run = (events: [string, object][]) => output(events).state

        // the order of the Vitest bridge (`@wdio/vitest-framework` onTestCaseResult)
        it('does not count the failed afterEach of a retried Vitest attempt', () => {
            expect(run([
                ['test:start', test('t1')],
                ['test:retry', { ...test('t1'), error }],
                ['hook:start', { ...hook('t1-afterEach', 'after each'), retried: true }],
                ['hook:end', { ...hook('t1-afterEach', 'after each'), retried: true, state: 'fail', error }],
                ['test:start', { ...test('t1-retry-1'), retries: 1 }],
                ['test:pass', test('t1-retry-1')],
                ['test:end', test('t1-retry-1')],
            ])).toEqual({ passed: 1, failed: 0, skipped: 0 })
        })

        it('does not count the failed beforeEach of a retried Vitest attempt', () => {
            expect(run([
                ['test:start', test('t1')],
                ['hook:start', { ...hook('t1-beforeEach', 'before each'), retried: true }],
                ['hook:end', { ...hook('t1-beforeEach', 'before each'), retried: true, state: 'fail', error }],
                ['test:retry', { ...test('t1'), error }],
                ['test:start', { ...test('t1-retry-1'), retries: 1 }],
                ['test:pass', test('t1-retry-1')],
                ['test:end', test('t1-retry-1')],
            ])).toEqual({ passed: 1, failed: 0, skipped: 0 })
        })

        // Vitest fails the test with the error of its afterEach, then sends the hook with failedTestUid
        it('does not count a failed Vitest afterEach that is the failure of its test', () => {
            expect(run([
                ['test:start', test('t1')],
                ['test:fail', { ...test('t1'), error }],
                ['test:end', test('t1')],
                ['hook:start', { ...hook('t1-afterEach', 'after each'), failedTestUid: 't1' }],
                ['hook:end', { ...hook('t1-afterEach', 'after each'), failedTestUid: 't1', state: 'fail', error }],
            ])).toEqual({ passed: 0, failed: 1, skipped: 0 })
        })

        it('marks the retried attempt and the hook that its test owns', () => {
            const { suites } = output([
                ['test:start', test('t1')],
                ['test:retry', { ...test('t1'), error }],
                ['hook:start', { ...hook('t1-afterEach', 'after each'), retried: true, failedTestUid: 't1' }],
                ['hook:end', { ...hook('t1-afterEach', 'after each'), retried: true, failedTestUid: 't1', state: 'fail', error }],
                ['test:start', { ...test('t1-retry-1'), retries: 1 }],
                ['test:pass', test('t1-retry-1')],
                ['test:end', test('t1-retry-1')],
            ])
            expect(suites[0].tests.map(({ state, retried }: { state: string, retried?: boolean }) => [state, retried])).toEqual([['failed', true], ['passed', undefined]])
            expect(suites[0].hooks.map(({ retried, failedTestUid }: { retried?: boolean, failedTestUid?: string }) => [retried, failedTestUid])).toEqual([[true, 't1']])
        })

        // Mocha `retries`: the next attempt starts with the same uid
        it('does not count a failed attempt that is retried', () => {
            expect(run([
                ['test:start', test('t1')],
                ['test:retry', { ...test('t1'), error }],
                ['test:start', { ...test('t1'), retries: 1 }],
                ['test:pass', test('t1')],
                ['test:end', test('t1')],
            ])).toEqual({ passed: 1, failed: 0, skipped: 0 })
        })

        it('counts only the failure of the last attempt', () => {
            expect(run([
                ['test:start', test('t1')],
                ['test:retry', { ...test('t1'), error }],
                ['hook:start', { ...hook('t1-afterEach', 'after each'), retried: true }],
                ['hook:end', { ...hook('t1-afterEach', 'after each'), retried: true, state: 'fail', error }],
                ['test:start', { ...test('t1-retry-1'), retries: 1 }],
                ['test:fail', { ...test('t1-retry-1'), error }],
                ['test:end', test('t1-retry-1')],
                ['hook:start', { ...hook('t1-retry-1-afterEach', 'after each'), failedTestUid: 't1-retry-1' }],
                ['hook:end', { ...hook('t1-retry-1-afterEach', 'after each'), failedTestUid: 't1-retry-1', state: 'fail', error }],
            ])).toEqual({ passed: 0, failed: 1, skipped: 0 })
        })
    })
})
