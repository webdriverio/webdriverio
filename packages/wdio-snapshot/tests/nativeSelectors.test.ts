import { describe, it, expect } from 'vitest'

import { nativeCandidates } from '../src/nativeSelectors.js'

describe('native selectors', () => {
    it('escapes only the quote in a package-less Android resource id', () => {
        const [candidate] = nativeCandidates({ platform: 'android', tag: 'android.widget.Button', resourceId: 'say "hi" a\\b' })
        expect(candidate.selector).toBe('android=new UiSelector().resourceId("say \\"hi\\" a\\b")')
    })

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
        expect(candidates.slice(0, 3).map((c) => c.selector)).toEqual([
            '~save',
            'id=com.example:id/save',
            'android=new UiSelector().text("Save")'
        ])
    })

    it('uses a UiSelector for a resource id without a package, since UiAutomator2 prefixes a bare id=', () => {
        expect(nativeCandidates({
            platform: 'android',
            tag: 'android.widget.EditText',
            resourceId: 'text_input'
        })[0]).toEqual({ kind: 'resource-id', selector: 'android=new UiSelector().resourceId("text_input")' })
    })

    it('builds an iOS predicate and class chain', () => {
        expect(nativeCandidates({
            platform: 'ios',
            tag: 'XCUIElementTypeButton',
            name: 'Save',
            accessibilityId: 'Save'
        })).toEqual([
            { kind: 'accessibility-id', selector: '~Save' },
            { kind: 'predicate', selector: '-ios predicate string:name == "Save"' },
            { kind: 'class-chain', selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Save"`]' }
        ])
    })
})
