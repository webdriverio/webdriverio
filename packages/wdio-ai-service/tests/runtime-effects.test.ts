import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActError } from '../src/errors.js'
import { AiRuntime } from '../src/runtime.js'
import { formatSummary } from '../src/stats.js'
import type { StepEffect } from '../src/effects.js'
import { scriptedModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
const effects = vi.hoisted(() => [] as StepEffect[])
const fakeRecorder = vi.hoisted(() => ({ bidi: true, start: vi.fn(), settle: vi.fn(), unsettled: [] as string[] }))
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))
vi.mock('../src/recorder.js', () => ({ EffectRecorder: { attach: vi.fn(async () => fakeRecorder) } }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
const CART: StepEffect = { requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'] }

describe('AiRuntime effects', () => {
    let dir: string
    let spec: string
    let fake: ReturnType<typeof fakeAgent>

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-effects-'))
        spec = path.join(dir, 'cart.e2e.ts')
        effects.length = 0
        fakeRecorder.settle.mockReset().mockImplementation(async () => effects.shift() ?? {})
        fake = fakeAgent((action, args) => action === 'click' ? { text: 'Clicked', code: `await $('${args.target}').click()` } : undefined)
        fake.setRef({ id: 'e3', role: 'button', name: 'Add to cart', candidates: ['role/button[name="Add to cart"]'] })
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true })
    })

    const runtime = (script: ScriptStep[], options = {}) => {
        const model = scriptedModel(script)
        return { model, runtime: new AiRuntime({ model, cache: 'write', workspace: { dir: path.join(dir, 'ws') }, ...options }) }
    }
    const readCache = () => JSON.parse(fs.readFileSync(path.join(dir, '__act__', 'cart.e2e.ts.json'), 'utf-8'))

    async function record () {
        effects.push(CART)
        const first = runtime([{ tool: 'click', args: { target: 'e3' } }, { tool: 'done', args: { summary: 'ok' } }])
        first.runtime.startTest(spec, 'cart')
        await first.runtime.act(browser, 'Add the shirt')
        await first.runtime.flush()
        return first.model
    }

    it('records the effect of every step, tells the model about it and stores it in the cache', async () => {
        const model = await record()
        expect(readCache().entries['cart › #1'].steps[0].effect).toEqual(CART)
        expect(model.sentText()).toContain('Effect: POST /api/cart → 2xx, a change in status "Cart"')
    })

    it('fails in locked mode when a cached step no longer has its effect', async () => {
        await record()
        effects.push({ requests: ['POST /api/wishlist → 2xx'] })
        const locked = runtime([], { cache: 'locked' })
        locked.runtime.startTest(spec, 'cart')
        const error = await locked.runtime.act(browser, 'Add the shirt').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        const code = readCache().entries['cart › #1'].steps[0].code
        expect(error.reason).toBe(`cached step 1 (${code}) ran, but the step no longer causes POST /api/cart → 2xx, a change in status "Cart". The app may have changed behavior, not just markup.`)
    })

    it('fails without calling the model when a cached step ran but did something else, in every mode', async () => {
        await record()
        effects.push({ requests: ['POST /api/wishlist → 2xx'] })
        const writing = runtime([{ tool: 'click', args: { target: 'e3' } }, { tool: 'done', args: { summary: 'clicked again' } }])
        writing.runtime.startTest(spec, 'cart')
        const error = await writing.runtime.act(browser, 'Add the shirt').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('ran, but the step no longer causes POST /api/cart → 2xx')
        expect(writing.model.calls).toHaveLength(0)
        expect(fake.run.mock.calls.filter(([action]) => action === 'click')).toHaveLength(2)
    })

    it('fails without calling the model when a cached step was still running at the timeout', async () => {
        await record()
        effects.push({})
        fakeRecorder.unsettled = ['POST /api/cart']
        try {
            const writing = runtime([{ tool: 'done', args: { summary: 'never' } }])
            writing.runtime.startTest(spec, 'cart')
            const error = await writing.runtime.act(browser, 'Add the shirt').catch((err) => err)
            expect(error).toBeInstanceOf(ActError)
            expect(error.reason).toContain('ran, but the step was still running after 5000ms (POST /api/cart), so its effect could not be checked. Raise `waitforTimeout` if the app is that slow.')
            expect(writing.model.calls).toHaveLength(0)
        } finally {
            fakeRecorder.unsettled = []
        }
    })

    it('fails when the steps the model took to continue do not have the recorded effect', async () => {
        await record()
        fake.waitForExist.mockRejectedValueOnce(new Error('element still not existing'))
        effects.push({ requests: ['POST /api/wishlist → 2xx'] })
        fake.setRef({ id: 'e9', role: 'button', name: 'Wishlist', candidates: ['role/button[name="Wishlist"]'] })
        const healing = runtime([{ tool: 'click', args: { target: 'e9' } }, { tool: 'done', args: { summary: 'clicked the other button' } }])
        healing.runtime.startTest(spec, 'cart')
        const error = await healing.runtime.act(browser, 'Add the shirt').catch((err) => err)
        expect(error).toBeInstanceOf(ActError)
        expect(error.reason).toContain('the app changed behavior: step 1')
        expect(error.reason).toContain('now do not cause POST /api/cart → 2xx, a change in status "Cart"')
        expect(healing.model.sentText()).toContain('When it was recorded, this step caused: POST /api/cart → 2xx, a change in status "Cart". Your steps have to cause the same.')
    })

    it('accepts a model continuation that has the recorded effect', async () => {
        await record()
        fake.waitForExist.mockRejectedValueOnce(new Error('element still not existing'))
        effects.push(CART)
        fake.setRef({ id: 'e9', role: 'button', name: 'Add to bag', candidates: ['role/button[name="Add to bag"]'] })
        const healing = runtime([{ tool: 'click', args: { target: 'e9' } }, { tool: 'done', args: { summary: 'ok' } }])
        healing.runtime.startTest(spec, 'cart')
        await expect(healing.runtime.act(browser, 'Add the shirt')).resolves.toMatchObject({ healed: 'model' })
    })

    it('records how thoroughly effects were checked', async () => {
        await record()
        effects.push(CART)
        const replay = runtime([])
        replay.runtime.startTest(spec, 'cart')
        await replay.runtime.act(browser, 'Add the shirt')
        expect(replay.runtime.records.at(-1)?.effects).toBe('checked')

        fakeRecorder.bidi = false
        effects.push(CART)
        const classic = runtime([])
        classic.runtime.startTest(spec, 'cart')
        await classic.runtime.act(browser, 'Add the shirt')
        expect(classic.runtime.records.at(-1)?.effects).toBe('partial')
        expect(formatSummary(classic.runtime.records)).toContain('Effects were only partly checked for 1 replayed call: WebDriver Classic sessions see navigation and page changes, but not requests, new windows or dialogs.')
        fakeRecorder.bidi = true
    })
})
