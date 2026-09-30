import { describe, expect, it } from 'vitest'

import { WDIO_KIND, WDIO_KINDS, getWdioKind, setWdioKind } from '../src/kind.js'

describe('WebdriverIO object brand', () => {
    it('uses the global symbol, so other packages can read it without an import', () => {
        expect(WDIO_KIND).toBe(Symbol.for('wdio.kind'))
    })

    it('sets a non-enumerable brand', () => {
        const value = setWdioKind({ selector: '#foo' }, 'element')

        expect(getWdioKind(value)).toBe('element')
        expect(WDIO_KIND in value).toBe(true)
        expect(Object.keys(value)).toEqual(['selector'])
        expect(JSON.stringify(value)).toBe('{"selector":"#foo"}')
    })

    it('reads every known kind', () => {
        for (const kind of WDIO_KINDS) {
            expect(getWdioKind(setWdioKind({}, kind))).toBe(kind)
        }
    })

    it('reads the brand through a proxy that only forwards property reads', () => {
        const element = setWdioKind({}, 'browser')
        const proxy = new Proxy({}, { get: (_, prop) => element[prop as keyof typeof element] })

        expect(getWdioKind(proxy)).toBe('browser')
    })

    it('returns undefined for values without a known brand', () => {
        for (const value of [undefined, null, 1, 'element', [], {}, Promise.resolve(), { selector: '#foo' }, { [WDIO_KIND]: 'unknown' }]) {
            expect(getWdioKind(value)).toBeUndefined()
        }
    })
})
