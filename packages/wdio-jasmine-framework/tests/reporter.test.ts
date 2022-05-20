import logger from '@wdio/logger'
import { EventEmitter } from 'node:events'

import JasmineReporter from '../src/reporter'

const log = logger('')

let jasmineReporter: JasmineReporter
let runnerReporter: EventEmitter

const PARAMS = {
    cid: '0-2',
    capabilities: { browserName: 'foobar' },
    specs: ['/foo/bar.test.js']
}

beforeEach(() => {
    runnerReporter = { emit: jest.fn() } as any
    jasmineReporter = new JasmineReporter(runnerReporter, PARAMS)
})

test('suiteStarted', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })

    expect((runnerReporter.emit as jest.Mock).mock.calls[0][0]).toBe('suite:start')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].uid).toBe('some test suite23')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].title).toBe('some test suite')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].type).toBe('suite')
})

test('specStarted', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })

    expect((runnerReporter.emit as jest.Mock).mock.calls[1][0]).toBe('test:start')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].uid).toBe('some test spec24')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].title).toBe('some test spec')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].type).toBe('test')
    expect(jasmineReporter['_parent'][0].tests).toBe(1)
})

test('specStarted without root describe', () => {
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })
    expect(jasmineReporter['_parent']).toHaveLength(0)
    expect(log.warn).toBeCalledTimes(1)
})

test('specDone', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })
    ;(runnerReporter.emit as jest.Mock).mockReset()
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [],
        status: 'passed',
        fullName: 'foobar'
    })

    expect((runnerReporter.emit as jest.Mock).mock.calls[0][0]).toBe('test:pass')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].uid).toBe('some test spec24')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].pending).toBe(false)
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][0]).toBe('test:end')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].uid).toBe('some test spec24')

    ;(runnerReporter.emit as jest.Mock).mockReset()
    jasmineReporter.specDone({
        id: '25',
        description: 'some failing test spec',
        failedExpectations: [new Error('foobar') as any],
        status: 'failed',
        fullName: 'foobar'
    })
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][0]).toBe('test:fail')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].uid).toBe('some failing test spec25')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].pending).toBe(false)
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].error.message).toBe('foobar')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][0]).toBe('test:end')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].uid).toBe('some failing test spec25')

    ;(runnerReporter.emit as jest.Mock).mockReset()
    jasmineReporter.specDone({
        id: '26',
        description: 'some pending test spec',
        failedExpectations: [],
        status: 'pending',
        pendingReason: 'for no reason',
        fullName: 'foobar'
    })
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][0]).toBe('test:pending')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].uid).toBe('some pending test spec26')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].pending).toBe(true)
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].pendingReason).toBe('for no reason')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][0]).toBe('test:end')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].uid).toBe('some pending test spec26')

    ;(runnerReporter.emit as jest.Mock).mockReset()
    jasmineReporter.specDone({
        id: '27',
        description: 'some excluded test spec',
        failedExpectations: [],
        status: 'excluded',
        fullName: 'foobar'
    })
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][0]).toBe('test:pending')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].cid).toBe('0-2')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].uid).toBe('some excluded test spec27')
    expect((runnerReporter.emit as jest.Mock).mock.calls[0][1].pending).toBe(true)
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][0]).toBe('test:end')
    expect((runnerReporter.emit as jest.Mock).mock.calls[1][1].uid).toBe('some excluded test spec27')
})

test('specDone should pass multiple failed expectations as errors', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [
            { message: 'I failed' },
            { message: 'I failed too!' }
        ] as any,
        status: 'failed',
        fullName: 'foobar'
    })

    expect((runnerReporter.emit as jest.Mock).mock.calls[2][0]).toBe('test:fail')
    // We still assign the first failedExpectation to 'error' for backwards compatibility
    expect((runnerReporter.emit as jest.Mock).mock.calls[2][1].error.message).toBe('I failed')
    expect((runnerReporter.emit as jest.Mock).mock.calls[2][1].errors.length).toBe(2)
    expect((runnerReporter.emit as jest.Mock).mock.calls[2][1].errors[0].message).toBe('I failed')
    expect((runnerReporter.emit as jest.Mock).mock.calls[2][1].errors[1].message).toBe('I failed too!')
})

test('suiteDone', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })
    jasmineReporter.suiteDone({ id: '23', description: 'some test suite', fullName: 'foobar' })
    expect((runnerReporter.emit as jest.Mock).mock.calls[2][0]).toBe('suite:end')

    /**
     * check run time errors in suites
     */
    jasmineReporter.suiteStarted({ id: '25', description: 'some error prone suite', fullName: 'foobar' })
    jasmineReporter.suiteDone({
        id: '25',
        description: 'some error prone suite',
        failedExpectations: [new Error('foobar') as any],
        fullName: 'foobar'
    })
    expect((runnerReporter.emit as jest.Mock).mock.calls[3][0]).toBe('suite:start')
    expect((runnerReporter.emit as jest.Mock).mock.calls[4][0]).toBe('test:start')
    expect((runnerReporter.emit as jest.Mock).mock.calls[4][1].title).toBe('<unknown test>')
    expect((runnerReporter.emit as jest.Mock).mock.calls[5][0]).toBe('test:fail')
    expect((runnerReporter.emit as jest.Mock).mock.calls[5][1].error.message).toBe('foobar')
    expect((runnerReporter.emit as jest.Mock).mock.calls[6][0]).toBe('test:end')
    expect((runnerReporter.emit as jest.Mock).mock.calls[7][0]).toBe('suite:end')
})

test('getFailedCount', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' })
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [new Error('foobar') as any],
        status: 'failed',
        fullName: 'foobar'
    })
    jasmineReporter.suiteDone({ id: '23', description: 'some test suite', fullName: 'foobar' })
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('do not clean stack option', () => {
    const error = new Error('foobar')
    error.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const error2 = new Error('foobar2')
    error2.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const event = { id: '24', description: 'some test spec', failedExpectations: [error as any], status: 'failed', fullName: 'foobar' }
    const event2 = { id: '24', description: 'some test spec', failedExpectations: [error2 as any], status: 'failed', fullName: 'foobar' }
    const dirtyRunnerReporter: EventEmitter = { emit: jest.fn() } as any
    const dirtyJasmineReporter = new JasmineReporter(dirtyRunnerReporter, Object.assign({ cleanStack: false }, PARAMS))
    jasmineReporter.specDone(event)
    dirtyJasmineReporter.specDone(event2)
    expect(
        (dirtyRunnerReporter.emit as jest.Mock).mock.calls[0][1].error.stack.split('\n').length
    ).toBeGreaterThan(
        (runnerReporter.emit as jest.Mock).mock.calls[0][1].error.stack.split('\n').length
    )
})

test('cleanStack should return if no stack is given', () => {
    const error = { message: 'foobar' }
    expect(jasmineReporter.cleanStack(error as any)).toEqual(error)
})

afterEach(() => {
    (runnerReporter.emit as jest.Mock).mockClear()
})
