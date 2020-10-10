import tmp from 'tmp'

import DotReporter from '../src'

describe('Dot Reporter', () => {
    it('should write proper symbols', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({ logFile: logFile.name })
        reporter.write = jest.fn()
        const mockReporter = reporter.write as jest.Mock

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
        expect((reporter.outputStream.write as jest.Mock).mock.calls[0]).toEqual([1])
    })
})
