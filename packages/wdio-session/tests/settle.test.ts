import { describe, expect, it, vi } from 'vitest'
import { RefRegistry } from '@wdio/snapshot'

import { takeSnapshot } from '../src/actions/observe.js'
import { QUIET_MS, SETTLE_MAX_MS } from '../src/settle.js'
import type { Session } from '../src/session.js'

const tree = { role: 'document', name: 'Shop', children: [{ role: 'button', name: 'Pay', ref: 'e1', interactive: true }] }

function fakeSession (opts: { isWeb?: boolean, applies?: string[] } = {}) {
    const settleCalls: unknown[][] = []
    const url = { current: 'https://shop.test/' }
    const execute = vi.fn(async (_fn: unknown, ...args: unknown[]) => {
        // the collector's second argument is its JSON options, the settle script's is a number
        if (typeof args[0] === 'number') {
            settleCalls.push(args)
            return undefined
        }
        return { tree, refs: [], counter: 1 }
    })
    const session = {
        isWeb: opts.isWeb ?? true,
        applies: opts.applies ?? ['W'],
        refs: new RefRegistry(),
        settledUrl: undefined as string | undefined,
        get: () => undefined,
        currentUrl: async () => url.current,
        browser: { execute }
    } as unknown as Session
    return { session, settleCalls, url }
}

describe('settling a fresh page before a snapshot', () => {
    it('waits on the first snapshot, not on the second of the same page', async () => {
        const { session, settleCalls } = fakeSession()
        await takeSnapshot(session)
        expect(settleCalls).toEqual([[QUIET_MS, SETTLE_MAX_MS, true, []]])
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(1)
    })

    it('waits again once a navigation unset the settled page, or the URL differs', async () => {
        const { session, settleCalls, url } = fakeSession()
        await takeSnapshot(session)
        session.settledUrl = undefined
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(2)
        url.current = 'https://shop.test/cart'
        await takeSnapshot(session)
        expect(settleCalls).toHaveLength(3)
    })

    it('does not wait in a native session', async () => {
        const { session, settleCalls } = fakeSession({ isWeb: false, applies: ['M'] })
        await takeSnapshot(session).catch(() => undefined)
        expect(settleCalls).toHaveLength(0)
    })
})
