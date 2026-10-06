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
