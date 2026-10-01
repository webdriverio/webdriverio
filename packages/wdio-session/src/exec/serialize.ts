import { getWdioKind, isArrayOfElements, isLoadedElement } from '@wdio/utils'

const MAX_DEPTH = 6
const MAX_CHARS = 4000
const MAX_ELEMENTS = 10

export interface ElementInfo {
    tag?: string
    name?: string
    ref?: string
}

export interface SerializeOptions {
    /**
     * look up tag, accessible name and ref of an element (one round trip)
     */
    describeElement?: (el: WebdriverIO.Element) => Promise<ElementInfo>
    maxChars?: number
}

export interface Serialized {
    text: string
    /**
     * JSON-safe version of the value for `--json`
     */
    value?: unknown
}

/**
 * A resolved element, see `@wdio/utils` `kind.ts`. A chainable $() is a promise, not a result.
 */
export function isElement (value: unknown): value is WebdriverIO.Element {
    return typeof value === 'object' && isLoadedElement(value)
}

/**
 * An element list, or a copy of one (`[...list]`) whose items are all elements
 */
export function isElementArray (value: unknown): value is WebdriverIO.ElementArray {
    return (Array.isArray(value) && getWdioKind(value) === 'element-array') || isArrayOfElements(value)
}

function isBinary (value: unknown): value is Uint8Array {
    return ArrayBuffer.isView(value) && !(value instanceof DataView)
}

/**
 * Errors from the vm context are not `instanceof Error` in the daemon realm.
 */
export function isError (value: unknown): value is Error {
    return Object.prototype.toString.call(value) === '[object Error]' ||
        (Boolean(value) && typeof value === 'object' && typeof (value as Error).message === 'string' && typeof (value as Error).stack === 'string')
}

function selectorString (selector: unknown) {
    return typeof selector === 'function' ? `function ${(selector as { name?: string }).name || ''}`.trimEnd() : String(selector)
}

async function formatElement (el: WebdriverIO.Element, opts: SerializeOptions) {
    const selector = selectorString(el.selector)
    if (!el.elementId) {
        return `<element not found selector=${JSON.stringify(selector)}>`
    }
    let info: ElementInfo = {}
    try {
        info = await opts.describeElement?.(el) ?? {}
    } catch {
        // describing is best effort
    }
    const parts = [info.tag || 'element']
    if (info.name) {
        parts.push(JSON.stringify(info.name))
    }
    if (info.ref) {
        parts.push(`ref=${info.ref}`)
    }
    parts.push(`selector=${JSON.stringify(selector)}`)
    return `<${parts.join(' ')}>`
}

/**
 * Plain JSON-compatible copy of a value: depth limited, circular references
 * and functions replaced by markers.
 */
export function toPlain (value: unknown, depth = MAX_DEPTH, seen = new WeakSet<object>()): unknown {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : String(value)
    }
    if (typeof value === 'undefined') {
        return undefined
    }
    if (typeof value === 'bigint') {
        return `${value}n`
    }
    if (typeof value === 'symbol') {
        return value.toString()
    }
    if (typeof value === 'function') {
        return `[Function${value.name ? ` ${value.name}` : ''}]`
    }
    if (isElement(value)) {
        return { selector: selectorString(value.selector), elementId: value.elementId }
    }
    if (isBinary(value)) {
        return `<Buffer ${value.byteLength} bytes>`
    }
    if (value instanceof Date || Object.prototype.toString.call(value) === '[object Date]') {
        return (value as Date).toISOString()
    }
    if (isError(value)) {
        return { name: value.name, message: value.message }
    }
    const obj = value as object
    if (seen.has(obj)) {
        return '[Circular]'
    }
    if (depth <= 0) {
        return Array.isArray(obj) ? '[Array]' : '[Object]'
    }
    seen.add(obj)
    try {
        if (Array.isArray(obj)) {
            return obj.map((v) => toPlain(v, depth - 1, seen) ?? null)
        }
        if (obj instanceof Map || Object.prototype.toString.call(obj) === '[object Map]') {
            return Object.fromEntries([...(obj as Map<unknown, unknown>).entries()].map(([k, v]) => [String(k), toPlain(v, depth - 1, seen)]))
        }
        if (obj instanceof Set || Object.prototype.toString.call(obj) === '[object Set]') {
            return [...(obj as Set<unknown>).values()].map((v) => toPlain(v, depth - 1, seen))
        }
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj)) {
            const plain = toPlain(v, depth - 1, seen)
            if (plain !== undefined) {
                out[k] = plain
            }
        }
        return out
    } finally {
        seen.delete(obj)
    }
}

/**
 * Render the value returned by `exec` (RFC §7.4).
 */
export async function serialize (value: unknown, opts: SerializeOptions = {}): Promise<Serialized> {
    const maxChars = opts.maxChars ?? MAX_CHARS
    if (value === undefined) {
        return { text: '' }
    }
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return { text: String(value), value }
    }
    if (typeof value === 'bigint') {
        return { text: `${value}n`, value: `${value}n` }
    }
    if (isElementArray(value)) {
        /**
         * An unresolved ElementArray is thenable, so `await` loads it, and a loaded
         * list is not thenable, so `await` gives it back. A resolved list still owns
         * async `slice` and `map`, so copy with `Array.prototype` and format that plain array.
         */
        const list = await (value as unknown as PromiseLike<WebdriverIO.ElementArray>)
        const elements = Array.prototype.slice.call(list) as WebdriverIO.Element[]
        const shown = await Promise.all(elements.slice(0, MAX_ELEMENTS).map((el) => formatElement(el, opts)))
        const more = elements.length > MAX_ELEMENTS ? [`… ${elements.length - MAX_ELEMENTS} more`] : []
        const lines = [...shown, ...more].map((l) => `  ${l}`)
        return {
            text: elements.length ? `ElementArray(${elements.length}) [\n${lines.join('\n')}\n]` : 'ElementArray(0) []',
            value: toPlain(elements)
        }
    }
    if (isElement(value)) {
        return { text: await formatElement(value, opts), value: toPlain(value) }
    }
    if (isBinary(value)) {
        return { text: `<Buffer ${value.byteLength} bytes>`, value: toPlain(value) }
    }
    const plain = toPlain(value)
    let text = typeof plain === 'string' ? plain : JSON.stringify(plain, null, 2)
    if (text.length > maxChars) {
        text = `${text.slice(0, maxChars)}\n… (truncated, use --json for full value)`
    }
    return { text, value: plain }
}
