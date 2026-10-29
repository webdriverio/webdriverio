import { describe, expect, it, vi } from 'vitest'

import { alternativeSelectors, replaySteps, roleSelector, type EffectCheck } from '../src/replay.js'
import type { StepEffect } from '../src/effects.js'
import type { ActStep } from '../src/types.js'
import { fakeAgent } from './__fixtures__/agent.js'

const steps: ActStep[] = [
    { action: 'fill', args: { target: '#email', text: '{{email}}' }, code: 'await $(\'#email\').setValue(\'{{email}}\')' },
    { action: 'click', args: { target: 'role/button[name="Sign in"]' }, code: 'await $(\'role/button[name="Sign in"]\').click()' }
]

function withBrowser (agent: ReturnType<typeof fakeAgent>['agent'], waitForExist = vi.fn().mockResolvedValue(true)) {
    const $ = vi.fn(() => ({ waitForExist }))
    Object.assign(agent.browser, { $ })
    return { $, waitForExist }
}

describe('replaySteps', () => {
    it('waits for each target, then runs the step with the values substituted', async () => {
        const { agent, run } = fakeAgent()
        const { $, waitForExist } = withBrowser(agent)
        const result = await replaySteps(agent, steps, { email: 'alice@example.com' }, 3000)

        expect(result).toEqual({ done: steps, healed: [] })
        expect($).toHaveBeenNthCalledWith(1, '#email')
        expect($).toHaveBeenNthCalledWith(2, 'role/button[name="Sign in"]')
        expect(waitForExist).toHaveBeenCalledWith({ timeout: 3000 })
        expect(run).toHaveBeenNthCalledWith(1, 'fill', { target: '#email', text: 'alice@example.com' })
        expect(run).toHaveBeenNthCalledWith(2, 'click', { target: 'role/button[name="Sign in"]' })
    })

    it('stops at the first step that fails and reports it', async () => {
        const { agent, run } = fakeAgent()
        withBrowser(agent, vi.fn()
            .mockResolvedValueOnce(true)
            .mockRejectedValueOnce(new Error('element ("role/button[name="Sign in"]") still not existing after 3000ms')))
        const result = await replaySteps(agent, steps, { email: 'alice@example.com' }, 3000)

        expect(result.done).toEqual([steps[0]])
        expect(result.failed).toEqual({ step: steps[1], index: 1, error: 'element ("role/button[name="Sign in"]") still not existing after 3000ms' })
        expect(run).toHaveBeenCalledTimes(1)
    })

    it('runs a step without a target right away', async () => {
        const { agent, run } = fakeAgent()
        const { $ } = withBrowser(agent)
        await replaySteps(agent, [{ action: 'press', args: { keys: 'Enter' }, code: 'await browser.keys(\'Enter\')' }], {}, 3000)
        expect($).not.toHaveBeenCalled()
        expect(run).toHaveBeenCalledWith('press', { keys: 'Enter' })
    })

    it('waits for targets in the frame the session holds and not for frame keywords', async () => {
        const { agent, run } = fakeAgent()
        const page = withBrowser(agent)
        const waitForExist = vi.fn().mockResolvedValue(true)
        const frame = { $: vi.fn(() => ({ waitForExist })) }
        Object.assign(agent, { scope: frame })
        await replaySteps(agent, [
            { action: 'click', args: { target: 'role/button[name="Pay now"]' }, code: 'await frame.$(\'role/button[name="Pay now"]\').click()' },
            { action: 'frame', args: { target: 'top' }, code: '' }
        ], {}, 3000)
        expect(frame.$).toHaveBeenCalledTimes(1)
        expect(frame.$).toHaveBeenCalledWith('role/button[name="Pay now"]')
        expect(page.$).not.toHaveBeenCalled()
        expect(run).toHaveBeenNthCalledWith(2, 'frame', { target: 'top' })
    })
})

