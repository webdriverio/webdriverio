import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { AiRuntime } from '../src/runtime.js'
import { ScriptedChatModel } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
const getCurrentContext = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))
vi.mock('webdriverio', () => ({ getContextManager: () => ({ getCurrentContext }) }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser

describe('scoped act and extract', () => {
    let fake: ReturnType<typeof fakeAgent>
    let workspace: { dir: string }

    beforeEach(() => {
        workspace = { dir: fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-scope-')) }
        fake = fakeAgent((action) => action === 'snapshot' ? { text: '- textbox "Street" [ref=e101]' } : undefined)
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
        getCurrentContext.mockReset().mockResolvedValue('top')
    })

    it('limits every snapshot of an element act to that element', async () => {
        const form = { elementId: 'form-1', selector: 'form#shipping', parent: browser } as unknown as WebdriverIO.Element
        fake.run.mockImplementation(async (action: string) => action === 'fill'
            ? { text: 'Filled', code: 'await $(\'#street\').setValue(\'Main St 1\')' }
            : { text: '- textbox "Street" [ref=e101]' })
        const model = new ScriptedChatModel([
            { tool: 'snapshot' },
            { tool: 'snapshot', args: { interactive: true } },
            { tool: 'fill', args: { target: 'e101', text: 'Main St 1' } },
            { tool: 'done', args: { summary: 'ok' } }
        ])
        await new AiRuntime({ model, workspace, cache: 'off' }).act(form, 'Fill in a German address')

        expect(fake.agent.pin).toHaveBeenCalledWith(form)
        const snapshots = fake.run.mock.calls.filter(([action]) => action === 'snapshot')
        expect(snapshots).toEqual([['snapshot', { scope: 'e100' }], ['snapshot', { interactive: true, scope: 'e100' }]])
        expect(fake.run).toHaveBeenCalledWith('diff', { scope: 'e100', interactive: true })
        expect(model.sentText()).toContain('The instruction is about one part of the page')
    })

    it('limits extract to the element too', async () => {
        const row = { elementId: 'row-2', selector: '#row-2', parent: browser } as unknown as WebdriverIO.Element
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { tool: 'answer', args: { value: 'Socks' } }])
        await expect(new AiRuntime({ model, workspace }).extract(row, 'the product name', z.string())).resolves.toBe('Socks')
        expect(fake.run).toHaveBeenCalledWith('snapshot', { scope: 'e100' })
    })

    it('does not scope a browser act or an act on the current tab', async () => {
        const page = { contextId: 'top', browser, isFrame: false } as unknown as WebdriverIO.BrowsingContext
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { tool: 'done', args: { summary: 'ok' } }, { tool: 'snapshot' }, { tool: 'done', args: { summary: 'ok' } }])
        const ai = new AiRuntime({ model, workspace, cache: 'off' })
        await ai.act(browser, 'Open the menu')
        await ai.act(page, 'Open the menu')
        expect(fake.agent.pin).not.toHaveBeenCalled()
        expect(fake.run.mock.calls.filter(([action]) => action === 'snapshot')).toEqual([['snapshot', {}], ['snapshot', {}]])
    })

    it('rejects a frame or a background tab for now', async () => {
        const ai = new AiRuntime({ model: new ScriptedChatModel([]), workspace })
        const frame = { contextId: 'frame-1', browser, isFrame: true } as unknown as WebdriverIO.BrowsingContext
        const tab = { contextId: 'other-tab', browser, isFrame: false } as unknown as WebdriverIO.BrowsingContext
        await expect(ai.act(frame, 'Pay')).rejects.toThrow('act() on a frame or a tab other than the current one is not supported yet')
        await expect(ai.extract(tab, 'the title', z.string())).rejects.toThrow('extract() on a frame or a tab other than the current one')
    })
})
