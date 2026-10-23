import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { logMock } from '../../../__mocks__/@wdio/logger.js'

import { collectTests, parseTimeoutString, runParallelTests } from '../src/parallel.js'
import type { Suite } from 'mocha'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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

// Mocha Hook objects carry their declaring suite and original title; fns here stand in for them
function mockHook(title: string, parent: { title: string, tests?: { title: string }[] }, fn: Function = () => {}): any {
    return Object.assign(function (this: unknown, ...args: unknown[]) { return fn.apply(this, args) }, { title, parent: { tests: [], ...parent } })
}

// Helper to build a simplified ParallelBrowser for runParallelTests
function mockBrowser(opts?: { contexts?: string[]; store?: AsyncLocalStorage<string> }) {
    const store = opts?.store || new AsyncLocalStorage<string>()
    const contexts = opts?.contexts || ['ctx-0', 'ctx-1', 'ctx-2', 'ctx-3', 'ctx-4']
    let idx = 0
    let userIdx = 0
    return {
        isBidi: true,
        __parallelContextStore: store,
        __parallelContexts: new Set<string>(),
        __bidiCommandsEnabled: true,
        browsingContextCreate: vi.fn().mockImplementation(async () => {
            const ctx = contexts[idx++] || `ctx-${idx}`
            return { context: ctx }
        }),
        browsingContextClose: vi.fn().mockResolvedValue(undefined),
        browserCreateUserContext: vi.fn().mockImplementation(async () => ({ userContext: `uc-${userIdx++}` })),
        browserRemoveUserContext: vi.fn().mockResolvedValue(undefined)
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
        // WDIOReporter needs test:start before test:fail
        expect(emittedEvents.map((e) => e.event)).toEqual(['test:start', 'test:fail', 'test:end'])
    })

    test('runs every test in a fresh context and closes every context it created', async () => {
        const testFns = Array.from({ length: 6 }, (_, i) =>
            vi.fn().mockResolvedValue(undefined)
        )
        const suite = mockSuite('root', {
            tests: testFns.map((fn, i) => mockTest(`test${i}`, fn)),
        })

        const browser = mockBrowser({
            contexts: ['ctx-a', 'ctx-b', 'ctx-c', 'ctx-d', 'ctx-e', 'ctx-f'],
        })

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
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeEach: [mockHook('"before each" hook', { title: 'root' })],
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
        expect(starts[0].payload.title).toBe('"before each" hook for root')
        expect(ends[0].payload.duration).toBeGreaterThanOrEqual(0)
        expect(ends[0].payload.state).toBe('pass')
    })

    const hookTitles = async (suite: Suite) => {
        await runParallelTests(suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        return emittedEvents.filter((e) => e.event === 'hook:start').map((e) => e.payload.title)
    }

    test('titles describe-level hooks like sequential mode, dropping the function name', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook: setup', { title: 'A' })],
            _beforeEach: [mockHook('"before each" hook: prep', { title: 'A' })],
            _afterEach: [mockHook('"after each" hook', { title: 'A' })],
            _afterAll: [mockHook('"after all" hook', { title: 'A' })],
        })
        expect(await hookTitles(suite)).toEqual([
            '"before all" hook for A',
            '"before each" hook for A',
            '"after each" hook for A',
            '"after all" hook for A',
        ])
    })

    test('titles hooks of an outer describe with the outer suite for tests in a nested describe', async () => {
        const outer = { title: 'A' }
        const inner = mockSuite('A.inner', { tests: [mockTest('t1')] })
        const suite = mockSuite('', {
            suites: [mockSuite('A', {
                suites: [inner],
                _beforeEach: [mockHook('"before each" hook', outer)],
            })]
        })
        expect(await hookTitles(suite)).toEqual(['"before each" hook for A'])
    })

    test('dot-joins the hook fullTitle from the native title and the declaring suite path', async () => {
        const outer = { title: 'A', parent: { title: 'top' }, tests: [{ title: 'a1' }] }
        const suite = mockSuite('', {
            suites: [mockSuite('A', {
                tests: [mockTest('t1')],
                _beforeAll: [mockHook('"before all" hook: setup', outer)],
                _beforeEach: [mockHook('"before each" hook', outer)],
                _afterAll: [mockHook('"after all" hook', { title: 'A', tests: [] })],
            })]
        })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(emittedEvents.filter((e) => e.event === 'hook:start').map((e) => e.payload.fullTitle)).toEqual([
            'top.A."before all" hook: setup for "a1"',
            'top.A."before each" hook for "t1"',
            'A."after all" hook in "A"',
        ])
    })

    test('keeps the native Mocha title, function name included, for root-level hooks', async () => {
        const root = { title: '', tests: [{ title: 'first' }, { title: 'last' }] }
        const suite = mockSuite('', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook: boot', root)],
            _beforeEach: [mockHook('"before each" hook: prep', root)],
            _afterAll: [mockHook('"after all" hook', root)],
        })
        expect(await hookTitles(suite)).toEqual([
            '"before all" hook: boot for "first"',
            '"before each" hook: prep for "t1"',
            '"after all" hook for "last"',
        ])
    })

    test('uses "in {root}" for root-level suite hooks when the root has no tests', async () => {
        const suite = mockSuite('', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook', { title: '', root: true, tests: [] })],
        })
        expect(await hookTitles(suite)).toEqual(['"before all" hook in "{root}"'])
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

// ===========================================================================
// TESTS: the events of a sequential Mocha run
// ===========================================================================

describe('runParallelTests — sequential event parity', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:pending', 'test:end', 'hook:start', 'hook:end']) {
            reporter.on(ev, (p) => emittedEvents.push({ event: ev, payload: p }))
        }
    })

    const order = () => emittedEvents.map((e) => e.event.startsWith('hook:') ? `${e.event} ${e.payload.title}` : e.event)
    const withHooks = (fn?: Function) => mockSuite('root', {
        tests: [mockTest('t1', fn)],
        _beforeAll: [mockHook('"before all" hook', { title: 'root' })],
        _beforeEach: [mockHook('"before each" hook', { title: 'root' })],
        _afterEach: [mockHook('"after each" hook', { title: 'root' })],
        _afterAll: [mockHook('"after all" hook', { title: 'root' })],
    })
    const hooksAfterResult = (result: string) => [
        'hook:start "before all" hook for root', 'hook:end "before all" hook for root',
        'test:start',
        'hook:start "before each" hook for root', 'hook:end "before each" hook for root',
        result, 'test:end',
        'hook:start "after each" hook for root', 'hook:end "after each" hook for root',
        'hook:start "after all" hook for root', 'hook:end "after all" hook for root',
    ]

    test('fails at start when a test has Mocha retries from its describe or from it().retries()', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1'), { ...mockTest('t2'), _retries: 1 }] })
        await expect(runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js']))
            .rejects.toThrow('retries is not supported in parallel mode (parallelMode: "contexts"): "t2" has 1 retry')
        expect(emittedEvents).toEqual([])
    })

    test('sends context:end after the after hooks of a test, with its uid and context', async () => {
        reporter.on('context:end', (p) => emittedEvents.push({ event: 'context:end', payload: p }))
        await runParallelTests(withHooks() as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(order()).toEqual([...hooksAfterResult('test:pass'), 'context:end'])
        const start = emittedEvents.find((e) => e.event === 'test:start').payload
        expect(emittedEvents.at(-1).payload).toEqual({
            type: 'context:end', cid: '0-0', specs: ['/spec.js'], uid: start.uid, contextId: start.contextId,
        })
    })

    test.each([
        ['a static pending test', mockSuite('root', { tests: [{ ...mockTest('t1'), pending: true }] })],
        ['a test whose before hook fails', mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook', { title: 'root' }, () => { throw new Error('boom') })],
        })],
    ])('sends context:end for %s', async (_name, suite) => {
        const ended: string[] = []
        reporter.on('context:end', (p) => ended.push(p.uid))
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(ended).toEqual(['test-0-0-0'])
    })

    test('sends the result of a passing test before its afterEach and after hooks', async () => {
        await runParallelTests(withHooks() as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(order()).toEqual(hooksAfterResult('test:pass'))
    })

    test('sends the result of a failing test before its afterEach and after hooks', async () => {
        await runParallelTests(withHooks(() => { throw new Error('boom') }) as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(order()).toEqual(hooksAfterResult('test:fail'))
    })

    test('sends the result of a test that calls this.skip() before its afterEach and after hooks', async () => {
        await runParallelTests(withHooks(function (this: any) { this.skip() }) as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(order()).toEqual(hooksAfterResult('test:pending'))
    })

    test('sends the result of a test that a before hook skips before the after hooks', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook', { title: 'root' }, function (this: any) { this.skip() })],
            _afterAll: [mockHook('"after all" hook', { title: 'root' })],
        })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(order()).toEqual([
            'hook:start "before all" hook for root', 'hook:end "before all" hook for root',
            'test:pending', 'test:end',
            'hook:start "after all" hook for root', 'hook:end "after all" hook for root',
        ])
    })

    test.each([
        ['before all', '_beforeAll'],
        ['before each', '_beforeEach'],
    ])('reports this.skip() in a %s hook as a pending hook, not as a failure', async (kind, key) => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            [key]: [mockHook(`"${kind}" hook`, { title: 'root' }, function (this: any) { this.skip() })],
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(0)
        const hookEnd = emittedEvents.find((e) => e.event === 'hook:end')
        expect(hookEnd.payload.error).toBeUndefined()
        expect(hookEnd.payload.pending).toBe(true)
        expect(hookEnd.payload.state).not.toBe('fail')
        expect(emittedEvents.filter((e) => e.event === 'test:pending')).toHaveLength(1)
        expect(emittedEvents.find((e) => e.event === 'test:fail')).toBeUndefined()
    })

    test('fails this.skip() in an after all hook with Mocha\'s "`this.skip` forbidden", as a sequential run does', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _afterAll: [mockHook('"after all" hook', { title: 'root' }, function (this: any) { this.skip() })],
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(1)
        const hookEnd = emittedEvents.filter((e) => e.event === 'hook:end').at(-1)
        expect(hookEnd.payload.error.message).toBe('`this.skip` forbidden')
        expect(hookEnd.payload.pending).not.toBe(true)
        expect(emittedEvents.filter((e) => e.event === 'test:pass')).toHaveLength(1)
    })

    test('sends the type, expected and actual values of an assertion error, as a sequential run does', async () => {
        const assertion = Object.assign(new Error('expected 2 to equal 1'), { name: 'AssertionError', expected: 1, actual: 2 })
        const suite = mockSuite('root', {
            tests: [mockTest('t1', () => { throw assertion })],
            _afterEach: [mockHook('"after each" hook', { title: 'root' }, () => { throw assertion })],
        })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        const expected = { name: 'AssertionError', message: 'expected 2 to equal 1', type: 'AssertionError', expected: 1, actual: 2 }
        expect(emittedEvents.find((e) => e.event === 'test:fail').payload.error).toMatchObject(expected)
        expect(emittedEvents.find((e) => e.event === 'test:end').payload.error).toMatchObject(expected)
        expect(emittedEvents.find((e) => e.event === 'hook:end').payload.error).toMatchObject(expected)
    })

    test.each([
        ['before all', '_beforeAll', '"before all" hook for "t1"'],
        ['before each', '_beforeEach', '"before each" hook for "t2"'],
    ])('fails a test that a failing %s hook skips with the text of Mocha', async (kind, key, hookTitle) => {
        const hookError = new Error('hook boom')
        const suite = mockSuite('root', {
            tests: [mockTest('t2')],
            [key]: [mockHook(`"${kind}" hook`, { title: 'root', tests: [{ title: 't1' }, { title: 't2' }] }, () => { throw hookError })],
        })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        const fail = emittedEvents.find((e) => e.event === 'test:fail')
        expect(fail.payload.error.message).toBe(`Test skipped due to failure in hook "${hookTitle}": hook boom`)
        expect(fail.payload.error.stack).toBe(hookError.stack)
    })

    test.each([
        ['before all', '_beforeAll', ['hook:start', 'hook:end']],
        ['before each', '_beforeEach', ['test:start', 'hook:start', 'hook:end']],
    ])('reports only the failing %s hook with failHookAffectedTests: false', async (kind, key, events) => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            [key]: [mockHook(`"${kind}" hook`, { title: 'root' }, () => { throw new Error('hook boom') })],
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], undefined, { failHookAffectedTests: false })

        expect(failures).toBe(1)
        expect(emittedEvents.map((e) => e.event)).toEqual(events)
    })

    test('gives the wdio shim the Mocha timeout error of the test', async () => {
        let timeoutError: any
        const fn = function (this: any) { timeoutError = this._runnable._timeoutError(4000) }
        const suite = mockSuite('root', { tests: [mockTest('t1', fn)] })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(timeoutError.message).toBe('Timeout of 4000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves. (/foo/bar.test.js)')
        expect(timeoutError.code).toBe('ERR_MOCHA_TIMEOUT')
    })

    test('reports a timeout with the text of a sequential run', async () => {
        const suite = mockSuite('root', { tests: [mockTest('hangs forever', () => new Promise(() => {}))] })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], undefined, { timeout: 20 })

        expect(emittedEvents.find((e) => e.event === 'test:fail').payload.error.message).toBe(
            'Timeout of 20ms exceeded. The execution in the test "root hangs forever" took too long. Try to reduce the run time ' +
            'or increase your timeout for test specs (https://webdriver.io/docs/timeouts). (/foo/bar.test.js)'
        )
    })
})

