import { describe, expect, vi, it, afterAll, afterEach } from 'vitest'

import { EventEmitter } from 'node:events'
import type { WriteStream } from 'node:fs'
import fs from 'node:fs'

import WDIOReporter from '../src/index.js'

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn().mockReturnValue({
            write: vi.fn(),
            end: vi.fn((cb) => cb())
        }),
        mkdirSync: vi.fn()
    }
}))

describe('WDIOReporter', () => {
    const eventsOnSpy = vi.spyOn(EventEmitter.prototype, 'on')

    it('constructor', () => {
        new WDIOReporter({ logFile: '/some/logpath' })
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('runner:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:pass', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:skip', expect.any(Function))
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
        const reporter = new WDIOReporter({ logFile: '/some/log/path' })
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should provide a function to write to output stream', () => {
        const reporter = new WDIOReporter({ logFile: '/some/log/path' })
        reporter.write('foobar')
        expect(reporter.outputStream.write).toBeCalledWith('foobar')
    })

    it('should allow an own writeable stream', () => {
        const customLogStream = fs.createWriteStream('/foo/bar')
        const reporter = new WDIOReporter({ stdout: true, writeStream: customLogStream })
        reporter.write('foobar')

        expect(customLogStream.write).toBeCalledWith('foobar')
    })

    it('should not create log file if no file name is given', () => {
        const options = { stdout: true, writeStream: { write: vi.fn() } as unknown as WriteStream }
        const reporter = new WDIOReporter(options)
        reporter.write('foobar')
        expect(options.writeStream.write).toBeCalledWith('foobar')
    })

    it('should set isContentPresent to true when content is passed to write()', () => {
        const options = { stdout: true, writeStream: { write: vi.fn() } as unknown as WriteStream }
        const reporter = new WDIOReporter(options)
        expect(reporter.isContentPresent).toBe(false)
        reporter.write('foobar')
        expect(reporter.isContentPresent).toBe(true)
    })

    describe('outputDir options', () => {
        it('should create directory if outputDir given and not existing', () => {
            const options = { outputDir: './tempDir', logFile: '' }
            new WDIOReporter(options)

            expect(fs.mkdirSync).toHaveBeenCalled()
            expect(fs.mkdirSync).toHaveBeenCalledWith('./tempDir', { recursive: true })
        })

        afterEach(() => {
            vi.mocked(fs.mkdirSync).mockClear()
        })
    })

    afterAll(() => {
        eventsOnSpy.mockRestore()
    })
})
