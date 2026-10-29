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
import Mocha from 'mocha'
import type { Suite } from 'mocha'
import logger from '@wdio/logger'
import { TITLE_KINDS, checkHookKind, dottedFullTitle, formatError, type TitledNode } from './common.js'
import { allocateContext, cleanupAllocation, resolveMaxContexts, type ParallelContextAllocation, type ParallelContextBrowser, type ParallelMode } from '@wdio/utils'
import { MOCHA_TIMEOUT_MESSAGE } from './constants.js'
import type { FormattedMessage, MochaError } from './types.js'
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
interface ParallelBrowser extends WebdriverIO.Browser, ParallelContextBrowser {
    isBidi: boolean
    __parallelContextStore?: AsyncLocalStorage<string>
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
    /** Mocha's resolved retries for this test (`_retries`): `mochaOpts.retries`, `this.retries(n)` in a describe, `it().retries(n)` */
    retries?: number
    /** {@link CollectedSuite.depth} of each suite of the tree, for the declaring suite of a hook */
    suiteIndexOf: Map<object, number>
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
    const suiteIndexOf = new Map<object, number>()
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
        if (suiteIndex !== undefined) {
            suiteIndexOf.set(s, suiteIndex)
        }

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
                timeout: (test as unknown as { _timeout?: number })._timeout,
                retries: (test as unknown as { _retries?: number })._retries,
                suiteIndexOf
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
    error?: MochaError
    hookKind?: ReporterHookKind
    hookSuiteUid?: string
}

/** The test name that formatError puts in the timeout text, as formatMessage builds it */
const testNameOf = (test: CollectedTest) => test.parentTitle ? `${test.parentTitle} ${test.title}` : test.title

/** Mocha's own timeout error (Runnable#_timeoutError), so the text is the same as in a sequential run */
function mochaTimeoutError(ms: number, file?: string) {
    const err = new Error(`Timeout of ${ms}ms exceeded. ${MOCHA_TIMEOUT_MESSAGE}${file ? ` (${file})` : ''}`)
    return Object.assign(err, { code: 'ERR_MOCHA_TIMEOUT', timeout: ms, file })
}

/** Mocha's error for a test that a failed hook skips (`failHookAffectedTests`, runner.js createHookSkipError) */
function hookSkipError(hookTitle: string, err: Error) {
    const skipError = new Error(`Test skipped due to failure in hook "${hookTitle}": ${err.message}`)
    skipError.stack = err.stack
    return skipError
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
    const errorPayload = formatError(error as unknown as MochaError, testNameOf(test))
    reporter.emit('test:fail', { ...baseMessage('test:fail', test, cid, specs, uid, contextId), duration, error: errorPayload })
    reporter.emit('test:end', { ...baseMessage('test:end', test, cid, specs, uid, contextId), duration, passed: false, error: errorPayload })
}

type ReporterHookKind = NonNullable<FormattedMessage['hookKind']>
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

/** Mocha's `ctx.currentTest` of a hook (runner.js hook): first sibling for before all, last for after all, else the test. */
function hookCurrentTest(kind: HookKind, hook: MochaHookLike, test: CollectedTest) {
    const siblings = hook.parent?.tests
    return kind === 'before all' ? siblings?.[0]?.title
        : kind === 'after all' ? siblings?.[siblings.length - 1]?.title
            : test.title
}

