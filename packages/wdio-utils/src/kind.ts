/**
 * Brands that tell other packages what a WebdriverIO object is, see #15812.
 *
 * The symbols are the public protocol: `Symbol.for()` returns the same symbol in
 * every copy of this package, so other packages (for example expect-webdriverio)
 * read `value?.[Symbol.for('wdio.kind')]` without importing WebdriverIO, and it
 * still works with two copies of WebdriverIO in one project. The brands are not
 * enumerable, so they do not appear in logs, snapshots or JSON.
 *
 * The kind is only the role of the object. It does not tell if the object is
 * multi-remote (read `isMultiRemote`), because that can be unknown when the
 * object is created, and a brand must not change after it is set.
 */
export const WDIO_KIND: unique symbol = Symbol.for('wdio.kind') as typeof WDIO_KIND

/**
 * `true` only on an unresolved element promise: `$()`, `$$()[i]` or
 * `$().parentElement()` before `await`. Its kind is `'element'`. A pending
 * `$$()` is an element list (`'element-array'`) and has no chainable brand.
 */
export const WDIO_CHAINABLE: unique symbol = Symbol.for('wdio.chainable') as typeof WDIO_CHAINABLE

export const WDIO_KINDS = ['browser', 'element', 'element-array'] as const

export type WdioKind = typeof WDIO_KINDS[number]

/**
 * Sets the kind on `target` as a non-enumerable property.
 */
export function setWdioKind<T extends object> (target: T, kind: WdioKind): T {
    return Object.defineProperty(target, WDIO_KIND, { value: kind, configurable: true })
}
