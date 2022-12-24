import path from 'node:path'
import { describe, test, expect, vi, afterAll } from 'vitest'
import { wrapGlobalTestMethod } from '@wdio/utils'

import { loadModule, formatMessage, setupEnv, requireExternalModules } from '../src/common.js'
declare global {
    // eslint-disable-next-line no-var
    var foo: string | undefined
}

vi.mock('randomModule', () => import(path.join(process.cwd(), '__mocks__', 'randomModule')))
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

describe('loadModule', () => {
    test('loadModule with existing package', async () => {
        await loadModule('randomModule')
        expect(global.foo).toBe('bar')
    })

    test('loadModule with non existing package', async () => {
        await expect(() => loadModule('nonExistingModule'))
            .rejects.toThrow('Module nonExistingModule can\'t get loaded')
    })
})

test('requireExternalModules', () => {
    const loader = vi.fn()
    // @ts-ignore test invalid params!
    requireExternalModules(['/foo/bar.js', null, './bar/foo.js'], loader)
    expect(loader).toBeCalledTimes(2)
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
})

afterAll(() => {
    delete global.foo
})
