import { describe, expect, it } from 'vitest'

import { refSelector } from '../../src/exec/context.js'
import { hintFor } from '../../src/exec/hints.js'

describe('refSelector', () => {
    it('reads refs written as selectors', () => {
        expect(refSelector('e12')).toBe('e12')
        expect(refSelector('[ref=e12]')).toBe('e12')
        expect(refSelector('[ref="e12"]')).toBe('e12')
        expect(refSelector(' e3 ')).toBe('e3')
    })

    it('leaves real selectors alone', () => {
        expect(refSelector('#e12')).toBeUndefined()
        expect(refSelector('button=e12')).toBeUndefined()
        expect(refSelector('em')).toBeUndefined()
        expect(refSelector(undefined)).toBeUndefined()
    })
})

describe('hintFor', () => {
    it('explains that exec runs in Node when page code fails', () => {
        expect(hintFor({ name: 'ReferenceError', message: 'document is not defined' })).toContain('`exec` runs in Node, not in the page.')
    })
})
