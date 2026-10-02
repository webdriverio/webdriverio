import { describe, expect, it, vi } from 'vitest'

import { replaySteps } from '../src/replay.js'
import type { ActStep } from '../src/types.js'
import { fakeAgent } from './__fixtures__/agent.js'

const steps: ActStep[] = [
    { action: 'fill', args: { target: '#email', text: '{{email}}' }, code: 'await $(\'#email\').setValue(\'{{email}}\')' },
    { action: 'click', args: { target: 'role/button[name="Sign in"]' }, code: 'await $(\'role/button[name="Sign in"]\').click()' }
]

function withBrowser (agent: ReturnType<typeof fakeAgent>['agent'], waitForExist = vi.fn().mockResolvedValue(true)) {
    const $ = vi.fn(() => ({ waitForExist }))
    Object.assign(agent, { browser: { $ } })
    return { $, waitForExist }
}

describe('replaySteps', () => {
    it('waits for each target, then runs the step with the values substituted', async () => {
        const { agent, run } = fakeAgent()
        const { $, waitForExist } = withBrowser(agent)
        const result = await replaySteps(agent, steps, { email: 'alice@example.com' }, 3000)

        expect(result).toEqual({ done: steps })
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
})
