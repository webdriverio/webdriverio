import { describe, expect, it, vi } from 'vitest'

import JSONReporter from '../src/index.js'

vi.mock('node:fs', () => ({
    default: {
        mkdirSync: vi.fn(),
        createWriteStream: vi.fn()
    }
}))

describe('JSONReporter', () => {
    it('should create a report', async () => {
        const reporter = new JSONReporter({
            logFile: '/foo/bar.log',
            stdout: true
        })
        expect(reporter.options.logFile).toBe('/foo/bar.json')
    })

    it('should prepare json', () => {
        const reporter = new JSONReporter({ stdout: true })
        reporter.write = vi.fn()
        reporter.suites = {
            '0-0': {
                title: 'foo',
                fullTitle: 'foo',
                state: 'passed',
                duration: 1,
                hooks: [{
                    title: 'before each',
                    fullTitle: 'foo "before each"',
                    state: 'failed',
                    errors: [new Error('ups')],
                    duration: 1
                }],
                tests: [{
                    title: 'foo',
                    fullTitle: 'foo',
                    state: 'passed',
                    duration: 1
                }],
            } as any,
            '0-1': {
                title: 'bar',
                fullTitle: 'bar',
                state: 'failed',
                duration: 2,
                error: new Error('ahh'),
                hooks: [{
                    title: 'before each',
                    fullTitle: 'foo "before each"',
                    state: 'passed',
                    duration: 1
                }],
                tests: [{
                    title: 'bar',
                    fullTitle: 'bar',
                    state: 'failed',
                    duration: 2,
                    error: new Error('ahh')
                }],
            } as any
        }
        reporter.onRunnerEnd({
            start: 0,
            end: 1,
            capabilities: {},
            config: {
                framework: 'mocha',
                mochaOpts: {}
            },
            specs: ['foo.js', 'bar.js']
        } as any)
        expect(vi.mocked(reporter.write).mock.calls).toMatchSnapshot()
    })
})
