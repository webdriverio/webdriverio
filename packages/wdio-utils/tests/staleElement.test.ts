import { describe, expect, it } from 'vitest'

import { isStaleElementError } from '../src/staleElement.js'

describe('isStaleElementError', () => {
    it.each([
        'stale element reference: element is not attached to the page document',
        'The element reference of [object Object] is no longer attached to the DOM',
        'A stale element found',
        'stale element not found in the current frame',
        'no such node - SharedId "f.1" belongs to different document',
        'no such node - The node with the reference f.1 is not known',
        'no such node - SharedId "f.1.d.2.e.3" was not found.',
        'unknown error - Node with given id does not belong to the document'
    ])('knows "%s"', (message) => {
        expect(isStaleElementError(new Error(message))).toBe(true)
    })

    it('does not know other errors', () => {
        expect(isStaleElementError(new Error('no such element'))).toBe(false)
    })
})
