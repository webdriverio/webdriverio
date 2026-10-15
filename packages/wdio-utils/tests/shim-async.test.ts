import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import { executeHooksWithArgs, executeAsync, wrapCommand, setCommandHookStore } from '../src/shim.js'

const globalAny: any = global

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

beforeEach(() => {
    globalAny.browser = {} as WebdriverIO.Browser
})

afterEach(() => {
    delete globalAny.browser
})

describe('executeHooksWithArgs', () => {
    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => { return 'hoge' }
        const hookFuga = () => { return 'fuga' }
        const argHoge = { hoge: 'hoge' }
        const argFuga = { fuga: 'fuga' }
        const res = await executeHooksWithArgs('hookName', [hookHoge, hookFuga], [argHoge, argFuga])
        expect(res).toEqual(['hoge', 'fuga'])
    })

    it('one hook, one arg', async () => {
        const hook = () => { return 'hoge' }
        const arg = { hoge: 'hoge' }
        // @ts-ignore test with invalid param
        const res = await executeHooksWithArgs('hookName', hook, arg)
        expect(res).toHaveLength(1)
        expect(res).toContain('hoge')
    })

    it('with error', async () => {
        const hook = () => { throw new Error('Hoge') }
        const res = await executeHooksWithArgs('hookName', hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })

    it('return promise with error', async () => {
        const hook = () => {
            return new Promise(() => { throw new Error('Hoge') })
        }
        const res = await executeHooksWithArgs('hookName', hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })

    it('async functions', async () => {
        const hookHoge = () => {
            return new Promise(reject => setTimeout(reject, 5, new Error('Hoge')))
        }
        const hookFuga = async () => new Promise(resolve => setTimeout(resolve, 10, 'fuga'))
        const res = await executeHooksWithArgs('hookName', [hookHoge, hookFuga], [])
        expect(res).toEqual([new Error('Hoge'), 'fuga'])
    })
})

