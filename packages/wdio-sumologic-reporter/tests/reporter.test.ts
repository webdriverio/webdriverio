import path from 'node:path'
import got from 'got'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import SumoLogicReporter from '../src'

import logger from '@wdio/logger'

vi.mock('got')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.useFakeTimers()
vi.spyOn(global, 'setInterval')
vi.spyOn(global, 'clearInterval')

describe('wdio-sumologic-reporter', () => {
    let reporter: SumoLogicReporter

    beforeEach(() => {
        vi.mocked(got).mockClear()
        vi.mocked(logger('').error).mockClear()
        reporter = new SumoLogicReporter({})
    })

    it('it should start sync when reporter gets initiated', () => {
        expect(setInterval).toHaveBeenCalledTimes(1)
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 100)
    })

    it('should log error if sourceAddress is not defined', () => {
        expect(vi.mocked(logger('').error).mock.calls).toHaveLength(1)
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
            expect(vi.mocked(got).mock.calls).toHaveLength(0)
        })

        it('has no source address set up', async () => {
            reporter.onRunnerStart('onRunnerStart' as any)
            await reporter.sync()
            expect(vi.mocked(got).mock.calls).toHaveLength(0)
        })
    })

    it('should sync', async () => {
        reporter['_options'].sourceAddress = 'http://localhost:1234'
        reporter.onRunnerStart('onRunnerStart' as any)
        await reporter.sync()

        expect(vi.mocked(got).mock.calls).toHaveLength(1)
        expect((vi.mocked(got).mock.calls[0][1 as any] as any).method).toBe('POST')
        expect(vi.mocked(got).mock.calls[0][0]).toBe('http://localhost:1234')
        expect((vi.mocked(got).mock.calls[0][1 as any] as any).json)
            .toContain('"event":"runner:start","data":"onRunnerStart"')

        expect(reporter['_unsynced']).toHaveLength(0)
    })

    it('should log if it fails syncing', async () => {
        vi.mocked(logger('').error).mockClear()

        reporter['_options'].sourceAddress = 'http://localhost:1234/sumoerror'
        reporter.onRunnerStart('onRunnerStart' as any)

        await reporter.sync()

        expect(vi.mocked(logger('').error).mock.calls).toHaveLength(1)
        expect(vi.mocked(logger('').error).mock.calls[0][0])
            .toContain('failed send data to Sumo Logic')
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
        expect(clearInterval).toBeCalledTimes(0)
        await reporter.sync()
        expect(clearInterval).toBeCalledTimes(1)
    })
})
