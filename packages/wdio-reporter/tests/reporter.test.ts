import tmp from 'tmp'
import fse from 'fs-extra'
import { EventEmitter } from 'events'
import WDIOReporter from '../src'
import { WriteStream } from 'fs'
import fs from 'fs'

describe('WDIOReporter', () => {
    const eventsOnSpy = jest.spyOn(EventEmitter.prototype, 'on')

    it('constructor', () => {
        const tmpobj = tmp.fileSync()
        new WDIOReporter({ logFile: tmpobj.name })
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('runner:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:pass', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:fail', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:pending', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:retry', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('runner:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
    })

    it('should be by default synchronised', () => {
        const tmpobj = tmp.fileSync()
        const reporter = new WDIOReporter({ logFile: tmpobj.name })
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should provide a function to write to output stream', () => {
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

    it('should not create log file if no file name is given', () => {
        const options = { stdout: true, writeStream: { write: jest.fn() } as unknown as WriteStream }
        const reporter = new WDIOReporter(options)
        reporter.write('foobar')
        expect(options.writeStream.write).toBeCalledWith('foobar')
    })

    it('should set isContentPresent to true when content is passed to write()', () => {
        const options = { stdout: true, writeStream: { write: jest.fn() } as unknown as WriteStream }
        const reporter = new WDIOReporter(options)
        expect(reporter.isContentPresent).toBe(false)
        reporter.write('foobar')
        expect(reporter.isContentPresent).toBe(true)
    })

    describe('outputDir options', () => {
        jest.mock('fs-extra')
        let ensureDirSyncSpy: jest.SpyInstance
        beforeEach(() => {
            ensureDirSyncSpy = jest.spyOn(fse, 'ensureDirSync')
        })
        it('should create directory if outputDir given and not existing', () => {
            const options = { outputDir: './tempDir', logFile: '' }
            new WDIOReporter(options)

            expect(ensureDirSyncSpy).toHaveBeenCalled()
            expect(ensureDirSyncSpy).toHaveBeenCalledWith('./tempDir')
        })
        it('should handle invalid directory for outputDir', () => {
            expect(() => {
                // @ts-expect-error
                new WDIOReporter({ outputDir: true })
            }).toThrowError()
        })
        afterEach(() => {
            ensureDirSyncSpy.mockClear()
        })
    })

    afterAll(() => {
        eventsOnSpy.mockRestore()
    })
})
