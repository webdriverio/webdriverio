import { describe, it, expect } from 'vitest'

import { attachSelectors } from '../src/selectors.js'

describe('attachSelectors', () => {
    const tree = () => ({
        role: 'document',
        children: [
            { role: 'button', name: 'Add', ref: 'e1' },
            { role: 'button', ref: 'e2' },
            { role: 'text', name: 'Plain' }
        ]
    })
    const marks = (root: ReturnType<typeof tree>) => root.children.map((c) => [(c as { selector?: string }).selector, (c as { selectorPositional?: boolean }).selectorPositional])

    it('picks the first candidate and marks an element that fell back to cssPath as positional', () => {
        const root = tree()
        attachSelectors(root, [
            { id: 'e1', candidates: [{ kind: 'role', selector: 'role/button[name="Add"]' }, { kind: 'css-path', selector: 'main > button' }] },
            { id: 'e2', candidates: [{ kind: 'css-path', selector: 'main > button:nth-of-type(2)' }] }
        ])
        expect(marks(root)).toEqual([
            ['role/button[name="Add"]', undefined],
            ['main > button:nth-of-type(2)', true],
            [undefined, undefined]
        ])
    })

    it('marks a native element that got the bare tag or an indexed selector as positional', () => {
        const root = tree()
        attachSelectors(root, [
            { id: 'e1', candidates: [{ kind: 'accessibility-id', selector: '~Add' }] },
            { id: 'e2', candidates: [{ kind: 'indexed', selector: '(//android.widget.Button)[2]' }] }
        ])
        expect(marks(root)).toEqual([['~Add', undefined], ['(//android.widget.Button)[2]', true], [undefined, undefined]])
    })
})
