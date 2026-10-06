import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { parseNativeSource, scopeNativeTree } from '../src/native.js'
import { formatSnapshot } from '../src/format.js'

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '__fixtures__', 'pagesource', name), 'utf-8')

function text (name: string, platform: 'android' | 'ios' | 'mac' | 'windows', opts: { all?: boolean, interactive?: boolean, boxes?: boolean } = {}) {
    const parsed = parseNativeSource(fixture(name), platform, { all: opts.all })
    return formatSnapshot(parsed.tree, opts)
}

describe('native snapshots', () => {
    it('maps an Android page source', () => {
        expect(text('android.xml', 'android')).toBe([
            '- document',
            '  - group',
            '    - text "Hello"',
            '    - button "save" [ref=e1]',
            '    - textbox "Email" [ref=e2]',
            '    - checkbox "Agree" [ref=e3] [checked]',
            '    - scrollview'
        ].join('\n'))
        expect(text('android.xml', 'android', { interactive: true })).toContain('button "save" [ref=e1]')
        expect(text('android.xml', 'android', { interactive: true })).not.toContain('text "Hello"')
        expect(text('android.xml', 'android', { boxes: true })).toContain('[box=0,40,200,40]')
        expect(text('android.xml', 'android', { all: true })).toContain('text "Hidden"')
    })

    it('maps an iOS page source', () => {
        expect(text('ios.xml', 'ios')).toBe([
            '- document',
            '  - application "Fixture"',
            '    - button "Save" [ref=e1]',
            '    - textbox "Email" [ref=e2]'
        ].join('\n'))
        expect(text('ios.xml', 'ios', { boxes: true })).toContain('[box=0,40,80,40]')
        expect(text('ios.xml', 'ios', { all: true })).toContain('[hidden]')
    })

    it('maps a Mac2 page source', () => {
        expect(text('mac2.xml', 'mac')).toBe([
            '- document',
            '  - application "TextEdit"',
            '    - button "Bold" [ref=e1]'
        ].join('\n'))
    })

    it('maps a Windows page source', () => {
        expect(text('windows.xml', 'windows')).toBe([
            '- window "Fixture"',
            '  - button "Save" [ref=e1]',
            '  - textbox "Email" [ref=e2] [disabled]'
        ].join('\n'))
        expect(text('windows.xml', 'windows', { boxes: true })).toContain('[box=10,10,80,30]')
    })

    it('keeps only the candidates that one element has, and an indexed selector when none is left', () => {
        const xml = `<hierarchy>
  <android.widget.Button text="One" content-desc="go" clickable="true" displayed="true" bounds="[0,0][10,10]" resource-id="com.example:id/one" />
  <android.widget.Button text="Two" content-desc="go" clickable="true" displayed="true" bounds="[0,20][10,30]" />
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,40][10,50]" />
</hierarchy>`
        const { refs } = parseNativeSource(xml, 'android')
        expect(refs.map((ref) => ref.candidates[0].selector)).toEqual([
            'id=com.example:id/one',
            'android=new UiSelector().text("Two")',
            'android=new UiSelector().description("go").instance(2)'
        ])
        expect(refs.every((ref) => !ref.candidates.some((candidate) => candidate.selector === '~go'))).toBe(true)
    })

    it('gives two controls that share an accessibility id distinct indexed selectors', () => {
        const android = parseNativeSource(`<hierarchy>
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,0][10,10]" />
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,20][10,30]" />
</hierarchy>`, 'android')
        const ios = parseNativeSource(`<AppiumAUT>
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="go" visible="true" x="0" y="0" width="10" height="10" />
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="go" visible="true" x="0" y="20" width="10" height="10" />
</AppiumAUT>`, 'ios')
        const selectors = (refs: { candidates: { selector: string }[] }[]) => refs.map((ref) => ref.candidates.map((candidate) => candidate.selector))
        expect(selectors(android.refs)).toEqual([
            ['android=new UiSelector().description("go").instance(0)'],
            ['android=new UiSelector().description("go").instance(1)']
        ])
        expect(selectors(ios.refs)).toEqual([
            ['(//XCUIElementTypeButton[@name="go"])[1]'],
            ['(//XCUIElementTypeButton[@name="go"])[2]']
        ])
    })

    it('numbers indexed selectors in document order across hidden nodes', () => {
        const android = parseNativeSource(`<hierarchy>
  <android.widget.TextView text="x" displayed="false" bounds="[0,0][0,0]" />
  <android.widget.Button text="x" clickable="true" displayed="true" bounds="[0,0][10,10]" />
  <android.widget.Button text="x" clickable="true" displayed="true" bounds="[0,20][10,30]" />
</hierarchy>`, 'android')
        expect(android.refs.map((ref) => ref.candidates[0].selector)).toEqual([
            'android=new UiSelector().text("x").instance(1)',
            'android=new UiSelector().text("x").instance(2)'
        ])
        const ios = parseNativeSource(`<AppiumAUT>
  <XCUIElementTypeButton type="XCUIElementTypeButton" visible="true" x="0" y="0" width="10" height="10" />
  <XCUIElementTypeButton type="XCUIElementTypeButton" visible="false" x="0" y="0" width="0" height="0" />
  <XCUIElementTypeButton type="XCUIElementTypeButton" visible="true" x="0" y="20" width="10" height="10" />
</AppiumAUT>`, 'ios')
        expect(ios.refs.map((ref) => ref.candidates[0].selector)).toEqual(['(//XCUIElementTypeButton)[1]', '(//XCUIElementTypeButton)[3]'])
    })

    it('counts an indexed selector across every node it matches, whatever those nodes prefer', () => {
        const android = parseNativeSource(`<hierarchy>
  <android.widget.Button text="x" content-desc="a" clickable="true" displayed="true" bounds="[0,0][10,10]" />
  <android.widget.Button text="x" clickable="true" displayed="true" bounds="[0,20][10,30]" />
  <android.widget.Button text="x" clickable="true" displayed="true" bounds="[0,40][10,50]" />
</hierarchy>`, 'android')
        expect(android.refs.map((ref) => ref.candidates[0].selector)).toEqual([
            '~a',
            'android=new UiSelector().text("x").instance(1)',
            'android=new UiSelector().text("x").instance(2)'
        ])
        const ios = parseNativeSource(`<AppiumAUT>
  <XCUIElementTypeButton type="XCUIElementTypeButton" name="a" label="x" visible="true" x="0" y="0" width="10" height="10" />
  <XCUIElementTypeButton type="XCUIElementTypeButton" label="x" visible="true" x="0" y="20" width="10" height="10" />
  <XCUIElementTypeButton type="XCUIElementTypeButton" label="x" visible="true" x="0" y="40" width="10" height="10" />
</AppiumAUT>`, 'ios')
        expect(ios.refs.map((ref) => ref.candidates.at(-1)!.selector)).toEqual([
            '~a',
            '(//XCUIElementTypeButton[@label="x"])[2]',
            '(//XCUIElementTypeButton[@label="x"])[3]'
        ])
    })

    it('scopes to the indexed selector printed for a ref', () => {
        const { tree, located, refs } = parseNativeSource(`<hierarchy>
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,0][10,10]" />
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,20][10,30]" />
</hierarchy>`, 'android')
        const selector = refs[1].candidates[0].selector
        expect(selector).toBe('android=new UiSelector().description("go").instance(1)')
        expect(scopeNativeTree(tree, located, selector).children).toEqual([located[1].node])
    })

    it('tags every candidate with its kind', () => {
        const android = parseNativeSource(fixture('android.xml'), 'android').refs[0]
        expect(android.candidates.map((candidate) => candidate.kind)).toEqual(['accessibility-id', 'resource-id', 'uiautomator', 'xpath', 'xpath'])
        const ios = parseNativeSource(fixture('ios.xml'), 'ios').refs[0]
        expect(ios.candidates.map((candidate) => candidate.kind)).toEqual(['accessibility-id', 'predicate', 'class-chain'])
        const refs = [android, ios, ...parseNativeSource(fixture('windows.xml'), 'windows').refs, ...parseNativeSource(fixture('mac2.xml'), 'mac').refs]
        const kinds = new Set(['accessibility-id', 'resource-id', 'predicate', 'class-chain', 'uiautomator', 'xpath', 'tag', 'indexed'])
        expect(refs.flatMap((ref) => ref.candidates).every((candidate) => kinds.has(candidate.kind))).toBe(true)
    })

    it('maps Android classes to roles', () => {
        expect(text('android-roles.xml', 'android')).toBe([
            '- document',
            '  - group',
            '    - button "Back" [ref=e1]',
            '    - textbox "City" [ref=e2]',
            '    - combobox "Country" [ref=e3]',
            '    - switch "Wifi" [ref=e4]',
            '    - slider "Volume" [ref=e5]',
            '    - progressbar',
            '    - img "Logo"',
            '    - text "Remember"',
            '    - list',
            '    - webview',
            '    - button "Tap" [ref=e6]'
        ].join('\n'))
    })

    it('maps iOS types to roles', () => {
        expect(text('ios-roles.xml', 'ios')).toBe([
            '- document',
            '  - application "Roles"',
            '    - link "Docs" [ref=e1]',
            '    - searchbox "Search" [ref=e2]',
            '    - slider "Volume" [ref=e3]',
            '    - combobox "Mode" [ref=e4]',
            '    - img "Star" [ref=e5]',
            '    - switch "Wifi" [ref=e6] [checked]',
            '    - listitem "Row" [ref=e7]',
            '    - combobox "When" [ref=e8]'
        ].join('\n'))
    })
})
