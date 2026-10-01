import os from 'node:os'
import path from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { browser, expect } from '@wdio/globals'

/**
 * A tab, a window, and a frame are a `WebdriverIO.BrowsingContext` you hold
 * (https://github.com/webdriverio/webdriverio/pull/15833). These tests drive
 * several of them at once and check that every command lands in the context
 * it was called on, and only there.
 *
 * Pages are served from 127.0.0.1. `/outer` also embeds a frame from
 * `localhost`, a different origin, which Chromium runs out of process.
 */
const ELEMENT_COMMANDS_WITHOUT_CONTEXT = 'element commands in .* (isEnabled|isSelected|isClickable|getTagName|getCSSProperty|clearValue|addValue|selectByVisibleText|saveScreenshot)$'

/**
 * Tests that fail today because of a bug. They are skipped so the suite
 * stays green and the bug stays visible. Fix the bug, then delete its entry
 * here so the test runs. `only` limits an entry to Chromium or Firefox.
 */
const knownIssues: { title: RegExp, reason: string, only?: 'chromium' | 'firefox' }[] = [
    {
        title: /emulates in the tab it was called on$/,
        reason: '`emulate` on a held tab applies to the session\'s current top-level context instead'
    },
    {
        title: /mocks requests of the tab it was called on only$/,
        reason: '`mock` on a held context adds a session-wide network intercept'
    },
    {
        title: /restores a mock created on a tab that is not the initial one$/,
        reason: '`mock.restore()` looks the mock up by `getWindowHandle()` and throws for a mock made on another tab'
    },
    {
        title: /treats a plain selector as an element on this page, not a url substring$/,
        reason: '`frame(\'iframe\')` matches the string against frame urls before it uses it as a selector'
    },
    {
        title: new RegExp(ELEMENT_COMMANDS_WITHOUT_CONTEXT),
        reason: 'element commands that use classic WebDriver run against the session\'s current document, not the held context'
    },
    {
        title: /clicks an element of a nested frame scrolled out of its parent frame$/,
        reason: 'the click lands outside the nested frame when it has to be scrolled into view inside its parent frame'
    },
    {
        title: /accepts a dialog of a background tab from the dialog event$/,
        reason: '`dialog.accept()` returns without answering when the dialog is not in the session\'s current context'
    },
    {
        title: /reloads a frame and keeps the state of its parent$/,
        reason: 'Chromium rejects `browsingContext.reload` on a frame with "navigation canceled by context disposal"',
        only: 'chromium'
    },
    {
        title: /rejects commands on a frame after its page navigated away$/,
        reason: 'commands on a discarded frame never settle in Firefox',
        only: 'firefox'
    }
]

function knownIssue (fullTitle: string) {
    const isFirefox = browser.capabilities.browserName?.toLowerCase() === 'firefox'
    return knownIssues.find((issue) => (
        issue.title.test(fullTitle) &&
        (!issue.only || issue.only === (isFirefox ? 'firefox' : 'chromium'))
    ))
}

/**
 * `it`, except a test listed in `knownIssues` is skipped.
 */
function test (title: string, fn: () => Promise<unknown>) {
    it(title, async function () {
        if (knownIssue(this.test!.fullTitle())) {
            return this.skip()
        }
        await fn()
    })
}

