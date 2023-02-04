import fs from 'node:fs/promises'
import path from 'node:path'

import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'
import LocalRunner from '@wdio/local-runner'
import libCoverage from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import libSourceMap from 'istanbul-lib-source-maps'
import reports from 'istanbul-reports'

import { SESSIONS, BROWSER_POOL } from '../src/constants.js'
import BrowserRunner from '../src/index.js'

vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/local-runner')
vi.mock('../src/vite/server.js', () => ({
    ViteServer: class {
        start = vi.fn()
        close = vi.fn()
        config = { server: { port: 1234 } }
        on = vi.fn()
    }
}))
vi.mock('istanbul-lib-coverage', () => ({
    default: { createCoverageMap: vi.fn().mockReturnValue({ map: vi.fn() }) }
}))
vi.mock('istanbul-lib-report', () => ({
    default: { createContext: vi.fn().mockReturnValue('context') }
}))
vi.mock('istanbul-reports', () => ({
    default: { create: vi.fn().mockReturnValue({ execute: vi.fn() }) }
}))
vi.mock('istanbul-lib-source-maps', () => ({
    default: { createSourceMapStore: vi.fn().mockReturnValue({
        transformCoverage: vi.fn().mockReturnValue('coverageMap')
    }) }
}))
vi.mock('node:fs/promises', async () => {
    const coverageResult: any = await vi.importActual('./__fixtures__/coverage-summary.json')
    return {
        default: {
            readFile: vi.fn().mockReturnValue(JSON.stringify(coverageResult.default)),
            access: vi.fn().mockResolvedValue(false),
            rm: vi.fn()
        }
    }
})

