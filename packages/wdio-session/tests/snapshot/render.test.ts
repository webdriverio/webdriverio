import { describe, expect, it } from 'vitest'
import type { SnapshotNode } from '@wdio/snapshot'

import { renderSnapshot } from '../../src/snapshot/render.js'
import type { Session } from '../../src/session.js'

const tree = (): SnapshotNode => ({
    role: 'document',
    children: [
        { role: 'heading', name: 'Top', box: [0, 0, 100, 20] },
        { role: 'button', name: 'On', ref: 'e1', interactive: true, box: [0, 40, 50, 20] },
        { role: 'button', name: 'Off', ref: 'e2', interactive: true, box: [0, 900, 50, 20] }
    ]
})
const refs = [
    { id: 'e1', candidates: [{ kind: 'accessibility-id' as const, selector: '~On' }] },
    { id: 'e2', candidates: [{ kind: 'accessibility-id' as const, selector: '~Off' }] }
]
const fake = () => ({ lastSnapshot: undefined as string | undefined, browser: { getWindowSize: async () => ({ width: 400, height: 800 }) } }) as unknown as Session & { lastSnapshot?: string }

describe('renderSnapshot', () => {
    it('remembers the canonical text of the whole tree as lastSnapshot, whatever was printed', async () => {
        const session = fake()
        const text = await renderSnapshot(session, tree(), refs, { selectors: true, viewport: true, depth: 1, boxes: true }, true)
        expect(text).toContain('- button "On" [ref=e1] [box=0,40,50,20]  → ~On')
        expect(session.lastSnapshot).toBe('- document\n  - heading "Top"\n  - button "On" [ref=e1]\n  - button "Off" [ref=e2]')
    })

    it('drops what is outside the viewport and prints boxes only when asked', async () => {
        const session = fake()
        const text = await renderSnapshot(session, tree(), refs, { viewport: true }, true)
        expect(text).toBe('- document\n  - heading "Top"\n  - button "On" [ref=e1]')
        expect(await renderSnapshot(session, tree(), refs, { viewport: true, boxes: true }, true)).toContain('[box=0,40,50,20]')
    })
})
