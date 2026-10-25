import { describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

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
    return getResults(outputDir).results as { name: string, status: string }[]
}

describe('Vitest retry: the failed hook of a retried attempt', () => {
    for (const mode of ['sequential', 'concurrent'] as const) {
        it(`afterEach (${mode}): no extra result for the hook`, async () => {
            const results = await play(mode, 'afterEach')
            expect(results.map(({ name }) => name)).toEqual(['passes on retry', 'passes on retry'])
            expect(results.map(({ status }) => status).sort()).toEqual(['broken', 'passed'])
        })

        it(`beforeEach (${mode}): the hook stays in its attempt`, async () => {
            const results = await play(mode, 'beforeEach')
            expect(results.map(({ name }) => name)).toEqual(['passes on retry', 'passes on retry'])
            expect(results.map(({ status }) => status).sort()).toEqual(['broken', 'passed'])
        })
    }
})
