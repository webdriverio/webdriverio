import {
    executeHooksWithArgs, runFnInFiberContext, hasWdioSyncSupport, executeSync,
    executeAsync, runSync, wrapCommand
} from '../src/shim'

jest.mock('@wdio/sync', () => {
    throw new Error('Does not exist')
})

beforeEach(() => {
    global.browser = {}
})

afterEach(() => {
    delete global.browser
})

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

describe('hasWdioSyncSupport', () => {
    it('should be false', () => {
        expect(hasWdioSyncSupport).toBe(false)
    })
})

describe('executeSync', () => {
    it('should pass with args and async fn', async () => {
        expect(await executeSync.call({}, async arg => arg, { limit: 1, attempts: 0 }, [2])).toEqual(2)
    })

    it('should repeat step on failure', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }
        expect(await executeSync.call(scope, () => {
            if (counter > 0) {
                counter--
                throw new Error('foobar')
            }
            return true
        }, repeatTest)).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })

    it('should throw if repeatTest attempts exceeded', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter - 1, attempts: 0 }
        let error
        try {
            await executeSync.call(scope, () => {
                if (counter > 0) {
                    counter--
                    throw new Error('foobar')
                }
                return true
            }, repeatTest)
        } catch (err) {
            error = err
        }
        expect(error.message).toEqual('foobar')
        expect(repeatTest).toEqual({ limit: 2, attempts: 2 })
        expect(scope.wdioRetries).toEqual(2)
    })
})

describe('executeAsync', () => {
    it('should pass with default values and fn returning synchronous value', async () => {
        const result = await executeAsync.call({}, () => 'foo', {})
        expect(result).toEqual('foo')
    })

    it('should pass when optional arguments are passed', async () => {
        const result = await executeAsync.call({}, async arg => arg, { limit: 1, attempts: 0 }, ['foo'])
        expect(result).toEqual('foo')
    })

    it('should reject if fn throws error directly', async () => {
        let error
        const fn = () => { throw new Error('foo') }
        try {
            await executeAsync.call({}, fn, {})
        } catch (e) {
            error = e
        }
        expect(error.message).toEqual('foo')
    })

    it('should repeat if fn throws error directly and repeatTest provided', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await executeAsync.call(scope, () => {
            if (counter > 0) {
                counter--
                throw new Error('foo')
            }
            return true
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })

    it('should repeat if fn rejects and repeatTest provided', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }
        const result = await executeAsync.call(scope, () => {
            if (counter > 0) {
                counter--
                return Promise.reject('foo')
            }
            return true
        }, repeatTest)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toEqual(3)
    })
})

describe('runSync', () => {
    it('should be null', () => {
        expect(runSync).toBeNull()
    })
})

describe('wrapCommand', () => {
    it('should not run a command hook in command hook', async () => {
        const rawCommand = jest.fn().mockReturnValue(Promise.resolve('Yayy!'))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope = {
            options: {
                beforeCommand: jest.fn(),
                afterCommand: jest.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        expect(await commandA.call(scope, true, false, '!!')).toBe('Yayy!')
        expect(scope.options.beforeCommand).toBeCalledTimes(1)
        expect(scope.options.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })

    it('throws an error if command fails', async () => {
        const rawCommand = jest.fn().mockReturnValue(
            Promise.reject(new Error('Uppsi!')))
        const commandA = wrapCommand('foobar', rawCommand)
        const commandB = wrapCommand('barfoo', rawCommand)
        const scope = {
            options: {
                beforeCommand: jest.fn(),
                afterCommand: jest.fn().mockImplementation(
                    () => commandB.call(scope, 123))
            }
        }

        const error = await commandA.call(scope, true, false, '!!').catch((err) => err)
        expect(error.message).toBe('Uppsi!')
        expect(scope.options.beforeCommand).toBeCalledTimes(1)
        expect(scope.options.afterCommand).toBeCalledTimes(1)
        expect(rawCommand).toBeCalledTimes(2)
    })
})
