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
