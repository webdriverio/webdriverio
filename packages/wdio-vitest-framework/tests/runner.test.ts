import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { VitestRunnerConfig, Suite, Test, File } from '@vitest/runner'

import { WDIOVitestRunner } from '../src/runner.js'

const createRunnerConfig = (overrides: Partial<VitestRunnerConfig> = {}): VitestRunnerConfig => ({
    root: '/test',
    setupFiles: [],
    passWithNoTests: false,
    allowOnly: true,
    sequence: {
        shuffle: false,
        concurrent: false,
        seed: 12345,
        hooks: 'parallel',
        setupFiles: 'list',
    },
    maxConcurrency: 5,
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 0,
    includeTaskLocation: false,
    ...overrides,
})

const wdioReporter = {
    emit: vi.fn(),
    on: vi.fn(),
    write: vi.fn(),
}

const createFile = (filepath: string): File => ({
    type: 'suite' as const,
    id: 'file-1',
    name: filepath,
    fullName: filepath,
    mode: 'run' as const,
    meta: {},
    tasks: [],
    filepath,
    projectName: undefined,
    file: undefined as any,
})

const createSuite = (name: string, file: File, parent?: Suite): Suite => {
    const s: Suite = {
        type: 'suite' as const,
        id: `suite-${name}`,
        name,
        fullName: parent ? `${parent.fullName} > ${name}` : `${file.filepath} > ${name}`,
        mode: 'run' as const,
        meta: {},
        tasks: [],
        file,
        suite: parent || file,
    }
    return s
}

const createTest = (name: string, suite: Suite, file: File): Test => ({
    type: 'test' as const,
    id: `test-${name}`,
    name,
    fullName: `${suite.fullName} > ${name}`,
    fullTestName: `${suite.name} > ${name}`,
    mode: 'run' as const,
    meta: {},
    file,
    suite,
    context: {} as any,
    timeout: 10000,
    annotations: [],
    artifacts: [],
})

beforeEach(() => {
    wdioReporter.emit.mockReset()
    wdioReporter.on.mockReset()
    wdioReporter.write.mockReset()
})

