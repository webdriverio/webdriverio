import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
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
    specs: ['/foo/bar.test.js'],
    jasmineOpts: {}
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

test('getFailedCount counts a failing afterAll of a suite with specs', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)
    jasmineReporter.specDone({ id: '24', description: 'some test spec', failedExpectations: [], status: 'passed', fullName: 'foobar' } as any)
    jasmineReporter.suiteDone({
        id: '23',
        description: 'some test suite',
        failedExpectations: [new Error('afterAll failed') as any],
        fullName: 'foobar'
    } as any)
    expect(jasmineReporter.getFailedCount()).toBe(1)
    // the failure is not reported as an extra test, the hook event covers it
    expect(vi.mocked(runnerReporter.emit).mock.calls.map(([event]) => event)).toEqual([
        'suite:start', 'test:start', 'test:pass', 'test:end', 'suite:end'
    ])
})

test('getFailedCount counts a failure of a suite without specs once', () => {
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.suiteDone({
        id: '23',
        description: 'some test suite',
        failedExpectations: [new Error('afterAll failed') as any],
        fullName: 'foobar'
    } as any)
    expect(jasmineReporter.getFailedCount()).toBe(1)
})

test('getFailedCount counts failures outside of a suite', () => {
    jasmineReporter.jasmineDone({ failedExpectations: [new Error('top level afterAll failed')] } as any)
    expect(jasmineReporter.getFailedCount()).toBe(1)
    jasmineReporter.jasmineDone({ failedExpectations: [] } as any)
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

test('emit: a hook event keeps its hookKind and gets the uid of its suite as hookSuiteUid', () => {
    const hook = { id: '', type: 'hook', description: '"before all" hook', fullName: '"before all" hook', hookKind: 'beforeAll' } as any
    jasmineReporter.emit('hook:start', hook)
    jasmineReporter.suiteStarted({ id: '23', description: 'some test suite', fullName: 'foobar' } as any)
    jasmineReporter.emit('hook:start', hook)
    jasmineReporter.emit('hook:end', { ...hook, description: '"after all" hook', hookKind: 'afterAll' })
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar' } as any)

    const calls = vi.mocked(runnerReporter.emit).mock.calls
    expect(calls.map(([event, p]) => [event, p.hookKind, p.hookSuiteUid])).toEqual([
        ['hook:start', 'beforeAll', undefined],
        ['suite:start', undefined, undefined],
        ['hook:start', 'beforeAll', 'some test suite23'],
        ['hook:end', 'afterAll', 'some test suite23'],
        ['test:start', undefined, undefined]
    ])
    expect(calls[0][1]).not.toHaveProperty('hookSuiteUid')
    expect(calls[1][1]).not.toHaveProperty('hookKind')
    expect(calls[4][1]).not.toHaveProperty('hookKind')
})

// the runner gives the spec files of the worker as URLs
const SPEC = path.resolve('project', 'a.spec.js')
const OTHER_SPEC = path.resolve('project', 'b.spec.js')
const HELPER = path.resolve('project', 'helpers', 'shared.js')
const WRAPPER = path.resolve('project', 'node_modules', '@wdio', 'utils', 'build', 'index.js')
const reporterFor = (...specs: string[]) => new JasmineReporter(runnerReporter, { ...PARAMS, specs: specs.map((spec) => url.pathToFileURL(spec).href) })
const emittedFiles = () => vi.mocked(runnerReporter.emit).mock.calls.map(([event, payload]) => [event, payload.file])

// Jasmine names the file that calls `it()`, which is the WebdriverIO wrapper, not the spec file
test('emit: a test or hook gets the spec file of its suite', () => {
    jasmineReporter = reporterFor(SPEC)
    const hook = { id: '', type: 'hook', description: '"before all" hook', fullName: '"before all" hook', hookKind: 'beforeAll', filename: '' } as any
    jasmineReporter.emit('hook:start', hook)
    jasmineReporter.specStarted({ id: '20', description: 'top-level spec', fullName: 'top-level spec', filename: WRAPPER } as any)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: SPEC } as any)
    jasmineReporter.emit('hook:start', hook)
    jasmineReporter.suiteStarted({ id: '25', description: 'inner', fullName: 'inner', filename: SPEC } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)

    expect(emittedFiles()).toEqual([
        ['hook:start', undefined],
        ['test:start', undefined],
        ['suite:start', SPEC],
        ['hook:start', SPEC],
        ['suite:start', SPEC],
        ['test:start', SPEC]
    ])
})

