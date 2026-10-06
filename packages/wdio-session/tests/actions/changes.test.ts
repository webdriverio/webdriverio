import { describe, expect, it } from 'vitest'

import { describeChanges } from '../../src/actions/changes.js'
import { cliCmd } from '../../src/hints.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

/** a session whose page is whatever `page.tree` and `page.url` are right now */
function pageSession (page: { url: string, tree: SnapshotNode }) {
    return {
        cmd: cliCmd,
        frameHint: (ref: string) => `wdio session frame ${ref}`,
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
        const report = await describeChanges(session, before)
        expect(report.text).toBe('Changes:\n+ - status "Paid. Order 42"')
        expect(report.change).toEqual({ kind: 'changed', added: ['- status "Paid. Order 42"'], omitted: 0 })
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
        const report = await describeChanges(session, before)
        expect(report.text).toBe('Page: http://x/done\n- document "Done"\n  - link "Back" [ref=e2]')
        expect(report.change).toEqual({ kind: 'page', frame: false, url: 'http://x/done', title: 'Done', refs: 1, snapshot: '- document "Done"\n  - link "Back" [ref=e2]' })
        expect(report.after.title).toBe('Done')
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

    it('reports a big new page as a change without its snapshot', async () => {
        const page = { url: 'http://x/', tree: doc([button]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.url = 'http://x/wiki'
        page.tree = doc(Array.from({ length: 200 }, (_, i) => ({ role: 'link', name: `Article ${i}`, ref: `e${i + 2}`, interactive: true })), 'Wiki')
        expect((await describeChanges(session, before)).change).toEqual({ kind: 'page', frame: false, url: 'http://x/wiki', title: 'Wiki', refs: 200 })
    })

    it('counts the changed lines it leaves out', async () => {
        const page = { url: 'http://x/', tree: doc([button]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.tree = doc([button, ...Array.from({ length: 35 }, (_, i) => ({ role: 'status', name: `Row ${i}` }))])
        const change = (await describeChanges(session, before)).change
        expect(change).toMatchObject({ kind: 'changed', omitted: 5 })
        expect((change as { added: string[] }).added).toHaveLength(30)
    })

    it('reports lines that went away', async () => {
        const page = { url: 'http://x/', tree: doc([button, { role: 'status', name: 'Saving' }]) }
        const session = pageSession(page)
        const before = (await describeChanges(session, {})).after
        page.tree = doc([button])
        const report = await describeChanges(session, before)
        expect(report.text).toBe('Changes: 1 line removed (`wdio session snapshot -i` shows the page)')
        expect(report.change).toEqual({ kind: 'removed', removed: 1 })
    })

    it('drops a snapshot that only answers after a dialog took over', async () => {
        let answer: (value: unknown) => void = () => {}
        const state: { dialog?: unknown } = {}
        const session = {
            cmd: cliCmd,
            frameHint: (ref: string) => `wdio session frame ${ref}`,
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

    describe('what an action changed, most important first', () => {
        const add = { role: 'button', name: 'Add To Basket', ref: 'e1', interactive: true }
        const reject = { role: 'button', name: 'Reject All', ref: 'e2', interactive: true }
        const banner = { role: 'region', name: 'Cookie banner', ref: 'e3', children: [reject] }
        const dots = (selected: number) => ({
            role: 'tablist',
            children: [1, 2].map((n) => ({ role: 'tab', name: `Go to slide ${n}`, ref: `e${n + 10}`, interactive: true, ...(n === selected ? { states: ['selected'] } : {}) }))
        })
        const carousel = (slide: number) => ({
            role: 'group', name: 'Gallery', children: [{ role: 'group', name: `Slide ${slide} of 2`, children: [{ role: 'heading', name: `Offer ${slide}` }] }, dots(slide)]
        })

        async function report (beforeTree: SnapshotNode, afterTree: SnapshotNode) {
            const page = { url: 'http://x/', tree: beforeTree }
            const session = pageSession(page)
            const before = (await describeChanges(session, {})).after
            page.tree = afterTree
            return describeChanges(session, before)
        }

        it('puts an opened dialog first, with the controls inside it', async () => {
            const dialog = { role: 'dialog', name: 'Item added!', ref: 'e5', children: [{ role: 'link', name: 'Continue to Checkout', ref: 'e6', interactive: true }] }
            const result = await report(doc([add]), doc([add, dialog]))
            expect(result.text).toBe('Changes:\nOpened dialog "Item added!" [ref=e5]\n  - link "Continue to Checkout" [ref=e6]')
            expect(result.change).toEqual({ kind: 'changed', added: ['Opened dialog "Item added!" [ref=e5]', '  - link "Continue to Checkout" [ref=e6]'], omitted: 0 })
        })

        it('reports a closed dialog instead of nothing', async () => {
            const dialog = { role: 'alertdialog', name: 'Sure?', ref: 'e5', children: [{ role: 'button', name: 'Yes', ref: 'e6', interactive: true }] }
            const result = await report(doc([add, dialog]), doc([add]))
            expect(result.text).toBe('Changes:\nClosed alertdialog "Sure?"')
            expect(result.change).toEqual({ kind: 'changed', added: ['Closed alertdialog "Sure?"'], omitted: 0 })
        })

        it('reports a closed cookie banner and drops a carousel that rotated meanwhile', async () => {
            const result = await report(doc([banner, carousel(1)]), doc([carousel(2)]))
            expect(result.text).toBe('Changes:\nClosed region "Cookie banner"')
        })

        it('lists a state change of the clicked button after the dialog it opened', async () => {
            const dialog = { role: 'dialog', name: 'Item added!', ref: 'e5', children: [{ role: 'link', name: 'Continue to Checkout', ref: 'e6', interactive: true }] }
            const result = await report(doc([add]), doc([{ ...add, states: ['disabled', 'focused'] }, dialog]))
            expect(result.text).toBe('Changes:\nOpened dialog "Item added!" [ref=e5]\n  - link "Continue to Checkout" [ref=e6]\n+ - button "Add To Basket" [ref=e1] [disabled] [focused]')
        })

        it('lists a new line before a state change of an existing one', async () => {
            const result = await report(doc([add]), doc([{ ...add, states: ['disabled'] }, { role: 'status', name: 'Saved' }]))
            expect(result.text).toBe('Changes:\n+ - status "Saved"\n+ - button "Add To Basket" [ref=e1] [disabled]')
        })

        it('sums up a carousel that rotates on its own as one line', async () => {
            const result = await report(doc([add, carousel(1)]), doc([add, carousel(2)]))
            expect(result.text).toBe('Changes:\nCarousel moved')
            expect(result.change).toEqual({ kind: 'changed', added: ['Carousel moved'], omitted: 0 })
        })

        it('drops carousel churn when something else changed', async () => {
            const result = await report(doc([add, carousel(1)]), doc([add, carousel(2), { role: 'status', name: 'Saved' }]))
            expect(result.text).toBe('Changes:\n+ - status "Saved"')
        })

        it('does not call a closed popup "no change" while a carousel rotates', async () => {
            const result = await report(doc([banner, dots(1)]), doc([dots(2)]))
            expect(result.change).toEqual({ kind: 'changed', added: ['Closed region "Cookie banner"'], omitted: 0 })
        })

        it('reports a panel that opens through its expanded state', async () => {
            const result = await report(doc([{ role: 'complementary', name: 'Help', ref: 'e7', states: ['collapsed'] }]), doc([{ role: 'complementary', name: 'Help', ref: 'e7', states: ['expanded'] }]))
            expect(result.text).toBe('Changes:\nOpened complementary "Help" [ref=e7]')
        })
    })
})
