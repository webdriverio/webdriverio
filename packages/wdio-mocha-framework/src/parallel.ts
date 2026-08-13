/**
 * Parallel test execution for the Mocha framework adapter.
 *
 * When `mochaOpts.parallelMode: 'contexts'` is set, this module
 * replaces the sequential `mocha.run()` with parallel execution:
 *   1. Walk the Mocha suite tree to collect all it() blocks
 *   2. Pre-create a browsing context (tab) for each test
 *   3. Run all tests simultaneously via Promise.allSettled()
 *   4. Each test runs inside an AsyncLocalStorage scope that
 *      overrides ContextManager.getCurrentContext() → every
 *      command (url, $, click, setValue, getText, etc.) targets
 *      the correct context with zero Proxy or special-casing.
 *
 * @module parallel
 */

import os from 'node:os'
import type { AsyncLocalStorage } from 'node:async_hooks'
import type { Suite } from 'mocha'
import logger from '@wdio/logger'
import type { EventEmitter } from 'node:events'

const log = logger('@wdio/mocha-framework:parallel')

/**
 * Bidi-aware browser subset.  These members are added at runtime by the
 * webdriverio package and are NOT declared on the minimal Browser stub
 * in @wdio/types.  The mocha-framework adapter does not import from
 * webdriverio (to avoid a circular dependency), so we declare the shape
 * we need here.
 */
interface ParallelBrowser extends WebdriverIO.Browser {
    isBidi: boolean
    __parallelContextStore?: AsyncLocalStorage<string>
    /** Set of framework-managed parallel contexts (see session/context.ts). */
    __parallelContexts?: Set<string>
    browsingContextCreate?(params: { type: string }): Promise<{ context: string }>
    browsingContextClose?(params: { context: string }): Promise<void>
}

interface CollectedTest {
    title: string
    fullTitle: string
    fn: Function
    parentTitle: string
    _beforeEach: Function[]
    _afterEach: Function[]
    /** ancestry-merged suite before() hooks, outermost-first */
    _beforeAll: Function[]
    /** ancestry-merged suite after() hooks, innermost-first */
    _afterAll: Function[]
    /** static skip (it.skip / it without fn) */
    pending?: boolean
    file: string | undefined
}

interface CollectedSuite {
    title: string
    fullTitle: string
    file: string | undefined
    /** index into the suites array for reverse-order suite:end emission */
    depth: number
}

// ============================================================
// Suite tree walker — collects everything in a single pass
// ============================================================

interface SuiteCollection {
    tests: CollectedTest[]
    suites: CollectedSuite[]
}

/**
 * Walk the Mocha suite tree once, collecting tests (with inherited hooks,
 * including ancestry-merged suite before()/after() chains) and nested suite
 * metadata for reporter events.
 */
function collectAll(suite: Suite): SuiteCollection {
    const tests: CollectedTest[] = []
    const suites: CollectedSuite[] = []
    let nextDepth = 0

    const walk = (
        s: Suite,
        parentBeforeEach: Function[],
        parentAfterEach: Function[],
        parentBeforeAll: Function[],
        parentAfterAll: Function[],
        depth: number
    ) => {
        const ownBeforeEach = (s as unknown as { _beforeEach?: Function[] })._beforeEach || []
        const ownAfterEach = (s as unknown as { _afterEach?: Function[] })._afterEach || []
        const ownBeforeAll = (s as unknown as { _beforeAll?: Function[] })._beforeAll || []
        const ownAfterAll = (s as unknown as { _afterAll?: Function[] })._afterAll || []

        const mergedBeforeEach = [...parentBeforeEach, ...ownBeforeEach]
        const mergedAfterEach = [...ownAfterEach, ...parentAfterEach]
        // Suite hooks run per test in parallel mode; order matches Mocha:
        // beforeAll outermost-first, afterAll innermost-first (same merge
        // shape as beforeEach/afterEach — no reversal within a suite).
        const mergedBeforeAll = [...parentBeforeAll, ...ownBeforeAll]
        const mergedAfterAll = [...ownAfterAll, ...parentAfterAll]

        // Tests at this level
        for (const test of s.tests) {
            const fn = (test as unknown as { fn?: Function }).fn
            tests.push({
                title: test.title,
                fullTitle: test.fullTitle(),
                fn: fn || (() => {}),
                parentTitle: s.title,
                _beforeEach: mergedBeforeEach,
                _afterEach: mergedAfterEach,
                _beforeAll: mergedBeforeAll,
                _afterAll: mergedAfterAll,
                pending: !!test.pending || !fn,
                file: test.file || undefined
            })
        }

        // Suite metadata (skip root)
        if (depth > 0) {
            suites.push({
                title: s.title,
                fullTitle: typeof s.fullTitle === 'function' ? s.fullTitle() : s.title,
                file: (s as unknown as { file?: string }).file,
                depth: nextDepth++
            })
        }

        // Recurse into children
        for (const child of s.suites) {
            walk(child, mergedBeforeEach, mergedAfterEach, mergedBeforeAll, mergedAfterAll, depth + 1)
        }
    }

    walk(suite, [], [], [], [], 0)

    return {
        tests,
        suites
    }
}

