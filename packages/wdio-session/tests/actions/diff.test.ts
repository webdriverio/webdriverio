import { describe, expect, it } from 'vitest'

import { diff, find, takeSnapshot } from '../../src/actions/observe.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

const doc = (children: SnapshotNode[]): SnapshotNode => ({ role: 'document', name: 'Shop', children })
const refs = [{ id: 'e1', role: 'button', name: 'Add', candidates: [{ kind: 'testid', selector: '[data-testid="add"]' }] }]

function pageSession (page: { tree: SnapshotNode }) {
    return {
        isWeb: true,
        applies: ['W'],
        refs: new RefRegistry(),
        get: () => undefined,
        browser: {
            execute: async (fn: unknown, json?: string) => {
                const all = String(json).includes('"all":true')
                const tree = structuredClone(page.tree)
                tree.children = tree.children?.filter((node) => all || !node.hidden)
                return { tree, refs, counter: 1 }
            }
        }
    } as unknown as Session
}

const page = () => ({
    tree: doc([
        { role: 'heading', name: 'Top', box: [0, 0, 100, 20] },
        { role: 'button', name: 'Add', ref: 'e1', interactive: true, box: [0, 40, 50, 20] },
        { role: 'button', name: 'Far', interactive: true, box: [0, 2000, 50, 20] },
        { role: 'status', name: 'Hidden', hidden: true }
    ])
})

describe('diff baseline', () => {
    it.each([
        ['--selectors', { selectors: true }],
        ['--depth', { depth: 1 }],
        ['--compact', { compact: true }],
        ['--boxes', { boxes: true }]
    ])('finds no changes on an unchanged page after snapshot %s', async (_label, opts) => {
        const session = pageSession(page())
        await takeSnapshot(session, opts)
        expect((await diff(session, { $cwd: '/' })).text).toBe('No changes')
    })

    it('leaves the baseline alone after a web --viewport snapshot, which is cut in the page', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, {})
        const baseline = session.lastSnapshot
        await takeSnapshot(session, { viewport: true })
        expect(session.lastSnapshot).toBe(baseline)
    })

    it('compares an interactive diff with the interactive baseline', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, { interactive: true, selectors: true })
        expect((await diff(session, { interactive: true, $cwd: '/' })).text).toBe('No changes')
    })

    it('keeps the snapshot as the baseline when find has to retry with --all', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, {})
        const baseline = session.lastSnapshot
        await expect(find(session, { text: 'no such text anywhere' })).rejects.toThrow('No match')
        expect(session.lastSnapshot).toBe(baseline)
    })
})

describe('find on a long line', () => {
    const matchesOf = (result: { data?: unknown }) => (result.data as { matches: { text: string }[] }).matches
    const printedOf = (result: { text: string }) => result.text.split('\n').find((line) => line.startsWith('2:'))!
    const long = (needle: string) => `${'x'.repeat(500)} ${needle} ${'y'.repeat(500)}`

    it.each([
        ['a plain query', { text: 'NEEDLE' }, long('needle')],
        ['a regex', { text: 'need[l]e\\b', regex: true }, long('needle')],
        ['all words of the query', { text: 'needle haystack' }, long('haystack and a needle')],
        ['the query without spaces', { text: 'SO2' }, long('SO 2')]
    ])('keeps the match of %s in the printed line and the data', async (_label, args, name) => {
        const session = pageSession({ tree: doc([{ role: 'code', name }]) })
        const result = await find(session, args)
        const word = /need|SO ?2/i
        const printed = printedOf(result)
        expect(printed).toMatch(word)
        expect(printed.startsWith('2:…')).toBe(true)
        expect(printed.endsWith('…')).toBe(true)
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
        const [match] = matchesOf(result)
        expect(match.text).toMatch(word)
        expect(match.text.length).toBeLessThanOrEqual(300)
    })

    it('keeps the start of a line whose match is near it', async () => {
        const session = pageSession({ tree: doc([{ role: 'code', name: `needle ${'x'.repeat(500)}` }]) })
        const result = await find(session, { text: 'needle' })
        expect(printedOf(result)).toMatch(/^2: {2}- code "needle x+…$/)
        expect(matchesOf(result)[0].text).toHaveLength(300)
    })

    it('shows the end of a line whose match is at it, without a trailing ellipsis', async () => {
        const session = pageSession({ tree: doc([{ role: 'code', name: `${'x'.repeat(500)} needle` }]) })
        const result = await find(session, { text: 'needle' })
        expect(printedOf(result)).toMatch(/^2:…x+ needle"$/)
        expect(matchesOf(result)[0].text).toHaveLength(300)
    })
})
