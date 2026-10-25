import { afterEach, describe, expect, it, vi } from 'vitest'

import SpecReporter from '../src/index.js'

// the real base reporter: its tree, units and hook owners, from the events that the frameworks send
const newReporter = (options: Record<string, unknown> = {}) => new SpecReporter({
    color: false, showPreface: false, writeStream: { write: vi.fn() }, ...options
} as ConstructorParameters<typeof SpecReporter>[0])
// one item for each printed line (a console log item has its own line breaks)
const display = (reporter: SpecReporter) => reporter.getResultDisplay('').join('\n').split('\n')

const suite = (uid: string, type: string, parentUid?: string | null) => ({
    uid, title: uid, type, cid: '0-0', file: '/spec.js', ...(parentUid !== undefined && { parentUid })
})
const test = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, title: uid, type: 'test', cid: '0-0', fullTitle: uid, ...extra })
const runTest = (reporter: SpecReporter, uid: string, result = 'test:pass', extra: Record<string, unknown> = {}) => {
    reporter.emit('test:start', test(uid, extra))
    reporter.emit(result, test(uid, extra))
    reporter.emit('test:end', test(uid, extra))
}
const hook = (uid: string, title: string, extra: Record<string, unknown> = {}) => ({ uid, title, type: 'hook', cid: '0-0', ...extra })

describe('spec reporter tree (R1, suite order)', () => {
    it('indents nested suites by their place in the tree when all suites start first (Mocha parallel)', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('outer', 'suite', null))
        reporter.emit('suite:start', suite('inner1', 'suite', 'outer'))
        reporter.emit('suite:start', suite('inner2', 'suite', 'outer'))
        reporter.emit('suite:start', suite('deep', 'suite', 'inner2'))
        reporter.emit('suite:start', suite('second', 'suite', null))
        runTest(reporter, 'i2', 'test:pass', { parentUid: 'inner2', contextId: 'c2' })
        runTest(reporter, 'd1', 'test:pass', { parentUid: 'deep', contextId: 'c3' })
        runTest(reporter, 'i1', 'test:pass', { parentUid: 'inner1', contextId: 'c1' })
        runTest(reporter, 's1', 'test:pass', { parentUid: 'second', contextId: 'c4' })
        runTest(reporter, 'o1', 'test:pass', { parentUid: 'outer', contextId: 'c5' })
        for (const uid of ['deep', 'inner2', 'inner1', 'outer', 'second']) {
            reporter.emit('suite:end', suite(uid, 'suite'))
        }

        expect(display(reporter)).toEqual([
            '» spec.js',
            'outer',
            '   ✓ o1',
            '',
            '    inner1',
            '       ✓ i1',
            '',
            '    inner2',
            '       ✓ i2',
            '',
            '        deep',
            '           ✓ d1',
            '',
            'second',
            '   ✓ s1',
            ''
        ])
    })

    it('prints each scenario under its own feature when grouped features start first (Cucumber parallel)', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F1', 'feature', null))
        reporter.emit('suite:start', suite('F2', 'feature', null))
        reporter.emit('suite:start', { ...suite('F1-S1', 'scenario', 'F1'), contextId: 'c1' })
        reporter.emit('suite:start', { ...suite('F2-S1', 'scenario', 'F2'), contextId: 'c2' })
        runTest(reporter, 'step-a', 'test:pass', { parentUid: 'F2-S1', contextId: 'c2' })
        runTest(reporter, 'step-b', 'test:pass', { parentUid: 'F1-S1', contextId: 'c1' })
        reporter.emit('suite:start', { ...suite('F1-S2', 'scenario', 'F1'), contextId: 'c3' })
        runTest(reporter, 'step-c', 'test:pass', { parentUid: 'F1-S2', contextId: 'c3' })
        for (const uid of ['F2-S1', 'F1-S1', 'F1-S2']) {
            reporter.emit('suite:end', suite(uid, 'scenario'))
        }
        reporter.emit('suite:end', suite('F1', 'feature'))
        reporter.emit('suite:end', suite('F2', 'feature'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'F1',
            'F1-S1',
            '   ✓ step-b',
            '',
            'F1-S2',
            '   ✓ step-c',
            '',
            'F2',
            'F2-S1',
            '   ✓ step-a',
            ''
        ])
    })

    it('keeps the sequential output of nested suites', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('A', 'suite'))
        runTest(reporter, 'a1')
        reporter.emit('suite:start', suite('B', 'suite'))
        runTest(reporter, 'b1')
        reporter.emit('suite:end', suite('B', 'suite'))
        runTest(reporter, 'a2')
        reporter.emit('suite:end', suite('A', 'suite'))
        reporter.emit('suite:start', suite('C', 'suite'))
        runTest(reporter, 'c1')
        reporter.emit('suite:end', suite('C', 'suite'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'A',
            '   ✓ a1',
            '   ✓ a2',
            '',
            '    B',
            '       ✓ b1',
            '',
            'C',
            '   ✓ c1',
            ''
        ])
    })
})

