import { describe, expect, it } from 'vitest'

/**
 * from the source: the `@wdio/utils` entry point needs Node.js
 */
import { knownRoles, roleTable } from '../../../wdio-utils/src/roles.js'
import { collectInPage, type CollectOptions } from '../../src/snapshot/web.js'

/**
 * Runs the collector in a real browser the way a session does: from its
 * source, so it cannot rely on anything outside its body.
 */
function candidatesOf (html: string) {
    document.body.innerHTML = html
    const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    const opts: CollectOptions = { roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true }
    const { refs } = collect(opts)
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

    it('counts elements the snapshot does not walk into, e.g. an image inside a named button', () => {
        const candidates = candidatesOf('<img alt="Save" width="16" height="16"><button><img alt="Save" width="16" height="16"></button>')
        expect(candidates('img', 'Save')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('suggests no role selector for a role the selector does not accept', () => {
        const candidates = candidatesOf('<div role="bogus" tabindex="0" aria-label="Unique action">Unique action</div>')
        expect(candidates('bogus', 'Unique action')).toBeDefined()
        expect(candidates('bogus', 'Unique action')?.some((candidate) => candidate.startsWith('role/'))).toBe(false)
    })

    it('does not count a light DOM child of a shadow host that no slot takes', () => {
        document.body.innerHTML = ''
        const host = document.createElement('div')
        host.innerHTML = '<button>Pay now</button>'
        document.body.appendChild(host)
        host.attachShadow({ mode: 'open' }).innerHTML = '<button>Pay now</button>'
        const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const { refs } = collect({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        const payNow = refs.filter((ref) => ref.role === 'button' && ref.name === 'Pay now')
        expect(payNow).toHaveLength(1)
        expect(payNow[0].candidates).toContain('role/button[name="Pay now"]')
    })

    it('escapes quotes and backslashes in the name', () => {
        const candidates = candidatesOf('<button>Say "hi" \\ bye</button>')
        expect(candidates('button', 'Say "hi" \\ bye')).toContain('role/button[name="Say \\"hi\\" \\\\ bye"]')
    })
})
