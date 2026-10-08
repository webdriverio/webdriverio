import { describe, it, expect } from 'vitest'

import { compactTree, countRefs, formatLine, formatSnapshot, onlyInteractive, type SnapshotNode } from '../src/format.js'

const tree: SnapshotNode = {
    role: 'document',
    name: 'Shop',
    url: 'http://localhost/cart.html',
    children: [{
        role: 'banner',
        children: [{
            role: 'navigation',
            name: 'Main',
            children: [{ role: 'link', name: 'Home', ref: 'e1', interactive: true }]
        }]
    }, {
        role: 'main',
        children: [
            { role: 'heading', name: 'Products', states: ['level=1'] },
            { role: 'list', children: [{ role: 'listitem', children: [{ role: 'text', name: 'Blue' }, { role: 'button', name: 'Add', ref: 'e2', interactive: true }] }] },
            { role: 'textbox', name: 'Email', ref: 'e3', value: 'a@b.c', states: ['required'], interactive: true, box: [1, 2, 3, 4] },
            { role: 'status', hidden: true }
        ]
    }, {
        role: 'contentinfo',
        children: [{ role: 'text', name: 'Footer' }]
    }]
}

describe('formatLine', () => {
    it('renders role, name, ref, value, states, hidden and url in order', () => {
        expect(formatLine({ role: 'textbox', name: 'Say "hi"', ref: 'e1', value: 'x', states: ['required', 'disabled'], hidden: true }))
            .toBe('- textbox "Say \\"hi\\"" [ref=e1] value="x" [required] [disabled] [hidden]')
        expect(formatLine({ role: 'document', name: 'T', url: 'http://x' })).toBe('- document "T" url=http://x')
    })

    it('prints boxes only when asked', () => {
        const node = { role: 'button', ref: 'e1', box: [1, 2, 30, 40] }
        expect(formatLine(node)).toBe('- button [ref=e1]')
        expect(formatLine(node, { boxes: true })).toBe('- button [ref=e1] [box=1,2,30,40]')
    })

    it('points to the frame command for cross-origin iframes', () => {
        const frameHint = (ref: string) => `wdio session frame ${ref}`
        expect(formatLine({ role: 'iframe', name: 'Ads', ref: 'e9', note: 'cross-origin' }, { frameHint }))
            .toBe('- iframe "Ads" [ref=e9] (cross-origin: run `wdio session frame e9`)')
        expect(formatLine({ role: 'iframe', note: 'cross-origin' }, { frameHint })).toBe('- iframe (cross-origin)')
    })

    it('prints neutral frame notes without a frame hint', () => {
        expect(formatLine({ role: 'iframe', name: 'Ads', ref: 'e9', note: 'cross-origin' })).toBe('- iframe "Ads" [ref=e9] (cross-origin)')
        expect(formatLine({ role: 'iframe', ref: 'e9', note: 'cut' })).toBe('- iframe [ref=e9] (frame cut short)')
    })

    it('marks truncated subtrees', () => {
        expect(formatLine({ role: 'list' }, {}, 7)).toBe('- list [+7]')
    })
})

describe('formatSnapshot', () => {
    it('indents two spaces per level', () => {
        expect(formatSnapshot(tree)).toBe([
            '- document "Shop" url=http://localhost/cart.html',
            '  - banner',
            '    - navigation "Main"',
            '      - link "Home" [ref=e1]',
            '  - main',
            '    - heading "Products" [level=1]',
            '    - list',
            '      - listitem',
            '        - text "Blue"',
            '        - button "Add" [ref=e2]',
            '    - textbox "Email" [ref=e3] value="a@b.c" [required]',
            '    - status [hidden]',
            '  - contentinfo',
            '    - text "Footer"'
        ].join('\n'))
    })

    it('cuts at --depth and counts the hidden descendants', () => {
        expect(formatSnapshot(tree, { depth: 1 })).toBe([
            '- document "Shop" url=http://localhost/cart.html',
            '  - banner [+2]',
            '  - main [+7]',
            '  - contentinfo [+1]'
        ].join('\n'))
    })

    it('keeps interactive nodes, the landmarks around them and the headings that introduce them with --interactive', () => {
        expect(formatSnapshot(tree, { interactive: true, boxes: true })).toBe([
            '- document "Shop" url=http://localhost/cart.html',
            '  - banner',
            '    - navigation "Main"',
            '      - link "Home" [ref=e1]',
            '  - main',
            '    - heading "Products" [level=1]',
            '    - button "Add" [ref=e2]',
            '    - textbox "Email" [ref=e3] value="a@b.c" [required] [box=1,2,3,4]'
        ].join('\n'))
    })
})

describe('compactTree', () => {
    it('drops unnamed nodes that have nothing left and keeps wrappers that still do', () => {
        const compact = compactTree(tree)
        expect(formatSnapshot(compact!)).toBe([
            '- document "Shop" url=http://localhost/cart.html',
            '  - banner',
            '    - navigation "Main"',
            '      - link "Home" [ref=e1]',
            '  - main',
            '    - heading "Products" [level=1]',
            '    - list',
            '      - listitem',
            '        - text "Blue"',
            '        - button "Add" [ref=e2]',
            '    - textbox "Email" [ref=e3] value="a@b.c" [required]',
            '  - contentinfo',
            '    - text "Footer"'
        ].join('\n'))
        expect(formatSnapshot(tree, { compact: true })).toBe(formatSnapshot(compact!))
    })

    it('drops a wrapper once its only child is empty', () => {
        expect(compactTree({
            role: 'generic',
            children: [{ role: 'status' }]
        })).toBeUndefined()
    })
})