/**
 * Recursively walk the Mocha suite tree and collect all test
 * definitions with their associated hooks.  Kept as a public
 * export for tests; delegates to the single-pass {@link collectAll}.
 */
export function collectTests(
    suite: Suite,
    _parentBeforeEach: Function[] = [],
    _parentAfterEach: Function[] = []
): CollectedTest[] {
    return collectAll(suite).tests
}

// ============================================================
// Reporter event emission
// ============================================================

interface TestMessage {
    type: string
    cid: string
    specs: string[]
    uid: string
    title: string
    fullTitle: string
    parent: string
    file: string
    duration?: number
    passed?: boolean
    error?: { name: string; message: string; stack?: string }
}

function baseMessage(type: string, test: CollectedTest, cid: string, specs: string[], uid: string) {
    return {
        type, cid, specs, uid,
        title: test.title,
        fullTitle: test.fullTitle,
        parent: test.parentTitle,
        file: test.file || specs[0]
    } satisfies TestMessage
}

function emitTestStart(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string) {
    reporter.emit('test:start', baseMessage('test:start', test, cid, specs, uid))
}

function emitTestPass(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string, duration: number) {
    reporter.emit('test:pass', { ...baseMessage('test:pass', test, cid, specs, uid), duration, passed: true })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid), duration, passed: true })
}

function emitTestFail(
    reporter: EventEmitter,
    test: CollectedTest,
    cid: string,
    specs: string[],
    uid: string,
    duration: number,
    error: Error
) {
    const errorPayload = {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
    }
    reporter.emit('test:fail', { ...baseMessage('test:fail', test, cid, specs, uid), duration, error: errorPayload })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid), duration, passed: false, error: errorPayload })
}

type HookKind = 'before all' | 'after all' | 'before each' | 'after each'

function emitTestPending(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string, duration: number) {
    reporter.emit('test:pending', { ...baseMessage('test:pending', test, cid, specs, uid), duration, pending: true })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid), duration, passed: false, pending: true })
}

function hookBaseMessage(type: string, kind: HookKind, test: CollectedTest, cid: string, specs: string[], uid: string) {
    return {
        type, cid, specs, uid,
        // matches the sequential formatMessage hook-title rewrite (common.ts)
        title: `${kind} hook for "${test.parentTitle}"`,
        fullTitle: `${test.parentTitle}.${kind} hook`,
        parent: test.parentTitle,
        file: test.file || specs[0]
    } satisfies TestMessage
}

function emitHookStart(reporter: EventEmitter, kind: HookKind, test: CollectedTest, cid: string, specs: string[], uid: string) {
    reporter.emit('hook:start', hookBaseMessage('hook:start', kind, test, cid, specs, uid))
}

