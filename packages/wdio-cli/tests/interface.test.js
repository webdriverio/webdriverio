import flatten from 'lodash.flattendeep'
import WDIOCLIInterface from '../src/interface'

const config = {}
const specs = ['/some/path/to/test.js']

jest.useFakeTimers()

describe('cli interface', () => {
    let wdioCliInterface

    beforeEach(() => {
        wdioCliInterface = new WDIOCLIInterface(config, specs)
    })

    it('should add jobs', () => {
        wdioCliInterface.updateView = jest.fn()
        wdioCliInterface.emit('job:start', { cid: '0-0' })
        expect(wdioCliInterface.updateView.mock.calls).toHaveLength(1)
        expect(wdioCliInterface.jobs.size).toBe(1)
    })

    it('should mark jobs as pass or failed', () => {
        wdioCliInterface.updateView = jest.fn()
        wdioCliInterface.emit('job:start', { cid: '0-0' })
        wdioCliInterface.emit('job:start', { cid: '0-1' })
        expect(wdioCliInterface.result.finished).toBe(0)
        expect(wdioCliInterface.result.passed).toBe(0)
        expect(wdioCliInterface.result.failed).toBe(0)
        wdioCliInterface.emit('job:end', { cid: '0-0', passed: true })
        expect(wdioCliInterface.result.finished).toBe(1)
        expect(wdioCliInterface.result.passed).toBe(1)
        expect(wdioCliInterface.result.failed).toBe(0)
        wdioCliInterface.emit('job:end', { cid: '0-1', passed: false })
        expect(wdioCliInterface.result.finished).toBe(2)
        expect(wdioCliInterface.result.passed).toBe(1)
        expect(wdioCliInterface.result.failed).toBe(1)
    })

    it('should allow to store reporter messages', () => {
        wdioCliInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'bar'
        })
        expect(wdioCliInterface.messages).toEqual({ reporter: { foo: ['bar'] } })
    })

    it('should update clock', async () => {
        wdioCliInterface.updateClock()
        jest.runTimersToTime(250)
        expect(wdioCliInterface.interface.clearLine.mock.calls).toHaveLength(3)
        expect(wdioCliInterface.interface.write.mock.calls).toHaveLength(3)
    })

    it('should log nothing if ansi is not supported and job was added', () => {
        wdioCliInterface.hasAnsiSupport = false
        wdioCliInterface.jobs.set('0-0', {})
        wdioCliInterface.jobs.set('0-1', {})
        wdioCliInterface.result = {
            finished: 3,
            passed: 1,
            failed: 2
        }
        wdioCliInterface.updateView()
        expect(wdioCliInterface.interface.log.mock.calls).toHaveLength(0)
    })

    it('should update view if ansi is not supported', () => {
        wdioCliInterface.specs = [1, 2, 3, 4, 5]
        wdioCliInterface.hasAnsiSupport = false
        wdioCliInterface.jobs.set('0-0', {})
        wdioCliInterface.jobs.set('0-1', {})
        wdioCliInterface.result = {
            finished: 3,
            passed: 1,
            failed: 2
        }
        wdioCliInterface.updateView(true)
        expect(
            wdioCliInterface.interface.log.mock.calls[0][0]
        ).toEqual('🕑  Running: 2, 1 passed, 2 failed, 5 total (60% completed)')
    })

    it('should update view if ansi is supported', () => {
        wdioCliInterface.hasAnsiSupport = true
        wdioCliInterface.updateClock = jest.fn()
        wdioCliInterface.specs = [1, 2, 3, 4, 5]
        wdioCliInterface.jobs.set('0-0', { specs: ['/foo/bar.js'], caps: { browserName: 'chrome' } })
        wdioCliInterface.jobs.set('0-1', { specs: ['/bar/foo.js'], caps: { browserName: 'firefox' } })
        wdioCliInterface.jobs.set('0-2', { specs: ['/bar/foo.js'], caps: { browserName: 'safari' } })
        wdioCliInterface.result = {
            finished: 3,
            passed: 1,
            failed: 2
        }

        wdioCliInterface.updateView()
        expect(wdioCliInterface.interface.log.mock.calls).toHaveLength(7)
        expect(wdioCliInterface.interface.log.mock.calls[1][0])
            .toBe('black  RUNNING ', '0-0', 'in', 'chrome', '-', '/foo/bar.js')
        expect(wdioCliInterface.interface.log.mock.calls[1][0])
            .toBe('black  RUNNING ', '0-1', 'in', 'firefox', '-', '/bar/foo.js')
        expect(wdioCliInterface.interface.log.mock.calls[6].join(' '))
            .toContain('(60% completed)')

        wdioCliInterface.interface.log.mockClear()
        wdioCliInterface.jobs.delete('0-0')
        wdioCliInterface.jobs.delete('0-1')
        wdioCliInterface.jobs.delete('0-2')
        wdioCliInterface.result.finished = 5
        wdioCliInterface.result.passed = 3
        wdioCliInterface.interface.stdoutBuffer = ['foo', 'bar']
        wdioCliInterface.interface.stderrBuffer = ['bar', 'foo']
        wdioCliInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'some reporter output'
        })
        wdioCliInterface.updateView()

        const output = flatten(wdioCliInterface.interface.log.mock.calls)
        expect(output).toContain('black "foo" Reporter:')
        expect(output).toContain('black Stdout:\nfoobar')
        expect(output).toContain('black \nStderr:\nbarfoo')
        expect(output).toContain('(100% completed)')
    })
})
