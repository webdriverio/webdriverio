import type { MockedFunction } from 'vitest'
import { vi, describe, it, expect, afterEach } from 'vitest'

import * as shim from '../../src/shim.js'
import { testFnWrapper, filterStackTrace } from '../../src/test-framework/testFnWrapper.js'

vi.mock('../../src/shim', () => ({
    executeHooksWithArgs: vi.fn(),
    executeAsync: async (fn: Function, { limit, attempts }: any, args = []) => fn('async', limit, attempts, ...args),
    runSync: null,
}))

const executeHooksWithArgs = shim.executeHooksWithArgs as MockedFunction<any>

describe('testFnWrapper', () => {
    const origFn = (mode: string, limit: number, attempts: number, arg: any) => `${mode}: Foo${arg} ${limit} ${attempts}`
    const buildArgs = (specFn: Function, retries?: number, beforeFnArgs?: Function, afterFnArgs?: Function) => [
        'Foo',
        { specFn, specFnArgs: ['Bar'] },
        { beforeFn: 'beforeFn', beforeFnArgs },
        { afterFn: 'afterFn', afterFnArgs },
        '0-9',
        retries
    ]

    it('should run fn in async mode if not runSync', async () => {
        const args = buildArgs(origFn, undefined, () => [], () => []) as any[]
        // @ts-expect-error
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
        // @ts-expect-error
        const args = buildArgs(async (...args: any[]) => origFn(...args), 11, () => ['beforeFnArgs'], () => ['afterFnArgs'])
        // @ts-expect-error
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
        const args = buildArgs((mode: string, repeatTest: boolean, arg: any) => {
            expectedError = new Error(`${mode}: Foo${arg} ${repeatTest}`)
            throw expectedError
        }, undefined, () => ['beforeFnArgs'], () => ['afterFnArgs'])

        let error
        try {
            // @ts-expect-error
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

describe('filterStackTrace', () => {
    it('should remove internal webdriverio lines only', () => {
        const stackTraces = [
            {
                fullStack : `
                    at Context.<anonymous> (/foo/bar/baz/example.e2e.js:27:9)
                    at Context.executeAsync (/foo/bar/baz/node_modules/@wdio/utils/build/shim.js:331:27)
                    at Context.testFrameworkFnWrapper (/foo/bar/baz/node_modules/@wdio/utils/build/test-framework/testFnWrapper.js:50:32)
                    at processTicksAndRejections (internal/process/task_queues.js:95:5)
                `,
                filteredStack : `
                    at Context.<anonymous> (/foo/bar/baz/example.e2e.js:27:9)
                `
            },
            {
                fullStack : `
                    at implicitWait (/foo/bar/node_modules/webdriverio/build/utils/implicitWait.js:34:19)
                    at async Element.elementErrorHandlerCallbackFn (/foo/bar/node_modules/webdriverio/build/middlewares.js:20:29)
                    at async Element.wrapCommandFn (/foo/bar/node_modules/@wdio/utils/build/shim.js:137:29)
                    at async Element.wrapCommandFn (/foo/bar/node_modules/some/fake/lib/bar.js:137:29)
                    at async Context.<anonymous> (/foo/bar/test/specs/example.e2e.ts:8:9)
                    at processTicksAndRejections (internal/process/task_queues.js:95:5)
                `,
                filteredStack : `
                    at async Element.wrapCommandFn (/foo/bar/node_modules/some/fake/lib/bar.js:137:29)
                    at async Context.<anonymous> (/foo/bar/test/specs/example.e2e.ts:8:9)
                `
            }
        ]

        for (const { fullStack, filteredStack } of stackTraces) {
            expect(filteredStack).toBe(filterStackTrace(fullStack))
        }
    })
})
