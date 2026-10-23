import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { AiRuntime, type RuntimeOptions } from '../src/runtime.js'
import type { ActError } from '../src/errors.js'
import { Workspace } from '../src/workspace.js'
import { scriptedModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
const PAY = 'await $(\'role/button[name="Pay now"]\').click()'
const CONFIRM = 'await $(\'role/button[name="Confirm"]\').click()'
const ENDED = 'ended before the call finished'

/**
 * A test framework stops waiting for a test at its timeout, but it cannot
 * stop the `act()` call of that test. The call has to stop by itself, or it
 * keeps clicking in the page of the next test.
 */
describe('AiRuntime when a test ends during act()', () => {
    let dir: string
    let spec: string
    let fake: ReturnType<typeof fakeAgent>
    let release: () => void

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-test-end-'))
        spec = path.join(dir, 'test', 'pay.e2e.ts')
        fake = fakeAgent((action, args) => action === 'click'
            ? { text: `Clicked ${args.target}`, code: String(args.target).includes('Confirm') || args.target === 'e4' ? CONFIRM : PAY }
            : undefined)
        fake.setRef({ id: 'e3', role: 'button', name: 'Pay now', candidates: ['role/button[name="Pay now"]'] })
        fake.setRef({ id: 'e4', role: 'button', name: 'Confirm', candidates: ['role/button[name="Confirm"]'] })
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    afterEach(() => {
        release?.()
        vi.restoreAllMocks()
        fs.rmSync(dir, { recursive: true, force: true })
    })

    const script: ScriptStep[] = [
        { tool: 'click', args: { target: 'e3' } },
        { tool: 'click', args: { target: 'e4' } },
        { tool: 'done', args: { summary: 'Paid' } }
    ]
    const runtime = (options: RuntimeOptions = {}, steps: ScriptStep[] = script) => {
        const model = scriptedModel(steps)
        return { model, runtime: new AiRuntime({ effects: 'off', model, workspace: { dir: path.join(dir, 'workspaces') }, ...options }) }
    }
    const clicks = () => fake.run.mock.calls.filter(([action]) => action === 'click').map(([, args]) => args?.target)

    /**
     * the next click waits until `release()`, like a slow browser
     */
    function holdNextClick () {
        const original = fake.run.getMockImplementation()!
        const gate = new Promise<void>((resolve) => { release = resolve })
        fake.run.mockImplementationOnce(async (action, args) => {
            await gate
            return original(action, args)
        })
    }

    /**
     * the first action that matches waits until `release()`
     */
    function hold (match: (action: string, args: Record<string, unknown>) => boolean) {
        const original = fake.run.getMockImplementation()!
        const gate = new Promise<void>((resolve) => { release = resolve })
        let held = false
        fake.run.mockImplementation(async (action, args = {}) => {
            if (!held && match(action, args)) {
                held = true
                await gate
            }
            return original(action, args)
        })
    }

    /**
     * the agent of the first call is created once `ready()` is called
     */
    function holdAgent () {
        let ready: () => void = () => {}
        createAgentSession.mockReset().mockImplementation(() => new Promise((resolve) => { ready = () => resolve(fake.agent) }))
        return () => ready()
    }

    const actions = () => fake.run.mock.calls.map(([action, args]) => ['click', 'frame'].includes(action) ? `${action} ${args?.target}` : action)

    async function record (title = 'pays', options = {}) {
        const recorder = runtime({ cache: 'write' })
        recorder.runtime.startTest(spec, title)
        await recorder.runtime.act(browser, 'Pay', options)
        await recorder.runtime.flush()
        fake.run.mockClear()
    }

    it('stops a cached replay before its next step', async () => {
        await record()
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        ai.startTest(spec, 'confirms')
        release()

        await expect(stale).rejects.toThrow('the test "pays" ended before the call finished')
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(clicks()).toEqual(['role/button[name="Pay now"]'])
    })

    it('does not heal a cached step that failed after its test ended', async () => {
        await record()
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        let fail: (err: Error) => void = () => {}
        fake.waitForExist.mockImplementationOnce(() => new Promise((_, reject) => { fail = reject }))
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(fake.waitForExist).toHaveBeenCalled())

        await ai.endTest(false)
        fail(new Error('element ("role/button[name="Pay now"]") still not existing after 100ms'))

        await expect(stale).rejects.toThrow('the test "pays" ended before the call finished')
        expect(fake.$$).not.toHaveBeenCalled()
        expect(clicks()).toEqual([])
    })

    it('stops the model loop and makes no more model calls', async () => {
        const { runtime: ai, model } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow('the test "pays" ended before the call finished')
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(clicks()).toEqual(['e3'])
        expect(model.calls).toHaveLength(1)
    })

    it('lets the action in flight finish, then goes back to the top document before the next call', async () => {
        const { runtime: ai } = runtime({ cache: 'off' }, [...script, ...script])
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay').catch((err: Error) => err)
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        ai.startTest(spec, 'pays again')
        const next = ai.act(browser, 'Pay again')
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(fake.run.mock.calls.map(([action]) => action)).toEqual(['click'])

        release()
        expect(await stale).toBeInstanceOf(Error)
        await next
        expect(fake.run.mock.calls.map(([action, args]) => action === 'frame' ? `frame ${args?.target}` : action))
            .toEqual(['click', 'diff', 'frame top', 'click', 'diff'])
    })

    it('does not leave the frame when the test ends after its calls', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        await ai.act(browser, 'Pay')
        await ai.endTest(true)
        expect(fake.run).not.toHaveBeenCalledWith('frame', { target: 'top' })
    })

    it('records the stopped call as an error', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))
        await ai.endTest(false)
        release()
        await stale.catch(() => {})
        expect(ai.records.at(-1)).toMatchObject({ test: 'pays', instruction: 'Pay', error: expect.stringContaining('ended before the call finished') })
    })

    it('runs the calls on one browser one after the other', async () => {
        const { runtime: ai } = runtime({ cache: 'off' }, [...script, ...script])
        ai.startTest(spec, 'pays twice')
        holdNextClick()
        const first = ai.act(browser, 'Pay')
        const second = ai.act(browser, 'Pay again')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(clicks()).toEqual(['e3'])

        release()
        await Promise.all([first, second])
        expect(clicks()).toEqual(['e3', 'e4', 'e3', 'e4'])
    })

    it('counts the model calls and tokens of a stopped call', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(ai.modelCalls).toBe(1)
        expect(ai.records.at(-1)?.usage.input).toBeGreaterThan(0)
    })

    it('does not call the model when the test ended while the call was set up', async () => {
        const ready = holdAgent()
        const { runtime: ai, model } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(createAgentSession).toHaveBeenCalled())

        await ai.endTest(false)
        ready()

        await expect(stale).rejects.toThrow(ENDED)
        expect(model.calls).toHaveLength(0)
        expect(clicks()).toEqual([])
    })

    it('does not count a call of the ended test as a call of the next test', async () => {
        await record('confirms')
        const ready = holdAgent()
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(createAgentSession).toHaveBeenCalled())

        await ai.endTest(false)
        ai.startTest(spec, 'confirms')
        const next = ai.act(browser, 'Pay')
        ready()

        await expect(stale).rejects.toThrow(ENDED)
        await expect(next).resolves.toMatchObject({ source: 'cache' })
        expect(ai.records.map(({ test, error }) => [test, Boolean(error)])).toEqual([['pays', true], ['confirms', false]])
    })

    it('stops a cached replay whose last step ended after the test', async () => {
        await record()
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        hold((action, args) => action === 'click' && String(args.target).includes('Confirm'))
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(2))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(actions()).toEqual(['click role/button[name="Pay now"]', 'click role/button[name="Confirm"]', 'frame top'])
    })

    it('stops a model continuation of a failed cached step', async () => {
        await record()
        const { runtime: ai, model } = runtime({ cache: 'heal' })
        ai.startTest(spec, 'pays')
        fake.waitForExist.mockRejectedValueOnce(new Error('element ("role/button[name="Pay now"]") still not existing after 100ms'))
        hold((action) => action === 'click')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toEqual(['e3']))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(clicks()).toEqual(['e3'])
        expect(model.calls).toHaveLength(1)
    })

    it('stops the model loop while it waits for the model', async () => {
        const { runtime: ai, model } = runtime({ cache: 'off' })
        /**
         * `bindTools` copies the model, so the second request is held on the prototype
         */
        const proto = Object.getPrototypeOf(model) as { _generate: (...args: unknown[]) => Promise<unknown> }
        const generate = proto._generate
        let answer: () => void = () => {}
        const answered = new Promise<void>((resolve) => { answer = resolve })
        const spy = vi.spyOn(proto, '_generate').mockImplementation(async function (this: unknown, ...args: unknown[]) {
            if (model.calls.length === 1) {
                await answered
            }
            return generate.apply(this, args)
        })
        try {
            ai.startTest(spec, 'pays')
            const stale = ai.act(browser, 'Pay').catch((err: Error) => err)
            await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(2))

            await ai.endTest(false)
            const result = await Promise.race([stale, new Promise((resolve) => setTimeout(() => resolve('still waiting for the model'), 200))])
            answer()

            expect(result).toMatchObject({ message: expect.stringContaining(ENDED) })
            await stale
            expect(clicks()).toEqual(['e3'])
        } finally {
            answer()
            spy.mockRestore()
        }
    })

    it('does not go back to the top document on a native app', async () => {
        (fake.agent.session as { plan: object }).plan = { applies: ['A'], platform: 'android', label: 'Android' }
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(actions()).not.toContain('frame top')
    })

    it('goes back to the top document before it leaves a held frame', async () => {
        const order: string[] = []
        fake.agent.enter = vi.fn(async () => async () => { order.push('leave') }) as typeof fake.agent.enter
        const frame = { browser, contextId: 'frame-1', isFrame: true } as unknown as WebdriverIO.BrowsingContext
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const held = fake.run.getMockImplementation()!
        fake.run.mockImplementation(async (action, args = {}) => {
            order.push(action === 'frame' ? `frame ${args.target}` : action)
            return held(action, args)
        })
        const stale = ai.act(frame, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(order).toEqual(['click', 'diff', 'frame top', 'leave'])
        expect(fake.agent.enter).toHaveBeenCalledWith(frame)
    })

    it('fails with the test end when going back to the top document fails', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        const original = fake.run.getMockImplementation()!
        fake.run.mockImplementation(async (action, args = {}) => {
            if (action === 'frame') {
                throw new Error('no such window')
            }
            return original(action, args)
        })
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(actions()).toContain('frame top')
    })

    it('does not run a queued call of the ended test', async () => {
        await record('pays', { id: 'pay' })
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const first = ai.act(browser, 'Pay', { id: 'pay' })
        const second = ai.act(browser, 'Pay', { id: 'pay' })
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        await expect(first).rejects.toThrow(ENDED)
        await expect(second).rejects.toThrow(ENDED)
        expect(actions()).toEqual(['click role/button[name="Pay now"]', 'frame top'])
    })

    it('does not make a call on another browser wait', async () => {
        await record('pays', { id: 'pay' })
        const other = { sessionId: 'def', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
        const { runtime: ai } = runtime({ cache: 'locked' }, [])
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const first = ai.act(browser, 'Pay', { id: 'pay' })
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.act(other, 'Pay', { id: 'pay' })
        expect(clicks()).toHaveLength(3)
        release()
        await first
    })

    it('runs standalone calls (no test) one after the other and never stops them', async () => {
        const { runtime: ai } = runtime({ cache: 'off' }, [...script, ...script])
        hold((action) => action === 'click')
        const first = ai.act(browser, 'Pay')
        const second = ai.act(browser, 'Pay again')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))
        await ai.endTest(false)
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(clicks()).toEqual(['e3'])

        release()
        await Promise.all([first, second])
        expect(clicks()).toEqual(['e3', 'e4', 'e3', 'e4'])
        expect(actions()).not.toContain('frame top')
    })

    /**
     * parallel mode (`parallelMode`) runs the tests of a spec file at the same time,
     * each in the store of its browsing context
     */
    describe('in parallel mode', () => {
        const store = new AsyncLocalStorage<string>()
        const tab = { ...browser, __parallelContextStore: store } as unknown as WebdriverIO.Browser
        const inContext = <T>(contextId: string, fn: () => T) => store.run(contextId, fn)

        it('does not stop the call of a test when another test ends', async () => {
            const { runtime: ai } = runtime({ cache: 'off' })
            ai.startTest(spec, 'pays', 'ctx-a')
            ai.startTest(spec, 'confirms', 'ctx-b')
            hold((action) => action === 'click')
            const call = inContext('ctx-a', () => ai.act(tab, 'Pay'))
            await vi.waitFor(() => expect(clicks()).toHaveLength(1))

            await ai.endTest(true, spec, 'confirms', 'ctx-b')
            release()

            await expect(call).resolves.toMatchObject({ source: 'model' })
            expect(ai.records.at(-1)).toMatchObject({ test: 'pays' })
        })

        it('stops the call of the test that ended, and runs the call of the other test', async () => {
            const { runtime: ai } = runtime({ cache: 'off' }, [...script, ...script])
            ai.startTest(spec, 'pays', 'ctx-a')
            ai.startTest(spec, 'confirms', 'ctx-b')
            hold((action) => action === 'click')
            const stale = inContext('ctx-a', () => ai.act(tab, 'Pay'))
            await vi.waitFor(() => expect(clicks()).toHaveLength(1))
            const next = inContext('ctx-b', () => ai.act(tab, 'Pay again'))

            await ai.endTest(false, spec, 'pays', 'ctx-a')
            release()

            await expect(stale).rejects.toThrow('the test "pays" ended before the call finished')
            await expect(next).resolves.toMatchObject({ source: 'model' })
            expect(ai.records.map(({ test, error }) => [test, Boolean(error)])).toEqual([['pays', true], ['confirms', false]])
        })

        it('tells apart two tests with the same title', async () => {
            const { runtime: ai } = runtime({ cache: 'off' })
            ai.startTest(spec, 'pays', 'ctx-a')
            ai.startTest(spec, 'pays', 'ctx-b')
            hold((action) => action === 'click')
            const call = inContext('ctx-b', () => ai.act(tab, 'Pay'))
            await vi.waitFor(() => expect(clicks()).toHaveLength(1))

            await ai.endTest(true, spec, 'pays', 'ctx-a')
            release()

            await expect(call).resolves.toMatchObject({ source: 'model' })
        })

        it('runs a call of a hook before its test started as a standalone call', async () => {
            const { runtime: ai } = runtime({ cache: 'off' })
            ai.startTest(spec, 'confirms', 'ctx-b')
            hold((action) => action === 'click')
            const call = inContext('ctx-a', () => ai.act(tab, 'Pay'))
            await vi.waitFor(() => expect(clicks()).toHaveLength(1))

            await ai.endTest(true, spec, 'confirms', 'ctx-b')
            release()

            await expect(call).resolves.toMatchObject({ source: 'model' })
            expect(ai.records.at(-1)?.test).toBeUndefined()
        })
    })

    it('keeps the tokens of a call that completed while its test ended', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        const writeSteps = Workspace.prototype.writeSteps
        let written: () => void = () => {}
        const held = new Promise<void>((resolve) => { written = resolve })
        vi.spyOn(Workspace.prototype, 'writeSteps').mockImplementationOnce(async function (this: Workspace, steps) {
            await held
            return writeSteps.call(this, steps)
        })
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(Workspace.prototype.writeSteps).toHaveBeenCalled())

        await ai.endTest(false)
        written()

        await expect(stale).rejects.toThrow(ENDED)
        expect(clicks()).toEqual(['e3', 'e4'])
        expect(ai.records.at(-1)?.usage.input).toBeGreaterThan(0)
    })

    it('keeps the steps and the evidence of a stopped call in its error', async () => {
        const { runtime: ai } = runtime({ cache: 'off' })
        ai.startTest(spec, 'pays')
        holdNextClick()
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        release()

        const error = await stale.catch((err: ActError) => err)
        expect(error.message).toContain(ENDED)
        expect(error.message).toContain(`Evidence: ${path.join(dir, 'workspaces')}`)
        expect(error.steps).toHaveLength(1)
        expect(ai.records.at(-1)?.error).toContain('Evidence:')
    })

    it('does not leave a deleted workspace behind', async () => {
        const { runtime: ai } = runtime({ cache: 'off', workspace: { dir: path.join(dir, 'workspaces'), keep: 'never' } })
        ai.startTest(spec, 'pays')
        hold((action) => action === 'click')
        const stale = ai.act(browser, 'Pay')
        await vi.waitFor(() => expect(clicks()).toHaveLength(1))

        await ai.endTest(false)
        ai.startTest(spec, 'confirms')
        release()

        await expect(stale).rejects.toThrow(ENDED)
        expect(fs.existsSync(path.join(dir, 'workspaces', '0', 'pay.e2e.ts', 'pays'))).toBe(false)
    })
})

