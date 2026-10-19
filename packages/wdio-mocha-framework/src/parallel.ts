/**
 * Parallel test execution for the Mocha framework adapter.
 *
 * When `mochaOpts.parallelMode` is set (`'contexts'` or `'userContexts'`), this module
 * replaces the sequential `mocha.run()` with parallel execution:
 *   1. Walk the Mocha suite tree to collect all it() blocks
 *   2. Pre-create a browsing context (window) for each test
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
import { dottedFullTitle, type TitledNode } from './common.js'
import type { EventEmitter } from 'node:events'

const log = logger('@wdio/mocha-framework:parallel')

const DEFAULT_TIMEOUT_MS = 2000
const MAX_TIMEOUT_MS = Math.pow(2, 31) - 1

// Single-segment only (one number + optional unit), like the `ms` package.
// Compound strings such as '1h 30m' are invalid and fall through to the default.
const TIMEOUT_STRING_RE = /^(\d+(?:\.\d+)?)\s*(milliseconds?|seconds?|minutes?|hours?|ms|s|m|h)?$/i

export function parseTimeoutString(value: string): number | undefined {
    const match = TIMEOUT_STRING_RE.exec(value.trim())
    if (!match) {
        return undefined
    }
    const n = parseFloat(match[1])
    switch (match[2]?.toLowerCase()) {
    case 'ms':
    case 'millisecond':
    case 'milliseconds':
        return n
    case 's':
    case 'second':
    case 'seconds':
        return n * 1000
    case 'm':
    case 'minute':
    case 'minutes':
        return n * 60 * 1000
    case 'h':
    case 'hour':
    case 'hours':
        return n * 60 * 60 * 1000
    default:
        return n
    }
}

function resolveTimeoutMs(timeout?: number | string): number {
    const ms = typeof timeout === 'string' ? parseTimeoutString(timeout) : timeout
    if (ms === undefined) {
        return DEFAULT_TIMEOUT_MS
    }
    // mocha treats 0 and the 2^31-1 clamp cap as "timeout disabled"
    return ms > 0 && ms < MAX_TIMEOUT_MS ? ms : 0
}

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
    browsingContextCreate?(params: { type: string; userContext?: string }): Promise<{ context: string }>
    browsingContextClose?(params: { context: string }): Promise<void>
    browserCreateUserContext?(params: Record<string, never>): Promise<{ userContext: string }>
    browserRemoveUserContext?(params: { userContext: string }): Promise<void>
}

export type ParallelMode = 'contexts' | 'userContexts'

export interface ParallelContextAllocation {
    context: string
    userContext?: string
}

export function resolveMaxContexts(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? Math.max(1, Math.floor(value))
        : Math.max(1, fallback)
}

interface CollectedTest {
    title: string
    /** space-joined like Mocha's fullTitle(); used for grep and hook context parity */
    fullTitle: string
    /** dot-joined like the sequential adapter reports it */
    reportFullTitle: string
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
    /** {@link CollectedSuite.depth} of the owning suite; undefined for root-level tests */
    suiteIndex?: number
    /** Mocha's resolved timeout for this test (`_timeout`) */
    timeout?: number
}

interface CollectedSuite {
    title: string
    fullTitle: string
    file: string | undefined
    /** index into the suites array for reverse-order suite:end emission */
    depth: number
    /** {@link depth} of the parent suite; undefined for top-level describes */
    parentIndex?: number
    /** Mocha's resolved timeout for this suite (`_timeout`) */
    timeout?: number
}

