import request from 'request'
import SumoLogicReporter from '../src'

import logger from '@wdio/logger'

jest.useFakeTimers()

describe('wdio-sumologic-reporter', () => {
    let reporter

    beforeEach(() => {
        logger().error.mockClear()
        reporter = new SumoLogicReporter()
    })

    it('it should start sync when reporter gets initiated', () => {
        expect(setInterval).toHaveBeenCalledTimes(1)
        expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 100)
    })

    it('should log error if sourceAddress is not defined', () => {
        expect(logger().error.mock.calls).toHaveLength(1)
    })

    it('should push to event bucket for every event', () => {
        expect(reporter.unsynced).toHaveLength(0)
        reporter.onRunnerStart('onRunnerStart')
        expect(reporter.unsynced).toHaveLength(1)
        expect(reporter.unsynced[0]).toContain('"event":"runner:start"')
        expect(reporter.unsynced[0]).toContain('"data":"onRunnerStart"')
        reporter.onSuiteStart('onSuiteStart')
        expect(reporter.unsynced).toHaveLength(2)
        expect(reporter.unsynced[1]).toContain('"event":"suite:start"')
        expect(reporter.unsynced[1]).toContain('"data":"onSuiteStart"')
        reporter.onTestStart('onTestStart')
        expect(reporter.unsynced).toHaveLength(3)
        expect(reporter.unsynced[2]).toContain('"event":"test:start"')
        expect(reporter.unsynced[2]).toContain('"data":"onTestStart"')
        reporter.onTestSkip('onTestSkip')
        expect(reporter.unsynced).toHaveLength(4)
        expect(reporter.unsynced[3]).toContain('"event":"test:skip"')
        expect(reporter.unsynced[3]).toContain('"data":"onTestSkip"')
        reporter.onTestPass('onTestPass')
        expect(reporter.unsynced).toHaveLength(5)
        expect(reporter.unsynced[4]).toContain('"event":"test:pass"')
        expect(reporter.unsynced[4]).toContain('"data":"onTestPass"')
        reporter.onTestFail('onTestFail')
        expect(reporter.unsynced).toHaveLength(6)
        expect(reporter.unsynced[5]).toContain('"event":"test:fail"')
        expect(reporter.unsynced[5]).toContain('"data":"onTestFail"')
        reporter.onTestEnd('onTestEnd')
        expect(reporter.unsynced).toHaveLength(7)
        expect(reporter.unsynced[6]).toContain('"event":"test:end"')
        expect(reporter.unsynced[6]).toContain('"data":"onTestEnd"')
        reporter.onSuiteEnd('onSuiteEnd')
        expect(reporter.unsynced).toHaveLength(8)
        expect(reporter.unsynced[7]).toContain('"event":"suite:end"')
        expect(reporter.unsynced[7]).toContain('"data":"onSuiteEnd"')
        reporter.onRunnerEnd('onRunnerEnd')
        expect(reporter.unsynced).toHaveLength(9)
        expect(reporter.unsynced[8]).toContain('"event":"runner:end"')
        expect(reporter.unsynced[8]).toContain('"data":"onRunnerEnd"')
    })

    describe('should not sync if it', () => {
        it('is currently syncing data', () => {
            reporter.inSync = true
            reporter.sync()
            expect(request.mock.calls).toHaveLength(0)
        })

        it('has no data to sync', () => {
            reporter.sync()
            expect(request.mock.calls).toHaveLength(0)
        })

        it('has no source address set up', () => {
            reporter.onRunnerStart('onRunnerStart')
            reporter.sync()
            expect(request.mock.calls).toHaveLength(0)
        })
    })

    it('should sync', () => {
        reporter.options.sourceAddress = 'http://localhost:1234'
        reporter.onRunnerStart('onRunnerStart')
        reporter.sync()

        expect(request.mock.calls).toHaveLength(1)
        expect(request.mock.calls[0][0].method).toBe('POST')
        expect(request.mock.calls[0][0].uri).toBe('http://localhost:1234')
        expect(request.mock.calls[0][0].body).toContain('"event":"runner:start","data":"onRunnerStart"')

        expect(reporter.unsynced).toHaveLength(0)
    })

    it('should log if it fails syncing', () => {
        logger().error.mockClear()

        reporter.options.sourceAddress = 'http://localhost:1234'
        reporter.onRunnerStart('onRunnerStart')
        reporter.sync()

        request.mock.calls[0][1](new Error('ups'))
        expect(logger().error.mock.calls).toHaveLength(1)
        expect(logger().error.mock.calls[0][0]).toContain('failed send data to Sumo Logic')
    })

    it('should be synchronised when no unsynced messages', () => {
        reporter = new SumoLogicReporter({ sourceAddress: 'foobar' })
        reporter.onRunnerStart('onRunnerStart')
        expect(reporter.isSynchronised).toBe(false)
        reporter.sync()
        expect(reporter.isSynchronised).toBe(true)
    })
})