// Jasmine gives the file of an ESM spec as a URL
test('emit: a test gets the spec file of an ESM suite as a path', () => {
    const file = path.resolve('project', 'a.spec.mjs')
    jasmineReporter = reporterFor(file)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: url.pathToFileURL(file).href } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)
    expect(vi.mocked(runnerReporter.emit).mock.calls[1][1].file).toBe(file)
    expect(jasmineReporter.suiteFile).toBe(file)
})

// a describe() of a shared helper module: Jasmine names the helper
test('emit: a test in a describe() of a helper inside the spec suite gets the spec file', () => {
    jasmineReporter = reporterFor(SPEC, OTHER_SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: OTHER_SPEC } as any)
    jasmineReporter.suiteStarted({ id: '25', description: 'shared', fullName: 'shared', filename: HELPER } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)
    expect(emittedFiles()[2]).toEqual(['test:start', OTHER_SPEC])
})

test('emit: a test in a top-level describe() of a helper gets the spec file of the worker', () => {
    jasmineReporter = reporterFor(SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'shared', fullName: 'shared', filename: HELPER } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)
    expect(emittedFiles()).toEqual([['suite:start', SPEC], ['test:start', SPEC]])
})

// JUnit keeps a suite only when its file is a spec file of the worker
test('emit: the describe() of a helper inside the spec suite gets the spec file, also at its end', () => {
    jasmineReporter = reporterFor(SPEC, OTHER_SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: OTHER_SPEC } as any)
    jasmineReporter.suiteStarted({ id: '25', description: 'shared', fullName: 'shared', filename: HELPER } as any)
    jasmineReporter.suiteDone({ id: '25', description: 'shared', fullName: 'shared', filename: HELPER } as any)
    expect(emittedFiles()).toEqual([['suite:start', OTHER_SPEC], ['suite:start', OTHER_SPEC], ['suite:end', OTHER_SPEC]])
})

// grouped spec files: the spec file of a top-level describe() of a helper is not known
test('emit: with several spec files, a test in a top-level describe() of a helper gets no file', () => {
    jasmineReporter = reporterFor(SPEC, OTHER_SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'shared', fullName: 'shared', filename: HELPER } as any)
    jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)
    expect(emittedFiles()).toEqual([['suite:start', HELPER], ['test:start', undefined]])
})

// Node loads a spec file by its real path, the runner keeps the path of the link
test('emit: a test gets the spec file of a worker in a linked folder', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jasmine-link-'))
    try {
        fs.mkdirSync(path.join(dir, 'real'))
        const specs = ['a.spec.js', 'b.spec.js'].map((name) => path.join(dir, 'real', name))
        specs.forEach((spec) => fs.writeFileSync(spec, ''))
        fs.symlinkSync(path.join(dir, 'real'), path.join(dir, 'link'), 'junction')
        jasmineReporter = reporterFor(...specs.map((spec) => spec.replace(`${path.sep}real${path.sep}`, `${path.sep}link${path.sep}`)))
        const realSpec = fs.realpathSync(specs[1])
        jasmineReporter.suiteStarted({ id: '23', description: 'shared', fullName: 'shared', filename: HELPER } as any)
        jasmineReporter.suiteStarted({ id: '25', description: 'outer', fullName: 'outer', filename: realSpec } as any)
        jasmineReporter.specStarted({ id: '24', description: 'some test spec', fullName: 'foobar', filename: WRAPPER } as any)
        expect(emittedFiles()[2]).toEqual(['test:start', realSpec])
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

test('emit: a suite with an empty file name gives its tests the spec file of the worker', () => {
    jasmineReporter = reporterFor(SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: '' } as any)
    expect(jasmineReporter.suiteFile).toBe(SPEC)
})

// grouped spec files: no suite names one of them, so the spec file is not known
test('emit: with several spec files, a suite with an empty file name gives its tests no file', () => {
    jasmineReporter = reporterFor(SPEC, OTHER_SPEC)
    jasmineReporter.suiteStarted({ id: '23', description: 'outer', fullName: 'outer', filename: '' } as any)
    expect(jasmineReporter.suiteFile).toBeUndefined()
})
