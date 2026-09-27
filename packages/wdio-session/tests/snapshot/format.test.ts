import { describe, it, expect } from 'vitest'

import { countRefs, formatLine, formatSnapshot, onlyInteractive, type SnapshotNode } from '../../src/snapshot/format.js'

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
        expect(formatLine({ role: 'iframe', name: 'Ads', ref: 'e9', note: 'cross-origin' }))
            .toBe('- iframe "Ads" [ref=e9] (cross-origin: run `wdio session frame e9`)')
        expect(formatLine({ role: 'iframe', note: 'cross-origin' })).toBe('- iframe (cross-origin)')
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

    it('keeps interactive nodes and the landmarks around them with --interactive', () => {
        expect(formatSnapshot(tree, { interactive: true, boxes: true })).toBe([
            '- document "Shop" url=http://localhost/cart.html',
            '  - banner',
            '    - navigation "Main"',
            '      - link "Home" [ref=e1]',
            '  - main',
            '    - button "Add" [ref=e2]',
            '    - textbox "Email" [ref=e3] value="a@b.c" [required] [box=1,2,3,4]'
        ].join('\n'))
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
