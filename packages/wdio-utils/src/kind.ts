/**
 * Brand that tells which kind of WebdriverIO object a value is, see #15812.
 *
 * `Symbol.for()` returns the same symbol in every copy of this package, so other
 * packages (for example expect-webdriverio) can read the brand without importing
 * WebdriverIO, and it still works with two copies of WebdriverIO in one project.
 * The brand is not enumerable, so it does not appear in logs, snapshots or JSON.
 */
export const WDIO_KIND: unique symbol = Symbol.for('wdio.kind') as typeof WDIO_KIND

export const WDIO_KINDS = [
    'browser',
    'multi-remote-browser',
    'element',
    'multi-remote-element',
    'element-array',
    'multi-remote-element-array',
    'chainable-element',
    'chainable-element-array'
] as const

export type WdioKind = typeof WDIO_KINDS[number]

/**
 * Sets the brand on `target` as a non-enumerable property.
 */
export function setWdioKind<T extends object> (target: T, kind: WdioKind): T {
    return Object.defineProperty(target, WDIO_KIND, { value: kind, configurable: true })
}

/**
 * Returns the kind of a WebdriverIO object, or `undefined` for any other value.
 *
 * It reads the property and does not use `in`, because proxies such as the
 * `browser` of `@wdio/globals` forward property reads but not `in` checks.
 */
export function getWdioKind (value: unknown): WdioKind | undefined {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
        return undefined
    }
    const kind = (value as { [WDIO_KIND]?: unknown })[WDIO_KIND]
    return WDIO_KINDS.includes(kind as WdioKind) ? kind as WdioKind : undefined
}

const BROWSER_KINDS: readonly WdioKind[] = ['browser', 'multi-remote-browser']
const ELEMENT_KINDS: readonly WdioKind[] = ['element', 'multi-remote-element', 'chainable-element']
const ELEMENT_ARRAY_KINDS: readonly WdioKind[] = ['element-array', 'multi-remote-element-array', 'chainable-element-array']
const MULTI_REMOTE_KINDS: readonly WdioKind[] = ['multi-remote-browser', 'multi-remote-element', 'multi-remote-element-array']
const CHAINABLE_KINDS: readonly WdioKind[] = ['chainable-element', 'chainable-element-array']

const hasKindIn = (kinds: readonly WdioKind[]) => (value: unknown): boolean => {
    const kind = getWdioKind(value)
    return kind !== undefined && kinds.includes(kind)
}

/**
 * `true` for a browser or a multi-remote browser.
 */
export const isBrowserKind = hasKindIn(BROWSER_KINDS)

/**
 * `true` for an element, a multi-remote element, or a chainable `$()` that is
 * not awaited yet. Use `getWdioKind()` to tell them apart.
 */
export const isElementKind = hasKindIn(ELEMENT_KINDS)

/**
 * `true` for an element list (`$$()`), a multi-remote element list, or a
 * chainable element list. Use `getWdioKind()` to tell them apart.
 */
export const isElementArrayKind = hasKindIn(ELEMENT_ARRAY_KINDS)

/**
 * `true` for a multi-remote browser, element or element list.
 */
export const isMultiRemoteKind = hasKindIn(MULTI_REMOTE_KINDS)

/**
 * `true` for a chainable element promise, for example `$('foo')`, `$$('foo')[1]`
 * or `$('foo').parentElement()` before `await`.
 *
 * It does not mean "not resolved yet": a pending `$$()` is an element list
 * (`'element-array'`), not a chainable. To know if a value must be awaited,
 * check `typeof value.then === 'function'`.
 */
export const isChainableKind = hasKindIn(CHAINABLE_KINDS)
