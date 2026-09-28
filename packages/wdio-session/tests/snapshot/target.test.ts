import { describe, expect, it } from 'vitest'

import { isRef, refId } from '../../src/snapshot/refs.js'
import { resolveTarget } from '../../src/snapshot/target.js'
import type { Session } from '../../src/session.js'

describe('refId', () => {
    it('accepts snapshot refs and the @ form used by other agent CLIs', () => {
        expect(refId('e12')).toBe('e12')
        expect(refId('@e12')).toBe('e12')
        expect(isRef('@e3')).toBe(true)
        expect(refId('@e')).toBeUndefined()
        expect(refId('aria/Sign in')).toBeUndefined()
        expect(isRef('button')).toBe(false)
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
})
