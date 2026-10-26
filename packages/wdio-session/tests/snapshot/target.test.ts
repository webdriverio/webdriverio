import { describe, expect, it } from 'vitest'

import { RefRegistry, refId } from '@wdio/snapshot'
import { resolveTarget } from '../../src/snapshot/target.js'
import type { Session } from '../../src/session.js'

describe('refId', () => {
    it('accepts snapshot refs and the @ form used by other agent CLIs', () => {
        expect(refId('e12')).toBe('e12')
        expect(refId('@e12')).toBe('e12')
        expect(refId('@e')).toBeUndefined()
        expect(refId('aria/Sign in')).toBeUndefined()
        expect(refId('button')).toBeUndefined()
    })
})

describe('resolveTarget', () => {
    it('looks up @e3 as e3', async () => {
        const element = { elementId: '1' }
        const session = {
            browser: {},
            refs: {
                resolve: async (_browser: unknown, id: string) => {
                    expect(id).toBe('e3')
                    return element
                },
                stableSelector: async () => 'aria/Go',
                get: (id: string) => ({ id, role: 'link', name: 'Go' })
            }
        }
        const resolved = await resolveTarget(session as unknown as Session, '@e3')
        expect(resolved.element).toBe(element)
        expect(resolved.selector).toBe('aria/Go')
        expect(resolved.label).toBe('e3 (link "Go")')
        expect(resolved.code).toBe('$(\'aria/Go\')')
    })

    it('notes in the recorded code when no selector matches only the element', async () => {
        const refs = new RefRegistry()
        refs.set({ id: 'e4', kind: 'web', role: 'button', name: 'Go', candidates: ['button'], generation: 1 })
        const element = { elementId: '1', isEqual: async () => false }
        const browser = { $: () => ({ getElement: async () => element }), $$: () => ({ getElements: async () => [element, element] }) }
        const resolved = await resolveTarget({ browser, refs } as unknown as Session, 'e4')
        expect(resolved.selector).toBe('button')
        expect(resolved.code).toMatch(/^\$\('button'\) \/\* .*may not replay \*\/$/)
    })

    it('acts on a resolved ref that has no selector candidates instead of asking for a new snapshot', async () => {
        const refs = new RefRegistry()
        refs.set({ id: 'e5', kind: 'web', role: 'button', name: '', candidates: [], generation: 1 })
        const element = { elementId: '1' }
        const browser = { $: () => ({ getElement: async () => element }), $$: () => ({ getElements: async () => [] }) }
        const resolved = await resolveTarget({ browser, refs } as unknown as Session, 'e5')
        expect(resolved.element).toBe(element)
        expect(resolved.selector).toBe("ref('e5')")
        expect(resolved.code).toBe("ref('e5') /* no selector matches this element, this step only replays in this session */")
        expect(resolved.label).toBe('e5 (button)')
    })

    it('still reports a ref without candidates whose element is gone as stale', async () => {
        const refs = new RefRegistry()
        refs.set({ id: 'e6', kind: 'web', role: 'button', name: '', candidates: [], generation: 1 })
        const browser = { $: () => ({ getElement: async () => ({}) }) }
        await expect(resolveTarget({ browser, refs } as unknown as Session, 'e6')).rejects.toMatchObject({ code: 'REF_STALE' })
    })
})
