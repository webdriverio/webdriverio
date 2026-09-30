import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import { serialize, toPlain, isError } from '../../src/exec/serialize.js'

function element (selector: string, elementId?: string) {
    return { selector, elementId, getTagName: async () => 'button', [Symbol.for('wdio.kind')]: 'element' }
}

function elementArray (items: ReturnType<typeof element>[]) {
    return Object.assign([...items], { selector: 'li', foundWith: '$$', [Symbol.for('wdio.kind')]: 'element-array' })
}

describe('exec serialize', () => {
    it('prints nothing for undefined', async () => {
        expect(await serialize(undefined)).toEqual({ text: '' })
    })

    it('prints primitives as is', async () => {
        expect((await serialize('Hello "you"')).text).toBe('Hello "you"')
        expect((await serialize(42)).text).toBe('42')
        expect((await serialize(false)).text).toBe('false')
        expect((await serialize(null)).text).toBe('null')
        expect((await serialize(10n)).text).toBe('10n')
    })

    it('prints elements with tag, name, ref and selector', async () => {
        const describeElement = async () => ({ tag: 'button', name: 'Add to cart', ref: 'e3' })
        expect((await serialize(element('aria/Add to cart', 'abc'), { describeElement })).text).toBe('<button "Add to cart" ref=e3 selector="aria/Add to cart">')
        expect((await serialize(element('h1', 'abc'), { describeElement: async () => ({ tag: 'h1' }) })).text).toBe('<h1 selector="h1">')
        expect((await serialize(element('.missing'))).text).toBe('<element not found selector=".missing">')
        expect((await serialize(element('h1', 'x'), { describeElement: async () => { throw new Error('stale') } })).text).toBe('<element selector="h1">')
    })

    it('prints element arrays with the first 10 entries', async () => {
        const items = Array.from({ length: 12 }, (_, i) => element(`li:nth-child(${i + 1})`, `id${i}`))
        const { text, value } = await serialize(elementArray(items), { describeElement: async () => ({ tag: 'li' }) })
        const lines = text.split('\n')
        expect(lines[0]).toBe('ElementArray(12) [')
        expect(lines[1]).toBe('  <li selector="li:nth-child(1)">')
        expect(lines).toHaveLength(13)
        expect(lines[11]).toBe('  … 2 more')
        expect(lines[12]).toBe(']')
        expect(value).toHaveLength(12)
        expect((await serialize(elementArray([]))).text).toBe('ElementArray(0) []')
    })

    it('prints an ElementArray without calling its async slice or map', async () => {
        const items = [element('nav a', 'id1'), element('nav a', 'id2')]
        /**
         * `$$` returns a thenable array whose `slice` and `map` are async
         * query helpers. Calling them from `serialize` rejects or returns a
         * promise `Promise.all` cannot iterate.
         */
        const wdioList = (entries: ReturnType<typeof element>[], resolved = true) => new Proxy(resolved ? [...entries] : [], {
            get (current, prop, receiver) {
                /**
                 * a pending list has its brand before it loads
                 */
                if (prop === Symbol.for('wdio.kind')) {
                    return 'element-array'
                }
                if (prop === 'selector') {
                    return 'nav a'
                }
                if (prop === 'foundWith') {
                    return '$$'
                }
                if (prop === 'then') {
                    if (resolved) {
                        return undefined
                    }
                    return (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
                        Promise.resolve(wdioList(entries, true)).then(onFulfilled, onRejected)
                }
                if (prop === 'map' || prop === 'slice') {
                    return () => Promise.reject(new Error(`serialize must not call ElementArray ${String(prop)}`))
                }
                return Reflect.get(current, prop, receiver)
            },
            has (current, prop) {
                return prop === 'selector' || prop === 'foundWith' || Reflect.has(current, prop)
            }
        })
        const describeElement = async () => ({ tag: 'a', name: 'Home' })
        const expected = 'ElementArray(2) [\n  <a "Home" selector="nav a">\n  <a "Home" selector="nav a">\n]'
        expect((await serialize(wdioList(items), { describeElement })).text).toBe(expected)
        expect((await serialize(wdioList(items, false), { describeElement })).text).toBe(expected)
    })

    it('prints an element list whose map returns a promise', async () => {
        const items = [element('nav a', 'a1'), element('nav a', 'a2')]
        const list = Object.assign([...items], {
            selector: 'nav a',
            foundWith: '$$',
            [Symbol.for('wdio.kind')]: 'element-array',
            slice (start?: number, end?: number) {
                const sliced = Array.prototype.slice.call(this, start, end) as ReturnType<typeof element>[]
                return Object.assign(sliced, {
                    async map (cb: (el: ReturnType<typeof element>, index: number) => unknown) {
                        return Promise.all(Array.prototype.map.call(this, cb) as Promise<unknown>[])
                    }
                })
            }
        })
        expect((await serialize(list, { describeElement: async () => ({ tag: 'a', name: 'Home' }) })).text).toBe(
            'ElementArray(2) [\n  <a "Home" selector="nav a">\n  <a "Home" selector="nav a">\n]'
        )
    })

    it('prints buffers as a size', async () => {
        expect((await serialize(Buffer.alloc(12345))).text).toBe('<Buffer 12345 bytes>')
        expect((await serialize(new Uint8Array(3))).text).toBe('<Buffer 3 bytes>')
    })

    it('prints objects as indented JSON with depth and size limits', async () => {
        expect((await serialize({ a: 1, b: [1, 2], c: undefined, d: () => 1 })).text).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ],\n  "d": "[Function d]"\n}')
        const deep = { l1: { l2: { l3: { l4: { l5: { l6: { l7: 1 } } } } } } }
        expect(JSON.stringify(toPlain(deep))).toBe('{"l1":{"l2":{"l3":{"l4":{"l5":{"l6":"[Object]"}}}}}}')
        const circular: Record<string, unknown> = { a: 1 }
        circular.self = circular
        expect(toPlain(circular)).toEqual({ a: 1, self: '[Circular]' })
        const big = await serialize(Array.from({ length: 2000 }, (_, i) => i))
        expect(big.text).toMatch(/\n… \(truncated, use --json for full value\)$/)
        expect(big.text.length).toBeLessThan(4100)
        expect(big.value).toHaveLength(2000)
    })

    it('handles Map, Set, Date and values from another realm', async () => {
        expect(toPlain(new Map([['a', 1]]))).toEqual({ a: 1 })
        expect(toPlain(new Set([1, 2]))).toEqual([1, 2])
        expect(toPlain(new Date(0))).toBe('1970-01-01T00:00:00.000Z')
        const foreign = vm.runInNewContext('({ list: [1, 2], when: new Date(0), err: new TypeError("x") })')
        expect(toPlain(foreign)).toEqual({ list: [1, 2], when: '1970-01-01T00:00:00.000Z', err: { name: 'TypeError', message: 'x' } })
        expect(isError(vm.runInNewContext('new Error("y")'))).toBe(true)
        expect(isError({ message: 'no stack' })).toBe(false)
    })
})
