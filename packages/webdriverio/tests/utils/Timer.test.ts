import { describe, it, beforeEach, expect, vi } from 'vitest'
import Timer from '../../src/utils/Timer.js'

vi.useFakeTimers()

/**
 * to enfored time advancements after an initial timeout callback
 * has been triggered we need to force the eventloop to tick once
 */
const tick = async () => new Promise<void>((resolve) => resolve())
const triggerDelay = async (times = 4, interval = 10) => {
    for (let i = 0; i < times; ++i) {
        vi.advanceTimersByTime(interval)
        await tick()
    }
}

describe('timer', () => {
    const processEmitSpy = vi.spyOn(process, 'emit')

    describe('promise', () => {
        it('should be rejected by timeout', async () => {
            const timer = new Timer(20, 30, () => Promise.resolve(false))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('timeout') as any as Record<string, unknown>)
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be fulfilled when resolved with true value', async () => {
            const timer = new Timer(20, 30, () => Promise.resolve(true))
            await triggerDelay()
            await expect(timer).resolves
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should not be fulfilled when resolved with false value', async () => {
            const timer = new Timer(20, 30, () => Promise.resolve(false))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('timeout') as any as Record<string, unknown>)
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be rejected', async () => {
            const timer = new Timer(20, 30, () => Promise.reject(new Error('err')))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('err') as any as Record<string, unknown>)
        })

        it('should be rejected without promise', async () => {
            const timer = new Timer(20, 30, () => 0)
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('return value was never truthy') as any as Record<string, unknown>)
        })

        it('should be fulfilled without promise', async () => {
            const timer = new Timer(20, 30, () => 'foobar')
            await triggerDelay()
            expect(await timer).toBe('foobar')
        })
    })

    it('should execute condition at least once', async () => {
        let wasExecuted = false
        const timer = new Timer(100, 200, () => new Promise((resolve) =>
            setTimeout(() => {
                wasExecuted = true
                resolve(true)
            }, 500)
        ))

        await triggerDelay(6, 100)
        await expect(timer).resolves
        await expect(wasExecuted).toBeTruthy
    })

    beforeEach(() => {
        processEmitSpy.mockClear()
    })
})
