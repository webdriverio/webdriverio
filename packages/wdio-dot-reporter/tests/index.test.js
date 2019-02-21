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

    describe('onRunnerEnd', () => {
        const reporter = new DotReporter({})

        it('should call printReport method', () => {
            reporter.printErrors = jest.fn()
            reporter.onRunnerEnd({})

            expect(reporter.printErrors.mock.calls.length).toBe(1)
        })
    })

    describe('printErrors', () => {
        let reporter

        beforeEach(() => {
            reporter = new DotReporter({})
        })

        it('should not return any errors', () => {
            reporter.getFailureDisplay = jest.fn(() => [])

            expect(reporter.printErrors()).toBe(undefined)
        })

        it('should return errors', () => {
            reporter.getFailureDisplay = jest.fn(() => ['foo', 'bar'])
            reporter.write = jest.fn()
            reporter.printErrors()

            expect(reporter.write).toHaveBeenCalled()
        })
    })
})
