import { MockedFunction, vi, describe, it, expect, afterEach, beforeEach } from 'vitest'

import { testFnWrapper as testFnWrapperImport } from '../../src/test-framework/testFnWrapper'
import { runHook, runSpec, wrapTestFunction, runTestInFiberContext } from '../../src/test-framework/testInterfaceWrapper'

const testFunction = vi.fn(function (this: any, specTitle, cb) { return cb.call(this, 'foo', 'bar') })
const hookFunction = vi.fn(function (this: any, cb) { return cb.call(this, 'foo', 'bar') })

vi.mock('../../src/test-framework/testFnWrapper', () => ({
    testFnWrapper: vi.fn()
}))

const testFnWrapper = testFnWrapperImport as MockedFunction<any>
beforeEach(() => {
    testFnWrapper.mockClear()
    // @ts-expect-error
    global.jasmine = {}
})

describe('runHook', () => {
    it('should call testFnWrapper with proper args', () => {
        const beforeFnArgs = (context: any) => [context.foo]
        const afterFnArgs = (context: any) => [context.foo]
        runHook('hookFn' as any, hookFunction.bind({ foo: 'bar' }), 'beforeFn' as any, beforeFnArgs as any, 'afterFn' as any, afterFnArgs as any, 'cid', 0, 0)
        expect(testFnWrapper).toBeCalledWith(
            'Hook',
            { specFn: 'hookFn', specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs },
            { afterFn: 'afterFn', afterFnArgs },
            'cid',
            0
        )
    })
})

describe('runSpec', () => {
    it('should call testFnWrapper with proper args', () => {
        const beforeFnArgs = (context: any) => [context.foo]
        const afterFnArgs = (context: any) => [context.foo]
        runSpec('test title', 'specFn' as any, testFunction.bind({ foo: 'bar' }), 'beforeFn' as any, beforeFnArgs as any, 'afterFn' as any, afterFnArgs as any, 'cid', 0, 0)
        expect(testFnWrapper).toBeCalledWith(
            'Test',
            { specFn: 'specFn', specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs },
            { afterFn: 'afterFn', afterFnArgs },
            'cid',
            0
        )
    })
})

describe('wrapTestFunction', () => {
    it('should run spec', () => {
        const specFn = vi.fn()
        const fn = wrapTestFunction(testFunction, true, 'beforeFn' as any, () => [] as any, 'afterFn' as any, () => [] as any, 'cid')
        fn('test title', specFn, { options: { foo: 'bar' } } as any)
        expect(testFnWrapper).toBeCalledWith(
            'Test',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            0
        )
    })

    it('should run hook', () => {
        const specFn = vi.fn()
        const fn = wrapTestFunction(hookFunction, false, 'beforeFn' as any, () => [] as any, 'afterFn' as any, () => [] as any, 'cid')
        fn(specFn as any, 123 as any, 4)
        expect(testFnWrapper).toBeCalledWith(
            'Hook',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            4
        )
        expect(hookFunction).toBeCalledWith(expect.any(Function), 123)
    })

    it('should run pending function', () => {
        const origFn = vi.fn()
        const fn = wrapTestFunction(origFn, true, 'beforeFn' as any, () => [] as any, 'afterFn' as any, () => [] as any, 'cid')
        fn('skipped test title' as any)
        expect(origFn).toBeCalledWith('skipped test title')
    })
})

describe('runTestInFiberContext', () => {
    it('should wrap skip and only functions', () => {
        const skipFn = () => { }
        // @ts-expect-error
        const onlyFn = function (...args: any[]) { return global.foobar(...args) }
        // @ts-expect-error
        global.foobar = testFunction
        // @ts-expect-error
        global.foobar.only = onlyFn
        // @ts-expect-error
        global.foobar.skip = skipFn
        runTestInFiberContext(true, 'beforeFn' as any, () => [] as any, 'afterFn' as any, () => [] as any, 'foobar', 'cid')

        // @ts-expect-error
        expect(global.foobar.skip).toBe(skipFn)
        // @ts-expect-error
        expect(global.foobar.only).toBe(onlyFn)

        const specFn = vi.fn()
        // @ts-expect-error
        global.foobar.only('test title', specFn, 321, 3)
        expect(testFnWrapper).toBeCalledWith(
            'Test',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            3
        )

        expect(testFunction).toBeCalledWith(
            'test title',
            expect.any(Function),
            321
        )
    })

    it('should not wrap skip and only if not functions', () => {
        const scope = {
            barfoo: hookFunction
        }
        runTestInFiberContext(false, 'beforeFn' as any, () => [] as any, 'afterFn' as any, () => [] as any, 'barfoo', 'cid', scope as any)

        const specFn = vi.fn()
        scope.barfoo(specFn)
        expect(testFnWrapper).toBeCalledWith(
            'Hook',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            0
        )
    })
})

afterEach(() => {
    // @ts-expect-error
    delete global.foobar
    // @ts-expect-error
    delete global.jasmine
    testFnWrapper.mockClear()
})
