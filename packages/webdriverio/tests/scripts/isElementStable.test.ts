/**
 * @vitest-environment jsdom
 */
import { it, expect, describe } from 'vitest'
import isElementStable from '../../src/scripts/isElementStable.js'

const STALE = 'stale element reference: element is not attached to the page document'

describe('isElementStable script', () => {
    it('throws the stale element error for an element that the page removed', async () => {
        await expect(isElementStable(document.createElement('div'))).rejects.toThrow(STALE)
    })

    it('throws the stale element error for an element of another document', async () => {
        const oldDocument = document.implementation.createHTMLDocument('old page')
        const elem = oldDocument.createElement('div')
        oldDocument.body.appendChild(elem)
        await expect(isElementStable(elem)).rejects.toThrow(STALE)
    })
})
