import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ActError } from '../src/errors.js'
import { AiRuntime, browserOf } from '../src/runtime.js'
import { ScriptedChatModel } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', capabilities: { browserName: 'chrome' } } as unknown as WebdriverIO.Browser

function setup (responses?: Parameters<typeof fakeAgent>[0]) {
    const fake = fakeAgent(responses)
    createAgentSession.mockResolvedValue(fake.agent)
    return fake
}

describe('AiRuntime.act', () => {
    beforeEach(() => {
        createAgentSession.mockReset()
    })

    it('lets the model perform the instruction and returns the steps it recorded', async () => {
        const { run, setRef } = setup((action) => {
            if (action === 'snapshot') {
                return { text: '- button "Add to cart" [ref=e3]' }
            }
            if (action === 'click') {
                return { text: 'Clicked e3', code: 'await $(\'role/button[name="Add to cart"]\').click()' }
            }
        })
        setRef({ id: 'e3', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]'] })
        const model = new ScriptedChatModel([
            { tool: 'snapshot' },
            { tool: 'click', args: { target: 'e3' } },
            { tool: 'done', args: { summary: 'Added the shirt to the cart' } }
        ])
        const runtime = new AiRuntime({ model })

        const result = await runtime.act(browser, 'Add the shirt to the cart')

        expect(result).toEqual({
            source: 'model',
            steps: [{ action: 'click', code: 'await $(\'role/button[name="Add to cart"]\').click()' }],
            summary: 'Added the shirt to the cart'
        })
        expect(run.mock.calls.map(([action]) => action)).toEqual(['snapshot', 'click', 'diff'])
        expect(model.calls).toHaveLength(3)
        expect(model.sentText()).toContain('Instruction: Add the shirt to the cart')
        expect(runtime.modelCalls).toBe(3)
    })

    it('never sends placeholder values to the model', async () => {
        const { run, setRef } = setup((action, args) => {
            if (action === 'snapshot') {
                return { text: '- textbox "Email" [ref=e1] value=alice@example.com' }
            }
            if (action === 'fill') {
                return { text: `Filled e1 with ${args.text}`, code: `await $('#email').setValue('${args.text}')` }
            }
        })
        setRef({ id: 'e1', role: 'textbox', name: 'Email', candidates: ['#email'] })
        const model = new ScriptedChatModel([
            { tool: 'snapshot' },
            { tool: 'fill', args: { target: 'e1', text: '{{email}}' } },
            { tool: 'done', args: { summary: 'Filled the email' } }
        ])
        const runtime = new AiRuntime({ model })

        const result = await runtime.act(browser, 'Fill in {{email}}', { values: { email: 'alice@example.com' } })

        expect(run).toHaveBeenCalledWith('fill', { target: 'e1', text: 'alice@example.com' })
        expect(model.sentText()).not.toContain('alice@example.com')
        expect(model.sentText()).toContain('{{email}}')
        expect(result.steps[0].code).toBe('await $(\'#email\').setValue(\'{{email}}\')')
    })

    it('rejects an instruction with a placeholder that has no value, before calling the model', async () => {
        setup()
        const model = new ScriptedChatModel([])
        await expect(new AiRuntime({ model }).act(browser, 'Log in as {{user}}')).rejects.toThrow('No value for {{user}}')
        expect(model.calls).toHaveLength(0)
    })

    it('throws an ActError with the reason when the model calls fail', async () => {
        setup()
        const model = new ScriptedChatModel([
            { tool: 'snapshot' },
            { tool: 'fail', args: { reason: 'There is no blue shirt on this page' } }
        ])
        const error = await new AiRuntime({ model }).act(browser, 'Add a blue shirt').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.message).toBe('act("Add a blue shirt") failed: There is no blue shirt on this page')
        expect(error.usage).toEqual({ input: 200, output: 20 })
    })

    it('stops at the step limit', async () => {
        setup()
        const model = new ScriptedChatModel(Array.from({ length: 10 }, () => ({ tool: 'snapshot' })))
        await expect(new AiRuntime({ model, maxSteps: 2 }).act(browser, 'Loop forever'))
            .rejects.toThrow('stopped after 2 steps without completing the instruction')
    })

    it('accepts a model that answers in text instead of calling done', async () => {
        setup()
        const model = new ScriptedChatModel([{ tool: 'snapshot' }, { text: 'The menu is open now.' }])
        await expect(new AiRuntime({ model }).act(browser, 'Open the menu')).resolves.toMatchObject({ summary: 'The menu is open now.' })
    })

    it('explains how to configure a model when none is set', async () => {
        setup()
        delete process.env.WDIO_AI_MODEL
        await expect(new AiRuntime().act(browser, 'Open the menu'))
            .rejects.toThrow('no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.')
    })

    it('stops calling the model once the budget is used up', async () => {
        setup()
        const runtime = new AiRuntime({ model: new ScriptedChatModel([{ tool: 'done', args: { summary: 'ok' } }]), maxModelCalls: 1 })
        await runtime.act(browser, 'First')
        await expect(runtime.act(browser, 'Second')).rejects.toThrow('the budget of 1 model calls is used up')
    })

    it('appends the project instructions to the system prompt', async () => {
        setup()
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-'))
        const file = path.join(dir, 'agent.md')
        fs.writeFileSync(file, 'Prefer the account menu in the header.')
        const model = new ScriptedChatModel([{ tool: 'done', args: { summary: 'ok' } }])
        await new AiRuntime({ model, instructions: file }).act(browser, 'Log out')
        expect(model.sentText()).toContain('Project conventions:\nPrefer the account menu in the header.')
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('runs on one instance of a multi-remote browser only', async () => {
        await expect(new AiRuntime().act({ isMultiRemote: true } as unknown as WebdriverIO.Browser, 'Open the menu'))
            .rejects.toThrow('act() runs on one browser. Call it on an instance')
    })

    it('reuses one agent session per browser', async () => {
        setup()
        const runtime = new AiRuntime({ model: new ScriptedChatModel([{ tool: 'done', args: { summary: 'a' } }, { tool: 'done', args: { summary: 'b' } }]) })
        await runtime.act(browser, 'First')
        await runtime.act(browser, 'Second')
        expect(createAgentSession).toHaveBeenCalledTimes(1)
    })
})

describe('browserOf', () => {
    it('finds the browser of an element chain and of a browsing context', () => {
        const element = { parent: { parent: browser } } as unknown as WebdriverIO.Element
        const context = { contextId: 'ctx', browser } as unknown as WebdriverIO.BrowsingContext
        expect(browserOf(browser)).toBe(browser)
        expect(browserOf(element)).toBe(browser)
        expect(browserOf(context)).toBe(browser)
    })
})
