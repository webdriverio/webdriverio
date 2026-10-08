import { beforeAll, describe, expect, it } from 'vitest'

/**
 * from the source: the `@wdio/utils` entry point needs Node.js
 */
import { knownRoles, roleTable } from '../../../wdio-utils/src/roles.js'
import { collectInPage, type CollectOptions } from '../../../wdio-snapshot/src/web.js'
import { formatSnapshot } from '../../../wdio-snapshot/src/format.js'
import { pageRecorder } from '../../src/snapshot/recorder.js'

/**
 * The recorder runs before the page's own scripts in a session (an init
 * script). Here it is installed before the test builds its DOM.
 */
beforeAll(() => {
    new Function(`return (${pageRecorder.toString()})`)()()
})

function snapshotOf (build: () => void, interactive = true) {
    document.body.innerHTML = ''
    build()
    const collect = new Function(`return (${collectInPage.toString()})`)() as typeof collectInPage
    const opts: CollectOptions = { roles: roleTable(), knownRoles: knownRoles(), counter: 0, all: false, boxes: false, assignRefs: true }
    return formatSnapshot(collect(opts).tree, { interactive })
}

describe('page recorder', () => {
    it('lets the snapshot see into closed shadow roots', () => {
        const text = snapshotOf(() => {
            const host = document.createElement('div')
            document.body.append(host)
            host.attachShadow({ mode: 'closed' }).innerHTML = '<label>Coupon <input></label><button>Apply</button>'
        })
        expect(text).toContain('textbox "Coupon" [ref=')
        expect(text).toContain('button "Apply" [ref=')
    })

    it('marks elements with click listeners as clickable and describes them', () => {
        const text = snapshotOf(() => {
            document.body.innerHTML = '<ul><li><span>Invoice #1</span><span class="icons"><span class="icon">✎</span><span class="icon">🗑</span></span></li></ul>'
            for (const icon of document.querySelectorAll('.icon')) {
                icon.addEventListener('click', () => {})
            }
        })
        expect(text).toMatch(/generic \[ref=e\d+\] \(icon 1 of 2 in "Invoice #1✎🗑"\)/)
        expect(text).toMatch(/generic \[ref=e\d+\] \(icon 2 of 2 in "Invoice #1✎🗑"\)/)
    })

    it('does not mark an element that delegates clicks for its children', () => {
        const text = snapshotOf(() => {
            document.body.innerHTML = '<ul id="list"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul>'
            document.getElementById('list')!.addEventListener('click', () => {})
        })
        expect(text.match(/\[ref=/g)).toHaveLength(2)
    })
})
