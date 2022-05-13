import { vi, describe, it, expect } from 'vitest'
import { wrapCommand, expectAsyncShim } from '../src/shim'

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

it('expectAsyncShim', () => {
    global.expectAsync = vi.fn()
    const expectSync = vi.fn()
    expectAsyncShim(undefined, expectSync)
    expect(expectSync).toBeCalledTimes(1)
    expect(global.expectAsync).toBeCalledTimes(0)
    expectAsyncShim(42, expectSync)
    expect(expectSync).toBeCalledTimes(2)
    expect(global.expectAsync).toBeCalledTimes(0)
    expectAsyncShim(Promise.resolve({}), expectSync)
    expect(expectSync).toBeCalledTimes(2)
    expect(global.expectAsync).toBeCalledTimes(1)
    expectAsyncShim({ elementId: 42 }, expectSync)
    expect(expectSync).toBeCalledTimes(2)
    expect(global.expectAsync).toBeCalledTimes(2)
    expectAsyncShim({ sessionId: '42' }, expectSync)
    expect(expectSync).toBeCalledTimes(2)
    expect(global.expectAsync).toBeCalledTimes(3)
})
