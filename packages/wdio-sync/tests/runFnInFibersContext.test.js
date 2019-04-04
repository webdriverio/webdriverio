import runFnInFiberContext from '../src/runFnInFiberContext'

test('should wrap a successful running command', async () => {
    const wrappedFn = runFnInFiberContext(function (arg) {
        return this.scopedVar + arg
    })

    expect(await wrappedFn.call({ scopedVar: 'foo' }, 'bar')).toBe('foobar')
})

test('should wrap a failing running command', async () => {
    const wrappedFn = runFnInFiberContext(function (arg) {
        throw new Error(this.scopedVar + arg)
    })

    await expect(wrappedFn.call({ scopedVar: 'foo' }, 'bar'))
        .rejects.toThrow(new Error('foobar'))
})
