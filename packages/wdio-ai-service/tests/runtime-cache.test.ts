import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActError } from '../src/errors.js'
import { AiRuntime, type RuntimeOptions } from '../src/runtime.js'
import { ScriptedChatModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
const CLICK = 'await $(\'role/button[name="Add to cart"]\').click()'

describe('AiRuntime cache', () => {
    let dir: string
    let spec: string
    let fake: ReturnType<typeof fakeAgent>

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-cache-'))
        spec = path.join(dir, 'test', 'cart.e2e.ts')
        fake = fakeAgent((action) => action === 'click' ? { text: 'Clicked', code: CLICK } : undefined)
        fake.setRef({ id: 'e3', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]'] })
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true })
    })

    const cacheFile = () => path.join(dir, 'test', '__act__', 'cart.e2e.ts.json')
    const readCache = () => JSON.parse(fs.readFileSync(cacheFile(), 'utf-8'))
    const recordScript: ScriptStep[] = [
        { tool: 'click', args: { target: 'e3' } },
        { tool: 'done', args: { summary: 'Added it' } }
    ]
    const runtime = (options: RuntimeOptions = {}, script: ScriptStep[] = recordScript) => {
        const model = new ScriptedChatModel(script)
        return { model, runtime: new AiRuntime({ model, cache: 'write', ...options }) }
    }

    it('records the steps of a test and writes them to the cache file next to the spec', async () => {
        const { runtime: ai } = runtime()
        ai.startTest(spec, 'cart adds a shirt')
        await ai.act(browser, 'Add the shirt to the cart')
        await ai.flush()

        const written = readCache()
        expect(written.version).toBe(1)
        expect(written.entries['cart adds a shirt › #1']).toMatchObject({
            instruction: 'Add the shirt to the cart',
            platform: 'web',
            model: 'ScriptedChatModel',
            steps: [{
                action: 'click',
                args: { target: 'role/button[name="Add to cart"]' },
                code: CLICK,
                target: { selector: 'role/button[name="Add to cart"]', role: 'button', name: 'Add to cart' }
            }]
        })
    })

    it('replays cached steps without calling the model', async () => {
        const first = runtime()
        first.runtime.startTest(spec, 'cart adds a shirt')
        await first.runtime.act(browser, 'Add the shirt to the cart')
        await first.runtime.flush()

        fake.run.mockClear()
        const second = runtime({}, [])
        second.runtime.startTest(spec, 'cart adds a shirt')
        const result = await second.runtime.act(browser, 'Add the shirt to the cart')

        expect(result).toEqual({ source: 'cache', steps: [{ action: 'click', code: CLICK }] })
        expect(second.model.calls).toHaveLength(0)
        expect(fake.run).toHaveBeenCalledWith('click', { target: 'role/button[name="Add to cart"]' })
    })

    it('counts act calls per test, so two calls in one test get two entries', async () => {
        const { runtime: ai } = runtime({}, [...recordScript, ...recordScript])
        ai.startTest(spec, 'cart adds two items')
        await ai.act(browser, 'Add the shirt')
        await ai.act(browser, 'Add the socks')
        ai.endTest()
        await ai.flush()
        expect(Object.keys(readCache().entries)).toEqual(['cart adds two items › #1', 'cart adds two items › #2'])
    })

    it('records again when the instruction of a cached call changed', async () => {
        const first = runtime()
        first.runtime.startTest(spec, 'cart')
        await first.runtime.act(browser, 'Add the shirt')
        await first.runtime.flush()

        const second = runtime()
        second.runtime.startTest(spec, 'cart')
        const result = await second.runtime.act(browser, 'Add the blue shirt')
        await second.runtime.flush()
        expect(result.source).toBe('model')
        expect(second.model.calls.length).toBeGreaterThan(0)
        expect(readCache().entries['cart › #1'].instruction).toBe('Add the blue shirt')
    })

    it('asks the model to continue from the step that failed and stores the healed steps', async () => {
        const first = runtime()
        first.runtime.startTest(spec, 'cart')
        await first.runtime.act(browser, 'Add the shirt')
        await first.runtime.flush()

        fake.waitForExist.mockRejectedValueOnce(new Error('element ("role/button[name="Add to cart"]") still not existing after 100ms'))
        const NEW_CLICK = 'await $(\'role/button[name="Add to bag"]\').click()'
        fake.run.mockImplementation(async (action: string) => action === 'click' ? { text: 'Clicked', code: NEW_CLICK } : { text: `${action} ok` })
        fake.setRef({ id: 'e9', role: 'button', name: 'Add to bag', candidates: ['role/button[name="Add to bag"]'] })
        const second = runtime({}, [{ tool: 'click', args: { target: 'e9' } }, { tool: 'done', args: { summary: 'Added it with the renamed button' } }])
        second.runtime.startTest(spec, 'cart')
        const result = await second.runtime.act(browser, 'Add the shirt')
        await second.runtime.flush()

        expect(result).toMatchObject({ source: 'model', healed: 'model', steps: [{ action: 'click', code: NEW_CLICK }] })
        expect(second.model.sentText()).toContain('Step 1 failed: ' + CLICK)
        expect(readCache().entries['cart › #1'].steps[0].code).toBe(NEW_CLICK)
    })

    it('never calls the model in locked mode', async () => {
        const { runtime: ai, model } = runtime({ cache: 'locked' })
        ai.startTest(spec, 'cart')
        const error = await ai.act(browser, 'Add the shirt').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toBe('no cached steps for "cart › #1" and the cache is locked')
        expect(model.calls).toHaveLength(0)
    })

    it('fails in locked mode when a cached step fails', async () => {
        const first = runtime()
        first.runtime.startTest(spec, 'cart')
        await first.runtime.act(browser, 'Add the shirt')
        await first.runtime.flush()

        fake.waitForExist.mockRejectedValueOnce(new Error('not existing'))
        const locked = runtime({ cache: 'locked' }, [])
        locked.runtime.startTest(spec, 'cart')
        await expect(locked.runtime.act(browser, 'Add the shirt'))
            .rejects.toThrow(`cached step 1 (${CLICK}) failed and the cache is locked: not existing`)
        expect(locked.model.calls).toHaveLength(0)
    })

    it('writes recorded entries to <outputDir>/act-cache in heal mode and leaves the cache file alone', async () => {
        const outputDir = path.join(dir, 'logs')
        const { runtime: ai } = runtime({ cache: 'heal', outputDir })
        ai.startTest(spec, 'cart')
        await ai.act(browser, 'Add the shirt')
        await ai.flush()
        expect(fs.existsSync(cacheFile())).toBe(false)
        const healed = JSON.parse(fs.readFileSync(path.join(outputDir, 'act-cache', 'cart.e2e.ts.json'), 'utf-8'))
        expect(healed.entries['cart › #1'].instruction).toBe('Add the shirt')
    })

    it('records every call again with updateSnapshots: all', async () => {
        const first = runtime()
        first.runtime.startTest(spec, 'cart')
        await first.runtime.act(browser, 'Add the shirt')
        await first.runtime.flush()

        const again = runtime({ updateSnapshots: 'all' })
        again.runtime.startTest(spec, 'cart')
        const result = await again.runtime.act(browser, 'Add the shirt')
        expect(result.source).toBe('model')
        expect(again.model.calls.length).toBeGreaterThan(0)
    })

    it('neither reads nor writes the cache when it is off or outside a test', async () => {
        const off = runtime({ cache: 'off' })
        off.runtime.startTest(spec, 'cart')
        await off.runtime.act(browser, 'Add the shirt')
        await off.runtime.flush()

        const standalone = runtime()
        await standalone.runtime.act(browser, 'Add the shirt')
        await standalone.runtime.flush()
        expect(fs.existsSync(cacheFile())).toBe(false)
    })

    it('replays with the values of this run', async () => {
        fake.run.mockImplementation(async (action: string, args: Record<string, unknown> = {}) => action === 'fill'
            ? { text: 'Filled', code: `await $('#email').setValue('${args.text}')` }
            : { text: `${action} ok` })
        fake.setRef({ id: 'e1', role: 'textbox', name: 'Email', candidates: ['#email'] })
        const first = runtime({}, [{ tool: 'fill', args: { target: 'e1', text: '{{email}}' } }, { tool: 'done', args: { summary: 'ok' } }])
        first.runtime.startTest(spec, 'login')
        await first.runtime.act(browser, 'Fill in {{email}}', { values: { email: 'first@example.com' } })
        await first.runtime.flush()
        expect(JSON.stringify(readCache())).not.toContain('first@example.com')

        fake.run.mockClear()
        const second = runtime({}, [])
        second.runtime.startTest(spec, 'login')
        await second.runtime.act(browser, 'Fill in {{email}}', { values: { email: 'second@example.com' } })
        expect(fake.run).toHaveBeenCalledWith('fill', { target: '#email', text: 'second@example.com' })
    })
})
