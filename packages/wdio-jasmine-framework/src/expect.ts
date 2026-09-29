/**
 * Minimal view of the Jasmine env methods the hybrid `expect` needs.
 */
export interface ExpectEnv {
    expect: (actual: unknown) => object
    expectAsync: (actual: unknown) => object
}

type ExpectationFactory = () => Record<PropertyKey, unknown>

/**
 * Brand of the wrapper that expect-webdriverio's `some()` returns.
 */
const SOME_WRAPPER = Symbol.for('expect-webdriverio.some')

/**
 * WebdriverIO objects that a WDIO matcher can assert on: an element, an
 * element array, a browser, a chainable promise of one of them, or the
 * `some()` wrapper of elements.
 */
function isWebdriverIOObject (actual: unknown) {
    if (!actual || (typeof actual !== 'object' && typeof actual !== 'function')) {
        return false
    }
    return 'selector' in actual || 'sessionId' in actual || SOME_WRAPPER in actual || typeof (actual as PromiseLike<unknown>).then === 'function'
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
