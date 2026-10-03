import { beforeEach, describe, expect, it } from 'vitest'

import '../../src/injected/accessibility.js'
import findByRoleSource, { ACCESSIBILITY_API_MISSING } from '../../src/scripts/findByRole.js'

/**
 * the finder runs from its source, like `browser.execute` sends it
 */
const findByRole = new Function(`return (${findByRoleSource.toString()})`)() as typeof findByRoleSource
const all = (role: string, name: string | null = null, root: Element | null = null) =>
    findByRole(role, name, -1, root) as Element[]
const ids = (elements: Element[]) => elements.map((el) => el.id)

describe('findByRole script', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('matches native and explicit roles alike', () => {
        document.body.innerHTML = `
            <button id="native">Ok</button>
            <div id="explicit" role="button">Ok</div>
            <input id="submit" type="submit" value="Ok">
            <a id="link" href="/ok">Ok</a>
            <a id="anchor">Ok</a>
        `
        expect(ids(all('button', 'Ok'))).toEqual(['native', 'explicit', 'submit'])
        expect(ids(all('link', 'Ok'))).toEqual(['link'])
    })

    it('computes the accessible name from aria-labelledby, aria-label, labels, alt and content', () => {
        document.body.innerHTML = `
            <span id="label-a">Billing</span><span id="label-b">address</span>
            <section id="labelledby" aria-labelledby="label-a label-b"></section>
            <button id="aria-label" aria-label="Close dialog">×</button>
            <label for="email">Email</label><input id="email" type="email">
            <label>Accept terms <input id="wrapped" type="checkbox"></label>
            <img id="logo" alt="Company logo" src="logo.png">
            <h2 id="heading">Order <em>summary</em></h2>
            <input id="search" type="search" placeholder="Search products">
        `
        expect(ids(all('region', 'Billing address'))).toEqual(['labelledby'])
        expect(ids(all('button', 'Close dialog'))).toEqual(['aria-label'])
        expect(ids(all('textbox', 'Email'))).toEqual(['email'])
        expect(ids(all('checkbox', 'Accept terms'))).toEqual(['wrapped'])
        expect(ids(all('img', 'Company logo'))).toEqual(['logo'])
        expect(ids(all('image', 'Company logo'))).toEqual(['logo'])
        expect(ids(all('heading', 'Order summary'))).toEqual(['heading'])
        expect(ids(all('searchbox', 'Search products'))).toEqual(['search'])
    })

    it('matches the full name only', () => {
        document.body.innerHTML = '<button id="add">Add to cart</button>'
        expect(all('button', 'Add')).toEqual([])
        expect(ids(all('button', 'Add to cart'))).toEqual(['add'])
    })

    it('matches any name when the name is null', () => {
        document.body.innerHTML = '<table><tr id="one"><td>1</td></tr><tr id="two"><td>2</td></tr></table>'
        expect(ids(all('row'))).toEqual(['one', 'two'])
    })

    it('leaves out elements hidden from the accessibility tree', () => {
        document.body.innerHTML = `
            <button id="visible">Remove</button>
            <div aria-hidden="true"><button id="aria-hidden">Remove</button></div>
            <button id="hidden" hidden>Remove</button>
            <div style="display: none"><button id="in-hidden-parent">Remove</button></div>
        `
        expect(ids(all('button', 'Remove'))).toEqual(['visible'])
    })

    it('searches open shadow roots', () => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        host.attachShadow({ mode: 'open' }).innerHTML = '<button id="in-shadow">Pay now</button>'
        const [found] = all('button', 'Pay now')
        expect(found?.id).toBe('in-shadow')
    })

    it('leaves out light DOM children of a shadow host that no slot takes', () => {
        const slotted = document.createElement('div')
        slotted.innerHTML = '<button id="slotted">Pay now</button>'
        document.body.appendChild(slotted)
        slotted.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>'

        const unslotted = document.createElement('div')
        unslotted.innerHTML = '<span><button id="unslotted">Pay now</button></span>'
        document.body.appendChild(unslotted)
        unslotted.attachShadow({ mode: 'open' }).innerHTML = '<button id="in-shadow">Pay now</button>'

        expect(ids(all('button', 'Pay now'))).toEqual(['slotted', 'in-shadow'])
    })

    it('searches within a root element only', () => {
        document.body.innerHTML = `
            <div id="row-1"><button id="remove-1">Remove</button></div>
            <div id="row-2"><button id="remove-2">Remove</button></div>
        `
        expect(ids(all('button', 'Remove', document.getElementById('row-2')))).toEqual(['remove-2'])
    })

    it('reports when the page does not have the accessibility API yet', () => {
        const w = window as unknown as { __wdioA11y?: unknown }
        const api = w.__wdioA11y
        delete w.__wdioA11y
        try {
            expect(findByRole('button', 'Go', -1, null)).toBe(ACCESSIBILITY_API_MISSING)
        } finally {
            w.__wdioA11y = api
        }
    })

    it('returns a count, one match or every match depending on `at`', () => {
        document.body.innerHTML = '<button id="a">Go</button><button id="b">Go</button>'
        expect(findByRole('button', 'Go', null, null)).toBe(2)
        expect((findByRole('button', 'Go', 1, null) as Element).id).toBe('b')
        expect(findByRole('button', 'Go', 5, null)).toBeNull()
        expect(ids(findByRole('button', 'Go', -1, null) as Element[])).toEqual(['a', 'b'])
    })
})
