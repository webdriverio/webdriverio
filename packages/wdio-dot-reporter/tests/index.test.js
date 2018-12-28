import tmp from 'tmp'

import DotReporter from '../src'

describe('Dot Reporter', () => {
    it('should write proper symbols', () => {
        const logFile = tmp.fileSync()
        const reporter = new DotReporter({ logFile: logFile.name })
        reporter.write = jest.fn()

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
        expect(reporter.outputStream.write.mock.calls[0]).toEqual([1])
    })
})
