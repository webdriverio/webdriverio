import assert from 'node:assert/strict'

describe('Element.children direct traversal', () => {
    beforeEach(async () => {
        await browser.url('data:text/html;charset=utf-8,' + encodeURIComponent('<div id="light">text<!--comment--><section id="first"><b id="grandchild"></b></section><p id="second"></p></div><div id="host"><i id="light-child"></i></div><div id="closed"><i id="closed-light"></i></div><div id="empty"></div>'))
        await browser.execute(() => {
            document.querySelector('#host')!.attachShadow({ mode: 'open' }).innerHTML = 'text<!--comment--><section id="shadow-first"><b id="shadow-grandchild"></b></section><p id="shadow-second"></p>'
            document.querySelector('#closed')!.attachShadow({ mode: 'closed' }).innerHTML = '<i id="closed-child"></i>'
        })
    })

    it('returns direct light children in DOM order, excluding text and grandchildren', async () => {
        assert.deepEqual(await $('#light').children().map(el => el.getAttribute('id')), ['first', 'second'])
    })

    it('defaults to light DOM on a shadow host', async () => {
        assert.deepEqual(await $('#host').children().map(el => el.getAttribute('id')), ['light-child'])
        assert.deepEqual(await $('#host').children({ withinShadowRoot: false }).map(el => el.getAttribute('id')), ['light-child'])
    })

    it('selects only direct open-shadow children when requested', async () => {
        assert.deepEqual(await $('#host').children({ withinShadowRoot: true }).map(el => el.getAttribute('id')), ['shadow-first', 'shadow-second'])
    })

    it('returns an empty list for no accessible open shadow root or no children', async () => {
        assert.equal(await $('#empty').children().length, 0)
        assert.equal(await $('#light').children({ withinShadowRoot: true }).length, 0)
        assert.equal(await $('#closed').children({ withinShadowRoot: true }).length, 0)
        assert.deepEqual(await $('#closed').children().map(el => el.getAttribute('id')), ['closed-light'])
    })

    it('returns an actual ElementArray with parent and selector metadata', async () => {
        const parent = await $('#light')
        const list = parent.children()
        assert.equal(Array.isArray(list), true)
        const resolved = await list
        assert.equal(typeof resolved.selector, 'function')
        assert.equal((resolved.parent as WebdriverIO.Element).elementId, parent.elementId)
        assert.equal((resolved[0].parent as WebdriverIO.Element).elementId, parent.elementId)
    })

    it('supports unresolved-parent indexing, nested children and async iteration', async () => {
        assert.equal(await $('#light').children()[0].getAttribute('id'), 'first')
        assert.equal(await $('#light').children()[0].children()[0].getAttribute('id'), 'grandchild')
        const ids: (string | null)[] = []
        for await (const child of $('#host').children({ withinShadowRoot: true })) {
            ids.push(await child.getAttribute('id'))
        }
        assert.deepEqual(ids, ['shadow-first', 'shadow-second'])
    })

    it('refetches an index that appears and handles a terminal missing index', async () => {
        const children = $('#light').children()
        assert.equal(await children.length, 2)
        await browser.execute(() => {
            setTimeout(() => {
                const late = document.createElement('p')
                late.id = 'late'
                document.querySelector('#light')!.append(late)
            }, 100)
        })
        assert.equal(await children[2].getAttribute('id'), 'late')
        assert.equal(await $('#host').children({ withinShadowRoot: true })[9].isExisting(), false)
        assert.equal(await $('#light').children()[9].isExisting(), false)
    })
})
