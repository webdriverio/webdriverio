import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { StandardSchemaV1 } from '@standard-schema/spec'

import { ActError } from '../src/errors.js'
import { jsonSchemaOf, validate } from '../src/extract.js'
import { AiRuntime } from '../src/runtime.js'
import { formatSummary } from '../src/stats.js'
import { scriptedModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
const Cart = z.array(z.object({ name: z.string(), qty: z.number() }))

/**
 * a Standard Schema without JSON Schema support
 */
const plainSchema: StandardSchemaV1<unknown, number> = {
    '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value) => typeof value === 'number' ? { value } : { issues: [{ message: 'Expected a number' }] }
    }
}

describe('extract helpers', () => {
    it('describes a schema that supports Standard JSON Schema', () => {
        expect(jsonSchemaOf(Cart)).toMatchObject({ type: 'array', items: { type: 'object', required: ['name', 'qty'] } })
        expect(jsonSchemaOf(plainSchema)).toBeUndefined()
    })

    it('validates a value and names the path of every issue', async () => {
        expect(await validate(Cart, [{ name: 'Shirt', qty: 1 }])).toEqual({ value: [{ name: 'Shirt', qty: 1 }] })
        const result = await validate(Cart, [{ name: 'Shirt', qty: '1' }])
        expect('issues' in result && result.issues).toMatch(/^0\.qty: /)
        expect(await validate(plainSchema, 'x')).toEqual({ issues: 'Expected a number' })
    })
})

describe('AiRuntime.extract', () => {
    let workspace: { dir: string }

    beforeEach(() => {
        workspace = { dir: fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-extract-')) }
        const fake = fakeAgent((action) => action === 'snapshot'
            ? { text: '- row "Shirt 1" [ref=e3]\n- row "Socks 2" [ref=e4]' }
            : undefined)
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    const runtime = (script: ScriptStep[], options = {}) => {
        const model = scriptedModel(script)
        return { model, runtime: new AiRuntime({ effects: 'off', model, workspace, ...options }) }
    }

    it('returns the validated value and only offers tools that read the page', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'snapshot' },
            { tool: 'answer', args: { value: [{ name: 'Shirt', qty: 1 }, { name: 'Socks', qty: 2 }], evidence: ['e3', 'e4'] } }
        ])
        const cart = await ai.extract(browser, 'the cart line items', Cart)

        expect(cart).toEqual([{ name: 'Shirt', qty: 1 }, { name: 'Socks', qty: 2 }])
        expect(model.sentText()).toContain('The value has to match this JSON Schema:')
        expect(model.boundTools).toEqual(expect.arrayContaining(['snapshot', 'get', 'scroll', 'source', 'read_file', 'answer', 'fail']))
        expect(model.boundTools).not.toContain('click')
        expect(model.boundTools).not.toContain('fill')
        expect(ai.records.at(-1)).toMatchObject({ kind: 'extract', instruction: 'the cart line items', evidence: ['e3', 'e4'] })
    })

    it('spends the model call budget of the worker', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'answer', args: { value: [{ name: 'Shirt', qty: 1 }] } },
            { tool: 'answer', args: { value: [{ name: 'Socks', qty: 2 }] } }
        ], { maxModelCalls: 1 })
        await expect(ai.extract(browser, 'the cart line items', Cart)).resolves.toEqual([{ name: 'Shirt', qty: 1 }])
        await expect(ai.extract(browser, 'the cart line items', Cart)).rejects.toThrow('the budget of 1 model calls is used up')
        expect(model.callCount).toBe(1)
    })

    it('lets the model correct an answer the JSON Schema of the answer tool rejects', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'answer', args: { value: [{ name: 'Shirt', qty: 'one' }] } },
            { tool: 'answer', args: { value: [{ name: 'Shirt', qty: 1 }] } }
        ])
        await expect(ai.extract(browser, 'the cart line items', Cart)).resolves.toEqual([{ name: 'Shirt', qty: 1 }])
        expect(model.sentText()).toContain('did not match expected schema')
    })

    it('asks again with the validation issues when a schema without JSON Schema rejects the answer', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'answer', args: { value: '42.00' } },
            { tool: 'answer', args: { value: 42 } }
        ])
        await expect(ai.extract(browser, 'the total', plainSchema)).resolves.toBe(42)
        expect(model.sentText()).toContain('Your previous answer "42.00" did not match the schema: Expected a number. Answer again.')
    })

    it('fails after a second answer that does not match', async () => {
        const { runtime: ai } = runtime([
            { tool: 'answer', args: { value: 'x' } },
            { tool: 'answer', args: { value: 'y' } }
        ])
        const error = await ai.extract(browser, 'the total', plainSchema).catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('the answer did not match the schema')
        expect(ai.records.at(-1)).toMatchObject({ kind: 'extract', error: expect.stringContaining('did not match') })
    })

    it('fails with the reason the model gave when the page does not have the information', async () => {
        const { runtime: ai } = runtime([{ tool: 'fail', args: { reason: 'There is no order total on this page' } }])
        await expect(ai.extract(browser, 'the order total', z.number())).rejects.toThrow('There is no order total on this page')
    })

    it('rejects a schema that is not a Standard Schema', async () => {
        const { runtime: ai } = runtime([])
        await expect(ai.extract(browser, 'the total', { type: 'number' } as unknown as StandardSchemaV1))
            .rejects.toThrow('extract() needs a Standard Schema')
    })

    it('counts extract calls separately in the summary', () => {
        const summary = formatSummary([
            { instruction: 'a', source: 'cache', usage: { input: 0, output: 0 }, durationMs: 1 },
            { kind: 'extract', instruction: 'b', source: 'model', usage: { input: 1000, output: 100 }, durationMs: 1 }
        ])
        expect(summary).toBe('@wdio/ai-service: 1 act call · 1 from cache · 0 healed without the model · 0 healed by the model · 0 recorded by the model · 1 extract call · 1.1k tokens')
    })
})
