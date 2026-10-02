import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { roleTable } from '../../src/snapshot/roles.js'
import { collectInPage, type CollectOptions } from '../../src/snapshot/web.js'

function candidatesOf (html: string) {
    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { url: 'https://example.com/', runScripts: 'dangerously' })
    const win = dom.window as unknown as Window & { __collect?: typeof collectInPage }
    win.WeakRef = WeakRef
    win.WeakMap = WeakMap
    /**
     * jsdom has no `CSS.escape`
     */
    ;(win as unknown as { CSS: { escape: (value: string) => string } }).CSS = {
        escape: (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)
    }
    const script = win.document.createElement('script')
    script.textContent = `window.__collect = (${collectInPage.toString()})`
    win.document.documentElement.appendChild(script)
    const opts: CollectOptions = { roles: roleTable(), counter: 0, all: false, boxes: false, assignRefs: true }
    const { refs } = win.__collect!(opts)
    return (role: string, name: string) => refs.find((ref) => ref.role === role && ref.name === name)?.candidates
}

describe('snapshot selector candidates', () => {
    it('suggests role/<role>[name="..."] before aria/<name> for a unique role and name', () => {
        const candidates = candidatesOf('<button>Add to cart</button>')
        expect(candidates('button', 'Add to cart')?.slice(0, 2)).toEqual([
            'role/button[name="Add to cart"]',
            'aria/Add to cart'
        ])
    })

    it('keeps test ids first', () => {
        const candidates = candidatesOf('<button data-testid="add">Add to cart</button>')
        expect(candidates('button', 'Add to cart')?.slice(0, 2)).toEqual([
            '[data-testid="add"]',
            'role/button[name="Add to cart"]'
        ])
    })

    it('uses the role to tell apart elements that share a name', () => {
        const candidates = candidatesOf('<button>Help</button><a href="/help">Help</a>')
        expect(candidates('button', 'Help')).toContain('role/button[name="Help"]')
        expect(candidates('link', 'Help')).toContain('role/link[name="Help"]')
        expect(candidates('button', 'Help')).not.toContain('aria/Help')
    })

    it('leaves out the role selector when role and name are not unique', () => {
        const candidates = candidatesOf('<button>Remove</button><button>Remove</button>')
        expect(candidates('button', 'Remove')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('escapes quotes and backslashes in the name', () => {
        const candidates = candidatesOf('<button>Say "hi" \\ bye</button>')
        expect(candidates('button', 'Say "hi" \\ bye')).toContain('role/button[name="Say \\"hi\\" \\\\ bye"]')
    })
})
