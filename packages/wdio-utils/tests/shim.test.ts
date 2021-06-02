import { wrapCommand, switchSyncFlag, runAsync } from '../src/shim'

describe('wrapCommand', () => {
    it('should run command with before and after hook', async () => {
        const commandFn = jest.fn().mockReturnValue(Promise.resolve('foobar'))
        const beforeHook = jest.fn()
        const afterHook = jest.fn()
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
        const commandFn = jest.fn().mockReturnValue(Promise.reject(error))
        const afterHook = jest.fn()
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

describe('switchSyncFlag', () => {
    it('should switch runAsync flag', () => {
        expect(runAsync).toBe(true)
        switchSyncFlag(() => {
            expect(runAsync).toBe(false)
            return {}
        })()
        expect(runAsync).toBe(true)
    })

    it('should switch back when returning a promise', async () => {
        expect(runAsync).toBe(true)
        await switchSyncFlag(() => {
            expect(runAsync).toBe(false)
            return Promise.resolve(true)
        })()
        expect(runAsync).toBe(true)
    })

    it('should switch back when returning a function', () => {
        expect(runAsync).toBe(true)
        const fn = switchSyncFlag(() => {
            expect(runAsync).toBe(false)
            return () => {
                expect(runAsync).toBe(true)
                return {}
            }
        })()
        expect(runAsync).toBe(false)
        // eslint-disable-next-line
        runAsync = true
        fn()
        expect(runAsync).toBe(true)
    })

    it('should switch back when returning a function with promise', async () => {
        expect(runAsync).toBe(true)
        const fn = switchSyncFlag(() => {
            expect(runAsync).toBe(false)
            return () => {
                expect(runAsync).toBe(true)
                return Promise.resolve({})
            }
        })()
        expect(runAsync).toBe(false)
        // eslint-disable-next-line
        runAsync = true
        await fn()
        expect(runAsync).toBe(true)
    })
})
