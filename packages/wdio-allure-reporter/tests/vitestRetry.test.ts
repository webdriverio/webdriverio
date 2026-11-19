import { describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

const afterFixtures = (outputDir: string) => (getResults(outputDir).containers as { afters?: { name: string, status: string }[] }[])
    .flatMap(({ afters = [] }) => afters.map(({ name, status }) => `${name}=${status}`))

// the shared mock replaces the base class, but the hook stats and the lane key come from the real one
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

const CID = '0-0'
const SPEC = '/tmp/user/retry.spec.ts'
const error = { name: 'Error', message: 'fails on attempt 0', stack: 'Error: fails on attempt 0\n    at hook' }

type Kind = 'beforeEach' | 'afterEach'
type Mode = 'sequential' | 'concurrent'

/**
 * The events of `@wdio/vitest-framework` (onTestCaseResult) for a test whose hook fails on
 * attempt 0 only: the hooks of the retried attempt have `retried: true`
 */
async function play(mode: Mode, kind: Kind) {
    const outputDir = temporaryDirectory()
    const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
    let current: string | undefined
    reporter.setContextIdResolver(() => current)
    const contextId = mode === 'concurrent' ? 'vitest-test-1' : undefined
    const base = { cid: CID, specs: [SPEC], file: SPEC, parent: 'retry', parentUid: 'suite-0-0-0', ...(contextId && { contextId }) }
    const test = (uid: string) => ({ ...base, uid, title: 'passes on retry', fullTitle: 'retry passes on retry' })
    const hook = (uid: string, extra: Record<string, unknown> = {}) => ({
        ...base, uid, title: `"${kind === 'beforeEach' ? 'before each' : 'after each'}" hook for "passes on retry"`,
        fullTitle: 'retry "after each" hook for "passes on retry"', ...extra
    })
    const emit = (event: string, payload: Record<string, unknown>) => {
        current = contextId
        try {
            reporter.emit(event, { type: event, ...payload })
        } finally {
            current = undefined
        }
    }
    const failedHook = (uid: string) => {
        emit('hook:start', hook(uid, { retried: true }))
        emit('hook:end', hook(uid, { retried: true, state: 'fail', error }))
    }

    reporter.emit('runner:start', {
        cid: CID, specs: [SPEC], capabilities: { browserName: 'chrome' }, config: { framework: 'vitest' },
        isMultiRemote: false, sessionId: 'session', instanceOptions: {}, retry: 0
    })
    reporter.emit('suite:start', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
    emit('test:start', test('test-0-0-0'))
    if (kind === 'beforeEach') {
        failedHook('test-0-0-0-beforeEach')
    }
    emit('test:retry', { ...test('test-0-0-0'), error })
    if (kind === 'afterEach') {
        failedHook('test-0-0-0-afterEach')
    }
    emit('test:start', { ...test('test-0-0-0-retry-1'), retries: 1 })
    emit('test:pass', { ...test('test-0-0-0-retry-1'), passed: true })
    emit('test:end', { ...test('test-0-0-0-retry-1'), passed: true })
    if (contextId) {
        reporter.emit('context:end', { type: 'context:end', cid: CID, uid: 'test-0-0-0-retry-1', contextId })
    }
    reporter.emit('suite:end', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
    reporter.emit('runner:end', { cid: CID, failures: 0, retries: 0 })
    await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
    return Object.assign(getResults(outputDir).results as { name: string, status: string }[], { outputDir })
}

describe('Vitest retry: the failed hook of a retried attempt', () => {
    for (const mode of ['sequential', 'concurrent'] as const) {
        it(`afterEach (${mode}): no extra result for the hook`, async () => {
            const results = await play(mode, 'afterEach')
            expect(results.map(({ name }) => name)).toEqual(['passes on retry', 'passes on retry'])
            expect(results.map(({ status }) => status).sort()).toEqual(['broken', 'passed'])
        })

        it(`afterEach (${mode}): keeps the hook as a broken teardown fixture`, async () => {
            const { outputDir } = await play(mode, 'afterEach')
            expect(afterFixtures(outputDir)).toContain('"after each" hook for "passes on retry"=broken')
        })

        it(`beforeEach (${mode}): the hook stays in its attempt`, async () => {
            const results = await play(mode, 'beforeEach')
            expect(results.map(({ name }) => name)).toEqual(['passes on retry', 'passes on retry'])
            expect(results.map(({ status }) => status).sort()).toEqual(['broken', 'passed'])
        })
    }
})

describe('Vitest: a failed afterEach that is the failure of its test', () => {
    for (const mode of ['sequential', 'concurrent'] as const) {
        it(`${mode}: one result for the test, no extra result for the hook`, async () => {
            const outputDir = temporaryDirectory()
            const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
            let current: string | undefined
            reporter.setContextIdResolver(() => current)
            const contextId = mode === 'concurrent' ? 'vitest-test-1' : undefined
            const base = { cid: CID, specs: [SPEC], file: SPEC, parent: 'retry', parentUid: 'suite-0-0-0', ...(contextId && { contextId }) }
            const test = { ...base, uid: 'test-0-0-0', title: 'fails in afterEach', fullTitle: 'retry fails in afterEach' }
            const hook = { ...base, uid: 'test-0-0-0-afterEach', title: '"after each" hook for "fails in afterEach"', fullTitle: 'retry "after each" hook for "fails in afterEach"', failedTestUid: 'test-0-0-0' }
            const emit = (event: string, payload: Record<string, unknown>) => {
                current = contextId
                try {
                    reporter.emit(event, { type: event, ...payload })
                } finally {
                    current = undefined
                }
            }
            reporter.emit('runner:start', {
                cid: CID, specs: [SPEC], capabilities: { browserName: 'chrome' }, config: { framework: 'vitest' },
                isMultiRemote: false, sessionId: 'session', instanceOptions: {}, retry: 0
            })
            reporter.emit('suite:start', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
            emit('test:start', test)
            emit('test:fail', { ...test, error })
            emit('test:end', test)
            emit('hook:start', hook)
            emit('hook:end', { ...hook, state: 'fail', error })
            if (contextId) {
                reporter.emit('context:end', { type: 'context:end', cid: CID, uid: test.uid, contextId })
            }
            reporter.emit('suite:end', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
            reporter.emit('runner:end', { cid: CID, failures: 1, retries: 0 })
            await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
            const results = getResults(outputDir).results as { name: string, status: string }[]
            expect(results.map(({ name, status }) => `${name}=${status}`)).toEqual(['fails in afterEach=broken'])
            expect(afterFixtures(outputDir)).toEqual(['"after each" hook for "fails in afterEach"=broken'])
        })
    }
})

// onHookStart skips this hook, so onHookEnd must skip it too, also when another hook is open
it('does not close another open hook with a hook that its test owns', async () => {
    const outputDir = temporaryDirectory()
    const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
    const base = { cid: CID, specs: [SPEC], file: SPEC, parent: 'retry', parentUid: 'suite-0-0-0' }
    const owned = { ...base, uid: 'test-0-0-0-afterEach', title: '"after each" hook for "t"', fullTitle: 'retry "after each" hook for "t"', failedTestUid: 'test-0-0-0' }
    const other = { ...base, uid: 'hook-other', title: '"after all" hook for retry', fullTitle: 'retry "after all" hook' }
    reporter.emit('runner:start', {
        cid: CID, specs: [SPEC], capabilities: { browserName: 'chrome' }, config: { framework: 'vitest' },
        isMultiRemote: false, sessionId: 'session', instanceOptions: {}, retry: 0
    })
    reporter.emit('suite:start', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
    reporter.emit('hook:start', { type: 'hook:start', ...other })
    reporter.emit('hook:start', { type: 'hook:start', ...owned })
    reporter.emit('hook:end', { type: 'hook:end', ...owned, state: 'fail', error })
    reporter.emit('hook:end', { type: 'hook:end', ...other, state: 'pass' })
    reporter.emit('suite:end', { cid: CID, specs: [SPEC], file: SPEC, uid: 'suite-0-0-0', title: 'retry', fullTitle: 'retry', parent: '', parentUid: null })
    reporter.emit('runner:end', { cid: CID, failures: 0, retries: 0 })
    await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
    const results = getResults(outputDir).results as { name: string, status: string }[]
    expect(results.map(({ name, status }) => `${name}=${status}`)).toEqual([])
})

describe('Vitest: skipped tests reported before nested suite:end after a failed beforeAll', () => {
    for (const mode of ['sequential', 'concurrent'] as const) {
        it(`${mode}: gives an outer skipped test its own suite titlePath and suite labels`, async () => {
            const outputDir = temporaryDirectory()
            const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
            let current: string | undefined
            reporter.setContextIdResolver(() => current)
            const emit = (event: string, payload: Record<string, unknown>, contextId?: string) => {
                current = mode === 'concurrent' ? contextId : undefined
                try {
                    reporter.emit(event, { type: event, cid: CID, specs: [SPEC], file: SPEC, ...payload })
                } finally {
                    current = undefined
                }
            }
            const ctx = (id: string) => (mode === 'concurrent' ? { contextId: id } : {})

            emit('runner:start', {
                capabilities: { browserName: 'chrome' }, config: { framework: 'vitest' },
                isMultiRemote: false, sessionId: 'session', instanceOptions: {}, retry: 0
            })
            emit('suite:start', { uid: 'suite-0-0-0', title: 'Suite', fullTitle: 'Suite', parent: '', parentUid: null })
            emit('suite:start', { uid: 'suite-0-0-1', title: 'Nested', fullTitle: 'Suite Nested', parent: 'Suite', parentUid: 'suite-0-0-0' })

            const innerSkipped = {
                uid: 'test-0-0-0', title: 'inner test', fullTitle: 'Suite Nested inner test',
                parent: 'Nested', parentUid: 'suite-0-0-1', ...ctx('vitest-inner')
            }
            emit('test:start', innerSkipped, 'vitest-inner')
            emit('test:pending', { ...innerSkipped, pending: true, duration: 0 }, 'vitest-inner')
            emit('test:end', { ...innerSkipped, pending: true, passed: false, duration: 0 }, 'vitest-inner')
            if (mode === 'concurrent') {
                emit('context:end', { uid: innerSkipped.uid, contextId: 'vitest-inner' })
            }

            // Vitest reports the skipped test of the outer suite before emitting suite:end for Nested
            const outerSkipped = {
                uid: 'test-0-0-1', title: 'outer test', fullTitle: 'Suite outer test',
                parent: 'Suite', parentUid: 'suite-0-0-0', ...ctx('vitest-outer')
            }
            emit('test:start', outerSkipped, 'vitest-outer')
            emit('test:pending', { ...outerSkipped, pending: true, duration: 0 }, 'vitest-outer')
            emit('test:end', { ...outerSkipped, pending: true, passed: false, duration: 0 }, 'vitest-outer')
            if (mode === 'concurrent') {
                emit('context:end', { uid: outerSkipped.uid, contextId: 'vitest-outer' })
            }

            // Also verify a skipped test reported via test:pending without a prior test:start
            const directSkipped = {
                uid: 'test-0-0-2', title: 'direct skipped test', fullTitle: 'Suite direct skipped test',
                parent: 'Suite', parentUid: 'suite-0-0-0', ...ctx('vitest-direct')
            }
            emit('test:pending', { ...directSkipped, pending: true, duration: 0 }, 'vitest-direct')
            emit('test:end', { ...directSkipped, pending: true, passed: false, duration: 0 }, 'vitest-direct')
            if (mode === 'concurrent') {
                emit('context:end', { uid: directSkipped.uid, contextId: 'vitest-direct' })
            }

            emit('suite:end', { uid: 'suite-0-0-1', title: 'Nested', fullTitle: 'Suite Nested', parent: 'Suite', parentUid: 'suite-0-0-0' })
            emit('suite:end', { uid: 'suite-0-0-0', title: 'Suite', fullTitle: 'Suite', parent: '', parentUid: null })
            emit('runner:end', { failures: 1, retries: 0 })
            await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))

            const results = getResults(outputDir).results as {
                name: string
                status: string
                titlePath: string[]
                labels: { name: string, value: string }[]
            }[]
            const inner = results.find((r) => r.name === 'inner test')!
            const outer = results.find((r) => r.name === 'outer test')!
            const direct = results.find((r) => r.name === 'direct skipped test')!
            const suiteLabelsOf = (r: typeof outer) => r.labels
                .filter((l) => l.name === 'parentSuite' || l.name === 'suite' || l.name === 'subSuite')
                .map((l) => `${l.name}=${l.value}`)

            expect(inner.status).toBe('skipped')
            expect(inner.titlePath.slice(-2)).toEqual(['Suite', 'Nested'])
            expect(suiteLabelsOf(inner)).toEqual(['parentSuite=Suite', 'suite=Nested'])

            expect(outer.status).toBe('skipped')
            expect(outer.titlePath.slice(-2)).not.toEqual(['Suite', 'Nested'])
            expect(outer.titlePath.at(-1)).toBe('Suite')
            expect(suiteLabelsOf(outer)).toEqual(['parentSuite=Suite'])

            expect(direct.status).toBe('skipped')
            expect(direct.titlePath.slice(-2)).not.toEqual(['Suite', 'Nested'])
            expect(direct.titlePath.at(-1)).toBe('Suite')
        })
    }
})

