/**
 * @jest-environment jsdom
 */
import { it, expect, describe } from 'vitest'
import isFocused from '../../src/scripts/isFocused'

describe('isFocused script', () => {
    it('should check if elem is active', () => {
        expect(isFocused(global.document.activeElement!)).toEqual(true)
    })
})
