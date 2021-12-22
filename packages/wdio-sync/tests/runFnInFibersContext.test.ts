import { Browser } from 'webdriverio'

import runFnInFiberContext from '../src/runFnInFiberContext'

beforeAll(() => {
    if (!global.browser) {
        global.browser = {} as any as Browser
    }
})

interface Scope extends Browser{
    scopedVar: string
}

test('should wrap a successful running command', async () => {
    global.browser._NOT_FIBER = true
    const wrappedFn = runFnInFiberContext(function (this: Scope, arg: string) {
        return this.scopedVar + arg
    })

    expect(await wrappedFn.call({ scopedVar: 'foo' } as Scope, 'bar')).toBe('foobar')
    expect(global.browser._NOT_FIBER).toBe(undefined)
})

test('should wrap a failing running command', async () => {
    global.browser._NOT_FIBER = true
    const wrappedFn = runFnInFiberContext(function (this: Scope, arg: string) {
        throw new Error(this.scopedVar + arg)
    })

    await expect(wrappedFn.call({ scopedVar: 'foo' } as Scope, 'bar'))
        .rejects.toThrow(new Error('foobar'))
    expect(global.browser._NOT_FIBER).toBe(undefined)
})
