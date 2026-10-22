import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AiRuntime, type RuntimeOptions } from '../src/runtime.js'
import { scriptedModel, type ScriptStep } from './__fixtures__/scriptedModel.js'
import { fakeAgent } from './__fixtures__/agent.js'

const createAgentSession = vi.hoisted(() => vi.fn())
vi.mock('@wdio/session/agent', () => ({ createAgentSession }))

const browser = { sessionId: 'abc', options: { waitforTimeout: 100 } } as unknown as WebdriverIO.Browser
const PAY = 'await $(\'role/button[name="Pay now"]\').click()'
const CONFIRM = 'await $(\'role/button[name="Confirm"]\').click()'

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

    async function record () {
        const recorder = runtime({ cache: 'write' })
        recorder.runtime.startTest(spec, 'pays')
        await recorder.runtime.act(browser, 'Pay')
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
})