describe('spec reporter pending reasons (R3)', () => {
    it('prints the pending reason under its own test', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('S', 'suite'))
        runTest(reporter, 't1')
        reporter.emit('test:start', test('t2'))
        reporter.emit('test:pending', test('t2', { pendingReason: 'the reason of t2' }))
        reporter.emit('test:end', test('t2'))
        runTest(reporter, 't3')
        reporter.emit('suite:end', suite('S', 'suite'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'S',
            '   ✓ t1',
            '   - t2',
            '',
            '      .........Pending Reasons.........',
            '         the reason of t2',
            '   ✓ t3',
            ''
        ])
    })

    it('prints the reason of a skipped step under the step, not under the next attempt of a retried scenario', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature'))
        reporter.emit('suite:start', suite('S', 'scenario'))
        runTest(reporter, 'step1')
        runTest(reporter, 'step2', 'test:skip', { pendingReason: 'Multiple step definitions match' })
        runTest(reporter, 'step3', 'test:retry')
        reporter.emit('suite:retry', suite('S', 'scenario'))
        runTest(reporter, 'step1')
        runTest(reporter, 'step2', 'test:skip', { pendingReason: 'Multiple step definitions match' })
        runTest(reporter, 'step3')
        reporter.emit('suite:end', suite('S', 'scenario'))
        reporter.emit('suite:end', suite('F', 'feature'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'F',
            'S (1x retries)',
            '   ✓ step1',
            '   - step2',
            '',
            '      .........Pending Reasons.........',
            '         Multiple step definitions match',
            '   ✓ step3',
            ''
        ])
    })
})

describe('spec reporter counts with Cucumber retry (R2)', () => {
    it('counts only the last attempt of a scenario that runs 3 times in a sequential run', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature'))
        reporter.emit('suite:start', suite('S', 'scenario'))
        for (let attempt = 0; attempt < 2; attempt++) {
            runTest(reporter, 's1')
            runTest(reporter, 's2', 'test:retry')
            reporter.emit('suite:retry', suite('S', 'scenario'))
        }
        runTest(reporter, 's1')
        runTest(reporter, 's2')
        reporter.emit('suite:end', suite('S', 'scenario'))
        reporter.emit('suite:end', suite('F', 'feature'))

        expect(reporter.getCountDisplay('')).toEqual(['2 passing ', '2 retried'])
    })

    it('counts only the last attempt of each scenario when retried scenarios overlap (parallel)', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature', null))
        reporter.emit('suite:start', { ...suite('A', 'scenario', 'F'), contextId: 'ca' })
        reporter.emit('suite:start', { ...suite('B', 'scenario', 'F'), contextId: 'cb' })
        const a = { parentUid: 'A', contextId: 'ca' }, b = { parentUid: 'B', contextId: 'cb' }
        runTest(reporter, 'a1', 'test:pass', a)
        runTest(reporter, 'b1', 'test:pass', b)
        runTest(reporter, 'a2', 'test:retry', a)
        reporter.emit('suite:retry', { ...suite('A', 'scenario', 'F'), contextId: 'ca' })
        runTest(reporter, 'b2', 'test:fail', b)
        runTest(reporter, 'a1', 'test:pass', a)
        runTest(reporter, 'a2', 'test:pass', a)
        reporter.emit('suite:end', suite('B', 'scenario'))
        reporter.emit('suite:end', suite('A', 'scenario'))
        reporter.emit('suite:end', suite('F', 'feature'))

        expect(reporter.getCountDisplay('')).toEqual(['3 passing ', '1 failing', '1 retried'])
    })
})

