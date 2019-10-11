import { executeSync, runSync, executeAsync } from '../src'

beforeAll(() => {
    if (!global.browser) {
        global.browser = {}
    }
})

describe('executeSync', () => {
    it('should pass with default values and regular fn', async () => {
        global.browser._NOT_FIBER = true
        expect(await executeSync(() => 1)).toEqual(1)
        expect(global.browser._NOT_FIBER).toBe(undefined)
    })

    it('should pass with args and async fn', async () => {
        expect(await executeSync(async arg => arg, 1, [2])).toEqual(2)
    })

    it('should filter stack on failure', async () => {
        global.browser._NOT_FIBER = true
        let error
        try {
            await executeSync(() => { throw new Error('foobar') })
        } catch (err) {
            error = err
        }
        expect(error.stack).not.toContain('at new Promise (<anonymous>)')
        expect(global.browser._NOT_FIBER).toBe(undefined)
    })

    it('should not filter stack on failure if it is missing', async () => {
        let error
        try {
            await executeSync(() => {
                const err = new Error('foobar')
                err.stack = false
                throw err
            })
        } catch (err) {
            error = err
        }
        expect(error.stack).toEqual(false)
    })

    it('should repeat step on failure', async () => {
        let counter = 3
        expect(await executeSync(() => {
            if (counter > 0) {
                counter--
                throw new Error('foobar')
            }
            return true
        }, counter)).toEqual(true)
        expect(counter).toEqual(0)
    })

    it('should throw if repeatTest attempts exceeded', async () => {
        let counter = 3
        let error
        try {
            await executeSync(() => {
                if (counter > 0) {
                    counter--
                    throw new Error('foobar')
                }
                return true
            }, counter - 1)
        } catch (err) {
            error = err
        }
        expect(error.message).toEqual('foobar')
    })
})

describe('executeAsync', () => {
    it('should pass with default values and fn returning synchronous value', async () => {
        const result = await executeAsync(() => 'foo')
        expect(result).toEqual('foo')
    })

    it('should pass when optional arguments are passed', async () => {
        const result = await executeAsync(async arg => arg, 1, ['foo'])
        expect(result).toEqual('foo')
    })

    it('should reject if fn throws error directly', async () => {
        let error
        const hook = () => {throw new Error('foo')}
        try {
            await executeAsync(hook)
        } catch (e) {
            error = e
        }
        expect(error.message).toEqual('foo')
    })

    it('should repeat if fn throws error directly and repeatTest provided', async () => {
        let counter = 3
        const result = await executeAsync(() => {
            if (counter > 0) {
                counter--
                throw new Error('foo')
            }
            return true
        }, counter)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
    })

    it('should return rejected promise if fn rejects', async () => {
        let error
        try {
            await executeAsync(() => Promise.reject('foo'), 1)
        } catch (e) {
            error = e
        }
        expect(error).toEqual('foo')
    })

    it('should repeat if fn rejects and repeatTest provided', async () => {
        let counter = 3
        const result = await executeAsync(() => {
            if (counter > 0) {
                counter--
                return Promise.reject('foo')
            }
            return true
        }, counter)
        expect(result).toEqual(true)
        expect(counter).toEqual(0)
    })
})

describe('runSync', () => {
    it('should return value', async () => {
        const resolveFn = jest.fn()
        const rejectFn = jest.fn()

        const fibersFn = runSync((arg) => 'foo' + arg, undefined, ['bar'])
        await fibersFn(resolveFn, rejectFn)

        expect(rejectFn).not.toBeCalled()
        expect(resolveFn).toBeCalledWith('foobar')
    })
    it('should reject promise on error', async () => {
        const resolveFn = jest.fn()
        const rejectFn = jest.fn()
        const fn = jest.fn().mockImplementation(() => { throw error })
        const error = new Error('foo')

        const fibersFn = runSync(fn, 1)
        await fibersFn(resolveFn, rejectFn)

        expect(resolveFn).not.toBeCalled()
        expect(rejectFn).toBeCalledWith(error)
        expect(fn).toBeCalledTimes(2)
    })
})