describe('executeAsync', () => {
    it('should pass with default values and fn returning synchronous value', async () => {
        const result = await executeAsync.call({}, async () => 'foo', { limit: 0, attempts: 0 })
        expect(result).toEqual('foo')
    })

    it('should pass when optional arguments are passed', async () => {
        const result = await executeAsync.call({}, async (arg: unknown) => arg, { limit: 1, attempts: 0 }, ['foo'])
        expect(result).toEqual('foo')
    })

    it('should reject if fn throws error directly', async () => {
        let error
        const fn = () => { throw new Error('foo') }
        try {
            await executeAsync.call({}, fn, { limit: 0, attempts: 0 })
        } catch (err: any) {
            error = err
        }
        expect(error.message).toEqual('foo')
    })

    it('should repeat if fn throws error directly and repeatTest provided', async () => {
        let counter = 3
        const scope = { wdioRetries: undefined }
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await executeAsync.call(scope, () => {
            if (counter > 0) {
                counter--
                throw new Error('foo')
            }
            return Promise.resolve(true)
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })

    it('should repeat if fn rejects and repeatTest provided', async () => {
        let counter = 3
        const scope = { wdioRetries: undefined }
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await executeAsync.call(scope, () => {
            if (counter > 0) {
                counter--
                return Promise.reject(new Error('foo'))
            }
            return Promise.resolve(true)
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })
})

describe('wrapCommand', () => {
    it('should not run a command hook in command hook', async () => {
        const rawCommand = vi.fn().mockReturnValue(Promise.resolve('Yayy!'))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope: any = {
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        expect(await commandA.call(scope, true, false, '!!')).toBe('Yayy!')
        expect(scope.options!.beforeCommand).toBeCalledTimes(1)
        expect(scope.options!.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })

    it('throws an error if command fails', async () => {
        const rawCommand = vi.fn().mockReturnValue(
            Promise.reject(new Error('Uppsi!')))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope: any = {
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        const error = await commandA.call(scope, true, false, '!!')
            .catch((err: Error) => err)
        expect((error as Error).message).toBe('Uppsi!')
        expect(scope.options!.beforeCommand).toBeCalledTimes(1)
        expect(scope.options!.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })

    it('allows to chain element promises', async () => {
        const rawCommand = vi.fn()
        const scope: any = {
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
            getTagName: vi.fn().mockResolvedValue('Yayy'),
            $: rawCommand
        }
        rawCommand.mockReturnValue(Promise.resolve(scope))
        const commandA = wrapCommand('$', rawCommand)
        expect(await commandA.call(scope, 'bar')
            .$('foo')
            .getTagName()
        ).toBe('Yayy')
        expect(scope.$).toBeCalledTimes(2)
        expect(scope.$).toBeCalledWith('bar')
        expect(scope.$).toBeCalledWith('foo')
        expect(scope.getTagName).toBeCalledTimes(1)
    })

    it('allows to chain element promises for custom command', async () => {
        const rawCommand = vi.fn()
        const scope: any = {
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
            getTagName: vi.fn().mockResolvedValue('Yayy'),
            user$: rawCommand
        }
        rawCommand.mockReturnValue(Promise.resolve(scope))
        const commandB = wrapCommand('user$', rawCommand)
        expect(await commandB.call(scope, 'bar')
            .user$('foo')
            .getTagName()).toBe('Yayy')
        expect(scope.user$).toBeCalledTimes(2)
        expect(scope.user$).toBeCalledWith('bar')
        expect(scope.user$).toBeCalledWith('foo')
        expect(scope.getTagName).toBeCalledTimes(1)
    })

    it('allows to access indexed element', async () => {
        const rawCommand$ = vi.fn()
        const rawCommand$$ = vi.fn()
        const scope: (i: number) => any = (i) => ({
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
            getTagName: vi.fn().mockResolvedValue('Yayy' + i),
            $: rawCommand$,
            $$: rawCommand$$
        })
        rawCommand$.mockResolvedValue(scope(0))
        rawCommand$$.mockReturnValue([
            Promise.resolve(scope(0)),
            Promise.resolve(scope(1)),
            Promise.resolve(scope(2))
        ])
        const commandA = wrapCommand('$', rawCommand$)
        expect(await commandA.call(scope(0))
            .$('foo')
            .$$('bar')[2]
            .getTagName()
        ).toBe('Yayy2')
        expect(await commandA.call(scope(0))
            .$('foo')
            .$$('bar')[2]
            .$('barfoo')
            .getTagName()
        ).toBe('Yayy0')
        expect(rawCommand$$).toBeCalledTimes(2)
        expect(rawCommand$$).toBeCalledWith('bar')
    })

    /**
     * an `async` `overwriteCommand('$$')` gives a promise of an element list: the list
     * reads its own index, with its own wait and its "not found" item (#12576)
     */
    it('reads an index of a promise of an element list from the list', async () => {
        const waitUntil = vi.fn()
        const items = [{ elementId: 'a' }, { elementId: 'b' }, { elementId: 'c' }]
        const notFound = { index: 5, error: new Error('Index out of bounds! $$(li) returned only 3 elements.') }
        const list = new Proxy(items, {
            get (target, prop, receiver) {
                if (prop === Symbol.for('wdio.kind')) {
                    return 'element-array'
                }
                if (prop === '5') {
                    return Promise.resolve(notFound)
                }
                return Reflect.get(target, prop, receiver)
            }
        })
        const scope = { options: {}, waitUntil, $$: vi.fn().mockReturnValue(Promise.resolve(list)) }

        const command$$ = wrapCommand('$$', scope.$$)
        expect(await command$$.call(scope, 'li')[1]).toBe(items[1])
        expect(await command$$.call(scope, 'li')[5]).toBe(notFound)
        expect(waitUntil).not.toHaveBeenCalled()
    })

    it('offers array methods on elements', async () => {
        const rawCommand$ = vi.fn()
        const rawCommand$$ = vi.fn()
        const scope: (i: number) => any = (i) => ({
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
            getTagName: vi.fn().mockResolvedValue('Yayy' + i),
            $: rawCommand$,
            $$: rawCommand$$
        })
        rawCommand$.mockResolvedValue(scope(0))
        rawCommand$$.mockReturnValue([
            Promise.resolve(scope(0)),
            Promise.resolve(scope(1)),
            Promise.resolve(scope(2))
        ])
        const commandA = wrapCommand('$', rawCommand$)
        expect(await commandA.call(scope(0))
            .$('foo')
            .$$('bar')
            .map((el: any) => el.getTagName())
        ).toEqual(['Yayy0', 'Yayy1', 'Yayy2'])

        expect(await commandA.call(scope(0))
            .$('foo')
            .$$('bar')
            .reduce(async (acc: string, el: any) => {
                return await el.getTagName() + '_' + acc
            }, '')
        ).toEqual('Yayy2_Yayy1_Yayy0_')
    })

    it('can access element properties', async () => {
        const scope: any = {
            options: {
                beforeCommand: vi.fn(),
                afterCommand: vi.fn()
            },
            selector: 'foobar'
        }
        const rawCommand = vi.fn().mockReturnValue(Promise.resolve(scope))
        const commandA = wrapCommand('$', rawCommand)
        expect(await commandA.call(scope).selector).toBe('foobar')
    })

    it('can iterate over elements asynchronously', async () => {
        const options = {
            beforeCommand: vi.fn(),
            afterCommand: vi.fn()
        }
        const scope: any = [{
            selector: 'foobarA',
            options
        }, {
            selector: 'foobarB',
            options
        }, {
            selector: 'foobarC',
            options
        }]
        scope.options = options
        const rawCommand = vi.fn().mockReturnValue(Promise.resolve(scope))
        const commandA = wrapCommand('$$', rawCommand).bind(scope) as unknown as (sel: string) => Promise<any>[]

        const expectedResults = ['foobarA', 'foobarB', 'foobarC']
        let i = 0
        for await (const elem of commandA('selector')) {
            expect(expectedResults[i++]).toBe(elem.selector)
        }
    })

    it('throws an error if iterating through a non array', async () => {
        expect.assertions(1)
        const options = {
            beforeCommand: vi.fn(),
            afterCommand: vi.fn()
        }
        const scope: any = {
            selector: 'foobarA',
            options
        }
        scope.options = options
        const rawCommand = vi.fn().mockReturnValue(Promise.resolve(scope))
        const commandA = wrapCommand('$', rawCommand).bind(scope) as unknown as (sel: string) => Promise<any>[]

        try {
            for await (const elem of commandA('selector')) {
                console.log(elem)
            }
        } catch (err: any) {
            expect(err.message).toBe('Can not iterate over non array')
        }
    })
})

describe('command hook store', () => {
    const makeScope = (hook: () => unknown) => ({
        options: { beforeCommand: vi.fn(), afterCommand: vi.fn().mockImplementation(hook) }
    }) as any

    it('default store releases the flag after hooks, also when a hook throws', async () => {
        const rawCommand = vi.fn().mockResolvedValue('ok')
        const command = wrapCommand('foobar', rawCommand)
        const nested = wrapCommand('barfoo', rawCommand)
        const scope = makeScope(() => nested.call(scope, 1))
        expect(await command.call(scope)).toBe('ok')
        expect(await command.call(scope)).toBe('ok')
        expect(scope.options.beforeCommand).toBeCalledTimes(2)

        const failing = makeScope(() => { throw new Error('hook failed') })
        await command.call(failing).catch(() => {})
        const after = makeScope(() => {})
        await command.call(after)
        expect(after.options.beforeCommand).toBeCalledTimes(1)
    })

    it('uses a registered AsyncLocalStorage and isolates concurrent chains', async () => {
        const als = new AsyncLocalStorage<true>()
        const runSpy = vi.spyOn(als, 'run')
        setCommandHookStore(als)
        try {
            let release!: () => void
            const gate = new Promise<void>((resolve) => { release = resolve })
            const slow = vi.fn().mockImplementation(() => gate)
            const fast = vi.fn().mockResolvedValue('ok')
            const slowScope: any = { options: { beforeCommand: vi.fn(), afterCommand: vi.fn() } }
            slowScope.options.beforeCommand.mockImplementation(() => gate)
            const slowCmd = wrapCommand('slow', slow)
            const fastCmd = wrapCommand('fast', fast)

            const pending = slowCmd.call(slowScope)
            const otherScope: any = { options: { beforeCommand: vi.fn(), afterCommand: vi.fn() } }
            await fastCmd.call(otherScope)
            expect(otherScope.options.beforeCommand).toBeCalledTimes(1)
            release()
            await pending
            expect(runSpy).toBeCalled()
        } finally {
            setCommandHookStore({ getStore: () => undefined, run: (_, fn) => fn() })
        }
    })
})
