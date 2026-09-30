import { describe, expect, it } from 'vitest'

import {
    WDIO_KIND, WDIO_CHAINABLE, WDIO_KINDS, setWdioKind, getWdioKind, isLoadedElement, isArrayOfElements
} from '../src/kind.js'

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

    describe('getWdioKind', () => {
        it('gives the kind of a branded value', () => {
            expect(getWdioKind(setWdioKind({}, 'browser'))).toBe('browser')
            expect(getWdioKind(setWdioKind({}, 'element'))).toBe('element')
            expect(getWdioKind(setWdioKind([], 'element-array'))).toBe('element-array')
            expect(getWdioKind(setWdioKind(() => {}, 'browser'))).toBe('browser')
        })

        it('gives no kind to a value without a brand', () => {
            expect(getWdioKind({ selector: '#foo', elementId: 'foo' })).toBeUndefined()
            expect(getWdioKind(null)).toBeUndefined()
            expect(getWdioKind(undefined)).toBeUndefined()
            expect(getWdioKind('element')).toBeUndefined()
        })

        it('gives no kind to a proxy that returns a value for every property', () => {
            const deepMock = new Proxy({}, { get: () => () => {} })
            const spyLike = new Proxy({}, { get: () => 'spy' })

            expect(getWdioKind(deepMock)).toBeUndefined()
            expect(getWdioKind(spyLike)).toBeUndefined()
        })
    })

    describe('isLoadedElement', () => {
        it('is true for an element', () => {
            expect(isLoadedElement(setWdioKind({ elementId: 'foo' }, 'element'))).toBe(true)
        })

        it('is false for a chainable element, a browser, a list or an unbranded value', () => {
            const chainable = Object.defineProperty(setWdioKind({}, 'element'), WDIO_CHAINABLE, { value: true })

            expect(isLoadedElement(chainable)).toBe(false)
            expect(isLoadedElement(setWdioKind({}, 'browser'))).toBe(false)
            expect(isLoadedElement(setWdioKind([], 'element-array'))).toBe(false)
            expect(isLoadedElement({ selector: '#foo', elementId: 'foo' })).toBe(false)
        })
    })

    describe('isArrayOfElements', () => {
        const element = () => setWdioKind({ elementId: 'foo' }, 'element')

        it('is true for a plain array of elements', () => {
            expect(isArrayOfElements([element(), element()])).toBe(true)
        })

        it('is false for an empty array, because `[]` is not a WebdriverIO value', () => {
            expect(isArrayOfElements([])).toBe(false)
        })

        it('is false when one item is not a loaded element', () => {
            const chainable = Object.defineProperty(setWdioKind({}, 'element'), WDIO_CHAINABLE, { value: true })

            expect(isArrayOfElements([element(), { elementId: 'bare' }])).toBe(false)
            expect(isArrayOfElements([element(), chainable])).toBe(false)
            expect(isArrayOfElements({ 0: element(), length: 1 })).toBe(false)
        })

        it('does not use the async `every` of an element list', () => {
            const list = Object.assign([1, 2], { every: () => Promise.resolve(false) })

            expect(isArrayOfElements(list)).toBe(false)
            expect(isArrayOfElements(Object.assign([element()], { every: () => Promise.resolve(false) }))).toBe(true)
        })
    })
})