describe('healing without the model', () => {
    const recorded: ActStep = {
        action: 'click',
        args: { target: '[data-testid="add"]' },
        code: 'await $(\'[data-testid="add"]\').click()',
        target: { selector: '[data-testid="add"]', role: 'button', name: 'Add to cart', candidates: ['[data-testid="add"]', 'aria/Add to cart', '#add'] }
    }

    it('lists the other candidates and then role and name', () => {
        expect(alternativeSelectors(recorded)).toEqual(['aria/Add to cart', '#add', 'role/button[name="Add to cart"]'])
        expect(alternativeSelectors({ ...recorded, target: undefined })).toEqual([])
        expect(roleSelector('button', 'Say "hi" \\ bye')).toBe('role/button[name="Say \\"hi\\" \\\\ bye"]')
    })

    it('skips positional css-path candidates while keeping stable selectors', () => {
        const withPositional: ActStep = {
            ...recorded,
            target: {
                selector: 'role/button[name="Pay now"]',
                role: 'button',
                name: 'Pay now',
                candidates: [
                    'role/button[name="Pay now"]',
                    'button',
                    'my-button',
                    'main > button',
                    'main > button:nth-of-type(2)',
                    '[data-testid="cart"] > button',
                    '#checkout > div:nth-of-type(1) > button:nth-of-type(2)',
                    '#\\31 cart > button',
                    '#add',
                    'a=Home > Products',
                    'button.primary',
                    'button[type="submit"]',
                    'input[name="email"]',
                    '[aria-label="Close"]',
                    '//button[contains(., "Pay now")]'
                ]
            }
        }
        expect(alternativeSelectors(withPositional)).toEqual([
            '#add',
            'a=Home > Products',
            'button.primary',
            'button[type="submit"]',
            'input[name="email"]',
            '[aria-label="Close"]',
            '//button[contains(., "Pay now")]'
        ])
    })

    it('does not heal with a positional css-path candidate that matches an unrelated element (#15932)', async () => {
        const payStep: ActStep = {
            action: 'click',
            args: { target: 'role/button[name="Pay now"]' },
            code: 'await $(\'role/button[name="Pay now"]\').click()',
            target: {
                selector: 'role/button[name="Pay now"]',
                role: 'button',
                name: 'Pay now',
                candidates: [
                    'role/button[name="Pay now"]',
                    'aria/Pay now',
                    'button=Pay now',
                    'button',
                    'main > button:nth-of-type(2)',
                    '[data-testid="cart"] > button'
                ]
            }
        }
        const { agent, run, matches, waitForExist } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('button', 1)
        matches.set('main > button:nth-of-type(2)', 1)
        matches.set('[data-testid="cart"] > button', 1)

        const failedResult = await replaySteps(agent, [payStep], {}, 100)
        expect(failedResult.healed).toEqual([])
        expect(failedResult.failed).toMatchObject({ index: 0, error: 'still not existing' })
        expect(run).not.toHaveBeenCalled()

        const movedStep: ActStep = {
            ...payStep,
            args: { target: '[data-testid="pay"]' },
            code: 'await $(\'[data-testid="pay"]\').click()',
            target: {
                selector: '[data-testid="pay"]',
                role: 'button',
                name: 'Pay now',
                candidates: ['[data-testid="pay"]', 'main > button']
            }
        }
        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('main > button', 1)
        matches.set('role/button[name="Pay now"]', 1)

        const healedResult = await replaySteps(agent, [movedStep], {}, 100)
        expect(healedResult.failed).toBeUndefined()
        expect(healedResult.healed).toEqual([{ index: 0, from: '[data-testid="pay"]', to: 'role/button[name="Pay now"]' }])
        expect(run).toHaveBeenCalledWith('click', { target: 'role/button[name="Pay now"]' })
    })

    it('runs the step with the first alternative that matches exactly one element', async () => {
        const { agent, run, matches, waitForExist } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('aria/Add to cart', 2)
        matches.set('#add', 1)

        const result = await replaySteps(agent, [recorded], {}, 100)

        expect(result.failed).toBeUndefined()
        expect(result.healed).toEqual([{ index: 0, from: '[data-testid="add"]', to: '#add' }])
        expect(result.done[0]).toEqual({
            ...recorded,
            args: { target: '#add' },
            code: 'await $(\'#add\').click()',
            target: { ...recorded.target, selector: '#add' }
        })
        expect(run).toHaveBeenLastCalledWith('click', { target: '#add' })
    })

    it('finds the element by role and name when every recorded selector is gone', async () => {
        const { agent, matches, waitForExist } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('role/button[name="Add to cart"]', 1)

        const result = await replaySteps(agent, [recorded], {}, 100)
        expect(result.healed).toEqual([{ index: 0, from: '[data-testid="add"]', to: 'role/button[name="Add to cart"]' }])
    })

    it('tells the heal hooks when a step fails and when its heal ran, not while steps replay fine', async () => {
        const { agent, matches, waitForExist } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        const calls: string[] = []
        const hooks = { begin: async () => { calls.push('begin') }, after: async () => { calls.push('after') } }

        await replaySteps(agent, [recorded], {}, 100, undefined, hooks)
        expect(calls).toEqual([])

        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('#add', 1)
        await replaySteps(agent, [recorded], {}, 100, undefined, hooks)
        expect(calls).toEqual(['begin', 'after'])
    })

    it('does not run a step of a scoped call on an element outside the scope, and heals inside it', async () => {
        const { agent, run, matches } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        const contains = agent.contains as unknown as ReturnType<typeof vi.fn>
        contains.mockImplementation(async (_scope: string, target: string) => target === '#add')
        matches.set('#add', 1)

        const result = await replaySteps(agent, [recorded], {}, 100, undefined, undefined, 'e100')
        expect(contains).toHaveBeenCalledWith('e100', '[data-testid="add"]')
        expect(result.healed).toEqual([{ index: 0, from: '[data-testid="add"]', to: '#add' }])
        expect(run).toHaveBeenCalledTimes(1)
        expect(run).toHaveBeenCalledWith('click', { target: '#add' })
    })

    it('reports the step as failed when no alternative matches exactly one element', async () => {
        const { agent, run, matches, waitForExist } = fakeAgent()
        waitForExist.mockRejectedValueOnce(new Error('still not existing'))
        matches.set('role/button[name="Add to cart"]', 3)

        const result = await replaySteps(agent, [recorded], {}, 100)
        expect(result.healed).toEqual([])
        expect(result.failed).toMatchObject({ index: 0, error: 'still not existing' })
        expect(run).not.toHaveBeenCalled()
    })
})

