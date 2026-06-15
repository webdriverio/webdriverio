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
 */
export function collectTests(suite: Suite): CollectedTest[] {
    const tests: CollectedTest[] = []

    // Collect tests at this level with this suite's own hooks
    const beforeEachHooks = (suite as unknown as { _beforeEach?: Function[] })._beforeEach || []
    const afterEachHooks = (suite as unknown as { _afterEach?: Function[] })._afterEach || []

    for (const test of suite.tests) {
        tests.push({
            title: test.title,
            fullTitle: test.fullTitle(),
            fn: (test as unknown as { fn?: Function }).fn || (() => {}),
            parentTitle: suite.title,
            _beforeEach: beforeEachHooks,
            _afterEach: afterEachHooks,
            file: test.file || undefined
        })
    }

    // Recurse into child suites
    for (const s of suite.suites) {
        tests.push(...collectTests(s))
    }

    return tests
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

// ============================================================
// Context pre-allocation
// ============================================================

async function preallocateContexts(
    browser: WebdriverIO.Browser,
    count: number
): Promise<string[]> {
    const contexts = await Promise.all(
        Array.from({ length: count }, () =>
            browser.browsingContextCreate({ type: 'tab' })
        )
    )
    return contexts.map(c => c.context)
}

// ============================================================
// Main entry point — replaces mocha.run()
// ============================================================

export async function runParallelTests(
    mochaSuite: Suite,
    browser: WebdriverIO.Browser,
    reporter: EventEmitter,
    cid: string,
    specs: string[]
): Promise<number> {
    if (!browser.isBidi) {
        throw new Error(
            'Parallel mode (parallelMode: "contexts") requires a WebDriver Bidi session. '
            + 'Ensure your capabilities enable Bidi.'
        )
    }

    const tests = collectTests(mochaSuite)
    if (tests.length === 0) { log.info('No tests found for parallel execution.'); return 0 }

    log.info(`[Parallel] Collected ${tests.length} tests. Pre-allocating browsing contexts...`)
    const allocStart = Date.now()

    const contexts = await preallocateContexts(browser, tests.length)

    log.info(`[Parallel] ${contexts.length} contexts created in ${Date.now() - allocStart}ms`)

    const parallelStore = (browser as Record<string, unknown>).__parallelContextStore as AsyncLocalStorage<string>
    if (!parallelStore) {
        throw new Error('Parallel context store not found on browser.')
    }
    const runStart = Date.now()

    const results = await Promise.allSettled(
        tests.map(async (test, i) => {
            const contextId = contexts[i]
            const uid = `test-${cid}-${i}`

            return parallelStore.run(contextId, async () => {
                const testStart = Date.now()
                emitTestStart(reporter, test, cid, specs, uid)
                try {
                    for (const hook of test._beforeEach) { await hook.call({}) }
                    const fn = test.fn as (this: unknown) => Promise<void>
                    await fn.call({})
                    for (const hook of test._afterEach) { await hook.call({}) }
                    const duration = Date.now() - testStart
                    emitTestPass(reporter, test, cid, specs, uid, duration)
                    return { status: 'passed' as const, name: test.title, duration }
                } catch (err) {
                    const duration = Date.now() - testStart
                    const error = err instanceof Error ? err : new Error(String(err))
                    emitTestFail(reporter, test, cid, specs, uid, duration, error)
                    return { status: 'failed' as const, name: test.title, duration, error: error.message }
                } finally {
                    await browser.browsingContextClose({ context: contextId }).catch(() => { /* ignore cleanup errors */ })
                }
            })
        })
    )

    const totalDuration = Date.now() - runStart
    const passed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'passed').length
    const failed = tests.length - passed

    log.info(
        `[Parallel] ${tests.length} tests: ${passed} passed, ${failed} failed in ${totalDuration}ms`
    )

    return failed
}
