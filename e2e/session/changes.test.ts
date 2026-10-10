import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { remote } from 'webdriverio'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { startServer, type FixtureServer } from './helpers.js'

/**
 * A page that rotates a carousel on a timer must not hide what a click did.
 */
describe('@wdio/session/agent change reports', () => {
    let server: FixtureServer
    let browser: WebdriverIO.Browser
    let agent: AgentSession

    const click = async (name: string) => {
        const { text } = await agent.snapshot({ interactive: true })
        const ref = text.match(new RegExp(`button "${name}" \\[ref=(e\\d+)\\]`))?.[1]
        expect(ref).toBeDefined()
        return agent.run('click', { target: ref })
    }

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
        agent = await createAgentSession(browser)
        await browser.url(`${server.url}/changes.html`)
    }, 60_000)

    afterAll(async () => {
        await agent?.dispose()
        await browser?.deleteSession()
        await server?.close()
    })

    it('reports the closed cookie banner, not the carousel', async () => {
        const result = await click('Reject All')
        expect(result.text).toContain('Closed region "Cookie banner"')
        expect(result.text).not.toMatch(/slide/i)
        expect(result.noVisibleChange).toBeFalsy()
        expect(result.changes).toMatchObject({ kind: 'changed' })
        expect(result.changes?.kind === 'changed' && result.changes.added).toContain('Closed region "Cookie banner"')
    })

    it('reports the dialog a click opened before the state of the button', async () => {
        const result = await click('Add To Basket')
        const lines = result.text!.split('\n')
        const opened = lines.findIndex((line) => line.startsWith('Opened dialog "Item added!"'))
        expect(opened).toBeGreaterThan(-1)
        expect(result.text).toMatch(/link "Continue to Checkout" \[ref=e\d+\]/)
        const state = lines.findIndex((line) => line.includes('button "Add To Basket"') && line.includes('[disabled]'))
        expect(state === -1 || state > opened).toBe(true)
        expect(result.changes?.kind === 'changed' && result.changes.added[0]).toMatch(/^Opened dialog "Item added!"/)
    })

    it('does not list the carousel when nothing else changed', async () => {
        const result = await click('Do nothing')
        expect(result.text).not.toMatch(/Go to slide|Slide \d+ of/)
        expect(result.noVisibleChange === true || result.changes?.kind === 'changed' && result.changes.added.includes('Carousel moved')).toBe(true)
    })
})
