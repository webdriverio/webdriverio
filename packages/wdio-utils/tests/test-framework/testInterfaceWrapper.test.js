import { testFnWrapper } from '../../src/test-framework/testFnWrapper'
import { runHook, runSpec, wrapTestFunction, runTestInFiberContext } from '../../src/test-framework/testInterfaceWrapper'

function testFunction (specTitle, cb) { return cb.call(this, 'foo', 'bar') }
function hookFunction (cb) { return cb.call(this, 'foo', 'bar') }

jest.mock('../../src/test-framework/testFnWrapper', () => ({
    testFnWrapper: jest.fn()
}))

describe('runHook', () => {
    it('should call testFnWrapper with proper args', () => {
        const beforeFnArgs = (context) => [context.foo]
        const afterFnArgs = (context) => [context.foo]
        runHook('hookFn', hookFunction.bind({ foo: 'bar' }), 'beforeFn', beforeFnArgs, 'afterFn', afterFnArgs, 'cid')
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
        const beforeFnArgs = (context) => [context.foo]
        const afterFnArgs = (context) => [context.foo]
        runSpec('test title', 'specFn', testFunction.bind({ foo: 'bar' }), 'beforeFn', beforeFnArgs, 'afterFn', afterFnArgs, 'cid')
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
        const specFn = jest.fn()
        const fn = wrapTestFunction(testFunction, true, 'beforeFn', () => [], 'afterFn', () => [], 'cid')
        fn('test title', specFn)
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
        const specFn = jest.fn()
        const fn = wrapTestFunction(hookFunction, false, 'beforeFn', () => [], 'afterFn', () => [], 'cid')
        fn(specFn, 4)
        expect(testFnWrapper).toBeCalledWith(
            'Hook',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            4
        )
    })

    it('should run pending function', () => {
        const origFn = jest.fn()
        const fn = wrapTestFunction(origFn, true)
        fn('skipped test title')
        expect(origFn).toBeCalledWith('skipped test title')
    })
})

describe('runTestInFiberContext', () => {
    it('should wrap skip and only functions', () => {
        const skipFn = () => { }
        global.foobar = testFunction
        global.foobar.only = testFnWrapper
        global.foobar.skip = skipFn
        runTestInFiberContext(true, 'beforeFn', () => [], 'afterFn', () => [], 'foobar', 'cid')

        const specFn = jest.fn()
        global.foobar('test title', specFn, 3)
        expect(testFnWrapper).toBeCalledWith(
            'Test',
            { specFn, specFnArgs: ['foo', 'bar'] },
            { beforeFn: 'beforeFn', beforeFnArgs: expect.any(Function) },
            { afterFn: 'afterFn', afterFnArgs: expect.any(Function) },
            'cid',
            3
        )
    })

    it('should not wrap skip and only if not functions', () => {
        const scope = {
            barfoo: hookFunction
        }
        runTestInFiberContext(false, 'beforeFn', () => [], 'afterFn', () => [], 'barfoo', 'cid', scope)

        const specFn = jest.fn()
        scope.barfoo(specFn, 0)
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
    delete global.foobar
    testFnWrapper.mockClear()
})
