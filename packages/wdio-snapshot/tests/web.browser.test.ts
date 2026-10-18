import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * from the source: the `@wdio/utils` entry point needs Node.js
 */
import { knownRoles, roleTable } from '../../wdio-utils/src/roles.js'
import type { SnapshotNode } from '../src/format.js'
import { collectInPage, type CollectOptions, type CollectResult } from '../src/web.js'

const w = window as unknown as { __wdioSession?: unknown }

function collect (html: string, opts: Partial<CollectOptions> = {}) {
    document.body.innerHTML = html
    const run = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    return run({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true, ...opts })
}

const names = (node: SnapshotNode): string[] => [node.name, ...(node.children ?? []).flatMap(names)].filter((n): n is string => Boolean(n))
const FAR = '10000px'

afterEach(() => {
    delete w.__wdioSession
    vi.restoreAllMocks()
})

describe('assignRefs', () => {
    it('ephemeral numbers refs from the counter with candidates and leaves the page store alone', () => {
        delete w.__wdioSession
        const result = collect('<button data-testid="a">Alpha</button><a href="/b">Beta</a>', { assignRefs: 'ephemeral', counter: 5 })
        expect(w.__wdioSession).toBeUndefined()
        expect(result.refs.map((ref) => ref.id)).toEqual(['e6', 'e7'])
        expect(result.counter).toBe(7)
        expect(result.refs[0].candidates[0]).toEqual({ kind: 'testid', selector: '[data-testid="a"]' })
        expect(result.refs.every((ref) => ref.candidates.length > 0)).toBe(true)
    })

    it('session mode after an ephemeral run still allocates its own ids', () => {
        collect('<button>Alpha</button>', { assignRefs: 'ephemeral', counter: 40 })
        const result = collect('<button>Alpha</button><button>Beta</button>', { counter: 0 })
        expect(result.refs.map((ref) => ref.id)).toEqual(['e1', 'e2'])
        expect(w.__wdioSession).toBeDefined()
    })

    it('false hands out no refs and no candidates', () => {
        const result = collect('<button>Alpha</button>', { assignRefs: false })
        expect(result.refs).toEqual([])
        expect(result.counter).toBe(0)
    })
})

describe('viewport', () => {
    it('keeps an element that overlaps the viewport partly and drops one outside it', () => {
        const result = collect(`
            <button style="position:absolute;top:-10px;left:0;width:100px;height:40px">Partial</button>
            <button style="position:absolute;top:${FAR};left:0;width:100px;height:40px">Far away</button>
            <p style="position:absolute;top:${FAR}">Far text</p>
            <p style="position:absolute;top:20px">Near text</p>`, { viewport: true })
        const all = names(result.tree)
        expect(all).toContain('Partial')
        expect(all).toContain('Near text')
        expect(all).not.toContain('Far away')
        expect(all).not.toContain('Far text')
        expect(result.refs.map((ref) => ref.name)).toEqual(['Partial'])
    })

    it('keeps a fixed child of a parent that is scrolled away', () => {
        const result = collect(`
            <section aria-label="Far section" style="position:absolute;top:${FAR};height:100px">
                <button style="position:fixed;top:10px;left:10px;width:80px;height:30px">Pinned</button>
            </section>`, { viewport: true })
        expect(names(result.tree)).toContain('Pinned')
        expect(result.refs.map((ref) => ref.name)).toEqual(['Pinned'])
    })

    it('passes through a display: contents wrapper', () => {
        const result = collect(`
            <div style="display:contents"><button style="position:absolute;top:10px;width:80px;height:30px">Inside</button></div>
            <div style="display:contents"><button style="position:absolute;top:${FAR};width:80px;height:30px">Outside</button></div>`, { viewport: true })
        expect(names(result.tree)).toContain('Inside')
        expect(names(result.tree)).not.toContain('Outside')
    })

    it('computes no candidates for refs outside the viewport', () => {
        const escape = vi.spyOn(CSS, 'escape')
        const result = collect(`
            <button data-testid="near" style="position:absolute;top:10px;width:80px;height:30px">Near</button>
            <button data-testid="off-screen-one" style="position:absolute;top:${FAR};width:80px;height:30px">Off</button>`, { viewport: true })
        expect(result.refs.map((ref) => ref.name)).toEqual(['Near'])
        const escaped = escape.mock.calls.map(([value]) => value)
        expect(escaped).toContain('near')
        expect(escaped).not.toContain('off-screen-one')
    })

    it('drops the text of a parent taller than the viewport that sits outside it', () => {
        const result = collect(`<div>Top text<div style="height:${FAR}"></div>Bottom text</div>`, { viewport: true })
        expect(names(result.tree)).toContain('Top text')
        expect(names(result.tree)).not.toContain('Bottom text')
    })

    it('without the option keeps everything', () => {
        const result = collect(`<button style="position:absolute;top:${FAR}">Far away</button>`)
        expect(names(result.tree)).toContain('Far away')
    })
})

