import flatten from 'lodash.flattendeep'
import logUpdate from 'log-update'
import WDIOCLInterface from '../src/interface'

const config = {}
const specs = ['/some/path/to/test.js']

jest.useFakeTimers()

const stdout = { getContentsAsString: jest.fn().mockReturnValue(false) }
const stderr = { getContentsAsString: jest.fn().mockReturnValue(false) }

describe('cli interface', () => {
    let wdioClInterface

    beforeEach(() => {
        wdioClInterface = new WDIOCLInterface(config, specs, 5, stdout, stderr)
        logUpdate.mockClear()
    })

    it('should add jobs', () => {
        wdioClInterface.updateView = jest.fn()
        wdioClInterface.emit('job:start', { cid: '0-0' })
        expect(wdioClInterface.updateView.mock.calls).toHaveLength(1)
        expect(wdioClInterface.jobs.size).toBe(1)
    })

    it('should mark jobs as pass or failed', () => {
        delete process.env.CI
        wdioClInterface.updateView = jest.fn()
        wdioClInterface.emit('job:start', { cid: '0-0' })
        wdioClInterface.emit('job:start', { cid: '0-1' })
        expect(wdioClInterface.result.finished).toBe(0)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-0', passed: true })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-1', passed: false })
        expect(wdioClInterface.result.finished).toBe(2)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.failed).toBe(1)
        process.env.CI = 1
    })

    it('should print CI friendly', () => {
        wdioClInterface.printJobUpdateCI = jest.fn()
        process.env.CI = 1
        wdioClInterface.emit('job:end', { cid: '0-0', passed: true })
        delete process.env.CI
        expect(wdioClInterface.printJobUpdateCI).toHaveBeenCalledTimes(1)
    })

    it('should mark jobs as retried when failing', () => {
        wdioClInterface.updateView = jest.fn()
        wdioClInterface.emit('job:start', { cid: '0-0' })
        wdioClInterface.emit('job:start', { cid: '0-1' })
        expect(wdioClInterface.result.finished).toBe(0)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.retries).toBe(0)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-0', passed: false, retries: 1 })
        expect(wdioClInterface.result.finished).toBe(0)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.retries).toBe(1)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-0', passed: true, retries: 0 })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(1)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-1', passed: false, retries: 1 })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(2)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-1', passed: false, retries: 0 })
        expect(wdioClInterface.result.finished).toBe(2)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(2)
        expect(wdioClInterface.result.failed).toBe(1)
    })

    it('printJobUpdateCI', () => {
        wdioClInterface.log = jest.fn()
        const job = {
            specs: ['/foo/bar.js'],
            caps: { browserName: 'chrome' }
        }
        wdioClInterface.printJobUpdateCI(job, true, 2)
        expect(wdioClInterface.log).toHaveBeenCalledWith(
            'bgGreen PASS -',
            'chrome',
            '/foo/bar.js',
            '(2 retries)'
        )
    })

    it('should allow to store reporter messages', () => {
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'bar'
        })
        expect(wdioClInterface.messages).toEqual({
            reporter: { foo: ['bar'] },
            worker: {}
        })
    })

    it('should allow to store worker messages', () => {
        wdioClInterface.onMessage({
            origin: 'worker',
            name: 'error',
            content: 'foobar'
        })
        expect(wdioClInterface.messages).toEqual({
            reporter: {},
            worker: { error: ['foobar'] }
        })
        wdioClInterface.onMessage({
            origin: 'worker',
            name: 'error',
            content: 'foobar2'
        })
        expect(wdioClInterface.messages).toEqual({
            reporter: {},
            worker: { error: ['foobar', 'foobar2'] }
        })
    })

    it('should ignore messages that do not contain a proper origin', () => {
        wdioClInterface.onMessage({ foo: 'bar' })
        expect(wdioClInterface.messages).toEqual({ reporter: {}, worker: {} })
    })

    it('should update clock', () => {
        wdioClInterface.updateClock()
        jest.runTimersToTime(250)
        expect(logUpdate.mock.calls).toHaveLength(3)
    })

    it('should log nothing if ansi is not supported and job was added', () => {
        wdioClInterface.hasAnsiSupport = false
        wdioClInterface.jobs.set('0-0', {})
        wdioClInterface.jobs.set('0-1', {})
        wdioClInterface.result = {
            finished: 3,
            passed: 1,
            retries: 0,
            failed: 2
        }
        wdioClInterface.updateView()
        expect(logUpdate.mock.calls).toHaveLength(0)
    })

    it('should update view if ansi is not supported', () => {
        wdioClInterface.specs = [1, 2, 3, 4, 5]
        wdioClInterface.hasAnsiSupport = false
        wdioClInterface.jobs.set('0-0', {})
        wdioClInterface.jobs.set('0-1', {})
        wdioClInterface.result = {
            finished: 3,
            passed: 1,
            retries: 0,
            failed: 2
        }
        wdioClInterface.updateView(true)
        expect(wdioClInterface.display[0])
            .toContain('2 running, 1 passed, 2 failed, 5 total (60% completed)')
    })

    it('should update view if ansi is supported', () => {
        wdioClInterface.isTTY = true
        wdioClInterface.hasAnsiSupport = true
        wdioClInterface.updateClock = jest.fn()
        wdioClInterface.specs = [1, 2, 3, 4, 5]
        wdioClInterface.jobs.set('0-0', { specs: ['/foo/bar.js'], caps: { browserName: 'chrome' } })
        wdioClInterface.jobs.set('0-1', { specs: ['/bar/foo.js'], caps: { browserName: 'firefox' } })
        wdioClInterface.jobs.set('0-2', { specs: ['/bar/foo.js'], caps: { browserName: 'safari' } })
        wdioClInterface.result = {
            finished: 3,
            passed: 1,
            retries: 0,
            failed: 2
        }

        wdioClInterface.updateView()
        expect(wdioClInterface.display).toHaveLength(7)
        expect(wdioClInterface.display[1])
            .toBe('black  RUNNING  0-0 in chrome - /foo/bar.js')
        expect(wdioClInterface.display[2])
            .toBe('black  RUNNING  0-1 in firefox - /bar/foo.js')
        expect(wdioClInterface.display[6])
            .toContain('(60% completed)')

        wdioClInterface.display = []
        wdioClInterface.sigintTrigger()
        expect(logUpdate).toHaveBeenCalledWith(
            '\n\nEnding WebDriver sessions gracefully ...\n(press ctrl+c again to hard kill the runner)')

        wdioClInterface.display = []
        wdioClInterface.jobs.delete('0-0')
        wdioClInterface.jobs.delete('0-1')
        wdioClInterface.jobs.delete('0-2')
        wdioClInterface.result.finished = 5
        wdioClInterface.result.passed = 3
        logUpdate.stdoutBuffer = ['foo', 'bar']
        logUpdate.stderrBuffer = ['bar', 'foo']
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'some reporter output'
        })
        wdioClInterface.onMessage({
            origin: 'worker',
            name: 'error',
            content: { stack: 'foobar' }
        })
        wdioClInterface.updateView()
        expect(logUpdate)
            .toHaveBeenCalledWith('\n\nEnded WebDriver sessions gracefully after a SIGINT signal was received!')
    })

    it('should print the reporters when printReporters is called', () => {
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'some reporter output'
        })
        wdioClInterface.onMessage({
            origin: 'worker',
            name: 'error',
            content: { stack: 'foobar' }
        })
        wdioClInterface.result.finished = 5
        wdioClInterface.result.passed = 3

        wdioClInterface.updateView()
        let output = flatten(logUpdate.mock.calls)
        expect(output.length).toBe(0)

        wdioClInterface.printReporters()
        expect(wdioClInterface.display).toContain('black "foo" Reporter:')
    })

    it('should allow to print stdout logs', () => {
        wdioClInterface.stdoutBuffer = ['out-1', 'out-2', 'out-3', 'out-4', 'out-5']
        wdioClInterface.stderrBuffer = ['err-1', 'err-2', 'err-3', 'err-4', 'err-5']
        wdioClInterface.messages.worker.error = ['worker-1', 'worker-2', 'worker-3', 'worker-4', 'worker-5']
        wdioClInterface.printStdout(3)
        expect(wdioClInterface.display[0])
            .toBe('black Stdout:\nout-3out-4out-5')
        expect(wdioClInterface.display[1])
            .toBe('black Stderr:\nerr-3err-4err-5')
        expect(wdioClInterface.display[2])
            .toBe('black Worker Error:\n\n\n')
    })

    it('should print log messages from stdout/stderr buffer', () => {
        wdioClInterface.stdout.getContentsAsString = jest.fn()
            .mockReturnValue('foobar')
        wdioClInterface.stderr.getContentsAsString = jest.fn()
            .mockReturnValue('foobar')
        wdioClInterface.printStdout()
        expect(wdioClInterface.display).toEqual([
            'black Stdout:\nfoobar',
            'black Stderr:\nfoobar'
        ])
    })

    it('should be able to mark display when SIGINT is called', () => {
        wdioClInterface.updateView = jest.fn()
        expect(wdioClInterface.sigintTriggered).toBe(false)
        expect(wdioClInterface.updateView).toBeCalledTimes(0)
        wdioClInterface.sigintTrigger()
        expect(wdioClInterface.sigintTriggered).toBe(true)
        expect(wdioClInterface.updateView).toBeCalledTimes(1)
    })

    it('should ignore to mark display when SIGINT is called but in debug mode', () => {
        wdioClInterface.inDebugMode = true
        wdioClInterface.updateView = jest.fn()
        expect(wdioClInterface.sigintTriggered).toBe(false)
        expect(wdioClInterface.updateView).toBeCalledTimes(0)
        wdioClInterface.sigintTrigger()
        expect(wdioClInterface.sigintTriggered).toBe(false)
        expect(wdioClInterface.updateView).toBeCalledTimes(0)
    })

    it('should render a debug screen when command was called', () => {
        wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'start',
            params: { introMessage: 'foobar' }
        })
        expect(wdioClInterface.display).toHaveLength(0)
        expect(wdioClInterface.inDebugMode).toBe(true)
        expect(flatten(logUpdate.mock.calls))
            .toContain('yellow foobar')
    })

    it('should exit from debug screen', () => {
        wdioClInterface.updateView = jest.fn()
        wdioClInterface.inDebugMode = true
        wdioClInterface.sigintTriggered = true
        wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'stop'
        })
        expect(logUpdate).toHaveBeenCalledTimes(0)
        expect(wdioClInterface.updateView).toHaveBeenCalledTimes(1)
        expect(wdioClInterface.inDebugMode).toBe(false)
        expect(wdioClInterface.sigintTriggered).toBe(false)
    })

    it('has finalise to create a final display', () => {
        wdioClInterface.clearAll = jest.fn()
        wdioClInterface.printReporters = jest.fn()
        wdioClInterface.printStdout = jest.fn()
        wdioClInterface.printSummary = jest.fn()
        wdioClInterface.updateClock = jest.fn()
        wdioClInterface.reset = jest.fn()
        wdioClInterface.finalise()
        expect(wdioClInterface.printReporters).toBeCalledTimes(1)
        expect(wdioClInterface.printStdout).toBeCalledTimes(1)
        expect(wdioClInterface.printSummary).toBeCalledTimes(1)
        expect(wdioClInterface.updateClock).toBeCalledTimes(1)
    })
})
