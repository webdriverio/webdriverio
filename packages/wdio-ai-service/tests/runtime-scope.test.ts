import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { AiRuntime } from '../src/runtime.js'
import { ScriptedChatModel } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser

describe('scoped act and extract', () => {
    let fake: ReturnType<typeof fakeAgent>
    let workspace: { dir: string }

    beforeEach(() => {
        workspace = { dir: fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-scope-')) }
        fake = fakeAgent((action) => action === 'snapshot' ? { text: '- textbox "Street" [ref=e101]' } : undefined)
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
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
        await new AiRuntime({ effects: 'off', model, workspace, cache: 'off' }).act(form, 'Fill in a German address')

        expect(fake.agent.pin).toHaveBeenCalledWith(form)
        const snapshots = fake.run.mock.calls.filter(([action]) => action === 'snapshot')
        expect(snapshots).toEqual([['snapshot', { scope: 'e100' }], ['snapshot', { interactive: true, scope: 'e100' }]])
        expect(fake.run).toHaveBeenCalledWith('diff', { scope: 'e100', interactive: true })
        expect(model.sentText()).toContain('The instruction is about one part of the page')
    })

    it('limits extract to the element too', async () => {
        const row = { elementId: 'row-2', selector: '#row-2', parent: browser } as unknown as WebdriverIO.Element
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { tool: 'answer', args: { value: 'Socks' } }])
        await expect(new AiRuntime({ effects: 'off', model, workspace }).extract(row, 'the product name', z.string())).resolves.toBe('Socks')
        expect(fake.run).toHaveBeenCalledWith('snapshot', { scope: 'e100' })
    })

    it('does not scope a browser act', async () => {
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { tool: 'done', args: { summary: 'ok' } }])
        await new AiRuntime({ effects: 'off', model, workspace, cache: 'off' }).act(browser, 'Open the menu')
        expect(fake.agent.pin).not.toHaveBeenCalled()
        expect(fake.agent.enter).not.toHaveBeenCalled()
        expect(fake.run.mock.calls.filter(([action]) => action === 'snapshot')).toEqual([['snapshot', {}]])
    })

    it('runs a call on a held frame or tab inside it and goes back afterwards', async () => {
        const leave = vi.fn(async () => {})
        vi.mocked(fake.agent.enter).mockResolvedValue(leave)
        const frame = { contextId: 'frame-1', browser, isFrame: true } as unknown as WebdriverIO.BrowsingContext
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { tool: 'done', args: { summary: 'paid' } }, { tool: 'snapshot' }, { tool: 'answer', args: { value: 'Paid' } }])
        const ai = new AiRuntime({ effects: 'off', model, workspace, cache: 'off' })

        await ai.act(frame, 'Pay')
        expect(fake.agent.enter).toHaveBeenCalledWith(frame)
        expect(leave).toHaveBeenCalledTimes(1)

        await expect(ai.extract(frame, 'the status', z.string())).resolves.toBe('Paid')
        expect(leave).toHaveBeenCalledTimes(2)
    })

    it('goes back to the previous context when the call fails', async () => {
        const leave = vi.fn(async () => {})
        vi.mocked(fake.agent.enter).mockResolvedValue(leave)
        const tab = { contextId: 'tab-2', browser, isFrame: false } as unknown as WebdriverIO.BrowsingContext
        const model = new ScriptedChatModel([{ tool: 'fail', args: { reason: 'no such button' } }])
        await expect(new AiRuntime({ effects: 'off', model, workspace, cache: 'off' }).act(tab, 'Pay')).rejects.toThrow('no such button')
        expect(leave).toHaveBeenCalledTimes(1)
    })
})
