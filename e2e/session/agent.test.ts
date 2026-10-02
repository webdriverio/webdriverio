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

    it('scopes a snapshot to a pinned element', async () => {
        const products = await browser.$('#products')
        const scope = await agent.pin(products)
        const { text } = await agent.run('snapshot', { scope, interactive: true }) as { text: string }
        expect(text).toContain('button "Add to cart"')
        expect(text).not.toContain('Checkout')
        expect(text).not.toContain('Cart (')
    })

    it('keeps the history in memory and leaves the browser session open on dispose', async () => {
        expect(fs.existsSync(path.join(agent.session.artifactsDir, 'history.json'))).toBe(false)
        await agent.dispose()
        expect(await browser.getTitle()).toBe('Shop · Cart')
    })
})
