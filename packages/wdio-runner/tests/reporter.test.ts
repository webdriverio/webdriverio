import type { Capability } from '@wdio/config'

import BaseReporter from '../src/reporter'

class CustomReporter {
    public emit = jest.fn()
    public isCustom = true
    public inSync = false

    constructor (public options: WebdriverIO.ServiceOption) {}

    get isSynchronised () {
        return this.inSync
    }
}

const capability: Capability = { browserName: 'foo' }

process.send = jest.fn()

describe('BaseReporter', () => {
    it('should load all reporters', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0', capability)

        expect(reporter['_reporters']).toHaveLength(2)
    })

    it('getLogFile', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0', capability)

        expect(reporter.getLogFile('foobar'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-0-foobar-reporter.log/)
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
        }, '0-0', capability)
        expect(reporter.getLogFile('dot'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)baz(\\|\/)wdio-0-0-dot-reporter.log/)
    })

    it('should return custom log file name', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', {
                    foo: 'bar',
                    outputFileFormat: (options: any) => {
                        return `wdio-results-${options.cid}.xml`
                    }
                }]
            ]
        }, '0-0', capability)

        expect(reporter.getLogFile('dot'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-results-0-0.xml/)
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
            }, '0-0', capability)
        }).toThrow('outputFileFormat must be a function')
    })

    test('getLogFile returns undefined if outputDir is not defined', () => {
        const reporter = new BaseReporter({
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0', capability)

        expect(reporter.getLogFile('foobar')).toBe(undefined)
    })

    it('should emit events to all reporters', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        }, '0-0', capability)

        const payload = { foo: [1, 2, 3] }
        reporter.emit('runner:start', payload)
        expect(reporter['_reporters'].map((r) => (r.emit as jest.Mock).mock.calls)).toEqual([
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
        }, '0-0', capability)

        const payload = { foo: [1, 2, 3] }
        reporter.emit('test:fail', payload)
        expect(reporter['_reporters'].map((r) => (r.emit as jest.Mock).mock.calls)).toEqual([
            [['test:fail', Object.assign(payload, { cid: '0-0' })]],
            [['test:fail', Object.assign(payload, { cid: '0-0' })]]
        ])
        expect(process.send).toBeCalledTimes(1)
        expect((process.send as jest.Mock).mock.calls[0][0].name).toBe('printFailureMessage')
    })

    it('should allow to load custom reporters', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter]
        }, '0-0', capability)
        expect(reporter['_reporters']).toHaveLength(1)
        // @ts-ignore
        expect(reporter['_reporters'][0].isCustom).toBe(true)
    })

    it('should allow to write to output directory with custom reporter', () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [[CustomReporter, {
                outputDir: '/foo/baz/bar'
            }]]
        }, '0-0', capability)

        expect(reporter.getLogFile('CustomReporter')).toMatch(/(\\|\/)foo(\\|\/)baz(\\|\/)bar(\\|\/)wdio-0-0-CustomReporter-reporter.log/)
    })

    it('should throw if reporters are in a wrong format', () => {
        (expect as any as jest.Expect).hasAssertions()
        try {
            new BaseReporter({
                outputDir: '/foo/bar',
                reporters: [{ foo: 'bar' }]
            }, '0-0', capability)
        } catch (e) {
            expect(e.message).toBe('Invalid reporters config')
        }
    })

    it('should have a waitForSync method to allow reporters to sync stuff', async () => {
        (expect as any as jest.Expect).hasAssertions()

        const start = Date.now()
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter, CustomReporter]
        }, '0-0', capability)

        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][0].inSync = true), 100)
        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][1].inSync = true), 200)
        await reporter.waitForSync()
        expect(Date.now() - start).toBeGreaterThanOrEqual(199)
    })

    it('it should fail if waitForSync times out', async () => {
        (expect as any as jest.Expect).hasAssertions()

        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter],
            reporterSyncInterval: 10,
            reporterSyncTimeout: 100
        }, '0-0', capability)

        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][0].inSync = true), 112)
        await expect(reporter.waitForSync())
            .rejects.toEqual(new Error('Some reporters are still unsynced: CustomReporter'))
    })

    afterEach(() => {
        (process.send as jest.Mock).mockClear()
    })
})
