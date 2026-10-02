import { describe, it, expect } from 'vitest'

import { knownRoles, roleTable } from '../../src/scripts/roles.js'

describe('roleTable', () => {
    const table = roleTable()
    const rulesFor = (tag: string) => table.filter(([t]) => t === tag)

    it('covers the common implicit roles', () => {
        const roles = (tag: string) => rulesFor(tag).map(([, , , role]) => role)
        expect(roles('button')).toContain('button')
        expect(roles('nav')).toContain('navigation')
        expect(roles('select')).toEqual(expect.arrayContaining(['combobox', 'listbox']))
        expect(roles('input')).toEqual(expect.arrayContaining(['checkbox', 'radio', 'textbox', 'spinbutton', 'searchbox']))
    })

    it('describes attribute tests', () => {
        expect(table).toContainEqual(['input', [['type', '=checkbox']], [], 'checkbox'])
        expect(rulesFor('a').find(([, , , role]) => role === 'link')?.[1]).toEqual([['href', 'set']])
    })

    it('lists more specific rules first', () => {
        const counts = table.map(([, attrs]) => attrs.length)
        expect(counts).toEqual([...counts].sort((a, b) => b - a))
        const input = rulesFor('input')
        const combobox = input.findIndex(([, attrs, , role]) => role === 'combobox' && attrs.some(([n, t]) => n === 'type' && t === '=text'))
        const checkbox = input.findIndex(([, , , role]) => role === 'checkbox')
        expect(combobox).toBeLessThan(checkbox)
        expect(roleTable()).toBe(table)
    })

    it('lists concrete ARIA roles and leaves out abstract ones', () => {
        const roles = knownRoles()
        expect(roles).toEqual(expect.arrayContaining(['button', 'link', 'heading', 'dialog', 'row']))
        expect(roles).not.toContain('widget')
        expect(roles).not.toContain('landmark')
    })
})