function emitHookEnd(
    reporter: EventEmitter,
    kind: HookKind,
    test: CollectedTest,
    cid: string,
    specs: string[],
    uid: string,
    duration: number,
    error?: Error
) {
    const errorPayload = error ? {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
    } : undefined
    reporter.emit('hook:end', {
        ...hookBaseMessage('hook:end', kind, test, cid, specs, uid),
        duration,
        state: error ? 'fail' : 'pass',
        ...(errorPayload ? { error: errorPayload } : {})
    })
}

function emitSuiteStart(reporter: EventEmitter, suite: CollectedSuite, cid: string, specs: string[], uid: string) {
    reporter.emit('suite:start', {
        type: 'suite:start',
        cid,
        specs,
        uid,
        title: suite.title,
        fullTitle: suite.fullTitle,
        parent: '',
        file: suite.file || specs[0]
    })
}

function emitSuiteEnd(reporter: EventEmitter, suite: CollectedSuite, cid: string, specs: string[], uid: string) {
    reporter.emit('suite:end', {
        type: 'suite:end',
        cid,
        specs,
        uid,
        title: suite.title,
        fullTitle: suite.fullTitle,
        parent: '',
        file: suite.file || specs[0]
    })
}

/**
 * Skip errors thrown by `this.skip()` must surface as pending, not failures.
 * Mirrors the sequential skip-error detection (common.ts).
 */
const SKIP_ERROR_RE = /^(sync|async) skip; aborting execution$/
export function isSkipError(err?: unknown): boolean {
    return err instanceof Error && (
        SKIP_ERROR_RE.test(err.message) || /marked Pending/.test(err.message)
    )
}

