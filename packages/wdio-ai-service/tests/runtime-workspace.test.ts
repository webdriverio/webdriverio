import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AiRuntime } from '../src/runtime.js'
import { ScriptedChatModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser

describe('AiRuntime workspace', () => {
    let dir: string
    let fake: ReturnType<typeof fakeAgent>

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-rws-'))
        fake = fakeAgent((action) => {
            if (action === 'snapshot') {
                return { text: '- button "Add to cart" [ref=e3]' }
            }
            if (action === 'click') {
                return { text: 'Clicked', code: 'await $(\'#add\').click()' }
            }
        })
        fake.setRef({ id: 'e3', role: 'button', name: 'Add to cart', candidates: ['#add'] })
        Object.assign(fake.agent, {
            logs: [{ seq: 1, time: 1, level: 'warn', source: 'console', text: 'stock is low' }],
            network: [{ seq: 1, time: 1, method: 'GET', url: 'https://shop.example/api/stock', status: 200, failed: false }]
        })
        Object.assign(fake.agent.browser, { getPageSource: vi.fn().mockResolvedValue('<html><button data-qa="add">Add to cart</button></html>') })
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true })
    })

    const runtime = (script: ScriptStep[], options = {}) => {
        const model = new ScriptedChatModel(script)
        return { model, runtime: new AiRuntime({ effects: 'off', model, cache: 'off', workspace: { dir }, ...options }) }
    }
    let testDir: string
    beforeEach(() => {
        testDir = path.join(dir, '0', 'cart.e2e.ts', 'cart-adds-a-shirt')
    })

    it('lets the model read the evidence of the test and tells it about the workspace', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'snapshot' },
            { tool: 'read_file', args: { file_path: '/console.ndjson' } },
            { tool: 'source' },
            { tool: 'grep', args: { pattern: 'data-qa' } },
            { tool: 'click', args: { target: 'e3' } },
            { tool: 'done', args: { summary: 'ok' } }
        ], { workspace: { dir, keep: 'always' } })
        ai.startTest('/project/test/cart.e2e.ts', 'cart adds a shirt')
        await ai.act(browser, 'Add the shirt')

        const sent = model.sentText()
        expect(sent).toContain('Files of this test are in a read-only workspace')
        expect(sent).toContain('stock is low')
        expect(sent).toContain('Saved the page HTML (55 characters) to /page.html')
        expect(sent).toContain('page.html')
        expect(fs.readFileSync(path.join(testDir, 'snapshots', '001.txt'), 'utf-8')).toBe('- button "Add to cart" [ref=e3]')
        expect(JSON.parse(fs.readFileSync(path.join(testDir, 'steps.json'), 'utf-8'))[0].code).toBe('await $(\'#add\').click()')
        await ai.endTest(true)
        expect(fs.existsSync(testDir)).toBe(true)
    })

    it('deletes the folder of a passing test and keeps the one of a failing act', async () => {
        const passing = runtime([{ tool: 'snapshot' }, { tool: 'done', args: { summary: 'ok' } }])
        passing.runtime.startTest('/project/test/cart.e2e.ts', 'cart adds a shirt')
        await passing.runtime.act(browser, 'Add the shirt')
        expect(fs.existsSync(testDir)).toBe(true)
        await passing.runtime.endTest(true)
        expect(fs.existsSync(testDir)).toBe(false)

        const failing = runtime([{ tool: 'snapshot' }, { tool: 'fail', args: { reason: 'no shirt' } }])
        failing.runtime.startTest('/project/test/cart.e2e.ts', 'cart adds a shirt')
        const error = await failing.runtime.act(browser, 'Add the shirt').catch((err) => err)
        expect(error.workspace).toBe(testDir)
        expect(error.message).toContain(`Evidence: ${testDir}`)
        await failing.runtime.endTest(true)
        expect(fs.existsSync(path.join(testDir, 'snapshots', '001.txt'))).toBe(true)
    })

    it('keeps the folder when the test failed after act', async () => {
        const { runtime: ai } = runtime([{ tool: 'done', args: { summary: 'ok' } }])
        ai.startTest('/project/test/cart.e2e.ts', 'cart adds a shirt')
        await ai.act(browser, 'Add the shirt')
        await ai.endTest(false)
        expect(fs.existsSync(testDir)).toBe(true)
    })

    it('creates no folder when no model was called', async () => {
        const { runtime: ai } = runtime([], { cache: 'locked' })
        ai.startTest('/project/test/cart.e2e.ts', 'cart adds a shirt')
        await ai.act(browser, 'Add the shirt').catch(() => {})
        await ai.endTest(false)
        expect(fs.existsSync(testDir)).toBe(false)
    })
})
