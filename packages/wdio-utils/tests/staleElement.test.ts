import { describe, expect, it } from 'vitest'

import { isStaleElementError } from '../src/staleElement.js'

describe('isStaleElementError', () => {
    it.each([
        // Chrome
        'stale element reference: element is not attached to the page document',
        // Firefox
        'The element <nested-component> is no longer attached to the DOM',
        // Safari
        'A node reference could not be resolved: Stale element found when trying to create the node handle',
        // Chrome through JS execution
        'javascript error: {"status":10,"value":"stale element not found in the current frame"}',
        // BiDi
        'no such node - SharedId "f.1" belongs to different document. Current document is',
        'no such node - The node with the reference f.1 is not known',
        // Chrome BiDi: a removed node, and an id that is not valid
        'no such node - SharedId "f.60860673155B1A4024ABC7C44C41BEA2.d.CD649CEDA25EACD4665D146439AC33ED.e.3" was not found.',
        'no such node - SharedId "not-an-id" was not found.',
        // Chrome BiDi: a node of the previous document after a navigation that the page started
        'unknown error - Node with given id does not belong to the document'
    ])('knows "%s"', (message) => {
        expect(isStaleElementError(new Error(message))).toBe(true)
    })

    it('does not know other errors', () => {
        expect(isStaleElementError(new Error('something else'))).toBe(false)
    })
})
