import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { wrapCommand, executeAsync } from '../src/shim.js'

describe('wrapCommand', () => {
    it('should run command with before and after hook', async () => {
        const commandFn = vi.fn().mockReturnValue(Promise.resolve('foobar'))
        const beforeHook = vi.fn()
        const afterHook = vi.fn()
        const scope = {
            options: {
                beforeCommand: [beforeHook, beforeHook],
                afterCommand: [afterHook, afterHook, afterHook]
            }
        }
        const res = await wrapCommand('someCommand', commandFn).call(scope, 123, 'barfoo')
        expect(res).toEqual('foobar')
        expect(commandFn).toBeCalledTimes(1)
        expect(commandFn).toBeCalledWith(123, 'barfoo')

        expect(beforeHook).toBeCalledTimes(2)
        expect(beforeHook).toBeCalledWith('someCommand', [123, 'barfoo'])

        expect(afterHook).toBeCalledTimes(3)
        expect(afterHook).toBeCalledWith('someCommand', [123, 'barfoo'], 'foobar', undefined)
    })

    it('should throw but still run after command hook', async () => {
        const error = new Error('uups')
        const commandFn = vi.fn().mockReturnValue(Promise.reject(error))
        const afterHook = vi.fn()
        const scope = {
            options: {
                beforeCommand: [],
                afterCommand: [afterHook, afterHook, afterHook]
            }
        }
        const res = await wrapCommand('someCommand', commandFn).call(scope, 123, 'barfoo').catch(err => err)
        expect(res).toEqual(error)
        expect(commandFn).toBeCalledTimes(1)
        expect(commandFn).toBeCalledWith(123, 'barfoo')

        expect(afterHook).toBeCalledTimes(3)
        expect(afterHook).toBeCalledWith('someCommand', [123, 'barfoo'], undefined, error)
    })

    it('should work with single function hooks (not arrays)', async () => {
        const commandFn = vi.fn().mockReturnValue(Promise.resolve({ success: true, data: 'test' }))
        const beforeHook = vi.fn()
        const afterHook = vi.fn()
        const scope: any = {
            options: {
                beforeCommand: beforeHook, // single function, not array
                afterCommand: afterHook    // single function, not array
            }
        }
        const res = await wrapCommand('getData', commandFn).call(scope, 'param1', 'param2')
        expect(res).toEqual({ success: true, data: 'test' })
        expect(commandFn).toBeCalledTimes(1)
        expect(commandFn).toBeCalledWith('param1', 'param2')

        expect(beforeHook).toBeCalledTimes(1)
        expect(beforeHook).toBeCalledWith('getData', ['param1', 'param2'])

        expect(afterHook).toBeCalledTimes(1)
        expect(afterHook).toBeCalledWith('getData', ['param1', 'param2'], { success: true, data: 'test' }, undefined)
    })

    it('should pass actual command result to afterCommand hook, not 0/1', async () => {
        const commandResult = { title: 'Test Page', url: 'https://example.com' }
        const commandFn = vi.fn().mockReturnValue(Promise.resolve(commandResult))
        const afterHook = vi.fn()
        const scope: any = {
            options: {
                beforeCommand: [],
                afterCommand: afterHook
            }
        }
        await wrapCommand('getTitle', commandFn).call(scope)

        expect(afterHook).toBeCalledTimes(1)
        const callArgs = afterHook.mock.calls[0]
        expect(callArgs[2]).toEqual(commandResult) // result should be the actual command result
    })
})

