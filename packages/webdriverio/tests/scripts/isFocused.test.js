/* global document */

import isFocused from '../../src/scripts/isFocused'

describe('isFocused script', () => {
    it('should check if elem is active', () => {
        expect(isFocused(document.activeElement)).toEqual(true)
    })
})
