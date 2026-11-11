/**
 * @vitest-environment jsdom
 */
import { it, expect, describe } from 'vitest'
import isFocused from '../../src/scripts/isFocused.js'

const STALE = 'stale element reference: element is not attached to the page document'

describe('isFocused script', () => {
    it('should check if elem is active', () => {
        expect(isFocused(global.document.activeElement!)).toEqual(true)
    })

    it('throws the stale element error for an element that the page removed', () => {
        expect(() => isFocused(document.createElement('input'))).toThrow(STALE)
    })

    it('throws the stale element error for an element of another document', () => {
        const oldDocument = document.implementation.createHTMLDocument('old page')
        const elem = oldDocument.createElement('input')
        oldDocument.body.appendChild(elem)
        expect(() => isFocused(elem)).toThrow(STALE)
    })
})
