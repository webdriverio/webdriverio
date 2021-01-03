import fs from 'fs'
import CoverageGatherer from '../../src/gatherer/coverage'

import libCoverage from 'istanbul-lib-coverage'
import { transformAsync as babelTransform } from '@babel/core'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'

jest.useFakeTimers()

jest.mock('@babel/core', () => ({
    transformAsync: jest.fn().mockResolvedValue({ code: 'transpiled code' })
}))

jest.mock('babel-plugin-istanbul', () => jest.fn())
jest.mock('istanbul-lib-coverage', () => ({
    createCoverageMap: jest.fn().mockReturnValue({
        files: jest.fn().mockReturnValue(['/foo/bar.js'])
    })
}))
jest.mock('istanbul-lib-report', () => jest.fn())
jest.mock('istanbul-reports', () => jest.fn())
jest.mock('fs', () => ({
    existsSync: jest.fn(),
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
        const gatherer = new CoverageGatherer(pageMock, {
            logDir: '/foo/bar'
        })
        await gatherer.init()
        await gatherer['_handleRequests']({
            requestId: '123',
            request: {
                url: 'http://json.org/foo.js'
            },
            responseStatusCode: 444
        })

        expect(sessionMock.send.mock.calls.slice(1))
            .toMatchSnapshot()
        expect((fs.promises.mkdir as jest.Mock).mock.calls[0][0])
            .toBe('/foo/bar/files/json.org')
        expect((fs.promises.writeFile as jest.Mock).mock.calls[0][0])
            .toBe('/foo/bar/files/json.org/foo.js')
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
})
