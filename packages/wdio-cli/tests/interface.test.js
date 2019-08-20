import WDIOCLInterface from '../src/interface'
import chalk from 'chalk'

const config = {}
const specs = ['/some/path/to/test.js']
global.console.log = jest.fn()

describe('cli interface', () => {
    let wdioClInterface

    beforeEach(() => {
        wdioClInterface = new WDIOCLInterface(config, specs, 5)
        wdioClInterface.log = jest.fn().mockImplementation((...args) => args)
    })

    it('should add jobs', () => {
        wdioClInterface.emit('job:start', { cid: '0-0' })
        expect(wdioClInterface.jobs.size).toBe(1)
    })

    it('should mark jobs as pass or failed', () => {
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
    })

    it('should mark jobs as retried when failing', () => {
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

    it('should allow to store reporter messages', () => {
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: '123'
        })
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: '456'
        })
        expect(wdioClInterface.messages).toEqual({ reporter: { foo: ['123', '456'] } })
    })

    it('should print test error', () => {
        wdioClInterface.onTestError = jest.fn()
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'printFailureMessage',
            content: 'printFailureMessage'
        })
        expect(wdioClInterface.onTestError).toBeCalledWith('printFailureMessage')
        expect(wdioClInterface.messages).toEqual({ reporter: {} })
    })

    it('should print reporter messages in watch mode', () => {
        wdioClInterface.isWatchMode = true
        wdioClInterface.printReporters = jest.fn()

        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'bar'
        })

        expect(wdioClInterface.printReporters).toBeCalledTimes(1)
        expect(wdioClInterface.messages).toEqual({ reporter: { foo: ['bar'] } })
    })

    it('should not store any other messages', () => {
        wdioClInterface.printReporters = jest.fn()

        expect(wdioClInterface.onMessage({
            origin: 'worker',
            name: 'error',
            content: 'foobar'
        })).toEqual([undefined, 'worker', 'error', 'foobar'])

        expect(wdioClInterface.messages).toEqual({ reporter: {} })
        expect(wdioClInterface.printReporters).not.toBeCalled()
    })

    it('should ignore messages that do not contain a proper origin', () => {
        wdioClInterface.onMessage({ foo: 'bar' })
        expect(wdioClInterface.messages).toEqual({ reporter: {} })
    })

    it('should render a debug screen when command was called', () => {
        expect(wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'start',
            params: { introMessage: 'foobar' }
        })).toBe(true)
        expect(wdioClInterface.inDebugMode).toBe(true)
    })

    it('should exit from debug screen', () => {
        wdioClInterface.inDebugMode = true
        expect(wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'stop'
        })).toBe(false)
        expect(wdioClInterface.inDebugMode).toBe(false)
    })

    describe('setup', () => {
        it('called within constructor', () => {
            wdioClInterface.onStart = jest.fn()
            expect(wdioClInterface.result).toEqual({
                finished: 0,
                passed: 0,
                retries: 0,
                failed: 0
            })
            expect(wdioClInterface.messages).toEqual({ reporter: {} })
        })

        it('called explicitly', () => {
            wdioClInterface.onStart = jest.fn()
            wdioClInterface.result = {}
            wdioClInterface.messages = {}
            wdioClInterface.setup()
            expect(wdioClInterface.result).toEqual({
                finished: 0,
                passed: 0,
                retries: 0,
                failed: 0
            })
            expect(wdioClInterface.messages).toEqual({ reporter: {} })
        })
    })

    describe('onStart', () => {
        const scenarios = [{
            inDebugMode: false,
            isWatchMode: false,
            timesCalled: 2
        }, {
            inDebugMode: true,
            isWatchMode: false,
            timesCalled: 3
        }, {
            inDebugMode: false,
            isWatchMode: true,
            timesCalled: 3
        }, {
            inDebugMode: true,
            isWatchMode: true,
            timesCalled: 4
        }]

        scenarios.forEach(scenario => {
            it(`inDebugMode = ${scenario.inDebugMode}, isWatchMode = ${scenario.isWatchMode}`, () => {
                wdioClInterface.inDebugMode = scenario.inDebugMode
                wdioClInterface.isWatchMode = scenario.isWatchMode
                wdioClInterface.onStart()
                expect(wdioClInterface.log).toBeCalledTimes(scenario.timesCalled)
            })
        })
    })

    describe('onJobComplete', () => {
        it('all args with retries', () => {
            expect(wdioClInterface.onJobComplete('cid', {
                caps: { browserName: 'foo' },
                specs: ['bar']
            }, 3, 'msg')).toEqual(['[cid]', 'msg', 'in', 'foo', '- bar', '(3 retries)'])
        })

        it('job is undefined without retries', () => {
            expect(wdioClInterface.onJobComplete('cid', undefined, 0, 'msg')).toEqual(['[cid]', 'msg'])
        })
    })

    describe('getFilenames', () => {
        it('empty array', () => {
            expect(wdioClInterface.getFilenames([])).toEqual('')
        })

        it('no args', () => {
            expect(wdioClInterface.getFilenames()).toEqual('')
        })

        it('no args', () => {
            expect(wdioClInterface.getFilenames(['foo', 'bar'])).toEqual('- foo, bar')
        })
    })

    describe('onSpec', () => {
        const { cid, job, retries } = { cid: 'cid', job: 'job', retries: 'retries' }
        const scenarios = [{
            method: 'onSpecRunning',
            cid,
            job: 'foo',
            retries: 0,
            message: chalk.bold.cyan('RUNNING')
        }, {
            method: 'onSpecRetry',
            cid,
            job,
            retries,
            message: chalk.bold.yellow('RETRYING')
        }, {
            method: 'onSpecPass',
            cid,
            job,
            retries,
            message: chalk.bold.green('PASSED')
        }, {
            method: 'onSpecFailure',
            cid,
            job,
            retries,
            message: chalk.bold.red('FAILED')
        }]

        scenarios.forEach(scenario => {
            it(scenario.method, () => {
                wdioClInterface.onJobComplete = jest.fn()
                wdioClInterface.jobs.set('cid', scenario.job)
                wdioClInterface[scenario.method](scenario.cid, scenario.job, scenario.retries)
                expect(wdioClInterface.onJobComplete).toBeCalledWith(scenario.cid, scenario.job, scenario.retries, scenario.message)
            })
        })
    })

    describe('sigintTrigger', () => {
        it('should print message with jobs', () => {
            wdioClInterface.jobs.set('cid', {})
            expect(wdioClInterface.sigintTrigger()[0]).toContain('Ending WebDriver sessions gracefully')
        })

        it('should print message without jobs', () => {
            expect(wdioClInterface.sigintTrigger()[0]).toContain('Ended WebDriver sessions gracefully')
        })

        it('should do nothing in debug mode', () => {
            wdioClInterface.inDebugMode = true
            expect(wdioClInterface.sigintTrigger()).toBe(false)
        })
    })

    describe('printReporters', () => {
        it('finalise should print reporters and summary', () => {
            wdioClInterface.messages = {
                reporter: {
                    foo: ['bar']
                }
            }
            wdioClInterface.printReporters()
            expect(wdioClInterface.messages.reporter).toEqual({})
            expect(wdioClInterface.log).toBeCalledTimes(2)
            expect(wdioClInterface.log.mock.calls[0][1]).toContain('"foo" Reporter:')
            expect(wdioClInterface.log.mock.calls[1][0]).toContain('bar')
        })
    })

    describe('finalise', () => {
        it('finalise should print reporters and summary', () => {
            wdioClInterface.printReporters = jest.fn()
            wdioClInterface.printSummary = jest.fn()
            wdioClInterface.finalise()
            expect(wdioClInterface.printReporters).toBeCalledTimes(1)
            expect(wdioClInterface.printSummary).toBeCalledTimes(1)
        })

        it('finalise should do nothing in watch mode', () => {
            wdioClInterface.isWatchMode = true
            wdioClInterface.printReporters = jest.fn()
            wdioClInterface.printSummary = jest.fn()
            wdioClInterface.finalise()
            expect(wdioClInterface.printReporters).toBeCalledTimes(0)
            expect(wdioClInterface.printSummary).toBeCalledTimes(0)
        })
    })

    describe('printSummary', () => {
        it('retries', () => {
            wdioClInterface.totalWorkerCnt = 2
            wdioClInterface.result.retries = 33
            expect(wdioClInterface.printSummary().some(x => x.includes(33))).toBe(true)
        })

        it('failed', () => {
            wdioClInterface.result.failed = 44
            expect(wdioClInterface.printSummary().some(x => x.includes(44))).toBe(true)
        })

        it('percentCompleted', () => {
            wdioClInterface.totalWorkerCnt = 31
            wdioClInterface.result.finished = 13
            const result = Math.round(wdioClInterface.result.finished / wdioClInterface.totalWorkerCnt * 100)
            expect(wdioClInterface.printSummary().some(x => x.includes(result))).toBe(true)
        })

        it('percentCompleted without workers', () => {
            wdioClInterface.totalWorkerCnt = 0
            expect(wdioClInterface.printSummary().some(x => x.includes(0))).toBe(true)
        })
    })

    describe('onTestError', () => {
        it('onTestError', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                fullTitle: 'FULL_TITLE',
                error: {
                    type: 'ERROR_TYPE',
                    message: 'ERROR_MESSAGE'
                }
            })

            expect(result[0]).toContain('CID')
            expect(result[1]).toContain('ERROR_TYPE')
            expect(result[1]).toContain('ERROR_MESSAGE')
            expect(result[1]).toContain('FULL_TITLE')
        })

        it('no error', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                fullTitle: 'FULL_TITLE'
            })

            expect(result[1]).toContain('Error')
            expect(result[1]).toContain('Uknown error.')
        })

        it('string error', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                fullTitle: 'FULL_TITLE',
                error: 'STRING_ERROR'
            })

            expect(result[1]).toContain('Error')
            expect(result[1]).toContain('STRING_ERROR')
        })
    })
})
