import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import WDIOJunitReporter, { addProperty } from '../src/index.js'

// the real base reporter: units and hook owners from the events that the frameworks send
const FILE = '/project/spec.js'
const runner = (framework = 'mocha') => ({ specs: [FILE], config: { framework }, sanitizedCapabilities: 'chrome', capabilities: {} })

const suite = (uid: string, type = 'suite', extra: Record<string, unknown> = {}) => ({ uid, title: uid, fullTitle: uid, type, cid: '0-0', file: FILE, ...extra })
const test = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, title: uid, fullTitle: uid, type: 'test', cid: '0-0', ...extra })
const hook = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, title: `"before all" hook ${uid}`, type: 'hook', cid: '0-0', ...extra })
const command = (url: string, contextId?: string) => ({ sessionId: 's', method: 'POST', endpoint: '/session/:sessionId/url', body: { url }, ...(contextId && { contextId }) })

const runTest = (reporter: WDIOJunitReporter, uid: string, extra: Record<string, unknown> = {}, result = 'test:pass') => {
    reporter.emit('test:start', test(uid, extra))
    reporter.emit(result, test(uid, extra))
    reporter.emit('test:end', test(uid, extra))
}
const runHook = (reporter: WDIOJunitReporter, uid: string, extra: Record<string, unknown>, body: () => void, end: Record<string, unknown> = {}) => {
    reporter.emit('hook:start', hook(uid, extra))
    body()
    reporter.emit('hook:end', hook(uid, { ...extra, ...end }))
}

const xmlOf = (reporter: WDIOJunitReporter, framework?: string) => reporter['_buildJunitXml'](runner(framework) as never).toString() as string
const testCaseOf = (xml: string, name: string) => new RegExp(`<testcase [^>]*name="${name}"[^>]*?(?:/>|>[\\s\\S]*?</testcase>)`).exec(xml)?.[0] ?? ''
const testSuiteOf = (xml: string, name: string) => new RegExp(`<testsuite name="${name}"[\\s\\S]*?</testsuite>`).exec(xml)?.[0] ?? ''
// the system-out of the testsuite itself, not of its testcases
const suiteOutOf = (xml: string, name: string) => /<system-out><!\[CDATA\[([\s\S]*?)\]\]><\/system-out>/
    .exec(testSuiteOf(xml, name).replace(/<testcase [^>]*[^/]>[\s\S]*?<\/testcase>/g, '').replace(/<testcase [^>]*\/>/g, ''))?.[1]

