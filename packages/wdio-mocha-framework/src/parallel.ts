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
    file: string | undefined
}

// ============================================================
// Suite tree walker
// ============================================================

/**
 * Recursively walk the Mocha suite tree and collect all test
 * definitions with their associated hooks.
 *
 * @param suite       The root suite to walk.
 * @param parentBeforeEach  Hooks inherited from ancestor suites (outermost first).
 * @param parentAfterEach   Hooks inherited from ancestor suites (outermost first).
 */
export function collectTests(
    suite: Suite,
    parentBeforeEach: Function[] = [],
    parentAfterEach: Function[] = []
): CollectedTest[] {
    const tests: CollectedTest[] = []

    // Merge parent hooks with this suite's own hooks.
    // beforeEach: outer-to-inner (parent hooks first)
    // afterEach:  inner-to-outer (child hooks first, then parent hooks)
    const ownBeforeEach = (suite as unknown as { _beforeEach?: Function[] })._beforeEach || []
    const ownAfterEach = (suite as unknown as { _afterEach?: Function[] })._afterEach || []

    const mergedBeforeEach = [...parentBeforeEach, ...ownBeforeEach]
    const mergedAfterEach = [...ownAfterEach, ...parentAfterEach]

    for (const test of suite.tests) {
        tests.push({
            title: test.title,
            fullTitle: test.fullTitle(),
            fn: (test as unknown as { fn?: Function }).fn || (() => {}),
            parentTitle: suite.title,
            _beforeEach: mergedBeforeEach,
            _afterEach: mergedAfterEach,
            file: test.file || undefined
        })
    }

    // Recurse into child suites, passing merged hooks as the new parent set.
    // Use mergedBeforeEach/mergedAfterEach so grandchildren inherit all ancestors.
    for (const s of suite.suites) {
        tests.push(...collectTests(s, mergedBeforeEach, mergedAfterEach))
    }

    return tests
}

/**
 * Walk the suite tree and collect _beforeAll / _afterAll hooks.
 * Returns hooks in execution order: _beforeAll outermost-first,
 * _afterAll innermost-first (reverse of collection).
 */
function collectSuiteLevelHooks(suite: Suite): {
    beforeAll: Function[]
    afterAll: Function[]
} {
    const beforeAll: Function[] = []
    const afterAll: Function[] = []

    const walk = (s: Suite) => {
        const hooks = s as unknown as { _beforeAll?: Function[], _afterAll?: Function[] }
        if (hooks._beforeAll) {
            beforeAll.push(...hooks._beforeAll)
        }
        if (hooks._afterAll) {
            // Collect in walk order; will reverse at the end for inner-to-outer
            afterAll.push(...hooks._afterAll)
        }
        for (const child of s.suites) {
            walk(child)
        }
    }
    walk(suite)

    return {
        beforeAll,
        // afterAll runs innermost-first in Mocha. Since we collected in
        // outermost-first order, reverse so deepest suite's afterAll
        // runs before its parent's.
        afterAll: afterAll.reverse()
    }
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

/**
 * Call a Mocha hook or test function (which may be a plain Function in tests
 * or a Mocha Runnable instance at runtime). Mocha Runnable instances store the
 * actual function under `.fn`.
 *
 * The WDIO mocha adapter wraps test/hook functions with WDIO hooks via
 * `wrapGlobalTestMethod`. Those wrappers expect `this` to be a Mocha Context
 * with `this.test` set. Provide a minimal context so they don't crash on
 * `this.test` access.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callHook(hook: any, testTitle?: string): Promise<unknown> {
    const fn: Function = typeof hook.fn === 'function' ? hook.fn : hook
    const ctx = { test: testTitle ? { title: testTitle, parent: { title: '' } } : undefined }
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
            created.map((ctx) => bidi.browsingContextClose!({ context: ctx }).catch(() => {}))
        )
        throw (failed[0] as PromiseRejectedResult).reason
    }
    return (results as PromiseFulfilledResult<{ context: string }>[]).map((r) => r.value.context)
}

interface TestRunResult {
    status: 'passed' | 'failed'
    name: string
    duration: number
    error?: string
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

    const tests = collectTests(mochaSuite)
    if (tests.length === 0) { log.info('No tests found for parallel execution.'); return 0 }

    // --- Suite-level _beforeAll hooks (outermost-first) ---
    const { beforeAll, afterAll } = collectSuiteLevelHooks(mochaSuite)
    for (const hook of beforeAll) {
        await callHook(hook)
    }

    const parallelStore = (browser as ParallelBrowser).__parallelContextStore as AsyncLocalStorage<string>
    if (!parallelStore) {
        throw new Error('Parallel context store not found on browser.')
    }

    const maxContexts = Math.max(1, maxParallelContexts || 1)
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
            tests.slice(batchStart, batchEnd).map(async (test, i) => {
                const contextId = contexts[i]
                const uid = `test-${cid}-${batchStart + i}`

                return parallelStore.run(contextId, async () => {
                    const testStart = Date.now()
                    emitTestStart(reporter, test, cid, specs, uid)
                    let passed = false
                    let caughtError: Error | undefined
                    try {
                        for (const hook of test._beforeEach) { await callHook(hook, test.title) }
                        const fn = test.fn as (this: unknown) => Promise<void>
                        const ctx = { test: { title: test.title, parent: { title: '' } } }
                        await fn.call(ctx)
                        passed = true
                    } catch (err) {
                        caughtError = err instanceof Error ? err : new Error(String(err))
                    }
                    // Always run afterEach hooks, even on beforeEach/test failure.
                    for (const hook of test._afterEach) {
                        try { await callHook(hook, test.title) } catch { /* suppress hook errors */ }
                    }
                    const duration = Date.now() - testStart
                    if (passed) {
                        emitTestPass(reporter, test, cid, specs, uid, duration)
                        return { status: 'passed' as const, name: test.title, duration }
                    }
                    emitTestFail(reporter, test, cid, specs, uid, duration, caughtError!)
                    return { status: 'failed' as const, name: test.title, duration, error: caughtError!.message }
                }).finally(async () => {
                    await bidi.browsingContextClose!({ context: contextId }).catch(() => { /* ignore cleanup errors */ })
                })
            })
        )
        allResults.push(...batchResults)
    }

    const totalDuration = Date.now() - runStart
    const passed = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'passed').length
    const failed = tests.length - passed

    // --- Suite-level _afterAll hooks (innermost-first) ---
    for (const hook of afterAll) {
        await callHook(hook)
    }

    log.info(
        `[Parallel] ${tests.length} tests: ${passed} passed, ${failed} failed in ${totalDuration}ms`
    )

    return failed
}
