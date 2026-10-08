import fs from 'node:fs'
import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { remote } from 'webdriverio'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { startServer, type FixtureServer } from './helpers.js'

/**
 * `@wdio/session/agent` runs session actions on a browser the caller owns.
 */
describe('@wdio/session/agent', () => {
    let server: FixtureServer
    let browser: WebdriverIO.Browser
    let agent: AgentSession

    beforeAll(async () => {
        server = await startServer()
        browser = await remote({
            logLevel: 'error',
            capabilities: {
                browserName: 'chrome',
                webSocketUrl: true,
                'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
            }
        })
        agent = await createAgentSession(browser, { captureEvents: true })
        await browser.url(`${server.url}/cart.html`)
    }, 60_000)

    afterAll(async () => {
        await agent?.dispose()
        await browser?.deleteSession()
        await server?.close()
    })

    it('takes a snapshot with refs and clicks a ref with a stable selector', async () => {
        const { text } = await agent.snapshot({ interactive: true })
        expect(text).toContain('button "Add to cart"')
        const ref = text.match(/button "Add to cart" \[ref=(e\d+)\]/)?.[1]
        expect(ref).toBeDefined()

        const result = await agent.run('click', { target: ref })
        expect(result.code).toBe('await $(\'[data-testid="add-blue"]\').click()')
        expect(agent.ref(ref!)?.candidates[0]).toBe('[data-testid="add-blue"]')
        expect(agent.history.map((entry) => entry.code)).toContain(result.code)
    })

    it('records the role selector for a unique role and name', async () => {
        const { text } = await agent.snapshot({ interactive: true })
        const ref = text.match(/button "Remove Blue T-Shirt" \[ref=(e\d+)\]/)?.[1]
        expect(ref).toBeDefined()
        expect(agent.ref(ref!)?.candidates).toContain('role/button[name="Remove Blue T-Shirt"]')
    })

    it('tells whether an element is inside a pinned element, also across shadow roots', async () => {
        const products = await agent.pin(await browser.$('#products'))
        expect(await agent.contains(products, '[data-testid="add-red"]')).toBe(true)
        expect(await agent.contains(products, '#checkout')).toBe(false)
        expect(await agent.contains(products, '#does-not-exist')).toBe(false)

        await browser.execute(() => {
            const host = document.createElement('div')
            host.id = 'shadow-host'
            document.getElementById('products')!.appendChild(host)
            host.attachShadow({ mode: 'open' }).innerHTML = '<button id="in-shadow">Gift wrap</button>'
        })
        try {
            expect(await agent.contains(products, 'aria/Gift wrap')).toBe(true)
        } finally {
            await browser.execute(() => document.getElementById('shadow-host')?.remove())
        }
    })

    it('scopes a snapshot to a pinned element', async () => {
        const products = await browser.$('#products')
        const scope = await agent.pin(products)
        const { text } = await agent.run('snapshot', { scope, interactive: true }) as { text: string }
        expect(text).toContain('button "Add to cart"')
        expect(text).not.toContain('Checkout')
        expect(text).not.toContain('Cart (')

        /**
         * the click moves the focus inside the scope and changes the cart
         * outside of it, the diff only shows the scope
         */
        await agent.run('click', { target: '[data-testid="add-red"]' })
        const scoped = await agent.run('diff', { scope, interactive: true })
        expect(scoped.text).toContain('[focused]')
        expect(scoped.text).not.toContain('Checkout')
        expect(scoped.text).not.toContain('Remove Red Hoodie')
    })

    it('reports a navigation as a structured page change', async () => {
        const { text } = await agent.snapshot({ interactive: true })
        const ref = text.match(/link "Home" \[ref=(e\d+)\]/)?.[1]
        expect(ref).toBeDefined()
        try {
            const result = await agent.run('click', { target: ref })
            expect(result.changes).toMatchObject({ kind: 'page', frame: false })
            expect(result.changes?.kind === 'page' && result.changes.url).toContain('/index.html')
            expect(result.page?.url).toContain('/index.html')
            expect(result.page?.title).toBe('Session Fixture')
            expect(result.text).toContain('Page: ')
        } finally {
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('does not return a snapshot above maxChars', async () => {
        const snapshot = await agent.snapshot({ interactive: true, maxChars: 50 })
        expect(snapshot.tooBig).toBe(true)
        expect(snapshot.text).toMatch(/^Snapshot: \d+ lines, \d+ refs, \d+ chars: too big to return \(max 50\)\./)
        expect(snapshot.refs).toBeGreaterThan(0)
        expect(snapshot.tree.role).toBe('document')
        expect(snapshot.page?.title).toBe('Shop · Cart')
    })

    it('names the commands of the caller in a stale ref error after a navigation', async () => {
        const named = await createAgentSession(browser, { hint: (command) => command === 'snapshot' ? 'custom_snapshot' : undefined })
        try {
            const { text } = await named.snapshot({ interactive: true })
            const ref = text.match(/link "Home" \[ref=(e\d+)\]/)?.[1]
            expect(ref).toBeDefined()
            await browser.url(`${server.url}/index.html`)
            await expect(named.run('click', { target: ref })).rejects.toMatchObject({ hint: expect.stringContaining('`custom_snapshot`') })
        } finally {
            await named.dispose()
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('notes a request that failed during a click', async () => {
        await browser.url(`${server.url}/forbidden.html`)
        try {
            const { text } = await agent.snapshot({ interactive: true })
            const ref = text.match(/button "Search" \[ref=(e\d+)\]/)?.[1]
            expect(ref).toBeDefined()
            const result = await agent.run('click', { target: ref })
            expect(result.notes).toEqual([`Requests failed: 403 POST localhost:${server.port}/api/forbidden`])
            expect(result.text).toContain('Requests failed: 403 POST')
        } finally {
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('keeps the history in memory and leaves the browser session open on dispose', async () => {
        expect(fs.existsSync(path.join(agent.session.artifactsDir, 'history.json'))).toBe(false)
        await agent.dispose()
        expect(await browser.getTitle()).toBe('Shop · Cart')
    })

    it('clicks a link that sits under a fixed header', async () => {
        const sticky = await createAgentSession(browser)
        try {
            await browser.url(`${server.url}/sticky.html`)
            const { text } = await sticky.snapshot({ interactive: true })
            const ref = text.match(/link "Return home" \[ref=(e\d+)\]/)?.[1]
            expect(ref).toBeDefined()
            await browser.execute(() => window.scrollTo(0, window.scrollY + document.getElementById('home')!.getBoundingClientRect().top - 10))
            const result = await sticky.run('click', { target: ref })
            expect(result.text).toContain('Clicked')
        } finally {
            await sticky.dispose()
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('clicks a link whose top half is under a fixed header on a page that cannot scroll', async () => {
        const sticky = await createAgentSession(browser)
        try {
            await browser.url(`${server.url}/sticky-short.html`)
            const { text } = await sticky.snapshot({ interactive: true })
            const ref = text.match(/link "Return home" \[ref=(e\d+)\]/)?.[1]
            expect(ref).toBeDefined()
            await sticky.run('click', { target: ref })
            expect(await browser.getTitle()).toBe('Clicked home')
        } finally {
            await sticky.dispose()
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('waits for a client-rendered page before the first snapshot', async () => {
        const spa = await createAgentSession(browser)
        try {
            await browser.url(`${server.url}/spa.html`)
            const { text } = await spa.snapshot({ interactive: true })
            expect(text).toMatch(/button "Book now" \[ref=e\d+\]/)
        } finally {
            await spa.dispose()
            await browser.url(`${server.url}/cart.html`)
        }
    })

    it('clicks a button under a fixed header inside a held frame', async () => {
        const framed = await createAgentSession(browser)
        let leave: (() => Promise<void>) | undefined
        try {
            await browser.url(`${server.url}/sticky-frame-host.html`)
            const [page] = await browser.browsingContexts()
            const frame = await page.frame(page.$('#inner'))
            leave = await framed.enter(frame)
            const { text } = await framed.snapshot({ interactive: true })
            const ref = text.match(/button "Frame action" \[ref=(e\d+)\]/)?.[1]
            expect(ref).toBeDefined()
            await framed.run('click', { target: ref })
            expect(await frame.$('button').getText()).toBe('Frame clicked')
        } finally {
            await leave?.()
            await framed.dispose()
            await browser.url(`${server.url}/cart.html`)
        }
    })
})
