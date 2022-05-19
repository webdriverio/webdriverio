import path from 'node:path'
import { describe, expect, it, vi, test, afterEach } from 'vitest'
import type { Options, Capabilities } from '@wdio/types'

import BaseReporter from '../src/reporter'

vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/config', () => import(path.join(process.cwd(), '__mocks__', '@wdio/config')))

class CustomReporter {
    public emit = vi.fn()
    public isCustom = true
    public inSync = false

    constructor (public options: WebdriverIO.ServiceOption) {}

    get isSynchronised () {
        return this.inSync
    }
}

const capability: Capabilities.Capabilities = { browserName: 'foo' }

process.send = vi.fn()

describe('BaseReporter', () => {
    it('should load all reporters', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        expect(reporter['_reporters']).toHaveLength(2)
    })

    it('getLogFile', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        expect(reporter.getLogFile('foobar'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-0-0-foobar-reporter.log/)
    })

    it('can set custom logFile property', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                [CustomReporter, { foo: 'bar', logFile: '/barfoo.log' }],
                ['dot', { foo: 'bar', logFile: '/foobar.log' }]
            ],
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        // @ts-expect-error
        expect(reporter['_reporters'][0].options.logFile)
            .toBe('/barfoo.log')
        // @ts-expect-error
        expect(reporter['_reporters'][1].options.logFile)
            .toBe('/foobar.log')
    })

    it('should output log file to custom outputDir', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                ['dot', {
                    foo: 'bar',
                    outputDir: '/foo/bar/baz'
                }]
            ],
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()
        expect(reporter.getLogFile('dot'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)baz(\\|\/)wdio-0-0-dot-reporter.log/)
    })

    it('should return custom log file name', async () => {
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
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        expect(reporter.getLogFile('dot'))
            .toMatch(/(\\|\/)foo(\\|\/)bar(\\|\/)wdio-results-0-0.xml/)
    })

    it('should throw error if outputFileFormat is not a function', async () => {
        await expect(async () => {
            const reporter = new BaseReporter({
                outputDir: '/foo/bar',
                reporters: [
                    'dot',
                    ['dot', {
                        foo: 'bar',
                        outputFileFormat: 'foo'
                    }]
                ]
            } as Options.Testrunner, '0-0', capability)
            await reporter.initReporters()
        }).rejects.toThrow('outputFileFormat must be a function')
    })

    test('getLogFile returns undefined if outputDir is not defined', () => {
        const reporter = new BaseReporter({
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        } as Options.Testrunner, '0-0', capability)

        expect(reporter.getLogFile('foobar')).toBe(undefined)
    })

    it('should emit events to all reporters', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        const payload = { foo: [1, 2, 3] }
        reporter.emit('runner:start', payload)
        expect(reporter['_reporters'].map((r) => vi.mocked(r.emit).mock.calls)).toEqual([
            [['runner:start', Object.assign(payload, { cid: '0-0' })]],
            [['runner:start', Object.assign(payload, { cid: '0-0' })]]
        ])
        expect(process.send).not.toBeCalled()
    })

    it('should send printFailureMessage', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [
                'dot',
                ['dot', { foo: 'bar' }]
            ]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        const payload = { foo: [1, 2, 3] }
        reporter.emit('test:fail', payload)
        expect(reporter['_reporters'].map((r) => vi.mocked(r.emit).mock.calls)).toEqual([
            [['test:fail', Object.assign(payload, { cid: '0-0' })]],
            [['test:fail', Object.assign(payload, { cid: '0-0' })]]
        ])
        expect(process.send).toBeCalledTimes(1)
        expect(vi.mocked(process.send)!.mock.calls[0][0].name).toBe('printFailureMessage')
    })

    it('should allow to load custom reporters', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter] as any,
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()
        expect(reporter['_reporters']).toHaveLength(1)
        // @ts-ignore
        expect(reporter['_reporters'][0].isCustom).toBe(true)
    })

    it('should allow to write to output directory with custom reporter', async () => {
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [[CustomReporter, {
                outputDir: '/foo/baz/bar'
            }]] as any,
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        expect(reporter.getLogFile('CustomReporter')).toMatch(/(\\|\/)foo(\\|\/)baz(\\|\/)bar(\\|\/)wdio-0-0-CustomReporter-reporter.log/)
    })

    it('should throw if reporters are in a wrong format', async () => {
        expect.hasAssertions()
        try {
            const reporter = new BaseReporter({
                outputDir: '/foo/bar',
                reporters: [{ foo: 'bar' } as any],
                capabilities: [capability]
            } as Options.Testrunner, '0-0', capability)
            await reporter.initReporters()
        } catch (err: any) {
            expect(err.message).toBe('Invalid reporters config')
        }
    })

    it('should have a waitForSync method to allow reporters to sync stuff', async () => {
        expect.hasAssertions()

        const start = Date.now()
        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter, CustomReporter] as any,
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][0].inSync = true), 100)
        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][1].inSync = true), 200)
        await reporter.waitForSync()
        expect(Date.now() - start).toBeGreaterThanOrEqual(199)
    })

    it('it should fail if waitForSync times out', async () => {
        expect.hasAssertions()

        const reporter = new BaseReporter({
            outputDir: '/foo/bar',
            reporters: [CustomReporter] as any,
            reporterSyncInterval: 10,
            reporterSyncTimeout: 100,
            capabilities: [capability]
        } as Options.Testrunner, '0-0', capability)
        await reporter.initReporters()

        // @ts-ignore test reporter param
        setTimeout(() => (reporter['_reporters'][0].inSync = true), 112)
        await expect(reporter.waitForSync())
            .rejects.toEqual(new Error('Some reporters are still unsynced: CustomReporter'))
    })

    afterEach(() => {
        vi.mocked(process.send)!.mockClear()
    })
})
