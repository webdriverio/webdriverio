import { describe, test, expect, vi } from 'vitest'
import { wrapGlobalTestMethod } from '@wdio/utils'

import { applyMochaDefaults, dottedFullTitle, formatMessage, setupEnv } from '../src/common.js'

vi.mock('@wdio/utils')

describe('formatMessage', () => {
    test('should do nothing if no error or params are given', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar' }
        const message = formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format an error message', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', err: new Error('uups') }
        const message = formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format an error message with timeout error', () => {
        // @ts-ignore params not needed for test scenario
        const params = {
            type: 'foobar',
            payload: {
                title: 'barfoo',
                parent: { title: 'parentfoo' }
            },
            err: new Error('For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.')
        }
        const message = formatMessage(params as any)

        // delete stack to avoid differences in stack paths
        // @ts-ignore test scenario
        delete message.error.stack

        expect(message).toMatchSnapshot()
    })

    test('should format payload', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: 'parentfoo' },
            context: 'some context',
            ctx: { currentTest: { title: 'current test' } },
            file: '/foo/bar.test.js'
        } }
        const message = formatMessage(params as any)
        expect(message).toMatchSnapshot()
    })

    test('should format parent title', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: { title: '', suites: [{ title: 'first suite' }] }
        } }
        const message = formatMessage(params as any)
        expect(message.parent).toEqual('')
    })

    test('should format fullTitle', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'foobar', payload: {
            title: 'barfoo',
            parent: {
                title: 'Parent 2',
                parent: {
                    title: 'Parent 1'
                }
            }
        } }
        const message = formatMessage(params as any)
        expect(message.fullTitle).toEqual('Parent 1.Parent 2.barfoo')
    })

    test('should format test status', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterTest', payload: {
            title: 'barfoo',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.passed).toBe(false)
        expect(message.duration).toBe(123)
    })

    test('should format title for mocha beforeAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"before all" hook for WebdriverIO')
    })

    test('should not format title for mocha beforeAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'beforeAll', payload: {
            title: '"before all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"before all" hook')
    })

    test('should format title for mocha afterAll hook if parent title is present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {
                title: 'WebdriverIO'
            },
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"after all" hook for WebdriverIO')
    })

    test('should not format title for mocha afterAll hook if parent title is not present', () => {
        // @ts-ignore params not needed for test scenario
        const params = { type: 'afterAll', payload: {
            title: '"after all" hook',
            parent: {},
            state: 'failed',
            duration: 123
        } }
        const message = formatMessage(params as any)
        expect(message.title).toBe('"after all" hook')
    })
})

