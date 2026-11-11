import { describe, it, beforeEach, expect, vi } from 'vitest'
import Timer from '../../src/utils/Timer.js'
import { TIMER_TIMEOUT } from '../../src/utils/errorCodes.js'

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
            await expect(timer).rejects.toMatchObject(new Error('timeout') as unknown as Record<string, unknown>)
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be fulfilled when resolved with true value', async () => {
            const timer = new Timer(20, 30, () => Promise.resolve(true))
            await triggerDelay()
            await expect(timer).resolves
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be rejected', async () => {
            const timer = new Timer(20, 30, () => Promise.reject(new Error('err')))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('err') as unknown as Record<string, unknown>)
        })

        it('should be rejected without promise', async () => {
            const timer = new Timer(20, 30, () => 0)
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('timeout') as unknown as Record<string, unknown>)
        })

        it('should be fulfilled without promise', async () => {
            const timer = new Timer(20, 30, () => 'foobar')
            await triggerDelay()
            expect(await timer).toBe('foobar')
        })

        it('should be rejected as aborted, not as timed out, when a condition without promise is false', async () => {
            const controller = new AbortController()
            const timer = new Timer(10, 100, () => false, false, controller.signal)
            await triggerDelay(1)
            controller.abort()
            await triggerDelay(1)
            const error = await timer.catch((err) => err)
            expect(error.message).toBe('Aborted')
            expect(error).not.toHaveProperty('code')
        })
    })

    describe('when the clock moves to the next millisecond during a check', () => {
        /**
         * a second read of the clock in the same callback gets the next millisecond
         */
        const mockClockStep = () => {
            const fakeNow = Date.now.bind(Date)
            let lastRead: number | undefined
            return vi.spyOn(Date, 'now').mockImplementation(() => {
                const fake = fakeNow()
                const read = fake === lastRead ? fake + 1 : fake
                lastRead = fake
                return read
            })
        }

        it('waits the full timeout for an async condition', async () => {
            const now = mockClockStep()
            try {
                let settled = false
                const timer = new Timer(10, 100, () => Promise.resolve(false), true)
                timer.catch(() => {
                    settled = true
                })

                await vi.advanceTimersByTimeAsync(99)
                expect(settled).toBe(false)
                await vi.advanceTimersByTimeAsync(1)
                expect(settled).toBe(true)
            } finally {
                now.mockRestore()
            }
        })

        it('waits the full timeout for a sync condition', async () => {
            const now = mockClockStep()
            try {
                let error: (Error & { code?: string }) | undefined
                const timer = new Timer(10, 100, () => false, true)
                timer.catch((err) => {
                    error = err
                })

                await vi.advanceTimersByTimeAsync(99)
                expect(error).toBeUndefined()
                await vi.advanceTimersByTimeAsync(1)
                expect(error?.code).toBe(TIMER_TIMEOUT)
            } finally {
                now.mockRestore()
            }
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
