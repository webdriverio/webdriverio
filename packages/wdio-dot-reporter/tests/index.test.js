import tmp from 'tmp'

import DotReporter from '../src'

describe('Dot Reporter', () => {
    it('should write proper symbols', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({ logFile: logFile.name })
        reporter.write = jest.fn()

        expect(reporter.options.logFile).toBe(logFile.name)
        expect(reporter.outputStream.path).toBe(logFile.name)

        reporter.onRunnerStart()
        expect(reporter.write.mock.calls[0][0]).toBe('\n')
        reporter.write.mockClear()

        reporter.onTestSkip()
        expect(reporter.write.mock.calls[0][0]).toBe('cyanBright .')
        reporter.write.mockClear()

        reporter.onTestPass()
        expect(reporter.write.mock.calls[0][0]).toBe('greenBright .')
        reporter.write.mockClear()

        reporter.onTestFail()
        expect(reporter.write.mock.calls[0][0]).toBe('redBright F')
        reporter.write.mockClear()
    })

    it('should write to stdout if stdout is true', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({
            logFile: logFile.name,
            stdout: true
        })
        expect(reporter.outputStream.path).not.toBe(logFile.name)
    })

    it('should write to output stream', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({
            logFile: logFile.name,
            stdout: false
        })
        reporter.outputStream = { write: jest.fn() }
        reporter.write(1, 2, 3)
        expect(reporter.outputStream.write.mock.calls[0]).toEqual([1, 2, 3])
    })
})
