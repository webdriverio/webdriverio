import { describe, expect, it } from 'vitest'

import { check, click, focus, uncheck } from '../../src/actions/interact.js'
import type { Session } from '../../src/session.js'

function session (element: Record<string, unknown>) {
    const store = new Map<string, unknown>()
    return {
        currentUrl: async () => 'https://example.com/app',
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => store.set(key, value),
        browser: {
            $: () => ({ getElement: async () => element }),
            execute: async (_fn: unknown, el: unknown) => {
                expect(el).toBe(element)
            },
            switchFrame: async () => {
                element.switched = true
            },
            newWindow: async (url: string, options?: { type?: string }) => {
                element.opened = url
                element.windowType = options?.type
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

    it('does not report a radio button as unchecked when the click leaves it selected', async () => {
        const element = {
            elementId: '1',
            isSelected: async () => true,
            click: async () => {}
        }
        await expect(uncheck(session(element), { target: '#choice', $cwd: '/' })).rejects.toThrow('still checked')
    })
})

describe('click --new-tab', () => {
    it('opens the resolved link in a tab and leaves the previous frame', async () => {
        const element: Record<string, unknown> = {
            elementId: '1',
            getAttribute: async () => 'guide',
            getProperty: async () => 'https://example.com/docs/guide'
        }
        const harness = session(element)
        harness.set('frame', 'iframe')
        const result = await click(harness, { target: 'a', newTab: true, $cwd: '/' })
        expect(element.opened).toBe('https://example.com/docs/guide')
        expect(element.windowType).toBe('tab')
        expect(element.switched).toBe(true)
        expect(harness.get('frame')).toBeUndefined()
        expect(harness.get('frameStack')).toEqual([])
        expect(result.history).toContain("type: 'tab'")
    })

    it('rejects an element with no href', async () => {
        const element = { elementId: '1', getAttribute: async () => null }
        await expect(click(session(element), { target: 'button', newTab: true, $cwd: '/' })).rejects.toThrow('no href')
    })
})