describe('JUnit worker logs and commands by their owner', () => {
    const originalWrite = process.stdout.write
    let reporter: WDIOJunitReporter
    let contextId: string | undefined
    const log = (text: string) => process.stdout.write(text)

    beforeEach(() => {
        contextId = undefined
        reporter = new WDIOJunitReporter({ stdout: true, addWorkerLogs: true, writeStream: { write: vi.fn() } } as never)
        reporter['_originalStdoutWrite'] = vi.fn()
        reporter.setContextIdResolver(() => contextId)
    })

    afterEach(() => {
        process.stdout.write = originalWrite
    })

    describe('a contextless all-hook writes to the testsuite of its suite (K28)', () => {
        const runSequential = () => {
            reporter.emit('suite:start', suite('S1'))
            reporter.emit('test:start', test('t1'))
            log('t1-log')
            reporter.emit('client:beforeCommand', command('t1-url'))
            reporter.emit('test:pass', test('t1'))
            reporter.emit('test:end', test('t1'))
            reporter.emit('suite:end', suite('S1'))
            reporter.emit('suite:start', suite('S2'))
            runHook(reporter, 'before-S2', { hookKind: 'beforeAll', hookSuiteUid: 'S2' }, () => {
                log('before-log')
                addProperty('before-prop', 'before-value')
                reporter.emit('client:beforeCommand', command('before-url'))
            })
            runTest(reporter, 't2')
            runHook(reporter, 'after-S2', { hookKind: 'afterAll', hookSuiteUid: 'S2' }, () => {
                log('after-log')
                reporter.emit('client:beforeCommand', command('after-url'))
            })
            reporter.emit('suite:end', suite('S2'))
        }

        it('gives the logs, commands and properties of a before / after all to its testsuite, not to the previous testcase', () => {
            runSequential()
            const xml = xmlOf(reporter)

            expect(suiteOutOf(xml, 'S2')).toBe([
                '',
                'before-log',
                '...command output...',
                '',
                'COMMAND: POST /session/s/url - {"url":"before-url"}',
                'after-log',
                '...command output...',
                '',
                'COMMAND: POST /session/s/url - {"url":"after-url"}',
                ''
            ].join('\n'))
            expect(testSuiteOf(xml, 'S2')).toContain('<property name="before-prop" value="before-value"/>')
            expect(testCaseOf(xml, 't1')).toContain('t1-url')
            for (const name of ['t1', 't2']) {
                expect(testCaseOf(xml, name)).not.toMatch(/before-|after-/)
            }
            expect(suiteOutOf(xml, 'S1')).toBeUndefined()
        })

        // the system-out of a testsuite comes from a patch of junit-report-builder build(parentElement) (M9)
        it('writes the system-out of a testsuite after its properties and testcases, in a testsuite with its counts', () => {
            runSequential()
            const s2 = testSuiteOf(xmlOf(reporter), 'S2').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
            const children: string[] = []
            let depth = 0
            for (const [, close, name, self] of s2.matchAll(/<(\/?)([a-z-]+)[^>]*?(\/?)>/g)) {
                if (close) {
                    depth--
                    continue
                }
                if (depth === 1) {
                    children.push(name)
                }
                if (!self) {
                    depth++
                }
            }
            expect(children).toEqual(['properties', 'testcase', 'system-out'])
            expect(s2).toMatch(/^<testsuite name="S2" [^>]*tests="1" failures="0"/)
        })

        it('gives the output of a failed before all to its hook testcase, not to the testsuite', () => {
            reporter.emit('suite:start', suite('S1'))
            runHook(reporter, 'before-S1', { hookKind: 'beforeAll', hookSuiteUid: 'S1' }, () => {
                log('before-log')
                reporter.emit('client:beforeCommand', command('before-url'))
            }, { error: new Error('before fails'), state: 'failed' })
            reporter.emit('suite:end', suite('S1'))
            const xml = xmlOf(reporter)

            const failedHook = testCaseOf(xml, 'before all hook before S1')
            expect(failedHook).toContain('<failure message="before fails"/>')
            expect(failedHook).toContain('before-log')
            expect(failedHook).toContain('before-url')
            expect(suiteOutOf(xml, 'S1')).toBeUndefined()
        })

        it('gives a root before all to the first testsuite and a root after all to the last one', () => {
            runHook(reporter, 'root-before', { hookKind: 'beforeAll' }, () => log('root-before-log'))
            reporter.emit('suite:start', suite('S1', 'suite', { parentUid: null }))
            runTest(reporter, 't1', { parentUid: 'S1' })
            reporter.emit('suite:end', suite('S1'))
            reporter.emit('suite:start', suite('S2', 'suite', { parentUid: null }))
            runTest(reporter, 't2', { parentUid: 'S2' })
            reporter.emit('suite:end', suite('S2'))
            runHook(reporter, 'root-after', { hookKind: 'afterAll' }, () => log('root-after-log'))
            const xml = xmlOf(reporter)

            expect(suiteOutOf(xml, 'S1')).toBe('\nroot-before-log\n')
            expect(suiteOutOf(xml, 'S2')).toBe('\nroot-after-log\n')
        })

        it('keeps the output of a hook with no hookKind on the test of today (third-party frameworks)', () => {
            reporter.emit('suite:start', suite('S1'))
            runTest(reporter, 't1')
            runHook(reporter, 'before-S1', {}, () => {
                log('hook-log')
                reporter.emit('client:beforeCommand', command('hook-url'))
            })
            reporter.emit('suite:end', suite('S1'))
            const xml = xmlOf(reporter)

            expect(testCaseOf(xml, 't1')).toContain('hook-log')
            expect(testCaseOf(xml, 't1')).toContain('hook-url')
            expect(suiteOutOf(xml, 'S1')).toBeUndefined()
        })
    })

    describe('a parallel context keeps the output of its hooks before its test starts (K29)', () => {
        const beforeAll = (uid: string, ctx: string) => ({ hookKind: 'beforeAll', hookSuiteUid: 'S', parentUid: 'S', contextId: ctx, uid })
        const inContext = (ctx: string, body: () => void) => {
            contextId = ctx
            body()
            contextId = undefined
        }

        it('gives the logs, commands and properties of a Mocha before all to the test of its context', () => {
            reporter.emit('suite:start', suite('S', 'suite', { parentUid: null }))
            reporter.emit('hook:start', hook('h1', beforeAll('h1', 'c1')))
            reporter.emit('hook:start', hook('h2', beforeAll('h2', 'c2')))
            for (const ctx of ['c1', 'c2']) {
                inContext(ctx, () => {
                    log(`${ctx}-before-log`)
                    addProperty(`${ctx}-prop`, ctx)
                })
                reporter.emit('client:beforeCommand', command(`${ctx}-before-url`, ctx))
                reporter.emit('client:afterCommand', { ...command(`${ctx}-before-url`, ctx), result: { value: null } })
            }
            reporter.emit('hook:end', hook('h2', beforeAll('h2', 'c2')))
            reporter.emit('hook:end', hook('h1', beforeAll('h1', 'c1')))
            reporter.emit('test:start', test('t2', { parentUid: 'S', contextId: 'c2' }))
            reporter.emit('test:start', test('t1', { parentUid: 'S', contextId: 'c1' }))
            inContext('c1', () => log('c1-test-log'))
            reporter.emit('client:beforeCommand', command('c1-test-url', 'c1'))
            for (const [uid, ctx] of [['t1', 'c1'], ['t2', 'c2']]) {
                reporter.emit('test:pass', test(uid, { parentUid: 'S', contextId: ctx }))
                reporter.emit('test:end', test(uid, { parentUid: 'S', contextId: ctx }))
                reporter.emit('context:end', { cid: '0-0', uid, contextId: ctx })
            }
            reporter.emit('suite:end', suite('S'))
            const xml = xmlOf(reporter)

            const t1 = testCaseOf(xml, 't1')
            expect(t1).toContain('c1-before-log')
            expect(t1).toContain('c1-test-log')
            expect(t1).toContain('<property name="c1-prop" value="c1"/>')
            expect(t1).toContain([
                'COMMAND: POST /session/s/url - {"url":"c1-before-url"}',
                'RESULT: {"url":"c1-before-url"}',
                'COMMAND: POST /session/s/url - {"url":"c1-test-url"}'
            ].join('\n'))
            expect(t1.split('c1-before-url').length - 1).toBe(2)
            expect(t1).not.toContain('c2-')
            const t2 = testCaseOf(xml, 't2')
            expect(t2).toContain('c2-before-log')
            expect(t2).toContain('c2-before-url')
            expect(t2).toContain('<property name="c2-prop" value="c2"/>')
            expect(t2).not.toContain('c1-')
        })

        it('gives the script of a command before the test as the base shortens it', () => {
            reporter.emit('suite:start', suite('S', 'suite', { parentUid: null }))
            reporter.emit('hook:start', hook('h1', beforeAll('h1', 'c1')))
            reporter.emit('client:beforeCommand', { sessionId: 's', method: 'POST', endpoint: '/session/:sessionId/execute/sync', body: { script: 'x'.repeat(300), args: [] }, contextId: 'c1' })
            reporter.emit('hook:end', hook('h1', beforeAll('h1', 'c1')))
            runTest(reporter, 't1', { parentUid: 'S', contextId: 'c1' })
            reporter.emit('suite:end', suite('S'))

            expect(testCaseOf(xmlOf(reporter), 't1')).toContain('COMMAND: POST /session/s/execute/sync - {"script":"<script> [300 bytes]","args":[]}')
        })

        it('gives a DELETE /session after the last context to the test of the unit that opened last (R6)', () => {
            reporter.emit('suite:start', suite('S', 'suite', { parentUid: null }))
            runTest(reporter, 't1', { parentUid: 'S', contextId: 'c1' })
            runTest(reporter, 't2', { parentUid: 'S', contextId: 'c2' })
            reporter.emit('context:end', { cid: '0-0', uid: 't2', contextId: 'c2' })
            reporter.emit('context:end', { cid: '0-0', uid: 't1', contextId: 'c1' })
            reporter.emit('suite:end', suite('S'))
            reporter.emit('client:beforeCommand', { sessionId: 's', method: 'DELETE', endpoint: '/session/:sessionId', body: {} })
            const xml = xmlOf(reporter)

            expect(testCaseOf(xml, 't2')).toContain('COMMAND: DELETE /session/s - {}')
            expect(testCaseOf(xml, 't1')).not.toContain('DELETE')
        })

        it('gives the output of a failed before all once, to its test, when the test is reported (failHookAffectedTests: true)', () => {
            reporter.emit('suite:start', suite('S', 'suite', { parentUid: null }))
            reporter.emit('hook:start', hook('h1', beforeAll('h1', 'c1')))
            inContext('c1', () => {
                log('c1-before-log')
                addProperty('c1-prop', 'c1')
            })
            reporter.emit('client:beforeCommand', command('c1-before-url', 'c1'))
            reporter.emit('hook:end', hook('h1', { ...beforeAll('h1', 'c1'), error: new Error('before fails'), state: 'failed' }))
            runTest(reporter, 't1', { parentUid: 'S', contextId: 'c1' }, 'test:fail')
            reporter.emit('context:end', { cid: '0-0', uid: 't1', contextId: 'c1' })
            reporter.emit('suite:end', suite('S'))
            const xml = xmlOf(reporter)

            for (const item of ['c1-before-log', 'c1-before-url', 'name="c1-prop"']) {
                expect(xml.split(item).length - 1).toBe(1)
            }
            expect(testCaseOf(xml, 't1')).toContain('c1-before-url')
        })

        it('gives the output of a failed before all to the hook when its test is not reported (failHookAffectedTests: false)', () => {
            reporter.emit('suite:start', suite('S', 'suite', { parentUid: null }))
            reporter.emit('hook:start', hook('h1', beforeAll('h1', 'c1')))
            inContext('c1', () => log('c1-before-log'))
            reporter.emit('client:beforeCommand', command('c1-before-url', 'c1'))
            reporter.emit('hook:end', hook('h1', { ...beforeAll('h1', 'c1'), error: new Error('before fails'), state: 'failed' }))
            runTest(reporter, 't2', { parentUid: 'S', contextId: 'c2' })
            reporter.emit('context:end', { cid: '0-0', uid: 't2', contextId: 'c2' })
            reporter.emit('context:end', { cid: '0-0', uid: 'h1', contextId: 'c1' })
            reporter.emit('suite:end', suite('S'))
            const xml = xmlOf(reporter)

            const failedHook = testCaseOf(xml, 'before all hook h1')
            expect(failedHook).toContain('<failure')
            expect(failedHook).toContain('c1-before-log')
            expect(failedHook).toContain('c1-before-url')
            expect(testCaseOf(xml, 't2')).not.toContain('c1-')
        })

        it('gives the output of a Cucumber Before to the first step of its scenario', () => {
            const before = (ctx: string, scenario: string) => ({ contextId: ctx, parentUid: scenario, hookKind: 'beforeEach' })
            reporter.emit('suite:start', suite('F', 'feature', { parentUid: null }))
            reporter.emit('suite:start', suite('S1', 'scenario', { parentUid: 'F', contextId: 'c1' }))
            reporter.emit('suite:start', suite('S2', 'scenario', { parentUid: 'F', contextId: 'c2' }))
            reporter.emit('hook:start', hook('b1', before('c1', 'S1')))
            reporter.emit('hook:start', hook('b2', before('c2', 'S2')))
            for (const ctx of ['c1', 'c2']) {
                inContext(ctx, () => log(`${ctx}-before-log`))
                reporter.emit('client:beforeCommand', command(`${ctx}-before-url`, ctx))
            }
            reporter.emit('hook:end', hook('b1', before('c1', 'S1')))
            reporter.emit('hook:end', hook('b2', before('c2', 'S2')))
            runTest(reporter, 'step-2', { parentUid: 'S2', contextId: 'c2' })
            runTest(reporter, 'step-1', { parentUid: 'S1', contextId: 'c1' })
            for (const [uid, ctx] of [['S1', 'c1'], ['S2', 'c2']]) {
                reporter.emit('suite:end', suite(uid, 'scenario', { parentUid: 'F', contextId: ctx }))
                reporter.emit('context:end', { cid: '0-0', uid, contextId: ctx })
            }
            reporter.emit('suite:end', suite('F', 'feature'))

            const step1 = reporter['_getStandardOutput'](reporter.tests['step-1'])
            expect(step1).toContain('c1-before-log')
            expect(step1).toContain('c1-before-url')
            expect(step1).not.toContain('c2-')
            const step2 = reporter['_getStandardOutput'](reporter.tests['step-2'])
            expect(step2).toContain('c2-before-log')
            expect(step2).toContain('c2-before-url')
            expect(step2).not.toContain('c1-')
            expect(() => xmlOf(reporter, 'cucumber')).not.toThrow()
        })

        it('writes each Cucumber step of a parallel scenario on its own line, followed by its output (U2, #15968)', () => {
            const before = { contextId: 'c1', parentUid: 'S1', hookKind: 'beforeEach' }
            reporter.emit('suite:start', suite('F', 'feature', { parentUid: null }))
            reporter.emit('suite:start', suite('S1', 'scenario', { parentUid: 'F', contextId: 'c1' }))
            runHook(reporter, 'b1', before, () => inContext('c1', () => log('c1-before-log')))
            runTest(reporter, 'step-a', { parentUid: 'S1', contextId: 'c1' })
            runTest(reporter, 'step-b', { parentUid: 'S1', contextId: 'c1' })
            reporter.emit('suite:end', suite('S1', 'scenario', { parentUid: 'F', contextId: 'c1' }))
            reporter.emit('context:end', { cid: '0-0', uid: 'S1', contextId: 'c1' })
            reporter.emit('suite:end', suite('F', 'feature'))

            const systemOut = /<system-out><!\[CDATA\[([\s\S]*?)\]\]><\/system-out>/.exec(testCaseOf(xmlOf(reporter, 'cucumber'), 'S1'))?.[1]
            expect(systemOut).toBe(['', '✅ step-a', 'c1-before-log', '✅ step-b', '', ''].join('\n'))
        })
    })

    // U4: the Before runs after the scenario suite:start and before the first step
    describe('a sequential Cucumber Before writes to the first step of its scenario', () => {
        const scenarioOut = (xml: string, name: string) => /<system-out><!\[CDATA\[([\s\S]*?)\]\]><\/system-out>/.exec(testCaseOf(xml, name))?.[1] ?? ''
        const runScenario = (uid: string, tag: string, stepResult = 'test:pass') => {
            runHook(reporter, `${uid}-before`, { parent: uid, hookKind: 'beforeEach', title: 'Before' }, () => {
                log(`${tag}-before-log`)
                reporter.emit('client:beforeCommand', command(`${tag}-before-url`))
            })
            runTest(reporter, `${uid}-step`, { parent: uid }, stepResult)
        }

        it('gives each scenario its own Before output, also the first scenario of the worker', () => {
            reporter.emit('suite:start', suite('F', 'feature'))
            for (const uid of ['S1', 'S2']) {
                reporter.emit('suite:start', suite(uid, 'scenario', { parent: 'F' }))
                runScenario(uid, uid.toLowerCase())
                reporter.emit('suite:end', suite(uid, 'scenario'))
            }
            reporter.emit('suite:end', suite('F', 'feature'))

            const xml = xmlOf(reporter, 'cucumber')
            expect(scenarioOut(xml, 'S1')).toBe(['', '✅ S1-step', 's1-before-log', '...command output...', '',
                'COMMAND: POST /session/s/url - {"url":"s1-before-url"}', '', ''].join('\n'))
            expect(scenarioOut(xml, 'S2')).toBe(['', '✅ S2-step', 's2-before-log', '...command output...', '',
                'COMMAND: POST /session/s/url - {"url":"s2-before-url"}', '', ''].join('\n'))
        })

        it('gives the Before of the next attempt to the next attempt after a suite:retry', () => {
            reporter.emit('suite:start', suite('F', 'feature'))
            reporter.emit('suite:start', suite('S1', 'scenario', { parent: 'F' }))
            runScenario('S1', 'attempt1', 'test:retry')
            reporter.emit('suite:retry', suite('S1', 'scenario', { parent: 'F' }))
            runScenario('S1', 'attempt2')
            reporter.emit('suite:end', suite('S1', 'scenario'))
            reporter.emit('suite:end', suite('F', 'feature'))

            const out = scenarioOut(xmlOf(reporter, 'cucumber'), 'S1')
            expect(out).toContain('attempt2-before-log')
            expect(out).toContain('attempt2-before-url')
            expect(out).not.toContain('attempt1-')
        })
    })

    describe('a hook whose parent is a feature (K26)', () => {
        it.each([{}, { hookKind: 'beforeAll' }])('writes a failed BeforeAll of the feature as a testcase of its testsuite (%o)', (extra) => {
            reporter.emit('suite:start', suite('F', 'feature', { parentUid: null }))
            runHook(reporter, 'run-hook', { parentUid: 'F', title: 'BeforeAll (steps.ts:23)', ...extra }, () => {}, { error: new Error('BeforeAll fails'), state: 'failed' })
            reporter.emit('suite:start', suite('S1', 'scenario', { parentUid: 'F' }))
            runTest(reporter, 'step-1', { parentUid: 'S1' }, 'test:pending')
            reporter.emit('suite:end', suite('S1', 'scenario'))
            reporter.emit('suite:end', suite('F', 'feature'))

            let xml = ''
            expect(() => { xml = xmlOf(reporter, 'cucumber') }).not.toThrow()
            const failedHook = testCaseOf(testSuiteOf(xml, 'F'), 'BeforeAll steps ts 23')
            expect(failedHook).toContain('<failure message="BeforeAll fails"/>')
            expect(testSuiteOf(xml, 'F')).toMatch(/<testsuite name="F"[^>]* failures="1"/)
        })

        it.each([{}, { hookKind: 'afterAll' }])('writes a failed AfterAll of the feature after its scenarios (%o)', (extra) => {
            reporter.emit('suite:start', suite('F', 'feature', { parentUid: null }))
            reporter.emit('suite:start', suite('S1', 'scenario', { parentUid: 'F' }))
            runTest(reporter, 'step-1', { parentUid: 'S1' })
            reporter.emit('suite:end', suite('S1', 'scenario'))
            runHook(reporter, 'run-hook', { parentUid: 'F', title: 'AfterAll (steps.ts:30)', ...extra }, () => {}, { error: new Error('AfterAll fails'), state: 'failed' })
            reporter.emit('suite:end', suite('F', 'feature'))

            const names = [...testSuiteOf(xmlOf(reporter, 'cucumber'), 'F').matchAll(/<testcase [^>]*name="([^"]*)"/g)].map(([, name]) => name)
            expect(names).toEqual(['S1', 'AfterAll steps ts 30'])
        })
    })
})
