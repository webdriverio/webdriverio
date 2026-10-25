import { describe, expect, test, vi } from 'vitest'

import MobileSelectorPerformanceReporter from '../../src/mobileSelectorPerformanceOptimizer/mspo-reporter.js'
import { getCurrentSuiteName, getCurrentTestFile, getCurrentTestName } from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'

// the real base reporter and store: the names that a selector command of the calling code gets
let current: string | undefined
const newReporter = () => {
    const reporter = new MobileSelectorPerformanceReporter({ writeStream: { write: vi.fn() } })
    reporter.setContextIdResolver(() => current)
    return reporter
}
const names = (contextId?: string) => {
    current = contextId
    return { testFile: getCurrentTestFile(), suiteName: getCurrentSuiteName(), testName: getCurrentTestName() }
}
const suite = (uid: string, parentUid: string | null, file = `/specs/${uid}.spec.ts`) => ({ uid, title: uid, type: 'suite', cid: '0-0', file, parentUid })
const testOf = (uid: string, parentUid: string, extra: Record<string, unknown> = {}) => ({ uid, title: uid, fullTitle: uid, type: 'test', cid: '0-0', parentUid, ...extra })

describe('MobileSelectorPerformanceReporter owner of a command (K19)', () => {
    test('gives a command of a parallel test the names of its own test and suite', () => {
        const reporter = newReporter()
        current = undefined
        // Mocha parallel mode starts all suites before the first test
        reporter.emit('suite:start', suite('outer', null, '/specs/a.spec.ts'))
        reporter.emit('suite:start', suite('inner', 'outer', '/specs/a.spec.ts'))
        reporter.emit('suite:start', suite('other', null, '/specs/b.spec.ts'))
        reporter.emit('test:start', testOf('test a', 'inner', { contextId: 'ctx-a' }))
        reporter.emit('test:start', testOf('test b', 'other', { contextId: 'ctx-b' }))

        expect(names('ctx-a')).toEqual({ testFile: 'specs/a.spec.ts', suiteName: 'inner', testName: 'test a' })
        expect(names('ctx-b')).toEqual({ testFile: 'specs/b.spec.ts', suiteName: 'other', testName: 'test b' })
    })

    test('keeps the names of the last started test and suite in a sequential run (no change)', () => {
        const reporter = newReporter()
        current = undefined
        reporter.emit('suite:start', suite('first', null))
        reporter.emit('test:start', testOf('test 1', 'first'))
        reporter.emit('test:pass', testOf('test 1', 'first'))
        reporter.emit('test:end', testOf('test 1', 'first'))
        reporter.emit('suite:end', suite('first', null))
        reporter.emit('suite:start', suite('second', null))

        expect(names()).toEqual({ testFile: 'specs/second.spec.ts', suiteName: 'second', testName: 'test 1' })
        reporter.emit('test:start', testOf('test 2', 'second'))
        expect(names()).toEqual({ testFile: 'specs/second.spec.ts', suiteName: 'second', testName: 'test 2' })
    })
})
