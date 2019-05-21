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

process.send = jest.fn()

describe('BaseReporter', () => {
    it('should load all reporters', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        expect(reporter.reporters).toHaveLength(2)
    })

    it('getLogFile', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        expect(reporter.getLogFile('foobar')).toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-0-foobar-reporter.log/)
    })

    it('should output log file to custom outputDir', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                ['dot', {
                    foo: 'bar',
                    outputDir: '/foo/bar/baz'
                }]
            ]
        }, '0-0')
        expect(reporter.getLogFile('dot')).toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)baz(\\|\/)wdio-0-0-dot-reporter.log/)
    })

    it('should return custom log file name', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', {
                    foo: 'bar',
                    outputFileFormat: (options) => {
                        return `wdio-results-${options.cid}.xml`
                    }
                }]
            ]
        }, '0-0')

        expect(reporter.getLogFile('dot')).toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-results-0-0.xml/)
    })

    it('should throw error if outputFileFormat is not a function', () => {
        expect(() => {
            new BaseReporter({
                outputDir: '/foo/bar',
                reporters: [
                    'dot',
                    ['dot', {
                        foo: 'bar',
                        outputFileFormat: 'foo'
                    }]
                ]
            }, '0-0')
        }).toThrow('outputFileFormat must be a function')
    })

    test('getLogFile returns undefined if outputDir is not defined', () => {
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
            outputDir: '/foo/bar',
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
        expect(process.send).not.toBeCalled()
    })

    it('should send printFailureMessage', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        const payload = { foo: [1, 2, 3] }
        reporter.emit('test:fail', payload)
        expect(reporter.reporters.map((r) => r.emit.mock.calls)).toEqual([
            [['test:fail', Object.assign(payload, { cid: '0-0' })]],
            [['test:fail', Object.assign(payload, { cid: '0-0' })]]
        ])
        expect(process.send).toBeCalledTimes(1)
        expect(process.send.mock.calls[0][0].name).toBe('printFailureMessage')
    })

    it('should allow to load custom reporters', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter]
        })
        expect(reporter.reporters).toHaveLength(1)
        expect(reporter.reporters[0].isCustom).toBe(true)
    })

    it('should allow to write to output directory with custom reporter', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [[CustomReporter, {
                outputDir: '/foo/baz/bar'
            }]]
        }, '0-0')

        expect(reporter.getLogFile('CustomReporter')).toMatch(/(\\|\/)foo(\\|\/)baz(\\|\/)bar(\\|\/)wdio-0-0-CustomReporter-reporter.log/)
    })

    it('should throw if reporters are in a wrong format', () => {
        expect.hasAssertions()
        try {
            new BaseReporter({
                outputDir: '/foo/bar',
                reporters: [{ foo: 'bar' }]
            })
        } catch (e) {
            expect(e.message).toBe('Invalid reporters config')
        }
    })

    it('should have a waitForSync method to allow reporters to sync stuff', async () => {
        expect.assertions(1)

        const start = Date.now()
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
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
            outputDir: '/foo/bar',
            reporters: [CustomReporter],
            reporterSyncInterval: 10,
            reporterSyncTimeout: 100
        })

        setTimeout(() => (reporter.reporters[0].inSync = true), 112)
        await expect(reporter.waitForSync())
            .rejects.toEqual(new Error('Some reporters are still unsynced: CustomReporter'))
    })

    afterEach(() => {
        process.send.mockClear()
    })
})