/**
 * Call a Mocha hook or test function (which may be a plain Function in tests
 * or a Mocha Runnable instance at runtime). Mocha Runnable instances store the
 * actual function under `.fn`.
 *
 * The WDIO mocha adapter wraps test/hook functions with WDIO hooks via
 * `wrapGlobalTestMethod`. Those wrappers expect `this` to be a Mocha Context
 * with `this.test` set. Provide a minimal context so they don't crash on
 * `this.test` access, plus explicit `skip()` support and loud failures for
 * Mocha APIs that parallel mode cannot honor (`this.timeout`/`this.retries`).
 *
 * `done`-style functions only work for raw fns: the WDIO wrapper strips
 * function arguments before the user fn runs (filterSpecArgs) — the same
 * limitation sequential mode has.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callHook(hook: any, testTitle?: string, parentTitle?: string): Promise<unknown> {
    const fn: Function = typeof hook.fn === 'function' ? hook.fn : hook
    const ctx = {
        test: testTitle ? { title: testTitle, parent: { title: parentTitle || '' } } : undefined,
        skip: () => { throw new Error('sync skip; aborting execution') },
        timeout: () => { throw new Error('this.timeout() is not supported in parallel mode (parallelMode: "contexts")') },
        retries: () => { throw new Error('this.retries() is not supported in parallel mode (parallelMode: "contexts")') },
    }
    if (fn.length >= 1) {
        return Promise.resolve(fn.call(ctx, (err?: Error) => {
            throw err || new Error('done() callback is not supported in parallel mode (parallelMode: "contexts")')
        }))
    }
    return Promise.resolve(fn.call(ctx))
}

// ============================================================
// Context pre-allocation
// ============================================================

async function preallocateContexts(
    browser: WebdriverIO.Browser,
    count: number
): Promise<string[]> {
    const bidi = browser as ParallelBrowser
    const results = await Promise.allSettled(
        Array.from({ length: count }, () =>
            bidi.browsingContextCreate!({ type: 'tab' })
        )
    )
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
        // Close any successfully-created contexts before throwing
        const created = results
            .filter((r): r is PromiseFulfilledResult<{ context: string }> => r.status === 'fulfilled')
            .map((r) => r.value.context)
        await Promise.allSettled(
            created.map((ctx) => bidi.browsingContextClose!({ context: ctx }).catch(
                (err) => { log.warn(`[Parallel] preallocate rollback: failed to close context ${ctx}: ${(err as Error).message}`) }
            ))
        )
        throw (failed[0] as PromiseRejectedResult).reason
    }
    const contexts = (results as PromiseFulfilledResult<{ context: string }>[]).map((r) => r.value.context)
    // Register with the session ContextManager so navigations inside these
    // tabs don't trigger session-global re-anchoring (tree fetch + switchToWindow).
    for (const ctx of contexts) {
        bidi.__parallelContexts?.add(ctx)
    }
    return contexts
}

interface TestRunResult {
    status: 'passed' | 'failed' | 'pending'
    name: string
    duration: number
    error?: string
}

// ============================================================
// Per-test execution
// ============================================================

async function runOneTest(
    test: CollectedTest,
    contextId: string,
    cid: string,
    specs: string[],
    uid: string,
    reporter: EventEmitter,
    parallelStore: AsyncLocalStorage<string>,
    bidi: ParallelBrowser
): Promise<TestRunResult> {
    return parallelStore.run(contextId, async () => {
        // Static pending tests (it.skip / it without fn): no hooks, no
        // test:start — matches the Mocha runner.
        if (test.pending) {
            emitTestPending(reporter, test, cid, specs, uid, 0)
            return { status: 'pending' as const, name: test.title, duration: 0 }
        }

        let hookCnt = 0
        let caughtError: Error | undefined
        let started = false
        let fnDuration = 0
        let passed = false

        /**
         * Run a hook chain, emitting hook:start/hook:end with per-hook
         * durations and paired uids. Fatal chains (beforeAll/beforeEach)
         * stop on the first failure; non-fatal chains (afterEach/afterAll)
         * log and continue — Mocha does not fail the test on teardown errors.
         */
        const runHookChain = async (hooks: Function[], kind: HookKind, fatal: boolean) => {
            for (const hook of hooks) {
                const hookUid = `hook-${uid}-${hookCnt++}`
                emitHookStart(reporter, kind, test, cid, specs, hookUid)
                const hookStart = Date.now()
                try {
                    await callHook(hook, test.title, test.parentTitle)
                    emitHookEnd(reporter, kind, test, cid, specs, hookUid, Date.now() - hookStart)
                } catch (err) {
                    const hookError = err instanceof Error ? err : new Error(String(err))
                    emitHookEnd(reporter, kind, test, cid, specs, hookUid, Date.now() - hookStart, hookError)
                    if (fatal) {
                        caughtError = hookError
                        break
                    }
                    log.warn(`[Parallel] ${kind} hook failed for "${test.title}": ${hookError.message}`)
                }
            }
        }

        // Suite hooks run once per test, inside this test's browsing context
        // (see the warning in runParallelTests). beforeAll failure skips the
        // test but afterAll still runs — Mocha parity.
        await runHookChain(test._beforeAll, 'before all', true)
        if (!caughtError) {
            started = true
            emitTestStart(reporter, test, cid, specs, uid)
            await runHookChain(test._beforeEach, 'before each', true)
            if (!caughtError) {
                const fnStart = Date.now()
                try {
                    await callHook(test.fn, test.title, test.parentTitle)
                    passed = true
                } catch (err) {
                    caughtError = err instanceof Error ? err : new Error(String(err))
                } finally {
                    // Reported duration excludes hook time — Mocha parity
                    fnDuration = Date.now() - fnStart
                }
            }
            await runHookChain(test._afterEach, 'after each', false)
        }
        await runHookChain(test._afterAll, 'after all', false)

        if (!started) {
            // this.skip() in a suite before() hook → pending, not failed (Mocha parity)
            if (isSkipError(caughtError)) {
                emitTestPending(reporter, test, cid, specs, uid, 0)
                return { status: 'pending' as const, name: test.title, duration: 0 }
            }
            emitTestFail(reporter, test, cid, specs, uid, 0, caughtError!)
            return { status: 'failed' as const, name: test.title, duration: 0, error: caughtError!.message }
        }
        if (isSkipError(caughtError)) {
            emitTestPending(reporter, test, cid, specs, uid, fnDuration)
            return { status: 'pending' as const, name: test.title, duration: fnDuration }
        }
        if (passed) {
            emitTestPass(reporter, test, cid, specs, uid, fnDuration)
            return { status: 'passed' as const, name: test.title, duration: fnDuration }
        }
        emitTestFail(reporter, test, cid, specs, uid, fnDuration, caughtError!)
        return { status: 'failed' as const, name: test.title, duration: fnDuration, error: caughtError!.message }
    }).finally(async () => {
        await bidi.browsingContextClose!({ context: contextId }).catch(
            (err) => { log.debug(`[Parallel] cleanup: failed to close context ${contextId}: ${(err as Error).message}`) }
        )
        bidi.__parallelContexts?.delete(contextId)
    })
}

