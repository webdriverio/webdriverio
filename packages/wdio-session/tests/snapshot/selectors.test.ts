import { describe, it, expect } from 'vitest'

import { nativeCandidates, uniqueCandidate } from '../../src/snapshot/selectors.js'

describe('native selectors', () => {
    it('orders Android candidates and keeps the first unique one', () => {
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
        const counts = new Map(candidates.map((candidate) => [candidate, candidate === '~save' ? 2 : 1]))
        expect(uniqueCandidate(candidates, counts)).toBe('id=com.example:id/save')
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
