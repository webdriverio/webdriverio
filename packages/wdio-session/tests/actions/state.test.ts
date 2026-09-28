import { describe, it, expect } from 'vitest'

import { cookieOptions } from '../../src/actions/state.js'

describe('cookieOptions', () => {
    it('builds a cookie from action arguments', () => {
        expect(cookieOptions({ name: 'a', value: '1', httpOnly: true, sameSite: 'Lax', expiry: 42 })).toEqual({
            name: 'a',
            value: '1',
            httpOnly: true,
            sameSite: 'lax',
            expiry: 42
        })
    })

    it('rejects incomplete and unknown values', () => {
        expect(() => cookieOptions({ name: 'a' })).toThrow('Pass a cookie name and value.')
        expect(() => cookieOptions({ name: 'a', value: '1', sameSite: 'weird' })).toThrow('Unknown sameSite')
        expect(() => cookieOptions({ name: 'a', value: '1', expiry: 'soon' })).toThrow('Invalid expiry')
    })
})