describe('onlyInteractive', () => {
    it('drops landmarks without interactive content unless they have a ref', () => {
        expect(onlyInteractive({ role: 'document', children: [{ role: 'region', children: [] }, { role: 'region', ref: 'e1' }] }))
            .toEqual([{ role: 'document', children: [{ role: 'region', ref: 'e1', children: [] }] }])
    })
})

describe('countRefs', () => {
    it('counts ref markers', () => {
        expect(countRefs(formatSnapshot(tree))).toBe(3)
        expect(countRefs('- text "[ref=x]"')).toBe(0)
    })
})

describe('selectors', () => {
    const node = { role: 'button', name: 'Add', ref: 'e2', selector: 'role/button[name="Add"]' }

    it('ends a ref line with the selector, only when asked', () => {
        expect(formatLine(node)).toBe('- button "Add" [ref=e2]')
        expect(formatLine(node, { selectors: true })).toBe('- button "Add" [ref=e2]  → role/button[name="Add"]')
    })

    it('marks a selector that is only a guess, after url', () => {
        expect(formatLine({ role: 'link', ref: 'e1', url: 'http://x', selector: 'nav > a', selectorPositional: true }, { selectors: true }))
            .toBe('- link [ref=e1] url=http://x  → nav > a (positional)')
    })

    it('leaves nodes without a ref alone', () => {
        expect(formatLine({ role: 'heading', name: 'Hi', selector: 'h1' }, { selectors: true })).toBe('- heading "Hi"')
    })
})

describe('onlyInteractive headings', () => {
    const heading = (name: string, level: number): SnapshotNode => ({ role: 'heading', name, states: [`level=${level}`] })
    const link = (name: string, ref: string): SnapshotNode => ({ role: 'link', name, ref, interactive: true })
    const render = (...children: SnapshotNode[]) => formatSnapshot({ role: 'document', children: [{ role: 'main', children }] }, { interactive: true })

    it('keeps a heading before a link as a leaf line', () => {
        expect(render(heading('Docs', 2), link('Read', 'e1'))).toBe([
            '- document',
            '  - main',
            '    - heading "Docs" [level=2]',
            '    - link "Read" [ref=e1]'
        ].join('\n'))
    })

    it('drops a heading whose section has no interactive node', () => {
        expect(render(heading('Empty', 2), { role: 'text', name: 'prose' }, heading('Docs', 2), link('Read', 'e1'))).toBe([
            '- document',
            '  - main',
            '    - heading "Docs" [level=2]',
            '    - link "Read" [ref=e1]'
        ].join('\n'))
        expect(formatSnapshot({ role: 'document', children: [{ role: 'main', children: [heading('Nothing', 1)] }] }, { interactive: true })).toBe('- document')
    })

    it('ends a section at the next heading of the same or a higher rank', () => {
        expect(render(heading('A', 2), heading('A1', 3), heading('A2', 3), link('x', 'e1'), heading('B', 2), heading('B1', 3))).toBe([
            '- document',
            '  - main',
            '    - heading "A" [level=2]',
            '    - heading "A2" [level=3]',
            '    - link "x" [ref=e1]'
        ].join('\n'))
    })

    it('finds headings inside wrappers that are not kept', () => {
        expect(render({ role: 'generic', children: [heading('Docs', 2), { role: 'generic', children: [link('Read', 'e1')] }] })).toContain('- heading "Docs" [level=2]\n    - link "Read"')
    })

    it('tells two links of the same name apart by their headings', () => {
        const text = render(heading('Start', 2), link('Read the guide', 'e1'), heading('Extend', 2), link('Read the guide', 'e2'))
        expect(text.split('\n').slice(2)).toEqual([
            '    - heading "Start" [level=2]',
            '    - link "Read the guide" [ref=e1]',
            '    - heading "Extend" [level=2]',
            '    - link "Read the guide" [ref=e2]'
        ])
    })

    it('ranks a heading without a level as 2, like ARIA', () => {
        const unleveled: SnapshotNode = { role: 'heading', name: 'Plain' }
        expect(render(heading('Section', 3), unleveled, link('Read', 'e1'))).not.toContain('Section')
        expect(render(heading('Section', 1), unleveled, link('Read', 'e1'))).toContain('heading "Section"')
    })

    it('does not repeat a heading whose only interactive content is its own link', () => {
        const titled: SnapshotNode = { role: 'heading', name: 'Title', states: ['level=2'], children: [link('Title', 'e1')] }
        expect(render(titled, link('More', 'e2'))).toBe([
            '- document',
            '  - main',
            '    - link "Title" [ref=e1]',
            '    - link "More" [ref=e2]'
        ].join('\n'))
    })

    it('keeps a heading whose link names something else', () => {
        const titled: SnapshotNode = { role: 'heading', name: 'Title and more', states: ['level=2'], children: [link('Title', 'e1')] }
        expect(render(titled)).toContain('heading "Title and more"')
    })
})

