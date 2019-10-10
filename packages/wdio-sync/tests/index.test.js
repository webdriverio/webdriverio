import { executeSync, runSync } from '../src'

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

    it('should throw if repeatTest attemps exceeded', async () => {
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
