import path from 'node:path'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

import SumoLogicReporter from '../src/index.js'

import logger from '@wdio/logger'

vi.mock('fetch')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.useFakeTimers()
vi.spyOn(global, 'setInterval')
vi.spyOn(global, 'clearInterval')

describe('wdio-sumologic-reporter', () => {
    let reporter: SumoLogicReporter

    beforeEach(() => {
        vi.mocked(fetch).mockReset()
        vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)
        vi.mocked(logger('').error).mockClear()
        vi.mocked(global.clearInterval).mockClear()
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234' })
    })

    afterEach(() => {
        vi.clearAllTimers()
    })

    it('it should start sync when reporter gets initiated', () => {
        expect(setInterval).toHaveBeenCalledTimes(1)
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 100)
    })

    it('should disable itself when sourceAddress is not defined', async () => {
        vi.mocked(logger('').error).mockClear()
        const intervalCalls = vi.mocked(global.setInterval).mock.calls.length
        const invalidReporter = new SumoLogicReporter({})

        invalidReporter.onRunnerStart('onRunnerStart' as any)
        await invalidReporter.sync()

        expect(vi.mocked(global.setInterval).mock.calls).toHaveLength(intervalCalls)
        expect(invalidReporter['_unsynced']).toHaveLength(0)
        expect(invalidReporter.isSynchronised).toBe(true)
        expect(vi.mocked(fetch)).not.toHaveBeenCalled()
        expect(vi.mocked(logger('').error)).toHaveBeenCalledWith(
            'Sumo Logic reporter disabled: a non-empty "sourceAddress" is required'
        )
    })

    it('should push to event bucket for every event', () => {
        expect(reporter['_unsynced']).toHaveLength(0)
        reporter.onRunnerStart('onRunnerStart' as any)
        expect(reporter['_unsynced']).toHaveLength(1)
        expect(reporter['_unsynced'][0]).toContain('"event":"runner:start"')
        expect(reporter['_unsynced'][0]).toContain('"data":"onRunnerStart"')
        reporter.onSuiteStart('onSuiteStart' as any)
        expect(reporter['_unsynced']).toHaveLength(2)
        expect(reporter['_unsynced'][1]).toContain('"event":"suite:start"')
        expect(reporter['_unsynced'][1]).toContain('"data":"onSuiteStart"')
        reporter.onTestStart('onTestStart' as any)
        expect(reporter['_unsynced']).toHaveLength(3)
        expect(reporter['_unsynced'][2]).toContain('"event":"test:start"')
        expect(reporter['_unsynced'][2]).toContain('"data":"onTestStart"')
        reporter.onTestSkip('onTestSkip' as any)
        expect(reporter['_unsynced']).toHaveLength(4)
        expect(reporter['_unsynced'][3]).toContain('"event":"test:skip"')
        expect(reporter['_unsynced'][3]).toContain('"data":"onTestSkip"')
        reporter.onTestPass('onTestPass' as any)
        expect(reporter['_unsynced']).toHaveLength(5)
        expect(reporter['_unsynced'][4]).toContain('"event":"test:pass"')
        expect(reporter['_unsynced'][4]).toContain('"data":"onTestPass"')
        reporter.onTestFail('onTestFail' as any)
        expect(reporter['_unsynced']).toHaveLength(6)
        expect(reporter['_unsynced'][5]).toContain('"event":"test:fail"')
        expect(reporter['_unsynced'][5]).toContain('"data":"onTestFail"')
        reporter.onTestEnd('onTestEnd' as any)
        expect(reporter['_unsynced']).toHaveLength(7)
        expect(reporter['_unsynced'][6]).toContain('"event":"test:end"')
        expect(reporter['_unsynced'][6]).toContain('"data":"onTestEnd"')
        reporter.onSuiteEnd('onSuiteEnd' as any)
        expect(reporter['_unsynced']).toHaveLength(8)
        expect(reporter['_unsynced'][7]).toContain('"event":"suite:end"')
        expect(reporter['_unsynced'][7]).toContain('"data":"onSuiteEnd"')
        reporter.onRunnerEnd('onRunnerEnd' as any)
        expect(reporter['_unsynced']).toHaveLength(9)
        expect(reporter['_unsynced'][8]).toContain('"event":"runner:end"')
        expect(reporter['_unsynced'][8]).toContain('"data":"onRunnerEnd"')
    })

    describe('should not sync if it', () => {
        it('has no data to sync', async () => {
            await reporter.sync()
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
        })

        it('has no source address set up', async () => {
            const invalidReporter = new SumoLogicReporter({})
            invalidReporter.onRunnerStart('onRunnerStart' as any)
            await invalidReporter.sync()
            expect(vi.mocked(fetch).mock.calls).toHaveLength(0)
        })

        it('has an invalidated source address', async () => {
            reporter['_options'].sourceAddress = ''
            reporter.onRunnerStart('onRunnerStart' as any)

            await reporter.sync()

            expect(vi.mocked(fetch)).not.toHaveBeenCalled()
            expect(reporter['_isDisabled']).toBe(true)
            expect(reporter.isSynchronised).toBe(true)
        })
    })

    it('should sync', async () => {
        reporter.onRunnerStart('onRunnerStart' as any)
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200
        } as Response)
        await reporter.sync()

        expect(vi.mocked(fetch).mock.calls).toHaveLength(1)
        expect((vi.mocked(fetch).mock.calls[0][1 as any] as any).method).toBe('POST')
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe('http://localhost:1234')
        expect(JSON.parse((vi.mocked(fetch).mock.calls[0][1 as any] as any).body))
            .toContain('"event":"runner:start","data":"onRunnerStart"')

        expect(reporter['_unsynced']).toHaveLength(0)
    })

    it.each([408, 429, 500])('should retain logs and schedule a retry for transient HTTP %i',
        async (status) => {
            reporter.onRunnerStart('onRunnerStart' as any)

            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                status,
                statusText: 'Request failed'
            } as Response)

            await reporter.sync()

            expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
            expect(reporter['_unsynced']).toHaveLength(1)
            expect(reporter['_retryDelay']).toBe(100)
            expect(reporter['_retryAttempts']).toBe(1)

            await reporter.sync()
            expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)

        }
    )

    it.each([400, 401, 403, 404])('should disable itself for permanent HTTP %i responses', async (status) => {
        reporter.onRunnerStart('onRunnerStart' as any)
        vi.mocked(fetch).mockResolvedValue({ ok: false, status } as Response)

        await reporter.sync()

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
        expect(reporter['_isDisabled']).toBe(true)
        expect(reporter['_unsynced']).toHaveLength(0)
        expect(reporter.isSynchronised).toBe(true)
        expect(vi.mocked(global.clearInterval)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(logger('').error)).toHaveBeenLastCalledWith(
            `failed to send data to Sumo Logic (HTTP ${status}); disabling reporter`
        )

        reporter.onTestStart('not buffered after disable' as any)
        await reporter.sync()
        expect(reporter['_unsynced']).toHaveLength(0)
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('should not expose response details for failed HTTP requests', async () => {
        const responseText = vi.fn().mockResolvedValue('reflected test payload: secret-test-data')
        const collectorSecret = 'collector-secret'
        const payloadSecret = 'test-payload-secret'
        vi.mocked(logger('').error).mockClear()
        reporter = new SumoLogicReporter({ sourceAddress: `http://localhost:1234/${collectorSecret}` })
        reporter.onRunnerStart(payloadSecret as any)
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 400,
            statusText: collectorSecret,
            text: responseText
        } as unknown as Response)

        await reporter.sync()

        const errorMessage = vi.mocked(logger('').error).mock.calls[0][0] as string
        expect(responseText).not.toHaveBeenCalled()
        expect(vi.mocked(logger('').error).mock.calls[0]).toEqual([
            'failed to send data to Sumo Logic (HTTP 400); disabling reporter'
        ])
        expect(errorMessage).not.toContain(collectorSecret)
        expect(errorMessage).not.toContain(payloadSecret)
        expect(errorMessage).not.toContain('secret-test-data')
    })

    it('should log if it fails syncing', async () => {
        const networkErrorSecret = 'network-error-secret'
        vi.mocked(logger('').error).mockClear()
        vi.mocked(fetch).mockRejectedValue(new Error(`network error: ${networkErrorSecret}`))

        reporter.onRunnerStart('onRunnerStart' as any)

        await reporter.sync()

        expect(vi.mocked(logger('').error).mock.calls).toHaveLength(1)
        const errorMessage = vi.mocked(logger('').error).mock.calls[0][0] as string
        expect(vi.mocked(logger('').error).mock.calls[0]).toEqual([
            'failed to send data to Sumo Logic; retrying (1/5)'
        ])
        expect(errorMessage).not.toContain(networkErrorSecret)
    })

    it('should abort and retry a request that never settles', async () => {
        vi.setSystemTime(0)
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234', requestTimeout: 10 })
        reporter.onRunnerStart('onRunnerStart' as any)
        vi.mocked(fetch).mockImplementation((_input, init) => new Promise((_, reject) => {
            const signal = (init as RequestInit | undefined)?.signal
            signal?.addEventListener('abort', () => reject(new Error('timed out')))
        }))

        const syncing = reporter.sync()
        await vi.advanceTimersByTimeAsync(10)
        await syncing

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
        expect(reporter['_retryAttempts']).toBe(1)
        expect(reporter['_isSynchronising']).toBe(false)
        expect(vi.mocked(logger('').error)).toHaveBeenLastCalledWith(
            'failed to send data to Sumo Logic; retrying (1/5)'
        )
    })

    it('should disable after all default retries for timed out requests before the runner timeout', async () => {
        vi.setSystemTime(0)
        reporter.onRunnerStart('onRunnerStart' as any)
        reporter['_stopInterval']()
        vi.mocked(fetch).mockImplementation((_input, init) => new Promise((_, reject) => {
            const signal = (init as RequestInit | undefined)?.signal
            signal?.addEventListener('abort', () => reject(new Error('timed out')))
        }))

        for (const retryDelay of [100, 200, 400, 800, 1000]) {
            const syncing = reporter.sync()
            await vi.advanceTimersByTimeAsync(250)
            await syncing
            await vi.advanceTimersByTimeAsync(retryDelay)
        }

        const syncing = reporter.sync()
        await vi.advanceTimersByTimeAsync(250)
        await syncing

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(6)
        expect(Date.now()).toBe(4000)
        expect(reporter['_isDisabled']).toBe(true)
    })

    it('should disable itself after the configured number of transient failures', async () => {
        vi.setSystemTime(0)
        vi.mocked(fetch).mockRejectedValue(new Error('network error'))
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234', maxRetries: 2 })
        reporter.onRunnerStart('onRunnerStart' as any)

        for (const retryTime of [0, 100, 300]) {
            vi.setSystemTime(retryTime)
            await reporter.sync()
        }

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3)
        expect(reporter['_isDisabled']).toBe(true)
        expect(reporter['_unsynced']).toHaveLength(0)
        expect(reporter.isSynchronised).toBe(true)
        expect(vi.mocked(global.clearInterval)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(logger('').error)).toHaveBeenLastCalledWith(
            'failed to send data to Sumo Logic; retry limit of 2 reached, disabling reporter'
        )

        reporter.onTestStart('not buffered after retries exhausted' as any)
        await reporter.sync()
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3)
        expect(reporter['_unsynced']).toHaveLength(0)
    })

    it('should use five retries by default', async () => {
        vi.setSystemTime(0)
        vi.mocked(fetch).mockRejectedValue(new Error('network error'))
        reporter.onRunnerStart('onRunnerStart' as any)

        for (const retryTime of [0, 100, 300, 700, 1500, 2500]) {
            vi.setSystemTime(retryTime)
            await reporter.sync()
        }

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(6)
        expect(reporter['_isDisabled']).toBe(true)
        expect(vi.mocked(logger('').error)).toHaveBeenLastCalledWith(
            'failed to send data to Sumo Logic; retry limit of 5 reached, disabling reporter'
        )
    })

    it('should disable itself after the first failure when maxRetries is zero', async () => {
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234', maxRetries: 0 })
        reporter.onRunnerStart('onRunnerStart' as any)
        vi.mocked(fetch).mockRejectedValue(new Error('network error'))

        await reporter.sync()

        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
        expect(reporter['_isDisabled']).toBe(true)
        expect(vi.mocked(logger('').error)).toHaveBeenLastCalledWith(
            'failed to send data to Sumo Logic; retry limit of 0 reached, disabling reporter'
        )
    })

    it('should back off failed syncs with a bounded delay and reset after success', async () => {
        vi.setSystemTime(0)
        vi.mocked(fetch).mockRejectedValue(new Error('network error'))

        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234', maxRetries: 6 })
        reporter.onRunnerStart('onRunnerStart' as any)

        const retryTimes = [0, 100, 300, 700, 1500, 2500]
        for (const [index, retryTime] of retryTimes.entries()) {
            vi.setSystemTime(retryTime)
            await reporter.sync()
            expect(vi.mocked(fetch)).toHaveBeenCalledTimes(index + 1)

            const nextRetryTime = retryTimes[index + 1]
            if (nextRetryTime) {
                vi.setSystemTime(nextRetryTime - 1)
                await reporter.sync()
                expect(vi.mocked(fetch)).toHaveBeenCalledTimes(index + 1)
            }
        }

        vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)
        vi.setSystemTime(3499)
        await reporter.sync()
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(6)

        vi.setSystemTime(3500)
        await reporter.sync()
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(7)
        expect(reporter.isSynchronised).toBe(true)

        reporter.onRunnerStart('onRunnerStart' as any)
        await reporter.sync()
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(8)
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should be synchronised when no unsynced messages', async () => {
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234' })
        reporter.onRunnerStart('onRunnerStart' as any)
        expect(reporter.isSynchronised).toBe(false)
        await reporter.sync()
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should stop the timer if runner ended', async () => {
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234' })
        reporter.onRunnerStart('onRunnerStart' as any)
        reporter.onRunnerEnd('onRunnerStart' as any)

        expect(clearInterval).toBeCalledTimes(0)
        await reporter.sync()
        expect(clearInterval).toBeCalledTimes(1)
        await reporter.sync()
        expect(clearInterval).toBeCalledTimes(1)
    })
})
