import { describe, expect, it } from 'vitest'

import { WDIO_KIND, WDIO_CHAINABLE, WDIO_KINDS, setWdioKind } from '../src/kind.js'

describe('WebdriverIO object brand', () => {
    it('uses global symbols, so other packages can read them without an import', () => {
        expect(WDIO_KIND).toBe(Symbol.for('wdio.kind'))
        expect(WDIO_CHAINABLE).toBe(Symbol.for('wdio.chainable'))
    })

    it('has only the role kinds', () => {
        expect(WDIO_KINDS).toEqual(['browser', 'element', 'element-array'])
    })

    it('sets a non-enumerable kind', () => {
        const value = setWdioKind({ selector: '#foo' }, 'element')

        expect(value[WDIO_KIND]).toBe('element')
        expect(WDIO_KIND in value).toBe(true)
        expect(Object.keys(value)).toEqual(['selector'])
        expect(JSON.stringify(value)).toBe('{"selector":"#foo"}')
    })
})
