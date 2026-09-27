import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { parseNativeSource, takeNativeSnapshot } from '../../src/snapshot/native.js'
import { formatSnapshot } from '../../src/snapshot/format.js'
import { RefRegistry } from '../../src/snapshot/refs.js'
import type { Session } from '../../src/session.js'

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', '__fixtures__', 'pagesource', name), 'utf-8')

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

    it('keeps two controls distinct when they share an accessibility id', async () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy>
  <android.widget.Button text="One" content-desc="go" clickable="true" displayed="true" bounds="[0,0][10,10]" resource-id="com.example:id/one" />
  <android.widget.Button text="Two" content-desc="go" clickable="true" displayed="true" bounds="[0,20][10,30]" resource-id="com.example:id/two" />
</hierarchy>`
        const refs = new RefRegistry()
        const session = {
            browser: {
                capabilities: { platformName: 'Android' },
                getPageSource: async () => xml
            },
            plan: { target: 'android' },
            refs
        } as unknown as Session
        const first = await takeNativeSnapshot(session)
        const second = await takeNativeSnapshot(session)
        expect(first.text).toContain('[ref=e1]')
        expect(first.text).toContain('[ref=e2]')
        expect(second.text).toContain('[ref=e1]')
        expect(second.text).toContain('[ref=e2]')
        const scoped = await takeNativeSnapshot(session, { scope: 'e1' })
        expect(scoped.text).toContain('[ref=e1]')
        expect(scoped.text).not.toContain('[ref=e2]')
        await expect(takeNativeSnapshot(session, { scope: 'e9' })).rejects.toThrow(/Scope e9/)
        const byId = await takeNativeSnapshot(session, { scope: 'id=one' })
        expect(byId.text).toContain('[ref=e1]')
        expect(byId.text).not.toContain('[ref=e2]')
        const bySelector = await takeNativeSnapshot(session, { scope: 'android=new UiSelector().resourceId("com.example:id/two")' })
        expect(bySelector.text).toContain('[ref=e2]')
        expect(bySelector.text).not.toContain('[ref=e1]')
        await expect(takeNativeSnapshot(session, { scope: '~go' })).rejects.toThrow(/matches 2 elements/)
    })

    it('scopes a non-interactive node by its selector', async () => {
        const refs = new RefRegistry()
        const session = {
            browser: {
                capabilities: { platformName: 'Android' },
                getPageSource: async () => fixture('android.xml')
            },
            plan: { target: 'android' },
            refs
        } as unknown as Session
        const scoped = await takeNativeSnapshot(session, { scope: '//android.widget.TextView[@text="Hello"]' })
        expect(scoped.text).toContain('text "Hello"')
        expect(scoped.text).not.toContain('button "save"')
        expect(scoped.text).not.toContain('[ref=')
    })

    it('rejects a class xpath that matches a container and a control', async () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy>
  <android.widget.FrameLayout displayed="true" bounds="[0,0][40,40]">
    <android.widget.FrameLayout clickable="true" displayed="true" bounds="[0,0][10,10]" />
    <android.widget.TextView text="Inside" displayed="true" bounds="[0,10][10,20]" />
  </android.widget.FrameLayout>
</hierarchy>`
        const session = {
            browser: {
                capabilities: { platformName: 'Android' },
                getPageSource: async () => xml
            },
            plan: { target: 'android' },
            refs: new RefRegistry()
        } as unknown as Session
        await expect(takeNativeSnapshot(session, { scope: '//android.widget.FrameLayout' })).rejects.toThrow(/matches 2 elements/)
        const byRef = await takeNativeSnapshot(session, { scope: 'e1' })
        expect(byRef.text).toContain('[ref=e1]')
        expect(byRef.text).not.toContain('Inside')
    })
})