const suiteUid = (cid: string, index: number) => `suite-${cid}-${index}`
// null parents to the reporter's own '(root)' suite; Mocha's root suite is never emitted (sequential adapter drops it too)
const parentUidField = (cid: string, index?: number) => ({ parentUid: index === undefined ? null : suiteUid(cid, index) })

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
function collectAll(suite: Suite, match?: (test: CollectedTest) => boolean): SuiteCollection {
    const tests: CollectedTest[] = []
    const suiteStubs = new Map<Suite, CollectedSuite>()
    const matchedSuites = new Set<Suite>()
    let nextDepth = 0

    const walk = (
        s: Suite,
        parentBeforeEach: Function[],
        parentAfterEach: Function[],
        parentBeforeAll: Function[],
        parentAfterAll: Function[],
        depth: number,
        ancestors: Suite[],
        parentIndex?: number
    ) => {
        const suiteIndex = depth > 0 ? nextDepth++ : undefined

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
            const collected = {
                title: test.title,
                fullTitle: test.fullTitle(),
                reportFullTitle: dottedFullTitle(test.title, test.parent),
                fn: fn || (() => {}),
                parentTitle: s.title,
                _beforeEach: mergedBeforeEach,
                _afterEach: mergedAfterEach,
                _beforeAll: mergedBeforeAll,
                _afterAll: mergedAfterAll,
                pending: !!test.pending || !fn,
                file: test.file || undefined,
                suiteIndex,
                timeout: (test as unknown as { _timeout?: number })._timeout
            }
            if (!match || match(collected)) {
                tests.push(collected)
                for (const ancestor of ancestors) {
                    matchedSuites.add(ancestor)
                }
                matchedSuites.add(s)
            }
        }

        // Suite metadata (skip root)
        if (depth > 0) {
            suiteStubs.set(s, {
                title: s.title,
                fullTitle: dottedFullTitle(s.title, s.parent),
                file: (s as unknown as { file?: string }).file,
                depth: suiteIndex!,
                parentIndex,
                timeout: (s as unknown as { _timeout?: number })._timeout
            })
        }

        // Recurse into children
        for (const child of s.suites) {
            walk(child, mergedBeforeEach, mergedAfterEach, mergedBeforeAll, mergedAfterAll, depth + 1, [...ancestors, s], suiteIndex)
        }
    }

    walk(suite, [], [], [], [], 0, [])

    return {
        tests,
        suites: [...suiteStubs.entries()]
            .filter(([s]) => matchedSuites.has(s))
            .map(([, stub]) => stub)
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
    parentUid?: string | null
    file: string
    contextId?: string
    duration?: number
    passed?: boolean
    error?: { name: string; message: string; stack?: string }
}

function baseMessage(type: string, test: CollectedTest, cid: string, specs: string[], uid: string, contextId?: string) {
    return {
        type, cid, specs, uid,
        title: test.title,
        fullTitle: test.reportFullTitle,
        parent: test.parentTitle,
        file: test.file || specs[0],
        ...parentUidField(cid, test.suiteIndex),
        ...(contextId ? { contextId } : {})
    } satisfies TestMessage
}

function emitTestStart(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string, contextId?: string) {
    reporter.emit('test:start', baseMessage('test:start', test, cid, specs, uid, contextId))
}

function emitTestPass(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string, duration: number, contextId: string) {
    reporter.emit('test:pass', { ...baseMessage('test:pass', test, cid, specs, uid, contextId), duration, passed: true })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid, contextId), duration, passed: true })
}

function emitTestFail(
    reporter: EventEmitter,
    test: CollectedTest,
    cid: string,
    specs: string[],
    uid: string,
    duration: number,
    error: Error,
    contextId: string
) {
    const errorPayload = {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
    }
    reporter.emit('test:fail', { ...baseMessage('test:fail', test, cid, specs, uid, contextId), duration, error: errorPayload })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid, contextId), duration, passed: false, error: errorPayload })
}

type HookKind = 'before all' | 'after all' | 'before each' | 'after each'

function emitTestPending(reporter: EventEmitter, test: CollectedTest, cid: string, specs: string[], uid: string, duration: number, contextId: string) {
    reporter.emit('test:pending', { ...baseMessage('test:pending', test, cid, specs, uid, contextId), duration, pending: true })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid, contextId), duration, passed: false, pending: true })
}

interface MochaHookLike {
    title?: string
    originalTitle?: string
    parent?: TitledNode & { root?: boolean, tests?: { title: string }[] }
}