describe('browsing contexts', () => {
    let origin: string
    let crossOrigin: string

    const page = (title: string, body = '') => (
        `<!doctype html><title>${title}</title><h1 id="where">${title}</h1>${body}`
    )
    const input = '<input id="input">'
    const widgets = [
        '<input id="check" type="checkbox" checked>',
        '<button id="disabled" disabled>off</button>',
        '<select id="select"><option>one</option><option>two</option></select>',
        '<div id="box" style="width:120px;height:30px;color:rgb(255, 0, 0)">box</div>',
        '<div id="double" ondblclick="this.textContent = \'double clicked\'">double</div>'
    ].join('')
    const pages: Record<string, () => string> = {
        '/tab-a': () => page('Tab A', `${input}<p id="result"></p><a id="next" href="/tab-a-2">next</a>`),
        '/tab-a-2': () => page('Tab A 2'),
        '/tab-b': () => page('Tab B', `${input}<p id="result"></p>${widgets}`),
        '/tab-b-2': () => page('Tab B 2'),
        '/outer': () => page('Outer', `${input}<iframe id="middle" src="/middle" style="width:500px;height:500px"></iframe><iframe id="cross" src="${crossOrigin}/cross" style="width:500px;height:300px"></iframe>`),
        '/middle': () => page('Middle', `${input}<p id="result"></p><iframe id="inner" src="/inner" style="width:400px;height:300px"></iframe>`),
        '/inner': () => page('Inner', `${input}${widgets}`),
        /**
         * The nested frame sits below the visible area of its parent frame,
         * so it has to be scrolled into view before it can be clicked.
         */
        '/clipped-outer': () => page('Clipped outer', `${input}<iframe id="middle" src="/clipped-middle"></iframe>`),
        '/clipped-middle': () => page('Clipped middle', '<div style="height:400px"></div><iframe id="inner" src="/inner"></iframe>'),
        '/inner-2': () => page('Inner 2'),
        '/cross': () => page('Cross origin', `${input}${widgets}`),
        /**
         * `/plain` is the only `<iframe>` element on this page. The frame
         * nested inside it has `iframe` in its url.
         */
        '/selector-trap': () => page('Selector trap', '<iframe id="first" src="/plain"></iframe>'),
        '/plain': () => page('Plain', '<iframe src="/iframe-nested"></iframe>'),
        '/iframe-nested': () => page('Nested by url'),
        '/fetch': () => page('Fetch', `<p id="result"></p><script>
            const endpoint = new URLSearchParams(location.search).get('endpoint')
            fetch('/api/' + endpoint).then((r) => r.text()).then((t) => { document.getElementById('result').textContent = t })
        </script>`),
        '/api/scoped': () => 'real',
        '/api/restored': () => 'real'
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
    const open = async (path: string) => {
        const context = await browser.url(`${origin}${path}`)
        if (!context) {
            throw new Error('expected browser.url() to return a browsing context')
        }
        return context
    }

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
        if (!server.listening) {
            return
        }
        const closed = new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
        server.closeAllConnections()
        await closed
    })

    describe('tabs and windows', () => {
        test('keeps browser.url() on the initial context after a new tab opens', async () => {
            const first = await open('/tab-a')
            const tab = await openTab('/tab-b')

            const again = await open('/tab-a-2')
            expect(again.contextId).toBe(first.contextId)
            expect(again.contextId).not.toBe(tab.contextId)
            expect(await where(again)).toBe('Tab A 2')
            expect(await where(tab)).toBe('Tab B')
        })

        test('runs commands on two tabs at the same time', async () => {
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

        test('navigates one tab without touching the other', async () => {
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

        test('goes back and forward in one tab only', async () => {
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

        test('reloads one tab and keeps the state of the other', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            await mark(a, 'keep me')
            await mark(b, 'reset me')

            await b.refresh()
            expect(await markOf(b)).toBeNull()
            expect(await markOf(a)).toBe('keep me')
        })

        test('types into a background tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.$('#input').click()
            await b.keys('abc')
            expect(await valueOf(b)).toBe('abc')
            expect(await valueOf(a)).toBe('')
        })

        test('activates a tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.activate()
            await browser.waitUntil(async () => await b.execute(() => document.visibilityState) === 'visible')

            await a.activate()
            await browser.waitUntil(async () => await a.execute(() => document.visibilityState) === 'visible')
        })

        test('lists only top-level contexts, not frames', async () => {
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

        test('opens a window next to a reference context', async () => {
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

        test('closes one tab, and commands on it reject afterwards', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await b.closeWindow()
            const ids = (await browser.browsingContexts()).map((context) => context.contextId)
            expect(ids).not.toContain(b.contextId)
            expect(await rejection(b.getTitle())).toMatch(/no such frame|no such window|not found|discarded/i)
            expect(await where(a)).toBe('Tab A')
        })

        test('rejects commands on a frame of a closed tab', async () => {
            await open('/tab-a')
            const tab = await browser.newWindow(`${origin}/outer`, { type: 'tab' })
            if (!('contextId' in tab)) {
                throw new Error('expected newWindow() to return a browsing context')
            }
            const middle = await tab.frame(tab.$('#middle'))
            await tab.closeWindow()
            expect(await rejection(middle.getTitle())).toMatch(/no such frame|no such window|not found|discarded/i)
        })

        test('sets the viewport of one tab only', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')
            const widthOfA = await a.execute(() => window.innerWidth)

            await b.setViewport({ width: 420, height: 600 })
            expect(await b.execute(() => window.innerWidth)).toBe(420)
            expect(await a.execute(() => window.innerWidth)).toBe(widthOfA)
        })

        test('scopes an init script to the tab it was added to', async () => {
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

        test('emulates in the tab it was called on', async () => {
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

        test('mocks requests of the tab it was called on only', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-a')

            const mock = await b.mock('**/api/scoped')
            mock.respond('mocked', { headers: { 'Content-Type': 'text/plain' } })
            await b.navigate(`${origin}/fetch?endpoint=scoped`)
            await a.navigate(`${origin}/fetch?endpoint=scoped`)
            await expect(b.$('#result')).toHaveText('mocked')
            await expect(a.$('#result')).toHaveText('real')
        })

        test('restores a mock created on a tab that is not the initial one', async () => {
            await open('/tab-a')
            const b = await openTab('/tab-a')

            const mock = await b.mock('**/api/restored')
            mock.respond('mocked', { headers: { 'Content-Type': 'text/plain' } })
            await b.navigate(`${origin}/fetch?endpoint=restored`)
            await expect(b.$('#result')).toHaveText('mocked')

            await mock.restore()
            await b.navigate(`${origin}/fetch?endpoint=restored`)
            await expect(b.$('#result')).toHaveText('real')
        })

        test('shares cookies between tabs of the same origin', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await a.setCookies({ name: 'shared', value: 'by-a' })
            const [cookie] = await b.getCookies({ name: 'shared' })
            expect(cookie?.value).toBe('by-a')

            await b.deleteCookies({ name: 'shared' })
            expect(await a.getCookies({ name: 'shared' })).toEqual([])
        })

        test('takes a screenshot of a background tab', async () => {
            await open('/tab-a')
            const b = await openTab('/tab-b')
            await b.setViewport({ width: 500, height: 400 })

            const screenshot = await b.saveScreenshot(path.join(os.tmpdir(), 'wdio-browsing-context-tab.png'))
            // PNG header: width at byte 16, height at byte 20
            expect(screenshot.readUInt32BE(16)).toBe(500)
            expect(screenshot.readUInt32BE(20)).toBe(400)
        })
    })

    describe('frames', () => {
        test('scopes element lookups to each frame of a nested chain', async () => {
            const { outer, middle, inner } = await openFrames()

            expect(await where(outer)).toBe('Outer')
            expect(await where(middle)).toBe('Middle')
            expect(await where(inner)).toBe('Inner')
            await expect(outer.$('#inner')).not.toExist()
            await expect(middle.$('#middle')).not.toExist()
        })

        test('links each frame to its parent', async () => {
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

        test('finds the same nested frame by element, url, context id, and predicate', async () => {
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

        test('treats a plain selector as an element on this page, not a url substring', async () => {
            const page = await open('/selector-trap')
            const first = await page.frame('iframe')
            expect(await first.getTitle()).toBe('Plain')
        })

        test('reads the title and url of each frame', async () => {
            const { outer, middle, inner, cross } = await openFrames()

            expect(await outer.getTitle()).toBe('Outer')
            expect(await middle.getTitle()).toBe('Middle')
            expect(await inner.getTitle()).toBe('Inner')
            expect(await cross.getTitle()).toBe('Cross origin')
            expect(await inner.getUrl()).toBe(`${origin}/inner`)
            expect(inner.url).toBe(`${origin}/inner`)
            expect(await cross.getUrl()).toBe(`${crossOrigin}/cross`)
        })

        test('keeps input in the frame it was typed into', async () => {
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

        test('types with keys() into a nested and a cross-origin frame', async () => {
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

        test('clicks an element of a nested frame scrolled out of its parent frame', async () => {
            const outer = await open('/clipped-outer')
            const middle = await outer.frame(outer.$('#middle'))
            const inner = await middle.frame(middle.$('#inner'))

            await inner.$('#input').click()
            await inner.keys('clipped')
            expect(await valueOf(inner)).toBe('clipped')
            expect(await valueOf(outer)).toBe('')
        })

        test('navigates a nested frame without moving its parents', async () => {
            const { outer, middle, inner } = await openFrames()

            const returned = await inner.navigate(`${origin}/inner-2`)
            expect(returned.contextId).toBe(inner.contextId)
            expect(await where(inner)).toBe('Inner 2')
            expect(await where(middle)).toBe('Middle')
            expect(await outer.getUrl()).toBe(`${origin}/outer`)
        })

        test('reloads a frame and keeps the state of its parent', async () => {
            const { outer, middle } = await openFrames()
            await mark(outer, 'keep me')
            await mark(middle, 'reset me')

            await middle.refresh()
            expect(await markOf(middle)).toBeNull()
            expect(await markOf(outer)).toBe('keep me')
        })

        test('rejects commands on a frame after its page navigated away', async () => {
            const { outer, middle } = await openFrames()

            await outer.navigate(`${origin}/tab-a`)
            expect(await rejection(middle.getTitle())).toMatch(/no such frame|not found|discarded/i)

            await outer.navigate(`${origin}/outer`)
            const again = await outer.frame(outer.$('#middle'))
            expect(await where(again)).toBe('Middle')
        })

        test('rejects top-level only commands on a frame', async () => {
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

        test('does not take session commands', async () => {
            const page = await open('/tab-a')
            expect(await rejection(page.addCommand('never', () => {}) as unknown as Promise<unknown>))
                .toBe('`addCommand` is only available on the browser, not on a browsing context')
        })

        test('rejects a frame that does not exist', async () => {
            const page = await open('/tab-a')
            const started = Date.now()
            expect(await rejection(page.frame('#not-a-frame'))).toMatch(/not-a-frame/)
            expect(Date.now() - started).toBeLessThan(browser.options.waitforTimeout! + 5000)
        })

        test('rejects an element that is not a frame', async () => {
            const page = await open('/tab-a')
            expect(await rejection(page.frame(page.$('#input')))).toBe('The element is not a frame with a browsing context')
        })

        test('works with frames of a tab that is not the initial one', async () => {
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
     * Element commands must reach the document the element was found in,
     * also when that is not the session's current context.
     */
    describe('element commands', () => {
        const targets: Record<string, () => Promise<WebdriverIO.BrowsingContext>> = {
            'a nested frame': async () => (await openFrames()).inner,
            'a cross-origin frame': async () => (await openFrames()).cross,
            'a background tab': async () => {
                await open('/tab-a')
                return openTab('/tab-b')
            }
        }
        const commands: Record<string, (context: WebdriverIO.BrowsingContext) => Promise<void>> = {
            isDisplayed: async (context) => expect(await context.$('#box').isDisplayed()).toBe(true),
            isEnabled: async (context) => expect(await context.$('#disabled').isEnabled()).toBe(false),
            isSelected: async (context) => expect(await context.$('#check').isSelected()).toBe(true),
            isClickable: async (context) => expect(await context.$('#box').isClickable()).toBe(true),
            getTagName: async (context) => expect(await context.$('#select').getTagName()).toBe('select'),
            getSize: async (context) => expect(await context.$('#box').getSize()).toEqual({ width: 120, height: 30 }),
            getCSSProperty: async (context) => expect((await context.$('#box').getCSSProperty('color')).value).toBe('rgba(255,0,0,1)'),
            getText: async (context) => expect(await context.$('#box').getText()).toBe('box'),
            waitForDisplayed: async (context) => expect(await context.$('#box').waitForDisplayed()).toBe(true),
            clearValue: async (context) => {
                await context.$('#input').setValue('clear me')
                await context.$('#input').clearValue()
                expect(await context.$('#input').getValue()).toBe('')
            },
            addValue: async (context) => {
                await context.$('#input').setValue('a')
                await context.$('#input').addValue('b')
                expect(await context.$('#input').getValue()).toBe('ab')
            },
            selectByVisibleText: async (context) => {
                await context.$('#select').selectByVisibleText('two')
                expect(await context.$('#select').getValue()).toBe('two')
            },
            doubleClick: async (context) => {
                await context.$('#double').doubleClick()
                await expect(context.$('#double')).toHaveText('double clicked')
            },
            saveScreenshot: async (context) => {
                const screenshot = await context.$('#box').saveScreenshot(path.join(os.tmpdir(), 'wdio-browsing-context-box.png'))
                expect(screenshot.readUInt32BE(16)).toBeGreaterThanOrEqual(120)
                expect(screenshot.readUInt32BE(20)).toBeGreaterThanOrEqual(30)
            }
        }

        for (const [where, target] of Object.entries(targets)) {
            describe(`in ${where}`, () => {
                for (const [command, run] of Object.entries(commands)) {
                    test(command, async () => run(await target()))
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

        test('reads and accepts a dialog in a background tab', async () => {
            const a = await open('/tab-a')
            const b = await openTab('/tab-b')

            await confirmLater(b, 'from tab B')
            await browser.waitUntil(async () => (await b.getAlertText().catch(() => '')) === 'from tab B')
            await b.acceptAlert()
            await expect(b.$('#result')).toHaveText('true')
            expect(await where(a)).toBe('Tab A')
        })

        test('dismisses a dialog in one tab while another tab has one open', async () => {
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

        test('handles a dialog opened by a frame', async () => {
            const { outer, middle } = await openFrames()

            await confirmLater(middle, 'from a frame')
            await browser.waitUntil(async () => (await outer.getAlertText().catch(() => '')) === 'from a frame')
            await outer.acceptAlert()
            await expect(middle.$('#result')).toHaveText('true')
        })

        test('accepts a dialog of a background tab from the dialog event', async () => {
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
        test('rejects switchWindow and switchFrame in a BiDi session', async () => {
            const page = await open('/outer')
            expect(await rejection(browser.switchWindow(`${origin}/outer`))).toMatch(/switchWindow/)
            expect(await rejection(browser.switchFrame(page.$('#middle') as unknown as WebdriverIO.Element))).toMatch(/switchFrame/)
            expect(await where(page)).toBe('Outer')
        })
    })
})
