import JasmineReporter from '../src/reporter'

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
    jasmineReporter.emitQueue()

    expect(runnerReporter.emit.mock.calls[1][0]).toBe('test:start')
    expect(runnerReporter.emit.mock.calls[1][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[1][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[1][1].title).toBe('some test spec')
    expect(runnerReporter.emit.mock.calls[1][1].type).toBe('test')
    expect(jasmineReporter.parent[0].tests).toBe(1)
})

test('specDone', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [], status: 'passed' })
    jasmineReporter.emitQueue()

    expect(runnerReporter.emit.mock.calls[2][0]).toBe('test:pass')
    expect(runnerReporter.emit.mock.calls[2][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[2][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[2][1].pending).toBe(false)
    expect(runnerReporter.emit.mock.calls[3][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[3][1].uid).toBe('some test spec24')

    jasmineReporter.specDone({
        id: 25, description: 'some failing test spec', failedExpectations: [new Error('foobar')], status: 'failed'
    })
    jasmineReporter.emitQueue()
    expect(runnerReporter.emit.mock.calls[4][0]).toBe('test:fail')
    expect(runnerReporter.emit.mock.calls[4][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[4][1].uid).toBe('some failing test spec25')
    expect(runnerReporter.emit.mock.calls[4][1].pending).toBe(false)
    expect(runnerReporter.emit.mock.calls[4][1].error.message).toBe('foobar')
    expect(runnerReporter.emit.mock.calls[5][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[5][1].uid).toBe('some failing test spec25')

    jasmineReporter.specDone({
        id: 26, description: 'some pending test spec', failedExpectations: [], status: 'pending'
    })
    jasmineReporter.emitQueue()
    expect(runnerReporter.emit.mock.calls[6][0]).toBe('test:pending')
    expect(runnerReporter.emit.mock.calls[6][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[6][1].uid).toBe('some pending test spec26')
    expect(runnerReporter.emit.mock.calls[6][1].pending).toBe(true)
    expect(runnerReporter.emit.mock.calls[7][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[7][1].uid).toBe('some pending test spec26')

    jasmineReporter.specDone({
        id: 27, description: 'some excluded test spec', failedExpectations: [], status: 'excluded'
    })
    jasmineReporter.emitQueue()
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
    jasmineReporter.emitQueue()

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
    jasmineReporter.suiteDone({ id: 23, description: 'some test suite', failedExpectations: [] })

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

test('suiteDone - error in beforeAll and afterAll', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [], status: 'passed' })
    jasmineReporter.suiteDone({
        id: 23,
        description: 'some test suite',
        failedExpectations: [new Error('UserContext.beforeAll'), new Error('UserContext.afterAll')], status: 'failed'
    })

    // beforeAll
    expect(runnerReporter.emit.mock.calls[1][0]).toBe('hook:start')
    expect(runnerReporter.emit.mock.calls[1][1].title).toBe('"before all" hook')
    // We still assign the first failedExpectation to 'error' for backwards compatibility
    expect(runnerReporter.emit.mock.calls[2][0]).toBe('hook:end')
    expect(runnerReporter.emit.mock.calls[2][1].title).toBe('"before all" hook')
    expect(runnerReporter.emit.mock.calls[2][1].error.message).toBe('UserContext.beforeAll')
    expect(runnerReporter.emit.mock.calls[2][1].errors.length).toBe(1)
    expect(runnerReporter.emit.mock.calls[2][1].errors[0].message).toBe('UserContext.beforeAll')
    // spec that was queued
    expect(runnerReporter.emit.mock.calls[3][0]).toBe('test:start')
    expect(runnerReporter.emit.mock.calls[3][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[3][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[3][1].title).toBe('some test spec')
    expect(runnerReporter.emit.mock.calls[3][1].type).toBe('test')
    expect(runnerReporter.emit.mock.calls[4][0]).toBe('test:pass')
    expect(runnerReporter.emit.mock.calls[4][1].cid).toBe('0-2')
    expect(runnerReporter.emit.mock.calls[4][1].uid).toBe('some test spec24')
    expect(runnerReporter.emit.mock.calls[4][1].pending).toBe(false)
    expect(runnerReporter.emit.mock.calls[5][0]).toBe('test:end')
    expect(runnerReporter.emit.mock.calls[5][1].uid).toBe('some test spec24')
    // afterAll
    expect(runnerReporter.emit.mock.calls[6][0]).toBe('hook:start')
    expect(runnerReporter.emit.mock.calls[6][1].title).toBe('"after all" hook')
    expect(runnerReporter.emit.mock.calls[7][0]).toBe('hook:end')
    expect(runnerReporter.emit.mock.calls[7][1].title).toBe('"after all" hook')
    expect(runnerReporter.emit.mock.calls[7][1].error.message).toBe('UserContext.afterAll')
    expect(runnerReporter.emit.mock.calls[7][1].errors.length).toBe(1)
    expect(runnerReporter.emit.mock.calls[7][1].errors[0].message).toBe('UserContext.afterAll')
    // suiteDone
    expect(runnerReporter.emit.mock.calls[8][0]).toBe('suite:end')
})

test('getFailedCount - error in spec', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({
        id: 24, description: 'some test spec', failedExpectations: [new Error('foobar')], status: 'failed'
    })
    jasmineReporter.suiteDone({ id: 23, description: 'some test suite', failedExpectations: [] })
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('getFailedCount - error in beforeAll', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [], status: 'passed' })
    jasmineReporter.suiteDone({ id: 23,
        description: 'some test suite',
        failedExpectations: [new Error('UserContext.beforeAll')], status: 'failed' }
    )
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('getFailedCount - error in afterAll', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({ id: 24, description: 'some test spec', failedExpectations: [], status: 'passed' })
    jasmineReporter.suiteDone({ id: 23,
        description: 'some test suite',
        failedExpectations: [new Error('UserContext.afterAll')], status: 'failed' }
    )
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('getFailedCount - error in beforeAll, spec and afterAll', () => {
    jasmineReporter.suiteStarted({ id: 23, description: 'some test suite' })
    jasmineReporter.specStarted({ id: 24, description: 'some test spec' })
    jasmineReporter.specDone({
        id: 24, description: 'some test spec', failedExpectations: [new Error('foobar')], status: 'failed'
    })
    jasmineReporter.suiteDone({ id: 23,
        description: 'some test suite',
        failedExpectations: [new Error('UserContext.beforeAll'), new Error('UserContext.afterAll')], status: 'failed' }
    )
    // 1 suite failure and 1 spec failure
    expect(jasmineReporter.getFailedCount()).toBe(2)
})

test('do not clean stack option - spec', () => {
    const error = new Error('foobar')
    error.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const error2 = new Error('foobar2')
    error2.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const event = { id: 24, description: 'some test spec', failedExpectations: [error], status: 'failed' }
    const event2 = { id: 24, description: 'some test spec', failedExpectations: [error2], status: 'failed' }
    const dirtyRunnerReporter = { emit: jest.fn() }
    const dirtyJasmineReporter = new JasmineReporter(dirtyRunnerReporter, Object.assign({ cleanStack: false }, PARAMS))
    jasmineReporter.specDone(event)
    jasmineReporter.emitQueue()
    dirtyJasmineReporter.specDone(event2)
    dirtyJasmineReporter.emitQueue()
    expect(
        dirtyRunnerReporter.emit.mock.calls[0][1].error.stack.split('\n').length
    ).toBeGreaterThan(
        runnerReporter.emit.mock.calls[0][1].error.stack.split('\n').length
    )
})

test('do not clean stack option - suite', () => {
    // eslint-disable-next-line no-useless-escape
    const errorString = 'at UserContext.beforeAll (C:\example\test\specs/test.spec.js:3:10)'
    const error = new Error(errorString)
    error.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const error2 = new Error(errorString)
    error2.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const suiteStartedEvent = { id: 23, description: 'some test suite' }
    const specStartedEvent = { id: 24, description: 'some test spec' }
    const suiteDoneEvent = { id: 23, description: 'some test suite', failedExpectations: [error], status: 'failed' }
    const suiteDoneEvent2 = { id: 23, description: 'some test suite', failedExpectations: [error2], status: 'failed' }
    const dirtyRunnerReporter = { emit: jest.fn() }
    const dirtyJasmineReporter = new JasmineReporter(dirtyRunnerReporter, Object.assign({ cleanStack: false }, PARAMS))
    jasmineReporter.suiteStarted(suiteStartedEvent)
    jasmineReporter.specStarted(specStartedEvent)
    jasmineReporter.suiteDone(suiteDoneEvent)
    dirtyJasmineReporter.suiteStarted(suiteStartedEvent)
    dirtyJasmineReporter.specStarted(specStartedEvent)
    dirtyJasmineReporter.suiteDone(suiteDoneEvent2)

    const beforeAllDirtyStack = dirtyRunnerReporter.emit.mock.calls[2][1].error.stack
    const beforeAllCleanStack = runnerReporter.emit.mock.calls[2][1].error.stack
    expect(
        beforeAllDirtyStack.split('\n').length
    ).toBeGreaterThan(
        beforeAllCleanStack.split('\n').length
    )

    // beforeAll should not be removed
    expect(beforeAllDirtyStack.includes('UserContext.beforeAll')).toBeTruthy()
    expect(beforeAllCleanStack.includes('UserContext.beforeAll')).toBeTruthy()
})

test('cleanStack should return if no stack is given', () => {
    const error = { message: 'foobar' }
    expect(jasmineReporter.cleanStack(error)).toEqual(error)
})

afterEach(() => {
    runnerReporter.emit.mockClear()
})
