import gotMock from 'got'
import SumoLogicReporter from '../src'

import logger from '@wdio/logger'
import { Runner } from '@wdio/reporter/src/stats/runner'

jest.useFakeTimers()
const got = gotMock as unknown as jest.Mock

const log = logger('@wdio/sumologic-reporter')
const logError = log.error as jest.Mock

describe('wdio-sumologic-reporter', () => {
    let reporter: SumoLogicReporter
    let runnerStartEvent: Runner
    let runnerEndEvent: Runner
    let suiteStartEvent: WDIOReporter.Suite
    let suiteEndEvent: WDIOReporter.Suite

    beforeEach(() => {
        runnerStartEvent = {
            cid: 'runnerid',
            capabilities: {
                browserName: 'Chrome'
            }
        } as Runner
        runnerEndEvent = {
            cid: 'runnerid',
            capabilities: {
                browserName: 'Chrome'
            }
        } as Runner
        suiteStartEvent = {
            duration: 0,
            fullTitle: 'barfoo',
            type: 'foobar',
            uid: 'suiteid',
            title: 'the software',
        } as WDIOReporter.Suite
        suiteEndEvent = {
            duration: 0,
            fullTitle: 'barfoo',
            type: 'foobar',
            uid: 'suiteid',
            title: 'the software',
        } as WDIOReporter.Suite
        got.mockClear()
        logError.mockClear()
        reporter = new SumoLogicReporter()
    })

    it('it should start sync when reporter gets initiated', () => {
        expect(setInterval).toHaveBeenCalledTimes(1)
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 100)
    })

    it('should log error if sourceAddress is not defined', () => {
        expect(logError.mock.calls).toHaveLength(1)
    })

    it('should push to event bucket for every event', () => {
        expect(reporter.unsynced).toHaveLength(0)
        reporter.onRunnerStart(runnerStartEvent)
        expect(reporter.unsynced).toHaveLength(1)
        expect(reporter.unsynced[0]).toContain('"event":"runner:start"')
        expect(JSON.parse(reporter.unsynced[0]).data).toMatchObject({ 'cid': 'runnerid' })
        reporter.onSuiteStart(suiteStartEvent)
        expect(reporter.unsynced).toHaveLength(2)
        expect(reporter.unsynced[1]).toContain('"event":"suite:start"')
        expect(JSON.parse(reporter.unsynced[1]).data).toMatchObject({ 'uid': 'suiteid' })
        reporter.onTestStart({ _duration: 0, fullTitle: 'the software', state: 'started', title: 'onTestStart' })
        expect(reporter.unsynced).toHaveLength(3)
        expect(reporter.unsynced[2]).toContain('"event":"test:start"')
        expect(JSON.parse(reporter.unsynced[2]).data).toMatchObject({ 'title': 'onTestStart' })
        reporter.onTestSkip({ _duration: 0, fullTitle: 'the software', state: 'skipped', title: 'onTestSkip' })
        expect(reporter.unsynced).toHaveLength(4)
        expect(reporter.unsynced[3]).toContain('"event":"test:skip"')
        expect(JSON.parse(reporter.unsynced[3]).data).toMatchObject({ 'title': 'onTestSkip' })
        reporter.onTestPass({ _duration: 0, fullTitle: 'the software', state: 'passed', title: 'onTestPass' })
        expect(reporter.unsynced).toHaveLength(5)
        expect(reporter.unsynced[4]).toContain('"event":"test:pass"')
        expect(JSON.parse(reporter.unsynced[4]).data).toMatchObject({ 'title': 'onTestPass' })
        reporter.onTestFail({ _duration: 0, fullTitle: 'the software', state: 'failed', title: 'onTestFail' })
        expect(reporter.unsynced).toHaveLength(6)
        expect(reporter.unsynced[5]).toContain('"event":"test:fail"')
        expect(JSON.parse(reporter.unsynced[5]).data).toMatchObject({ 'title': 'onTestFail' })
        reporter.onTestEnd({ _duration: 0, fullTitle: 'the software', state: 'ended', title: 'onTestEnd' })
        expect(reporter.unsynced).toHaveLength(7)
        expect(reporter.unsynced[6]).toContain('"event":"test:end"')
        expect(JSON.parse(reporter.unsynced[6]).data).toMatchObject({ 'title': 'onTestEnd' })
        reporter.onSuiteEnd(suiteEndEvent)
        expect(reporter.unsynced).toHaveLength(8)
        expect(reporter.unsynced[7]).toContain('"event":"suite:end"')
        expect(JSON.parse(reporter.unsynced[7]).data).toMatchObject({ 'uid': 'suiteid' })
        reporter.onRunnerEnd(runnerEndEvent)
        expect(reporter.unsynced).toHaveLength(9)
        expect(reporter.unsynced[8]).toContain('"event":"runner:end"')
        expect(JSON.parse(reporter.unsynced[8]).data).toMatchObject({ 'cid': 'runnerid' })
    })

    describe('should not sync if it', () => {
        it('is currently syncing data', async () => {
            reporter.inSync = true
            await reporter.sync()
            expect(got.mock.calls).toHaveLength(0)
        })

        it('has no data to sync', async () => {
            await reporter.sync()
            expect(got.mock.calls).toHaveLength(0)
        })

        it('has no source address set up', async () => {
            reporter.onRunnerStart(runnerStartEvent)
            await reporter.sync()
            expect(got.mock.calls).toHaveLength(0)
        })
    })

    it('should sync', async () => {
        reporter.options.sourceAddress = 'http://localhost:1234'
        reporter.onRunnerStart(runnerStartEvent)
        await reporter.sync()

        expect(got.mock.calls).toHaveLength(1)
        expect(got.mock.calls[0][1].method).toBe('POST')
        expect(got.mock.calls[0][0]).toBe('http://localhost:1234')
        expect(got.mock.calls[0][1].json).toMatchObject({ 'event': 'runner:start', 'data': { 'capabilities': { 'browserName': 'Chrome' }, 'cid': 'runnerid' } })

        expect(reporter.unsynced).toHaveLength(0)
    })

    it('should log if it fails syncing', async () => {
        logError.mockClear()

        reporter.options.sourceAddress = 'http://localhost:1234/sumoerror'
        reporter.onRunnerStart(runnerStartEvent)

        await reporter.sync()

        expect(logError.mock.calls).toHaveLength(1)
        expect(logError.mock.calls[0][0]).toContain('failed send data to Sumo Logic')
    })

    it('should be synchronised when no unsynced messages', async () => {
        reporter = new SumoLogicReporter({ sourceAddress: 'http://localhost:1234' })
        reporter.onRunnerStart(runnerStartEvent)
        expect(reporter.isSynchronised).toBe(false)
        await reporter.sync()
        expect(reporter.isSynchronised).toBe(true)
    })
})
