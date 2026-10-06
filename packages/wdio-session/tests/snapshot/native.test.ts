import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { RefRegistry } from '@wdio/snapshot'
import { takeNativeSnapshot } from '../../src/snapshot/native.js'
import type { Session } from '../../src/session.js'

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', '..', '..', 'wdio-snapshot', 'tests', '__fixtures__', 'pagesource', name), 'utf-8')

describe('native snapshots', () => {
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
        const scoped = await takeNativeSnapshot(session, { scope: '@e1' })
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
