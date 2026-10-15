import { describe, it, expect } from 'vitest'

import { isElementNotFoundAgain, markWaited, nameNotFoundAgain, recordNotFound, waitedFor } from '../../src/utils/elementNotFound.js'
import { ELEMENT_NOT_FOUND_AGAIN } from '../../src/utils/errorCodes.js'

describe('the flag of a wait that ended without the element', () => {
    it('is hidden', () => {
        const err = new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found')
        expect(waitedFor(err)).toBe(false)
        markWaited(err)
        expect(waitedFor(err)).toBe(true)
        expect(Object.keys(err)).toEqual([])
    })

    it('leaves a frozen error or a value that is not an object as it is', () => {
        for (const value of [Object.freeze(new Error('frozen')), 'x', undefined, null]) {
            expect(() => markWaited(value)).not.toThrow()
            expect(waitedFor(value)).toBe(false)
        }
    })
})

describe('isElementNotFoundAgain', () => {
    it('knows the error of a stale element that was not found again by its code', () => {
        const err = Object.assign(new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found'), { code: ELEMENT_NOT_FOUND_AGAIN })
        expect(isElementNotFoundAgain(err)).toBe(true)
        expect(isElementNotFoundAgain(new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found'))).toBe(false)
        for (const value of [undefined, null, ELEMENT_NOT_FOUND_AGAIN, { name: ELEMENT_NOT_FOUND_AGAIN }, { code: 1 }]) {
            expect(isElementNotFoundAgain(value)).toBe(false)
        }
    })
})

describe('nameNotFoundAgain', () => {
    it('gives the error its code and its cause, and keeps its name', () => {
        const el = {}
        const stale = Object.assign(new Error('stale element reference'), { name: 'stale element reference' })
        const err = new Error('Can\'t call getElementText on element with selector "#a" because element wasn\'t found')
        recordNotFound(err, el)
        nameNotFoundAgain(err, el, 'getText', stale)
        expect(err.name).toBe('Error')
        expect(err).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
        expect(ELEMENT_NOT_FOUND_AGAIN).toBe('ELEMENT_NOT_FOUND_AGAIN')
        expect((err as Error & { cause?: unknown }).cause).toBe(stale)
        expect(err.message).toBe('Can\'t call getText on element with selector "#a" because element wasn\'t found')
        expect(err.stack?.split('\n')[0]).toBe(`Error: ${err.message}`)
    })

    it('leaves a frozen error as it is', () => {
        const err = Object.freeze(new Error('Can\'t call getText on element with selector "#a" because element wasn\'t found'))
        expect(() => nameNotFoundAgain(err, {}, 'getText')).not.toThrow()
        expect(err).not.toHaveProperty('code')
    })
})
