import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'

import { collectTests, runParallelTests } from '../src/parallel.js'
import type { Suite } from 'mocha'

// ---------------------------------------------------------------------------
// Helpers to build mock Mocha suite trees
// ---------------------------------------------------------------------------

function mockTest(title: string, fn?: Function, pending?: boolean): any {
    return {
        title,
        fullTitle: () => title,
        fn: pending ? undefined : (fn || (() => {})),
        pending: pending || false,
        file: '/foo/bar.test.js'
    }
}

function mockSuite(title: string, opts?: {
    tests?: any[]
    suites?: any[]
    _beforeAll?: Function[]
    _afterAll?: Function[]
    _beforeEach?: Function[]
    _afterEach?: Function[]
}): Suite {
    return {
        title,
        tests: opts?.tests || [],
        suites: opts?.suites || [],
        _beforeAll: opts?._beforeAll || [],
        _afterAll: opts?._afterAll || [],
        _beforeEach: opts?._beforeEach || [],
        _afterEach: opts?._afterEach || [],
    } as unknown as Suite
}

// Helper to build a simplified ParallelBrowser for runParallelTests
function mockBrowser(opts?: { contexts?: string[]; store?: AsyncLocalStorage<string> }) {
    const store = opts?.store || new AsyncLocalStorage<string>()
    const contexts = opts?.contexts || ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4']
    let idx = 0
    return {
        isBidi: true,
        __parallelContextStore: store,
        __parallelContexts: new Set<string>(),
        __bidiCommandsEnabled: true,
        browsingContextCreate: vi.fn().mockImplementation(async () => {
            const ctx = contexts[idx++] || `ctx-${idx}`
            return { context: ctx }
        }),
        browsingContextClose: vi.fn().mockResolvedValue(undefined)
    } as any
}

// ===========================================================================
// TESTS: collectTests — parent-suite hook inheritance (Bug #3)
// ===========================================================================

describe('collectTests', () => {
    test('collects basic flat tests with their hooks', () => {
        const suite = mockSuite('root', {
            tests: [mockTest('test1'), mockTest('test2')],
            _beforeEach: [() => 'beforeEach1'],
            _afterEach: [() => 'afterEach1']
        })

        const collected = collectTests(suite)

        expect(collected).toHaveLength(2)
        expect(collected[0]._beforeEach).toHaveLength(1)
        expect(collected[0]._afterEach).toHaveLength(1)
        expect(collected[1]._beforeEach).toHaveLength(1)
    })

    test('inherits parent-suite beforeEach hooks in nested describes [currently BROKEN]', () => {
        const parentBeforeEach = [() => 'parent beforeEach']
        const parentAfterEach = [() => 'parent afterEach']
        const childBeforeEach = [() => 'child beforeEach']

        const childSuite = mockSuite('child', {
            tests: [mockTest('nested test')],
            _beforeEach: childBeforeEach
        })

        const rootSuite = mockSuite('parent', {
            suites: [childSuite],
            _beforeEach: parentBeforeEach,
            _afterEach: parentAfterEach
        })

        const collected = collectTests(rootSuite)

        expect(collected).toHaveLength(1)
        const test = collected[0]

        // BUG #3: parent beforeEach should come BEFORE child beforeEach,
        //         and parent afterEach should come AFTER child afterEach.
        //         Currently collectTests does NOT merge parent hooks.
        expect(test._beforeEach).toHaveLength(2)
        expect(test._beforeEach[0]).toBe(parentBeforeEach[0])
        expect(test._beforeEach[1]).toBe(childBeforeEach[0])

        // parent afterEach should run AFTER child afterEach
        // (no child afterEach, so just parent)
        expect(test._afterEach).toHaveLength(1)
        expect(test._afterEach[0]).toBe(parentAfterEach[0])
    })

    test('merges hooks through multiple nesting levels [currently BROKEN]', () => {
        const grandparentBefore = [() => 'gp beforeEach']
        const parentBefore = [() => 'p beforeEach']
        const childBefore = [() => 'c beforeEach']
        const grandparentAfter = [() => 'gp afterEach']

        const childSuite = mockSuite('child', {
            tests: [mockTest('deep test')],
            _beforeEach: childBefore
        })
        const parentSuite = mockSuite('parent', {
            suites: [childSuite],
            _beforeEach: parentBefore
        })
        const rootSuite = mockSuite('grandparent', {
            suites: [parentSuite],
            _beforeEach: grandparentBefore,
            _afterEach: grandparentAfter
        })

        const collected = collectTests(rootSuite)
        expect(collected).toHaveLength(1)

        // Bug #3: hooks should be merged: gp → p → c for beforeEach,
        //         c → gp for afterEach (parent has no afterEach)
        expect(collected[0]._beforeEach).toHaveLength(3)
        expect(collected[0]._beforeEach[0]).toBe(grandparentBefore[0])
        expect(collected[0]._beforeEach[1]).toBe(parentBefore[0])
        expect(collected[0]._beforeEach[2]).toBe(childBefore[0])

        expect(collected[0]._afterEach).toHaveLength(1)
        expect(collected[0]._afterEach[0]).toBe(grandparentAfter[0])
    })

    test('merges suite-level beforeAll/afterAll hooks through nesting', () => {
        const parentBeforeAll = [() => 'parent beforeAll']
        const parentAfterAll = [() => 'parent afterAll']
        const childBeforeAll = [() => 'child beforeAll']
        const childAfterAll = [() => 'child afterAll']

        const childSuite = mockSuite('child', {
            tests: [mockTest('nested test')],
            _beforeAll: childBeforeAll,
            _afterAll: childAfterAll,
        })
        const rootSuite = mockSuite('parent', {
            suites: [childSuite],
            _beforeAll: parentBeforeAll,
            _afterAll: parentAfterAll,
        })

        const collected = collectTests(rootSuite)
        expect(collected).toHaveLength(1)
        const test = collected[0]

        // beforeAll outermost-first, afterAll innermost-first (Mocha order)
        expect(test._beforeAll).toEqual([parentBeforeAll[0], childBeforeAll[0]])
        expect(test._afterAll).toEqual([childAfterAll[0], parentAfterAll[0]])
    })

    test('marks static pending tests (no fn) as pending', () => {
        const suite = mockSuite('root', {
            tests: [mockTest('pending test', undefined, true)],
        })

        const collected = collectTests(suite)
        expect(collected[0].pending).toBe(true)
    })
})

