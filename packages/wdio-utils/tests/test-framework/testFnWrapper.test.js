import { testFrameworkFnWrapper } from '../../src/test-framework/testFnWrapper'

const pSend = jest.spyOn(process, 'send')

describe('testFrameworkFnWrapper', () => {
    const executeHooksWithArgs = jest.fn()
    const executeSync = (fn, repeatTest, args = []) => async (resolve, reject) => {
        try {
            return resolve(await fn('@wdio/sync', repeatTest, ...args))
        } catch (err) {
            reject(err)
        }
    }
    const executeAsync = async (fn, repeatTest, args = []) => fn('async', repeatTest, ...args)
    const origFn = (mode, repeatTest, arg) => `${mode}: Foo${arg} ${repeatTest}`
    const buildArgs = (specFn, retries, beforeFnArgs, afterFnArgs, runSync) => [
        { executeHooksWithArgs, executeAsync, runSync },
        'Foo',
        { specFn, specFnArgs: ['Bar'] },
        { beforeFn: 'beforeFn', beforeFnArgs },
        { afterFn: 'afterFn', afterFnArgs },
        '0-9',
        retries
    ]

    it('should run fn in sync mode', async () => {
        const args = buildArgs(origFn, undefined, () => ['beforeFnArgs'], () => [{ foo: 'bar' }], executeSync)
        const result = await testFrameworkFnWrapper(...args)

        expect(result).toBe('@wdio/sync: FooBar 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', [
            { duration: expect.any(Number), error: undefined, passed: true, foo: 'bar' },
            { duration: expect.any(Number), error: undefined, passed: true, result: '@wdio/sync: FooBar 0' }
        ])
    })

    it('should run fn in async mode if not runSync', async () => {
        const args = buildArgs(origFn, undefined, () => [], () => [], undefined)
        const result = await testFrameworkFnWrapper(...args)

        expect(result).toBe('async: FooBar 0')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', [])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', [{ duration: expect.any(Number), error: undefined, result: 'async: FooBar 0', passed: true }])
    })

    it('should run fn in async mode if specFn is async', async () => {
        const args = buildArgs(async (...args) => origFn(...args), 11, () => ['beforeFnArgs'], () => ['afterFnArgs'], executeSync)
        const result = await testFrameworkFnWrapper(...args)

        expect(result).toBe('async: FooBar 11')
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', ['afterFnArgs', { duration: expect.any(Number), error: undefined, result: 'async: FooBar 11', passed: true }])
    })

    it('should throw on error', async () => {
        let expectedError
        const args = buildArgs((mode, repeatTest, arg) => {
            expectedError = new Error(`${mode}: Foo${arg} ${repeatTest}`)
            throw expectedError
        }, undefined, () => ['beforeFnArgs'], () => ['afterFnArgs'], executeSync)

        let error
        try {
            await testFrameworkFnWrapper(...args)
        } catch (err) {
            error = err
        }

        expect(error).toBe(expectedError)
        expect(executeHooksWithArgs).toBeCalledTimes(2)
        expect(executeHooksWithArgs).toBeCalledWith('beforeFn', ['beforeFnArgs'])
        expect(executeHooksWithArgs).toBeCalledWith('afterFn', ['afterFnArgs', { duration: expect.any(Number), error: expectedError, result: undefined, passed: false }])
    })

    afterEach(() => {
        executeHooksWithArgs.mockClear()
        pSend.mockClear()
    })
})
