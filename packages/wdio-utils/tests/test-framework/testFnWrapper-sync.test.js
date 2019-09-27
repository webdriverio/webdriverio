import * as shim from '../../src/shim'
import { testFnWrapper } from '../../src/test-framework/testFnWrapper'

jest.mock('../../src/shim', () => ({
    executeHooksWithArgs: jest.fn(),
    runSync: (fn, repeatTest, args = []) => async (resolve, reject) => {
        try {
            return resolve(await fn('@wdio/sync', repeatTest, ...args))
        } catch (err) {
            reject(err)
        }
    },
    executeAsync: null,
}))

const executeHooksWithArgs = shim.executeHooksWithArgs

describe('testFnWrapper', () => {
    const origFn = (mode, repeatTest, arg) => `${mode}: Foo${arg} ${repeatTest}`
    const buildArgs = (specFn, retries, beforeFnArgs, afterFnArgs) => [
        'Foo',
        { specFn, specFnArgs: ['Bar'] },
        { beforeFn: 'beforeFn', beforeFnArgs },
        { afterFn: 'afterFn', afterFnArgs },
        '0-9',
        retries
    ]

    it('should run fn in sync mode', async () => {
        const args = buildArgs(origFn, undefined, () => ['beforeFnArgs'], () => [{ foo: 'bar' }])
        const result = await testFnWrapper(...args)

        expect(result).toBe('@wdio/sync: FooBar 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', [
            { duration: expect.any(Number), error: undefined, passed: true, foo: 'bar' },
            { duration: expect.any(Number), error: undefined, passed: true, result: '@wdio/sync: FooBar 0' }
        ])
    })

    afterEach(() => {
        executeHooksWithArgs.mockClear()
    })
})
