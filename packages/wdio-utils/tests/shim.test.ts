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
})

describe('executeAsync', () => {
    it('should trigger a timeout exception if the function finishes within the specified timeframe', async () => {
        const fn = () => new Promise((resolve) => setTimeout(resolve, 300))
        const result = await executeAsync(fn, { attempts: 1, limit: 1 }, [], 200).catch((err) => err.message)
        expect(result).toEqual('Timeout')
    })

    it('should not trigger a timeout exception if the function finishes within the specified timeframe', async () => {
        const fn = () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
        const result = await executeAsync(fn, { attempts: 1, limit: 1 }, [], 300)
        expect(result).toBe(true)
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
        const result = await executeAsync(retryFunction, { attempts: 1, limit: 3 }, [], 300)
        expect(attempts).to.equal(3)
        expect(result).to.equal('Success')
    })

    it('should handle errors during execution', async () => {
        const fn = () => Promise.reject(new Error('Execution Error'))
        const result = await executeAsync(fn, { attempts: 1, limit: 1 }, [], 200).catch((err) => err.message)
        expect(result).toEqual('Execution Error')
    })
})
