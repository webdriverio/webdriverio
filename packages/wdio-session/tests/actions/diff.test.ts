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
    it('matches the whole text but prints and lists a capped line', async () => {
        const session = pageSession({ tree: doc([{ role: 'code', name: `${'x'.repeat(500)} needle` }]) })
        const result = await find(session, { text: 'needle' })
        const printed = result.text.split('\n').find((line) => line.includes('code'))!
        expect(printed.endsWith('…')).toBe(true)
        expect(printed).not.toContain('needle')
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
        const [match] = (result.data as { matches: { text: string }[] }).matches
        expect(match.text).toHaveLength(300)
    })
})
