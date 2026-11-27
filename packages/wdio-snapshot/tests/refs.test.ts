import { describe, expect, it, vi } from 'vitest'

import { RefRegistry, locatorProviderNames, queryAll } from '../src/refs.js'
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

    it('reports a ref with no candidates as REF_STALE on stableSelector', async () => {
        const refs = new RefRegistry()
        refs.set({ id: 'e1', kind: 'web', role: 'button', candidates: [], generation: 1 })
        await expect(refs.stableSelector(browser, 'e1')).rejects.toMatchObject({
            code: 'REF_STALE',
            message: 'e1 has no selector matching its element.'
        })
    })
})

describe('selector providers in refs', () => {
    const ELEMENT = { elementId: 'el-1' }
    const found = () => ({ getElements: async () => [ELEMENT] })
    const fakeBrowser = () => ({ $$: vi.fn(found), custom$$: vi.fn(found) }) as unknown as WebdriverIO.Browser & { $$: ReturnType<typeof vi.fn>, custom$$: ReturnType<typeof vi.fn> }

    it('routes a name:arg selector of a registered provider to custom$$', () => {
        const browser = fakeBrowser()
        queryAll(browser, 'ui5:{"id":"x"}', ['ui5'])
        expect(browser.custom$$).toHaveBeenCalledWith('ui5', '{"id":"x"}')
        expect(browser.$$).not.toHaveBeenCalled()
    })

    it('keeps CSS selectors on $$', () => {
        const browser = fakeBrowser()
        queryAll(browser, 'button:first-child', ['ui5'])
        expect(browser.$$).toHaveBeenCalledWith('button:first-child')
        expect(browser.custom$$).not.toHaveBeenCalled()
    })

    it('resolves a ref whose candidate is a provider selector through custom$$', async () => {
        const refs = new RefRegistry({ providerNames: ['ui5'] })
        refs.set({ id: 'e1', kind: 'native', role: 'button', candidates: ['ui5:{"id":"x"}'], generation: 1 })
        const browser = fakeBrowser()
        expect(await refs.resolve(browser, 'e1')).toBe(ELEMENT)
        expect(browser.custom$$).toHaveBeenCalledWith('ui5', '{"id":"x"}')
    })
})

describe('locatorProviderNames', () => {
    it('keeps only the providers that have a locator', () => {
        expect(locatorProviderNames([{ name: 'ui5', locator: 'async () => null' }, { name: 'e2e' }])).toEqual(['ui5'])
    })

    it('is empty without providers', () => {
        expect(locatorProviderNames()).toEqual([])
    })

    it('leaves a name:arg selector of a provider without a locator on $$', () => {
        const browser = { $$: vi.fn(), custom$$: vi.fn() } as unknown as WebdriverIO.Browser
        queryAll(browser, 'e2e:x', locatorProviderNames([{ name: 'e2e' }]))
        expect(browser.$$).toHaveBeenCalledWith('e2e:x')
    })
})
