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

/*
 * The guards below come from expect-webdriverio (`src/util/elementsUtil.ts`
 * and `src/util/multiRemoteUtils.ts`), which does not export them. Changes:
 * - A plain array must not be empty: `[]` is a Jasmine value, for example
 *   `expect([]).toHaveSize(0)`. An empty `$$()` result is still found by
 *   `isElementArray`.
 * - A browser must also have a command, so that an application class named
 *   `Browser` is not a WebdriverIO browser.
 */
const isObject = (value: unknown): value is AnyObject => (
    !!value && (typeof value === 'object' || typeof value === 'function')
)
const hasMultiRemoteFlag = (value: AnyObject) => value.isMultiRemote === true || value.isMultiremote === true

/**
 * `selector` can be undefined, so `parent` identifies an element or an
 * element array. A not found element is still an element.
 */
const isElement = (value: unknown) => (
    isObject(value) && 'parent' in value && !Array.isArray(value) && 'getElement' in value && !hasMultiRemoteFlag(value)
)
const isElementArray = (value: unknown) => (
    isObject(value) && 'parent' in value && 'foundWith' in value && !hasMultiRemoteFlag(value)
)
/**
 * `Element[]`, for example the result of `$$().filter()`. `Array.prototype.every`
 * skips the async iterators of a multiremote element array.
 */
const isArrayOfElements = (value: unknown) => (
    Array.isArray(value) && value.length > 0 && !hasMultiRemoteFlag(value as unknown as AnyObject) &&
    Array.prototype.every.call(value, isElement)
)
const isMultiRemoteElement = (value: unknown) => (
    isObject(value) && hasMultiRemoteFlag(value) && !Array.isArray(value) && 'selector' in value
)
const isMultiRemoteElementArray = (value: unknown) => (
    isObject(value) && hasMultiRemoteFlag(value) && 'parent' in value && 'foundWith' in value && 'selector' in value
)
const isArrayOfMultiRemoteElements = (value: unknown) => (
    Array.isArray(value) && value.length > 0 && !isMultiRemoteElementArray(value) &&
    Array.prototype.every.call(value, isMultiRemoteElement)
)
/**
 * `@wdio/globals` binds every function that it returns, `constructor`
 * included, so its name can start with `bound `.
 */
const isBrowser = (value: unknown) => {
    if (!isObject(value)) {
        return false
    }
    const name = (value.constructor as { name?: string } | undefined)?.name?.replace(/^bound /, '')
    return (name === 'Browser' || !!name?.endsWith('MultiRemoteDriver')) && typeof value.getTitle === 'function'
}

/**
 * Values that a WDIO matcher can assert on: an element, an element array or
 * `Element[]`, their multiremote versions, a browser, the `some()` wrapper of
 * elements, or a promise. A chainable `$()` / `$$()` can only be found as a
 * promise, and a Jasmine sync matcher cannot check a promise, so every
 * promise goes to the WDIO matcher.
 */
function isWebdriverIOObject (actual: unknown) {
    if (!isObject(actual)) {
        return false
    }
    return typeof actual.then === 'function' ||
        SOME_WRAPPER in actual ||
        isElement(actual) || isElementArray(actual) || isArrayOfElements(actual) ||
        isMultiRemoteElement(actual) || isMultiRemoteElementArray(actual) || isArrayOfMultiRemoteElements(actual) ||
        isBrowser(actual)
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
