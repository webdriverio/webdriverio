import path from 'node:path'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
import WDIOCLInterface from '../src/interface'
import { HookError } from '../src/utils'
import chalk from 'chalk'

const config = {}
const EMPTY_INTERFACE_MESSAGE_OBJECT = {
    reporter: {},
    debugger: {}
}

vi.mock('chalk')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('cli interface', () => {
    let wdioClInterface: WDIOCLInterface

    beforeEach(() => {
        global.console.log = vi.fn()
        wdioClInterface = new WDIOCLInterface(config as any, 5)
        wdioClInterface.log = vi.fn().mockImplementation((...args: any[]) => args)
    })

    it('should add jobs', () => {
        wdioClInterface.emit('job:start', { cid: '0-0', hasTests: true })
        expect(wdioClInterface['_jobs'].size).toBe(1)
    })

    it('should mark jobs as pass or failed', () => {
        wdioClInterface.emit('job:start', { cid: '0-0', hasTests: true })
        wdioClInterface.emit('job:start', { cid: '0-1', hasTests: true })
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
        wdioClInterface.emit('job:start', { cid: '0-0', hasTests: true })
        expect(wdioClInterface.result.finished).toBe(0)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.retries).toBe(0)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-0', passed: false, retries: 1 })
        expect(wdioClInterface.result.finished).toBe(0)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.retries).toBe(1)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:start', { cid: '0-0', hasTests: true })
        wdioClInterface.emit('job:end', { cid: '0-0', passed: true, retries: 0 })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(1)
        expect(wdioClInterface.result.failed).toBe(0)

        wdioClInterface.emit('job:start', { cid: '0-1', hasTests: true })
        wdioClInterface.emit('job:end', { cid: '0-1', passed: false, retries: 1 })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(2)
        expect(wdioClInterface.result.failed).toBe(0)
        wdioClInterface.emit('job:start', { cid: '0-1', hasTests: true })
        wdioClInterface.emit('job:end', { cid: '0-1', passed: false, retries: 0 })
        expect(wdioClInterface.result.finished).toBe(2)
        expect(wdioClInterface.result.passed).toBe(1)
        expect(wdioClInterface.result.retries).toBe(2)
        expect(wdioClInterface.result.failed).toBe(1)
    })

    it('should mark jobs as skipped', () => {
        wdioClInterface.emit('job:start', { cid: '0-0', hasTests: false })
        expect(wdioClInterface.result.finished).toBe(0)
        wdioClInterface.emit('job:end', { cid: '0-0' })
        expect(wdioClInterface.result.finished).toBe(1)
        expect(wdioClInterface.result.passed).toBe(0)
        expect(wdioClInterface.result.failed).toBe(0)
        expect(wdioClInterface.result.retries).toBe(0)
    })

    it('should allow to store reporter messages', () => {
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: '123'
        })
        wdioClInterface.onMessage({
            cid: '0-1',
            origin: 'reporter',
            name: 'foo',
            content: '456'
        })
        expect(wdioClInterface['_messages']).toEqual({
            ...EMPTY_INTERFACE_MESSAGE_OBJECT,
            reporter: { foo: ['123', '456'] }
        })
    })

    it('should print test error', () => {
        wdioClInterface.onTestError = vi.fn()
        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'printFailureMessage',
            content: 'printFailureMessage'
        })
        expect(wdioClInterface.onTestError).toBeCalledWith('printFailureMessage')
        expect(wdioClInterface['_messages']).toEqual(EMPTY_INTERFACE_MESSAGE_OBJECT)
    })

    it('should trigger job:start event on testFrameworkInit', () => {
        wdioClInterface.emit = vi.fn()
        wdioClInterface.onMessage({
            name: 'testFrameworkInit',
            content: 'content'
        })
        expect(wdioClInterface.emit).toBeCalledWith('job:start', 'content')
    })

    it('should print reporter messages in watch mode', () => {
        wdioClInterface['_isWatchMode'] = true
        wdioClInterface.printReporters = vi.fn()

        wdioClInterface.onMessage({
            origin: 'reporter',
            name: 'foo',
            content: 'bar'
        })

        expect(wdioClInterface.printReporters).toBeCalledTimes(1)
        expect(wdioClInterface['_messages']).toEqual({
            ...EMPTY_INTERFACE_MESSAGE_OBJECT,
            reporter: { foo: ['bar'] }
        })
    })

    it('should not store any other messages', () => {
        wdioClInterface.printReporters = vi.fn()

        expect(wdioClInterface.onMessage({
            cid: '0-0',
            origin: 'worker',
            name: 'barfoo',
            content: 'foobar'
        })).toEqual(['0-0', 'worker', 'barfoo', 'foobar'])

        expect(wdioClInterface['_messages']).toEqual(EMPTY_INTERFACE_MESSAGE_OBJECT)
        expect(wdioClInterface.printReporters).not.toBeCalled()
    })

    it('should print error message on worker error', () => {
        const err = { message: 'foo', stack: 'bar' }
        wdioClInterface.onMessage({
            cid: '0-0',
            origin: 'worker',
            name: 'error',
            content: err
        })

        expect(wdioClInterface.log).toBeCalledTimes(1)
        expect(wdioClInterface.log).toBeCalledWith('[0-0]', 'bold  Error: ', 'foo')
    })

    it('should print message on worker error', () => {
        const err = 'bar'
        wdioClInterface.onMessage({
            cid: '0-0',
            origin: 'worker',
            name: 'error',
            content: err
        })

        expect(wdioClInterface.log).toBeCalledTimes(1)
        expect(wdioClInterface.log).toBeCalledWith('[0-0]', 'bold  Error: ', 'bar')
    })

    it('should ignore messages that do not contain a proper origin', () => {
        // @ts-ignore test invalid param
        wdioClInterface.onMessage({ foo: 'bar' })
        expect(wdioClInterface['_messages']).toEqual(EMPTY_INTERFACE_MESSAGE_OBJECT)
    })

    it('should render a debug screen when command was called', () => {
        expect(wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'start',
            params: { introMessage: 'foobar' }
        })).toBe(true)
        expect(wdioClInterface['_inDebugMode']).toBe(true)
    })

    it('should exit from debug screen', () => {
        wdioClInterface['_inDebugMode'] = true
        expect(wdioClInterface.onMessage({
            origin: 'debugger',
            name: 'stop'
        })).toBe(false)
        expect(wdioClInterface['_inDebugMode']).toBe(false)
    })

    describe('setup', () => {
        it('called within constructor', () => {
            wdioClInterface.onStart = vi.fn()
            expect(wdioClInterface.result).toEqual({
                finished: 0,
                passed: 0,
                retries: 0,
                failed: 0
            })
            expect(wdioClInterface['_messages']).toEqual(EMPTY_INTERFACE_MESSAGE_OBJECT)
        })

        it('called explicitly', () => {
            wdioClInterface.onStart = vi.fn()
            wdioClInterface['_messages'] = {
                reporter: {},
                debugger: {}
            }
            wdioClInterface.setup()
            expect(wdioClInterface['_messages']).toEqual(EMPTY_INTERFACE_MESSAGE_OBJECT)
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
                wdioClInterface['_inDebugMode'] = scenario.inDebugMode
                wdioClInterface['_isWatchMode'] = scenario.isWatchMode
                wdioClInterface.onStart()
                expect(wdioClInterface.log).toBeCalledTimes(scenario.timesCalled)
            })
        })
    })

    describe('onJobComplete', () => {
        it('all args with retries', () => {
            expect(wdioClInterface.onJobComplete('cid', {
                caps: { browserName: 'foo' },
                specs: ['bar'],
                hasTests: true
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
        const cid = '0-0'
        const job = {
            caps: { browserName: 'foo' },
            specs: ['bar'],
            hasTests: true
        }
        const retries = 42
        const scenarios = [{
            method: 'onSpecRunning',
            cid,
            job,
            retries: 0,
            message: chalk.bold.cyan('RUNNING')
        }, {
            method: 'onSpecRetry',
            cid,
            job,
            retries,
            message: chalk.bold(chalk.yellow('RETRYING'))
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
                wdioClInterface.onJobComplete = vi.fn()
                wdioClInterface['_jobs'].set(scenario.cid, scenario.job)
                // @ts-expect-error
                wdioClInterface[scenario.method](scenario.cid, scenario.job, scenario.retries)
                expect(wdioClInterface.onJobComplete).toBeCalledWith(scenario.cid, scenario.job, scenario.retries, scenario.message)
            })
        })

        it('onSpecSkip', () => {
            wdioClInterface.onJobComplete = vi.fn()
            wdioClInterface['_jobs'].set('cid', job)
            wdioClInterface.onSpecSkip(cid, job)
            expect(wdioClInterface.onJobComplete).toBeCalledWith(cid, job, 0, 'SKIPPED', expect.any(Function))
        })

        it('onSpecRetry with delay', () => {
            wdioClInterface.onJobComplete = vi.fn()
            wdioClInterface['_specFileRetriesDelay'] = 2
            wdioClInterface['_jobs'].set('cid', job)
            wdioClInterface.onSpecRetry(cid, job, 3)
            expect(wdioClInterface.onJobComplete).toBeCalledWith(cid, job, 3, chalk.bold(chalk.yellow('RETRYING') + ' after 2s'))
        })
    })

    describe('sigintTrigger', () => {
        it('should print message with jobs', () => {
            wdioClInterface['_jobs'].set('0-0', {
                caps: { browserName: 'foo' },
                specs: ['bar'],
                hasTests: true
            })
            // @ts-expect-error
            expect(wdioClInterface.sigintTrigger()[0]).toContain('Ending WebDriver sessions gracefully')
        })

        it('should print message without jobs', () => {
            // @ts-expect-error
            expect(wdioClInterface.sigintTrigger()[0]).toContain('Ended WebDriver sessions gracefully')
        })

        it('should do nothing in debug mode', () => {
            wdioClInterface['_inDebugMode'] = true
            expect(wdioClInterface.sigintTrigger()).toBe(false)
        })
    })

    describe('printReporters', () => {
        it('finalise should print reporters and summary', () => {
            wdioClInterface['_messages'] = {
                reporter: {
                    foo: ['bar']
                },
                debugger: {}
            }
            wdioClInterface.printReporters()
            expect(wdioClInterface['_messages'].reporter).toEqual({})
            expect(wdioClInterface.log).toBeCalledTimes(2)
            expect(vi.mocked(wdioClInterface.log).mock.calls[0][1]).toContain('"foo" Reporter:')
            expect(vi.mocked(wdioClInterface.log).mock.calls[1][0]).toContain('bar')
        })
    })

    describe('finalise', () => {
        it('finalise should print reporters and summary', () => {
            wdioClInterface.printReporters = vi.fn()
            wdioClInterface.printSummary = vi.fn()
            wdioClInterface.finalise()
            expect(wdioClInterface.printReporters).toBeCalledTimes(1)
            expect(wdioClInterface.printSummary).toBeCalledTimes(1)
        })

        it('finalise should do nothing in watch mode', () => {
            wdioClInterface['_isWatchMode'] = true
            wdioClInterface.printReporters = vi.fn()
            wdioClInterface.printSummary = vi.fn()
            wdioClInterface.finalise()
            expect(wdioClInterface.printReporters).toBeCalledTimes(0)
            expect(wdioClInterface.printSummary).toBeCalledTimes(0)
        })
    })

    describe('printSummary', () => {
        it('retries', () => {
            wdioClInterface.totalWorkerCnt = 2
            wdioClInterface.result.retries = 33
            expect(wdioClInterface.printSummary().some(x => x.includes('yellow 33 retries'))).toBe(true)
        })

        it('failed', () => {
            wdioClInterface.result.failed = 44
            expect(wdioClInterface.printSummary().some(x => x.includes('red 44 failed'))).toBe(true)
        })

        it('skipped', () => {
            wdioClInterface['_skippedSpecs'] = 55
            expect(wdioClInterface.printSummary().some(x => x.includes('gray 55 skipped'))).toBe(true)
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

    it('logHookError', () => {
        const err = new HookError('foobar', 'somewhere')
        expect(wdioClInterface.logHookError(err)[0])
            .toContain('red SevereServiceError in "somewhere"')
    })

    describe('onTestError', () => {
        it('onTestError', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                fullTitle: 'FULL_TITLE',
                name: 'foobar',
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

        it('error with stack trace', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                fullTitle: 'FULL_TITLE',
                name: 'foobar',
                error: {
                    type: 'ERROR_TYPE',
                    message: 'ERROR_MESSAGE',
                    stack: 'ERROR_STACK',
                },
            })

            expect(result[0]).toContain('CID')
            expect(result[1]).toContain('ERROR_TYPE')
            expect(result[1]).toContain('ERROR_STACK')
            expect(result[1]).toContain('FULL_TITLE')
        })

        it('no error', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                name: 'foobar',
                fullTitle: 'FULL_TITLE'
            })

            expect(result[1]).toContain('Error')
            expect(result[1]).toContain('Unknown error.')
        })

        it('string error', () => {
            const result = wdioClInterface.onTestError({
                cid: 'CID',
                name: 'foobar',
                fullTitle: 'FULL_TITLE',
                // @ts-ignore simplify test
                error: 'STRING_ERROR'
            })

            expect(result[1]).toContain('Error')
            expect(result[1]).toContain('STRING_ERROR')
        })
    })

    afterEach(() => {
        wdioClInterface['_specFileRetriesDelay'] = 0
        vi.mocked(global.console.log).mockRestore()
    })
})
