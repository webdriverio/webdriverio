import runFnInFiberContext from '../src/runFnInFiberContext'

const globalAny: any = global

beforeAll(() => {
    if (!globalAny.browser) {
        globalAny.browser = {}
    }
})

test('should wrap a successful running command', async () => {
    globalAny.browser._NOT_FIBER = true
    const wrappedFn = runFnInFiberContext(function (this: any, arg: any) {
        return this.scopedVar + arg
    })

    expect(await wrappedFn.call({ scopedVar: 'foo' }, 'bar')).toBe('foobar')
    expect(globalAny.browser._NOT_FIBER).toBe(undefined)
})

test('should wrap a failing running command', async () => {
    globalAny.browser._NOT_FIBER = true
    const wrappedFn = runFnInFiberContext(function (this: any, arg: any) {
        throw new Error(this.scopedVar + arg)
    })

    await expect(wrappedFn.call({ scopedVar: 'foo' }, 'bar'))
        .rejects.toThrow(new Error('foobar'))
    expect(globalAny.browser._NOT_FIBER).toBe(undefined)
})
