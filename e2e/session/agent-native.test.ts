import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { remote } from 'webdriverio'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { startAppiumStub, type AppiumStub } from './stub/appium.js'

/**
 * `@wdio/session/agent` on a native app: the snapshot and the actions run
 * against the Appium stub, no daemon and no device.
 */
describe('@wdio/session/agent on a native app', () => {
    let stub: AppiumStub
    let browser: WebdriverIO.Browser
    let agent: AgentSession

    beforeAll(async () => {
        stub = await startAppiumStub()
        browser = await remote({
            logLevel: 'error',
            hostname: '127.0.0.1',
            port: stub.port,
            path: '/',
            capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2', 'appium:app': 'x.apk' }
        })
        agent = await createAgentSession(browser)
    }, 60_000)

    afterAll(async () => {
        await agent?.dispose()
        await browser?.deleteSession()
        await stub?.close()
    })

    it('takes an interactive snapshot with refs', async () => {
        const snapshot = await agent.snapshot({ interactive: true })
        expect(snapshot.tooBig).toBe(false)
        expect(snapshot.refs).toBeGreaterThan(0)
        expect(snapshot.text).toContain('button "save"')
        expect(snapshot.text).toContain('textbox "Email"')
        expect(snapshot.page).toBeUndefined()
        expect(stub.requests.some((req) => req.method === 'GET' && req.path.endsWith('/source'))).toBe(true)
    })

    it('scopes, cuts to the viewport and adds selectors', async () => {
        const full = await agent.snapshot({ interactive: true })
        const scrollRef = full.text.match(/\[ref=(e\d+)\]/)?.[1]
        expect(scrollRef).toBeDefined()
        const scoped = await agent.snapshot({ scope: scrollRef })
        expect(scoped.lines).toBeLessThanOrEqual(full.lines + 1)

        const viewport = await agent.snapshot({ interactive: true, viewport: true })
        expect(viewport.refs).toBeGreaterThan(0)

        const selectors = await agent.snapshot({ interactive: true, selectors: true })
        expect(selectors.text.length).toBeGreaterThan(full.text.length)
    })

    it('taps a ref and the stub records the click', async () => {
        const { text } = await agent.snapshot({ interactive: true })
        const ref = text.match(/textbox "Email" \[ref=(e\d+)\]/)?.[1]
        expect(ref).toBeDefined()
        const before = stub.requests.length
        const result = await agent.run('click', { target: ref })
        expect(result.code).toBeDefined()
        const sent = stub.requests.slice(before)
        const click = sent.find((req) =>
            req.path.endsWith('/click') ||
            (req.path.endsWith('/execute/sync') && String(req.body?.script || '').includes('click'))
        )
        expect(click, JSON.stringify(sent, null, 2)).toBeTruthy()
    })
})
