import BaseReporter from '../src/reporter'

class CustomReporter {
    constructor (options) {
        this.options = options
        this.emit = jest.fn()
        this.isCustom = true
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

    it('should emit events to all reporters', () => {
        const reporter = new BaseReporter({
            logDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0')

        reporter.emit(1, 2, 3)
        expect(reporter.reporters.map((r) => r.emit.mock.calls)).toEqual([[[1, 2, 3]], [[1, 2, 3]]])
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
})