// ===========================================================================
// TESTS: runParallelTests — grep/invert filtering
// ===========================================================================

describe('runParallelTests — grep/invert filtering', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        const capture = (event: string, payload: any) => {
            emittedEvents.push({ event, payload })
        }
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:end', 'test:pending', 'suite:start', 'suite:end']) {
            reporter.on(ev, (p) => capture(ev, p))
        }
    })

    test('runs only tests matching grep', async () => {
        const alpha = vi.fn().mockResolvedValue(undefined)
        const beta = vi.fn().mockResolvedValue(undefined)
        const gamma = vi.fn().mockResolvedValue(undefined)
        const suite = mockSuite('root', {
            tests: [mockTest('alpha one', alpha), mockTest('beta two', beta), mockTest('gamma three', gamma)],
        })

        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { grep: /beta/ })

        expect(failures).toBe(0)
        expect(alpha).not.toBeCalled()
        expect(beta).toBeCalledTimes(1)
        expect(gamma).not.toBeCalled()
        // only the matching test gets a context
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(1)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
        const passes = emittedEvents.filter((e) => e.event === 'test:pass')
        expect(passes).toHaveLength(1)
        expect(passes[0].payload.title).toBe('beta two')
    })

    test('invert runs everything except the grep match', async () => {
        const alpha = vi.fn().mockResolvedValue(undefined)
        const beta = vi.fn().mockResolvedValue(undefined)
        const gamma = vi.fn().mockResolvedValue(undefined)
        const suite = mockSuite('root', {
            tests: [mockTest('alpha one', alpha), mockTest('beta two', beta), mockTest('gamma three', gamma)],
        })

        const browser = mockBrowser({ contexts: ['ctx-a', 'ctx-b'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { grep: /beta/, invert: true })

        expect(failures).toBe(0)
        expect(alpha).toBeCalledTimes(1)
        expect(beta).not.toBeCalled()
        expect(gamma).toBeCalledTimes(1)
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(2)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(2)
    })

    test('grep excludes suites without matching tests from suite events', async () => {
        const alphaFn = vi.fn().mockResolvedValue(undefined)
        const betaFn = vi.fn().mockResolvedValue(undefined)
        const suiteA = mockSuite('suiteA', { tests: [mockTest('beta match', betaFn)] })
        const suiteB = mockSuite('suiteB', { tests: [mockTest('alpha only', alphaFn)] })
        const suite = mockSuite('root', { suites: [suiteA, suiteB] })

        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { grep: /beta/ })

        expect(failures).toBe(0)
        expect(betaFn).toBeCalledTimes(1)
        expect(alphaFn).not.toBeCalled()
        // mocha never emits suite events for suites with no matching tests
        const suiteStarts = emittedEvents.filter((e) => e.event === 'suite:start')
        const suiteEnds = emittedEvents.filter((e) => e.event === 'suite:end')
        expect(suiteStarts.map((e) => e.payload.title)).toEqual(['suiteA'])
        expect(suiteEnds.map((e) => e.payload.title)).toEqual(['suiteA'])
    })

    test('never emits the root suite and parents top-level describes to null', async () => {
        const suiteA = mockSuite('suiteA', { tests: [mockTest('a1')] })
        const suiteB = mockSuite('suiteB', { tests: [mockTest('b1')] })
        const suite = mockSuite('', { suites: [suiteA, suiteB] })

        const browser = mockBrowser({ contexts: ['ctx-a', 'ctx-b'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        const starts = emittedEvents.filter((e) => e.event === 'suite:start').map((e) => e.payload)
        expect(starts.map((p) => [p.title, p.parentUid])).toEqual([['suiteA', null], ['suiteB', null]])
    })
})

// ===========================================================================
// TESTS: parseTimeoutString — mocha-compatible timeout strings
// ===========================================================================

describe('parseTimeoutString', () => {
    test('parses plain numbers as milliseconds', () => {
        expect(parseTimeoutString('100')).toBe(100)
    })

    test('parses unit suffixes case-insensitively', () => {
        expect(parseTimeoutString('100ms')).toBe(100)
        expect(parseTimeoutString('2s')).toBe(2000)
        expect(parseTimeoutString('3M')).toBe(180000)
        expect(parseTimeoutString('1H')).toBe(3600000)
    })

    test('parses decimal values like mocha/ms', () => {
        expect(parseTimeoutString('2.5s')).toBe(2500)
        expect(parseTimeoutString('0.5 seconds')).toBe(500)
    })

    test('parses unit words like mocha/ms', () => {
        expect(parseTimeoutString('10 seconds')).toBe(10000)
        expect(parseTimeoutString('5 minutes')).toBe(300000)
        expect(parseTimeoutString('2 hours')).toBe(7200000)
        expect(parseTimeoutString('1 millisecond')).toBe(1)
        expect(parseTimeoutString('3 milliseconds')).toBe(3)
    })

    test('returns undefined for invalid or multi-segment strings', () => {
        expect(parseTimeoutString('1h 30m')).toBeUndefined()
        expect(parseTimeoutString('foo')).toBeUndefined()
        expect(parseTimeoutString('100xx')).toBeUndefined()
    })
})

// ===========================================================================
// TESTS: runParallelTests — per-test timeout
// ===========================================================================

describe('runParallelTests — per-test timeout', () => {
    let reporter: EventEmitter
    let emittedEvents: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emittedEvents = []
        const capture = (event: string, payload: any) => {
            emittedEvents.push({ event, payload })
        }
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:end']) {
            reporter.on(ev, (p) => capture(ev, p))
        }
    })

    test('fails a test that exceeds the configured timeout', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('hangs forever', () => new Promise(() => {}))],
        })
        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: 20 })

        expect(failures).toBe(1)
        const fail = emittedEvents.find((e) => e.event === 'test:fail')
        expect(fail).toBeDefined()
        expect(fail.payload.error.message).toContain('Timeout of 20ms exceeded')
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
    })

    test('string timeouts are parsed like mocha (e.g. "100ms")', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('hangs forever', () => new Promise(() => {}))],
        })
        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: '100ms' })

        expect(failures).toBe(1)
        const fail = emittedEvents.find((e) => e.event === 'test:fail')
        expect(fail.payload.error.message).toContain('Timeout of 100ms exceeded')
    })

    test('fails the test when a beforeEach hook exceeds the timeout', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('hangs in beforeEach', () => {})],
            _beforeEach: [() => new Promise(() => {})],
        })
        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: 20 })

        expect(failures).toBe(1)
        const fail = emittedEvents.find((e) => e.event === 'test:fail')
        expect(fail).toBeDefined()
        expect(fail.payload.error.message).toContain('Timeout of 20ms exceeded')
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
    })

    test('timeout: 0 disables the timeout race', async () => {
        const slow = vi.fn().mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 30))
        })
        const suite = mockSuite('root', { tests: [mockTest('slow but finishes', slow)] })
        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: 0 })

        expect(failures).toBe(0)
        expect(slow).toBeCalledTimes(1)
    })

    test('defaults to the mocha timeout of 2000ms when unset', async () => {
        const quick = vi.fn().mockResolvedValue(undefined)
        const suite = mockSuite('root', { tests: [mockTest('quick', quick)] })
        const browser = mockBrowser({ contexts: ['ctx-a'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(0)
        expect(quick).toBeCalledTimes(1)
    })

    test('exposes the resolved timeout and full title on this._runnable for the wdio shim', async () => {
        let runnable: any
        const fn = function (this: any) { runnable = this._runnable }
        const suite = mockSuite('root', {
            suites: [mockSuite('outer', { tests: [{ ...mockTest('my test', fn), fullTitle: () => 'outer my test' }] })],
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], undefined, { timeout: 60000 })

        expect(failures).toBe(0)
        expect(runnable._timeout).toBe(60000)
        expect(runnable.title).toBe('my test')
        expect(runnable.fullTitle()).toBe('outer my test')
    })

    describe('grace period after timeout', () => {
        const flushUntil = async (cond: () => boolean) => {
            for (let i = 0; i < 100 && !cond(); i++) {
                await new Promise((resolve) => setImmediate(resolve))
            }
        }

        beforeEach(() => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
            return () => { vi.useRealTimers() }
        })

        test('waits for a timed-out test fn to settle before running afterEach and cleanup', async () => {
            const order: string[] = []
            const testFn = vi.fn(() => new Promise<void>((resolve) => setTimeout(() => {
                order.push('fn settled')
                resolve()
            }, 150)))
            const afterEachFn = vi.fn(() => { order.push('afterEach') })
            const suite = mockSuite('root', {
                tests: [mockTest('slow afterTest', testFn)],
                _afterEach: [afterEachFn]
            })
            const browser = mockBrowser({ contexts: ['ctx-a'] })
            browser.browsingContextClose.mockImplementation(async () => { order.push('close') })

            const run = runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: 100 })
            await flushUntil(() => testFn.mock.calls.length > 0)
            await vi.advanceTimersByTimeAsync(100)
            expect(order).toEqual([])
            await vi.advanceTimersByTimeAsync(50)
            const failures = await run

            expect(failures).toBe(1)
            expect(order).toEqual(['fn settled', 'afterEach', 'close'])
            const fail = emittedEvents.find((e) => e.event === 'test:fail')
            expect(fail.payload.error.message).toContain('Timeout of 100ms exceeded')
        })

        test('rejects after twice the timeout when the fn never settles', async () => {
            const testFn = vi.fn(() => new Promise(() => {}))
            const suite = mockSuite('root', { tests: [mockTest('hangs forever', testFn)] })
            const browser = mockBrowser({ contexts: ['ctx-a'] })

            const run = runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, { timeout: 100 })
            await flushUntil(() => testFn.mock.calls.length > 0)
            await vi.advanceTimersByTimeAsync(199)
            expect(emittedEvents.find((e) => e.event === 'test:fail')).toBeUndefined()
            await vi.advanceTimersByTimeAsync(1)
            const failures = await run

            expect(failures).toBe(1)
            const fail = emittedEvents.find((e) => e.event === 'test:fail')
            expect(fail.payload.error.message).toContain('Timeout of 100ms exceeded')
            expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
        })
    })
})

