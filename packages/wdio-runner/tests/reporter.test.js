import BaseReporter from '../src/reporter'

class CustomReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
        this.isCustom = true
        this.inSync = false
    }

    get isSynchronised () {
        return this.inSync
    }
}

describe('BaseReporter', () => {
    it('should load all reporters', () => {
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        expect(reporter.reporters).toHaveLength(2)
    })

    it('getLogFile', () => {
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        expect(reporter.getLogFile('foobar')).toBe('/foo/bar/wdio-0-0-foobar-reporter.log')
    })

    test('getLogFile returns undefined if logDir is not defined', () => {
        const reporter = new BaseReporter({
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        expect(reporter.getLogFile('foobar')).toBe(undefined)
    })

    it('should emit events to all reporters', () => {
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        const payload = { foo: [1, 2, 3] }
        reporter.emit('runner:start', payload)
        expect(reporter.reporters.map((r) => r.emit.mock.calls)).toEqual([
            [['runner:start', Object.assign(payload, { cid: '0-0' })]],
            [['runner:start', Object.assign(payload, { cid: '0-0' })]]
        ])
    })

    it('should allow to load custom reporters', () => {
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [CustomReporter]
        })
        expect(reporter.reporters).toHaveLength(1)
        expect(reporter.reporters[0].isCustom).toBe(true)
    })

    it('should throw if reporters are in a wrong format', () => {
        expect.hasAssertions()
        try {
            new BaseReporter({
                logDir: '/foo/bar',
                reporters: [{foo: 'bar'}]
            })
        } catch (e) {
            expect(e.message).toBe('Invalid reporters config')
        }
    })

    it('should have a waitForSync method to allow reporters to sync stuff', async () => {
        expect.assertions(1)

        const start = Date.now()
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [CustomReporter, CustomReporter]
        })

        setTimeout(() => (reporter.reporters[0].inSync = true), 100)
        setTimeout(() => (reporter.reporters[1].inSync = true), 200)
        await reporter.waitForSync()
        expect(Date.now() - start).toBeGreaterThanOrEqual(200)
    })

    it('it should fail if waitForSync times out', async () => {
        expect.assertions(1)

        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [CustomReporter],
            reporterSyncInterval: 10,
            reporterSyncTimeout: 100
        })

        setTimeout(() => (reporter.reporters[0].inSync = true), 110)
        await expect(reporter.waitForSync())
            .rejects.toEqual(new Error('Some reporter are still unsynced: CustomReporter'))
    })
})
