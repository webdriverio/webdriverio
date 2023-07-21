import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'
import { transformAsync as babelTransform } from '@babel/core'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import CoverageGatherer from '../../src/gatherer/coverage.js'

vi.useFakeTimers()
vi.spyOn(global, 'setInterval')
vi.spyOn(global, 'clearInterval')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@babel/core', () => ({
    transformAsync: vi.fn().mockResolvedValue({ code: 'transpiled code' })
}))

vi.mock('babel-plugin-istanbul', () => ({ default: vi.fn() }))
vi.mock('istanbul-lib-coverage', () => ({
    default: {
        createCoverageMap: vi.fn().mockReturnValue({
            files: vi.fn().mockReturnValue(['/foo/bar.js'])
        }),
        createCoverageSummary: vi.fn().mockReturnValue({
            merge: vi.fn(),
            data: { some: 'coverageData' }
        })
    }
}))
vi.mock('istanbul-lib-report', () => ({
    default: { createContext: vi.fn().mockReturnValue('someContext') }
}))
vi.mock('istanbul-reports', () => {
    const reportInstance = { execute: vi.fn() }
    return {
        default: {
            create: vi.fn().mockReturnValue(reportInstance),
            reportInstance
        }
    }
})
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn().mockReturnValue({ toString: () => 'barfoo' }),
        promises: {
            mkdir: vi.fn(),
            writeFile: vi.fn()
        }
    }
}))

const sessionMock = {
    on: vi.fn(),
    send: vi.fn().mockResolvedValue({})
}

const targetMock = {
    createCDPSession: vi.fn().mockResolvedValue(sessionMock)
}

let i = 0
const pageMock = {
    on: vi.fn(),
    target: vi.fn().mockReturnValue(targetMock),
    evaluate: vi.fn()
        .mockResolvedValueOnce(++i)
        .mockResolvedValueOnce(++i)
        .mockRejectedValueOnce(new Error('foo'))
} as unknown as Page