describe('effect checks during replay', () => {
    const CART: StepEffect = { requests: ['POST /api/cart → 2xx'] }
    const step: ActStep = {
        action: 'click',
        args: { target: '[data-testid="add"]' },
        code: 'await $(\'[data-testid="add"]\').click()',
        target: { selector: '[data-testid="add"]', role: 'button', name: 'Add to cart', candidates: ['[data-testid="add"]'] },
        effect: CART
    }
    const recorder = (...effects: StepEffect[]): EffectCheck => ({
        mode: 'strict',
        recorder: { bidi: true, start: vi.fn(), settle: vi.fn(async () => effects.shift() ?? {}), cancel: vi.fn(), unsettled: [] as string[] } as unknown as EffectCheck['recorder']
    })

    it('does not run the step when its test ended while the effect recording started', async () => {
        const { agent, run } = fakeAgent()
        const check = recorder(CART)
        let started: () => void = () => {}
        vi.mocked(check.recorder.start).mockImplementationOnce(() => new Promise<void>((resolve) => { started = resolve }))
        const test = new AbortController()
        const replay = replaySteps(agent, [step], {}, 100, check, undefined, undefined, test.signal)
        await vi.waitFor(() => expect(check.recorder.start).toHaveBeenCalled())

        test.abort(new Error('the test ended'))
        started()

        await expect(replay).rejects.toThrow('the test ended')
        expect(run).not.toHaveBeenCalled()
        expect(check.recorder.cancel).toHaveBeenCalled()
    })

    it('does not start the effect recording when its test ended while it waited for the element', async () => {
        const { agent, run } = fakeAgent()
        let appear: () => void = () => {}
        withBrowser(agent, vi.fn(() => new Promise((resolve) => { appear = () => resolve(true) })))
        const check = recorder(CART)
        const test = new AbortController()
        const replay = replaySteps(agent, [step], {}, 100, check, undefined, undefined, test.signal)
        await vi.waitFor(() => expect(agent.browser.$).toHaveBeenCalled())

        test.abort(new Error('the test ended'))
        appear()

        await expect(replay).rejects.toThrow('the test ended')
        expect(check.recorder.start).not.toHaveBeenCalled()
        expect(run).not.toHaveBeenCalled()
    })

    it('reports a step still running at the timeout as such, not as a behavior change, and waits at least the wait timeout', async () => {
        const { agent, run } = fakeAgent()
        const check = recorder({})
        Object.assign(check.recorder, { unsettled: ['POST /api/cart'] })
        const result = await replaySteps(agent, [step], {}, 8000, check)
        expect(check.recorder.settle).toHaveBeenCalledWith({ timeout: 8000 })
        expect(result.failed).toEqual({
            step,
            index: 0,
            error: 'the step was still running after 8000ms (POST /api/cart), so its effect could not be checked',
            kind: 'timeout'
        })
        expect(run).toHaveBeenCalledTimes(1)
    })

    it('accepts a replayed step that has its recorded effect', async () => {
        const { agent } = fakeAgent()
        const result = await replaySteps(agent, [step], {}, 100, recorder({ requests: ['POST /api/cart → 2xx', 'GET /api/stock → 2xx'] }))
        expect(result.failed).toBeUndefined()
    })

    it('fails a step that ran but did something else, without trying other selectors', async () => {
        const { agent, $$ } = fakeAgent()
        const result = await replaySteps(agent, [step], {}, 100, recorder({ requests: ['POST /api/wishlist → 2xx'] }))
        expect(result.failed).toEqual({ step, index: 0, error: 'the step no longer causes POST /api/cart → 2xx', kind: 'effect' })
        expect($$).not.toHaveBeenCalled()
    })

    it('rejects an alternative selector whose element does something else, and tries no further one', async () => {
        const { agent, run, waitForExist, matches } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        waitForExist.mockRejectedValueOnce(new Error('not existing'))
        matches.set('#add-to-wishlist', 1)
        matches.set('role/button[name="Add to cart"]', 1)
        const withCandidates = { ...step, target: { ...step.target!, candidates: ['[data-testid="add"]', '#add-to-wishlist'] } }

        const result = await replaySteps(agent, [withCandidates], {}, 100, recorder({ requests: ['POST /api/wishlist → 2xx'] }, CART))
        expect(result.healed).toEqual([])
        expect(result.failed).toEqual({
            step: withCandidates,
            index: 0,
            error: 'the step ran on #add-to-wishlist, which does not cause POST /api/cart → 2xx',
            kind: 'effect',
            healedWith: '#add-to-wishlist'
        })
        expect(run).toHaveBeenCalledTimes(1)
    })

    it('accepts an alternative selector whose element has the recorded effect', async () => {
        const { agent, waitForExist, matches } = fakeAgent((action, args) => action === 'click' ? { code: `await $('${args.target}').click()` } : undefined)
        waitForExist.mockRejectedValueOnce(new Error('not existing'))
        matches.set('role/button[name="Add to cart"]', 1)
        const result = await replaySteps(agent, [step], {}, 100, recorder(CART))
        expect(result.healed).toEqual([{ index: 0, from: '[data-testid="add"]', to: 'role/button[name="Add to cart"]' }])
        expect(result.done[0].effect).toEqual(CART)
    })

    it('only checks navigation and changed regions on a Classic session', async () => {
        const { agent } = fakeAgent()
        const classic: EffectCheck = {
            mode: 'strict',
            recorder: { bidi: false, start: vi.fn(), settle: vi.fn(async () => ({ changed: ['status "Cart"'] })), unsettled: [] } as unknown as EffectCheck['recorder']
        }
        const withRegion = { ...step, effect: { requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'] } }
        expect((await replaySteps(agent, [withRegion], {}, 100, classic)).failed).toBeUndefined()

        const missingRegion = { ...step, effect: { requests: ['POST /api/cart → 2xx'], changed: ['status "Wishlist"'] } }
        expect((await replaySteps(agent, [missingRegion], {}, 100, classic)).failed?.kind).toBe('effect')
    })
})

