import { setWdioSyncSupport, runFnInFiberContext } from '@wdio/utils'
import Timer from '../../src/utils/Timer'

jest.useFakeTimers()

/**
 * to enfored time advancements after an initial timeout callback
 * has been triggered we need to force the eventloop to tick once
 */
const tick = async () => new Promise((resolve) => resolve())
const triggerDelay = async (times = 4, interval = 10) => {
    for (let i = 0; i < times; ++i) {
        jest.advanceTimersByTime(interval)
        await tick()
    }
}

describe('timer', () => {
    const processEmitSpy = jest.spyOn(process, 'emit')

    describe('promise', () => {
        it('should be rejected by timeout', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(false))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('timeout'))
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be fulfilled when resolved with true value', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(true))
            await triggerDelay()
            await expect(timer).resolves
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should not be fulfilled when resolved with false value', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(false))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('timeout'))
            expect(processEmitSpy).not.toBeCalled()
        })

        it('should be rejected', async () => {
            let timer = new Timer(20, 30, () => Promise.reject(new Error('err')))
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('err'))
        })

        it('should be rejected without promise', async () => {
            let timer = new Timer(20, 30, () => 0)
            await triggerDelay()
            await expect(timer).rejects.toMatchObject(new Error('return value was never truthy'))
        })

        it('should be fulfilled without promise', async () => {
            let timer = new Timer(20, 30, () => 'foobar')
            await triggerDelay()
            expect(await timer).toBe('foobar')
        })

        it('should wrap fn into fibers', async () => {
            global.browser = {}
            setWdioSyncSupport(true)
            runFnInFiberContext.mockReturnValueOnce(() => 'called')
            let timer = new Timer(20, 30, () => 'foobar')
            await triggerDelay()
            expect(await timer).toBe('called')
        })

        afterAll(() => {
            setWdioSyncSupport(false)
            delete global.browser
        })
    })

    it('should execute condition at least once', async () => {
        let wasExecuted = false
        let timer = new Timer(100, 200, () => new Promise((resolve) =>
            setTimeout(() => {
                wasExecuted = true
                resolve(true)
            }, 500)
        ))

        await triggerDelay(6, 100)
        await expect(timer).resolves
        await expect(wasExecuted).toBeTruthy
    })

    it('should execute synchronously', async () => {
        let timer = new Timer(20, 30, () => Promise.resolve(true), () => {return true}, true)
        await triggerDelay()
        await expect(timer).resolves
    })

    describe('emitTimerEvent', () => {
        it('should trigger events', async () => {
            setWdioSyncSupport(true)
            const timer = new Timer(20, 30, () => Promise.resolve(true))
            await triggerDelay()
            await timer
            expect(processEmitSpy).toBeCalledWith('WDIO_TIMER', { id: expect.any(Number), start: true })
            expect(processEmitSpy).toBeCalledWith('WDIO_TIMER', { id: expect.any(Number) })
        })

        it('should trigger timeout event', async () => {
            runFnInFiberContext.mockImplementation((fn) => {
                return function (...args) {
                    return fn(...args)
                }
            })
            try {
                const timer = new Timer(100, 500, () => new Promise((resolve, reject) =>
                    setTimeout(() => {
                        return reject()
                    }, 50)
                ))
                await triggerDelay(6, 100)
                await timer
            } catch (err) {
                // ignored
            }
            expect(processEmitSpy).toBeCalledWith('WDIO_TIMER', { id: expect.any(Number), start: true })
            expect(processEmitSpy).toBeCalledWith('WDIO_TIMER', { id: expect.any(Number), timeout: true })
        })

        afterAll(() => {
            setWdioSyncSupport(false)
        })
    })

    afterEach(() => {
        runFnInFiberContext.mockClear()
        processEmitSpy.mockClear()
    })
})
