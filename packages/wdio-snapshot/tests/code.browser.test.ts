import { describe, expect, it } from 'vitest'

/**
 * from the source: the `@wdio/utils` entry point needs Node.js
 */
import { knownRoles, roleTable } from '../../wdio-utils/src/roles.js'
import { collectInPage, type CollectOptions, type CollectResult } from '../src/web.js'
import type { SnapshotNode } from '../src/format.js'

function collectHtml (html: string): CollectResult {
    document.body.innerHTML = html
    const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    const opts: CollectOptions = { roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true }
    return collect(opts)
}

function flatten (node: SnapshotNode): SnapshotNode[] {
    return [node, ...(node.children || []).flatMap(flatten)]
}

describe('snapshot code blocks', () => {
    it('collapses a highlighted pre into one code node', () => {
        const { tree } = collectHtml('<pre><code><span>import</span> <span>{</span>\n<span>$</span><span>,</span> <span>expect</span> <span>}</span></code></pre>')
        const nodes = flatten(tree).filter((n) => n.role === 'code' || n.role === 'text')
        expect(nodes).toEqual([{ role: 'code', name: 'import { $, expect }' }])
    })

    it('keeps a link inside a pre with its ref', () => {
        const { tree, refs } = collectHtml('<pre><code>see <a href="/docs">the docs</a> now</code></pre>')
        expect(flatten(tree).some((n) => n.role === 'link' && n.name === 'the docs' && n.ref)).toBe(true)
        expect(refs.some((r) => r.role === 'link' && r.name === 'the docs')).toBe(true)
    })

    it('leaves inline code outside a pre unchanged', () => {
        const { tree } = collectHtml('<p>run <code>npm init</code> now</p>')
        expect(flatten(tree).filter((n) => n.role === 'code')).toEqual([{ role: 'code', name: 'npm init' }])
    })

    it('does not truncate a long block', () => {
        const words = Array.from({ length: 80 }, (_, i) => `token${i}`)
        const { tree } = collectHtml(`<pre><code>${words.map((w) => `<span>${w}</span>`).join(' ')}</code></pre>`)
        const [code] = flatten(tree).filter((n) => n.role === 'code')
        expect(code.name).toBe(words.join(' '))
        expect(code.name!.length).toBeGreaterThan(80)
    })
})
