/**
 * The `expect` export of expect-webdriverio is the Jest-based `expect` at
 * runtime. The Jasmine types of the global `expect` must not change it.
 * The `expect` export of `@wdio/globals` is the global `expect`.
 */
import { expect as wdioExpect } from 'expect-webdriverio'
import { expect as globalsExpect } from '@wdio/globals'

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false
function assertType<T extends true>(_: T) {}

async function jestMatchers () {
    wdioExpect({ a: 1 }).toHaveProperty('a')
    wdioExpect(1).toStrictEqual(1)
    await wdioExpect(Promise.resolve(1)).resolves.toBe(1)
    await wdioExpect(browser).toHaveTitle('foo')
}
assertType<Equals<ReturnType<typeof jestMatchers>, Promise<void>>>(true)

// @ts-expect-error Jasmine matcher that Jest does not have
wdioExpect(1).toBeTrue()

assertType<Equals<ReturnType<typeof globalsSyncMatcher>, void>>(true)
function globalsSyncMatcher () {
    return globalsExpect(true).toBeTrue()
}
assertType<Equals<ReturnType<typeof globalsWdioMatcher>, Promise<void>>>(true)
function globalsWdioMatcher () {
    return globalsExpect(browser).toHaveTitle('foo')
}
