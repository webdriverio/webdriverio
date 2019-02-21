import fs from 'fs'
import fse from 'fs-extra'
import tmp from 'tmp'
import path from 'path'

import WDIOReporter from '../src'

import {
    SUITES,
    SUITES_NO_TESTS,
} from './__fixtures__/testdata'

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
        const outputDir = path.join(__dirname, `./tempDir-${Date.now()}`, 'multiLevel')

        // ensure directory isn't somehow there to begin with
        expect(fs.existsSync(outputDir)).toBe(false)

        const options = { outputDir }
        new WDIOReporter(options)

        const dirExists = fs.existsSync(outputDir)

        // remove directory before assertion so it doesn't pollute the test directory,
        // even if the assertion fails
        if (dirExists){
            fse.removeSync(outputDir)
        }

        expect(dirExists).toBe(true)
    })

    it('should handle invalid directory for outputDir', () => {
        expect(() => {
            new WDIOReporter({ outputDir: true })
        }).toThrow()
    })

    describe('getFailureDisplay', () => {
        const reporter = new WDIOReporter({})

        it('should return failing results', () => {
            reporter.all_suites = SUITES

            const result = reporter.getFailureDisplay()

            expect(result.length).toBe(4)
            expect(result[0]).toBe('')
            expect(result[1]).toBe('1) Bar test a failed test')
            expect(result[2]).toBe('red expected foo to equal bar')
            expect(result[3]).toBe('gray Failed test stack trace')
        })

        it('should return no results', () => {
            reporter.all_suites = SUITES_NO_TESTS

            const result = reporter.getFailureDisplay()

            expect(result.length).toBe(0)
        })
    })

    describe('getEventsToReport', () => {
        const reporter = new WDIOReporter({})

        it('should return all tests and hook errors to report', () => {
            expect(reporter.getEventsToReport({
                tests: [1, 2, 3],
                hooks: [4, 5, 6]
            })).toEqual([1, 2, 3])

            expect(reporter.getEventsToReport({
                tests: [1, 2, 3],
                hooks: [{ error: 1 }, 5, { error: 2 }]
            })).toEqual([1, 2, 3, { error: 1 }, { error: 2 }])
        })
    })
})
