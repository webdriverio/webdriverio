import * as shim from '../../src/shim'
import { testFnWrapper, execute } from '../../src/test-framework/testFnWrapper'

jest.mock('../../src/shim', () => ({
    executeHooksWithArgs: jest.fn()
}))

const executeHooksWithArgs = shim.executeHooksWithArgs

describe('execute', () => {
    it('should pass with default values and fn returning synchronous value', async () => {
        const result = await execute.call({}, () => 'foo', {})
        expect(result).toEqual('foo')
    })

    it('should pass when optional arguments are passed', async () => {
        const result = await execute.call({}, async arg => arg, { limit: 1, attempts: 0 }, ['foo'])
        expect(result).toEqual('foo')
    })

    it('should reject if fn throws error directly', async () => {
        let error
        const fn = () => { throw new Error('foo') }
        try {
            await execute.call({}, fn, {})
        } catch (e) {
            error = e
        }
        expect(error.message).toEqual('foo')
    })

    it('should repeat if fn throws error directly and repeatTest provided', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await execute.call(scope, () => {
            if (counter > 0) {
                counter--
                throw new Error('foo')
            }
            return true
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })

    it('should repeat if fn rejects and repeatTest provided', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await execute.call(scope, () => {
            if (counter > 0) {
                counter--
                return Promise.reject('foo')
            }
            return true
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })
})

describe('testFnWrapper', () => {
    const origFn = (mode) => `${mode}: Foo`
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
        const result = await testFnWrapper.call({}, ...args)

        expect(result).toBe('Bar: Foo')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', [])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', [{
            duration: expect.any(Number),
            error: undefined,
            result: 'Bar: Foo',
            passed: true,
            retries: {
                limit: 0,
                attempts: 0
            }
        }])
    })

    it('should run fn in async mode if specFn is async', async () => {
        const args = buildArgs(async (...args) => origFn(...args), 11, () => ['beforeFnArgs'], () => ['afterFnArgs'])
        const result = await testFnWrapper.call({}, ...args)

        expect(result).toBe('Bar: Foo')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', ['afterFnArgs', {
            duration: expect.any(Number),
            error: undefined,
            result: 'Bar: Foo',
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
            await testFnWrapper.call({}, ...args)
        } catch (err) {
            error = err
        }

        expect(error).toBe(expectedError)
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', ['afterFnArgs', {
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