describe('as a page script', () => {
    it('evaluates in the global scope, so it references nothing but browser globals', () => {
        document.body.innerHTML = '<button>Alpha</button>'
        const opts: CollectOptions = { roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: 'ephemeral' }
        const json = JSON.stringify(opts)
        const result = (0, eval)(`(${collectInPage.toString()})(JSON.parse(${JSON.stringify(json)}))`) as CollectResult
        expect(result.refs.map((ref) => ref.name)).toEqual(['Alpha'])
        expect(w.__wdioSession).toBeUndefined()
    })
})

describe('combobox', () => {
    const ALGOLIA = `<div class="aa-Autocomplete" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="autocomplete-0-label">
        <form class="aa-Form" role="search"><div><label id="autocomplete-0-label" for="autocomplete-0-input"><button type="submit" title="Submit"><svg width="10" height="10"></svg></button></label></div>
        <div><input class="aa-Input" id="autocomplete-0-input" type="search" aria-autocomplete="list" aria-labelledby="autocomplete-0-label"></div></form></div>`
    const flat = (n: SnapshotNode): SnapshotNode[] => [n, ...(n.children ?? []).flatMap(flat)]

    it('exposes the input inside an ARIA 1.1 combobox wrapper as a searchbox with a ref, and keeps the button ref', () => {
        const result = collect(ALGOLIA)
        const all = flat(result.tree)
        const input = all.find((n) => n.role === 'searchbox')
        expect(input?.ref).toBeTruthy()
        expect(all.find((n) => n.role === 'button')?.ref).toBeTruthy()
        expect(all.some((n) => n.role === 'combobox')).toBe(false)
    })

    it('leaves an ARIA 1.2 input[role=combobox] as the combobox node', () => {
        const all = flat(collect('<input role="combobox" aria-label="City" value="Rome">').tree)
        expect(all.find((n) => n.role === 'combobox')).toMatchObject({ name: 'City', value: 'Rome', ref: expect.any(String) })
    })

    it('leaves a plain select as a combobox node', () => {
        const all = flat(collect('<select aria-label="Pick"><option>A</option><option>B</option></select>').tree)
        expect(all.find((n) => n.role === 'combobox')).toMatchObject({ name: 'Pick', ref: expect.any(String) })
    })
})

const nodes = (node: SnapshotNode): SnapshotNode[] => [node, ...(node.children ?? []).flatMap(nodes)]
const byRole = (result: CollectResult, role: string) => nodes(result.tree).filter((n) => n.role === role)

describe('intent of repeated controls', () => {
    it('gives each of identical row buttons the text of its row without its own name', () => {
        const result = collect(`<table>
            <tr><td>9696</td><td>Aer Lingus</td><td>$200.98</td><td><button>Choose</button></td></tr>
            <tr><td>43</td><td>Virgin</td><td>$472.56</td><td><button>Choose</button></td></tr>
            <tr><td>12</td><td>United</td><td>$432.98</td><td><button>Choose</button></td></tr></table>`)
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual(['9696 Aer Lingus $200.98', '43 Virgin $472.56', '12 United $432.98'])
    })

    it('caps the intent at 80 characters', () => {
        const long = 'word '.repeat(40)
        const result = collect(`<div>${long}<button>Go</button></div><div>${long}<button>Go</button></div>`)
        const intent = byRole(result, 'button')[0].intent!
        expect(intent).toHaveLength(80)
        expect(intent.endsWith('…')).toBe(true)
    })

    it('skips links whose item is a landmark', () => {
        const result = collect('<header><a href="/in">Sign in</a></header><main><p>Body</p></main><footer><a href="/in">Sign in</a></footer>')
        expect(byRole(result, 'link').map((l) => l.intent)).toEqual([undefined, undefined])
    })

    it('skips controls repeated across two open dialogs', () => {
        const result = collect(
            '<div role="dialog"><button>Next Month</button><button>Choose Monday, 28 September 2026</button></div>' +
            '<dialog open><button>Next Month</button><button>Choose Monday, 28 September 2026</button></dialog>'
        )
        const buttons = byRole(result, 'button')
        expect(buttons).toHaveLength(4)
        expect(buttons.map((b) => b.intent)).toEqual([undefined, undefined, undefined, undefined])
    })

    it('skips controls repeated across open dialogs nested in field wrappers', () => {
        const dialog = '<div role="dialog"><button>Previous Month</button><button>Choose Monday, 28 September 2026</button></div>'
        const result = collect(
            `<div class="field"><label for="in">Check In</label><input id="in" style="width:100px;height:20px">${dialog}</div>` +
            `<div class="field"><label for="out">Check Out</label><input id="out" style="width:100px;height:20px">${dialog}</div>`
        )
        const buttons = byRole(result, 'button')
        expect(buttons).toHaveLength(4)
        expect(buttons.map((b) => b.intent)).toEqual([undefined, undefined, undefined, undefined])
    })

    it('keeps row context for controls repeated inside one dialog', () => {
        const result = collect('<div role="dialog"><div>First room <button>Book</button></div><div>Second room <button>Book</button></div></div>')
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual(['First room', 'Second room'])
    })

    it('keeps row context when a card has its own header', () => {
        const result = collect(
            '<article><header>Product A <button>Go</button></header></article>' +
            '<article><header>Product B <button>Go</button></header></article>'
        )
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual(['Product A', 'Product B'])
    })

    it('does not count hidden text toward the intent length', () => {
        const hidden = `<span style="display:none">${'mobile-only label '.repeat(6)}</span>`
        const result = collect(
            `<table><tr><td>${hidden}Alice</td><td><button>Edit</button></td></tr>` +
            `<tr><td>${hidden}Bob</td><td><button>Edit</button></td></tr></table>`
        )
        const intents = byRole(result, 'button').map((b) => b.intent)
        expect(intents[0]).toContain('Alice')
        expect(intents[1]).toContain('Bob')
    })

    it('keeps visible text inside a visibility:hidden wrapper', () => {
        const row = (name: string) => `<tr><td><div style="visibility:hidden"><span style="visibility:visible">${name}</span></div></td><td><button>Edit</button></td></tr>`
        const result = collect(`<table>${row('Alice')}${row('Bob')}</table>`)
        const intents = byRole(result, 'button').map((b) => b.intent)
        expect(intents[0]).toContain('Alice')
        expect(intents[1]).toContain('Bob')
    })

    it('survives a decoy next to repeated buttons', () => {
        document.body.innerHTML = '<div>A <button>Edit</button><i id="decoy"></i></div><div>B <button>Edit</button></div>'
        const decoy = document.getElementById('decoy')!
        Object.defineProperty(decoy, 'tagName', { value: undefined })
        Object.defineProperty(decoy, 'getAttribute', { value: undefined })
        const run = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
        const result = run({ roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true })
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual(['A', 'B'])
    })

    it('leaves a unique button alone', () => {
        const result = collect('<div>Row text <button>Choose</button></div><div>Other <button>Pick</button></div>')
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual([undefined, undefined])
    })
})