describe('CoverageGatherer', () => {
    beforeEach(() => {
        i = 0

        vi.mocked(pageMock.on).mockClear()
        vi.mocked(sessionMock.on).mockClear()
        vi.mocked(sessionMock.send).mockClear()
        vi.mocked(clearInterval).mockClear()
    })

    it('initiates properly', async () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        expect(pageMock.on).toBeCalledWith('load', expect.any(Function))

        await gatherer.init()
        expect(sessionMock.send)
            .toBeCalledWith('Fetch.enable', expect.any(Object))
        expect(sessionMock.on)
            .toBeCalledWith('Fetch.requestPaused', expect.any(Function))
        expect(gatherer['_client']).toBe(sessionMock)
    })

    it('_handleRequests should return if file is not a JS file', async () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        await gatherer.init()
        await gatherer['_handleRequests']({
            requestId: '123',
            request: {
                url: 'http://json.org/foo.html'
            },
            responseStatusCode: 444
        })

        expect(sessionMock.send).toBeCalledTimes(2)
        expect(sessionMock.send.mock.calls.pop())
            .toEqual(['Fetch.continueRequest', { requestId: '123' }])
        expect(babelTransform).toBeCalledTimes(0)
    })

    it('_handleRequests should transform JS files', async () => {
        const params = {
            requestId: '123',
            request: {
                url: 'http://json.org/foo.js'
            },
            responseStatusCode: 444
        }
        const gatherer = new CoverageGatherer(pageMock, {
            logDir: '/foo/bar'
        })

        // test without _client
        await gatherer['_handleRequests'](params)

        await gatherer.init()
        await gatherer['_handleRequests'](params)

        expect(sessionMock.send.mock.calls.slice(1))
            .toMatchSnapshot()
        expect(
            (vi.mocked(fs.promises.mkdir).mock.calls[0][0] as any).endsWith(
                path.join('foo', 'bar', 'files', 'json.org')
            )
        ).toBe(true)
        expect(
            (vi.mocked(fs.promises.writeFile).mock.calls[0][0] as any).endsWith(
                path.join('foo', 'bar', 'files', 'json.org', 'foo.js')
            )
        ).toBe(true)
    })

    it('_handleRequests should return if file is part of exclude', async () => {
        const gatherer = new CoverageGatherer(pageMock, {
            exclude: [/.*foo.js/]
        })

        await gatherer.init()
        await gatherer['_handleRequests']({
            requestId: '123',
            request: {
                url: 'http://json.org/foo.js'
            },
            responseStatusCode: 444
        })

        expect(sessionMock.send).toBeCalledTimes(2)
        expect(sessionMock.send.mock.calls.pop())
            .toEqual(['Fetch.continueRequest', { requestId: '123' }])
        expect(babelTransform).toBeCalledTimes(1)
    })

    it('_handleRequests should transform if file is not part of exclude', async () => {
        const params = {
            requestId: '123',
            request: {
                url: 'http://json.org/foo.js'
            },
            responseStatusCode: 444
        }
        const gatherer = new CoverageGatherer(pageMock, {
            exclude: [/.*bar.js/]
        })

        // test without _client
        await gatherer['_handleRequests'](params)

        await gatherer.init()
        await gatherer['_handleRequests'](params)

        expect(sessionMock.send.mock.calls.slice(1))
            .toMatchSnapshot()
        expect(
            (vi.mocked(fs.promises.mkdir).mock.calls[0][0] as any).endsWith(
                path.join('foo', 'bar', 'files', 'json.org')
            )
        ).toBe(true)
        expect(
            (vi.mocked(fs.promises.writeFile).mock.calls[0][0] as any).endsWith(
                path.join('foo', 'bar', 'files', 'json.org', 'foo.js')
            )
        ).toBe(true)
    })

    it('should return untransformed file if transformation fails', async () => {
        const params = {
            requestId: '123',
            request: {
                url: 'http://json.org/foo.js'
            },
            responseStatusCode: 444
        }
        const gatherer = new CoverageGatherer(pageMock, {
            logDir: '/foo/bar'
        })

        vi.mocked(babelTransform).mockReturnValueOnce(Promise.reject(new Error('upps')))
        await gatherer.init()
        await gatherer['_handleRequests'](params)

        expect(sessionMock.send.mock.calls.slice(1))
            .toMatchSnapshot()
    })

    it('_clearCaptureInterval', () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        gatherer['_clearCaptureInterval']()
        expect(clearInterval).toBeCalledTimes(0)
        gatherer['_captureInterval'] = 123 as any
        gatherer['_clearCaptureInterval']()
        expect(clearInterval).toBeCalledTimes(1)
        expect(gatherer['_captureInterval']).toBe(undefined)
    })

    it('_captureCoverage', async () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        gatherer['_clearCaptureInterval'] = vi.fn()
        gatherer['_captureCoverage']()
        expect(gatherer['_captureInterval']).not.toBe(undefined)
        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(0)
        gatherer['_captureCoverage']()
        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(1)
    })

    it('_getCoverageMap', async () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        const map = gatherer['_getCoverageMap']()
        vi.advanceTimersByTime(1000)
        gatherer['_coverageMap'] = 'foobar' as any
        vi.advanceTimersByTime(1000)
        expect(await map).toEqual('foobar')
    })

    it('logCoverage', async () => {
        const gatherer = new CoverageGatherer(pageMock, {
            type: 'json-summary',
            logDir: '/foo/bar',
            options: { foo: 'bar' }
        })
        gatherer['_clearCaptureInterval'] = vi.fn()
        gatherer['_getCoverageMap'] = vi.fn().mockResolvedValue({ bar: 'foo' })
        await gatherer.logCoverage()

        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(1)
        expect(libReport.createContext).toBeCalledTimes(1)
        expect(
            (vi.mocked(libReport.createContext).mock.calls[0][0] as any).sourceFinder('/to/a/file.js')
        ).toBe('barfoo')
        expect(
            (vi.mocked(fs.readFileSync).mock.calls[0][0] as any).endsWith(
                path.join('foo', 'bar', 'files', 'to', 'a', 'file.js')
            )
        ).toBe(true)
        expect(reports.create).toBeCalledWith('json-summary', { foo: 'bar' })
        // @ts-ignore mock feature
        expect(reports.reportInstance.execute).toBeCalledWith('someContext')
    })

    it('getCoverageReport', async () => {
        const coverage = {
            toSummary: vi.fn().mockReturnValue({ data: { some: 'coverage' } })
        }
        const coverageMap = {
            files: vi.fn().mockReturnValue(['/foo/bar.js', '/bar/foo.js']),
            fileCoverageFor: vi.fn().mockReturnValue(coverage)
        }
        const gatherer = new CoverageGatherer(pageMock, {})
        gatherer['_getCoverageMap'] = vi.fn().mockResolvedValue(coverageMap)
        expect(await gatherer.getCoverageReport()).toMatchSnapshot()
    })
})
