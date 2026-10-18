import { describe, expect, it } from 'vitest'

import { RefRegistry } from '../src/refs.js'
import { SnapshotError } from '../src/errors.js'

const browser = {} as WebdriverIO.Browser

describe('RefRegistry errors', () => {
    it('throws SnapshotError by default', async () => {
        const refs = new RefRegistry()
        const err = await refs.resolve(browser, 'e1').catch((e) => e)
        expect(err).toBeInstanceOf(SnapshotError)
        expect(err).toMatchObject({ code: 'REF_NOT_FOUND', message: 'e1 was never assigned in this session.' })
    })

    it('throws what createError returns', async () => {
        const calls: unknown[][] = []
        const refs = new RefRegistry({
            createError: (code, message, opts) => {
                calls.push([code, message, opts])
                return new RangeError(message)
            }
        })
        await expect(refs.resolve(browser, 'e2')).rejects.toBeInstanceOf(RangeError)
        await expect(refs.stableSelector(browser, 'e3')).rejects.toBeInstanceOf(RangeError)
        expect(calls).toEqual([
            ['REF_NOT_FOUND', 'e2 was never assigned in this session.', { resnapshot: true }],
            ['REF_NOT_FOUND', 'e3 was never assigned in this session.', { resnapshot: false }]
        ])
    })

    it('reports a ref whose element is gone as REF_STALE', async () => {
        const refs = new RefRegistry()
        refs.set({ id: 'e1', kind: 'native', role: 'button', candidates: ['~gone'], generation: 1 })
        const gone = { $$: () => ({ getElements: async () => [] }) } as unknown as WebdriverIO.Browser
        await expect(refs.resolve(gone, 'e1')).rejects.toMatchObject({ code: 'REF_STALE', message: 'e1 no longer exists on the page.' })
    })
})
