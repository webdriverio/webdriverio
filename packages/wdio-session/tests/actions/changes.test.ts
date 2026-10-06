import { describe, expect, it } from 'vitest'

import { describeChanges } from '../../src/actions/changes.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

/** a session whose page is whatever `page.tree` and `page.url` are right now */
function pageSession (page: { url: string, tree: SnapshotNode }) {
    return {
        isWeb: true,
        applies: ['W'],
        refs: new RefRegistry(),
        browser: { execute: async () => ({ tree: page.tree, refs: [], counter: 0 }) },
        currentUrl: async () => page.url
    } as unknown as Session
}

const doc = (children: SnapshotNode[], name = 'Shop'): SnapshotNode => ({ role: 'document', name, children })
const button = { role: 'button', name: 'Pay', ref: 'e1', interactive: true }

describe('describeChanges', () => {
    it('prints new lines on the same page, e.g. a status that appeared', async () => {
        const page = { url: 'http://x/', tree: doc([button]) }
        const session = pageSession(page)
        const before = { url: page.url, text: (await describeChanges(session, {})).after.text }
        page.tree = doc([button, { role: 'status', name: 'Paid. Order 42' }])
        expect((await describeChanges(session, before)).text).toBe('Changes:\n+ - status "Paid. Order 42"')
    })

    it('prints nothing when only focus moved', async () => {
        const page = { url: 'http://x/', tree: doc([{ ...button, states: ['focused'] }]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.tree = doc([button])
        expect((await describeChanges(session, before)).text).toBeUndefined()
    })

    it('lists the elements of a small new page after a navigation', async () => {
        const page = { url: 'http://x/', tree: doc([button]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.url = 'http://x/done'
        page.tree = doc([{ role: 'link', name: 'Back', ref: 'e2', interactive: true }], 'Done')
        expect((await describeChanges(session, before)).text).toBe('Page: http://x/done\n- document "Done"\n  - link "Back" [ref=e2]')
    })

    it('summarizes a big new page instead of listing it', async () => {
        const page = { url: 'http://x/', tree: doc([button]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.url = 'http://x/wiki'
        page.tree = doc(Array.from({ length: 200 }, (_, i) => ({ role: 'link', name: `Article ${i}`, ref: `e${i + 2}`, interactive: true })), 'Wiki')
        const text = (await describeChanges(session, before)).text!
        expect(text).toMatch(/^Page: http:\/\/x\/wiki · "Wiki" · 200 interactive elements\./)
        expect(text).not.toContain('Article 1"')
    })

    it('drops a snapshot that only answers after a dialog took over', async () => {
        let answer: (value: unknown) => void = () => {}
        const state: { dialog?: unknown } = {}
        const session = {
            isWeb: true,
            applies: ['W'],
            refs: new RefRegistry(),
            lastSnapshot: 'baseline',
            browser: { execute: () => new Promise((resolve) => { answer = resolve }) },
            currentUrl: async () => 'http://x/',
            get: (key: string) => key === 'dialog' ? state.dialog : undefined
        } as unknown as Session
        const report = describeChanges(session, { url: 'http://x/', text: '- document "Shop"' })
        state.dialog = { type: 'alert', message: 'Hi' }
        expect(await report).toEqual({ after: {} })
        // the dialog is handled, the user took a new snapshot, then the old one answers
        session.lastSnapshot = 'newer'
        answer({ tree: doc([button]), refs: [{ id: 'e9', role: 'button', candidates: ['#pay'] }], counter: 9 })
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(session.lastSnapshot).toBe('newer')
        expect(session.refs.get('e9')).toBeUndefined()
        expect(session.refs.counter).toBe(0)
    })
})