// ============================================================
// Main entry point — replaces mocha.run()
// ============================================================

export async function runParallelTests(
    mochaSuite: Suite,
    browser: WebdriverIO.Browser,
    reporter: EventEmitter,
    cid: string,
    specs: string[],
    maxParallelContexts?: number
): Promise<number> {
    const bidi = browser as ParallelBrowser
    if (!bidi.isBidi) {
        throw new Error(
            'Parallel mode (parallelMode: "contexts") requires a WebDriver Bidi session. '
            + 'Ensure your capabilities enable Bidi.'
        )
    }

    const { tests, suites } = collectAll(mochaSuite)
    if (tests.length === 0) { log.info('No tests found for parallel execution.'); return 0 }

    if (tests.some((t) => t._beforeAll.length > 0 || t._afterAll.length > 0)) {
        log.warn(
            'Suite-level hooks (before()/after()) run once per test in parallel mode ' +
            '(parallelMode: "contexts") because each test runs in its own browsing context. ' +
            'Use beforeSuite/afterSuite hooks in wdio.conf.ts for setup that should run only once per spec file.'
        )
    }

    // --- Emit suite:start for nested describe blocks ---
    for (const s of suites) {
        emitSuiteStart(reporter, s, cid, specs, `suite-${cid}-${s.depth}`)
    }

    const parallelStore = (browser as ParallelBrowser).__parallelContextStore as AsyncLocalStorage<string>
    if (!parallelStore) {
        throw new Error('Parallel context store not found on browser.')
    }
    const parallelContexts = (browser as ParallelBrowser).__parallelContexts
    if (!parallelContexts) {
        throw new Error(
            'Parallel context registry not found on browser. ' +
            'The session ContextManager must expose __parallelContexts for re-anchor protection.'
        )
    }

    const maxContexts = Math.max(1, maxParallelContexts || os.cpus().length)
    const batchSize = Math.min(maxContexts, tests.length)
    const runStart = Date.now()
    const allResults: PromiseSettledResult<TestRunResult>[] = []

    log.info(
        `[Parallel] Collected ${tests.length} tests. ` +
        `Batch size: ${batchSize}, max contexts: ${maxContexts}`
    )

    // --- Run tests in batches ---
    for (let batchStart = 0; batchStart < tests.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, tests.length)
        const currentBatchSize = batchEnd - batchStart

        const allocStart = Date.now()
        const contexts = await preallocateContexts(browser, currentBatchSize)
        log.info(`[Parallel] ${contexts.length} contexts created in ${Date.now() - allocStart}ms`)

        const batchResults = await Promise.allSettled(
            tests.slice(batchStart, batchEnd).map((test, i) =>
                runOneTest(
                    test, contexts[i], cid, specs,
                    `test-${cid}-${batchStart + i}`,
                    reporter, parallelStore, bidi
                )
            )
        )
        allResults.push(...batchResults)
    }

    const totalDuration = Date.now() - runStart
    const passed = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'passed').length
    const pending = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'pending').length
    // Pending tests are not failures — Mocha parity
    const failed = tests.length - passed - pending

    // --- Emit suite:end for nested describe blocks (reverse order) ---
    for (const s of [...suites].reverse()) {
        emitSuiteEnd(reporter, s, cid, specs, `suite-${cid}-${s.depth}`)
    }

    log.info(
        `[Parallel] ${tests.length} tests: ${passed} passed, ${failed} failed, ${pending} pending in ${totalDuration}ms`
    )

    return failed
}
