import { describe, expect, vi, it, afterEach, beforeEach } from 'vitest'

import WDIOReporter from '../src/index.js'
import tmp from 'tmp'
import type { Test } from '../src/stats/test.js'
import TestStats from '../src/stats/test.js'
import type RunnerStats from '../src/stats/runner.js'
import type { Suite } from '../src/stats/suite.js'
import type { Hook } from '../src/stats/hook.js'

const runnerSpecs = ['/path/to/fileA.js', '/path/to/fileA.js']

describe('WDIOReporter Listeners', () => {
    let reporter: WDIOReporter
    let testStartEvent: Test
    let runnerStartEvent: RunnerStats
    let suiteStartEvent: Suite
    let hookStartEvent: Hook
    let hookEndEvent: Hook
    let testPassEvent: Test
    let testStartFirstEvent: Test
    let testRetryEvent: Test
    let testStartSecondEvent: Test
    let testFailEvent: Test
    let testEndEvent: Test
    let stat: Test

    beforeEach(() => {
        reporter = new WDIOReporter({ logFile: tmp.fileSync().name })
    })

    describe('Pending Listener', () => {
        let spy: any
        let spy2: any

        beforeEach(() => {
            spy = vi.spyOn(WDIOReporter.prototype, 'onTestSkip')
            spy2 = vi.spyOn(TestStats.prototype, 'skip')
            stat = {
                type: 'test:start',
                title: 'should can do something',
                parent: 'My awesome feature',
                fullTitle: 'My awesome feature should can do something',
                pending: false,
                cid: '0-0',
                specs: ['/path/to/test/specs/sync.spec.js'],
                uid: '0-0'
            }
        })

        afterEach(() => {
            spy.mockClear()
            spy2.mockClear()
        })

        it('keeps the start of a started test that ends as pending, and its duration', () => {
            vi.useFakeTimers({ toFake: ['Date'] })
            try {
                vi.setSystemTime(1000)
                // a Cucumber step that returns 'pending' after 120 ms
                reporter.emit('test:start', { ...stat, uid: 'step-1' })
                vi.setSystemTime(1120)
                reporter.emit('test:pending', { ...stat, uid: 'step-1', state: 'pending' })
                expect(reporter.tests['step-1'].state).toBe('pending')
                expect(reporter.tests['step-1']._duration).toBe(120)
            } finally {
                vi.useRealTimers()
            }
        })

        it('gives a started test that ends as skipped its duration (Jasmine pending())', () => {
            vi.useFakeTimers({ toFake: ['Date'] })
            try {
                vi.setSystemTime(1000)
                // Jasmine sends test:pending with the uid of the start and no state
                reporter.emit('test:start', { ...stat, uid: 'spec-1' })
                vi.setSystemTime(1120)
                reporter.emit('test:pending', { ...stat, uid: 'spec-1', pendingReason: 'not ready' })
                expect(reporter.tests['spec-1'].state).toBe('skipped')
                expect(reporter.tests['spec-1']._duration).toBe(120)
            } finally {
                vi.useRealTimers()
            }
        })

        it('keeps the commands of a started test that ends as pending', () => {
            reporter.emit('test:start', { ...stat, uid: 'step-3' })
            reporter.emit('client:beforeCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: {} })
            reporter.emit('client:afterCommand', { method: 'POST', endpoint: '/session/:sessionId/url', body: {}, result: null })
            reporter.emit('test:pending', { ...stat, uid: 'step-3', state: 'pending' })
            expect(reporter.tests['step-3'].output.map((entry) => entry.type)).toEqual(['command', 'result'])
        })

        it('keeps the context and the parent of a started parallel test that ends as pending', () => {
            // Cucumber parallel scenarioLevelReporter: the pending payload has no contextId
            reporter.emit('test:start', { ...stat, uid: 'scenario-1', contextId: 'ctx-1', parentUid: 'feature-1' })
            reporter.emit('test:pending', { ...stat, uid: 'scenario-1', state: 'pending' })
            expect(reporter.tests['scenario-1'].contextId).toBe('ctx-1')
            expect(reporter.tests['scenario-1'].parentUid).toBe('feature-1')
        })

        it('gives a parallel test that ends as pending the retries of its context', () => {
            // Cucumber parallel retry: a failed attempt, then a new attempt that ends as pending
            reporter.emit('test:start', { ...stat, uid: 'scenario-2', contextId: 'ctx-2' })
            reporter.emit('test:retry', { ...stat, uid: 'scenario-2', contextId: 'ctx-2' })
            reporter.emit('test:start', { ...stat, uid: 'scenario-2', contextId: 'ctx-2' })
            // the pending payload has no contextId
            reporter.emit('test:pending', { ...stat, uid: 'scenario-2', state: 'pending' })
            expect(reporter.tests['scenario-2'].retries).toBe(1)
        })

        it('adds no context or parent property to a sequential test that ends as pending', () => {
            reporter.emit('test:start', { ...stat, uid: 'step-4' })
            reporter.emit('test:pending', { ...stat, uid: 'step-4', state: 'pending' })
            expect(Object.keys(reporter.tests['step-4'])).not.toContain('contextId')
            expect(Object.keys(reporter.tests['step-4'])).not.toContain('parentUid')
        })

        it('gives a pending test that never started no duration (Mocha it.skip)', () => {
            vi.useFakeTimers({ toFake: ['Date'] })
            try {
                vi.setSystemTime(1000)
                reporter.emit('test:pending', { ...stat, uid: 'never-started', state: 'pending' })
                reporter.emit('test:pending', { ...stat, uid: 'never-started-skip' })
                vi.setSystemTime(31000)
                // the duration does not increase after the end of the test
                expect(reporter.tests['never-started'].end).toBeInstanceOf(Date)
                expect(reporter.tests['never-started'].duration).toBe(0)
                expect(reporter.tests['never-started-skip'].duration).toBe(0)
            } finally {
                vi.useRealTimers()
            }
        })

        it('does not take the start of a test that already ended as pending', () => {
            vi.useFakeTimers({ toFake: ['Date'] })
            try {
                vi.setSystemTime(1000)
                reporter.emit('test:start', { ...stat, uid: 'step-2' })
                vi.setSystemTime(1120)
                reporter.emit('test:pending', { ...stat, uid: 'step-2', state: 'pending' })
                vi.setSystemTime(2000)
                // a second pending event, with no new start
                reporter.emit('test:pending', { ...stat, uid: 'step-2', state: 'pending' })
                expect(reporter.tests['step-2'].duration).toBe(0)
            } finally {
                vi.useRealTimers()
            }
        })

        it('should add a pending test to the test list', () => {
            reporter.emit('test:pending', stat)
            expect(reporter.tests).toHaveProperty(stat.uid)
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(1)
            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)
        })

        it('should allow Mocha pending tests with same UID to be added to other tests ', () => {
            const stats: any = []
            stats.push({ ...stat, uid: '0-0-0' })
            stats.push({ ...stat, uid: '0-0-1' })
            stats.push({ ...stat, uid: '0-0-2' })
            stats.push({ ...stat, uid: '0-0-3' })

            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])

            // If new uid is not generated for pending test
            reporter.emit('test:pending', stats[1])
            reporter.emit('test:pending', stats[1])

            reporter.emit('test:pending', stats[2])
            reporter.emit('test:pending', stats[3])

            expect(spy).toHaveBeenCalledTimes(4)
            expect(spy2).toHaveBeenCalledTimes(4)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty('skipped-0')
            expect(reporter.tests).toHaveProperty('skipped-1')
            expect(reporter.tests).toHaveProperty(stats[2].uid)
            expect(reporter.tests).toHaveProperty(stats[3].uid)

            // Make sure there are only 4 tests
            expect(Object.keys(reporter.tests).length).toEqual(6)

            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests['skipped-0'].state).toEqual('skipped')
            expect(reporter.tests['skipped-1'].state).toEqual('skipped')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')
            expect(reporter.tests[stats[3].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(6)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual('skipped-0')
            expect(reporter.currentSuites[0].tests[3].uid).toEqual('skipped-1')
            expect(reporter.currentSuites[0].tests[4].uid).toEqual(stats[2].uid)
            expect(reporter.currentSuites[0].tests[5].uid).toEqual(stats[3].uid)

            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(4)
            expect(reporter.counts.tests).toEqual(6)
        })

        it('should allow Jasmine pending tests to be added to the test list', () => {
            const stats: any = []
            stats.push({ ...stat, uid: '0-0-0' })
            stats.push({ ...stat, uid: '0-0-1' })
            stats.push({ ...stat, uid: '0-0-2' })

            reporter.emit('test:start', stats[0])
            reporter.emit('test:pass', stats[0])
            reporter.emit('test:start', stats[1])
            reporter.emit('test:fail', stats[1])
            reporter.emit('test:start', stats[2])
            reporter.emit('test:pending', stats[2])

            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy2).toHaveBeenCalledTimes(1)

            // Make sure all tests are present
            expect(reporter.tests).toHaveProperty(stats[0].uid)
            expect(reporter.tests).toHaveProperty(stats[1].uid)
            expect(reporter.tests).toHaveProperty(stats[2].uid)

            // Make sure there are only 3 tests
            expect(Object.keys(reporter.tests).length).toEqual(3)
            expect(reporter.tests).not.toHaveProperty('skipped-0')

            // Make sure all tests have the right state
            expect(reporter.tests[stats[0].uid].state).toEqual('passed')
            expect(reporter.tests[stats[1].uid].state).toEqual('failed')
            expect(reporter.tests[stats[2].uid].state).toEqual('skipped')

            // Make sure all tests are in the suite
            expect(reporter.currentSuites[0].tests.length).toEqual(3)
            expect(reporter.currentSuites[0].tests[0].uid).toEqual(stats[0].uid)
            expect(reporter.currentSuites[0].tests[1].uid).toEqual(stats[1].uid)
            expect(reporter.currentSuites[0].tests[2].uid).toEqual(stats[2].uid)

            // Make sure the counts are updated
            expect(reporter.counts.skipping).toEqual(1)
            expect(reporter.counts.tests).toEqual(3)
        })
    })

    describe('handling runner:start', () => {

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            reporter.onRunnerStart = vi.fn()
        })

        it('should set the root suite id', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.currentSuites[0].cid).toBe(runnerStartEvent.cid)
        })

        it('should set the runner stat', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.runnerStat).toBeDefined()
            expect(reporter.runnerStat!.capabilities).toEqual(runnerStartEvent.capabilities)
        })

        it('should call onRunnerStart', () => {
            reporter.emit('runner:start', runnerStartEvent)
            expect(reporter.onRunnerStart).toBeCalledWith(reporter.runnerStat)
        })
    })

    describe('handling suite:start', () => {

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            reporter.onSuiteStart = vi.fn()
        })

        it('should set the suite as sub suite of the current suite', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.currentSuites[0].suites.length).toBe(1)
            expect(reporter.currentSuites[0].suites[0].title).toBe(suiteStartEvent.title)
        })

        it('should keep concurrent child suites under their parent when ended out of order', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', { uid: 'feature', title: 'feature' } as Suite)
            reporter.emit('suite:start', { uid: 's1', title: 's1', parentUid: 'feature' } as Suite)
            reporter.emit('suite:start', { uid: 's2', title: 's2', parentUid: 'feature' } as Suite)

            const feature = reporter.currentSuites[1]
            expect(feature.suites.map((s) => s.uid)).toEqual(['s1', 's2'])
            expect(reporter.currentSuites.map((s) => s.uid)).toEqual([reporter.currentSuites[0].uid, 'feature', 's1', 's2'])

            reporter.emit('suite:end', { uid: 's1', title: 's1' } as Suite)
            expect(reporter.currentSuites.map((s) => s.uid)).toEqual([reporter.currentSuites[0].uid, 'feature', 's2'])
            reporter.emit('suite:end', { uid: 's2', title: 's2' } as Suite)
            expect(reporter.currentSuites.map((s) => s.uid)).toEqual([reporter.currentSuites[0].uid, 'feature'])
            expect(feature.suites[0].suites).toHaveLength(0)
        })

        it('should attach top-level suites with a null parentUid to the root instead of nesting them', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', { uid: 'a', title: 'a', parentUid: null } as Suite)
            reporter.emit('suite:start', { uid: 'b', title: 'b', parentUid: null } as Suite)

            expect(reporter.currentSuites[0].suites.map((s) => s.uid)).toEqual(['a', 'b'])
            expect(reporter.suites.a.suites).toHaveLength(0)
        })

        it('should add the suite to the stack of current suites', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.currentSuites.length).toBe(2)
            expect(reporter.currentSuites[1].title).toBe(suiteStartEvent.title)
        })

        it('should add the suite stats to the lookup object of suite stats', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.suites[suiteStartEvent.uid!]).toBeDefined()
            expect(reporter.suites[suiteStartEvent.uid!].title).toBe(suiteStartEvent.title)
        })

        it('should call onSuiteStart with the suite stat', () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)

            expect(reporter.onSuiteStart).toBeCalledWith(reporter.suites[suiteStartEvent.uid!])
        })
    })

    describe('handling hook:start', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('hook:start', hookStartEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            hookStartEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            } as Hook
        })

        it('should attach the hook stats to the current suite stats', () => {
            emitEvents()
            expect(reporter.currentSuites[1].hooks).toHaveLength(1)
            expect(reporter.currentSuites[1].hooks[0].uid).toEqual(hookStartEvent.uid)
        })

        it('should add the hook stats to the lookup object of hook stats', () => {
            emitEvents()
            expect(reporter.hooks[hookStartEvent.uid!].title).toBe(hookStartEvent.title)
        })

        it('should call on hook start with the hook stat', () => {
            reporter.onHookStart = vi.fn()
            emitEvents()
            expect(reporter.onHookStart).toBeCalledWith(reporter.hooks[hookStartEvent.uid!])
        })
    })

    describe('handling hook:end', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('hook:start', hookStartEvent)
            reporter.emit('hook:end', hookEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            hookStartEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            } as Hook
            hookEndEvent = {
                uid: 'hookid',
                title: 'beforeAll'
            } as Hook
        })

        it('should complete the hook if the hook passes', () => {
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid!]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid!].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid!].state).not.toBe('failed')
        })

        it('should complete the hook if the hook if the hook passes and has an empty errors property', () => {
            hookEndEvent.errors = []
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid!]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid!].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid!].state).not.toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid!].error).toBeUndefined()
        })

        it('should complete the hook if the hook fails with a single error and mark it failed (Mocha-style)', () => {
            hookEndEvent.error = new Error('Boom')
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid!]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid!].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid!].state).toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid!].error!.message).toBe('Boom')
            expect(reporter.hooks[hookStartEvent.uid!].errors!.length).toBe(1)
            expect(reporter.hooks[hookStartEvent.uid!].errors![0].message).toBe('Boom')
        })

        it('should complete the hook if the hook fails with multiple errors and mark it failed (Jasmine-style)', () => {
            hookEndEvent.errors = [{ message: 'SoftFail' } as Error, { message: 'anotherfail' } as Error]
            emitEvents()

            expect(reporter.hooks[hookStartEvent.uid!]).toBeDefined()
            expect(reporter.hooks[hookStartEvent.uid!].end instanceof Date).toBe(true)
            expect(reporter.hooks[hookStartEvent.uid!].state).toBe('failed')
            expect(reporter.hooks[hookStartEvent.uid!].error!.message).toBe('SoftFail')
            expect(reporter.hooks[hookStartEvent.uid!].errors!.length).toBe(2)
            expect(reporter.hooks[hookStartEvent.uid!].errors![0].message).toBe('SoftFail')
            expect(reporter.hooks[hookStartEvent.uid!].errors![1].message).toBe('anotherfail')
        })

        it('should call onHookEnd with the hook stats', () => {
            reporter.onHookEnd = vi.fn()
            emitEvents()

            expect(reporter.onHookEnd).toHaveBeenCalledWith(reporter.hooks[hookStartEvent.uid!])
        })

        it('should increment the hook count', () => {
            emitEvents()
            expect(reporter.counts.hooks).toBe(1)
        })
    })

    describe('handling test:start', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            } as Test
        })

        it('should add the test stat to the current suite stat', () => {
            emitEvents()
            expect(reporter.suites[suiteStartEvent.uid!].tests.length).toBe(1)
            expect(reporter.suites[suiteStartEvent.uid!].tests[0].title).toBe(testStartEvent.title)
        })

        it('should add the test stat to the lookup object of test stats', () => {
            emitEvents()
            expect(reporter.tests[testStartEvent.uid].title).toBe(testStartEvent.title)
        })

        it('should call onTestStart with the test stat', () => {
            reporter.onTestStart = vi.fn()
            emitEvents()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })

    describe('handling test:pass', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:pass', testPassEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            } as Test
            testPassEvent = {
                uid: 'testid',
            } as Test
        })

        it('should flag the test stat as passed and complete', () => {
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('passed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
        })

        it('should increment the test and passes counts', () => {
            emitEvents()

            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(1)
        })

        it('should call onTestPass with the test stat', () => {
            reporter.onTestPass = vi.fn()
            emitEvents()

            expect(reporter.onTestPass).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })

    describe('handling test:fail', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:fail', testFailEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the softare'
            } as Suite
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            } as Test
            testFailEvent = {
                uid: 'testid'
            } as Test
        })

        it('Should flag the test as failed and complete if the test somehow has no error', () => {
            emitEvents()
            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
        })

        it('shoud flag the test as failed and complete if the test has one error (Mocha style)', () => {
            testFailEvent.error = new Error('Boom')
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.tests[testStartEvent.uid!].error!.message).toBe('Boom')
            expect(reporter.tests[testStartEvent.uid!].errors!.length).toBe(1)
            expect(reporter.tests[testStartEvent.uid!].errors![0].message).toBe('Boom')
        })

        it('should flag the test as failed and complete the test if the test has multiple errors (Jasmine style)', () => {
            testFailEvent.errors = [{ message: 'SoftFail' } as Error, { message: 'anotherfail' } as Error]
            emitEvents()

            expect(reporter.tests[testStartEvent.uid].state).toBe('failed')
            expect(reporter.tests[testStartEvent.uid].end instanceof Date).toBe(true)
            expect(reporter.tests[testStartEvent.uid!].error!.message).toBe('SoftFail')
            expect(reporter.tests[testStartEvent.uid!].errors!.length).toBe(2)
            expect(reporter.tests[testStartEvent.uid!].errors![0].message).toBe('SoftFail')
            expect(reporter.tests[testStartEvent.uid!].errors![1].message).toBe('anotherfail')
        })

        it('should call onTestFail with the test stat', () => {
            reporter.onTestFail = vi.fn()
            emitEvents()

            expect(reporter.onTestFail).toBeCalledWith(reporter.tests[testStartEvent.uid])
        })

        it('Should increment the test and failure counts', () => {
            emitEvents()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.failures).toBe(1)
        })
    })

    describe('handling test:retry', () => {

        const emitEventsFirstTry = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartFirstEvent)
            reporter.emit('test:retry', testRetryEvent)
        }

        const emitEventsSecondPassTry = () => {
            reporter.emit('test:start', testStartSecondEvent)
            reporter.emit('test:pass', testPassEvent)
            reporter.emit('test:end', testEndEvent)
        }

        const emitEventsSecondFailTry = () => {
            reporter.emit('test:start', testStartSecondEvent)
            reporter.emit('test:fail', testFailEvent)
            reporter.emit('test:end', testEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runner-id',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suite-id',
                title: 'the software'
            } as Suite
            testStartFirstEvent = {
                uid: 'test-id',
                title: 'should do the needful'
            } as Test
            testRetryEvent = {
                uid: 'test-id'
            } as Test
            testStartSecondEvent = {
                uid: 'test-retry-id',
                title: 'should do the needful'
            } as Test
            testPassEvent = {
                uid: 'test-retry-id'
            } as Test
            testFailEvent = {
                uid: 'test-retry-id'
            } as Test
            testEndEvent = {
                uid: 'test-retry-id'
            } as Test
        })

        it('should call test retry with the test stat', () => {
            reporter.onTestStart = vi.fn()
            reporter.onTestRetry = vi.fn()
            reporter.onTestFail = vi.fn()
            reporter.onTestEnd = vi.fn()

            emitEventsFirstTry()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartFirstEvent.uid])
            expect(reporter.onTestRetry).toHaveBeenCalledWith(reporter.tests[testRetryEvent.uid])

            emitEventsSecondFailTry()
            expect(reporter.onTestStart).toHaveBeenCalledWith(reporter.tests[testStartSecondEvent.uid])
            expect(reporter.onTestFail).toHaveBeenCalledWith(reporter.tests[testFailEvent.uid])
            expect(reporter.onTestEnd).toHaveBeenCalledWith(reporter.tests[testEndEvent.uid])
        })

        it('should update test retries count', () => {
            emitEventsFirstTry()
            expect(reporter.tests[testRetryEvent.uid].retries).toBe(0)

            emitEventsSecondFailTry()
            expect(reporter.tests[testEndEvent.uid].retries).toBe(1)
        })

        // a retried attempt has no test:end, so the counter goes on; the final test:end resets it
        it('counts the retries of a test that keeps its uid, and resets them at test:end', () => {
            reporter.emit('test:start', { uid: 'S', title: 'scenario' })
            reporter.emit('test:retry', { uid: 'S', title: 'scenario' })
            reporter.emit('test:start', { uid: 'S', title: 'scenario' })
            expect(reporter.tests.S.retries).toBe(1)
            reporter.emit('test:pass', { uid: 'S', title: 'scenario' })
            reporter.emit('test:end', { uid: 'S', title: 'scenario' })
            reporter.emit('test:start', { uid: 'T', title: 'next' })
            expect(reporter.tests.T.retries).toBe(0)
            reporter.emit('test:pending', { uid: 'U', title: 'pending' })
            expect(reporter.tests.U.retries).toBe(0)
        })

        it('should increment the test and passes counts only after test retry', () => {
            emitEventsFirstTry()
            expect(reporter.counts.tests).toBe(0)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(0)

            emitEventsSecondPassTry()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(1)
            expect(reporter.counts.failures).toBe(0)
        })

        it('should increment the test and failure counts only after test retry', () => {
            emitEventsFirstTry()
            expect(reporter.counts.tests).toBe(0)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(0)

            emitEventsSecondFailTry()
            expect(reporter.counts.tests).toBe(1)
            expect(reporter.counts.passes).toBe(0)
            expect(reporter.counts.failures).toBe(1)
        })
    })

    // Cucumber at step level: suite:retry starts the next attempt of a scenario and clears its steps
    describe('suite:retry removes the counts of the attempt that it clears', () => {
        const step = (uid: string, result: 'pass' | 'fail' | 'retry' | 'skip' | 'pending', contextId?: string) => {
            const payload = { uid, title: uid, parentUid: contextId ? `S-${contextId}` : undefined, contextId }
            reporter.emit('test:start', payload)
            reporter.emit(`test:${result}`, { ...payload, ...(result === 'pending' ? { state: 'pending' } : {}) })
            reporter.emit('test:end', payload)
        }
        const scenario = (uid: string, event: 'suite:start' | 'suite:retry', contextId?: string) =>
            reporter.emit(event, { uid, title: uid, parentUid: contextId ? 'F' : undefined, contextId })

        beforeEach(() => {
            reporter.emit('suite:start', { uid: 'F', title: 'feature' })
        })

        it('keeps only the steps of the last attempt', () => {
            scenario('S', 'suite:start')
            step('s1', 'pass')
            step('s2', 'retry')
            step('s3', 'skip')
            scenario('S', 'suite:retry')
            step('s1', 'pass')
            step('s2', 'pass')
            step('s3', 'pass')
            expect(reporter.counts).toMatchObject({ tests: 3, passes: 3, failures: 0, skipping: 0, pending: 0 })
        })

        it('removes a failure of an attempt that an After hook made Cucumber retry', () => {
            scenario('S', 'suite:start')
            step('s1', 'pass')
            step('s2', 'fail')
            step('s3', 'pending')
            scenario('S', 'suite:retry')
            step('s1', 'pass')
            expect(reporter.counts).toMatchObject({ tests: 1, passes: 1, failures: 0, skipping: 0, pending: 0 })
        })

        it('keeps the counts of the scenario of another window', () => {
            scenario('S-a', 'suite:start', 'a')
            scenario('S-b', 'suite:start', 'b')
            step('a1', 'retry', 'a')
            step('b1', 'fail', 'b')
            step('b2', 'skip', 'b')
            scenario('S-a', 'suite:retry', 'a')
            step('a1', 'pass', 'a')
            expect(reporter.counts).toMatchObject({ tests: 3, passes: 1, failures: 1, skipping: 1 })
        })
    })

    describe('handling test:end', () => {

        const emitEvents = () => {
            reporter.emit('runner:start', runnerStartEvent)
            reporter.emit('suite:start', suiteStartEvent)
            reporter.emit('test:start', testStartEvent)
            reporter.emit('test:pass', testPassEvent)
            reporter.emit('test:end', testEndEvent)
        }

        beforeEach(() => {
            runnerStartEvent = {
                cid: 'runnerid',
                capabilities: {
                    browserName: 'Chrome'
                },
                specs: runnerSpecs
            } as RunnerStats
            suiteStartEvent = {
                uid: 'suiteid',
                title: 'the software'
            } as Suite
            testStartEvent = {
                uid: 'testid',
                title: 'should do the needful'
            } as Test
            testPassEvent = {
                uid: 'testid',
            } as Test
            testEndEvent = {
                uid: 'testid'
            } as Test
        })

        it('should call test end with the test stat', () => {
            reporter.onTestEnd = vi.fn()
            emitEvents()
            expect(reporter.onTestEnd).toHaveBeenCalledWith(reporter.tests[testStartEvent.uid])
        })
    })

    describe('parallel contexts', () => {
        const base = { cid: '0-0', specs: [], parent: 'p', pending: false, fullTitle: 'p t' }
        const start = (uid: string, contextId?: string) => reporter.emit('test:start', { ...base, uid, title: uid, contextId })
        const command = (type: 'client:beforeCommand' | 'client:afterCommand', command: string, contextId?: string) =>
            reporter.emit(type, { sessionId: 's', command, contextId })

        beforeEach(() => {
            reporter.emit('runner:start', { cid: '0-0', capabilities: {}, specs: runnerSpecs } as any)
            reporter.emit('suite:start', { uid: 'suite-id', title: 'suite' })
        })

        it('routes interleaved command output to the test owning the context', () => {
            start('A', 'ctx-a')
            start('B', 'ctx-b')
            command('client:beforeCommand', 'a1', 'ctx-a')
            command('client:beforeCommand', 'b1', 'ctx-b')
            command('client:afterCommand', 'a1', 'ctx-a')
            command('client:afterCommand', 'b1', 'ctx-b')
            reporter.emit('test:end', { uid: 'A', contextId: 'ctx-a' })
            reporter.emit('test:end', { uid: 'B' })

            expect(reporter.tests.A.output.map((o: any) => [o.command, o.type])).toEqual([['a1', 'command'], ['a1', 'result']])
            expect(reporter.tests.B.output.map((o: any) => [o.command, o.type])).toEqual([['b1', 'command'], ['b1', 'result']])
        })

        it('routes the commands of an ended context to its last test, as a sequential run routes them to the current test', () => {
            start('A', 'ctx-a')
            start('B', 'ctx-b')
            reporter.emit('test:end', { uid: 'A' })
            // afterEach and after hooks run after test:end
            command('client:beforeCommand', 'teardown', 'ctx-a')
            command('client:afterCommand', 'teardown', 'ctx-a')
            expect(reporter.tests.A.output.map((o: any) => [o.command, o.type])).toEqual([['teardown', 'command'], ['teardown', 'result']])
            expect(reporter.tests.B.output).toHaveLength(0)
        })

        it('routes the commands of a context to the test that started last in it', () => {
            start('S1', 'ctx-a')
            reporter.emit('test:end', { uid: 'S1', contextId: 'ctx-a' })
            start('S2', 'ctx-a')
            command('client:beforeCommand', 'step 2', 'ctx-a')
            expect(reporter.tests.S1.output).toHaveLength(0)
            expect(reporter.tests.S2.output).toHaveLength(1)
        })

        it('does not attribute commands from an unstarted context to the last ended test', () => {
            start('A', 'ctx-a')
            reporter.emit('test:end', { uid: 'A', contextId: 'ctx-a' })
            command('client:beforeCommand', 'hook', 'ctx-b')
            command('client:afterCommand', 'hook', 'ctx-b')
            expect(reporter.tests.A.output).toHaveLength(0)
        })

        it('drops commands without contextId while a context-tracked test is active', () => {
            start('A', 'ctx-a')
            start('B', 'ctx-b')
            command('client:beforeCommand', 'cleanup')
            command('client:afterCommand', 'cleanup')
            expect(reporter.tests.A.output).toHaveLength(0)
            expect(reporter.tests.B.output).toHaveLength(0)
        })

        it('skips the current test when test:skip carries an unknown uid', () => {
            start('A', 'ctx-a')
            expect(() => reporter.emit('test:skip', { uid: 'step-uid', pendingReason: 'why' })).not.toThrow()
            expect(reporter.tests.A.state).toBe('skipped')
            expect(reporter.tests.A.pendingReason).toBe('why')
        })

        it('ignores test:skip with an unknown uid when no test started', () => {
            expect(() => reporter.emit('test:skip', { uid: 'step-uid' })).not.toThrow()
        })

        it('does not leave a retry entry behind after test:end', () => {
            start('A', 'ctx-a')
            reporter.emit('test:retry', { uid: 'A' })
            const set = vi.spyOn(Map.prototype, 'set')
            reporter.emit('test:end', { uid: 'A' })
            const zeroed = set.mock.calls.some(([key, value]) => key === 'ctx-a' && value === 0)
            set.mockRestore()
            expect(zeroed).toBe(false)
            start('A2', 'ctx-a')
            expect(reporter.tests.A2.retries).toBe(0)
        })

        it('routes pending tests by context', () => {
            reporter.emit('test:pending', { ...base, uid: 'P', title: 'P', contextId: 'ctx-p' })
            start('B', 'ctx-b')
            command('client:beforeCommand', 'p1', 'ctx-p')
            expect(reporter.tests.P.output).toHaveLength(1)
            expect(reporter.tests.B.output).toHaveLength(0)
        })

        describe('getContextTest', () => {
            it('resolves the test owning the resolver context', () => {
                start('A', 'ctx-a')
                start('B', 'ctx-b')
                reporter.setContextIdResolver(() => 'ctx-a')
                expect(reporter.getContextTest()).toBe(reporter.tests.A)
                reporter.setContextIdResolver(() => 'ctx-b')
                expect(reporter.getContextTest()).toBe(reporter.tests.B)
            })

            it('returns the last test of an ended context, for output of its afterEach and after hooks', () => {
                start('A', 'ctx-a')
                start('B', 'ctx-b')
                reporter.emit('test:end', { uid: 'A', contextId: 'ctx-a' })
                reporter.setContextIdResolver(() => 'ctx-a')
                expect(reporter.getContextTest()).toBe(reporter.tests.A)
            })

            it('returns undefined for a context after its context:end', () => {
                const onContextEnd = vi.spyOn(reporter, 'onContextEnd')
                start('A', 'ctx-a')
                reporter.emit('test:end', { uid: 'A', contextId: 'ctx-a' })
                const payload = { type: 'context:end', cid: '0-0', specs: ['/spec.js'], uid: 'A', contextId: 'ctx-a' }
                reporter.emit('context:end', payload)
                reporter.setContextIdResolver(() => 'ctx-a')

                expect(reporter.getContextTest()).toBeUndefined()
                expect(onContextEnd).toHaveBeenCalledWith(payload)
            })

            it('returns undefined after context:end for a test that never ended', () => {
                // failHookAffectedTests: false: a failed beforeEach sends no result and no test:end
                start('A', 'ctx-a')
                reporter.emit('context:end', { type: 'context:end', cid: '0-0', specs: ['/spec.js'], uid: 'A', contextId: 'ctx-a' })
                reporter.setContextIdResolver(() => 'ctx-a')

                expect(reporter.getContextTest()).toBeUndefined()
                expect(reporter.tests.A.state).toBe('pending')
            })

            it('returns the pending test after its test:end when the pending payload has no contextId', () => {
                // Cucumber scenario level: only test:start and test:end have the contextId
                start('A', 'ctx-a')
                reporter.emit('test:pending', { ...base, uid: 'A', title: 'A', state: 'pending' })
                reporter.emit('test:end', { uid: 'A', contextId: 'ctx-a' })
                reporter.setContextIdResolver(() => 'ctx-a')

                expect(reporter.getContextTest()).toBe(reporter.tests.A)
            })

            it('returns the current test without a resolver for a sequential test', () => {
                start('A')
                expect(reporter.getContextTest()).toBe(reporter.tests.A)
            })

            it('returns undefined without a resolver while parallel tests are tracked', () => {
                start('A', 'ctx-a')
                start('B', 'ctx-b')
                expect(reporter.getContextTest()).toBeUndefined()
            })
        })

        describe('getContextId', () => {
            it('returns the resolver context, also before a test of that context starts', () => {
                reporter.setContextIdResolver(() => 'ctx-a')
                expect(reporter.getContextId()).toBe('ctx-a')
                expect(reporter.getContextTest()).toBeUndefined()
            })

            it('returns undefined without a resolver', () => {
                start('A')
                expect(reporter.getContextId()).toBeUndefined()
            })
        })

        it('keeps serial behavior without contextId', () => {
            start('A')
            command('client:beforeCommand', 'a1')
            start('B')
            command('client:beforeCommand', 'b1')
            expect(reporter.tests.A.output).toHaveLength(1)
            expect(reporter.tests.B.output).toHaveLength(1)
        })

        it('skips the test identified by the event uid', () => {
            start('A', 'ctx-a')
            start('B', 'ctx-b')
            reporter.emit('test:skip', { uid: 'A', pendingReason: 'why' })
            expect(reporter.tests.A.state).toBe('skipped')
            expect(reporter.tests.A.pendingReason).toBe('why')
            expect(reporter.tests.B.state).toBe('pending')
        })

        it('tracks retries per context', () => {
            start('A', 'ctx-a')
            start('B', 'ctx-b')
            reporter.emit('test:retry', { uid: 'A' })
            reporter.emit('test:end', { uid: 'B' })
            start('A2', 'ctx-a')
            start('B2', 'ctx-b')
            expect(reporter.tests.A2.retries).toBe(1)
            expect(reporter.tests.B2.retries).toBe(0)
        })
    })

    describe('parentUid suite resolution', () => {
        const base = { cid: '0-0', specs: [], parent: 'p', pending: false, fullTitle: 'p t' }

        beforeEach(() => {
            reporter.emit('runner:start', { cid: '0-0', capabilities: {}, specs: runnerSpecs } as any)
            reporter.emit('suite:start', { uid: 'suite-a', title: 'a' })
            reporter.emit('suite:start', { uid: 'suite-b', title: 'b' })
        })

        it('attaches tests, pending tests and hooks to the suite named by parentUid', () => {
            reporter.emit('test:start', { ...base, uid: 't1', title: 't1', parentUid: 'suite-a' })
            reporter.emit('test:pending', { ...base, uid: 't2', title: 't2', parentUid: 'suite-a', state: 'pending' })
            reporter.emit('hook:start', { uid: 'h1', title: 'h1', parent: 'p', cid: '0-0', parentUid: 'suite-a' })

            expect(reporter.suites['suite-a'].tests.map(t => t.uid)).toEqual(['t1', 't2'])
            expect(reporter.suites['suite-a'].hooks.map(h => h.uid)).toEqual(['h1'])
            expect(reporter.suites['suite-b'].tests).toHaveLength(0)
            expect(reporter.suites['suite-b'].hooks).toHaveLength(0)
        })

        it('falls back to the innermost current suite without parentUid', () => {
            reporter.emit('test:start', { ...base, uid: 't1', title: 't1' })
            reporter.emit('test:start', { ...base, uid: 't2', title: 't2', parentUid: 'unknown' })

            expect(reporter.suites['suite-a'].tests).toHaveLength(0)
            expect(reporter.suites['suite-b'].tests.map(t => t.uid)).toEqual(['t1', 't2'])
        })

        it('replaces a started test that ends pending after another test started', () => {
            reporter.emit('test:start', { ...base, uid: 'A', title: 'A', parentUid: 'suite-a' })
            reporter.emit('test:start', { ...base, uid: 'B', title: 'B', parentUid: 'suite-a' })
            reporter.emit('test:pending', { ...base, uid: 'A', title: 'A', parentUid: 'suite-a', state: 'pending' })

            const suite = reporter.suites['suite-a']
            expect(suite.tests.map(t => t.uid)).toEqual(['A', 'B'])
            expect(suite.hooksAndTests.map(t => t.uid)).toEqual(['A', 'B'])
            expect(suite.tests[0]).toBe(reporter.tests.A)
            expect(suite.tests[0].end).toBeDefined()
        })
    })

    describe('Reported test times', () => {
        const base = {
            type: 'test:start' as const, title: 't', parent: 'p', fullTitle: 'p t', pending: false,
            cid: '0-0', specs: ['/a.js'], uid: 'timed', parentUid: null
        }

        it('uses start and end of the payload instead of the receipt time', () => {
            reporter.emit('test:start', base)
            reporter.emit('test:pass', { ...base, type: 'test:pass', start: 1_000, end: 1_040 })

            expect(reporter.tests.timed.start.getTime()).toBe(1_000)
            expect(reporter.tests.timed.end!.getTime()).toBe(1_040)
            expect(reporter.tests.timed.duration).toBe(40)
        })

        it('applies them to failing and pending tests as well', () => {
            reporter.emit('test:start', { ...base, uid: 'failing' })
            reporter.emit('test:fail', { ...base, uid: 'failing', type: 'test:fail', start: 2_000, end: 2_010, error: new Error('x') })
            reporter.emit('test:pending', { ...base, uid: 'skipped', type: 'test:pending', start: 3_000, end: 3_005 })

            expect(reporter.tests.failing.duration).toBe(10)
            expect(reporter.tests.skipped.start.getTime()).toBe(3_000)
            expect(reporter.tests.skipped.duration).toBe(5)
        })

        it('stamps the receipt time when the payload carries no times', () => {
            vi.useFakeTimers()
            vi.setSystemTime(5_000)
            reporter.emit('test:start', { ...base, uid: 'plain' })
            vi.setSystemTime(5_020)
            reporter.emit('test:pass', { ...base, uid: 'plain', type: 'test:pass' })
            vi.useRealTimers()

            expect(reporter.tests.plain.start.getTime()).toBe(5_000)
            expect(reporter.tests.plain.duration).toBe(20)
        })

        it('ignores a start without an end, as Jasmine sends one on every payload', () => {
            vi.useFakeTimers()
            vi.setSystemTime(6_000)
            reporter.emit('test:start', { ...base, uid: 'jasmine', start: 1 })
            vi.setSystemTime(6_030)
            reporter.emit('test:pending', { ...base, uid: 'jasmine', type: 'test:pending', start: 1 })
            vi.useRealTimers()

            expect(reporter.tests.jasmine.start.getTime()).toBe(6_000)
            expect(reporter.tests.jasmine.duration).toBe(30)
        })
    })
})
