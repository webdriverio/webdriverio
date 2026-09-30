import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { wrapCommand, executeAsync } from '../src/shim.js'
import { WDIO_KIND, WDIO_CHAINABLE } from '../src/kind.js'

type Branded = { [WDIO_KIND]?: unknown, [WDIO_CHAINABLE]?: unknown }
const brandsOf = (value: unknown) => ({
    kind: (value as Branded)[WDIO_KIND],
    chainable: (value as Branded)[WDIO_CHAINABLE]
})

const W3C_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

describe('wrapCommand', () => {
    it('serializes a chained element with the W3C element reference', async () => {
        const commandFn = vi.fn().mockResolvedValue({ elementId: 'abc-123', selector: '#foo' })
        const scope = { options: { beforeCommand: [], afterCommand: [] } }
        const chained = wrapCommand('$', commandFn).call(scope) as { toJSON: () => Promise<Record<string, string>> }

        await expect(chained.toJSON()).resolves.toEqual({
            [W3C_ELEMENT_KEY]: 'abc-123'
        })
    })

    describe('brand of the chainable promise', () => {
        const scope = { options: { beforeCommand: [], afterCommand: [] } }

        it('brands element queries as chainable elements', () => {
            for (const command of ['$', 'shadow$', 'parentElement']) {
                expect(brandsOf(wrapCommand(command, vi.fn().mockResolvedValue({})).call(scope)))
                    .toEqual({ kind: 'element', chainable: true })
            }
        })

        it('does not brand a $$-type command that does not return an ElementArray, or its items', () => {
            for (const command of ['$$', 'custom$$']) {
                const chain = wrapCommand(command, vi.fn().mockResolvedValue([{ selector: 'li' }])).call(scope) as unknown as Record<string, unknown>

                expect(brandsOf(chain)).toEqual({ kind: undefined, chainable: undefined })
                expect(brandsOf(chain[0])).toEqual({ kind: undefined, chainable: undefined })
                expect(WDIO_KIND in chain).toBe(false)
            }
        })

        it('brands a pending element list as an element list that is not chainable', () => {
            const customList = wrapCommand('allFoo$$', vi.fn().mockResolvedValue([])).call(scope) as object
            /**
             * a chained `$$` without a registered ElementArray factory keeps the promise proxy
             */
            const chainedScope = Object.assign(Promise.resolve(scope), scope)
            const chainedList = wrapCommand('$$', vi.fn().mockResolvedValue([])).call(chainedScope) as object

            for (const list of [customList, chainedList]) {
                expect(brandsOf(list)).toEqual({ kind: 'element-array', chainable: undefined })
                expect(WDIO_KIND in list).toBe(true)
                expect(WDIO_CHAINABLE in list).toBe(false)
            }
        })

        it('supports `in` on the chain', () => {
            const chain = wrapCommand('$', vi.fn().mockResolvedValue({})).call(scope) as object

            expect(WDIO_KIND in chain).toBe(true)
            expect(WDIO_CHAINABLE in chain).toBe(true)
            expect('then' in chain).toBe(true)
        })

        it('does not brand results that are not elements', () => {
            const chain = wrapCommand('$$', vi.fn().mockResolvedValue([])).call(scope) as unknown as { map: (fn: Function) => unknown }
            const select = wrapCommand('select', vi.fn().mockResolvedValue({})).call(scope) as object
            const command = wrapCommand('getTitle', vi.fn().mockResolvedValue('title')).call(scope)

            expect(brandsOf(chain.map(() => 1))).toEqual({ kind: undefined, chainable: undefined })
            expect(brandsOf(select)).toEqual({ kind: undefined, chainable: undefined })
            expect(WDIO_KIND in select).toBe(false)
            expect(WDIO_CHAINABLE in select).toBe(false)
            expect(brandsOf(command)).toEqual({ kind: undefined, chainable: undefined })
        })
    })

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