describe('AiRuntime when a test ends during extract()', () => {
    let dir: string
    let spec: string
    let fake: ReturnType<typeof fakeAgent>
    let release: () => void = () => {}

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-test-end-'))
        spec = path.join(dir, 'test', 'cart.e2e.ts')
        fake = fakeAgent((action) => action === 'snapshot' ? { text: '- row "Shirt 1" [ref=e3]' } : undefined)
        createAgentSession.mockReset().mockResolvedValue(fake.agent)
    })

    afterEach(() => {
        release()
        fs.rmSync(dir, { recursive: true, force: true })
    })

    const runtime = (steps: ScriptStep[]) => {
        const model = scriptedModel(steps)
        return { model, runtime: new AiRuntime({ effects: 'off', model, workspace: { dir: path.join(dir, 'workspaces') } }) }
    }

    it('stops a read, records the error, and the next act() waits for it', async () => {
        const { runtime: ai, model } = runtime([
            { tool: 'snapshot' },
            { tool: 'click', args: { target: 'e3' } },
            { tool: 'done', args: { summary: 'Removed' } }
        ])
        const original = fake.run.getMockImplementation()!
        const gate = new Promise<void>((resolve) => { release = resolve })
        fake.run.mockImplementationOnce(async (action, args) => {
            await gate
            return original(action, args)
        })
        ai.startTest(spec, 'reads the qty')
        const stale = ai.extract(browser, 'the qty', z.number())
        await vi.waitFor(() => expect(fake.run).toHaveBeenCalledWith('snapshot', expect.anything()))

        await ai.endTest(false)
        ai.startTest(spec, 'removes the shirt')
        const next = ai.act(browser, 'Remove the shirt', { cache: 'off' })
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(fake.run.mock.calls.map(([action]) => action)).toEqual(['snapshot'])
        release()

        await expect(stale).rejects.toThrow(ENDED)
        await expect(next).resolves.toMatchObject({ summary: 'Removed' })
        expect(fake.run.mock.calls.map(([action, args]) => action === 'frame' ? `frame ${args?.target}` : action)).toEqual(['snapshot', 'frame top', 'click', 'diff'])
        expect(model.calls).toHaveLength(3)
        expect(ai.records.map(({ kind, test, error }) => [kind ?? 'act', test, Boolean(error)])).toEqual([['extract', 'reads the qty', true], ['act', 'removes the shirt', false]])
    })

    it('does not call the model when the test ended while the read was set up', async () => {
        let ready: () => void = () => {}
        createAgentSession.mockReset().mockImplementation(() => new Promise((resolve) => { ready = () => resolve(fake.agent) }))
        const { runtime: ai, model } = runtime([{ tool: 'answer', args: { value: 1 } }])
        ai.startTest(spec, 'reads the qty')
        const stale = ai.extract(browser, 'the qty', z.number())
        await vi.waitFor(() => expect(createAgentSession).toHaveBeenCalled())

        await ai.endTest(false)
        ready()

        await expect(stale).rejects.toThrow(ENDED)
        expect(model.calls).toHaveLength(0)
    })

    it('reads for the test of its browsing context in parallel mode', async () => {
        const store = new AsyncLocalStorage<string>()
        const tab = { ...browser, __parallelContextStore: store } as unknown as WebdriverIO.Browser
        const { runtime: ai } = runtime([{ tool: 'snapshot' }, { tool: 'answer', args: { value: 1 } }])
        const original = fake.run.getMockImplementation()!
        const gate = new Promise<void>((resolve) => { release = resolve })
        fake.run.mockImplementationOnce(async (action, args) => {
            await gate
            return original(action, args)
        })
        ai.startTest(spec, 'reads the qty', 'ctx-a')
        ai.startTest(spec, 'removes the shirt', 'ctx-b')
        const read = store.run('ctx-a', () => ai.extract(tab, 'the qty', z.number()))
        await vi.waitFor(() => expect(fake.run).toHaveBeenCalledWith('snapshot', expect.anything()))

        await ai.endTest(true, spec, 'removes the shirt', 'ctx-b')
        release()

        await expect(read).resolves.toBe(1)
        expect(ai.records.at(-1)).toMatchObject({ kind: 'extract', test: 'reads the qty' })
    })

    it('keeps the evidence of a stopped read in its error', async () => {
        const { runtime: ai } = runtime([{ tool: 'snapshot' }, { tool: 'answer', args: { value: 1 } }])
        const original = fake.run.getMockImplementation()!
        const gate = new Promise<void>((resolve) => { release = resolve })
        fake.run.mockImplementationOnce(async (action, args) => {
            await gate
            return original(action, args)
        })
        ai.startTest(spec, 'reads the qty')
        const stale = ai.extract(browser, 'the qty', z.number())
        await vi.waitFor(() => expect(fake.run).toHaveBeenCalledWith('snapshot', expect.anything()))

        await ai.endTest(false)
        release()

        const error = await stale.catch((err: ActError) => err)
        expect(error.message).toContain(ENDED)
        expect(error.message).toContain(`Evidence: ${path.join(dir, 'workspaces')}`)
        expect(error.usage?.input).toBeGreaterThan(0)
    })
})
