import { describe, expect, it } from 'vitest'

import { forAction, pickCandidates, shortlist, type PickCandidate } from '../../src/snapshot/pick.js'

const snapshot = [
    '- main',
    '  - heading "Shirts" [level=2]',
    '  - list',
    '    - listitem',
    '      - text "Blue Shirt"',
    '      - button "Add to cart" [ref=e1]',
    '    - listitem',
    '      - text "Red Shirt"',
    '      - button "Add to cart" [ref=e2]',
    '  - textbox "Email" [ref=e3]',
    '  - link "Cart" [ref=e4]',
    '  - button "Menu" [ref=e5] [hidden]'
].join('\n')

describe('pickCandidates', () => {
    it('lists the elements with refs and the text around them', () => {
        const candidates = pickCandidates(snapshot)
        expect(candidates.map((c) => c.ref)).toEqual(['e1', 'e2', 'e3', 'e4'])
        expect(candidates[0]).toEqual({
            ref: 'e1',
            role: 'button',
            label: 'button "Add to cart"',
            context: 'in text "Blue Shirt"; under heading "Shirts" [level=2]',
            line: 6
        })
        expect(candidates[1].context).toContain('Red Shirt')
        // a whole region around it, or a bare role, is no context
        expect(candidates[2].context).toBe('')
        // nor is what the element's own line says already
        expect(pickCandidates('- listitem\n  - text "Red Shirt"\n  - button "Add to cart" [ref=e1] ∈ "Red Shirt"')[0].context).toBe('')
    })
})

describe('forAction', () => {
    it('keeps the elements an action applies to', () => {
        const { candidates, filtered } = forAction(pickCandidates(snapshot), 'fill')
        expect(filtered).toBe(true)
        expect(candidates.map((c) => c.ref)).toEqual(['e3'])
    })

    it('keeps all when no role fits, e.g. app roles named otherwise', () => {
        const all = pickCandidates('- XCUIElementTypeOther "Save" [ref=e1]')
        expect(forAction(all, 'fill')).toEqual({ candidates: all, filtered: false })
        expect(forAction(all).filtered).toBe(false)
    })
})

describe('shortlist', () => {
    const candidate = (i: number, label: string): PickCandidate => ({ ref: `e${i}`, role: 'button', label, context: '', line: i })

    it('counts words of the intent and words like them', () => {
        const candidates = [candidate(0, 'link "Home"'), candidate(1, 'link "Donation"'), candidate(2, 'button "Add to cart"')]
        expect(shortlist('donate', candidates, 1).map((c) => c.ref)).toEqual(['e1'])
        expect(shortlist('add shirts to the cart', candidates, 1).map((c) => c.ref)).toEqual(['e2'])
    })

    it('keeps the closest candidates in page order', () => {
        const candidates = [
            ...Array.from({ length: 30 }, (_, i) => candidate(i, `link "Item ${i}"`)),
            candidate(30, 'button "Checkout"'),
            candidate(31, 'button "Proceed to checkout"')
        ]
        const kept = shortlist('checkout now', candidates, 5)
        expect(kept.map((c) => c.ref)).toEqual(['e0', 'e1', 'e2', 'e30', 'e31'])
        expect(shortlist('x', candidates.slice(0, 3), 5)).toHaveLength(3)
    })
})
