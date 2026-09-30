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
 *
 * The contract (the brand matrix in `webdriverio/tests/kind.test.ts` checks it):
 * 1. A loaded object has the kind of its role: a browser, an element (also one
 *    that was not found, with `error`) or an element list. A copy of a list
 *    (`[...list]`, `list.map()`) is a plain array and has no kind.
 * 2. Before `await`, only the command name tells the kind:
 *    - an element query (`$`, a custom command that ends with `$`,
 *      `parentElement`, `nextElement`, `previousElement`), an index or `at()` of a
 *      pending list, and an index past the end of a loaded list (it waits for the
 *      item) are chainable elements: kind `'element'` and `WDIO_CHAINABLE`
 *    - a list query (`$$`, a custom command that ends with `$$`) and `slice()` of
 *      a pending list are element lists
 *    - every other promise has no brand, also when it gives an element
 *      (`getElement()`, `find()`, a custom command without `$` at the end)
 * 3. `await` does not change the kind. It can remove it only when a custom
 *    command name does not tell the truth (`count$$` that returns a number).
 * 4. A loaded object is never chainable.
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

/**
 * The kind of `value`, or `undefined` if `value` is not a WebdriverIO object. Only a
 * kind from `WDIO_KINDS` counts, so a proxy that returns a value for every property
 * (for example a deep mock) is not a WebdriverIO object.
 */
export function getWdioKind (value: unknown): WdioKind | undefined {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
        return undefined
    }
    const kind = (value as { [WDIO_KIND]?: unknown })[WDIO_KIND]
    return WDIO_KINDS.includes(kind as WdioKind) ? kind as WdioKind : undefined
}

/**
 * `true` for a loaded element. A chainable `$()` has the kind `'element'` too, but
 * it is a promise, not an element.
 */
export function isLoadedElement (value: unknown): boolean {
    return getWdioKind(value) === 'element' && (value as { [WDIO_CHAINABLE]?: unknown })[WDIO_CHAINABLE] !== true
}

/**
 * `true` for an array whose items are all loaded elements, for example a copy of an
 * element list (`[...list]`) or the result of `list.filter()`. `[]` is not a
 * WebdriverIO value, for example in `expect([]).toHaveSize(0)`.
 *
 * The `every` of an element list is async and returns a promise, which is always
 * truthy, so `Array.prototype.every` is used.
 */
export function isArrayOfElements (value: unknown): boolean {
    return Array.isArray(value) && value.length > 0 && Array.prototype.every.call(value, isLoadedElement)
}
