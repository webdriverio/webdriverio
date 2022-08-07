/**
 * @vitest-environment jsdom
 */
import { it, expect, describe } from 'vitest'
import isFocused from '../../src/scripts/isFocused.js'

describe('isFocused script', () => {
    it('should check if elem is active', () => {
        expect(isFocused(global.document.activeElement!)).toEqual(true)
    })
})
