import { describe, it, expect, expectTypeOf } from 'vitest'

import { hasCode, WAIT_UNTIL_TIMEOUT, ELEMENT_NOT_FOUND_AGAIN } from '../../src/utils/errorCodes.js'

describe('hasCode', () => {
    it('is true for an error with the code', () => {
        const err = Object.assign(new Error('waitUntil condition timed out after 100ms'), { code: WAIT_UNTIL_TIMEOUT })
        expect(hasCode(err, WAIT_UNTIL_TIMEOUT)).toBe(true)
        expect(hasCode(err, ELEMENT_NOT_FOUND_AGAIN)).toBe(false)
    })

    it('is false for an error without the code, or a value that is not an Error', () => {
        expect(hasCode(new Error('timeout'), WAIT_UNTIL_TIMEOUT)).toBe(false)
        for (const value of [undefined, null, WAIT_UNTIL_TIMEOUT, { code: WAIT_UNTIL_TIMEOUT }]) {
            expect(hasCode(value, WAIT_UNTIL_TIMEOUT)).toBe(false)
        }
    })

    it('narrows the type to an error with that code', () => {
        const value: unknown = Object.assign(new Error('x'), { code: ELEMENT_NOT_FOUND_AGAIN })
        if (hasCode(value, ELEMENT_NOT_FOUND_AGAIN)) {
            expectTypeOf(value).toEqualTypeOf<Error & { code: typeof ELEMENT_NOT_FOUND_AGAIN }>()
        }
    })
})
