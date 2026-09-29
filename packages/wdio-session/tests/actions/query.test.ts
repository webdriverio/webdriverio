import { describe, expect, it, vi } from 'vitest'

import { get, is } from '../../src/actions/query.js'
import type { Session } from '../../src/session.js'

function session () {
    const element = {
        elementId: '1',
        getText: async () => 'Hello',
        getHTML: async () => 'Hello',
        getValue: async () => 'ada',
        getAttribute: async (name: string) => (name === 'href' ? '/guide' : null),
        getLocation: async () => ({ x: 10, y: 20 }),
        getSize: async () => ({ width: 30, height: 40 }),
        isDisplayed: async () => true,
        isEnabled: async () => false,
        isSelected: async () => true
    }
    return {
        browser: {
            getTitle: async () => 'Shop',
            getUrl: async () => 'https://example.com/shop',
            $$: async (selector: string) => (selector === 'a' ? [element, element] : []),
            $: () => ({ getElement: async () => element })
        }
    } as unknown as Session
}

describe('get', () => {
    it('reads the page title and url', async () => {
        const title = await get(session(), { sub: 'title', $cwd: '/' })
        const url = await get(session(), { sub: 'url', $cwd: '/' })
        expect(title.text).toBe('Shop')
        expect(title.code).toBe('await browser.getTitle()')
        expect(url.text).toBe('https://example.com/shop')
        expect(url.history).toBeUndefined()
    })

    it('reads element text, html, value, attribute and box', async () => {
        const s = session()
        expect((await get(s, { sub: 'text', target: 'h1', $cwd: '/' })).text).toBe('Hello')
        expect((await get(s, { sub: 'html', target: 'h1', $cwd: '/' })).text).toBe('Hello')
        expect((await get(s, { sub: 'value', target: '#email', $cwd: '/' })).text).toBe('ada')
        const attr = await get(s, { sub: 'attr', target: 'a', name: 'href', $cwd: '/' })
        expect(attr.text).toBe('/guide')
        expect(attr.data).toEqual({ name: 'href', value: '/guide' })
        const box = await get(s, { sub: 'box', target: 'h1', $cwd: '/' })
        expect(box.text).toBe('10,20 30x40')
        expect(box.data).toEqual({ box: { x: 10, y: 20, width: 30, height: 40 } })
    })

    it('counts selector matches', async () => {
        const counted = await get(session(), { sub: 'count', target: 'a', $cwd: '/' })
        expect(counted.text).toBe('2')
        expect(counted.data).toEqual({ count: 2 })
    })

    it('counts a ref as the one element it names', async () => {
        const s = session()
        const element = { elementId: '1' }
        const queryAll = vi.fn(async () => [])
        Object.assign(s, {
            refs: {
                resolve: async () => element,
                stableSelector: async () => 'aria/Go',
                get: () => ({ role: 'button', name: 'Go' })
            }
        })
        Object.assign(s.browser, { $$: queryAll })
        const counted = await get(s, { sub: 'count', target: '@e12', $cwd: '/' })
        expect(counted.text).toBe('1')
        expect(counted.data).toEqual({ count: 1 })
        expect(queryAll).not.toHaveBeenCalled()
    })

    it('rejects a missing attribute name', async () => {
        await expect(get(session(), { sub: 'attr', target: 'a', $cwd: '/' })).rejects.toThrow('Pass an attribute name.')
    })
})

describe('is', () => {
    it('prints true or false for visible, enabled and checked', async () => {
        const s = session()
        expect((await is(s, { sub: 'visible', target: 'h1', $cwd: '/' })).text).toBe('true')
        const enabled = await is(s, { sub: 'enabled', target: '#email', $cwd: '/' })
        expect(enabled.text).toBe('false')
        expect(enabled.data).toEqual({ enabled: false })
        expect((await is(s, { sub: 'checked', target: '#agree', $cwd: '/' })).text).toBe('true')
    })
})