// ===========================================================================
// TESTS: runParallelTests — afterEach on failure (Bug #2)
// ===========================================================================

describe('runParallelTests', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        const capture = (event: string, payload: any) => {
            emittedEvents.push({ event, payload })
        }
        reporter.on('test:start', (p) => capture('test:start', p))
        reporter.on('test:pass', (p) => capture('test:pass', p))
        reporter.on('test:fail', (p) => capture('test:fail', p))
        reporter.on('test:end', (p) => capture('test:end', p))
    })

    test('calls afterEach on test pass', async () => {
        const afterEachFn = vi.fn()
        const testFn = vi.fn().mockResolvedValue(undefined)
        const suite = mockSuite('root', {
            tests: [mockTest('passing test', testFn)],
            _afterEach: [afterEachFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-a'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(afterEachFn).toBeCalledTimes(1)
        expect(browser.browsingContextClose).toBeCalledTimes(1)
    })

    test('calls afterEach on test failure [currently BROKEN]', async () => {
        const afterEachFn = vi.fn()
        const testFn = vi.fn().mockRejectedValue(new Error('test failed!'))
        const suite = mockSuite('root', {
            tests: [mockTest('failing test', testFn)],
            _afterEach: [afterEachFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-b'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // BUG #2: afterEach is currently SKIPPED on failure.
        //         This assertion should pass once fixed.
        expect(afterEachFn).toBeCalledTimes(1)

        // The test should still count as a failure
        expect(failures).toBe(1)

        // Verify context was cleaned up even after failure
        expect(browser.browsingContextClose).toBeCalledTimes(1)

        // Verify failure event was emitted
        const failEvent = emittedEvents.find(e => e.event === 'test:fail')
        expect(failEvent).toBeDefined()
        expect(failEvent.payload.error).toBeDefined()
    })

    test('calls afterEach on beforeEach failure [currently BROKEN]', async () => {
        const afterEachFn = vi.fn()
        const badBeforeEach = vi.fn().mockRejectedValue(new Error('beforeEach failed!'))
        const testFn = vi.fn() // should never reach this
        const suite = mockSuite('root', {
            tests: [mockTest('test with bad beforeEach', testFn)],
            _beforeEach: [badBeforeEach],
            _afterEach: [afterEachFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-c'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // BUG #2: afterEach is currently SKIPPED when beforeEach fails.
        expect(afterEachFn).toBeCalledTimes(1)
        expect(failures).toBe(1)
        expect(browser.browsingContextClose).toBeCalledTimes(1)
    })
})

// ===========================================================================
// TESTS: runParallelTests — suite-level before/after (Bug #4)
// ===========================================================================

describe('runParallelTests — suite hooks', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        const capture = (event: string, payload: any) => {
            emittedEvents.push({ event, payload })
        }
        reporter.on('test:start', (p) => capture('test:start', p))
        reporter.on('test:pass', (p) => capture('test:pass', p))
        reporter.on('test:fail', (p) => capture('test:fail', p))
        reporter.on('test:end', (p) => capture('test:end', p))
    })

    test('calls suite-level _beforeAll and _afterAll once per test', async () => {
        const callOrder: string[] = []
        const beforeAllFn = vi.fn().mockImplementation(() => { callOrder.push('beforeAll') })
        const afterAllFn = vi.fn().mockImplementation(() => { callOrder.push('afterAll') })
        const testFn = vi.fn().mockImplementation(() => { callOrder.push('test') })

        const suite = mockSuite('root', {
            tests: [mockTest('test1', testFn)],
            _beforeAll: [beforeAllFn],
            _afterAll: [afterAllFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-d'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // Suite hooks re-run per test (inside the test's browsing context)
        expect(beforeAllFn).toBeCalledTimes(1)
        expect(afterAllFn).toBeCalledTimes(1)
        // Strict per-test order with a single test
        expect(callOrder).toEqual(['beforeAll', 'test', 'afterAll'])
    })

    test('runs suite hooks once per test with per-test ordering', async () => {
        const callOrder: string[] = []
        let hookIdx = 0
        const beforeAllFn = vi.fn().mockImplementation(() => { callOrder.push(`beforeAll${hookIdx}`) })
        const afterAllFn = vi.fn().mockImplementation(() => { callOrder.push(`afterAll${hookIdx++}`) })
        const test1Fn = vi.fn().mockImplementation(() => { callOrder.push('test1') })
        const test2Fn = vi.fn().mockImplementation(() => { callOrder.push('test2') })

        const suite = mockSuite('root', {
            tests: [mockTest('test1', test1Fn), mockTest('test2', test2Fn)],
            _beforeAll: [beforeAllFn],
            _afterAll: [afterAllFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-e', 'ctx-f'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // 2 tests → hooks run twice each (once per test)
        expect(beforeAllFn).toBeCalledTimes(2)
        expect(afterAllFn).toBeCalledTimes(2)
        // Each test's chain keeps its internal order even though the two
        // tests execute concurrently: beforeAllN → testN → afterAllN
        expect(callOrder.indexOf('beforeAll0')).toBeLessThan(callOrder.indexOf('test1'))
        expect(callOrder.indexOf('test1')).toBeLessThan(callOrder.indexOf('afterAll0'))
        expect(callOrder.indexOf('beforeAll1')).toBeLessThan(callOrder.indexOf('test2'))
        expect(callOrder.indexOf('test2')).toBeLessThan(callOrder.indexOf('afterAll1'))
    })

    test('runs afterAll even when beforeAll fails', async () => {
        const beforeAllFn = vi.fn().mockRejectedValue(new Error('beforeAll failed'))
        const afterAllFn = vi.fn()
        const testFn = vi.fn()

        const suite = mockSuite('root', {
            tests: [mockTest('test1', testFn)],
            _beforeAll: [beforeAllFn],
            _afterAll: [afterAllFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-g'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(1)
        expect(testFn).not.toBeCalled()
        expect(afterAllFn).toBeCalledTimes(1)
        // Test never started — no test:start, but a test:fail is emitted
        const starts = emittedEvents.filter((e) => e.event === 'test:start')
        expect(starts.length).toBe(0)
    })

    test('batches tests respecting maxParallelContexts with fresh contexts per batch', async () => {
        const testFns = Array.from({ length: 6 }, (_, i) =>
            vi.fn().mockResolvedValue(undefined)
        )
        const suite = mockSuite('root', {
            tests: testFns.map((fn, i) => mockTest(`test${i}`, fn)),
        })

        const browser = mockBrowser({
            contexts: ['ctx-a', 'ctx-b', 'ctx-c', 'ctx-d', 'ctx-e', 'ctx-f'],
        })

        // maxParallelContexts=2, 6 tests → 3 batches × 2 contexts = 6 create calls
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2)

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(6)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(6)
        // All contexts registered at allocate time are unregistered after close
        expect((browser as unknown as { __parallelContexts: Set<string> }).__parallelContexts.size).toBe(0)
    })
})

// ===========================================================================
// TESTS: hook events, durations, skip/pending semantics
// ===========================================================================

describe('runParallelTests — hook events and pending', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        const capture = (event: string, payload: any) => {
            emittedEvents.push({ event, payload })
        }
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:pending', 'test:end', 'hook:start', 'hook:end']) {
            reporter.on(ev, (p) => capture(ev, p))
        }
    })

    test('emits paired hook:start/hook:end with shared uid and per-hook duration', async () => {
        const beforeEachFn = vi.fn().mockResolvedValue(undefined)
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeEach: [beforeEachFn],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        const starts = emittedEvents.filter((e) => e.event === 'hook:start')
        const ends = emittedEvents.filter((e) => e.event === 'hook:end')
        expect(starts.length).toBe(1)
        expect(ends.length).toBe(1)
        // start/end share a uid, anchored to the test uid (no cross-test collision)
        expect(starts[0].payload.uid).toBe(ends[0].payload.uid)
        expect(starts[0].payload.uid).toContain('test-0-0-0')
        expect(starts[0].payload.title).toBe('before each hook for "root"')
        expect(ends[0].payload.duration).toBeGreaterThanOrEqual(0)
        expect(ends[0].payload.state).toBe('pass')
    })

    test('reported test duration excludes hook time', async () => {
        const beforeEachFn = vi.fn().mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30))
        })
        const suite = mockSuite('root', {
            tests: [mockTest('slow hooks')],
            _beforeEach: [beforeEachFn],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        const pass = emittedEvents.find((e) => e.event === 'test:pass')
        expect(pass).toBeDefined()
        // beforeEach took ≥30ms but the reported duration is fn-only
        expect(pass.payload.duration).toBeLessThan(20)
    })

    test('this.skip() in a test emits test:pending, not a failure', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('skipped', function (this: any) { this.skip() })],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(0)
        const pending = emittedEvents.filter((e) => e.event === 'test:pending')
        const ends = emittedEvents.filter((e) => e.event === 'test:end')
        expect(pending.length).toBe(1)
        expect(ends.length).toBe(1)
        expect(ends[0].payload.pending).toBe(true)
        expect(emittedEvents.find((e) => e.event === 'test:fail')).toBeUndefined()
    })

    test('this.timeout() fails loudly instead of silently no-op', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('timeout', function (this: any) { this.timeout(1000) })],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(1)
        const fail = emittedEvents.find((e) => e.event === 'test:fail')
        expect(fail.payload.error.message).toContain('this.timeout() is not supported')
    })

    test('static pending tests emit test:pending without test:start or hooks', async () => {
        const beforeAllFn = vi.fn()
        const suite = mockSuite('root', {
            tests: [mockTest('pending test', undefined, true)],
            _beforeAll: [beforeAllFn],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(0)
        expect(beforeAllFn).not.toBeCalled()
        expect(emittedEvents.filter((e) => e.event === 'test:start')).toHaveLength(0)
        expect(emittedEvents.filter((e) => e.event === 'test:pending')).toHaveLength(1)
    })

    test('this.skip() in a suite before() hook emits test:pending, not a failure', async () => {
        const afterAllFn = vi.fn()
        const suite = mockSuite('root', {
            tests: [mockTest('skipped by suite hook', () => {})],
            _beforeAll: [function (this: any) { this.skip() }],
            _afterAll: [afterAllFn],
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // Mocha marks the suite's tests pending when before() skips
        expect(failures).toBe(0)
        const pending = emittedEvents.filter((e) => e.event === 'test:pending')
        expect(pending.length).toBe(1)
        expect(pending[0].payload.pending).toBe(true)
        expect(emittedEvents.find((e) => e.event === 'test:fail')).toBeUndefined()
        // afterAll still runs after a skipped test — Mocha parity
        expect(afterAllFn).toBeCalledTimes(1)
    })
})
