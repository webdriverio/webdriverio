import logger from '@wdio/logger'

import JasmineReporter from '../src/reporter'

const log = logger()

let jasmineReporter
let runnerReporter

const PARAMS = {
    cid: '0-2',
    capabilities: { browserName: 'foobar' },
    specs: ['/foo/bar.test.js']
}

beforeEach(() => {
    runnerReporter = { emit: jest.fn() }
    jasmineReporter = new JasmineReporter(runnerReporter, PARAMS)
})

test('suiteStarted', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })

    expect(runnerReporter.emit.mock.calls[0][0]).toBe('suite:start')
    expect(runnerReporter.emit.mock.calls[0][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[0][1].uid).toBe('some test suite23')
    expect(runnerReporter.emit.mock.calls[0][1].title).toBe('some test suite')
    expect(runnerReporter.emit.mock.calls[0][1].type).toBe('suite')
})

test('specStarted', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })

    expect(runnerReporter.emit.mock.calls[1][0]).toBe('test:start')
    expect(runnerReporter.emit.mock.calls[1][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[1][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[1][1].title).toBe('some test spec')
    expect(runnerReporter.emit.mock.calls[1][1].type).toBe('test')
    expect(jasmineReporter.parent[0].tests).toBe(1)
})

test('specStarted without root describe', () => {
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    expect(jasmineReporter.parent).toHaveLength(0)
    expect(log.warn).toBeCalledTimes(1)
})

test('specDone', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [], status: 'passed' })

    expect(runnerReporter.emit.mock.calls[2][0]).toBe('test:pass')
    expect(runnerReporter.emit.mock.calls[2][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[2][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[2][1].pending).toBe(false)
    expect(runnerReporter.emit.mock.calls[3][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[3][1].uid).toBe('some test spec24')

    jasmineReporter.specDone({
        id: 25, description: 'some failing test spec', failedExpectations: [new Error('foobar')], status: 'failed'
    })
    expect(runnerReporter.emit.mock.calls[4][0]).toBe('test:fail')
    expect(runnerReporter.emit.mock.calls[4][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[4][1].uid).toBe('some failing test spec25')
    expect(runnerReporter.emit.mock.calls[4][1].pending).toBe(false)
    expect(runnerReporter.emit.mock.calls[4][1].error.message).toBe('foobar')
    expect(runnerReporter.emit.mock.calls[5][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[5][1].uid).toBe('some failing test spec25')

    jasmineReporter.specDone({
        id: 26, description: 'some pending test spec', failedExpectations: [], status: 'pending', pendingReason: 'for no reason'
    })
    expect(runnerReporter.emit.mock.calls[6][0]).toBe('test:pending')
    expect(runnerReporter.emit.mock.calls[6][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[6][1].uid).toBe('some pending test spec26')
    expect(runnerReporter.emit.mock.calls[6][1].pending).toBe(true)
    expect(runnerReporter.emit.mock.calls[6][1].pendingReason).toBe('for no reason')
    expect(runnerReporter.emit.mock.calls[7][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[7][1].uid).toBe('some pending test spec26')

    jasmineReporter.specDone({
        id: 27, description: 'some excluded test spec', failedExpectations: [], status: 'excluded'
    })
    expect(runnerReporter.emit.mock.calls[8][0]).toBe('test:pending')
    expect(runnerReporter.emit.mock.calls[8][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[8][1].uid).toBe('some excluded test spec27')
    expect(runnerReporter.emit.mock.calls[8][1].pending).toBe(true)
    expect(runnerReporter.emit.mock.calls[9][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[9][1].uid).toBe('some excluded test spec27')
})

test('specDone should pass multiple failed expectations as errors', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [{ message: 'I failed' }, { message: 'I failed too!' }], status: 'failed' })

    expect(runnerReporter.emit.mock.calls[2][0]).toBe('test:fail')
    // We still assign the first failedExpectation to 'error' for backwards compatibility
    expect(runnerReporter.emit.mock.calls[2][1].error.message).toBe('I failed')
    expect(runnerReporter.emit.mock.calls[2][1].errors.length).toBe(2)
    expect(runnerReporter.emit.mock.calls[2][1].errors[0].message).toBe('I failed')
    expect(runnerReporter.emit.mock.calls[2][1].errors[1].message).toBe('I failed too!')
})

test('suiteDone', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.suiteDone({ id: 23, description: 'some test suite' })
    expect(runnerReporter.emit.mock.calls[2][0]).toBe('suite:end')

    /**
     * check run time errors in suites
     */
    jasmineReporter.suiteStarted({ id: 25, description: 'some error prone suite' })
    jasmineReporter.suiteDone({
        id: 25, description: 'some error prone suite', failedExpectations: [new Error('foobar')]
    })
    expect(runnerReporter.emit.mock.calls[3][0]).toBe('suite:start')
    expect(runnerReporter.emit.mock.calls[4][0]).toBe('test:start')
    expect(runnerReporter.emit.mock.calls[4][1].title).toBe('<unknown test>')
    expect(runnerReporter.emit.mock.calls[5][0]).toBe('test:fail')
    expect(runnerReporter.emit.mock.calls[5][1].error.message).toBe('foobar')
    expect(runnerReporter.emit.mock.calls[6][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[7][0]).toBe('suite:end')
})

test('getFailedCount', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({
        id: 24, description: 'some test spec', failedExpectations: [new Error('foobar')], status: 'failed'
    })
    jasmineReporter.suiteDone({ id: 23, description: 'some test suite' })
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('do not clean stack option', () => {
    const error = new Error('foobar')
    error.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const error2 = new Error('foobar2')
    error2.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const event = { id: 24, description: 'some test spec', failedExpectations: [error], status: 'failed' }
    const event2 = { id: 24, description: 'some test spec', failedExpectations: [error2], status: 'failed' }
    const dirtyRunnerReporter = { emit: jest.fn() }
    const dirtyJasmineReporter = new JasmineReporter(dirtyRunnerReporter, Object.assign({ cleanStack: false }, PARAMS))
    jasmineReporter.specDone(event)
    dirtyJasmineReporter.specDone(event2)
    expect(
        dirtyRunnerReporter.emit.mock.calls[0][1].error.stack.split('\n').length
    ).toBeGreaterThan(
        runnerReporter.emit.mock.calls[0][1].error.stack.split('\n').length
    )
})

test('cleanStack should return if no stack is given', () => {
    const error = { message: 'foobar' }
    expect(jasmineReporter.cleanStack(error)).toEqual(error)
})

afterEach(() => {
    runnerReporter.emit.mockClear()
})