describe('labels', () => {
    it('does not make a label of a visible input interactive', () => {
        const result = collect('<label for="n">Name</label><input id="n" style="width:100px;height:20px">')
        expect(nodes(result.tree).filter((n) => n.role === 'generic')).toEqual([])
        expect(result.refs.map((r) => r.role)).toEqual(['textbox'])
    })

    it('keeps the ref of a label whose control is hidden', () => {
        const result = collect('<label for="c" style="cursor:pointer">Remember me</label><input id="c" type="checkbox" style="opacity:0;position:absolute;width:20px;height:20px">')
        expect(result.refs.some((r) => r.name === 'Remember me' && r.role === 'generic')).toBe(true)
    })
})

describe('off-screen custom checkbox', () => {
    it('keeps the ref of a label whose sized control is parked off-screen', () => {
        const result = collect('<label for="c" style="cursor:pointer">Remember me</label><input id="c" type="checkbox" style="position:absolute;left:-10000px;width:20px;height:20px">')
        expect(result.refs.some((r) => r.name === 'Remember me' && r.role === 'generic')).toBe(true)
    })
})

describe('code blocks', () => {
    it.each([
        ['role', '<pre role="button">npm install</pre>'],
        ['tabindex', '<pre tabindex="0">npm install</pre>']
    ])('keeps the ref of an interactive pre (%s)', (_, html) => {
        const result = collect(html)
        expect(result.refs).toHaveLength(1)
        expect(result.refs[0].id).toBe(nodes(result.tree).find((n) => n.ref)?.ref)
    })

    it('still collapses a plain pre to a code leaf', () => {
        expect(byRole(collect('<pre><span>npm</span> <span>install</span></pre>'), 'code').map((n) => n.name)).toEqual(['npm install'])
    })
})

describe('context text collisions', () => {
    it('hint keeps text that shares a substring with the typed value', () => {
        const result = collect('<div>Invoice #123 <input value="123"></div>')
        expect(byRole(result, 'textbox')[0].hint).toBe('input in "Invoice #123"')
    })

    it('intent keeps text that contains the control name', () => {
        const result = collect('<div>Gold plan <button>Go</button></div><div>Gold plan B <button>Go</button></div>')
        expect(byRole(result, 'button').map((b) => b.intent)).toEqual(['Gold plan', 'Gold plan B'])
    })
})

describe('hint of an unnamed select', () => {
    it('uses the name attribute and leaves the option texts out of the context', () => {
        const result = collect('<div class="form-inline">Card Type <select name="cardType"><option>Visa</option><option>American Express</option></select></div>')
        expect(byRole(result, 'combobox')[0].hint).toBe('cardType in "Card Type"')
    })
})
