import url from 'node:url'
import path from 'node:path'
import { browser, $, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('shadow root scope resolution (regression repro)', () => {
    before(async () => {
        const resource = path.resolve(__dirname, '__fixtures__', 'shadowRootScope.html')
        await browser.url(url.pathToFileURL(resource).href)
    })

    /**
     * collect the `startNodes` of every `browsingContext.locateNodes` command
     * issued while `fn` runs. The original bug is a *scope resolution* leak:
     * unrelated shadow roots were sent as startNodes for scoped lookups. Its
     * user-visible failure (lookups timing out) additionally requires those
     * leaked references to be stale (e.g. after SPA navigation), which can't be
     * reproduced deterministically — so we assert on the protocol payload
     * itself, where the leak is always observable.
     */
    async function collectLocateStartNodes (fn: () => Promise<unknown>): Promise<{ sharedId?: string }[][]> {
        const startNodes: { sharedId?: string }[][] = []
        const listener = (command: { method: string, params: Record<string, unknown> }) => {
            if (command.method === 'browsingContext.locateNodes' && Array.isArray(command.params.startNodes)) {
                startNodes.push(command.params.startNodes as { sharedId?: string }[])
            }
        }
        browser.on('bidiCommand', listener as never)
        try {
            await fn()
        } finally {
            browser.off('bidiCommand', listener as never)
        }
        return startNodes
    }

    it('does not leak an unrelated closed shadow root into an unrelated lookup (original reported bug)', async () => {
        // '#target' is a plain element with no shadow-related descendants at all
        // and is unrelated to the page's closed shadow roots (the declarative one
        // in <head> and '#unrelated-holder's closed-holder).
        const target = await $('#target')
        await expect(target.$('[data-testid="ift"]')).toHaveText('target element')

        const startNodes = await collectLocateStartNodes(
            () => target.$('[data-testid="ift"]').getText()
        )
        expect(startNodes.length).toBeGreaterThan(0)
        for (const nodes of startNodes) {
            // the scope has no shadow descendants: its own element id must be the
            // ONLY start node — before the fix this was a list of every shadow
            // root registered anywhere on the page (and not the scope itself)
            expect(nodes.map((node) => node.sharedId)).toEqual([target.elementId])
        }
    })

    it('does not find an element outside of the queried scope', async () => {
        // '[data-testid="ift"]' lives under '#target' — a lookup scoped to the
        // unrelated '#unrelated-holder' must not surface it, no matter which
        // startNodes the shadow root manager resolved for that scope
        await expect($('#unrelated-holder').$('[data-testid="ift"]')).not.toExist()
    })

    it('sends the wrapper element itself alongside its nested shadow root as startNodes', async () => {
        const wrapper = await $('#wrapper')
        await expect(wrapper.$('.inside-shadow')).toExist()

        const startNodes = await collectLocateStartNodes(
            () => wrapper.$('.inside-shadow').getText()
        )
        expect(startNodes.length).toBeGreaterThan(0)
        for (const nodes of startNodes) {
            const ids = nodes.map((node) => node.sharedId)
            // the wrapper's own element id must be included (so plain light-DOM
            // descendants stay searchable) plus exactly the one shadow root
            // genuinely contained under it — not the page's other shadow roots
            expect(ids).toContain(wrapper.elementId)
            expect(ids).toHaveLength(2)
        }
    })

    it('pierces into a shadow host nested under a plain (non-host) wrapper div', async () => {
        const insideShadow = await $('#wrapper').$('.inside-shadow')
        await expect(insideShadow).toExist()
        await expect(insideShadow).toHaveText('inside shadow text')
    })

    it('still finds a plain light-DOM sibling of a nested shadow host under the same wrapper', async () => {
        const plainSibling = await $('#wrapper').$('.plain-sibling')
        await expect(plainSibling).toExist()
        await expect(plainSibling).toHaveText('plain sibling text')
    })

    it('getHTML({ pierceShadowRoot: true }) on the plain wrapper includes the nested shadow root content', async () => {
        const html = await $('#wrapper').getHTML({ pierceShadowRoot: true })
        expect(html).toContain('inside shadow text')
        expect(html).toContain('shadowrootmode')
    })
})