describe('WDIOVitestRunner', () => {
    test('should initialize with config', () => {
        const config = createRunnerConfig()
        const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
        expect(runner.config).toEqual(config)
        expect(runner.failedCount).toBe(0)
    })

    test('should import files via dynamic import', async () => {
        const config = createRunnerConfig()
        const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
        // importFile should not throw with a non-existing file in tests
        // We just verify it attempts to call import
        await expect(runner.importFile('/non-existent.js', 'collect')).rejects.toThrow()
    })

    describe('suite events', () => {
        test('should emit suite:start on onBeforeRunSuite', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('my suite', file)

            runner.onBeforeRunSuite(s)

            expect(wdioReporter.emit).toBeCalledTimes(1)
            expect(wdioReporter.emit.mock.calls[0][0]).toBe('suite:start')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'suite:start',
                title: 'my suite',
                cid: '0-1',
                specs: ['/spec.js'],
            })
        })

        test('should emit suite:end on onAfterRunSuite', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('my suite', file)

            runner.onBeforeRunSuite(s)
            wdioReporter.emit.mockReset()

            s.result = { state: 'pass', duration: 100 }
            runner.onAfterRunSuite(s)

            expect(wdioReporter.emit).toBeCalledTimes(1)
            expect(wdioReporter.emit.mock.calls[0][0]).toBe('suite:end')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'suite:end',
                title: 'my suite',
                duration: 100,
            })
        })

        test('should not emit events for file-level suites', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')

            runner.onBeforeRunSuite(file)
            runner.onAfterRunSuite(file)

            expect(wdioReporter.emit).not.toBeCalled()
        })

        test('should handle nested suites with correct UIDs', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const outer = createSuite('outer', file)
            const inner = createSuite('inner', file, outer)

            runner.onBeforeRunSuite(outer)
            expect(wdioReporter.emit.mock.calls[0][1].uid).toBe('suite-0-0')

            runner.onBeforeRunSuite(inner)
            expect(wdioReporter.emit.mock.calls[1][1].uid).toBe('suite-1-0')

            runner.onAfterRunSuite(inner)
            expect(wdioReporter.emit.mock.calls[2][1].uid).toBe('suite-1-0')

            runner.onAfterRunSuite(outer)
            expect(wdioReporter.emit.mock.calls[3][1].uid).toBe('suite-0-0')
        })
    })

    describe('test events', () => {
        test('should emit test:start on onBeforeRunTask', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('my test', s, file)

            runner.onBeforeRunSuite(s)
            wdioReporter.emit.mockReset()

            runner.onBeforeRunTask(t)

            expect(wdioReporter.emit).toBeCalledTimes(1)
            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:start')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'test:start',
                title: 'my test',
                cid: '0-1',
            })
        })

        test('should emit test:pass on onAfterRunTask when test passes', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('passing test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = { state: 'pass', duration: 50 }
            runner.onAfterRunTask(t)

            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:pass')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'test:pass',
                title: 'passing test',
                passed: true,
                duration: 50,
            })
            expect(runner.failedCount).toBe(0)
        })

        test('should emit test:fail on onAfterRunTask when test fails', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('failing test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = {
                state: 'fail',
                duration: 30,
                errors: [{
                    name: 'AssertionError',
                    message: 'expected true to be false',
                    stack: 'Error: expected true to be false\n    at test.js:5:10',
                    stacks: [],
                    diff: undefined,
                    actual: 'true',
                    expected: 'false',
                }],
            }
            runner.onAfterRunTask(t)

            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:fail')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'test:fail',
                title: 'failing test',
                passed: false,
            })
            expect(wdioReporter.emit.mock.calls[0][1].error).toMatchObject({
                name: 'AssertionError',
                message: 'expected true to be false',
            })
            expect(runner.failedCount).toBe(1)
        })

        test('should emit test:pending for skipped tests', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('skipped test', s, file)
            t.mode = 'skip'

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            runner.onAfterRunTask(t)

            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:pending')
            expect(wdioReporter.emit.mock.calls[0][1]).toMatchObject({
                type: 'test:pending',
                title: 'skipped test',
                pending: true,
            })
        })

        test('should emit test:pending for todo tests', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('todo test', s, file)
            t.mode = 'todo'

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            runner.onAfterRunTask(t)

            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:pending')
            expect(wdioReporter.emit.mock.calls[0][1].pending).toBe(true)
        })

        test('should emit test:end after test:pass', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = { state: 'pass', duration: 10 }
            runner.onAfterRunTask(t)

            const eventTypes = wdioReporter.emit.mock.calls.map((c: any[]) => c[0])
            expect(eventTypes).toContain('test:pass')
            expect(eventTypes).toContain('test:end')
        })

        test('should emit test:end after test:fail', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = {
                state: 'fail',
                duration: 10,
                errors: [{ name: 'Error', message: 'fail', stack: '', stacks: [], diff: undefined }],
            }
            runner.onAfterRunTask(t)

            const eventTypes = wdioReporter.emit.mock.calls.map((c: any[]) => c[0])
            expect(eventTypes).toContain('test:fail')
            expect(eventTypes).toContain('test:end')
        })

        test('should increment failed count for each failed test', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t1 = createTest('fail 1', s, file)
            const t2 = createTest('fail 2', s, file)

            runner.onBeforeRunSuite(s)

            runner.onBeforeRunTask(t1)
            t1.result = { state: 'fail', errors: [{ name: 'Error', message: 'e', stack: '', stacks: [], diff: undefined }] }
            runner.onAfterRunTask(t1)

            runner.onBeforeRunTask(t2)
            t2.result = { state: 'fail', errors: [{ name: 'Error', message: 'e', stack: '', stacks: [], diff: undefined }] }
            runner.onAfterRunTask(t2)

            expect(runner.failedCount).toBe(2)
        })
    })

    describe('full title computation', () => {
        test('should compute full title for simple suite', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('my suite', file)

            runner.onBeforeRunSuite(s)

            expect(wdioReporter.emit.mock.calls[0][1].fullTitle).toBe('my suite')
        })

        test('should compute full title for nested suites', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const outer = createSuite('outer', file)
            const inner = createSuite('inner', file, outer)

            runner.onBeforeRunSuite(outer)
            runner.onBeforeRunSuite(inner)

            expect(wdioReporter.emit.mock.calls[1][1].fullTitle).toBe('outer.inner')
        })

        test('should compute full title for test with parent suite', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('my test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)

            const testStartEvent = wdioReporter.emit.mock.calls.find(
                (c: any) => c[0] === 'test:start'
            )
            expect(testStartEvent![1].fullTitle).toBe('suite.my test')
        })
    })

    describe('error formatting', () => {
        test('should format error with all properties', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = {
                state: 'fail',
                duration: 10,
                errors: [{
                    name: 'AssertionError',
                    message: 'Expected 1 to equal 2',
                    stack: 'AssertionError: Expected 1 to equal 2\n    at Context.<anonymous>',
                    stacks: [],
                    diff: undefined,
                    expected: 2,
                    actual: 1,
                }],
            }
            runner.onAfterRunTask(t)

            const error = wdioReporter.emit.mock.calls[0][1].error
            expect(error.name).toBe('AssertionError')
            expect(error.message).toBe('Expected 1 to equal 2')
            expect(error.stack).toContain('Context.<anonymous>')
            expect(error.expected).toBe(2)
            expect(error.actual).toBe(1)
        })

        test('should handle errors without optional properties', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t = createTest('test', s, file)

            runner.onBeforeRunSuite(s)
            runner.onBeforeRunTask(t)
            wdioReporter.emit.mockReset()

            t.result = {
                state: 'fail',
                errors: [{ message: 'simple error', stacks: [], diff: undefined }],
            }
            runner.onAfterRunTask(t)

            const error = wdioReporter.emit.mock.calls[0][1].error
            expect(error.name).toBe('Error')
            expect(error.message).toBe('simple error')
        })
    })

    describe('UID generation', () => {
        test('should generate unique UIDs for suites', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s1 = createSuite('suite 1', file)
            const s2 = createSuite('suite 2', file)

            runner.onBeforeRunSuite(s1)
            runner.onAfterRunSuite(s1)
            runner.onBeforeRunSuite(s2)
            runner.onAfterRunSuite(s2)

            const uids = wdioReporter.emit.mock.calls.map((c: any) => c[1].uid)
            expect(uids[0]).toBe('suite-0-0')
            expect(uids[1]).toBe('suite-0-0')
            expect(uids[2]).toBe('suite-0-1')
            expect(uids[3]).toBe('suite-0-1')
        })

        test('should generate unique UIDs for tests within suites', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('suite', file)
            const t1 = createTest('test 1', s, file)
            const t2 = createTest('test 2', s, file)

            runner.onBeforeRunSuite(s)

            runner.onBeforeRunTask(t1)
            t1.result = { state: 'pass' }
            runner.onAfterRunTask(t1)

            runner.onBeforeRunTask(t2)
            t2.result = { state: 'pass' }
            runner.onAfterRunTask(t2)

            const testEvents = wdioReporter.emit.mock.calls.filter(
                (c: any) => c[0] === 'test:start'
            )
            expect(testEvents[0][1].uid).toMatch(/^test-/)
            expect(testEvents[1][1].uid).toMatch(/^test-/)
            expect(testEvents[0][1].uid).not.toBe(testEvents[1][1].uid)
        })
    })

    describe('complete test flow', () => {
        test('should handle a complete test run with mixed results', () => {
            const config = createRunnerConfig()
            const runner = new WDIOVitestRunner(config, '0-1', ['/spec.js'], wdioReporter as any)
            const file = createFile('/spec.js')
            const s = createSuite('My Suite', file)

            const t1 = createTest('passes', s, file)
            const t2 = createTest('fails', s, file)
            const t3 = createTest('skipped', s, file)
            t3.mode = 'skip'

            runner.onBeforeRunSuite(s)

            runner.onBeforeRunTask(t1)
            t1.result = { state: 'pass', duration: 10 }
            runner.onAfterRunTask(t1)

            runner.onBeforeRunTask(t2)
            t2.result = {
                state: 'fail',
                duration: 5,
                errors: [{ name: 'Error', message: 'boom', stack: '', stacks: [], diff: undefined }],
            }
            runner.onAfterRunTask(t2)

            runner.onBeforeRunTask(t3)
            runner.onAfterRunTask(t3)

            runner.onAfterRunSuite(s)

            expect(runner.failedCount).toBe(1)

            const events = wdioReporter.emit.mock.calls.map((c: any) => c[0])
            expect(events).toContain('suite:start')
            expect(events).toContain('test:start')
            expect(events).toContain('test:pass')
            expect(events).toContain('test:fail')
            expect(events).toContain('test:pending')
            expect(events).toContain('test:end')
            expect(events).toContain('suite:end')
        })
    })
})
