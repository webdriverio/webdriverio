import path from 'node:path'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import logger from '@wdio/logger'
import type { EventEmitter } from 'node:events'

import JasmineReporter from '../src/reporter.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const log = logger('')

let jasmineReporter: JasmineReporter
let runnerReporter: EventEmitter

const PARAMS = {
    cid: '0-2',
    capabilities: { browserName: 'foobar' },
    specs: ['/foo/bar.test.js']
}

beforeEach(() => {
    runnerReporter = { emit: vi.fn() } as any
    jasmineReporter = new JasmineReporter(runnerReporter, PARAMS)
})

test('suiteStarted', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)

    expect(vi.mocked(runnerReporter.emit).mock.calls[0][0]).toBe('suite:start')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].uid).toBe('some test suite23')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].title).toBe('some test suite')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].type).toBe('suite')
})

test('specStarted', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)

    expect(vi.mocked(runnerReporter.emit).mock.calls[1][0]).toBe('test:start')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].uid).toBe('some test spec24')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].title).toBe('some test spec')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].type).toBe('test')
    expect(jasmineReporter['_parent'][0].tests).toBe(1)
})

test('specStarted without root describe', () => {
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    expect(jasmineReporter['_parent']).toHaveLength(0)
    expect(log.warn).toBeCalledTimes(1)
})

test('specDone', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    vi.mocked(runnerReporter.emit).mockReset()
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [],
        status: 'passed',
        fullName: 'foobar'
    } as any)

    expect(vi.mocked(runnerReporter.emit).mock.calls[0][0]).toBe('test:pass')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].uid).toBe('some test spec24')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].pending).toBe(false)
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][0]).toBe('test:end')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].uid).toBe('some test spec24')

    vi.mocked(runnerReporter.emit).mockReset()
    jasmineReporter.specDone({
        id: '25',
        description: 'some failing test spec',
        failedExpectations: [new Error('foobar') as any],
        status: 'failed',
        fullName: 'foobar'
    } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][0]).toBe('test:fail')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].uid).toBe('some failing test spec25')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].pending).toBe(false)
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].error.message).toBe('foobar')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][0]).toBe('test:end')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].uid).toBe('some failing test spec25')

    vi.mocked(runnerReporter.emit).mockReset()
    jasmineReporter.specDone({
        id: '26',
        description: 'some pending test spec',
        failedExpectations: [],
        status: 'pending',
        pendingReason: 'for no reason',
        fullName: 'foobar'
    } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][0]).toBe('test:pending')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].uid).toBe('some pending test spec26')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].pending).toBe(true)
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].pendingReason).toBe('for no reason')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][0]).toBe('test:end')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].uid).toBe('some pending test spec26')

    vi.mocked(runnerReporter.emit).mockReset()
    jasmineReporter.specDone({
        id: '27',
        description: 'some excluded test spec',
        failedExpectations: [],
        status: 'excluded',
        fullName: 'foobar'
    } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][0]).toBe('test:pending')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].cid).toBe('0-2')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].uid).toBe('some excluded test spec27')
    expect(vi.mocked(runnerReporter.emit).mock.calls[0][1].pending).toBe(true)
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][0]).toBe('test:end')
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].uid).toBe('some excluded test spec27')
})

test('specDone should pass multiple failed expectations as errors', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [
            { message: 'I failed' },
            { message: 'I failed too!' }
        ] as any,
        status: 'failed',
        fullName: 'foobar'
    } as any)

    expect(vi.mocked(runnerReporter.emit).mock.calls[2][0]).toBe('test:fail')
    // We still assign the first failedExpectation to 'error' for backwards compatibility
    expect(vi.mocked(runnerReporter.emit).mock.calls[2][1].error.message).toBe('I failed')
    expect(vi.mocked(runnerReporter.emit).mock.calls[2][1].errors.length).toBe(2)
    expect(vi.mocked(runnerReporter.emit).mock.calls[2][1].errors[0].message).toBe('I failed')
    expect(vi.mocked(runnerReporter.emit).mock.calls[2][1].errors[1].message).toBe('I failed too!')
})

test('suiteDone', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    jasmineReporter.suiteDone({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[2][0]).toBe('suite:end')

    /**
     * check run time errors in suites
     */
    jasmineReporter.suiteStarted({ id: '25', description: 'some error prone suite', fullName: 'foobar' } as any)
    jasmineReporter.suiteDone({
        id: '25',
        description: 'some error prone suite',
        failedExpectations: [new Error('foobar') as any],
        fullName: 'foobar'
    } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[3][0]).toBe('suite:start')
    expect(vi.mocked(runnerReporter.emit).mock.calls[4][0]).toBe('test:start')
    expect(vi.mocked(runnerReporter.emit).mock.calls[4][1].title).toBe('<unknown test>')
    expect(vi.mocked(runnerReporter.emit).mock.calls[5][0]).toBe('test:fail')
    expect(vi.mocked(runnerReporter.emit).mock.calls[5][1].error.message).toBe('foobar')
    expect(vi.mocked(runnerReporter.emit).mock.calls[6][0]).toBe('test:end')
    expect(vi.mocked(runnerReporter.emit).mock.calls[7][0]).toBe('suite:end')
})

test('getFailedCount', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    jasmineReporter.specDone({
        id: '24',
        description: 'some test spec',
        failedExpectations: [new Error('foobar') as any],
        status: 'failed',
        fullName: 'foobar'
    } as any)
    jasmineReporter.suiteDone({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('do not clean stack option', () => {
    const error = new Error('foobar')
    error.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const error2 = new Error('foobar2')
    error2.stack += '\n\tat foobar (/foo/bar/node_modules/package/test.js)'
    const event = { id: '24', description: 'some test spec', failedExpectations: [error as any], status: 'failed', fullName: 'foobar' }
    const event2 = { id: '24', description: 'some test spec', failedExpectations: [error2 as any], status: 'failed', fullName: 'foobar' }
    const dirtyRunnerReporter: EventEmitter = { emit: vi.fn() } as any
    const dirtyJasmineReporter = new JasmineReporter(dirtyRunnerReporter, Object.assign({ cleanStack: false }, PARAMS))
    jasmineReporter.specDone(event as any)
    dirtyJasmineReporter.specDone(event2 as any)
    expect(
        vi.mocked(dirtyRunnerReporter.emit).mock.calls[0][1].error.stack.split('\n').length
    ).toBeGreaterThan(
        vi.mocked(runnerReporter.emit).mock.calls[0][1].error.stack.split('\n').length
    )
})

test('cleanStack should return if no stack is given', () => {
    const error = { message: 'foobar' }
    expect(jasmineReporter.cleanStack(error as any)).toEqual(error)
})

afterEach(() => {
    vi.mocked(runnerReporter.emit).mockClear()
})