describe('spec reporter hooks of a feature (K26)', () => {
    it('prints a failed BeforeAll / AfterAll whose parent is the feature under the feature', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature', null))
        const beforeAll = hook('ba', 'BeforeAll (steps.ts:3)', { parentUid: 'F' })
        reporter.emit('hook:start', beforeAll)
        reporter.emit('hook:end', { ...beforeAll, state: 'failed', error: { message: 'BeforeAll fails' } })
        reporter.emit('suite:start', { ...suite('S', 'scenario', 'F'), contextId: 'c1' })
        runTest(reporter, 'step1', 'test:pass', { parentUid: 'S', contextId: 'c1' })
        reporter.emit('suite:end', suite('S', 'scenario'))
        const afterAll = hook('aa', 'AfterAll (steps.ts:9)', { parentUid: 'F' })
        reporter.emit('hook:start', afterAll)
        reporter.emit('hook:end', { ...afterAll, state: 'failed', error: { message: 'AfterAll fails' } })
        reporter.emit('suite:end', suite('F', 'feature'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'F',
            '   ✖ BeforeAll (steps.ts:3)',
            '   ✖ AfterAll (steps.ts:9)',
            '',
            'S',
            '   ✓ step1',
            ''
        ])
        expect(reporter.getCountDisplay('')).toEqual(['1 passing ', '2 failing'])
        expect(reporter.getFailureDisplay().filter((line) => /^\d\)/.test(line))).toEqual([
            '1) F BeforeAll (steps.ts:3)',
            '2) F AfterAll (steps.ts:9)'
        ])
    })
})

