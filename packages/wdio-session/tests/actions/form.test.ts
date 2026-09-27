import { describe, expect, it } from 'vitest'

import { check, click, focus, uncheck } from '../../src/actions/interact.js'
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

describe('check', () => {
    it('clicks a checkbox only when its state differs', async () => {
        let clicks = 0
        const element = {
            elementId: '1',
            selected: false,
            isSelected: async () => element.selected,
            click: async () => {
                clicks++
                element.selected = !element.selected
            }
        }
        const checked = await check(session(element), { target: '#agree', $cwd: '/' })
        expect(clicks).toBe(1)
        expect(checked.text).toContain('Checked')
        const again = await check(session(element), { target: '#agree', $cwd: '/' })
        expect(clicks).toBe(1)
        expect(again.history).toContain('isSelected()')
        const cleared = await uncheck(session(element), { target: '#agree', $cwd: '/' })
        expect(clicks).toBe(2)
        expect(cleared.text).toContain('Unchecked')
    })
})

describe('click --new-tab', () => {
    it('opens the link href in a new window', async () => {
        const element: Record<string, unknown> = {
            elementId: '1',
            getAttribute: async () => '/guide'
        }
        const result = await click(session(element), { target: 'a', newTab: true, $cwd: '/' })
        expect(element.opened).toBe('https://example.com/guide')
        expect(result.text).toContain('https://example.com/guide')
        expect(result.history).toContain('newWindow')
    })

    it('rejects an element with no href', async () => {
        const element = { elementId: '1', getAttribute: async () => null }
        await expect(click(session(element), { target: 'button', newTab: true, $cwd: '/' })).rejects.toThrow('no href')
    })
})