/** Mocha's own hook title (runner.js setHookTitle). */
function nativeHookTitle(kind: HookKind, hook: MochaHookLike, currentTest: string | undefined) {
    const original = hook.originalTitle ?? hook.title ?? `"${kind}" hook`
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
    const currentTest = hookCurrentTest(kind, hook, test)
    const native = nativeHookTitle(kind, hook, currentTest)
    const declaringSuite = hook.parent?.title
    // an all-hook belongs to its declaring suite, an each-hook and a root hook (no suite event) to the suite of its test
    const declaringIndex = hook.parent && test.suiteIndexOf.get(hook.parent)
    const ownSuite = (kind === 'before all' || kind === 'after all') && declaringIndex !== undefined
    return {
        type, cid, specs, uid,
        title: declaringSuite ? `"${kind}" hook for ${declaringSuite}` : native,
        fullTitle: dottedFullTitle(native, hook.parent),
        parent: ownSuite ? declaringSuite ?? '' : test.parentTitle,
        file: test.file || specs[0],
        ...parentUidField(cid, ownSuite ? declaringIndex : test.suiteIndex),
        contextId,
        ...(currentTest !== undefined && { currentTest }),
        hookKind: checkHookKind(hook, TITLE_KINDS[kind]),
        ...(ownSuite && { hookSuiteUid: suiteUid(cid, declaringIndex) })
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
    error?: Error,
    pending?: boolean
) {
    const native = nativeHookTitle(kind, hook, hookCurrentTest(kind, hook, test))
    const errorPayload = error
        ? formatError(error as unknown as MochaError, hook.parent?.title ? `${hook.parent.title} ${native}` : native)
        : undefined
    reporter.emit('hook:end', {
        ...hookBaseMessage('hook:end', kind, hook, test, cid, specs, uid, contextId),
        duration,
        // `this.skip()` in a hook: no state and no error, as in a sequential run (#14649)
        ...(pending ? { pending: true } : { state: error ? 'fail' : 'pass' }),
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
function createHookContext(testTitle: string | undefined, parentTitle: string | undefined, timeoutMs: number, fullTitle?: string, file?: string) {
    const test = testTitle ? { title: testTitle, parent: { title: parentTitle || '' }, state: undefined as 'passed' | 'failed' | undefined } : undefined
    const resolvedFullTitle = fullTitle ?? `${parentTitle || ''} ${testTitle || ''}`.trim()
    return {
        test,
        currentTest: test,
        // `_timeoutError`: the wdio shim fails a timed-out runnable with Mocha's own error
        _runnable: { _timeout: timeoutMs, title: testTitle, file, fullTitle: () => resolvedFullTitle, _timeoutError: (ms: number) => mochaTimeoutError(ms, file) },
        skip: () => { throw new Error('sync skip; aborting execution') },
        timeout: () => { throw new Error('this.timeout() is not supported in parallel mode') },
        retries: () => { throw new Error('this.retries() is not supported in parallel mode') },
    }
}

// Mocha does not fail a test on an unhandled rejection of user code, and keeps its listener for the
// whole worker (WebdriverIO never disposes the runner): without one, Node ends the worker on a late
// rejection, for example of a command with no await when the session ends
const ignoreUnhandledRejection = () => {}
function keepWorkerOnUnhandledRejection() {
    if (!process.listeners('unhandledRejection').includes(ignoreUnhandledRejection)) {
        process.on('unhandledRejection', ignoreUnhandledRejection)
    }
}

/** Mocha's isError (runner.js): an Error, also of another realm, or an object with a string message */
function isError(value: unknown): value is Error {
    return value instanceof Error || typeof (value as { message?: unknown } | null)?.message === 'string'
}

/** Mocha's Runner#uncaught for a thrown value that is no error (runner.js thrown2Error) */
function toError(value: unknown): Error {
    if (isError(value)) { return value }
    if (!value) {
        return new Error('Caught falsy/undefined exception which would otherwise be uncaught. No stack trace found; try a debugger')
    }
    // `canonicalType` is not in @types/mocha
    const { canonicalType } = Mocha.utils as unknown as { canonicalType: (value: unknown) => string }
    return new Error(`the ${canonicalType(value)} ${Mocha.utils.stringify(value)} was thrown, throw an Error :)`)
}

/** lets an uncaught error of a context fail the runnable (hook or test) that runs in it */
interface UncaughtTarget {
    set(fail: (err: Error) => void): void
    /** a runnable that ends after its failure must not clear the target of the next one */
    clear(fail: (err: Error) => void): void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callHook(hook: any, ctx: object, timeoutMs?: number, uncaught?: UncaughtTarget): Promise<unknown> {
    const fn: Function = typeof hook.fn === 'function' ? hook.fn : hook
    const run = (): Promise<unknown> => {
        if (fn.length >= 1) {
            return Promise.resolve(fn.call(ctx, (err?: Error) => {
                throw err || new Error('done() callback is not supported in parallel mode')
            }))
        }
        return Promise.resolve(fn.call(ctx))
    }
    return new Promise((resolve, reject) => {
        const runnable = (ctx as { _runnable?: { file?: string } })._runnable
        const rejectTimeout = () => {
            uncaught?.clear(fail)
            reject(mochaTimeoutError(timeoutMs!, runnable?.file))
        }
        let graceTimer: ReturnType<typeof setTimeout> | undefined
        const timer = timeoutMs && timeoutMs > 0
            ? setTimeout(() => { graceTimer = setTimeout(rejectTimeout, timeoutMs) }, timeoutMs)
            : undefined
        const fail = (err: Error) => {
            if (graceTimer) {
                // the runnable fails with the timeout text: keep the real cause in the log
                log.error(`[Parallel] uncaught error after the timeout of ${timeoutMs}ms: ${err.stack ?? err.message}`)
            }
            settle(() => reject(err))
        }
        const settle = (onTime: () => void) => {
            clearTimeout(timer)
            if (!graceTimer) {
                uncaught?.clear(fail)
                return onTime()
            }
            clearTimeout(graceTimer)
            rejectTimeout()
        }
        uncaught?.set(fail)
        Promise.resolve()
            .then(run)
            .then(
                (value) => settle(() => resolve(value)),
                (err) => settle(() => reject(err))
            )
    })
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
    timeoutMs: number,
    failHookAffectedTests: boolean,
    uncaughtTargets: Map<string, (err: Error) => void>
): Promise<TestRunResult> {
    const contextId = allocation.context
    const uncaught: UncaughtTarget = {
        set: (fail) => uncaughtTargets.set(contextId, fail),
        clear: (fail) => { if (uncaughtTargets.get(contextId) === fail) { uncaughtTargets.delete(contextId) } }
    }
    const runInContext = async (): Promise<TestRunResult> => {
        // Static pending tests (it.skip / it without fn): no hooks, no
        // test:start — matches the Mocha runner.
        if (test.pending) {
            emitTestPending(reporter, test, cid, specs, uid, 0, contextId)
            return { status: 'pending' as const, name: test.title, duration: 0, hookFailures: 0 }
        }

        let hookCnt = 0
        // One context per test so `this.x` set in beforeEach is visible in the test and afterEach
        const ctx = createHookContext(test.title, test.parentTitle, timeoutMs, test.fullTitle, test.file)
        let caughtError: Error | undefined
        /** the before / beforeEach hook whose failure skips the test */
        let failedHook: { kind: HookKind, hook: MochaHookLike } | undefined
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
                    await callHook(fn, ctx, timeoutMs, uncaught)
                    emitHookEnd(reporter, kind, hook, test, cid, specs, hookUid, contextId, Date.now() - hookStart)
                } catch (err) {
                    let hookError = isError(err) ? err : new Error(String(err))
                    if (isSkipError(hookError) && kind === 'after all') {
                        // Mocha fails this.skip() in an after all hook (runner.js `this.skip` forbidden)
                        hookError = Object.assign(new Error('`this.skip` forbidden'), { code: 'ERR_MOCHA_UNSUPPORTED' })
                    }
                    if (isSkipError(hookError)) {
                        emitHookEnd(reporter, kind, hook, test, cid, specs, hookUid, contextId, Date.now() - hookStart, undefined, true)
                        if (fatal) {
                            caughtError = hookError
                            break
                        }
                        continue
                    }
                    emitHookEnd(reporter, kind, hook, test, cid, specs, hookUid, contextId, Date.now() - hookStart, hookError)
                    if (fatal) {
                        caughtError = hookError
                        failedHook = { kind, hook }
                        break
                    }
                    hookFailures++
                    log.warn(`[Parallel] ${kind} hook failed for "${test.title}": ${hookError.message}`)
                }
            }
        }

        /**
         * Sends the result when the test is done, before its afterEach / after
         * hooks, as Mocha does. A test that a failed hook skips fails with Mocha's
         * text, or is not reported with `failHookAffectedTests: false`.
         */
        const report = (): Omit<TestRunResult, 'hookFailures'> => {
            if (isSkipError(caughtError)) {
                // this.skip() in the test or in a before / beforeEach hook → pending (Mocha parity)
                emitTestPending(reporter, test, cid, specs, uid, started ? fnDuration : 0, contextId)
                return { status: 'pending', name: test.title, duration: started ? fnDuration : 0 }
            }
            if (passed) {
                emitTestPass(reporter, test, cid, specs, uid, fnDuration, contextId)
                return { status: 'passed', name: test.title, duration: fnDuration }
            }
            const error = failedHook ? hookSkipError(nativeHookTitle(failedHook.kind, failedHook.hook, hookCurrentTest(failedHook.kind, failedHook.hook, test)), caughtError!) : caughtError!
            if (!failedHook || failHookAffectedTests) {
                if (!started) {
                    // WDIOReporter's test:fail handler needs a prior test:start for this uid
                    emitTestStart(reporter, test, cid, specs, uid, contextId)
                }
                emitTestFail(reporter, test, cid, specs, uid, fnDuration, error, contextId)
            }
            return { status: 'failed', name: test.title, duration: fnDuration, error: error.message }
        }

        // Suite hooks run once per test, inside this test's browsing context
        // (see the warning in runParallelTests). beforeAll failure skips the
        // test but afterAll still runs — Mocha parity.
        let result: Omit<TestRunResult, 'hookFailures'>
        await runHookChain(test._beforeAll, 'before all', true)
        if (!caughtError) {
            started = true
            emitTestStart(reporter, test, cid, specs, uid, contextId)
            await runHookChain(test._beforeEach, 'before each', true)
            if (!caughtError) {
                const fnStart = Date.now()
                try {
                    await callHook(test.fn, ctx, timeoutMs, uncaught)
                    passed = true
                } catch (err) {
                    caughtError = isError(err) ? err : new Error(String(err))
                } finally {
                    // Reported duration excludes hook time — Mocha parity
                    fnDuration = Date.now() - fnStart
                }
            }
            if (ctx.test && !isSkipError(caughtError)) { ctx.test.state = passed ? 'passed' : 'failed' }
            result = report()
            await runHookChain(test._afterEach, 'after each', false)
        } else {
            result = report()
        }
        await runHookChain(test._afterAll, 'after all', false)
        return { ...result, hookFailures }
    }
    return parallelStore.run(contextId, () => runInContext().finally(() => {
        // the context sends no more events: reporters can close what they keep for it
        reporter.emit('context:end', { type: 'context:end', cid, specs, uid, contextId })
    }))
}

// ============================================================
// Main entry point — replaces mocha.run()
// ============================================================

export interface ParallelMochaOptions {
    grep?: RegExp
    invert?: boolean
    timeout?: number | string
    mode?: ParallelMode
    /** `false`: a test that a failed hook skips is not reported, as in a sequential run (default `true`) */
    failHookAffectedTests?: boolean
    /** `true`: an uncaught error is not caught, as with Mocha's `allowUncaught` */
    allowUncaught?: boolean
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

    // the parallel runner has no retry loop yet: fail like mochaOpts.retries instead of ignoring the retries
    const retried = tests.find((t) => !t.pending && (t.retries ?? 0) > 0)
    if (retried) {
        const count = retried.retries!
        throw new Error(
            `retries is not supported in parallel mode (parallelMode: "${mode}"): ` +
            `"${retried.fullTitle}" has ${count} ${count === 1 ? 'retry' : 'retries'}`
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

    // Mocha's Runner#uncaught: an uncaught error fails the runnable of its context (the
    // AsyncLocalStorage store follows timers and promises); a skip error makes it pending
    const uncaughtTargets = new Map<string, (err: Error) => void>()
    let uncaughtOutside = 0
    const onUncaught = (err: unknown) => {
        const error = toError(err)
        const contextId = parallelStore.getStore()
        const fail = contextId ? uncaughtTargets.get(contextId) : undefined
        if (fail) { return fail(error) }
        if (isSkipError(error)) { return }
        uncaughtOutside++
        log.error(`[Parallel] uncaught error outside a running test or hook: ${error.stack ?? error.message}`)
    }

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
                        reporter, parallelStore, timeoutMs,
                        mochaOptions?.failHookAffectedTests !== false,
                        uncaughtTargets
                    )
                }
            } catch (reason) {
                allResults[index] = { status: 'rejected', reason }
            } finally {
                await scheduleClose(allocation)
            }
        }
    }

    if (!mochaOptions?.allowUncaught) { process.on('uncaughtException', onUncaught) }
    keepWorkerOnUnhandledRejection()
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
        // a test can still throw while its window closes
        process.removeListener('uncaughtException', onUncaught)
    }
    const totalDuration = Date.now() - runStart
    const passed = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'passed').length
    const pending = allResults.filter(r => r.status === 'fulfilled' && r.value.status === 'pending').length
    // Pending tests are not failures; failing teardown hooks are, like Mocha
    const hookFailures = allResults.reduce((n, r) => n + (r.status === 'fulfilled' ? r.value.hookFailures : 0), 0)
    const failed = tests.length - passed - pending + hookFailures + uncaughtOutside

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
