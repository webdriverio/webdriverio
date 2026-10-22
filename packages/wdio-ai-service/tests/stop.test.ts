import { describe, expect, it } from 'vitest'

import { StepGate, TestEndedError } from '../src/stop.js'

describe('StepGate', () => {
    it('has no loop signal without a test', () => {
        expect(new StepGate().loopSignal).toBeUndefined()
    })

    it('stops the loop at once when the test already ended', () => {
        const ended = AbortSignal.abort(new TestEndedError('pays'))
        const gate = new StepGate(ended)
        expect(gate.loopSignal?.aborted).toBe(true)
        expect(gate.loopSignal?.reason).toBe(ended.reason)
    })

    it('stops the loop only once the running step ended', async () => {
        const test = new AbortController()
        const gate = new StepGate(test.signal)
        let finish: () => void = () => {}
        const step = gate.step(() => new Promise<string>((resolve) => { finish = () => resolve('clicked') }))

        test.abort(new TestEndedError('pays'))
        expect(gate.loopSignal?.aborted).toBe(false)
        finish()
        expect(await step).toBe('clicked')
        expect(gate.loopSignal?.aborted).toBe(true)
    })

    it('does not start a step once the test ended', async () => {
        const test = new AbortController()
        const gate = new StepGate(test.signal)
        test.abort(new TestEndedError('pays'))
        let ran = false
        await expect(gate.step(async () => { ran = true })).rejects.toThrow('the test "pays" ended before the call finished')
        expect(ran).toBe(false)
    })
})