describe('spec reporter console logs of a beforeAll / afterAll (K28)', () => {
    const originalStdoutWrite = process.stdout.write
    afterEach(() => {
        process.stdout.write = originalStdoutWrite
    })
    const allHook = (uid: string, kind: 'beforeAll' | 'afterAll', title: string, suiteUid?: string) =>
        hook(uid, title, { hookKind: kind, ...(suiteUid && { hookSuiteUid: suiteUid }) })
    const runHook = (reporter: SpecReporter, payload: Record<string, unknown>, log: string, end: Record<string, unknown> = {}) => {
        reporter.emit('hook:start', payload)
        process.stdout.write(log)
        reporter.emit('hook:end', { ...payload, ...end })
    }

    it('prints the logs of a contextless all-hook under its hook line, in the order of the run', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        reporter.emit('suite:start', suite('A', 'suite'))
        runHook(reporter, allHook('h1', 'beforeAll', '"before all" hook for A', 'A'), 'LOG A-before\n')
        reporter.emit('test:start', test('a1'))
        process.stdout.write('LOG a1\n')
        reporter.emit('test:pass', test('a1'))
        reporter.emit('test:end', test('a1'))
        runHook(reporter, allHook('h2', 'afterAll', '"after all" hook for A', 'A'), 'LOG A-after\n')
        reporter.emit('suite:end', suite('A', 'suite'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'A',
            '   ✓ "before all" hook for A',
            '',
            '      .........Console Logs.........',
            '         LOG A-before',
            '          ',
            '   ✓ a1',
            '',
            '      .........Console Logs.........',
            '         LOG a1',
            '          ',
            '   ✓ "after all" hook for A',
            '',
            '      .........Console Logs.........',
            '         LOG A-after',
            '          ',
            ''
        ])
    })

    it('prints the logs of a failed all-hook once, under its failed line', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        reporter.emit('suite:start', suite('A', 'suite'))
        runHook(reporter, allHook('h1', 'beforeAll', '"before all" hook for A', 'A'), 'LOG A-before\n', { error: { message: 'boom' } })
        reporter.emit('suite:end', suite('A', 'suite'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'A',
            '   ✖ "before all" hook for A',
            '',
            '      .........Console Logs.........',
            '         LOG A-before',
            '          ',
            ''
        ])
    })

    it('prints the logs of root all-hooks under (root), with and without the Mocha {root} title', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        runHook(reporter, allHook('r1', 'beforeAll', '"before all" hook in "{root}"'), 'LOG root-before\n')
        runHook(reporter, allHook('r2', 'beforeAll', '"before all" hook'), 'LOG jasmine-root-before\n')
        reporter.emit('suite:start', suite('A', 'suite'))
        runTest(reporter, 'a1')
        reporter.emit('suite:end', suite('A', 'suite'))
        runHook(reporter, allHook('r3', 'afterAll', '"after all" hook in "{root}"'), 'LOG root-after\n')

        expect(display(reporter)).toEqual([
            '(root)',
            '   ✓ "before all" hook in "{root}"',
            '',
            '      .........Console Logs.........',
            '         LOG root-before',
            '          ',
            '   ✓ "before all" hook',
            '',
            '      .........Console Logs.........',
            '         LOG jasmine-root-before',
            '          ',
            '',
            '» spec.js',
            'A',
            '   ✓ a1',
            '',
            '(root)',
            '   ✓ "after all" hook in "{root}"',
            '',
            '      .........Console Logs.........',
            '         LOG root-after',
            '          ',
            ''
        ])
    })

    it('keeps the logs of a parallel context in its test during a contextless all-hook', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        let contextId: string | undefined
        reporter.setContextIdResolver(() => contextId)
        reporter.emit('suite:start', suite('A', 'suite', null))
        reporter.emit('test:start', test('a1', { parentUid: 'A', contextId: 'c1' }))
        const beforeAll = allHook('h1', 'beforeAll', '"before all" hook for A', 'A')
        reporter.emit('hook:start', { ...beforeAll, parentUid: 'A' })
        contextId = 'c1'
        process.stdout.write('LOG a1\n')
        contextId = undefined
        process.stdout.write('LOG A-before\n')
        reporter.emit('hook:end', { ...beforeAll, parentUid: 'A' })
        reporter.emit('test:pass', test('a1', { parentUid: 'A', contextId: 'c1' }))
        reporter.emit('test:end', test('a1', { parentUid: 'A', contextId: 'c1' }))
        reporter.emit('suite:end', suite('A', 'suite'))

        const text = display(reporter).join('\n')
        expect(text).toMatch(/✓ a1\n\n.*Console Logs.*\n\s+LOG a1\n/)
        expect(text).toMatch(/✓ "before all" hook for A\n\n.*Console Logs.*\n\s+LOG A-before\n/)
    })

    it('gives no logs of a parallel context with no test yet to a contextless all-hook', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        let contextId: string | undefined
        reporter.setContextIdResolver(() => contextId)
        reporter.emit('suite:start', suite('A', 'suite', null))
        runTest(reporter, 'a0', 'test:pass', { parentUid: 'A', contextId: 'c0' })
        const beforeAll = { ...allHook('h1', 'beforeAll', '"before all" hook for A', 'A'), parentUid: 'A' }
        reporter.emit('hook:start', beforeAll)
        contextId = 'c9'
        process.stdout.write('LOG c9 before its test\n')
        contextId = undefined
        reporter.emit('hook:end', beforeAll)
        reporter.emit('suite:end', suite('A', 'suite'))

        expect(display(reporter).join('\n')).not.toContain('LOG c9')
    })

    it('follows the base when a hook:end is missing: the next test gets its logs', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        reporter.emit('suite:start', suite('A', 'suite'))
        reporter.emit('hook:start', allHook('h1', 'beforeAll', '"before all" hook for A', 'A'))
        process.stdout.write('LOG A-before\n')
        reporter.emit('test:start', test('a1'))
        process.stdout.write('LOG a1\n')
        reporter.emit('test:pass', test('a1'))
        reporter.emit('test:end', test('a1'))
        reporter.emit('suite:end', suite('A', 'suite'))

        expect(display(reporter)).toEqual([
            '» spec.js',
            'A',
            '   ✓ "before all" hook for A',
            '',
            '      .........Console Logs.........',
            '         LOG A-before',
            '          ',
            '   ✓ a1',
            '',
            '      .........Console Logs.........',
            '         LOG a1',
            '          ',
            ''
        ])
    })

    it('does not print an all-hook with no logs, or the logs of a hook with no hookKind', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        reporter.emit('suite:start', suite('A', 'suite'))
        runHook(reporter, allHook('h1', 'beforeAll', '"before all" hook for A', 'A'), '')
        runHook(reporter, hook('h2', '"before all" hook for A'), 'LOG third-party\n')
        runTest(reporter, 'a1')
        reporter.emit('suite:end', suite('A', 'suite'))

        expect(display(reporter)).toEqual(['» spec.js', 'A', '   ✓ a1', ''])
    })
})