/** Mocha's own hook title (runner.js setHookTitle). */
function nativeHookTitle(kind: HookKind, hook: MochaHookLike, test: CollectedTest) {
    const original = hook.originalTitle ?? hook.title ?? `"${kind}" hook`
    const siblings = hook.parent?.tests
    const currentTest = kind === 'before all' ? siblings?.[0]?.title
        : kind === 'after all' ? siblings?.[siblings.length - 1]?.title
            : test.title
    return currentTest !== undefined
        ? `${original} for "${currentTest}"`
        : `${original} in "${hook.parent?.title || (hook.parent?.root ? '{root}' : '')}"`
}

/**
 * Reproduces what reporters see in sequential mode: formatMessage (common.ts)
 * rewrites the title to `"<hook>" hook for <declaring suite>` when the hook's
 * suite has a title, but builds fullTitle from the native title.
 */
function hookBaseMessage(type: string, kind: HookKind, hook: MochaHookLike, test: CollectedTest, cid: string, specs: string[], uid: string, contextId: string) {
    const native = nativeHookTitle(kind, hook, test)
    const declaringSuite = hook.parent?.title
    return {
        type, cid, specs, uid,
        title: declaringSuite ? `"${kind}" hook for ${declaringSuite}` : native,
        fullTitle: dottedFullTitle(native, hook.parent),
        parent: test.parentTitle,
        file: test.file || specs[0],
        ...parentUidField(cid, test.suiteIndex),
        contextId
    } satisfies TestMessage
}

function emitHookStart(reporter: EventEmitter, kind: HookKind, hook: MochaHookLike, test: CollectedTest, cid: string, specs: string[], uid: string, contextId: string) {
    reporter.emit('hook:start', hookBaseMessage('hook:start', kind, hook, test, cid, specs, uid, contextId))
}

