import { expect, test, vi, beforeEach } from 'vitest'
import type { EventEmitter } from 'node:events'
import JasmineReporter from '../src/reporter.js'

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

test('should preserve nested suite hierarchy without corruption', () => {
    // Simulate: describe('Parent', () => { describe('Child', () => { describe('Grandchild', ...) }) })
    jasmineReporter.suiteStarted({ id: '1', description: 'Parent', fullName: 'Parent' } as any)
    jasmineReporter.suiteStarted({ id: '2', description: 'Child', fullName: 'Parent Child' } as any)
    jasmineReporter.suiteStarted({ id: '3', description: 'Grandchild', fullName: 'Parent Child Grandchild' } as any)

    const calls = vi.mocked(runnerReporter.emit).mock.calls

    // Verify fullTitle is built correctly without stack corruption
    expect(calls[0][1].fullTitle).toBe('Parent')
    expect(calls[1][1].fullTitle).toBe('Parent.Child')
    expect(calls[2][1].fullTitle).toBe('Parent.Child.Grandchild')
})

test('should handle multiple nested suites at same level', () => {
    // Simulate: describe('A', () => { describe('B', () => { it(...) }); describe('C', () => { it(...) }) })
    jasmineReporter.suiteStarted({ id: '1', description: 'A', fullName: 'A' } as any)
    jasmineReporter.suiteStarted({ id: '2', description: 'B', fullName: 'A B' } as any)
    jasmineReporter.suiteDone({ id: '2', description: 'B', fullName: 'A B' } as any)
    jasmineReporter.suiteStarted({ id: '3', description: 'C', fullName: 'A C' } as any)

    const calls = vi.mocked(runnerReporter.emit).mock.calls

    expect(calls[0][1].fullTitle).toBe('A')
    expect(calls[1][1].fullTitle).toBe('A.B')
    expect(calls[3][1].fullTitle).toBe('A.C') // Should be A.C, not corrupted
})
