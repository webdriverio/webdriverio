/**
 * @vitest-environment jsdom
 */
import { it, expect, describe } from 'vitest'
import checkVisibility from '../../src/scripts/checkVisibility.js'

const STALE = 'stale element reference: element is not attached to the page document'

describe('checkVisibility script', () => {
    it('gives the result of Element.checkVisibility with the options', () => {
        const elem = document.createElement('div')
        document.body.appendChild(elem)
        let options: unknown
        ;(elem as unknown as { checkVisibility: (o: unknown) => boolean }).checkVisibility = (o) => {
            options = o
            return true
        }
        expect(checkVisibility(elem, { opacityProperty: true })).toBe(true)
        expect(options).toEqual({ opacityProperty: true })
        elem.remove()
    })

    it('gives null when the browser has no Element.checkVisibility', () => {
        const elem = document.createElement('div')
        document.body.appendChild(elem)
        ;(elem as unknown as { checkVisibility?: unknown }).checkVisibility = undefined
        expect(checkVisibility(elem, {})).toBe(null)
        elem.remove()
    })

    /**
     * A WebDriver BiDi session gives a script an element that the page removed (a WebDriver
     * Classic session fails with a stale element error before the script runs)
     */
    it('throws the stale element error for an element that the page removed', () => {
        expect(() => checkVisibility(document.createElement('button'), {})).toThrow(STALE)
    })

    /**
     * Firefox keeps the document of a page that was navigated away from: its elements
     * are still connected, but to that old document
     */
    it('throws the stale element error for an element of another document', () => {
        const oldDocument = document.implementation.createHTMLDocument('old page')
        const elem = oldDocument.createElement('button')
        oldDocument.body.appendChild(elem)
        expect(() => checkVisibility(elem, {})).toThrow(STALE)
    })
})
