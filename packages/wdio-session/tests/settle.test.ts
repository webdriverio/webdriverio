import { describe, expect, it, vi } from 'vitest'
import { RefRegistry } from '@wdio/snapshot'

import { takeSnapshot } from '../src/actions/observe.js'
import { QUIET_MS, SETTLE_MAX_MS } from '../src/settle.js'
import type { Session } from '../src/session.js'

const tree = { role: 'document', name: 'Shop', children: [{ role: 'button', name: 'Pay', ref: 'e1', interactive: true }] }

function fakeSession (opts: { isWeb?: boolean, applies?: string[] } = {}) {
    const settleCalls: unknown[][] = []
    const url = { current: 'https://shop.test/' }
    const held = { current: undefined as unknown }
    const origin = { current: 1000 }
    const execute = vi.fn(async (_fn: unknown, ...args: unknown[]) => {
        // the collector's second argument is its JSON options, the settle script's is a number
        if (typeof args[0] === 'number') {
            settleCalls.push(args)
            return undefined
        }
        if (!args.length) {
            return [url.current, origin.current]
        }
        return { tree, refs: [], counter: 1 }
    })
    const session = {
        isWeb: opts.isWeb ?? true,
        applies: opts.applies ?? ['W'],
        refs: new RefRegistry(),
        settledKey: undefined as string | undefined,
        get: (key: string) => held.current && key === 'activeContext' ? held.current : undefined,
        browser: { execute }
    } as unknown as Session
    return { session, settleCalls, url, held, origin }
}

describe('settling a fresh page before a snapshot', () => {
    it('waits on the first snapshot, not on the second of the same page', async () => {
        const { session, settleCalls } = fakeSession()
        await takeSnapshot(session)
        expect(settleCalls).toEqual([[QUIET_MS, SETTLE_MAX_MS, true, []]])
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(1)
    })

    it('records the key of the document read even when it skips the wait', async () => {
        const { session } = fakeSession()
        await takeSnapshot(session)
        session.pageKey = undefined
        await takeSnapshot(session)
        expect(session.pageKey).toBe(session.settledKey)
        expect(session.pageKey).toBe('|https://shop.test/|1000')
    })

    it('waits again once a navigation unset the settled page, or the URL differs', async () => {
        const { session, settleCalls, url } = fakeSession()
        await takeSnapshot(session)
        session.settledKey = undefined
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
        url.current = 'https://shop.test/cart'
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(3)
    })

    it('waits again for a reload of the same URL in the same context, not for the same document', async () => {
        const { session, settleCalls, origin } = fakeSession()
        await takeSnapshot(session)
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(1)
        origin.current = 2000
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
    })

    it('keys the wait on the held frame and its own URL, not the top-level page', async () => {
        const { session, settleCalls, held } = fakeSession()
        await takeSnapshot(session)
        const frameHref = { current: 'https://ads.test/' }
        held.current = {
            contextId: 'frame-1',
            execute: vi.fn(async (_fn: unknown, ...args: unknown[]) => {
                if (typeof args[0] === 'number') {
                    settleCalls.push(args)
                    return undefined
                }
                return args.length ? { tree, refs: [], counter: 1 } : [frameHref.current, 5]
            })
        }
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
        held.current = { ...(held.current as object), contextId: 'frame-2' }
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(3)
    })

    it('does not wait in a native session', async () => {
        const { session, settleCalls } = fakeSession({ isWeb: false, applies: ['M'] })
        await takeSnapshot(session).catch(() => undefined)
        expect(settleCalls).toHaveLength(0)
    })
})
