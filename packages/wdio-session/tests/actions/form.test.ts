import { describe, expect, it, vi } from 'vitest'
import { setWdioKind } from '@wdio/utils'

import { check, click, focus, uncheck } from '../../src/actions/interact.js'
import type { Session } from '../../src/session.js'

vi.mock('webdriverio', () => ({
    getContextManager: () => ({ setCurrentContext: vi.fn() })
}))

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

    it('focuses the browsing context that newWindow() gives in a BiDi session, and only a branded one', async () => {
        for (const [opened, focused] of [
            [setWdioKind({ contextId: 'tab-3' }, 'browsing-context'), ['tab-3']],
            [{ contextId: 'tab-3' }, []]
        ] as const) {
            const element: Record<string, unknown> = { elementId: '1', getProperty: async () => 'https://example.com/docs' }
            const harness = session(element) as unknown as { isBidi: boolean, browser: Record<string, unknown> }
            const switched: string[] = []
            harness.isBidi = true
            harness.browser.newWindow = async () => opened
            harness.browser.switchToWindow = async (id: string) => {
                switched.push(id)
            }

            await click(harness as unknown as Session, { target: 'a', newTab: true, $cwd: '/' })

            expect({ opened, switched }).toEqual({ opened, switched: focused })
        }
    })

    it('rejects an element with no href', async () => {
        const element = { elementId: '1', getAttribute: async () => null }
        await expect(click(session(element), { target: 'button', newTab: true, $cwd: '/' })).rejects.toThrow('no href')
    })
})
