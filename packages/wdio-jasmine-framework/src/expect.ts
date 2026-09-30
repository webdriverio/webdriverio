import { WDIO_KIND } from '@wdio/utils'

/**
 * Minimal view of the Jasmine env methods the hybrid `expect` needs.
 */
export interface ExpectEnv {
    expect: (actual: unknown) => object
    expectAsync: (actual: unknown) => object
}

type ExpectationFactory = () => Record<PropertyKey, unknown>
type AnyObject = Record<PropertyKey, unknown>

/**
 * Brand of the wrapper that expect-webdriverio's `some()` returns.
 */
const SOME_WRAPPER = Symbol.for('expect-webdriverio.some')

const isObject = (value: unknown): value is AnyObject => (
    !!value && (typeof value === 'object' || typeof value === 'function')
)

/**
 * The `wdio.kind` brand of a WebdriverIO object, see `@wdio/utils` `kind.ts`. It is
 * set on browsers, elements, element lists (also multi-remote) and chainable
 * `$()`, and it passes through the `@wdio/globals` proxies, which forward reads.
 */
const kindOf = (value: unknown) => isObject(value) ? (value as { [WDIO_KIND]?: unknown })[WDIO_KIND] : undefined

/**
 * A copy of an element list (`[...await $$()]`): a plain array whose items are
 * elements. `[]` is a Jasmine value, for example `expect([]).toHaveSize(0)`.
 */
const isArrayOfElements = (value: unknown) => (
    Array.isArray(value) && value.length > 0 && value.every((item) => kindOf(item) === 'element')
)

/**
 * Values that a WDIO matcher can assert on: a WebdriverIO object, a copy of an
 * element list, the `some()` wrapper of elements, or a promise. A Jasmine sync
 * matcher cannot check a promise, and a WDIO matcher awaits it (for example a
 * promise of an element from an async function), so every promise goes to WDIO.
 */
function isWebdriverIOObject (actual: unknown) {
    if (!isObject(actual)) {
        return false
    }
    return kindOf(actual) !== undefined ||
        isArrayOfElements(actual) ||
        SOME_WRAPPER in actual ||
        typeof actual.then === 'function'
}

/**
 * Create the global `expect` for the Jasmine framework. Each matcher call goes
 * to the Jasmine expectation that owns it:
 *
 * - Jasmine sync matchers and `jasmine.addMatchers` matchers use `env.expect`,
 *   so they return `void` and honour `stopSpecOnExpectationFailure`.
 * - WDIO matchers, Jasmine async matchers and `jasmine.addAsyncMatchers`
 *   matchers use `env.expectAsync` and return a promise.
 *
 * When a WDIO matcher has the same name as a Jasmine sync matcher (for
 * example `toHaveSize`), the WDIO matcher runs for WebdriverIO objects and the
 * Jasmine matcher runs for every other value.
 */
export function createHybridExpect (env: ExpectEnv, wdioMatcherNames: Set<string>) {
    const hybrid = (actual: unknown, toSync: ExpectationFactory, toAsync: ExpectationFactory): object => new Proxy({}, {
        get (_, prop) {
            if (prop === 'not') {
                return hybrid(actual, () => toSync().not as Record<PropertyKey, unknown>, () => toAsync().not as Record<PropertyKey, unknown>)
            }
            if (prop === 'withContext') {
                return (message: string) => hybrid(
                    actual,
                    () => (toSync().withContext as Function)(message),
                    () => (toAsync().withContext as Function)(message)
                )
            }
            if (typeof prop !== 'string') {
                return undefined
            }

            const syncExpectation = toSync()
            const isSyncMatcher = prop in syncExpectation
            const useAsync = wdioMatcherNames.has(prop)
                ? !isSyncMatcher || isWebdriverIOObject(actual)
                : !isSyncMatcher
            const target = useAsync ? toAsync() : syncExpectation
            const value = target[prop]
            return typeof value === 'function' ? value.bind(target) : value
        }
    })

    return (actual: unknown) => hybrid(
        actual,
        () => env.expect(actual) as Record<PropertyKey, unknown>,
        () => env.expectAsync(actual) as Record<PropertyKey, unknown>
    )
}
