import { describe, it, expect } from 'vitest'

import { attachSelectors, nativeCandidates } from '../src/selectors.js'

describe('native selectors', () => {
    it('orders Android candidates with the accessibility id first', () => {
        const candidates = nativeCandidates({
            platform: 'android',
            tag: 'android.widget.Button',
            className: 'android.widget.Button',
            name: 'Save',
            text: 'Save',
            resourceId: 'com.example:id/save',
            accessibilityId: 'save'
        })
        expect(candidates.slice(0, 3)).toEqual([
            '~save',
            'id=com.example:id/save',
            'android=new UiSelector().text("Save")'
        ])
    })

    it('builds an iOS predicate and class chain', () => {
        expect(nativeCandidates({
            platform: 'ios',
            tag: 'XCUIElementTypeButton',
            name: 'Save',
            accessibilityId: 'Save'
        })).toEqual([
            '~Save',
            '-ios predicate string:name == "Save"',
            '-ios class chain:**/XCUIElementTypeButton[`name == "Save"`]'
        ])
    })
})

describe('attachSelectors', () => {
    const tree = () => ({
        role: 'document',
        children: [
            { role: 'button', name: 'Add', ref: 'e1' },
            { role: 'button', ref: 'e2' },
            { role: 'text', name: 'Plain' }
        ]
    })

    it('picks the first candidate and marks a web element that fell back to cssPath as positional', () => {
        const root = tree()
        attachSelectors(root, [{ id: 'e1', candidates: ['role/button[name="Add"]', 'main > button'] }, { id: 'e2', candidates: ['main > button:nth-of-type(2)'] }], 'web')
        expect(root.children.map((c) => [(c as { selector?: string }).selector, (c as { selectorPositional?: boolean }).selectorPositional])).toEqual([
            ['role/button[name="Add"]', undefined],
            ['main > button:nth-of-type(2)', true],
            [undefined, undefined]
        ])
    })

    it('marks a native element only when it got the bare tag fallback', () => {
        const root = tree()
        attachSelectors(root, [{ id: 'e1', candidates: ['~Add'] }, { id: 'e2', candidates: ['//android.widget.Button'] }], 'native')
        expect(root.children.map((c) => (c as { selectorPositional?: boolean }).selectorPositional)).toEqual([undefined, true, undefined])
    })
})
