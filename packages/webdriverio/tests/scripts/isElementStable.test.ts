/**
 * @vitest-environment jsdom
 */
import { it, expect, describe, vi } from 'vitest'
import isElementStable from '../../src/scripts/isElementStable.js'

const STALE = 'stale element reference: element is not attached to the page document'

describe('isElementStable script', () => {
    it('throws the stale element error for an element that the page removed', () => {
        const done = vi.fn()
        expect(() => isElementStable(document.createElement('div'), done)).toThrow(STALE)
        expect(done).not.toBeCalled()
    })

    it('throws the stale element error for an element of another document', () => {
        const oldDocument = document.implementation.createHTMLDocument('old page')
        const elem = oldDocument.createElement('div')
        oldDocument.body.appendChild(elem)
        const done = vi.fn()
        expect(() => isElementStable(elem, done)).toThrow(STALE)
        expect(done).not.toBeCalled()
    })
})
