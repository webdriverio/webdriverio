import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AsyncLocalStorage } from 'node:async_hooks'
import { EventEmitter } from 'node:events'

import { collectTests, runParallelTests } from '../src/parallel.js'
import type { Suite } from 'mocha'

// ---------------------------------------------------------------------------
// Helpers to build mock Mocha suite trees
// ---------------------------------------------------------------------------

function mockTest(title: string, fn?: Function): any {
    return {
        title,
        fullTitle: () => title,
        fn: fn || (() => {}),
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

    beforeEach(() => {
        reporter = new EventEmitter()
        reporter.on('test:start', () => {})
        reporter.on('test:pass', () => {})
        reporter.on('test:fail', () => {})
        reporter.on('test:end', () => {})
    })

    test('calls suite-level _beforeAll and _afterAll [currently BROKEN]', async () => {
        const beforeAllFn = vi.fn().mockResolvedValue(undefined)
        const afterAllFn = vi.fn().mockResolvedValue(undefined)
        const testFn = vi.fn().mockResolvedValue(undefined)

        const suite = mockSuite('root', {
            tests: [mockTest('test1', testFn)],
            _beforeAll: [beforeAllFn],
            _afterAll: [afterAllFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-d'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // BUG #4: suite-level beforeAll / afterAll are never called
        expect(beforeAllFn).toBeCalledTimes(1)
        expect(afterAllFn).toBeCalledTimes(1)
    })

    test('runs _beforeAll before all tests and _afterAll after all tests [currently BROKEN]', async () => {
        const callOrder: string[] = []
        const beforeAllFn = vi.fn().mockImplementation(() => { callOrder.push('beforeAll') })
        const afterAllFn = vi.fn().mockImplementation(() => { callOrder.push('afterAll') })
        const test1Fn = vi.fn().mockImplementation(() => { callOrder.push('test1') })
        const test2Fn = vi.fn().mockImplementation(() => { callOrder.push('test2') })

        const suite = mockSuite('root', {
            tests: [mockTest('test1', test1Fn), mockTest('test2', test2Fn)],
            _beforeAll: [beforeAllFn],
            _afterAll: [afterAllFn]
        })

        const browser = mockBrowser({ contexts: ['ctx-e', 'ctx-f'] })
        await runParallelTests(suite as Suite, browser, reporter, '0-0', ['/spec.js'])

        // BUG #4: These hooks are never called. Once fixed, verify order.
        expect(beforeAllFn).toBeCalledTimes(1)
        expect(afterAllFn).toBeCalledTimes(1)
        // beforeAll must come before any test
        expect(callOrder.indexOf('beforeAll')).toBeLessThan(callOrder.indexOf('test1'))
        expect(callOrder.indexOf('beforeAll')).toBeLessThan(callOrder.indexOf('test2'))
        // afterAll must come after all tests
        expect(callOrder.indexOf('afterAll')).toBeGreaterThan(callOrder.indexOf('test1'))
        expect(callOrder.indexOf('afterAll')).toBeGreaterThan(callOrder.indexOf('test2'))
    })
})
