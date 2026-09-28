import { describe, it, expect } from 'vitest'

import { visualVerdict } from '../../src/actions/visual.js'

describe('visualVerdict', () => {
    it('prints a match within the threshold', () => {
        expect(visualVerdict(0, 0)).toBe('mismatch 0.00% (threshold 0%)')
        expect(visualVerdict(0.5, 1)).toBe('mismatch 0.50% (threshold 1%)')
    })

    it('fails above the threshold and names the diff', () => {
        expect(() => visualVerdict(2.5, 0, '/no/such/diff.png')).toThrow('mismatch 2.50% (threshold 0%)')
        try {
            visualVerdict(2.5, 0, '/no/such/diff.png')
        } catch (err) {
            expect((err as { code: string }).code).toBe('VISUAL_MISMATCH')
        }
    })
})
