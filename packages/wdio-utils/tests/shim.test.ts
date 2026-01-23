import { vi, describe, it, expect } from 'vitest'
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
    it('should trigger a timeout exception if the function finishes within the specified timeframe', async () => {
        const fn = () => new Promise((resolve) => setTimeout(resolve, 300))
        const result = await executeAsync.call({}, fn, { attempts: 1, limit: 1 }, [], 200).catch((err) => err.message)
        expect(result).toEqual('Timeout')
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