describe('runParallelTests — hook failure counting', () => {
    let reporter: EventEmitter
    let emitted: any[]

    beforeEach(() => {
        reporter = new EventEmitter()
        emitted = []
        for (const ev of ['test:start', 'test:pass', 'test:fail', 'test:pending', 'hook:end']) {
            reporter.on(ev, (p) => emitted.push({ event: ev, payload: p }))
        }
    })

    test('afterEach throwing keeps the test passed but adds one failure', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _afterEach: [() => { throw new Error('teardown boom') }]
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(1)
        expect(emitted.some((e) => e.event === 'test:pass')).toBe(true)
        expect(emitted.some((e) => e.event === 'test:fail')).toBe(false)
        const hookEnd = emitted.find((e) => e.event === 'hook:end')
        expect(hookEnd.payload.state).toBe('fail')
        expect(hookEnd.payload.error.message).toBe('teardown boom')
    })

    test('afterAll throwing adds one failure per failing hook', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _afterEach: [() => { throw new Error('a') }],
            _afterAll: [() => { throw new Error('b') }]
        })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(failures).toBe(2)
    })
})

describe('runParallelTests — reporter contextId', () => {
    const EVENTS = ['test:start', 'test:pass', 'test:fail', 'test:pending', 'test:end', 'hook:start', 'hook:end']
    const collect = (reporter: EventEmitter) => {
        const events: any[] = []
        for (const ev of EVENTS) {
            reporter.on(ev, (p) => events.push({ event: ev, payload: p }))
        }
        return events
    }

    test('test:start and test:pending carry the browsing context id', async () => {
        const reporter = new EventEmitter()
        const events = collect(reporter)
        const suite = mockSuite('root', { tests: [mockTest('t1'), mockTest('t2', undefined, true)] })
        const browser = mockBrowser({ contexts: ['ctx-a', 'ctx-b'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        expect(events.find((e) => e.event === 'test:start').payload.contextId).toBe('ctx-a')
        expect(events.find((e) => e.event === 'test:pending').payload.contextId).toBe('ctx-b')
    })

    test('hooks, pass and the closing test:end carry the context id', async () => {
        const reporter = new EventEmitter()
        const events = collect(reporter)
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeEach: [mockHook('"before each" hook', { title: 'root' })],
        })
        await runParallelTests(suite as Suite, mockBrowser({ contexts: ['ctx-a'] }), reporter, '0-0', ['/spec.js'])

        for (const ev of ['hook:start', 'hook:end', 'test:pass', 'test:end']) {
            expect(events.find((e) => e.event === ev).payload.contextId, ev).toBe('ctx-a')
        }
    })

    test('test:fail and its test:end carry the context id', async () => {
        const reporter = new EventEmitter()
        const events = collect(reporter)
        const suite = mockSuite('root', { tests: [mockTest('t1', () => { throw new Error('boom') })] })
        await runParallelTests(suite as Suite, mockBrowser({ contexts: ['ctx-a'] }), reporter, '0-0', ['/spec.js'])

        for (const ev of ['test:fail', 'test:end']) {
            expect(events.find((e) => e.event === ev).payload.contextId, ev).toBe('ctx-a')
        }
    })

    test('static pending test:end carries the context id', async () => {
        const reporter = new EventEmitter()
        const events = collect(reporter)
        const suite = mockSuite('root', { tests: [mockTest('t1', undefined, true)] })
        await runParallelTests(suite as Suite, mockBrowser({ contexts: ['ctx-a'] }), reporter, '0-0', ['/spec.js'])

        expect(events.find((e) => e.event === 'test:end').payload.contextId).toBe('ctx-a')
    })

    test('the synthetic test:start, test:fail and test:end of a failing before hook carry the context id', async () => {
        const reporter = new EventEmitter()
        const events = collect(reporter)
        const suite = mockSuite('root', {
            tests: [mockTest('t1')],
            _beforeAll: [mockHook('"before all" hook', { title: 'root' }, () => { throw new Error('setup') })],
        })
        await runParallelTests(suite as Suite, mockBrowser({ contexts: ['ctx-a'] }), reporter, '0-0', ['/spec.js'])

        for (const ev of ['hook:end', 'test:start', 'test:fail', 'test:end']) {
            expect(events.find((e) => e.event === ev).payload.contextId, ev).toBe('ctx-a')
        }
    })
})

describe('runParallelTests — userContexts mode', () => {
    const reporter = new EventEmitter()
    const opts = { mode: 'userContexts' as const }

    test('creates a user context per test and opens the tab inside it', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1'), mockTest('t2')] })
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, opts)

        expect(browser.browserCreateUserContext).toHaveBeenCalledTimes(2)
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window', userContext: 'uc-0' })
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window', userContext: 'uc-1' })
    })

    test('closes the tab before removing the user context and clears the registry', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1')] })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, opts)

        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-0' })
        expect(browser.browsingContextClose.mock.invocationCallOrder[0])
            .toBeLessThan(browser.browserRemoveUserContext.mock.invocationCallOrder[0])
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('cleans up in the same order when the test fails', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1', () => { throw new Error('nope') })] })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, opts)

        expect(failures).toBe(1)
        expect(browser.browsingContextClose.mock.invocationCallOrder[0])
            .toBeLessThan(browser.browserRemoveUserContext.mock.invocationCallOrder[0])
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('rolls back created contexts and user contexts when a later create rejects', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1'), mockTest('t2')] })
        const browser = mockBrowser({ contexts: ['ctx-0', 'ctx-1'] })
        let calls = 0
        browser.browserCreateUserContext.mockImplementation(async () => {
            if (calls++ === 1) {
                throw new Error('create failed')
            }
            return { userContext: 'uc-ok' }
        })

        await expect(
            runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, opts)
        ).rejects.toThrow('create failed')
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-ok' })
        expect(browser.browsingContextClose.mock.invocationCallOrder[0])
            .toBeLessThan(browser.browserRemoveUserContext.mock.invocationCallOrder[0])
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('removes the user context when its tab fails to open', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1')] })
        const browser = mockBrowser({ contexts: ['ctx-0'] })
        browser.browsingContextCreate.mockRejectedValue(new Error('tab failed'))

        await expect(
            runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], undefined, opts)
        ).rejects.toThrow('tab failed')
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-0' })
    })

    test('throws naming browser.createUserContext on an unsupported driver, but contexts mode still runs', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1')] })
        const unsupported = () => {
            const browser = mockBrowser({ contexts: ['ctx-0'] })
            delete browser.browserCreateUserContext
            delete browser.browserRemoveUserContext
            return browser
        }

        await expect(
            runParallelTests(suite as Suite, unsupported(), reporter, '0-0', ['/spec.js'], undefined, opts)
        ).rejects.toThrow('browser.createUserContext')
        const failures = await runParallelTests(suite as Suite, unsupported(), reporter, '0-0', ['/spec.js'])
        expect(failures).toBe(0)
    })

    test('non-finite or non-positive maxParallelContexts falls back instead of producing phantom failures', async () => {
        for (const bad of ['abc' as any, Infinity, NaN, 0, -3]) {
            const suite = mockSuite('root', { tests: [mockTest('t1'), mockTest('t2')] })
            const browser = mockBrowser()
            const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], bad)
            expect(failures).toBe(0)
            expect(browser.browsingContextCreate).toHaveBeenCalledTimes(2)
        }
    })

    test('fractional maxParallelContexts below 1 still advances and runs every test', async () => {
        const suite = mockSuite('root', { tests: [mockTest('t1'), mockTest('t2')] })
        const browser = mockBrowser()
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 0.5)
        expect(failures).toBe(0)
        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(2)
    })
})

