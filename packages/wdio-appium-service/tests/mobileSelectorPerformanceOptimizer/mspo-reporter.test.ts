import path from 'node:path'
import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import type { SuiteStats, TestStats } from '@wdio/reporter'

import MobileSelectorPerformanceReporter from '../../src/mobileSelectorPerformanceOptimizer/mspo-reporter.js'
import * as store from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/mspo-store.js', () => ({
    setCurrentSuiteName: vi.fn(),
    setCurrentTestFile: vi.fn(),
    setCurrentTestName: vi.fn()
}))

describe('MobileSelectorPerformanceReporter', () => {
    const createReporter = (options: { reportDirectory?: string } = {}) => {
        return new MobileSelectorPerformanceReporter(options)
    }

    const createMockSuite = (overrides?: Partial<SuiteStats>): SuiteStats => {
        return {
            title: overrides?.title || 'Test Suite',
            file: overrides?.file || '/test/path/test.spec.ts',
            ...overrides
        } as SuiteStats
    }

    const createMockTest = (overrides?: Partial<TestStats>): TestStats => {
        return {
            title: overrides?.title || 'Test Name',
            ...overrides
        } as TestStats
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        test('should initialize with reportDirectory option', () => {
            const reporter = createReporter({ reportDirectory: '/test/report/dir' })

            expect(reporter['_reportDirectory']).toBe('/test/report/dir')
        })

        test('should initialize without reportDirectory option', () => {
            const reporter = createReporter()

            expect(reporter['_reportDirectory']).toBeUndefined()
        })
    })

    describe('onSuiteStart', () => {
        test('should set test file and suite name when suite has file and valid title', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: 'My Test Suite',
                file: `${process.cwd()}/test/spec.spec.ts`
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
        })

        test('should not set suite name for root suite with (root) title', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: '(root)',
                file: `${process.cwd()}/test/spec.spec.ts`
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should not set suite name for root suite with {root} title', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: '{root}',
                file: `${process.cwd()}/test/spec.spec.ts`
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should not set test file when suite has no file', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: 'My Test Suite',
                file: undefined
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
        })

        test('should handle test file path without leading slash', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: 'My Test Suite',
                file: 'test/spec.spec.ts'
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
        })

        test('should handle test file path with leading slash after process.cwd() replacement', () => {
            const reporter = createReporter()
            const suite = createMockSuite({
                title: 'My Test Suite',
                file: `${process.cwd()}/test/spec.spec.ts`
            })

            reporter.onSuiteStart(suite)

            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
        })
    })

    describe('onTestStart', () => {
        test('should set test name and update context from current suite', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({
                    title: 'My Test Suite',
                    file: `${process.cwd()}/test/spec.spec.ts`
                })
            ]
            const test = createMockTest({ title: 'My Test Name' })

            reporter.onTestStart(test)

            expect(vi.mocked(store.setCurrentTestName)).toHaveBeenCalledWith('My Test Name')
            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
        })

        test('should not set test name when test has no title', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({ title: 'My Test Suite' })
            ]
            const test = createMockTest({ title: undefined })

            reporter.onTestStart(test)

            expect(vi.mocked(store.setCurrentTestName)).not.toHaveBeenCalled()
        })

        test('should handle empty currentSuites array', () => {
            const reporter = createReporter()
            reporter.currentSuites = []
            const test = createMockTest({ title: 'My Test Name' })

            reporter.onTestStart(test)

            expect(vi.mocked(store.setCurrentTestName)).toHaveBeenCalledWith('My Test Name')
            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })

        test('should skip root suite and use most nested suite', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({ title: 'Outer Suite' }),
                createMockSuite({
                    title: 'Inner Suite',
                    file: `${process.cwd()}/test/spec.spec.ts`
                })
            ]
            const test = createMockTest({ title: 'My Test Name' })

            reporter.onTestStart(test)

            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('Inner Suite')
        })
    })

    describe('onTestPass', () => {
        test('should do nothing', () => {
            const reporter = createReporter()
            const test = createMockTest()

            reporter.onTestPass(test)

            expect(vi.mocked(store.setCurrentTestName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })
    })

    describe('onTestFail', () => {
        test('should do nothing', () => {
            const reporter = createReporter()
            const test = createMockTest()

            reporter.onTestFail(test)

            expect(vi.mocked(store.setCurrentTestName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })
    })

    describe('onTestSkip', () => {
        test('should set test name', () => {
            const reporter = createReporter()
            const test = createMockTest({ title: 'Skipped Test' })

            reporter.onTestSkip(test)

            expect(vi.mocked(store.setCurrentTestName)).toHaveBeenCalledWith('Skipped Test')
        })

        test('should not set test name when test has no title', () => {
            const reporter = createReporter()
            const test = createMockTest({ title: undefined })

            reporter.onTestSkip(test)

            expect(vi.mocked(store.setCurrentTestName)).not.toHaveBeenCalled()
        })
    })

    describe('onTestPending', () => {
        test('should set test name', () => {
            const reporter = createReporter()
            const test = createMockTest({ title: 'Pending Test' })

            reporter.onTestPending(test)

            expect(vi.mocked(store.setCurrentTestName)).toHaveBeenCalledWith('Pending Test')
        })

        test('should not set test name when test has no title', () => {
            const reporter = createReporter()
            const test = createMockTest({ title: undefined })

            reporter.onTestPending(test)

            expect(vi.mocked(store.setCurrentTestName)).not.toHaveBeenCalled()
        })
    })

    describe('onHookStart', () => {
        test('should update context from current suite', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({
                    title: 'My Test Suite',
                    file: `${process.cwd()}/test/spec.spec.ts`
                })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
        })

        test('should handle empty currentSuites array', () => {
            const reporter = createReporter()
            reporter.currentSuites = []

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })

        test('should skip root suite', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })
    })

    describe('onHookEnd', () => {
        test('should update context from current suite', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({
                    title: 'My Test Suite',
                    file: `${process.cwd()}/test/spec.spec.ts`
                })
            ]

            reporter.onHookEnd()

            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
            expect(vi.mocked(store.setCurrentTestFile)).toHaveBeenCalledWith('test/spec.spec.ts')
        })

        test('should handle empty currentSuites array', () => {
            const reporter = createReporter()
            reporter.currentSuites = []

            reporter.onHookEnd()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
            expect(vi.mocked(store.setCurrentTestFile)).not.toHaveBeenCalled()
        })
    })

    describe('getCurrentSuite (private method via updateContextFromCurrentSuite)', () => {
        test('should return most nested suite when multiple suites exist', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({ title: 'Outer Suite' }),
                createMockSuite({ title: 'Inner Suite' })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('Inner Suite')
        })

        test('should skip root suite with {root} title', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '{root}' }),
                createMockSuite({ title: 'My Test Suite' })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).toHaveBeenCalledWith('My Test Suite')
        })

        test('should return undefined when only root suite exists', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should return undefined when currentSuites is null', () => {
            const reporter = createReporter()
            reporter.currentSuites = null as any

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should handle suite with empty title', () => {
            const reporter = createReporter()
            reporter.currentSuites = [
                createMockSuite({ title: '(root)' }),
                createMockSuite({ title: '' })
            ]

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should return undefined when extractSuiteName is called with (root) title', () => {
            const reporter = createReporter()
            const rootSuite = createMockSuite({ title: '(root)', file: `${process.cwd()}/test.spec.ts` })
            vi.spyOn(reporter as any, 'getCurrentSuite').mockReturnValue(rootSuite)

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })

        test('should return undefined when extractSuiteName is called with {root} title', () => {
            const reporter = createReporter()
            const rootSuite = createMockSuite({ title: '{root}', file: `${process.cwd()}/test.spec.ts` })
            vi.spyOn(reporter as any, 'getCurrentSuite').mockReturnValue(rootSuite)

            reporter.onHookStart()

            expect(vi.mocked(store.setCurrentSuiteName)).not.toHaveBeenCalled()
        })
    })
})

