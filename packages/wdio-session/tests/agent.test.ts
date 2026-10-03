import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAgentSession } from '../src/agent.js'

function mockBrowser (overrides: Record<string, unknown> = {}) {
    return {
        capabilities: { browserName: 'chrome' },
        isBidi: true,
        sessionSubscribe: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
        deleteSession: vi.fn(),
        getUrl: vi.fn().mockResolvedValue('https://example.com/shop'),
        ...overrides
    } as unknown as WebdriverIO.Browser
}

describe('createAgentSession', () => {
    const dirs: string[] = []
    const tmp = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-agent-test-'))
        dirs.push(dir)
        return dir
    }

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('wraps a browser it does not own and keeps the history in memory', async () => {
        const artifactsDir = tmp()
        const browser = mockBrowser()
        const agent = await createAgentSession(browser, { artifactsDir })

        expect(agent.browser).toBe(browser)
        expect(agent.session.plan).toMatchObject({ target: 'agent', detach: true, platform: 'browser', label: 'chrome' })
        agent.session.history.append({ kind: 'action', code: 'await $(\'#a\').click()' })
        expect(agent.history.map((entry) => entry.code)).toEqual(['await $(\'#a\').click()'])
        expect(fs.existsSync(path.join(artifactsDir, 'history.json'))).toBe(false)
    })

    it('creates a temporary artifacts directory when none is given', async () => {
        const agent = await createAgentSession(mockBrowser())
        dirs.push(agent.session.artifactsDir)
        expect(fs.existsSync(agent.session.artifactsDir)).toBe(true)
        expect(agent.session.artifactsDir.startsWith(os.tmpdir())).toBe(true)
    })

    it('lists the actions that apply to the platform', async () => {
        const web = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        const names = web.actions.map((spec) => spec.name)
        expect(names).toEqual(expect.arrayContaining(['click', 'fill', 'snapshot', 'navigate']))
        expect(names).not.toContain('tap')
        expect(names).not.toContain('swipe')

        const android = await createAgentSession(mockBrowser({
            capabilities: { platformName: 'Android' },
            isBidi: false
        }), { artifactsDir: tmp() })
        const mobile = android.actions.map((spec) => spec.name)
        expect(mobile).toEqual(expect.arrayContaining(['tap', 'swipe']))
        expect(mobile).not.toContain('navigate')
    })

    it('runs actions through the session dispatcher and returns their code', async () => {
        const agent = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        const dispatch = vi.spyOn(agent.session, 'dispatch').mockResolvedValue({ text: 'Clicked e3', code: 'await $(\'#buy\').click()' })
        await expect(agent.run('click', { target: 'e3' })).resolves.toEqual({ text: 'Clicked e3', code: 'await $(\'#buy\').click()' })
        expect(dispatch).toHaveBeenCalledWith({ action: 'click', args: { target: 'e3' }, cwd: agent.session.cwd })
    })

    it('looks up refs with or without the @ prefix', async () => {
        const agent = await createAgentSession(mockBrowser(), { artifactsDir: tmp() })
        agent.session.refs.set({ id: 'e3', kind: 'web', role: 'button', name: 'Buy', candidates: ['role/button[name="Buy"]'], generation: 1 })
        expect(agent.ref('e3')?.name).toBe('Buy')
        expect(agent.ref('@e3')?.candidates).toEqual(['role/button[name="Buy"]'])
        expect(agent.ref('e99')).toBeUndefined()
    })

    it('captures console and network events only when asked', async () => {
        const quiet = mockBrowser()
        await createAgentSession(quiet, { artifactsDir: tmp() })
        expect(quiet.sessionSubscribe).not.toHaveBeenCalled()

        const capturing = mockBrowser()
        await createAgentSession(capturing, { artifactsDir: tmp(), captureEvents: true })
        expect(capturing.sessionSubscribe).toHaveBeenCalledWith({
            events: ['log.entryAdded', 'network.beforeRequestSent', 'network.responseCompleted', 'network.fetchError']
        })
    })

    it('stops capturing on dispose and leaves the browser session open', async () => {
        const browser = mockBrowser()
        const agent = await createAgentSession(browser, { artifactsDir: tmp(), captureEvents: true })
        await agent.dispose()
        expect(browser.off).toHaveBeenCalledWith('log.entryAdded', expect.any(Function))
        expect(browser.deleteSession).not.toHaveBeenCalled()
    })

    it('pins an element as a ref the session can resolve', async () => {
        const execute = vi.fn().mockResolvedValue(undefined)
        const agent = await createAgentSession(mockBrowser({ execute }), { artifactsDir: tmp() })
        const element = { elementId: 'el-1', selector: '#products' } as unknown as WebdriverIO.Element
        const first = await agent.pin(element)
        const second = await agent.pin(element)
        expect(first).toMatch(/^e\d+$/)
        expect(second).not.toBe(first)
        expect(execute).toHaveBeenCalledWith(expect.any(Function), element, first)
        expect(agent.ref(first)).toMatchObject({ id: first, kind: 'web', role: 'scope', candidates: ['#products'] })
    })
})
