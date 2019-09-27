import { executeHooksWithArgs, runFnInFiberContext, wrapCommand, hasWdioSyncSupport, executeSync, executeAsync, runSync } from '../src/shim'

describe('executeHooksWithArgs', () => {
    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => { return 'hoge' }
        const hookFuga = () => { return 'fuga' }
        const argHoge = { hoge: 'hoge' }
        const argFuga = { fuga: 'fuga' }
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [argHoge, argFuga])
        expect(res).toEqual(['hoge', 'fuga'])
    })

    it('one hook, one arg', async () => {
        const hook = () => { return 'hoge' }
        const arg = { hoge: 'hoge' }
        const res = await executeHooksWithArgs(hook, arg)
        expect(res).toHaveLength(1)
        expect(res).toContain('hoge')
    })

    it('with error', async () => {
        const hook = () => { throw new Error('Hoge') }
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })

    it('return promise with error', async () => {
        const hook = () => {
            return new Promise(() => { throw new Error('Hoge') })
        }
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })

    it('async functions', async () => {
        const hookHoge = () => {
            return new Promise(reject => setTimeout(reject, 5, new Error('Hoge')))
        }
        const hookFuga = async () => new Promise(resolve => setTimeout(resolve, 10, 'fuga'))
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [])
        expect(res).toEqual([new Error('Hoge'), 'fuga'])
    })
})

describe('runFnInFiberContext', () => {
    it('should return fn that returns Promise', async () => {
        const fn = runFnInFiberContext(function (bar) {
            return this.foo + bar
        }.bind({ foo: 3 }))

        expect(await fn(4)).toBe(7)
    })
})

describe('wrapCommand', () => {
    it('should return original function', () => {
        expect(wrapCommand(null, 1)).toBe(1)
    })
})

describe('hasWdioSyncSupport', () => {
    it('should be false', () => {
        expect(hasWdioSyncSupport).toBe(false)
    })
})

describe('executeSync', () => {
    it('should apply context and args', () => {
        expect(executeAsync.call({ foo: 3 }, function (bar) {
            return this.foo + bar
        }, null, [4])).toBe(7)
    })

    it('should apply context and default args', () => {
        expect(executeAsync(function (...args) {
            return args
        })).toEqual([])
    })
})

describe('executeAsync', () => {
    it('should apply context and args', () => {
        expect(executeSync.call({ foo: 3 }, function (bar) {
            return this.foo + bar
        }, null, [4])).toBe(7)
    })

    it('should apply context and default args', () => {
        expect(executeSync(function (...args) {
            return args
        })).toEqual([])
    })
})

describe('runSync', () => {
    it('should be null', () => {
        expect(runSync).toBeNull()
    })
})
