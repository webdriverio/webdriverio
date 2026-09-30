import { describe, expect, it } from 'vitest'

import {
    WDIO_KIND, WDIO_KINDS, getWdioKind, setWdioKind,
    isBrowserKind, isElementKind, isElementArrayKind, isMultiRemoteKind, isChainableKind,
    type WdioKind
} from '../src/kind.js'

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

describe('kind helpers', () => {
    const expected: Record<WdioKind, [browser: boolean, element: boolean, elementArray: boolean, multiRemote: boolean, chainable: boolean]> = {
        'browser':                    [true, false, false, false, false],
        'multi-remote-browser':       [true, false, false, true, false],
        'element':                    [false, true, false, false, false],
        'multi-remote-element':       [false, true, false, true, false],
        'chainable-element':          [false, true, false, false, true],
        'element-array':              [false, false, true, false, false],
        'multi-remote-element-array': [false, false, true, true, false],
        'chainable-element-array':    [false, false, true, false, true]
    }

    it('covers every kind', () => {
        expect(Object.keys(expected).sort()).toEqual([...WDIO_KINDS].sort())
    })

    it.each(Object.entries(expected))('groups %s', (kind, [browser, element, elementArray, multiRemote, chainable]) => {
        const value = setWdioKind({}, kind as WdioKind)

        expect(isBrowserKind(value)).toBe(browser)
        expect(isElementKind(value)).toBe(element)
        expect(isElementArrayKind(value)).toBe(elementArray)
        expect(isMultiRemoteKind(value)).toBe(multiRemote)
        expect(isChainableKind(value)).toBe(chainable)
    })

    it('returns false for values without a known brand', () => {
        for (const value of [undefined, null, {}, [], Promise.resolve(), { [WDIO_KIND]: 'unknown' }]) {
            expect([isBrowserKind(value), isElementKind(value), isElementArrayKind(value), isMultiRemoteKind(value), isChainableKind(value)])
                .toEqual([false, false, false, false, false])
        }
    })
})