describe('runParallelTests — worker pool', () => {
    const reporter = new EventEmitter()
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    test('never runs more tests than maxParallelContexts and keeps live contexts bounded', async () => {
        let inFlight = 0
        let maxInFlight = 0
        const body = async () => {
            inFlight++
            maxInFlight = Math.max(maxInFlight, inFlight)
            await sleep(5)
            inFlight--
        }
        const suite = mockSuite('root', { tests: Array.from({ length: 8 }, (_, i) => mockTest(`t${i}`, body)) })
        const browser = mockBrowser()
        let live = 0
        let maxLive = 0
        browser.browsingContextCreate.mockImplementation(async () => {
            maxLive = Math.max(maxLive, ++live)
            return { context: `ctx-${maxLive}-${Math.random()}` }
        })
        browser.browsingContextClose.mockImplementation(async () => { live-- })

        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2)

        expect(failures).toBe(0)
        expect(maxInFlight).toBe(2)
        expect(maxLive).toBeLessThanOrEqual(4)
        expect(live).toBe(0)
    })

    test('contexts mode creates a window (never a tab) for every context incl. prefetched', async () => {
        const suite = mockSuite('root', { tests: Array.from({ length: 5 }, (_, i) => mockTest(`t${i}`)) })
        const browser = mockBrowser()
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2)

        const calls = browser.browsingContextCreate.mock.calls
        expect(calls.length).toBeGreaterThanOrEqual(5)
        for (const [params] of calls) {
            expect(params).toEqual({ type: 'window' })
        }
    })

    test('a slow test does not block other slots', async () => {
        const finished: string[] = []
        const make = (name: string, ms: number) => mockTest(name, async () => { await sleep(ms); finished.push(name) })
        const suite = mockSuite('root', {
            tests: [make('slow', 80), make('f1', 5), make('f2', 5), make('f3', 5)]
        })
        await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], 2)

        expect(finished).toEqual(['f1', 'f2', 'f3', 'slow'])
    })

    test('all closes finish before resolving, even when tests throw', async () => {
        const browser = mockBrowser()
        let closed = 0
        browser.browsingContextClose.mockImplementation(async () => { await sleep(20); closed++ })
        const suite = mockSuite('root', {
            tests: [mockTest('a', () => { throw new Error('boom') }), mockTest('b'), mockTest('c')]
        })
        const failures = await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2)

        expect(failures).toBe(1)
        expect(closed).toBe(browser.browsingContextCreate.mock.calls.length)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('does not wait for a close before starting the next test on that slot', async () => {
        const browser = mockBrowser()
        browser.browsingContextClose.mockImplementation(async () => { await sleep(60) })
        const starts: number[] = []
        const t0 = Date.now()
        const body = () => { starts.push(Date.now() - t0) }
        const suite = mockSuite('root', { tests: [mockTest('a', body), mockTest('b', body)] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 1)

        expect(starts[1] - starts[0]).toBeLessThan(40)
    })

    test('keeps close-before-remove order per allocation in userContexts mode with concurrent slots', async () => {
        const order: string[] = []
        const browser = mockBrowser()
        const ownerOf = new Map<string, string>()
        browser.browsingContextCreate.mockImplementation(async ({ userContext }: any) => {
            const context = `ctx-of-${userContext}`
            ownerOf.set(context, userContext)
            return { context }
        })
        browser.browsingContextClose.mockImplementation(async ({ context }: any) => {
            await sleep(5)
            order.push(`${ownerOf.get(context)}:close`)
        })
        browser.browserRemoveUserContext.mockImplementation(async ({ userContext }: any) => {
            order.push(`${userContext}:remove`)
        })
        const suite = mockSuite('root', { tests: [mockTest('a'), mockTest('b'), mockTest('c')] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2, { mode: 'userContexts' })

        const userContexts = [...ownerOf.values()]
        expect(userContexts.length).toBeGreaterThanOrEqual(3)
        for (const uc of userContexts) {
            expect(order.indexOf(`${uc}:close`)).toBeGreaterThanOrEqual(0)
            expect(order.indexOf(`${uc}:close`)).toBeLessThan(order.indexOf(`${uc}:remove`))
        }
    })

    test('creates exactly one context per test, with no spare left over', async () => {
        const browser = mockBrowser()
        const suite = mockSuite('root', { tests: Array.from({ length: 8 }, (_, i) => mockTest(`t${i}`)) })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 4)

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(8)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(8)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('cleans up a spare that no test ends up using after an allocation failure', async () => {
        const browser = mockBrowser()
        let n = 0
        let failSecond!: (err: Error) => void
        browser.browsingContextCreate.mockImplementation(async () => {
            n++
            if (n === 2) { return new Promise((_, reject) => { failSecond = reject }) }
            if (n === 3) { failSecond(new Error('slot allocation failed')) }
            return { context: `ctx-${n}` }
        })
        const suite = mockSuite('root', { tests: [mockTest('a'), mockTest('b'), mockTest('c')] })
        await expect(
            runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 2)
        ).rejects.toThrow('slot allocation failed')

        expect(browser.browsingContextCreate).toHaveBeenCalledTimes(3)
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(2)
        expect(browser.__parallelContexts.size).toBe(0)
    })

    test('a failed prefetch does not leak and the error is thrown after cleanup', async () => {
        const browser = mockBrowser()
        let n = 0
        browser.browsingContextCreate.mockImplementation(async () => {
            if (n++ === 1) { throw new Error('prefetch failed') }
            return { context: `ctx-${n}` }
        })
        const suite = mockSuite('root', { tests: [mockTest('a'), mockTest('b')] })
        await expect(
            runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'], 1)
        ).rejects.toThrow('prefetch failed')
        expect(browser.browsingContextClose).toHaveBeenCalledTimes(1)
        expect(browser.__parallelContexts.size).toBe(0)
    })
})

describe('runParallelTests — shared context and suite ownership', () => {
    test('shares one ctx across beforeEach, test and afterEach', async () => {
        const seen: unknown[] = []
        const suite = mockSuite('root', {
            tests: [mockTest('t', function (this: any) { seen.push(this.x) })],
            _beforeEach: [function (this: any) { this.x = 42 }],
            _afterEach: [function (this: any) { seen.push(this.x) }]
        })
        await runParallelTests(suite, mockBrowser(), new EventEmitter(), '0-0', ['/spec.js'])
        expect(seen).toEqual([42, 42])
    })

    test('sibling describes get distinct uids and tests carry their parentUid', async () => {
        const suite = mockSuite('root', {
            suites: [
                mockSuite('A', { tests: [mockTest('a1')] }),
                mockSuite('B', { tests: [mockTest('b1')], suites: [mockSuite('C', { tests: [mockTest('c1')] })] })
            ]
        })
        const reporter = new EventEmitter()
        const events: any[] = []
        for (const e of ['suite:start', 'suite:end', 'test:start']) {
            reporter.on(e, (p) => events.push({ e, ...p }))
        }
        await runParallelTests(suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        const starts = events.filter((x) => x.e === 'suite:start')
        const uidOf = (title: string) => starts.find((s) => s.title === title).uid
        expect(new Set(starts.map((s) => s.uid)).size).toBe(3)
        expect(starts.find((s) => s.title === 'A').parentUid).toBeNull()
        expect(starts.find((s) => s.title === 'C').parentUid).toBe(uidOf('B'))
        const parentOf = (title: string) => events.find((x) => x.e === 'test:start' && x.title === title).parentUid
        expect(parentOf('a1')).toBe(uidOf('A'))
        expect(parentOf('b1')).toBe(uidOf('B'))
        expect(parentOf('c1')).toBe(uidOf('C'))
    })

    test('root-level tests and hooks carry parentUid null, describes keep their own', async () => {
        const suite = mockSuite('', {
            tests: [mockTest('r1')],
            _beforeEach: [() => {}],
            suites: [mockSuite('A', { tests: [mockTest('a1')] })]
        })
        const reporter = new EventEmitter()
        const events: any[] = []
        for (const e of ['suite:start', 'suite:end', 'test:start', 'hook:start']) {
            reporter.on(e, (p) => events.push({ e, ...p }))
        }
        await runParallelTests(suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        const starts = events.filter((x) => x.e === 'suite:start')
        expect(starts.map((s) => s.title)).toEqual(['A'])
        const ofTitle = (e: string, title: string) => events.find((x) => x.e === e && x.title === title)
        expect(ofTitle('test:start', 'r1').parentUid).toBeNull()
        expect(ofTitle('test:start', 'a1').parentUid).toBe(starts[0].uid)
        expect(events.find((x) => x.e === 'hook:start' && x.parent === '').parentUid).toBeNull()
        expect(events.filter((x) => x.e === 'suite:end').map((s) => s.uid)).toEqual([starts[0].uid])
    })

    test('afterEach sees this.currentTest.state after the test ran', async () => {
        const states: unknown[] = []
        const afterEach = function (this: any) { states.push(this.currentTest.state) }
        const suite = mockSuite('root', {
            tests: [mockTest('ok', () => {}), mockTest('bad', () => { throw new Error('x') })],
            _afterEach: [afterEach]
        })
        await runParallelTests(suite, mockBrowser(), new EventEmitter(), '0-0', ['/spec.js'], 1)
        expect(states).toEqual(['passed', 'failed'])
    })

    test('keeps at most one pending close per slot', async () => {
        const suite = mockSuite('root', { tests: [mockTest('1'), mockTest('2'), mockTest('3'), mockTest('4')] })
        const browser = mockBrowser()
        let pending = 0
        let maxPending = 0
        browser.browsingContextClose.mockImplementation(async () => {
            maxPending = Math.max(maxPending, ++pending)
            await new Promise((r) => setTimeout(r, 30))
            pending--
        })
        await runParallelTests(suite, browser, new EventEmitter(), '0-0', ['/spec.js'], 1)
        expect(browser.browsingContextClose).toBeCalledTimes(4)
        expect(maxPending).toBe(1)
    })

    test('emits suite:end before surfacing an allocation failure', async () => {
        const suite = mockSuite('root', { suites: [mockSuite('A', { tests: [mockTest('a1')] })] })
        const browser = mockBrowser()
        browser.browsingContextCreate.mockRejectedValue(new Error('no window'))
        const reporter = new EventEmitter()
        const ended = vi.fn()
        reporter.on('suite:end', ended)
        await expect(runParallelTests(suite, browser, reporter, '0-0', ['/spec.js'])).rejects.toThrow('no window')
        expect(ended).toBeCalledTimes(1)
    })
})

describe('runParallelTests — reporter event contract', () => {
    test('before() failure emits test:start before test:fail for each affected test', async () => {
        const reporter = new EventEmitter()
        const events: { event: string, uid: string }[] = []
        for (const event of ['test:start', 'test:fail', 'test:end']) {
            reporter.on(event, (p) => events.push({ event, uid: p.uid }))
        }
        const suite = mockSuite('root', {
            tests: [mockTest('t1', vi.fn()), mockTest('t2', vi.fn())],
            _beforeAll: [() => { throw new Error('before boom') }]
        })

        await runParallelTests(suite as Suite, mockBrowser({ contexts: ['c1', 'c2'] }), reporter, '0-0', ['/spec.js'])

        for (const uid of ['test-0-0-0', 'test-0-0-1']) {
            expect(events.filter((e) => e.uid === uid).map((e) => e.event))
                .toEqual(['test:start', 'test:fail', 'test:end'])
        }
    })

    test.each([
        ['store', { __parallelContextStore: undefined }, 'Parallel context store not found'],
        ['registry', { __parallelContexts: undefined }, 'Parallel context registry not found']
    ])('missing %s throws before any suite:start', async (_name, override, message) => {
        const reporter = new EventEmitter()
        const onSuiteStart = vi.fn()
        reporter.on('suite:start', onSuiteStart)
        const suite = mockSuite('root', { tests: [mockTest('t1', vi.fn())] })
        const browser = { ...mockBrowser(), ...override }

        await expect(runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js']))
            .rejects.toThrow(message)
        expect(onSuiteStart).not.toBeCalled()
    })
})

describe('runParallelTests timeout warning', () => {
    const timeoutWarnings = () => logMock.warn.mock.calls.filter((c) => String(c[0]).includes('timeouts'))
    const run = (suite: Suite, timeout = 5000) =>
        runParallelTests(suite, mockBrowser(), new EventEmitter(), '0-0', ['/spec.js'], undefined, { timeout })

    beforeEach(() => logMock.warn.mockClear())

    test('warns once when a test timeout differs from mochaOpts.timeout', async () => {
        const slow = { ...mockTest('slow'), _timeout: 30000 }
        const fast = { ...mockTest('fast'), _timeout: 5000 }
        const other = { ...mockTest('other'), _timeout: 1 }
        await run(mockSuite('root', { tests: [slow, fast, other] }))

        expect(timeoutWarnings()).toHaveLength(1)
        expect(String(timeoutWarnings()[0][0])).toContain('mochaOpts.timeout (5000ms) applies')
    })

    test('warns when only a suite timeout differs', async () => {
        const child = { ...mockSuite('child', { tests: [{ ...mockTest('t'), _timeout: 5000 }] }), _timeout: 9000 }
        await run(mockSuite('root', { suites: [child] }))

        expect(timeoutWarnings()).toHaveLength(1)
    })

    test('does not warn when all timeouts match mochaOpts.timeout', async () => {
        await run(mockSuite('root', { tests: [{ ...mockTest('t'), _timeout: 5000 }] }))

        expect(timeoutWarnings()).toHaveLength(0)
    })
})

// ===========================================================================
// TESTS: runParallelTests — reported fullTitle matches sequential mode
// ===========================================================================

describe('runParallelTests — reported fullTitle', () => {
    function nestedTree(fn: Function) {
        const t = mockTest('t', fn)
        const inner = mockSuite('inner', { tests: [t] }) as any
        const outer = mockSuite('outer', { suites: [inner] }) as any
        const root = mockSuite('', { suites: [outer] }) as any
        outer.parent = root
        inner.parent = outer
        t.parent = inner
        t.fullTitle = () => 'outer inner t'
        return root as Suite
    }

    function run(grep?: RegExp) {
        const reporter = new EventEmitter()
        const emitted: any[] = []
        for (const ev of ['test:start', 'test:pass', 'test:end', 'suite:start', 'suite:end']) {
            reporter.on(ev, (p) => emitted.push({ event: ev, payload: p }))
        }
        const fn = vi.fn().mockResolvedValue(undefined)
        const done = runParallelTests(nestedTree(fn), mockBrowser({ contexts: ['ctx-a'] }), reporter, '0-0', ['/spec.js'], undefined, grep ? { grep } : undefined)
        return { done, emitted, fn }
    }

    test('dot-joins test and suite fullTitle like sequential mode', async () => {
        const { done, emitted } = run()
        await done
        for (const ev of ['test:start', 'test:pass', 'test:end']) {
            expect(emitted.filter((e) => e.event === ev).map((e) => e.payload.fullTitle)).toEqual(['outer.inner.t'])
        }
        expect(emitted.filter((e) => e.event === 'suite:start').map((e) => e.payload.fullTitle)).toEqual(['outer', 'outer.inner'])
        expect(emitted.filter((e) => e.event === 'suite:end').map((e) => e.payload.fullTitle)).toEqual(['outer.inner', 'outer'])
    })

    test('grep still matches the space-joined Mocha fullTitle', async () => {
        const { done, fn } = run(/^outer inner t$/)
        await done
        expect(fn).toBeCalledTimes(1)
    })
})

describe('runParallelTests — uncaught errors', () => {
    const events = ['uncaughtException', 'unhandledRejection'] as const
    let saved: Record<string, Function[]>
    let escaped: unknown[]
    let reporter: EventEmitter
    let emitted: { event: string, payload: any }[]

    beforeEach(() => {
        // the errors must reach only the runner and this test, not Vitest's own handlers
        saved = Object.fromEntries(events.map((e) => [e, process.listeners(e)]))
        events.forEach((e) => process.removeAllListeners(e))
        escaped = []
        events.forEach((e) => process.on(e, (err: unknown) => { escaped.push(err) }))
        reporter = new EventEmitter()
        emitted = []
        for (const event of ['test:start', 'test:pass', 'test:fail', 'test:pending', 'hook:end']) {
            reporter.on(event, (payload) => emitted.push({ event, payload }))
        }
        return () => {
            events.forEach((e) => process.removeAllListeners(e))
            events.forEach((e) => saved[e].forEach((l) => process.on(e, l as any)))
        }
    })

    const outcome = (title: string) => emitted.filter((e) => e.payload.title === title && e.event !== 'test:start').map((e) => e.event)

    test('fails the test whose timer throws, as Mocha does, and runs the other tests', async () => {
        const suite = mockSuite('root', {
            tests: [
                mockTest('throws later', async () => {
                    setTimeout(() => { throw new Error('uncaught boom') }, 5)
                    await new Promise((r) => setTimeout(r, 50))
                }),
                mockTest('other', async () => { await new Promise((r) => setTimeout(r, 20)) })
            ]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(outcome('throws later')).toEqual(['test:fail'])
        expect(emitted.find((e) => e.event === 'test:fail')!.payload.error.message).toBe('uncaught boom')
        expect(outcome('other')).toEqual(['test:pass'])
        expect(failures).toBe(1)
    })

    test('fails the hook whose timer throws', async () => {
        const afterEach = mockHook('cleanup', { title: 'root' }, async () => {
            setTimeout(() => { throw new Error('hook boom') }, 5)
            await new Promise((r) => setTimeout(r, 50))
        })
        const suite = mockSuite('root', { tests: [mockTest('passes')], _afterEach: [afterEach] })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(outcome('passes')).toEqual(['test:pass'])
        expect(emitted.find((e) => e.event === 'hook:end')!.payload.error.message).toBe('hook boom')
        expect(failures).toBe(1)
    })

    test('fails the afterEach whose timer throws after a failed test of the same window ended late', async () => {
        const afterEach = mockHook('cleanup', { title: 'root' }, async () => {
            setTimeout(() => { throw new Error('hook boom') }, 40)
            await new Promise((r) => setTimeout(r, 80))
        })
        const suite = mockSuite('root', {
            tests: [mockTest('throws early', async () => {
                setTimeout(() => { throw new Error('test boom') }, 5)
                // still runs when its afterEach starts
                await new Promise((r) => setTimeout(r, 20))
            })],
            _afterEach: [afterEach]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(emitted.find((e) => e.event === 'test:fail')!.payload.error.message).toBe('test boom')
        expect(emitted.find((e) => e.event === 'hook:end')!.payload.error?.message).toBe('hook boom')
        expect(failures).toBe(2)
    })

    test('keeps the worker alive on an unhandled rejection and does not fail the test, as Mocha does', async () => {
        let listenedDuringTest = 0
        const suite = mockSuite('root', {
            tests: [mockTest('rejects', async () => {
                // without a listener Node ends the process on an unhandled rejection
                listenedDuringTest = process.listenerCount('unhandledRejection') - 1
                void Promise.reject(new Error('rejection boom'))
                await new Promise((r) => setTimeout(r, 20))
            })]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(listenedDuringTest).toBe(1)
        expect(outcome('rejects')).toEqual(['test:pass'])
        expect(failures).toBe(0)
        // the other listeners of the process still get it
        expect(escaped.map((e) => (e as Error).message)).toEqual(['rejection boom'])
    })

    test('ignores this.skip() called from a timer, as Mocha does', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('skips later', async function (this: any) {
                setTimeout(() => { this.skip() }, 5)
                await new Promise((r) => setTimeout(r, 20))
            })]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(outcome('skips later')).toEqual(['test:pass'])
        expect(failures).toBe(0)
    })

    test('counts an error after the test ended as a failure of the run', async () => {
        const suite = mockSuite('root', {
            tests: [
                mockTest('ends first', () => { setTimeout(() => { throw new Error('late boom') }, 10) }),
                mockTest('runs longer', async () => { await new Promise((r) => setTimeout(r, 60)) })
            ]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])

        expect(outcome('ends first')).toEqual(['test:pass'])
        expect(outcome('runs longer')).toEqual(['test:pass'])
        expect(failures).toBe(1)
        expect(logMock.error).toHaveBeenCalledWith(expect.stringContaining('late boom'))
    })

    test('counts an error that comes after its test timed out as a failure of the run', async () => {
        const wait = (ms: number) => () => new Promise((r) => setTimeout(r, ms))
        const suite = mockSuite('root', {
            tests: [mockTest('times out', async () => {
                // the timeout (50 ms + 50 ms grace) fails the test at about 100 ms
                setTimeout(() => { throw new Error('after timeout boom') }, 150)
                await new Promise((r) => setTimeout(r, 500))
            })],
            // short hooks keep the run going in another window until about 320 ms
            suites: [mockSuite('slow', {
                tests: [mockTest('keeps running')],
                _afterEach: Array.from({ length: 8 }, (_, i) => mockHook(`wait ${i}`, { title: 'slow' }, wait(40)))
            })]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], undefined, { timeout: 50 })

        expect(emitted.find((e) => e.event === 'test:fail')!.payload.error.message).toMatch(/Timeout of 50ms exceeded/)
        expect(outcome('keeps running')).toEqual(['test:pass'])
        // the timed-out test does not keep the error target of its window
        expect(failures).toBe(2)
        expect(logMock.error).toHaveBeenCalledWith(expect.stringContaining('after timeout boom'))
    })

    test('lets an uncaught error through with allowUncaught, as Mocha does', async () => {
        const suite = mockSuite('root', {
            tests: [mockTest('throws later', async () => {
                setTimeout(() => { throw new Error('allowed boom') }, 5)
                await new Promise((r) => setTimeout(r, 20))
            })]
        })
        const failures = await runParallelTests(suite as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'], undefined, { allowUncaught: true })

        expect(outcome('throws later')).toEqual(['test:pass'])
        expect(failures).toBe(0)
        expect(escaped.map((e) => (e as Error).message)).toEqual(['allowed boom'])
    })

    test('removes its listeners after the run', async () => {
        const before = events.map((e) => process.listenerCount(e))
        await runParallelTests(mockSuite('root', { tests: [mockTest('passes')] }) as Suite, mockBrowser(), reporter, '0-0', ['/spec.js'])
        expect(events.map((e) => process.listenerCount(e))).toEqual(before)
    })
})