function emitHookEnd(
    reporter: EventEmitter,
    kind: HookKind,
    hook: MochaHookLike,
    test: CollectedTest,
    cid: string,
    specs: string[],
    uid: string,
    contextId: string,
    duration: number,
    error?: Error
) {
    const errorPayload = error ? {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
    } : undefined
    reporter.emit('hook:end', {
        ...hookBaseMessage('hook:end', kind, hook, test, cid, specs, uid, contextId),
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
        file: suite.file || specs[0],
        ...parentUidField(cid, suite.parentIndex)
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
        file: suite.file || specs[0],
        ...parentUidField(cid, suite.parentIndex)
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
function createHookContext(testTitle: string | undefined, parentTitle: string | undefined, timeoutMs: number, fullTitle?: string) {
    const test = testTitle ? { title: testTitle, parent: { title: parentTitle || '' }, state: undefined as 'passed' | 'failed' | undefined } : undefined
    const resolvedFullTitle = fullTitle ?? `${parentTitle || ''} ${testTitle || ''}`.trim()
    return {
        test,
        currentTest: test,
        _runnable: { _timeout: timeoutMs, title: testTitle, fullTitle: () => resolvedFullTitle },
        skip: () => { throw new Error('sync skip; aborting execution') },
        timeout: () => { throw new Error('this.timeout() is not supported in parallel mode') },
        retries: () => { throw new Error('this.retries() is not supported in parallel mode') },
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callHook(hook: any, ctx: object, timeoutMs?: number): Promise<unknown> {
    const fn: Function = typeof hook.fn === 'function' ? hook.fn : hook
    const run = (): Promise<unknown> => {
        if (fn.length >= 1) {
            return Promise.resolve(fn.call(ctx, (err?: Error) => {
                throw err || new Error('done() callback is not supported in parallel mode')
            }))
        }
        return Promise.resolve(fn.call(ctx))
    }
    if (timeoutMs && timeoutMs > 0) {
        return new Promise((resolve, reject) => {
            const rejectTimeout = () => reject(new Error(
                `Timeout of ${timeoutMs}ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.`
            ))
            let graceTimer: ReturnType<typeof setTimeout> | undefined
            const timer = setTimeout(() => { graceTimer = setTimeout(rejectTimeout, timeoutMs) }, timeoutMs)
            const settle = (onTime: () => void) => {
                clearTimeout(timer)
                if (!graceTimer) {
                    return onTime()
                }
                clearTimeout(graceTimer)
                rejectTimeout()
            }
            Promise.resolve()
                .then(run)
                .then(
                    (value) => settle(() => resolve(value)),
                    (err) => settle(() => reject(err))
                )
        })
    }
    return run()
}

// ============================================================
// Context pre-allocation
// ============================================================

async function removeUserContext(bidi: ParallelBrowser, userContext: string, level: 'warn' | 'debug' = 'warn') {
    await bidi.browserRemoveUserContext!({ userContext }).catch(
        (err) => { log[level](`[Parallel] failed to remove user context ${userContext}: ${(err as Error).message}`) }
    )
}

async function allocateContext(bidi: ParallelBrowser, mode: ParallelMode): Promise<ParallelContextAllocation> {
    let allocation: ParallelContextAllocation
    if (mode !== 'userContexts') {
        const { context } = await bidi.browsingContextCreate!({ type: 'window' })
        allocation = { context }
    } else {
        const { userContext } = await bidi.browserCreateUserContext!({})
        try {
            const { context } = await bidi.browsingContextCreate!({ type: 'window', userContext })
            allocation = { context, userContext }
        } catch (err) {
            await removeUserContext(bidi, userContext)
            throw err
        }
    }
    // Register with the session ContextManager so navigations inside these
    // windows don't trigger session-global re-anchoring (tree fetch + switchToWindow).
    bidi.__parallelContexts?.add(allocation.context)
    return allocation
}

/** Never rejects: close window, then remove its user context, then unregister. */
async function cleanupAllocation(bidi: ParallelBrowser, { context, userContext }: ParallelContextAllocation) {
    await bidi.browsingContextClose!({ context }).catch(
        (err) => { log.debug(`[Parallel] cleanup: failed to close context ${context}: ${(err as Error).message}`) }
    )
    if (userContext) {
        await removeUserContext(bidi, userContext, 'debug')
    }
    bidi.__parallelContexts?.delete(context)
}

interface TestRunResult {
    status: 'passed' | 'failed' | 'pending'
    name: string
    duration: number
    error?: string
    /** failing non-fatal hooks; each counts as its own failure, like Mocha */
    hookFailures: number
}

// ============================================================
// Per-test execution
// ============================================================

async function runOneTest(
    test: CollectedTest,
    allocation: ParallelContextAllocation,
    cid: string,
    specs: string[],
    uid: string,
    reporter: EventEmitter,
    parallelStore: AsyncLocalStorage<string>,
    timeoutMs: number
): Promise<TestRunResult> {
    const contextId = allocation.context
    return parallelStore.run(contextId, async () => {
        // Static pending tests (it.skip / it without fn): no hooks, no
        // test:start — matches the Mocha runner.
        if (test.pending) {
            emitTestPending(reporter, test, cid, specs, uid, 0, contextId)
            return { status: 'pending' as const, name: test.title, duration: 0, hookFailures: 0 }
        }

        let hookCnt = 0
        // One context per test so `this.x` set in beforeEach is visible in the test and afterEach
        const ctx = createHookContext(test.title, test.parentTitle, timeoutMs, test.fullTitle)
        let caughtError: Error | undefined
        let started = false
        let fnDuration = 0
        let passed = false
        let hookFailures = 0

        /**
         * Run a hook chain, emitting hook:start/hook:end with per-hook
         * durations and paired uids. Fatal chains (beforeAll/beforeEach)
         * stop on the first failure; non-fatal chains (afterEach/afterAll)
         * log, count the failure and continue — the test keeps its status,
         * and the failing hook is reported as its own failure.
         */
        const runHookChain = async (hooks: Function[], kind: HookKind, fatal: boolean) => {
            for (const fn of hooks) {
                const hook = fn as MochaHookLike
                const hookUid = `hook-${uid}-${hookCnt++}`
                emitHookStart(reporter, kind, hook, test, cid, specs, hookUid, contextId)
                const hookStart = Date.now()
                try {
                    await callHook(fn, ctx, timeoutMs)
                    emitHookEnd(reporter, kind, hook, test, cid, specs, hookUid, contextId, Date.now() - hookStart)
                } catch (err) {
                    const hookError = err instanceof Error ? err : new Error(String(err))
                    emitHookEnd(reporter, kind, hook, test, cid, specs, hookUid, contextId, Date.now() - hookStart, hookError)
                    if (fatal) {
                        caughtError = hookError
                        break
                    }
                    hookFailures++
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
            emitTestStart(reporter, test, cid, specs, uid, contextId)
            await runHookChain(test._beforeEach, 'before each', true)
            if (!caughtError) {
                const fnStart = Date.now()
                try {
                    await callHook(test.fn, ctx, timeoutMs)
                    passed = true
                } catch (err) {
                    caughtError = err instanceof Error ? err : new Error(String(err))
                } finally {
                    // Reported duration excludes hook time — Mocha parity
                    fnDuration = Date.now() - fnStart
                }
            }
            if (ctx.test && !isSkipError(caughtError)) { ctx.test.state = passed ? 'passed' : 'failed' }
            await runHookChain(test._afterEach, 'after each', false)
        }
        await runHookChain(test._afterAll, 'after all', false)

        if (!started) {
            // this.skip() in a suite before() hook → pending, not failed (Mocha parity)
            if (isSkipError(caughtError)) {
                emitTestPending(reporter, test, cid, specs, uid, 0, contextId)
                return { status: 'pending' as const, name: test.title, duration: 0, hookFailures }
            }
            // WDIOReporter's test:fail handler needs a prior test:start for this uid
            emitTestStart(reporter, test, cid, specs, uid, contextId)
            emitTestFail(reporter, test, cid, specs, uid, 0, caughtError!, contextId)
            return { status: 'failed' as const, name: test.title, duration: 0, error: caughtError!.message, hookFailures }
        }
        if (isSkipError(caughtError)) {
            emitTestPending(reporter, test, cid, specs, uid, fnDuration, contextId)
            return { status: 'pending' as const, name: test.title, duration: fnDuration, hookFailures }
        }
        if (passed) {
            emitTestPass(reporter, test, cid, specs, uid, fnDuration, contextId)
            return { status: 'passed' as const, name: test.title, duration: fnDuration, hookFailures }
        }
        emitTestFail(reporter, test, cid, specs, uid, fnDuration, caughtError!, contextId)
        return { status: 'failed' as const, name: test.title, duration: fnDuration, error: caughtError!.message, hookFailures }
    })
}

// ============================================================
// Main entry point — replaces mocha.run()
// ============================================================

export interface ParallelMochaOptions {
    grep?: RegExp
    invert?: boolean
    timeout?: number | string
    mode?: ParallelMode
}

export async function runParallelTests(
    mochaSuite: Suite,
    browser: WebdriverIO.Browser,
    reporter: EventEmitter,
    cid: string,
    specs: string[],
    maxParallelContexts?: number,
    mochaOptions?: ParallelMochaOptions
): Promise<number> {
    const bidi = browser as ParallelBrowser
    const mode = mochaOptions?.mode ?? 'contexts'
    if (!bidi.isBidi) {
        throw new Error(
            `Parallel mode (parallelMode: "${mode}") requires a WebDriver Bidi session. ` +
            'Ensure your capabilities enable Bidi.'
        )
    }
    if (mode === 'userContexts' && (!bidi.browserCreateUserContext || !bidi.browserRemoveUserContext)) {
        throw new Error(
            'parallelMode: "userContexts" requires browser.createUserContext and browser.removeUserContext, ' +
            'which this driver does not support. Use parallelMode: "contexts" or a driver with BiDi user context support.'
        )
    }

    const grep = mochaOptions?.grep
    const invert = !!mochaOptions?.invert
    const { tests, suites } = collectAll(
        mochaSuite,
        grep ? (test: CollectedTest) => grep.test(test.fullTitle) !== invert : undefined
    )
    if (tests.length === 0) { log.info('No tests found for parallel execution.'); return 0 }

    if (tests.some((t) => t._beforeAll.length > 0 || t._afterAll.length > 0)) {
        log.warn(
            'Suite-level hooks (before()/after()) run once per test in parallel mode ' +
            `(parallelMode: "${mode}") because each test runs in its own browsing context. ` +
            'Use beforeSuite/afterSuite hooks in wdio.conf.ts for setup that should run only once per spec file.'
        )
    }

    const timeoutMs = resolveTimeoutMs(mochaOptions?.timeout)
    const hasCustomTimeout = (r: { timeout?: number }) => r.timeout !== undefined && r.timeout !== timeoutMs
    if (tests.some(hasCustomTimeout) || suites.some(hasCustomTimeout)) {
        log.warn(
            'Per-test and per-suite timeouts (it(...).timeout(n), this.timeout(n)) are not supported ' +
            `in parallel mode (parallelMode: "${mode}"); mochaOpts.timeout (${timeoutMs}ms) applies.`
        )
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

    // After the guards: a throw above must not leave suites started but never ended
    for (const s of suites) {
        emitSuiteStart(reporter, s, cid, specs, suiteUid(cid, s.depth))
    }

    const maxContexts = resolveMaxContexts(maxParallelContexts, os.cpus().length)
    const slotCount = Math.min(maxContexts, tests.length)
    const runStart = Date.now()
    const allResults: PromiseSettledResult<TestRunResult>[] = new Array(tests.length)
    const cleanups: Promise<void>[] = []
    let cursor = 0
    const spares: Promise<ParallelContextAllocation>[] = []
    let allocationError: unknown
    let allocationFailed = false

    log.info(
        `[Parallel] Collected ${tests.length} tests. ` +
        `Slots: ${slotCount}, max contexts: ${maxContexts}`
    )

    // Each slot owns one live allocation and at most one closing. The run keeps
    // a shared pool of spares, never more than the tests not yet taken (so never
    // more than the slot count), which keeps creating windows off the gap
    // between tests without unbounded concurrent closes.
    const runSlot = async () => {
        let closing: Promise<void> | undefined
        const scheduleClose = async (alloc: ParallelContextAllocation) => {
            await closing?.catch(() => {})
            closing = cleanupAllocation(bidi, alloc)
            cleanups.push(closing)
        }
        while (!allocationFailed) {
            const index = cursor++
            if (index >= tests.length) { break }
            let allocation: ParallelContextAllocation
            try {
                allocation = await (spares.shift() ?? allocateContext(bidi, mode))
            } catch (err) {
                if (!allocationFailed) { allocationFailed = true; allocationError = err }
                break
            }
            if (!allocationFailed && tests.length - cursor > spares.length) {
                const next = allocateContext(bidi, mode)
                next.catch(() => {})
                spares.push(next)
            }
            try {
                allResults[index] = {
                    status: 'fulfilled',
                    value: await runOneTest(
                        tests[index], allocation, cid, specs,
                        `test-${cid}-${index}`,
                        reporter, parallelStore, timeoutMs
                    )
                }
            } catch (reason) {
                allResults[index] = { status: 'rejected', reason }
            } finally {
                await scheduleClose(allocation)
            }
        }
    }

    try {
        await Promise.all(Array.from({ length: slotCount }, runSlot))
    } finally {
        for (const spare of spares.splice(0)) {
            const unused = await spare.catch(() => undefined)
            if (unused) { cleanups.push(cleanupAllocation(bidi, unused)) }
        }
        const settled = await Promise.allSettled(cleanups)
        for (const r of settled) {
            if (r.status === 'rejected') { log.warn(`[Parallel] cleanup failed: ${(r.reason as Error).message}`) }
        }
    }
    const totalDuration = Date.now() - runStart
    const passed = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'passed').length
    const pending = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'pending').length
    // Pending tests are not failures; failing teardown hooks are, like Mocha
    const hookFailures = allResults.reduce((n, r) => n + (r.status === 'fulfilled' ? r.value.hookFailures : 0), 0)
    const failed = tests.length - passed - pending + hookFailures

    // --- Emit suite:end for nested describe blocks (reverse order) ---
    for (const s of [...suites].reverse()) {
        emitSuiteEnd(reporter, s, cid, specs, suiteUid(cid, s.depth))
    }

    if (allocationFailed) { throw allocationError }

    log.info(
        `[Parallel] ${tests.length} tests: ${passed} passed, ${failed} failed, ${pending} pending in ${totalDuration}ms`
    )

    return failed
}
