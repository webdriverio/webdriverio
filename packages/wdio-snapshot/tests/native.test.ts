import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { parseNativeSource } from '../src/native.js'
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

    it('keeps only the candidates that one element has, and the bare tag when none is left', () => {
        const xml = `<hierarchy>
  <android.widget.Button text="One" content-desc="go" clickable="true" displayed="true" bounds="[0,0][10,10]" resource-id="com.example:id/one" />
  <android.widget.Button text="Two" content-desc="go" clickable="true" displayed="true" bounds="[0,20][10,30]" />
  <android.widget.Button content-desc="go" clickable="true" displayed="true" bounds="[0,40][10,50]" />
</hierarchy>`
        const { refs } = parseNativeSource(xml, 'android')
        expect(refs.map((ref) => ref.candidates[0])).toEqual(['id=com.example:id/one', 'android=new UiSelector().text("Two")', '//android.widget.Button'])
        expect(refs.every((ref) => !ref.candidates.includes('~go'))).toBe(true)
    })
})