describe('setupEnv', () => {
    test('setupEnv - TDD', () => {
        const hooks = {
            beforeHook: 'beforeHook123' as any,
            afterHook: 'afterHook123' as any,
            beforeTest: 'beforeTest234' as any,
            afterTest: 'afterTest234' as any
        }
        const mochaOpts = { foo: 'bar', ui: 'tdd' as const }
        setupEnv('0-2', mochaOpts, hooks.beforeTest, hooks.beforeHook, hooks.afterTest, hooks.afterHook)
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteSetup', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'setup', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            true, 'beforeTest234', expect.any(Function), 'afterTest234', expect.any(Function), 'test', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'suiteTeardown', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'teardown', '0-2')

        const hookArgsFn = vi.mocked(wrapGlobalTestMethod).mock.calls[0][2]
        expect(hookArgsFn({ test: { foo: 'bar', parent: { title: 'parent' } } }))
            .toEqual([{ foo: 'bar', parent: 'parent' }, { test: { foo: 'bar', parent: { title: 'parent' } } }])
    })

    test('setupEnv - BDD', () => {
        const hooks = {
            beforeHook: 'beforeHook123' as any,
            afterHook: 'afterHook123' as any,
            beforeTest: 'beforeTest234' as any,
            afterTest: 'afterTest234' as any
        }
        const mochaOpts = { foo: 'bar', ui: 'bdd' as const }
        setupEnv('0-2', mochaOpts, hooks.beforeTest, hooks.beforeHook, hooks.afterTest, hooks.afterHook)
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'before', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'beforeEach', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            true, 'beforeTest234', expect.any(Function), 'afterTest234', expect.any(Function), 'it', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            true, 'beforeTest234', expect.any(Function), 'afterTest234', expect.any(Function), 'specify', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'after', '0-2')
        expect(wrapGlobalTestMethod).toBeCalledWith(
            false, 'beforeHook123', expect.any(Function), 'afterHook123', expect.any(Function), 'afterEach', '0-2')

        const hookArgsFn = vi.mocked(wrapGlobalTestMethod).mock.calls[0][2]
        expect(hookArgsFn({ test: { foo: 'bar', parent: { title: 'parent' } } }))
            .toEqual([{ foo: 'bar', parent: 'parent' }, { test: { foo: 'bar', parent: { title: 'parent' } } }])
    })

    test('setupEnv - QUnit', () => {
        vi.mocked(wrapGlobalTestMethod).mockClear()
        const hooks = {
            beforeHook: 'beforeHook123' as any,
            afterHook: 'afterHook123' as any,
            beforeTest: 'beforeTest234' as any,
            afterTest: 'afterTest234' as any
        }
        setupEnv('0-2', { ui: 'qunit' }, hooks.beforeTest, hooks.beforeHook, hooks.afterTest, hooks.afterHook)
        expect(vi.mocked(wrapGlobalTestMethod).mock.calls.map((c) => [c[0], c[5]])).toEqual([
            [true, 'test'],
            [false, 'before'],
            [false, 'beforeEach'],
            [false, 'after'],
            [false, 'afterEach']
        ])
    })

    test.each([
        ['strong-bdd', ['it', 'specify', 'before', 'beforeEach', 'after', 'afterEach']],
        ['strong-bdd.js', ['it', 'specify', 'before', 'beforeEach', 'after', 'afterEach']],
        ['./custom-qunit.cjs', ['test', 'before', 'beforeEach', 'after', 'afterEach']],
        ['./dir-with-dash/my-tdd.mjs', ['test', 'suiteSetup', 'setup', 'suiteTeardown', 'teardown']],
        ['C:\\path\\to\\custom-qunit.ts', ['test', 'before', 'beforeEach', 'after', 'afterEach']],
        ['@scope/mocha-qunit', ['test', 'before', 'beforeEach', 'after', 'afterEach']],
        ['./my-custom-interface.cjs', ['it', 'specify', 'before', 'beforeEach', 'after', 'afterEach']],
        ['toString', ['it', 'specify', 'before', 'beforeEach', 'after', 'afterEach']],
        [(() => {}) as any, ['it', 'specify', 'before', 'beforeEach', 'after', 'afterEach']],
    ])('setupEnv - custom UI %s resolves expected globals', (ui, expectedFns) => {
        vi.mocked(wrapGlobalTestMethod).mockClear()
        setupEnv('0-2', { ui }, vi.fn(), vi.fn(), vi.fn(), vi.fn())
        expect(vi.mocked(wrapGlobalTestMethod).mock.calls.map((c) => c[5])).toEqual(expectedFns)
    })

    test('setupEnv - skips globals not defined on context by custom UIs', () => {
        vi.mocked(wrapGlobalTestMethod).mockClear()
        const context = { test: vi.fn(), beforeEach: vi.fn() }
        setupEnv('0-2', { ui: './custom-qunit.cjs' }, vi.fn(), vi.fn(), vi.fn(), vi.fn(), context)
        expect(vi.mocked(wrapGlobalTestMethod).mock.calls.map((c) => c[5])).toEqual(['test', 'beforeEach'])
    })
})

describe('applyMochaDefaults', () => {
    test('fails tests skipped by a hook failure', () => {
        const opts = applyMochaDefaults({})
        expect(opts.failHookAffectedTests).toBe(true)
    })

    test('keeps an explicit opt-out', () => {
        const opts = applyMochaDefaults({ failHookAffectedTests: false })
        expect(opts.failHookAffectedTests).toBe(false)
    })
})

describe('dottedFullTitle', () => {
    test('joins ancestor titles with dots', () => {
        expect(dottedFullTitle('t', { title: 'inner', parent: { title: 'outer', parent: { title: '' } } })).toBe('outer.inner.t')
    })

    test('returns the title without a parent', () => {
        expect(dottedFullTitle('t')).toBe('t')
        expect(dottedFullTitle('t', null)).toBe('t')
    })

    test('stops at the first ancestor with an empty title', () => {
        expect(dottedFullTitle('t', { title: 'a', parent: { title: '', parent: { title: 'skipped' } } })).toBe('a.t')
    })
})