describe('BrowserRunner', () => {
    beforeEach(() => {
        delete process.env.CI
        vi.mocked(libSourceMap.createSourceMapStore).mockClear()
    })

    it('should throw if framework is not Mocha', () => {
        expect(() => new BrowserRunner({}, {} as any)).toThrow()
        expect(() => new BrowserRunner({}, {
            rootDir: '/foo/bar',
            framework: 'jasmine'
        } as any)).toThrow()
        expect(() => new BrowserRunner({}, {
            rootDir: '/foo/bar',
            framework: 'mocha'
        } as any)).not.toThrow()
    })

    it('initialise', async () => {
        const runner = new BrowserRunner({}, {
            rootDir: '/foo/bar',
            framework: 'mocha'
        } as any)
        await runner.initialise()
        expect(runner['_config'].baseUrl).toBe('http://localhost:1234')
        expect(fs.rm).toBeCalledWith(
            path.join('/foo/bar', 'coverage'),
            { recursive: true }
        )
    })

    it('run', async () => {
        const runner = new BrowserRunner({}, {
            rootDir: '/foo/bar',
            framework: 'mocha'
        } as any)
        await runner.initialise()

        const on = vi.fn()
        vi.mocked(LocalRunner.prototype.run).mockReturnValue({ on } as any)
        const worker = runner.run({ caps: { browserName: 'chrome' }, command: 'run', args: {} } as any)
        expect(worker).toBeDefined()
        expect(LocalRunner.prototype.run).toBeCalledWith({
            args: { baseUrl: 'http://localhost:1234' },
            caps: { browserName: 'chrome' },
            command: 'run'
        })

        expect(BROWSER_POOL.size).toBe(0)
        expect(SESSIONS.size).toBe(0)
        await on.mock.calls[0][1]({ name: 'sessionStarted', cid: '0-0', content: {} })
        expect(BROWSER_POOL.size).toBe(1)
        expect(SESSIONS.size).toBe(1)

        await on.mock.calls[0][1]({ name: 'sessionEnded', cid: '0-1', content: {} })
        expect(BROWSER_POOL.size).toBe(1)
        expect(SESSIONS.size).toBe(1)
        await on.mock.calls[0][1]({ name: 'sessionEnded', cid: '0-0', content: {} })
        expect(BROWSER_POOL.size).toBe(0)
        expect(SESSIONS.size).toBe(0)
    })

    it('shutdown', async () => {
        const runner = new BrowserRunner({}, {
            rootDir: '/foo/bar',
            framework: 'mocha'
        } as any)
        runner['_generateCoverageReports'] = vi.fn()
        await runner.initialise()
        await runner.shutdown()
        expect(LocalRunner.prototype.shutdown).toBeCalledTimes(1)
        expect(runner['_generateCoverageReports']).toBeCalledTimes(1)
    })

    describe('_generateCoverageReports', async () => {
        const logOrig = console.log.bind(console)

        beforeEach(() => {
            vi.mocked(libCoverage.createCoverageMap).mockClear()
            vi.mocked(libReport.createContext).mockClear()
            vi.mocked(reports.create).mockClear()
            console.log = vi.fn()
        })

        afterEach(() => {
            console.log = logOrig
        })

        it('should do nothing if coverage is not enabled', async () => {
            const runner = new BrowserRunner({}, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            expect(await runner['_generateCoverageReports']()).toBe(true)
            expect(libCoverage.createCoverageMap).toBeCalledTimes(0)
        })

        it('should do nothing if no coverage was collected', async () => {
            const runner = new BrowserRunner({
                coverage: {
                    enabled: true,
                }
            }, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            expect(await runner['_generateCoverageReports']()).toBe(true)
            expect(libCoverage.createCoverageMap).toBeCalledTimes(0)
        })

        it('should generate reports', async () => {
            const runner = new BrowserRunner({
                coverage: {
                    enabled: true,
                }
            }, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            runner['_coverageMaps'].push({} as any)
            expect(await runner['_generateCoverageReports']()).toBe(true)
            expect(console.log).toBeCalledTimes(0)
            expect(libCoverage.createCoverageMap).toBeCalledTimes(1)
            expect(libReport.createContext).toBeCalledTimes(1)
            expect(libSourceMap.createSourceMapStore).toBeCalledTimes(1)
            expect(reports.create).toBeCalledTimes(4)
        })

        it('should fail if coverage global treshold is not met', async () => {
            const runner = new BrowserRunner({
                coverage: {
                    enabled: true,
                    statements: 90,
                    functions: 70,
                    reporter: 'lcov'
                }
            }, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            runner['_coverageMaps'].push({} as any)
            expect(await runner['_generateCoverageReports']()).toBe(false)
            expect(console.log).toBeCalledWith([
                'ERROR: Coverage for functions (50%) does not meet global threshold (70%)',
                'ERROR: Coverage for statements (47.82%) does not meet global threshold (90%)'
            ].join('\n'))
            expect(reports.create).toBeCalledTimes(2)
            expect(reports.create).toBeCalledWith('lcov', expect.any(Object))
            expect(reports.create).toBeCalledWith('json-summary', expect.any(Object))
        })

        it('should fail if coverage file based treshold is not met', async () => {
            const runner = new BrowserRunner({
                coverage: {
                    enabled: true,
                    perFile: true,
                    statements: 90,
                    functions: 70,
                    reporter: 'lcov'
                }
            }, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            runner['_coverageMaps'].push({} as any)
            expect(await runner['_generateCoverageReports']()).toBe(false)
            expect(console.log).toBeCalledWith([
                'ERROR: Coverage for functions (50%) does not meet threshold (70%) for /components/ReactComponent.jsx',
                'ERROR: Coverage for statements (47.82%) does not meet threshold (90%) for /components/ReactComponent.jsx'
            ].join('\n'))
        })

        it('should return false if generating the report failed', async () => {
            const runner = new BrowserRunner({
                coverage: {
                    enabled: true,
                    perFile: true,
                    statements: 90,
                    functions: 70,
                    reporter: 'lcov'
                }
            }, {
                rootDir: '/foo/bar',
                framework: 'mocha'
            } as any)
            vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ups'))
            runner['_coverageMaps'].push({} as any)
            expect(await runner['_generateCoverageReports']()).toBe(false)
            expect(console.log).toBeCalledTimes(0)
        })
    })
})