describe('executeAsync', () => {
    describe('timeout context', () => {
        beforeEach(() => vi.useFakeTimers())
        afterEach(() => {
            vi.clearAllTimers()
            vi.useRealTimers()
            vi.unstubAllGlobals()
        })

        it('should report the effective deadline and original runnable title', async () => {
            const runnable = {
                _timeout: 200,
                title: 'timed test',
                fullTitle () { return `suite "${this.title}"` }
            }
            const scope = { _runnable: runnable }
            const result = executeAsync.call(
                scope as any, () => new Promise(() => {}), { attempts: 0, limit: 0 }, [], 50
            ).catch((err: Error) => err)
            const settled = vi.fn()
            const observed = result.then(settled)

            scope._runnable = { _timeout: 500, title: 'next test', fullTitle: () => 'next suite next test' }
            await vi.advanceTimersByTimeAsync(196)
            expect(settled).not.toHaveBeenCalled()
            await vi.advanceTimersByTimeAsync(1)

            expect(await result).toEqual(new Error('Timeout after 197ms in "suite \\"timed test\\"" (WDIO attempt 1/1)'))
            await observed
            expect(vi.getTimerCount()).toBe(0)
        })

        it.each([undefined, 'non-callable metadata'])('should identify a hook when fullTitle is %s', async (fullTitle) => {
            const scope = { _runnable: { title: 'before each hook', fullTitle } }
            const result = executeAsync.call(
                scope as any, () => new Promise(() => {}), { attempts: 0, limit: 0 }, [], 200
            ).catch((err: Error) => err)

            await vi.advanceTimersByTimeAsync(197)
            expect(await result).toEqual(new Error('Timeout after 197ms in "before each hook" (WDIO attempt 1/1)'))
        })

        it('should use a named callback when runnable titles are empty', async () => {
            const scope = { _runnable: { title: '', fullTitle: () => '' } }
            function stalledHook () { return new Promise(() => {}) }
            const result = executeAsync.call(
                scope as any, stalledHook, { attempts: 0, limit: 0 }, [], 200
            ).catch((err: Error) => err)

            await vi.advanceTimersByTimeAsync(197)
            expect(await result).toEqual(new Error('Timeout after 197ms in "stalledHook" (WDIO attempt 1/1)'))
        })

        it('should support anonymous callbacks without a runnable', async () => {
            const result = executeAsync.call(
                {}, () => new Promise(() => {}), { attempts: 0, limit: 0 }, [], 200
            ).catch((err: Error) => err)

            await vi.advanceTimersByTimeAsync(197)
            expect(await result).toEqual(new Error('Timeout after 197ms in "unknown test or hook" (WDIO attempt 1/1)'))
        })

        it('should use the Jasmine deadline when no runnable is available', async () => {
            vi.stubGlobal('jasmine', { DEFAULT_TIMEOUT_INTERVAL: 100 })
            function jasmineHook () { return new Promise(() => {}) }
            const result = executeAsync.call(
                {}, jasmineHook, { attempts: 0, limit: 0 }, [], 200
            ).catch((err: Error) => err)

            await vi.advanceTimersByTimeAsync(97)
            expect(await result).toEqual(new Error('Timeout after 97ms in "jasmineHook" (WDIO attempt 1/1)'))
        })

        it('should report the final WDIO attempt after timeout retries are exhausted', async () => {
            const scope = { _runnable: { title: 'retrying test', _currentRetry: 4 }, wdioRetries: 0 }
            const retries = { attempts: 0, limit: 1 }
            const fn = vi.fn(() => new Promise(() => {}))
            const result = executeAsync.call(scope as any, fn, retries, [], 200).catch((err: Error) => err)

            await vi.advanceTimersByTimeAsync(197)
            expect(fn).toHaveBeenCalledTimes(2)
            expect(scope.wdioRetries).toBe(1)
            await vi.advanceTimersByTimeAsync(197)

            expect(await result).toEqual(new Error('Timeout after 197ms in "retrying test" (WDIO attempt 2/2)'))
            expect(retries).toEqual({ attempts: 1, limit: 1 })
            expect(fn).toHaveBeenCalledTimes(2)
            expect(vi.getTimerCount()).toBe(0)
        })
    })

    it('should not trigger a timeout exception if the function finishes within the specified timeframe', async () => {
        const fn = () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
        const result = await executeAsync.call({}, fn, { attempts: 1, limit: 1 }, [], 300)
        expect(result).toBe(true)
    })

    it('should respect runnable timeout when provided by the framework', async () => {
        const scope = { _runnable: { _timeout: 500 } }
        const fn = () => new Promise((resolve) => setTimeout(() => resolve('ok'), 200))
        const result = await executeAsync.call(scope as any, fn, { attempts: 1, limit: 1 }, [], 50)
        expect(result).toBe('ok')
    })

    it('should retry', async () => {
        let attempts = 0
        const retryFunction = () => {
            attempts++
            if (attempts < 3) {
                return Promise.reject(new Error('Failed'))
            }
            return Promise.resolve('Success')
        }
        const result = await executeAsync.call({}, retryFunction, { attempts: 1, limit: 3 }, [], 300)
        expect(attempts).to.equal(3)
        expect(result).to.equal('Success')
    })

    it('should keep the provided timeout for follow-up retries', async () => {
        vi.useFakeTimers()

        try {
            let attempts = 0
            const retryFunction = () => {
                attempts++
                if (attempts === 1) {
                    return Promise.reject(new Error('Failed'))
                }
                return new Promise((resolve) => setTimeout(() => resolve('Success'), 25000))
            }

            const resultPromise = executeAsync.call({}, retryFunction, { attempts: 0, limit: 1 }, [], 60000)
            await vi.advanceTimersByTimeAsync(0)
            await vi.advanceTimersByTimeAsync(25000)

            await expect(resultPromise).resolves.toEqual('Success')
            expect(attempts).toBe(2)
        } finally {
            vi.useRealTimers()
        }
    })

    it('should handle errors during execution', async () => {
        const fn = () => Promise.reject(new Error('Execution Error'))
        const result = await executeAsync.call({}, fn, { attempts: 1, limit: 1 }, [], 200).catch((err) => err.message)
        expect(result).toEqual('Execution Error')
    })
})
