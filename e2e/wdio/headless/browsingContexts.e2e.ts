import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * A tab, a window, and a frame are a `WebdriverIO.BrowsingContext` you hold
 * (https://github.com/webdriverio/webdriverio/pull/15833). These tests drive
 * several of them at once and check that every command lands in the context
 * it was called on, and only there.
 *
 * Pages are served from 127.0.0.1. `/outer` also embeds a frame from
 * `localhost`, a different origin, which Chromium runs out of process.
 */
describe('browsing contexts', () => {
    let origin: string
    let crossOrigin: string
    /**
     * Each worker writes screenshots to its own directory and removes it, so
     * parallel browsers can't overwrite each other's files.
     */
    let screenshots: string

    const page = (title: string, body = '') => (
        `<!doctype html><title>${title}</title><h1 id="where">${title}</h1>${body}`
    )
    const input = '<input id="input">'
    const widgets = [
        '<input id="check" type="checkbox" checked>',
        '<input id="readonly" value="keep" readonly>',
        '<button id="disabled" disabled>off</button>',
        '<select id="select"><option value="one">one</option><option value="two">two</option></select>',
        '<div id="box" style="width:120px;height:30px;color:rgb(255, 0, 0)">box</div>',
        '<div id="double" ondblclick="this.textContent = \'double clicked\'">double</div>',
        '<div id="hover" onmouseover="this.textContent = \'hovered\'">hover me</div>',
        '<div id="drag" onmousedown="window.dragged = true" style="display:inline-block;width:60px;height:20px">drag</div>',
        '<div id="drop" onmouseup="if (window.dragged) this.textContent = \'dropped\'" style="display:inline-block;width:60px;height:20px;margin-left:20px">drop</div>',
        '<ul id="list"><li class="item">one</li><li class="item">two</li><li class="item">three</li></ul>',
        '<a id="link" href="#done">Done link</a>',
        '<input id="file" type="file">',
        '<div id="host"></div><script>document.getElementById("host").attachShadow({ mode: "open" }).innerHTML = \'<span class="inside">shadow text</span>\'</script>',
        '<div id="far" style="margin-top:1500px">far</div>'
    ].join('')
    const pages: Record<string, () => string> = {
        '/tab-a': () => page('Tab A', `${input}<p id="result"></p><a id="next" href="/tab-a-2">next</a>`),
        '/tab-a-2': () => page('Tab A 2'),
        '/tab-b': () => page('Tab B', `${input}<p id="result"></p>${widgets}`),
        '/tab-b-2': () => page('Tab B 2'),
        '/outer': () => page('Outer', `${input}<iframe id="middle" src="/middle" style="width:560px;height:800px"></iframe><iframe id="cross" src="${crossOrigin}/cross" style="width:560px;height:800px"></iframe>`),
        '/middle': () => page('Middle', `${input}<p id="result"></p><iframe id="inner" src="/inner" style="width:500px;height:600px"></iframe>`),
        '/inner': () => page('Inner', `${input}${widgets}`),
        /**
         * The nested frame sits below the visible area of its parent frame,
         * so it has to be scrolled into view before it can be clicked.
         */
        '/clipped-outer': () => page('Clipped outer', `${input}<iframe id="middle" src="/clipped-middle"></iframe>`),
        '/clipped-middle': () => page('Clipped middle', '<div style="height:400px"></div><iframe id="inner" src="/inner"></iframe>'),
        '/inner-2': () => page('Inner 2'),
        /**
         * Cases where reading the DOM naively differs from what the drivers
         * report, to compare a held context with classic WebDriver.
         */
        '/parity': () => page('Parity', [
            '<div id="text">  Hello <b>bold</b>\n   world<span style="display:none">hidden</span><br>next line  </div>',
            '<p id="upper" style="text-transform:uppercase;color:rgb(0, 128, 0)">shout</p>',
            '<input id="required" required><input id="plain" value="x"><input id="unchecked" type="checkbox">',
            '<select id="grouped"><optgroup label="g" disabled><option id="grouped-option">a</option></optgroup><option id="free">b</option></select>',
            '<a id="hidden-link" href="#">Visible <span style="display:none">secret </span>link</a>',
            '<input id="events" value="abc" oninput="this.dataset.input = (Number(this.dataset.input) || 0) + 1" onchange="this.dataset.change = (Number(this.dataset.change) || 0) + 1">',
            '<div style="position:relative"><button id="covered">covered</button><div style="position:absolute;inset:0;background:white"></div></div>',
            '<select id="multi" multiple onchange="this.dataset.changes = (Number(this.dataset.changes) || 0) + 1"><option id="multi-option" selected>one</option><option>two</option></select>'
        ].join('')),
        '/cross': () => page('Cross origin', `${input}${widgets}`),
        /**
         * `/plain` is the only `<iframe>` element on this page. The frame
         * nested inside it has `iframe` in its url.
         */
        '/selector-trap': () => page('Selector trap', '<iframe id="first" src="/plain"></iframe>'),
        '/plain': () => page('Plain', '<iframe src="/iframe-nested"></iframe>'),
        /**
         * `results` matches a non-frame element and, as a url substring, the frame
         */
        '/results-trap': () => page('Results trap', '<results>not a frame</results><iframe src="/results.html"></iframe>'),
        '/results.html': () => page('Results'),
        '/iframe-nested': () => page('Nested by url'),
        '/fetch': () => page('Fetch', `<p id="result"></p><script>
            const endpoint = new URLSearchParams(location.search).get('endpoint')
            fetch('/api/' + endpoint).then((r) => r.text()).then((t) => { document.getElementById('result').textContent = t })
        </script>`),
        '/api/scoped': () => 'real',
        '/api/restored': () => 'real',
        '/api/closed': () => 'real'
    }

    const server = createServer((request, response) => {
        const route = pages[new URL(request.url || '/', origin).pathname] as (() => string) | undefined
        response.setHeader('Content-Type', request.url?.startsWith('/api/') ? 'text/plain' : 'text/html; charset=utf-8')
        response.statusCode = route ? 200 : 404
        response.end(route ? route() : '')
    })

    /**
     * `browser.url()` always returns the session's initial top-level context.
     */
    const open = (path: string) => browser.url(`${origin}${path}`)

    const openTab = async (path: string) => {
        const context = await browser.newWindow(`${origin}${path}`, { type: 'tab' })
        if (!('contextId' in context)) {
            throw new Error('expected newWindow() to return a browsing context')
        }
        return context
    }

    const where = (context: WebdriverIO.BrowsingContext) => context.$('#where').getText()
    const valueOf = (context: WebdriverIO.BrowsingContext) => context.execute(() => (document.getElementById('input') as HTMLInputElement).value)
    /**
     * A marker on `window` that only a reload clears. Firefox restores form
     * values on reload, so input values can't show that a reload happened.
     */
    const mark = (context: WebdriverIO.BrowsingContext, value: string) => context.execute((v) => {
        (window as unknown as { marker: string }).marker = v
    }, value)
    const markOf = (context: WebdriverIO.BrowsingContext) => context.execute(() => (window as unknown as { marker?: string }).marker ?? null)
    const rejection = async (promise: Promise<unknown>) => {
        const error = await promise.then(() => undefined, (err: Error) => err)
        if (!error) {
            throw new Error('expected the command to reject')
        }
        return error.message
    }

    /**
     * The outer page, its same-origin frame, the frame nested in that one,
     * and the cross-origin frame.
     */
    const openFrames = async () => {
        const outer = await open('/outer')
        const middle = await outer.frame(outer.$('#middle'))
        const inner = await middle.frame(middle.$('#inner'))
        const cross = await outer.frame(outer.$('#cross'))
        return { outer, middle, inner, cross }
    }

    before(async function () {
        if (!browser.isBidi) {
            // A held browsing context is a WebDriver BiDi feature
            this.skip()
        }
        screenshots = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-browsing-contexts-'))
        server.listen(0, '127.0.0.1')
        await once(server, 'listening')
        const { port } = server.address() as AddressInfo
        origin = `http://127.0.0.1:${port}`
        crossOrigin = `http://localhost:${port}`
    })

    afterEach(async () => {
        if (!browser.isBidi) {
            return
        }
        for (const context of await browser.browsingContexts()) {
            await context.dismissAlert().catch(() => {})
        }
        const initial = await open('/tab-a')
        for (const context of await browser.browsingContexts()) {
            if (context.contextId !== initial.contextId) {
                await context.closeWindow().catch(() => {})
            }
        }
    })

    after(async () => {
        if (screenshots) {
            await fs.rm(screenshots, { recursive: true, force: true })
        }
        if (!server.listening) {
            return
        }
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    describe('tabs and windows', () => {
        it('returns a browsing context for every url, also about: and data: urls', async () => {
            const blank = await browser.url('about:blank')
            expect(blank.contextId).toEqual(expect.any(String))
            const data = await browser.url('data:text/html,<title>Data</title><h1 id="where">Data</h1>')
            expect(data.contextId).toBe(blank.contextId)
            expect(await where(data)).toBe('Data')
        })

        it('keeps browser.url() on the initial context after a new tab opens', async () => {
            const first = await open('/tab-a')
            const tab = await openTab('/tab-b')

            const again = await open('/tab-a-2')
            expect(again.contextId).toBe(first.contextId)
            expect(again.contextId).not.toBe(tab.contextId)
            expect(await where(again)).toBe('Tab A 2')
            expect(await where(tab)).toBe('Tab B')
        })

        it('runs commands on two tabs at the same time', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            const [titleA, titleB, whereA, whereB] = await Promise.all([
                a.getTitle(),
                b.getTitle(),
                where(a),
                where(b)
            ])
            expect([titleA, titleB, whereA, whereB]).toEqual(['Tab A', 'Tab B', 'Tab A', 'Tab B'])

            await Promise.all([
                a.$('#input').setValue('typed in A'),
                b.$('#input').setValue('typed in B')
            ])
            expect(await valueOf(a)).toBe('typed in A')
            expect(await valueOf(b)).toBe('typed in B')
        })

        it('navigates one tab without touching the other', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            const returned = await b.navigate(`${origin}/tab-b-2`)
            expect(returned.contextId).toBe(b.contextId)
            expect(b.url).toBe(`${origin}/tab-b-2`)
            expect(await b.getUrl()).toBe(`${origin}/tab-b-2`)
            expect(await where(b)).toBe('Tab B 2')

            expect(await a.getUrl()).toBe(`${origin}/tab-a`)
            expect(await where(a)).toBe('Tab A')
        })

        it('goes back and forward in one tab only', async () => {
            const a = await open('/tab-a')
            await a.navigate(`${origin}/tab-a-2`)
            const b = await openTab('/tab-b')
            await b.navigate(`${origin}/tab-b-2`)

            await b.back()
            expect(await where(b)).toBe('Tab B')
            expect(await where(a)).toBe('Tab A 2')

            await b.forward()
            expect(await where(b)).toBe('Tab B 2')

            await a.back()
            expect(await where(a)).toBe('Tab A')
            expect(await where(b)).toBe('Tab B 2')
        })

        it('reloads one tab and keeps the state of the other', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            await mark(a, 'keep me')
            await mark(b, 'reset me')

            await b.refresh()
            expect(await markOf(b)).toBeNull()
            expect(await markOf(a)).toBe('keep me')
        })

        it('types into a background tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.$('#input').click()
            await b.keys('abc')
            expect(await valueOf(b)).toBe('abc')
            expect(await valueOf(a)).toBe('')
        })

        it('activates a tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.activate()
            await browser.waitUntil(async () => await b.execute(() => document.visibilityState) === 'visible')

            await a.activate()
            await browser.waitUntil(async () => await a.execute(() => document.visibilityState) === 'visible')
        })

        it('lists only top-level contexts, not frames', async () => {
            const { outer, middle } = await openFrames()
            const tab = await openTab('/tab-b')

            const ids = (await browser.browsingContexts()).map((context) => context.contextId)
            expect(ids).toContain(outer.contextId)
            expect(ids).toContain(tab.contextId)
            expect(ids).not.toContain(middle.contextId)
            for (const context of await browser.browsingContexts()) {
                expect(context.isFrame).toBe(false)
                expect(context.parent).toBeUndefined()
            }
        })

        it('opens a window next to a reference context', async () => {
            const a = await open('/tab-a')
            const window = await browser.newWindow(`${origin}/tab-b`, { type: 'window', referenceContext: a })
            if (!('contextId' in window)) {
                throw new Error('expected newWindow() to return a browsing context')
            }

            expect(await where(window)).toBe('Tab B')
            const ids = (await browser.browsingContexts()).map((context) => context.contextId)
            expect(ids).toContain(window.contextId)
            expect(await where(a)).toBe('Tab A')
        })

        it('closes one tab, and commands on it reject afterwards', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.closeWindow()
            const ids = (await browser.browsingContexts()).map((context) => context.contextId)
            expect(ids).not.toContain(b.contextId)
            expect(await rejection(b.getTitle())).toMatch(/no such frame|no such window|not found|discarded/i)
            expect(await where(a)).toBe('Tab A')
        })

        it('rejects commands on a frame of a closed tab', async () => {
            await open('/tab-a')
            const tab = await browser.newWindow(`${origin}/outer`, { type: 'tab' })
            if (!('contextId' in tab)) {
                throw new Error('expected newWindow() to return a browsing context')
            }
            const middle = await tab.frame(tab.$('#middle'))
            await tab.closeWindow()
            expect(await rejection(middle.getTitle())).toMatch(/no such frame|no such window|not found|discarded/i)
        })

        it('sets the viewport of one tab only', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            const widthOfA = await a.execute(() => window.innerWidth)

            await b.setViewport({ width: 420, height: 600 })
            expect(await b.execute(() => window.innerWidth)).toBe(420)
            expect(await a.execute(() => window.innerWidth)).toBe(widthOfA)
        })

        it('scopes an init script to the tab it was added to', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.addInitScript(() => {
                (window as unknown as { marker: string }).marker = 'init script'
            })
            await a.navigate(`${origin}/tab-a-2`)
            await b.navigate(`${origin}/tab-b-2`)

            expect(await b.execute(() => (window as unknown as { marker?: string }).marker)).toBe('init script')
            expect(await a.execute(() => (window as unknown as { marker?: string }).marker)).toBeUndefined()
        })

        it('emulates in the tab it was called on', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            const userAgentOfA = await a.execute(() => navigator.userAgent)

            const restore = await b.emulate('userAgent', 'WebdriverIO-Context-UA')
            try {
                await b.refresh()
                await a.refresh()
                expect(await b.execute(() => navigator.userAgent)).toBe('WebdriverIO-Context-UA')
                expect(await a.execute(() => navigator.userAgent)).toBe(userAgentOfA)
            } finally {
                await restore()
            }
        })

        it('installs the clock in the tab it was called on', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            const now = new Date('2020-01-01T00:00:00Z')

            const clock = await b.emulate('clock', { now })
            try {
                expect(await b.execute(() => Date.now())).toBe(now.getTime())
                expect(await a.execute(() => Date.now())).not.toBe(now.getTime())
                await clock.tick(1000)
                expect(await b.execute(() => Date.now())).toBe(now.getTime() + 1000)
            } finally {
                await clock.restore()
            }
        })

        it('mocks requests of the tab it was called on only', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-a')

            const mock = await b.mock('**/api/scoped')
            mock.respond('mocked', { headers: { 'Content-Type': 'text/plain' }, fetchResponse: false })
            await b.navigate(`${origin}/fetch?endpoint=scoped`)
            await a.navigate(`${origin}/fetch?endpoint=scoped`)
            await expect(b.$('#result')).toHaveText('mocked')
            await expect(a.$('#result')).toHaveText('real')
        })

        it('ends a mock of a tab when that tab closes', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-a')

            const mock = await b.mock('**/api/closed')
            mock.respond('mocked', { headers: { 'Content-Type': 'text/plain' }, fetchResponse: false })
            await b.closeWindow()

            await a.navigate(`${origin}/fetch?endpoint=closed`)
            await expect(a.$('#result')).toHaveText('real')
        })

        it('restores a mock created on a tab that is not the initial one', async () => {
            await open('/tab-a')
            const b = await openTab('/tab-a')

            const mock = await b.mock('**/api/restored')
            mock.respond('mocked', { headers: { 'Content-Type': 'text/plain' }, fetchResponse: false })
            await b.navigate(`${origin}/fetch?endpoint=restored`)
            await expect(b.$('#result')).toHaveText('mocked')

            await mock.restore()
            await b.navigate(`${origin}/fetch?endpoint=restored`)
            await expect(b.$('#result')).toHaveText('real')
        })

        it('shares cookies between tabs of the same origin', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await a.setCookies({ name: 'shared', value: 'by-a' })
            const [cookie] = await b.getCookies({ name: 'shared' })
            expect(cookie?.value).toBe('by-a')

            await b.deleteCookies({ name: 'shared' })
            expect(await a.getCookies({ name: 'shared' })).toEqual([])
        })

        it('takes a screenshot of a background tab', async () => {
            await open('/tab-a')
            /**
             * A page that does not scroll: browsers disagree whether a
             * screenshot includes the scrollbar (Firefox) or not (Chromium).
             */
            const b = await openTab('/tab-b-2')
            await b.setViewport({ width: 500, height: 400 })
            expect(await b.execute(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight)).toBe(true)

            const screenshot = await b.saveScreenshot(path.join(screenshots, 'tab.png'))
            // PNG header: width at byte 16, height at byte 20
            expect(screenshot.readUInt32BE(16)).toBe(500)
            expect(screenshot.readUInt32BE(20)).toBe(400)
        })
    })

    describe('frames', () => {
        it('scopes element lookups to each frame of a nested chain', async () => {
            const { outer, middle, inner } = await openFrames()

            expect(await where(outer)).toBe('Outer')
            expect(await where(middle)).toBe('Middle')
            expect(await where(inner)).toBe('Inner')
            await expect(outer.$('#inner')).not.toExist()
            await expect(middle.$('#middle')).not.toExist()
        })

        it('links each frame to its parent', async () => {
            const { outer, middle, inner, cross } = await openFrames()

            expect(outer.isFrame).toBe(false)
            expect(outer.parent).toBeUndefined()
            expect(middle.isFrame).toBe(true)
            expect(middle.parent?.contextId).toBe(outer.contextId)
            expect(inner.parent?.contextId).toBe(middle.contextId)
            expect(inner.parent?.parent?.contextId).toBe(outer.contextId)
            expect(cross.parent?.contextId).toBe(outer.contextId)
            expect(await where(inner.parent!)).toBe('Middle')
        })

        it('finds the same nested frame by element, url, context id, and predicate', async () => {
            const { outer, middle, inner } = await openFrames()

            const byUrl = await outer.frame(`${origin}/inner`)
            const byPath = await outer.frame('/inner')
            const byId = await outer.frame(inner.contextId)
            const byPredicate = await outer.frame(() => document.title === 'Inner')

            for (const found of [byUrl, byPath, byId, byPredicate]) {
                expect(found.contextId).toBe(inner.contextId)
                expect(found.parent?.contextId).toBe(middle.contextId)
            }
        })

        it('finds a frame with an explicit selector, url, RegExp or id query', async () => {
            const { outer, middle, inner } = await openFrames()

            expect((await outer.frame({ selector: '#middle' })).contextId).toBe(middle.contextId)
            expect((await outer.frame({ url: `${origin}/inner` })).contextId).toBe(inner.contextId)
            expect((await outer.frame({ url: /\/inner$/ })).contextId).toBe(inner.contextId)
            expect((await outer.frame({ id: inner.contextId })).parent?.contextId).toBe(middle.contextId)
        })

        it('does not treat a url query as a substring', async () => {
            const page = await open('/outer')
            expect(await rejection(page.frame({ url: '/inner' }))).toBe('Could not find a frame with url "/inner"')
        })

        it('rejects an ambiguous selector query', async () => {
            const page = await open('/selector-trap')
            const plain = await page.frame({ selector: 'iframe' })
            expect(await plain.getTitle()).toBe('Plain')
            expect(await rejection(plain.frame({ selector: 'iframe, h1' }))).toContain('strict mode violation')
        })

        it('treats a plain selector as an element on this page, not a url substring', async () => {
            const page = await open('/selector-trap')
            const first = await page.frame('iframe')
            expect(await first.getTitle()).toBe('Plain')
        })

        it('falls back to the url when a string selector finds no frame element', async () => {
            const page = await open('/results-trap')
            const results = await page.frame('results')
            expect(await results.getTitle()).toBe('Results')
        })

        it('reads the title and url of each frame', async () => {
            const { outer, middle, inner, cross } = await openFrames()

            expect(await outer.getTitle()).toBe('Outer')
            expect(await middle.getTitle()).toBe('Middle')
            expect(await inner.getTitle()).toBe('Inner')
            expect(await cross.getTitle()).toBe('Cross origin')
            expect(await inner.getUrl()).toBe(`${origin}/inner`)
            expect(inner.url).toBe(`${origin}/inner`)
            expect(await cross.getUrl()).toBe(`${crossOrigin}/cross`)
        })

        it('keeps input in the frame it was typed into', async () => {
            const { outer, middle, inner, cross } = await openFrames()

            await outer.$('#input').setValue('outer')
            await middle.$('#input').setValue('middle')
            await inner.$('#input').setValue('inner')
            await cross.$('#input').setValue('cross')

            expect(await valueOf(outer)).toBe('outer')
            expect(await valueOf(middle)).toBe('middle')
            expect(await valueOf(inner)).toBe('inner')
            expect(await valueOf(cross)).toBe('cross')
        })

        it('types with keys() into a nested and a cross-origin frame', async () => {
            const { outer, middle, inner, cross } = await openFrames()

            const values = async () => ({
                outer: await valueOf(outer),
                middle: await valueOf(middle),
                inner: await valueOf(inner),
                cross: await valueOf(cross)
            })

            await inner.$('#input').click()
            await inner.keys('nested')
            expect(await values()).toEqual({ outer: '', middle: '', inner: 'nested', cross: '' })

            await cross.$('#input').click()
            await cross.keys('cross')
            expect(await values()).toEqual({ outer: '', middle: '', inner: 'nested', cross: 'cross' })
        })

        it('clicks an element of a nested frame scrolled out of its parent frame', async () => {
            const outer = await open('/clipped-outer')
            const middle = await outer.frame(outer.$('#middle'))
            const inner = await middle.frame(middle.$('#inner'))

            await inner.$('#input').click()
            await inner.keys('clipped')
            expect(await valueOf(inner)).toBe('clipped')
            expect(await valueOf(outer)).toBe('')
        })

        it('finds links by their text in a nested frame', async () => {
            const { inner } = await openFrames()
            expect(await inner.$('=Done link').getAttribute('id')).toBe('link')
            expect(await inner.$$('*=Done').length).toBe(1)
        })

        it('navigates a nested frame without moving its parents', async () => {
            const { outer, middle, inner } = await openFrames()

            const returned = await inner.navigate(`${origin}/inner-2`)
            expect(returned.contextId).toBe(inner.contextId)
            expect(await where(inner)).toBe('Inner 2')
            expect(await where(middle)).toBe('Middle')
            expect(await outer.getUrl()).toBe(`${origin}/outer`)
        })

        it('reloads a frame and keeps the state of its parent', async () => {
            const { outer, middle } = await openFrames()
            await mark(outer, 'keep me')
            await mark(middle, 'reset me')

            await middle.refresh()
            expect(await markOf(middle)).toBeNull()
            expect(await markOf(outer)).toBe('keep me')
        })

        it('reloads a frame whose timers are faked', async () => {
            const { middle } = await openFrames()
            await mark(middle, 'reset me')
            await middle.execute(() => {
                window.setTimeout = (() => 0) as unknown as typeof window.setTimeout
            })

            await middle.refresh()
            expect(await markOf(middle)).toBeNull()
        })

        it('rejects commands on a frame after its page navigated away', async () => {
            const { outer, middle } = await openFrames()

            await outer.navigate(`${origin}/tab-a`)
            expect(await rejection(middle.getTitle())).toMatch(/no such frame|not found|discarded/i)

            await outer.navigate(`${origin}/outer`)
            const again = await outer.frame(outer.$('#middle'))
            expect(await where(again)).toBe('Middle')
        })

        it('rejects top-level only commands on a frame', async () => {
            const { middle } = await openFrames()
            const topLevelOnly = {
                back: () => middle.back(),
                forward: () => middle.forward(),
                closeWindow: () => middle.closeWindow(),
                activate: () => middle.activate(),
                setViewport: () => middle.setViewport({ width: 400, height: 400 }),
                mock: () => middle.mock('**/never'),
                mockClearAll: () => middle.mockClearAll(),
                mockRestoreAll: () => middle.mockRestoreAll(),
                emulate: () => middle.emulate('userAgent', 'never'),
                restore: () => middle.restore()
            }
            for (const [command, run] of Object.entries(topLevelOnly)) {
                expect(await rejection(run())).toBe(`\`${command}\` is only available on a top-level browsing context`)
            }
            expect(await where(middle)).toBe('Middle')
        })

        it('does not take session commands', async () => {
            const page = await open('/tab-a')
            expect(await rejection(page.addCommand('never', () => {}) as unknown as Promise<unknown>))
                .toBe('`addCommand` is only available on the browser, not on a browsing context')
        })

        it('rejects a frame that does not exist', async () => {
            const page = await open('/tab-a')
            const started = Date.now()
            expect(await rejection(page.frame('#not-a-frame'))).toMatch(/not-a-frame/)
            expect(Date.now() - started).toBeLessThan(browser.options.waitforTimeout! + 5000)
        })

        it('rejects an element that is not a frame', async () => {
            const page = await open('/tab-a')
            expect(await rejection(page.frame(page.$('#input')))).toBe('The element is not a frame with a browsing context')
        })

        it('works with frames of a tab that is not the initial one', async () => {
            const a = await open('/tab-a')
            const tab = await browser.newWindow(`${origin}/outer`, { type: 'tab' })
            if (!('contextId' in tab)) {
                throw new Error('expected newWindow() to return a browsing context')
            }
            const middle = await tab.frame(tab.$('#middle'))
            const inner = await middle.frame('/inner')

            await inner.$('#input').setValue('in a background tab')
            expect(await valueOf(inner)).toBe('in a background tab')
            expect(await where(a)).toBe('Tab A')
        })
    })

    /**
     * Every element command must reach the document its element was found
     * in, also when that is not the session's current context. The list of
     * commands comes from the source, so a new command without a scenario
     * here (or a reason it doesn't apply) fails this suite.
     */
    describe('matches classic WebDriver', () => {
        /**
         * The same page in the session's current tab (classic WebDriver) and
         * in a background tab (the held-context endpoints).
         */
        const report = async (context: WebdriverIO.BrowsingContext) => {
            const outcome = (promise: Promise<unknown>) => promise.then(
                (value) => ({ value }),
                (err: Error) => ({ error: err.name })
            )
            const results: Record<string, unknown> = {
                text: await context.$('#text').getText(),
                transformedText: await context.$('#upper').getText(),
                booleanAttribute: await context.$('#required').getAttribute('required'),
                missingBooleanAttribute: await context.$('#unchecked').getAttribute('checked'),
                attribute: await context.$('#plain').getAttribute('value'),
                missingProperty: await context.$('#plain').getProperty('doesNotExist'),
                property: await context.$('#plain').getProperty('tagName'),
                optionInDisabledGroup: await context.$('#grouped-option').isEnabled(),
                option: await context.$('#free').isEnabled(),
                selected: await context.$('#free').isSelected(),
                tagName: await context.$('#upper').getTagName(),
                color: (await context.$('#upper').getCSSProperty('color')).value,
                linkText: await context.$('=Visible link').getAttribute('id'),
                partialLinkText: await context.$('*=Visible').getAttribute('id'),
                /**
                 * the Element Click endpoint itself: `click()` would wait for the element to become clickable
                 */
                coveredClick: await outcome(context.$('#covered').getElement().then((el) => el.elementClick(el.elementId))),
                relativeXPath: await context.$('#text').$('./b').getText(),
                upperCaseBooleanAttribute: await context.$('#required').getAttribute('REQUIRED'),
                linksInFrameOrTab: (await context.$$('*=link')).length
            }
            await context.$('#grouped-option').click()
            results.optionInDisabledGroupAfterClick = await context.$('#grouped-option').isSelected()
            await context.$('#multi-option').click()
            results.deselected = [
                await context.$('#multi-option').isSelected(),
                await context.$('#multi').getAttribute('data-changes')
            ]
            await context.$('#events').clearValue()
            results.clearEvents = [
                await context.$('#events').getAttribute('data-input'),
                await context.$('#events').getAttribute('data-change')
            ]
            return results
        }

        it('reports the same as classic WebDriver for an element of a background tab', async () => {
            const current = await open('/parity')
            const background = await openTab('/parity')
            const classic = await report(current)
            const held = await report(background)
            expect(classic.coveredClick).toEqual({ error: 'element click intercepted' })

            /**
             * The spec values, which chromedriver reports too: HTML attribute
             * names are case-insensitive, and an option in a disabled
             * `<optgroup>` is disabled, so a click does not select it.
             */
            expect(held.upperCaseBooleanAttribute).toBe('true')
            expect(held.optionInDisabledGroupAfterClick).toBe(false)
            if (browser.capabilities.browserName === 'firefox') {
                /**
                 * geckodriver matches boolean attribute names case-sensitively
                 * and selects an option of a disabled `<optgroup>`.
                 */
                for (const key of ['upperCaseBooleanAttribute', 'optionInDisabledGroupAfterClick']) {
                    delete classic[key]
                    delete held[key]
                }
            }
            expect(held).toEqual(classic)
        })
    })

    describe('every element command', () => {
        const targets: Record<string, () => Promise<WebdriverIO.BrowsingContext>> = {
            'a nested frame': async () => (await openFrames()).inner,
            'a cross-origin frame': async () => (await openFrames()).cross,
            'a background tab': async () => {
                await open('/tab-a')
                return openTab('/tab-b')
            }
        }

        const box = (context: WebdriverIO.BrowsingContext) => context.$('#box')
        const second = (context: WebdriverIO.BrowsingContext) => context.$$('.item')[1]
        const unsupported = 'not supported for an element of another browsing context'

        const scenarios: Record<string, (context: WebdriverIO.BrowsingContext) => Promise<void>> = {
            $: async (context) => expect(await context.$('#list').$('li:first-child').getText()).toBe('one'),
            $$: async (context) => expect(await context.$('#list').$$('.item').length).toBe(3),
            custom$: async (context) => expect(await context.$('#list').custom$('listItems', '.item').getText()).toBe('one'),
            custom$$: async (context) => expect(await context.$('#list').custom$$('listItems', '.item').length).toBe(3),
            shadow$: async (context) => expect(await context.$('#host').shadow$('.inside').getText()).toBe('shadow text'),
            shadow$$: async (context) => expect(await context.$('#host').shadow$$('.inside').length).toBe(1),
            getElement: async (context) => expect(await (await box(context).getElement()).getText()).toBe('box'),
            getElements: async (context) => expect((await context.$$('.item').getElements()).length).toBe(3),
            nextElement: async (context) => expect(await second(context).nextElement().getText()).toBe('three'),
            previousElement: async (context) => expect(await second(context).previousElement().getText()).toBe('one'),
            parentElement: async (context) => expect(await second(context).parentElement().getAttribute('id')).toBe('list'),
            execute: async (context) => expect(await box(context).execute((el) => el.id)).toBe('box'),
            getAttribute: async (context) => expect(await box(context).getAttribute('id')).toBe('box'),
            getProperty: async (context) => expect(await context.$('#check').getProperty('checked')).toBe(true),
            getHTML: async (context) => expect(await box(context).getHTML()).toContain('>box</div>'),
            getText: async (context) => expect(await box(context).getText()).toBe('box'),
            getTagName: async (context) => expect(await context.$('#select').getTagName()).toBe('select'),
            /**
             * The drivers differ: chromedriver reports `rgba()`, geckodriver the computed `rgb()`.
             */
            getCSSProperty: async (context) => expect((await box(context).getCSSProperty('color')).value)
                .toBe(browser.capabilities.browserName === 'firefox' ? 'rgb(255,0,0)' : 'rgba(255,0,0,1)'),
            getSize: async (context) => expect(await box(context).getSize()).toEqual({ width: 120, height: 30 }),
            getLocation: async (context) => {
                const expected = await context.execute(() => {
                    const rect = document.getElementById('box')!.getBoundingClientRect()
                    return { x: Math.round(rect.x + window.scrollX), y: Math.round(rect.y + window.scrollY) }
                })
                const location = await box(context).getLocation()
                expect({ x: Math.round(location.x), y: Math.round(location.y) }).toEqual(expected)
            },
            getComputedRole: async (context) => expect(await rejection(box(context).getComputedRole())).toContain(unsupported),
            getComputedLabel: async (context) => expect(await rejection(box(context).getComputedLabel())).toContain(unsupported),
            getValue: async (context) => {
                await context.$('#input').setValue('typed')
                expect(await context.$('#input').getValue()).toBe('typed')
            },
            isDisplayed: async (context) => expect(await box(context).isDisplayed()).toBe(true),
            isEnabled: async (context) => expect(await context.$('#disabled').isEnabled()).toBe(false),
            isSelected: async (context) => expect(await context.$('#check').isSelected()).toBe(true),
            isClickable: async (context) => expect(await box(context).isClickable()).toBe(true),
            isExisting: async (context) => {
                expect(await box(context).isExisting()).toBe(true)
                expect(await context.$('#missing').isExisting()).toBe(false)
            },
            isEqual: async (context) => {
                const element = await box(context)
                expect(await element.isEqual(await box(context))).toBe(true)
                expect(await element.isEqual(await context.$('#double'))).toBe(false)
            },
            isFocused: async (context) => {
                await context.$('#input').click()
                expect(await context.$('#input').isFocused()).toBe(true)
                expect(await box(context).isFocused()).toBe(false)
            },
            isStable: async (context) => expect(await box(context).isStable()).toBe(true),
            click: async (context) => {
                await context.$('#check').click()
                expect(await context.$('#check').isSelected()).toBe(false)
            },
            doubleClick: async (context) => {
                await context.$('#double').doubleClick()
                await expect(context.$('#double')).toHaveText('double clicked')
            },
            moveTo: async (context) => {
                await context.$('#hover').moveTo({ xOffset: 2, yOffset: 2 })
                await expect(context.$('#hover')).toHaveText('hovered')
            },
            dragAndDrop: async (context) => {
                await context.$('#drag').dragAndDrop(context.$('#drop'))
                await expect(context.$('#drop')).toHaveText('dropped')
            },
            scrollIntoView: async (context) => {
                await context.$('#far').scrollIntoView()
                expect(await context.execute(() => window.scrollY)).toBeGreaterThan(0)
            },
            setValue: async (context) => {
                await context.$('#input').setValue('first')
                await context.$('#input').setValue('second')
                expect(await context.$('#input').getValue()).toBe('second')
            },
            addValue: async (context) => {
                await context.$('#input').setValue('a')
                await context.$('#input').addValue('b')
                expect(await context.$('#input').getValue()).toBe('ab')
            },
            clearValue: async (context) => {
                await context.$('#input').setValue('clear me')
                await context.$('#input').clearValue()
                expect(await context.$('#input').getValue()).toBe('')
                expect(await rejection(context.$('#readonly').clearValue())).toContain('invalid element state')
                expect(await context.$('#readonly').getValue()).toBe('keep')
            },
            selectByVisibleText: async (context) => {
                await context.$('#select').selectByVisibleText('two')
                expect(await context.$('#select').getValue()).toBe('two')
            },
            selectByIndex: async (context) => {
                await context.$('#select').selectByIndex(1)
                expect(await context.$('#select').getValue()).toBe('two')
            },
            selectByAttribute: async (context) => {
                await context.$('#select').selectByAttribute('value', 'two')
                expect(await context.$('#select').getValue()).toBe('two')
            },
            setFiles: async (context) => {
                const file = path.join(screenshots, 'upload.txt')
                await fs.writeFile(file, 'upload')
                await context.$('#file').setFiles(file)
                expect(await context.$('#file').execute((el) => (el as HTMLInputElement).files?.[0]?.name)).toBe('upload.txt')
            },
            saveScreenshot: async (context) => {
                const screenshot = await box(context).saveScreenshot(path.join(screenshots, 'box.png'))
                expect(screenshot.readUInt32BE(16)).toBeGreaterThanOrEqual(120)
                expect(screenshot.readUInt32BE(20)).toBeGreaterThanOrEqual(30)
            },
            waitForExist: async (context) => expect(await box(context).waitForExist()).toBe(true),
            waitForDisplayed: async (context) => expect(await box(context).waitForDisplayed()).toBe(true),
            waitForEnabled: async (context) => expect(await context.$('#input').waitForEnabled()).toBe(true),
            waitForClickable: async (context) => expect(await box(context).waitForClickable()).toBe(true),
            waitForStable: async (context) => {
                await box(context).waitForStable()
            },
            waitUntil: async (context) => {
                await box(context).waitUntil(async function (this: WebdriverIO.Element) {
                    return (await this.getText()) === 'box'
                })
            }
        }

        /**
         * Commands without a scenario, and why.
         */
        const notApplicable: Record<string, string> = {
            react$: 'needs a React application in the fixture',
            react$$: 'needs a React application in the fixture'
        }

        before(() => {
            browser.addLocatorStrategy('listItems', (selector: string, root?: HTMLElement) => (
                Array.from((root ?? document).querySelectorAll(selector)) as HTMLElement[]
            ))
        })

        it('has a scenario for every element command', async () => {
            const source = await fs.readFile(
                path.resolve(__dirname, '..', '..', '..', 'packages', 'webdriverio', 'src', 'commands', 'element.ts'),
                'utf8'
            )
            /**
             * `export * from './element/x.js'` and `export { x } from './element/x.js'`
             */
            const commands = [...source.matchAll(/export (?:\* |\{ [\w$]+ \} )from '\.\/element\/(.+)\.js'/g)]
                .map(([, name]) => name)
                .sort()
            expect(commands.length).toBeGreaterThan(40)
            expect([...Object.keys(scenarios), ...Object.keys(notApplicable)].sort()).toEqual(commands)
        })

        for (const [where, target] of Object.entries(targets)) {
            describe(`in ${where}`, () => {
                for (const [command, run] of Object.entries(scenarios)) {
                    it(command, async () => run(await target()))
                }
            })
        }
    })

    describe('dialogs', () => {
        /**
         * Dialogs are dismissed automatically unless a `dialog` listener is
         * registered. Register one that leaves them open for the context
         * commands under test.
         */
        const keepDialogsOpen = () => {}
        beforeEach(() => {
            browser.on('dialog', keepDialogsOpen)
        })
        afterEach(() => {
            browser.off('dialog', keepDialogsOpen)
        })

        const confirmLater = (context: WebdriverIO.BrowsingContext, message: string) => context.execute((text) => {
            setTimeout(() => {
                document.getElementById('result')!.textContent = String(window.confirm(text))
            }, 10)
        }, message)

        it('reads and accepts a dialog in a background tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await confirmLater(b, 'from tab B')
            await browser.waitUntil(async () => (await b.getAlertText().catch(() => '')) === 'from tab B')
            await b.acceptAlert()
            await expect(b.$('#result')).toHaveText('true')
            expect(await where(a)).toBe('Tab A')
        })

        it('dismisses a dialog in one tab while another tab has one open', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await confirmLater(a, 'from tab A')
            await confirmLater(b, 'from tab B')
            await browser.waitUntil(async () => (await b.getAlertText().catch(() => '')) === 'from tab B')
            await browser.waitUntil(async () => (await a.getAlertText().catch(() => '')) === 'from tab A')

            await b.dismissAlert()
            await expect(b.$('#result')).toHaveText('false')
            expect(await a.getAlertText()).toBe('from tab A')
            await a.acceptAlert()
            await expect(a.$('#result')).toHaveText('true')
        })

        it('handles a dialog opened by a frame', async () => {
            const { outer, middle } = await openFrames()

            await confirmLater(middle, 'from a frame')
            await browser.waitUntil(async () => (await outer.getAlertText().catch(() => '')) === 'from a frame')
            await outer.acceptAlert()
            await expect(middle.$('#result')).toHaveText('true')
        })

        it('accepts a dialog of a background tab from the dialog event', async () => {
            browser.off('dialog', keepDialogsOpen)
            const accept = (dialog: WebdriverIO.Dialog) => dialog.accept()
            browser.on('dialog', accept)
            try {
                await open('/tab-a')
                const b = await openTab('/tab-b')
                await confirmLater(b, 'from tab B')
                await expect(b.$('#result')).toHaveText('true')
            } finally {
                browser.off('dialog', accept)
                browser.on('dialog', keepDialogsOpen)
            }
        })
    })

    describe('removed commands', () => {
        it('rejects switchWindow and switchFrame in a BiDi session', async () => {
            const page = await open('/outer')
            expect(await rejection(browser.switchWindow(`${origin}/outer`))).toMatch(/switchWindow/)
            expect(await rejection(browser.switchFrame(page.$('#middle') as unknown as WebdriverIO.Element))).toMatch(/switchFrame/)
            expect(await where(page)).toBe('Outer')
        })
    })
})
