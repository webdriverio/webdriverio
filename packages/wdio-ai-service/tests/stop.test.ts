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

    it('runs the steps of a call one after the other', async () => {
        const gate = new StepGate()
        const order: string[] = []
        let finish: () => void = () => {}
        const first = gate.step(async () => {
            order.push('first starts')
            await new Promise<void>((resolve) => { finish = resolve })
            order.push('first ends')
        })
        const second = gate.step(async () => { order.push('second starts') })
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(order).toEqual(['first starts'])

        finish()
        await Promise.all([first, second])
        expect(order).toEqual(['first starts', 'first ends', 'second starts'])
    })

    it('does not start a queued step once the test ended', async () => {
        const test = new AbortController()
        const gate = new StepGate(test.signal)
        let finish: () => void = () => {}
        const first = gate.step(() => new Promise<string>((resolve) => { finish = () => resolve('clicked') }))
        let ran = false
        const second = gate.step(async () => { ran = true })

        test.abort(new TestEndedError('pays'))
        finish()

        expect(await first).toBe('clicked')
        await expect(second).rejects.toThrow('the test "pays" ended before the call finished')
        expect(ran).toBe(false)
        expect(gate.loopSignal?.aborted).toBe(true)
    })

    it('closes at once when no step runs', async () => {
        await expect(new StepGate().close()).resolves.toBeUndefined()
    })

    it('closes once the running step ended and starts no step after', async () => {
        const gate = new StepGate()
        let finish: () => void = () => {}
        const step = gate.step(() => new Promise<string>((resolve) => { finish = () => resolve('clicked') }))
        let closed = false
        const closing = gate.close().then(() => { closed = true })

        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(closed).toBe(false)
        await expect(gate.step(async () => 'late')).rejects.toThrow('the call already ended')
        finish()
        await closing
        expect(await step).toBe('clicked')
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
