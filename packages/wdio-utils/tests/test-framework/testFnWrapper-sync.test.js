import * as shim from '../../src/shim'
import { testFnWrapper } from '../../src/test-framework/testFnWrapper'

jest.mock('../../src/shim', () => ({
    executeHooksWithArgs: jest.fn(),
    runSync: (fn, { attempts, limit }, args = []) => async (resolve, reject) => {
        try {
            return resolve(await fn('@wdio/sync', attempts, limit, ...args))
        } catch (err) {
            reject(err)
        }
    },
    executeAsync: null,
}))

const executeHooksWithArgs = shim.executeHooksWithArgs

describe('testFnWrapper', () => {
    const origFn = (mode, attempts, limit, arg) => `${mode}: Foo${arg} ${attempts} ${limit}`
    const buildArgs = (specFn, retries, beforeFnArgs, afterFnArgs) => [
        'Foo',
        { specFn, specFnArgs: ['Bar'] },
        { beforeFn: 'beforeFn', beforeFnArgs },
        { afterFn: 'afterFn', afterFnArgs },
        '0-9',
        retries
    ]

    it('should run fn in sync mode with mocha or jasmine', async () => {
        const args = buildArgs(origFn, undefined, () => ['beforeFnArgs'], () => [{ foo: 'bar', description: 'foo' }, 'context'])
        const result = await testFnWrapper.call({ test: { fullTitle: () => 'full title' } }, ...args)

        expect(result).toBe('@wdio/sync: FooBar 0 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)

        delete executeHooksWithArgs.mock.calls[1][1][2].duration
        expect(executeHooksWithArgs.mock.calls).toMatchSnapshot()
    })

    it('should propagate jasmine failed expecations as errors', async () => {
        const failedExpectation = {
            matcherName: 'toEqual',
            message: 'Expected true to equal false.',
            stack: 'Error: Expected true to equal false.\n    at <Jasmine>\n    at UserContext.it',
            passed: false,
            expected: false,
            actual: true
        }
        const args = buildArgs(origFn, undefined, () => ['beforeFnArgs'], () => [{ foo: 'bar', description: 'foo', failedExpectations: [failedExpectation] }, 'context'])
        const error = await testFnWrapper.call({ test: { fullTitle: () => 'full title' } }, ...args).catch((err) => err)
        expect(executeHooksWithArgs.mock.calls[1][1]).toMatchSnapshot()
        expect(error).toMatchSnapshot()
    })

    it('should run fn in sync mode with cucumber', async () => {
        const args = buildArgs(origFn, undefined, () => ['beforeFnArgs'], () => [{ foo: 'bar' }, 2, 3, 4])
        const result = await testFnWrapper(...args)

        expect(result).toBe('@wdio/sync: FooBar 0 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)

        delete executeHooksWithArgs.mock.calls[1][1][2].duration
        expect(executeHooksWithArgs.mock.calls).toMatchSnapshot()
    })

    afterEach(() => {
        executeHooksWithArgs.mockClear()
    })
})
