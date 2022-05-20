import fs from 'node:fs'
import path from 'node:path'
import CoverageGatherer from '../../src/gatherer/coverage'

import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'
import { transformAsync as babelTransform } from '@babel/core'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'

jest.useFakeTimers()
jest.spyOn(global, 'setInterval')
jest.spyOn(global, 'clearInterval')

jest.mock('@babel/core', () => ({
    transformAsync: jest.fn().mockResolvedValue({ code: 'transpiled code' })
}))

jest.mock('babel-plugin-istanbul', () => jest.fn())
jest.mock('istanbul-lib-coverage', () => ({
    createCoverageMap: jest.fn().mockReturnValue({
        files: jest.fn().mockReturnValue(['/foo/bar.js'])
    }),
    createCoverageSummary: jest.fn().mockReturnValue({
        merge: jest.fn(),
        data: { some: 'coverageData' }
    })
}))
jest.mock('istanbul-lib-report', () => ({
    createContext: jest.fn().mockReturnValue('someContext')
}))
jest.mock('istanbul-reports', () => {
    const reportInstance = { execute: jest.fn() }
    return {
        create: jest.fn().mockReturnValue(reportInstance),
        reportInstance
    }
})
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue({ toString: () => 'barfoo' }),
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn()
    }
}))

const sessionMock = {
    on: jest.fn(),
    send: jest.fn().mockResolvedValue({})
}

const targetMock = {
    createCDPSession: jest.fn().mockResolvedValue(sessionMock)
}

let i = 0
const pageMock = {
    on: jest.fn(),
    target: jest.fn().mockReturnValue(targetMock),
    evaluate: jest.fn()
        .mockResolvedValueOnce(++i)
        .mockResolvedValueOnce(++i)
        .mockRejectedValueOnce(new Error('foo'))
} as unknown as Page

describe('CoverageGatherer', () => {
    beforeEach(() => {
        i = 0

        ;(pageMock.on as jest.Mock).mockClear()
        ;(sessionMock.on as jest.Mock).mockClear()
        ;(sessionMock.send as jest.Mock).mockClear()
        ;(clearInterval as jest.Mock).mockClear()
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
        expect((fs.promises.mkdir as jest.Mock).mock.calls[0][0].endsWith(
            path.join('foo', 'bar', 'files', 'json.org')
        )).toBe(true)
        expect((fs.promises.writeFile as jest.Mock).mock.calls[0][0].endsWith(
            path.join('foo', 'bar', 'files', 'json.org', 'foo.js')
        )).toBe(true)
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
        expect((fs.promises.mkdir as jest.Mock).mock.calls[0][0].endsWith(
            path.join('foo', 'bar', 'files', 'json.org')
        )).toBe(true)
        expect((fs.promises.writeFile as jest.Mock).mock.calls[0][0].endsWith(
            path.join('foo', 'bar', 'files', 'json.org', 'foo.js')
        )).toBe(true)
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

        ;(babelTransform as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('upps')))
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
        gatherer['_clearCaptureInterval'] = jest.fn()
        gatherer['_captureCoverage']()
        expect(gatherer['_captureInterval']).not.toBe(undefined)
        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(0)
        gatherer['_captureCoverage']()
        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(1)
    })

    it('_getCoverageMap', async () => {
        const gatherer = new CoverageGatherer(pageMock, {})
        let map = gatherer['_getCoverageMap']()
        jest.advanceTimersByTime(1000)
        gatherer['_coverageMap'] = 'foobar' as any
        jest.advanceTimersByTime(1000)
        expect(await map).toEqual('foobar')
    })

    it('logCoverage', async () => {
        const gatherer = new CoverageGatherer(pageMock, {
            type: 'json-summary',
            logDir: '/foo/bar',
            options: { foo: 'bar' }
        })
        gatherer['_clearCaptureInterval'] = jest.fn()
        gatherer['_getCoverageMap'] = jest.fn().mockResolvedValue({ bar: 'foo' })
        await gatherer.logCoverage()

        expect(gatherer['_clearCaptureInterval']).toBeCalledTimes(1)
        expect(libReport.createContext).toBeCalledTimes(1)
        expect(
            (libReport.createContext as jest.Mock).mock.calls[0][0].sourceFinder('/to/a/file.js')
        ).toBe('barfoo')
        expect((fs.readFileSync as jest.Mock).mock.calls[0][0].endsWith(
            path.join('foo', 'bar', 'files', 'to', 'a', 'file.js')
        )).toBe(true)
        expect(reports.create).toBeCalledWith('json-summary', { foo: 'bar' })
        // @ts-ignore mock feature
        expect(reports.reportInstance.execute).toBeCalledWith('someContext')
    })

    it('getCoverageReport', async () => {
        const coverage = {
            toSummary: jest.fn().mockReturnValue({ data: { some: 'coverage' } })
        }
        const coverageMap = {
            files: jest.fn().mockReturnValue(['/foo/bar.js', '/bar/foo.js']),
            fileCoverageFor: jest.fn().mockReturnValue(coverage)
        }
        const gatherer = new CoverageGatherer(pageMock, {})
        gatherer['_getCoverageMap'] = jest.fn().mockResolvedValue(coverageMap)
        expect(await gatherer.getCoverageReport()).toMatchSnapshot()
    })
})
