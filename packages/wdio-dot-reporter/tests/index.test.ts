import path from 'node:path'
import tmp from 'tmp'
import { describe, expect, it, vi } from 'vitest'

import DotReporter from '../src/index.js'

vi.mock('chalk')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

describe('Dot Reporter', () => {
    it('should write proper symbols', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({ logFile: logFile.name })
        reporter.write = vi.fn()
        const mockReporter = vi.mocked(reporter.write)

        reporter.onTestSkip()
        expect(mockReporter.mock.calls[0][0]).toBe('cyanBright .')
        mockReporter.mockClear()

        reporter.onTestPass()
        expect(mockReporter.mock.calls[0][0]).toBe('greenBright .')
        mockReporter.mockClear()

        reporter.onTestFail()
        expect(mockReporter.mock.calls[0][0]).toBe('redBright F')
        mockReporter.mockClear()
    })

    it('should write to stdout per default', () => {
        const reporter = new DotReporter({})
        expect(reporter.options.stdout).toBe(true)
    })

    it('should write to output stream', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({
            logFile: logFile.name,
            stdout: false
        })
        reporter.write(1)
        expect(vi.mocked(reporter.outputStream.write).mock.calls[0]).toEqual([1])
    })
})
