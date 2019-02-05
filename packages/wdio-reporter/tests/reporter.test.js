import fs from 'fs'
import tmp from 'tmp'

import WDIOReporter from '../src'

jest.mock('events', () => {
    class EventEmitterMock {
        constructor () {
            this.on = jest.fn()
        }
    }

    return EventEmitterMock
})

describe('WDIOReporter', () => {
    it('constructor', () => {
        const tmpobj = tmp.fileSync()
        const reporter = new WDIOReporter({ logFile: tmpobj.name })
        expect(reporter.on).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(reporter.on).toBeCalledWith('client:afterCommand', expect.any(Function))
        expect(reporter.on).toBeCalledWith('runner:start', expect.any(Function))
        expect(reporter.on).toBeCalledWith('suite:start', expect.any(Function))
        expect(reporter.on).toBeCalledWith('hook:start', expect.any(Function))
        expect(reporter.on).toBeCalledWith('hook:end', expect.any(Function))
        expect(reporter.on).toBeCalledWith('test:start', expect.any(Function))
        expect(reporter.on).toBeCalledWith('test:pass', expect.any(Function))
        expect(reporter.on).toBeCalledWith('test:fail', expect.any(Function))
        expect(reporter.on).toBeCalledWith('test:pending', expect.any(Function))
        expect(reporter.on).toBeCalledWith('test:end', expect.any(Function))
        expect(reporter.on).toBeCalledWith('suite:end', expect.any(Function))
        expect(reporter.on).toBeCalledWith('runner:end', expect.any(Function))
        expect(reporter.on).toBeCalledWith('client:command', expect.any(Function))
        expect(reporter.on).toBeCalledWith('client:result', expect.any(Function))
    })

    it('should be by default synchronised', () => {
        const tmpobj = tmp.fileSync()
        const reporter = new WDIOReporter({ logFile: tmpobj.name })
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should provide a function to write to output stream', () => {
        expect.assertions(1)

        const tmpobj = tmp.fileSync()
        const reporter = new WDIOReporter({ logFile: tmpobj.name })
        reporter.write('foobar')

        return new Promise((resolve) => reporter.outputStream.end(() => {
            expect(reporter.outputStream.bytesWritten).toBe(6)
            resolve()
        }))
    })

    it('should allow an own writeable stream', () => {
        const tmpobj = tmp.fileSync()
        const customLogStream = fs.createWriteStream(tmpobj.name)
        const reporter = new WDIOReporter({ stdout: true, writeStream: customLogStream })
        reporter.write('foobar')

        return new Promise((resolve) => reporter.outputStream.end(() => {
            expect(reporter.outputStream.bytesWritten).toBe(6)
            resolve()
        }))
    })

    it('should not create log file if not file name is given', () => {
        const options = { writeStream: { write: jest.fn() } }
        const reporter = new WDIOReporter(options)
        reporter.write('foobar')
        expect(options.writeStream.write).toBeCalledWith('foobar')
    })

    it('should create directory if outputDir given and not existing', () => {
        const outputDir = `./tempDir-${Date.now()}`

        // ensure directory isn't somehow there to begin with
        expect(fs.existsSync(outputDir)).toBe(false)

        const options = { outputDir }
        new WDIOReporter(options)

        const dirExists = fs.existsSync(outputDir)

        // remove directory before assertion so it doesn't pollute our tests,
        // even if the assertion fails
        if (dirExists){
            fs.rmdirSync(outputDir)
        }

        expect(dirExists).toBe(true)
    })
})