// U4: a sequential Cucumber Before owns its logs; a hook with no name gets the name that JUnit gives it
describe('spec reporter Cucumber hooks with no name', () => {
    const originalWrite = process.stdout.write
    afterEach(() => {
        process.stdout.write = originalWrite
    })

    it('prints "Before hook" and its logs for an unnamed Before, "After hook" for an unnamed failed After', () => {
        const reporter = newReporter({ addConsoleLogs: true })
        reporter['_originalStdoutWrite'] = vi.fn()
        reporter.emit('suite:start', suite('F', 'feature'))
        reporter.emit('suite:start', { ...suite('S', 'scenario'), parent: 'F' })
        reporter.emit('hook:start', hook('b1', '', { parent: 'S', hookKind: 'beforeEach' }))
        process.stdout.write('LOG before\n')
        reporter.emit('hook:end', hook('b1', '', { parent: 'S', hookKind: 'beforeEach' }))
        runTest(reporter, 'step', 'test:pass', { parent: 'S' })
        reporter.emit('hook:start', hook('a1', '', { parent: 'S', hookKind: 'afterEach' }))
        reporter.emit('hook:end', hook('a1', '', { parent: 'S', hookKind: 'afterEach', error: { message: 'after fails' } }))
        reporter.emit('suite:end', suite('S', 'scenario'))
        reporter.emit('suite:end', suite('F', 'feature'))

        const lines = display(reporter)
        expect(lines.filter((line) => /[✓✖]/.test(line))).toEqual(['   ✓ Before hook', '   ✓ step', '   ✖ After hook'])
        expect(lines).toContain('         LOG before')
    })

    it('names an unnamed failed After in the failure list as in its line', () => {
        const reporter = newReporter({})
        reporter.emit('suite:start', suite('F', 'feature'))
        reporter.emit('suite:start', { ...suite('S', 'scenario'), parent: 'F' })
        runTest(reporter, 'step', 'test:pass', { parent: 'S' })
        reporter.emit('hook:start', hook('a1', '', { parent: 'S', hookKind: 'afterEach' }))
        reporter.emit('hook:end', hook('a1', '', { parent: 'S', hookKind: 'afterEach', error: { message: 'after fails' } }))
        reporter.emit('suite:end', suite('S', 'scenario'))
        reporter.emit('suite:end', suite('F', 'feature'))

        expect(reporter.getFailureDisplay()).toContain('1) S After hook')
    })
})
