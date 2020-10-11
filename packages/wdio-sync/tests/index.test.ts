import sync, { executeSync, runSync } from '../src'

beforeEach(() => {
    global.browser = {}
})

it('exports a function to make async tests sync', async () => {
    const fakeFn = jest.fn().mockReturnValue('foobar')
    expect(await sync(fakeFn)).toBe('foobar')
})

describe('executeSync', () => {
    it('should pass with default values and regular fn', async () => {
        global.browser._NOT_FIBER = true
        expect(await executeSync.call({}, () => 1, {})).toEqual(1)
        expect(global.browser._NOT_FIBER).toBe(undefined)
    })

    it('should pass with args and async fn', async () => {
        const fn = async arg => arg
        const scope = {}
        expect(await executeSync.call(scope, fn, { limit: 1, attempts: 0 }, [2])).toEqual(2)
        expect(scope.wdioRetries).toBe(0)
    })

    it('should pass without scope', async () => {
        const fn = async arg => arg
        expect(await executeSync(fn, { limit: 1, attempts: 0 }, [2])).toEqual(2)
    })

    it('should filter stack on failure', async () => {
        global.browser._NOT_FIBER = true
        let error
        try {
            await executeSync.call({}, () => { throw new Error('foobar') }, {})
        } catch (err) {
            error = err
        }
        expect(error.stack).not.toContain('at new Promise (<anonymous>)')
        expect(global.browser._NOT_FIBER).toBe(undefined)
    })

    it('should not filter stack on failure if it is missing', async () => {
        let error
        try {
            await executeSync.call({}, () => {
                const err = new Error('foobar')
                err.stack = false
                throw err
            }, {})
        } catch (err) {
            error = err
        }
        expect(error.stack).toEqual(false)
    })

    it('should repeat step on failure', async () => {
        let counter = 3
        const scope = {}
        const repeatTest = { limit: counter, attempts: 0 }

        const fn = () => {
            if (counter > 0) {
                counter--
                throw new Error('foobar')
            }
            return true
        }

        expect(await executeSync.call(scope, fn, repeatTest)).toEqual(true)
        expect(counter).toEqual(0)
        expect(repeatTest).toEqual({ limit: 3, attempts: 3 })
        expect(scope.wdioRetries).toBe(3)
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
        expect(scope.wdioRetries).toBe(2)
    })
})

describe('runSync', () => {
    it('should return value', async () => {
        const resolveFn = jest.fn()
        const rejectFn = jest.fn()

        const scope = {}
        const fibersFn = runSync.call(scope, (arg) => 'foo' + arg, {}, ['bar'])
        await fibersFn(resolveFn, rejectFn)

        expect(rejectFn).not.toBeCalled()
        expect(resolveFn).toBeCalledWith('foobar')
    })

    it('should reject promise on error', async () => {
        const resolveFn = jest.fn()
        const rejectFn = jest.fn()
        const scope = {}
        const fn = jest.fn().mockImplementation(() => { throw error })
        const error = new Error('foo')

        const fibersFn = runSync.call(scope, fn, { limit: 1, attempts: 0 })
        await fibersFn(resolveFn, rejectFn)

        expect(resolveFn).not.toBeCalled()
        expect(rejectFn).toBeCalledWith(error)
        expect(fn).toBeCalledTimes(2)
    })
})

afterEach(() => {
    delete global.browser
})
