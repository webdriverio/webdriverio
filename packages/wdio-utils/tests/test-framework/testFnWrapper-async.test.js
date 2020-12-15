import * as shim from '../../src/shim'
import { testFnWrapper } from '../../src/test-framework/testFnWrapper'

jest.mock('../../src/shim', () => ({
    executeHooksWithArgs: jest.fn(),
    executeAsync: async (fn, { limit, attempts }, args = []) => fn('async', limit, attempts, ...args),
    runSync: null,
}))

const executeHooksWithArgs = shim.executeHooksWithArgs

describe('testFnWrapper', () => {
    const origFn = (mode, limit, attempts, arg) => `${mode}: Foo${arg} ${limit} ${attempts}`
    const buildArgs = (specFn, retries, beforeFnArgs, afterFnArgs) => [
        'Foo',
        { specFn, specFnArgs: ['Bar'] },
        { beforeFn: 'beforeFn', beforeFnArgs },
        { afterFn: 'afterFn', afterFnArgs },
        '0-9',
        retries
    ]

    it('should run fn in async mode if not runSync', async () => {
        const args = buildArgs(origFn, undefined, () => [], () => [])
        const result = await testFnWrapper(...args)

        expect(result).toBe('async: FooBar 0 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFoo', 'beforeFn', [])
        expect(executeHooksWithArgs).toBeCalledWith('afterFoo', 'afterFn', [{
            duration: expect.any(Number),
            error: undefined,
            result: 'async: FooBar 0 0',
            passed: true,
            retries: {
                limit: 0,
                attempts: 0
            }
        }])
    })

    it('should run fn in async mode if specFn is async', async () => {
        const args = buildArgs(async (...args) => origFn(...args), 11, () => ['beforeFnArgs'], () => ['afterFnArgs'])
        const result = await testFnWrapper(...args)

        expect(result).toBe('async: FooBar 11 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFoo', 'beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFoo', 'afterFn', ['afterFnArgs', {
            duration: expect.any(Number),
            error: undefined,
            result: 'async: FooBar 11 0',
            passed: true,
            retries: {
                limit: 11,
                attempts: 0
            }
        }])
    })

    it('should throw on error', async () => {
        let expectedError
        const args = buildArgs((mode, repeatTest, arg) => {
            expectedError = new Error(`${mode}: Foo${arg} ${repeatTest}`)
            throw expectedError
        }, undefined, () => ['beforeFnArgs'], () => ['afterFnArgs'])

        let error
        try {
            await testFnWrapper(...args)
        } catch (err) {
            error = err
        }

        expect(error).toBe(expectedError)
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFoo', 'beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFoo', 'afterFn', ['afterFnArgs', {
            duration: expect.any(Number),
            error: expectedError,
            result: undefined,
            passed: false,
            retries: {
                limit: 0,
                attempts: 0
            }
        }])
    })

    afterEach(() => {
        executeHooksWithArgs.mockClear()
    })
})
