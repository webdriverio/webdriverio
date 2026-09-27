import { describe, expect, it } from 'vitest'

import { focus } from '../../src/actions/interact.js'
import type { Session } from '../../src/session.js'

function session (element: Record<string, unknown>) {
    return {
        currentUrl: async () => 'https://example.com/docs',
        browser: {
            $: () => ({ getElement: async () => element }),
            execute: async (_fn: unknown, el: unknown) => {
                expect(el).toBe(element)
            },
            newWindow: async (url: string) => {
                element.opened = url
            }
        }
    } as unknown as Session
}

describe('focus', () => {
    it('focuses the element', async () => {
        const element = { elementId: '1' }
        const result = await focus(session(element), { target: '#email', $cwd: '/' })
        expect(result.text).toContain('#email')
        expect(result.history).toContain('.focus()')
    })
})

