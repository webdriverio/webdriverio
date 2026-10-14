import { describe, it, expect } from 'vitest'

import { ELEMENT_NOT_FOUND_AGAIN, isElementNotFoundAgain, markWaited, waitedFor } from '../../src/utils/elementNotFound.js'

describe('the flag of a wait that ended without the element', () => {
    it('is a hidden registered symbol', () => {
        const err = new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found')
        expect(waitedFor(err)).toBe(false)
        markWaited(err)
        expect(waitedFor(err)).toBe(true)
        expect(Object.keys(err)).toEqual([])
        expect((err as unknown as Record<symbol, unknown>)[Symbol.for('wdio:waitedFor')]).toBe(true)
    })

    it('leaves a frozen error or a value that is not an object as it is', () => {
        for (const value of [Object.freeze(new Error('frozen')), 'x', undefined, null]) {
            expect(() => markWaited(value)).not.toThrow()
            expect(waitedFor(value)).toBe(false)
        }
    })
})

describe('isElementNotFoundAgain', () => {
    it('knows the error of a stale element that was not found again by its name', () => {
        const err = Object.assign(new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found'), { name: ELEMENT_NOT_FOUND_AGAIN })
        expect(isElementNotFoundAgain(err)).toBe(true)
        expect(isElementNotFoundAgain(new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found'))).toBe(false)
        for (const value of [undefined, null, ELEMENT_NOT_FOUND_AGAIN, { name: 1 }]) {
            expect(isElementNotFoundAgain(value)).toBe(false)
        }
    })
})
