import {
    describe,
    expect,
    it,
    vi,
    beforeAll,
    beforeEach,
    afterEach,
} from 'vitest'
import { EventEmitter } from 'node:events'
import type { StepDefinition, TestStepFinished, TestStepStarted } from '@cucumber/messages'
import { TestStepResultStatus } from '@cucumber/messages'
import path from 'node:path'
import logger from '@wdio/logger'

import CucumberFormatter from '../src/cucumberFormatter.js'

import {
    gherkinDocument,
    pickle,
    testRunStarted,
    testCase,
    testCaseStarted,
    testStepStarted,
    testStepFinished,
    testCaseFinished,
    testRunFinished,
} from './fixtures/envelopes.js'

vi.mock('@cucumber/messages', async (importOriginal) => ({
    // the real rule for the result of a scenario
    getWorstTestStepResult: (await importOriginal<{ getWorstTestStepResult: unknown }>()).getWorstTestStepResult,
    IdGenerator: { incrementing: vi.fn() },
    TestStepResultStatus: {
        UNKNOWN: 'UNKNOWN',
        PASSED: 'PASSED',
        SKIPPED: 'SKIPPED',
        PENDING: 'PENDING',
        UNDEFINED: 'UNDEFINED',
        AMBIGUOUS: 'AMBIGUOUS',
        FAILED: 'FAILED',
    },
}))

const wdioReporter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
}

const _eventEmitter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
}

const cid = '0-1'
const specs = ['/foobar.js']

const gherkinDocEvent = gherkinDocument
const relativeGherkinDocPath = `.${gherkinDocument.uri}`

const loadGherkin = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument })
const loadRelativeGherkinPath = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument: { ...gherkinDocument, uri: relativeGherkinDocPath } })
const acceptPickle = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { pickle })
const prepareSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCase })
const startSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCaseStarted })

describe('CucumberFormatter', () => {
    describe('emits messages for certain cucumber events', () => {
        let eventBroadcaster: EventEmitter

        beforeEach(() => {
            wdioReporter.emit.mockClear()
            _eventEmitter.emit.mockClear()
            eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: _eventEmitter,
                    _scenarioLevelReporter: false,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: '/some/path/to',
                },
            } as any)
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should return absolute uri on `gherkin-document` event', () => {
            loadRelativeGherkinPath(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testRunStarted: {} })
            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                file: path.resolve(relativeGherkinDocPath),
            }))
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted: {} })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it("should send accepted pickle's data on `test-case-started` event", () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        describe('step finished events', () => {
            beforeEach(() => {
                loadGherkin(eventBroadcaster)
                acceptPickle(eventBroadcaster)
                prepareSuite(eventBroadcaster)
                startSuite(eventBroadcaster)
                wdioReporter.emit.mockClear()
            })

            it('should send proper data on `test-step-started` event', () => {
                eventBroadcaster.emit('envelope', { testStepStarted })
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })

            it.each([
                [TestStepResultStatus.PASSED, 'test:pass'],
                [TestStepResultStatus.FAILED, 'test:fail'],
            ])('ends a %s step with test:end after its result, as Mocha and Jasmine', (status, result) => {
                const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
                step.testStepResult = { ...step.testStepResult, status }
                eventBroadcaster.emit('envelope', { testStepFinished: step })
                const events = wdioReporter.emit.mock.calls.map(([event, payload]: [string, { uid: string }]) => [event, payload.uid])
                expect(events).toEqual([[result, events[0][1]], ['test:end', events[0][1]]])
            })

            it('passed step', () => {
                const passingStep: TestStepFinished = JSON.parse(
                    JSON.stringify(testStepFinished)
                )
                eventBroadcaster.emit('envelope', {
                    testStepFinished: passingStep,
                })
                // the result and its test:end: no time in the snapshot
                for (const [, payload] of wdioReporter.emit.mock.calls) { delete payload.duration }
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })

            it('failed step', () => {
                const failedStep: TestStepFinished = JSON.parse(
                    JSON.stringify(testStepFinished)
                )
                failedStep.testStepResult = {
                    ...failedStep.testStepResult,
                    status: TestStepResultStatus.FAILED,
                }
                eventBroadcaster.emit('envelope', {
                    testStepFinished: failedStep,
                })
                // the result and its test:end: no time in the snapshot
                for (const [, payload] of wdioReporter.emit.mock.calls) { delete payload.duration }
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should proper data when executing a hook', () => {
            const hookStarted: TestStepStarted = JSON.parse(
                JSON.stringify(testStepStarted)
            )
            hookStarted.testStepId = '24'
            const hookFinished: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            hookFinished.testStepId = '24'

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted: hookStarted })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', {
                testStepFinished: hookFinished,
            })
            // the result and its test:end: no time in the snapshot
            for (const [, payload] of wdioReporter.emit.mock.calls) { delete payload.duration }
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should emit proper no of hookparams events', () => {
            loadGherkin(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            expect(_eventEmitter.emit).toBeCalledTimes(4)
            Array(4).fill(0).forEach((_, i) => expect(_eventEmitter.emit).toHaveBeenNthCalledWith(i+1, 'getHookParams', expect.any(Object)))

        })
    })

    describe('emits messages for certain cucumber events when executed in scenarioLeverReporter', () => {
        let eventBroadcaster: EventEmitter
        let formatter: CucumberFormatter

        beforeEach(() => {
            wdioReporter.emit.mockClear()
            eventBroadcaster = new EventEmitter()
            formatter = new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: true,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: '/some/path/to',
                },
            } as any)
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it("should send accepted pickle's data on `test-case-started` event", () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)

            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should send proper data on `test-case-finished` event', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testCaseFinished })
            // the result and its test:end: no time in the snapshot
            for (const [, payload] of wdioReporter.emit.mock.calls) { delete payload.duration }
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        /**
         * the scenario is the test: its end event has the title, type and parent of
         * its start event, also when the scenario is pending
         */
        function finishScenarioWith (status: string) {
            const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            ;(step.testStepResult as { status: string }).status = status
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            const [, started] = wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:start')
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: step })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testCaseFinished })
            return { started, finished: wdioReporter.emit.mock.calls[0] }
        }

        /** attempt 0 fails and Cucumber retries it, attempt 1 passes (or fails too) */
        function retryScenarioOnce (lastAttemptFails = false) {
            const failing: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            Object.assign(failing.testStepResult, { status: 'FAILED', message: 'first try fails' })
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: failing })
            eventBroadcaster.emit('envelope', { testCaseFinished: { ...testCaseFinished, willBeRetried: true } })
            eventBroadcaster.emit('envelope', { testCaseStarted: { ...testCaseStarted, attempt: 1, id: '29' } })
            eventBroadcaster.emit('envelope', { testStepStarted: { ...testStepStarted, testCaseStartedId: '29' } })
            const lastStep: TestStepFinished = { ...JSON.parse(JSON.stringify(lastAttemptFails ? failing : testStepFinished)), testCaseStartedId: '29' }
            eventBroadcaster.emit('envelope', { testStepFinished: lastStep })
            eventBroadcaster.emit('envelope', { testCaseFinished: { ...testCaseFinished, testCaseStartedId: '29' } })
            return wdioReporter.emit.mock.calls.filter(([event]: [string]) => event.startsWith('test:'))
        }

        it('ends a retried scenario attempt with test:retry, as Mocha does', () => {
            const events = retryScenarioOnce()
            expect(events.map(([event]: [string]) => event)).toEqual(['test:start', 'test:retry', 'test:start', 'test:pass', 'test:end'])
            const [[, firstStart], [, retry], [, secondStart]] = events
            expect(retry).toMatchObject({ uid: firstStart.uid, type: 'scenario', title: firstStart.title, parent: firstStart.parent })
            expect(retry.error.message).toContain('first try fails')
            // the reporter counts the retries of the uid from test:retry
            expect(secondStart.uid).toBe(firstStart.uid)
        })

        it('counts a scenario that fails on every attempt one time', () => {
            const events = retryScenarioOnce(true)
            expect(events.map(([event]: [string]) => event)).toEqual(['test:start', 'test:retry', 'test:start', 'test:fail', 'test:end'])
            expect(formatter['failedCount']).toBe(1)
        })

        it('does not count a scenario that passes on retry as failed', () => {
            retryScenarioOnce()
            expect(formatter['failedCount']).toBe(0)
        })

        // Cucumber retries only a FAILED attempt: a pending step and a failing After hook
        it('gives test:retry the error that made Cucumber retry the attempt', () => {
            const pending: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            Object.assign(pending.testStepResult, { status: 'PENDING' })
            const failedHook: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            Object.assign(failedHook.testStepResult, { status: 'FAILED', message: 'After hook fails' })
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: pending })
            eventBroadcaster.emit('envelope', { testStepFinished: failedHook })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testCaseFinished: { ...testCaseFinished, willBeRetried: true } })
            const [[event, payload]] = wdioReporter.emit.mock.calls
            expect(event).toBe('test:retry')
            expect(payload).toMatchObject({ state: 'fail', passed: false })
            expect(payload.error.message).toContain('After hook fails')
        })

        it('keeps the scenario title of a pending scenario', () => {
            const { started, finished: [event, payload] } = finishScenarioWith('PENDING')
            expect(event).toBe('test:pending')
            expect(payload).toMatchObject({ uid: started.uid, title: 'Get size of an element', type: 'scenario', parent: started.parent })
        })

        it('names the scenario in the error of an undefined step', () => {
            const { finished: [event, payload] } = finishScenarioWith('UNDEFINED')
            expect(event).toBe('test:fail')
            expect(payload.title).toBe('Get size of an element')
            expect(payload.error.message).toContain('Scenario Get size of an element has undefined steps.')
        })
    })

    /**
     * the events of a scenario with one step that ends with this status, and the failed counts
     */
    function reportedFailedCount (status: TestStepResultStatus, ignoreUndefinedDefinitions = false) {
        const eventBroadcaster = new EventEmitter()
        const events = new EventEmitter()
        const counts: unknown[] = []
        events.on('getFailedCount', (count) => counts.push(count))
        new CucumberFormatter({
            eventBroadcaster,
            parsedArgvOptions: {
                _reporter: wdioReporter,
                _cid: cid,
                _specs: specs,
                _eventEmitter: events,
                _scenarioLevelReporter: false,
                _tagsInTitle: false,
                _ignoreUndefinedDefinitions: ignoreUndefinedDefinitions,
                _failAmbiguousDefinitions: true,
                _rootDir: '/some/path/to',
            },
        } as any)

        loadGherkin(eventBroadcaster)
        acceptPickle(eventBroadcaster)
        prepareSuite(eventBroadcaster)
        startSuite(eventBroadcaster)

        const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        step.testStepResult = {
            ...step.testStepResult,
            status,
        }
        eventBroadcaster.emit('envelope', { testStepFinished: step })
        eventBroadcaster.emit('envelope', { testRunFinished })
        return counts
    }

    function stepLevelFormatter (options: Record<string, unknown> = {}) {
        const eventBroadcaster = new EventEmitter()
        const formatter = new CucumberFormatter({
            eventBroadcaster,
            parsedArgvOptions: {
                _reporter: wdioReporter,
                _cid: cid,
                _specs: specs,
                _eventEmitter: new EventEmitter(),
                _scenarioLevelReporter: false,
                _tagsInTitle: false,
                _ignoreUndefinedDefinitions: false,
                _failAmbiguousDefinitions: true,
                _rootDir: '/some/path/to',
                ...options,
            },
        } as any)
        loadGherkin(eventBroadcaster)
        acceptPickle(eventBroadcaster)
        prepareSuite(eventBroadcaster)
        return { eventBroadcaster, formatter }
    }

    /** the test events of one step that ends with this result, in this attempt */
    function stepEvents (eventBroadcaster: EventEmitter, testStepResult: Record<string, unknown>, attempt = 0, testStepId = '26') {
        eventBroadcaster.emit('envelope', { testCaseStarted: { ...testCaseStarted, attempt } })
        wdioReporter.emit.mockClear()
        eventBroadcaster.emit('envelope', { testStepStarted: { ...testStepStarted, testStepId } })
        const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        Object.assign(step, { testStepId })
        Object.assign(step.testStepResult, testStepResult)
        eventBroadcaster.emit('envelope', { testStepFinished: step })
        return wdioReporter.emit.mock.calls
    }

    describe('step level: hookKind from the Cucumber hook type', () => {
        const hookCalls = (eventBroadcaster: EventEmitter, testStepId: string) =>
            stepEvents(eventBroadcaster, { status: 'PASSED' }, 0, testStepId).filter(([name]: [string]) => name.startsWith('hook:'))

        it.each([
            ['BEFORE_TEST_CASE', 'beforeEach'],
            ['AFTER_TEST_CASE', 'afterEach'],
            ['BEFORE_TEST_STEP', 'beforeStep'],
            ['AFTER_TEST_STEP', 'afterStep'],
            ['BEFORE_TEST_RUN', 'beforeAll'],
            ['AFTER_TEST_RUN', 'afterAll'],
        ])('a %s hook is a %s hook on hook:start and hook:end', (type, kind) => {
            const { eventBroadcaster } = stepLevelFormatter()
            eventBroadcaster.emit('envelope', { hook: { id: '21', name: 'my hook', type } })
            const calls = hookCalls(eventBroadcaster, '24')
            expect(calls.map(([name, payload]: [string, Record<string, unknown>]) => [name, payload.uid, payload.hookKind])).toEqual([
                ['hook:start', '24', kind], ['hook:end', '24', kind]
            ])
        })

        it('sends no hookKind for a hook with no type (older Cucumber versions)', () => {
            const { eventBroadcaster } = stepLevelFormatter()
            eventBroadcaster.emit('envelope', { hook: { id: '19', name: 'my hook' } })
            const calls = hookCalls(eventBroadcaster, '27')
            expect(calls.map(([name]: [string]) => name)).toEqual(['hook:start', 'hook:end'])
            for (const [, payload] of calls) {
                expect(payload).not.toHaveProperty('hookKind')
            }
        })
    })

    describe('failed BeforeAll / AfterAll (K22)', () => {
        let lastFormatter: CucumberFormatter
        const formatterFor = () => {
            const eventBroadcaster = new EventEmitter()
            lastFormatter = new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: { _reporter: wdioReporter, _cid: cid, _specs: specs, _eventEmitter: new EventEmitter(), _scenarioLevelReporter: false, _tagsInTitle: false, _ignoreUndefinedDefinitions: false, _failAmbiguousDefinitions: true, _rootDir: '/some/path/to' },
            } as any)
            return eventBroadcaster
        }
        const runHook = (eventBroadcaster: EventEmitter, type: string, status: string, id = 'r1') => {
            eventBroadcaster.emit('envelope', { hook: { id: `h-${id}`, type, sourceReference: { uri: path.join(process.cwd(), 'steps.ts'), location: { line: 23 } } } })
            eventBroadcaster.emit('envelope', { testRunHookStarted: { id, hookId: `h-${id}`, testRunStartedId: 't' } })
            eventBroadcaster.emit('envelope', { testRunHookFinished: { testRunHookStartedId: id, result: { status, message: 'Error: BeforeAll fails\n    at steps.ts:23', exception: { type: 'Error', message: 'BeforeAll fails' }, duration: { seconds: 0, nanos: 0 } } } })
        }
        const events = () => wdioReporter.emit.mock.calls.map(([event]) => event as string)
        const payloadOf = (event: string) => wdioReporter.emit.mock.calls.find(([name]) => name === event)?.[1] as Record<string, any>

        it('sends a failed BeforeAll as a hook under the open feature', () => {
            const eventBroadcaster = formatterFor()
            eventBroadcaster.emit('envelope', { gherkinDocument })
            eventBroadcaster.emit('envelope', { pickle })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted })
            runHook(eventBroadcaster, 'BEFORE_TEST_RUN', 'FAILED')
            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(events()).toEqual(['suite:start', 'hook:start', 'hook:end', 'suite:end'])
            const hook = payloadOf('hook:end')
            expect(hook).toMatchObject({ type: 'hook', title: 'BeforeAll (steps.ts:23)', state: 'failed', parentUid: payloadOf('suite:start').uid })
            expect(hook.error.message).toBe('BeforeAll fails')
        })

        // the exit code of a sequential run with ignoreUndefinedDefinitions comes from failedCount
        it('counts a failed BeforeAll as a failure of the run', () => {
            const eventBroadcaster = formatterFor()
            eventBroadcaster.emit('envelope', { gherkinDocument })
            eventBroadcaster.emit('envelope', { testRunStarted })
            runHook(eventBroadcaster, 'BEFORE_TEST_RUN', 'FAILED')
            expect(lastFormatter['failedCount']).toBe(1)
        })

        it('sends a failed AfterAll before the end of the feature', () => {
            const eventBroadcaster = formatterFor()
            eventBroadcaster.emit('envelope', { gherkinDocument })
            eventBroadcaster.emit('envelope', { pickle })
            eventBroadcaster.emit('envelope', { testRunStarted })
            wdioReporter.emit.mockClear()
            runHook(eventBroadcaster, 'AFTER_TEST_RUN', 'FAILED')
            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(events()).toEqual(['hook:start', 'hook:end', 'suite:end'])
            expect(payloadOf('hook:end').title).toBe('AfterAll (steps.ts:23)')
        })

        it.each(['PASSED', 'SKIPPED'])('sends nothing for a %s run hook', (status) => {
            const eventBroadcaster = formatterFor()
            eventBroadcaster.emit('envelope', { gherkinDocument })
            eventBroadcaster.emit('envelope', { testRunStarted })
            wdioReporter.emit.mockClear()
            runHook(eventBroadcaster, 'BEFORE_TEST_RUN', status)
            expect(events()).toEqual([])
        })

        it('opens and closes the first feature once in spec grouping', () => {
            const eventBroadcaster = formatterFor()
            eventBroadcaster.emit('envelope', { gherkinDocument })
            eventBroadcaster.emit('envelope', { gherkinDocument: { ...gherkinDocument, uri: '/other.feature' } })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted })
            runHook(eventBroadcaster, 'BEFORE_TEST_RUN', 'FAILED')
            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(events()).toEqual(['suite:start', 'hook:start', 'hook:end', 'suite:end'])
            expect(payloadOf('suite:start').file).toBe(payloadOf('suite:end').file)
            expect(payloadOf('suite:end').file).toBeDefined()
        })
    })

    describe('step level: a step that fails in an attempt that Cucumber retries', () => {
        const failed = { status: 'FAILED', message: 'first try fails' }
        const names = (calls: [string, unknown][]) => calls.map(([event]) => event).filter((event) => event.startsWith('test:'))

        it('ends with test:retry and test:end, as the other steps of the attempt', () => {
            const { eventBroadcaster } = stepLevelFormatter({ _retry: 1 })
            const calls = stepEvents(eventBroadcaster, failed)
            expect(names(calls)).toEqual(['test:start', 'test:retry', 'test:end'])
            const [, retry] = calls.find(([event]: [string]) => event === 'test:retry')
            expect(retry).toMatchObject({ type: 'step', state: 'fail', passed: false })
            expect(retry.error.message).toContain('first try fails')
        })

        it('fails in the last attempt', () => {
            const { eventBroadcaster } = stepLevelFormatter({ _retry: 1 })
            expect(names(stepEvents(eventBroadcaster, failed, 1))).toEqual(['test:start', 'test:fail', 'test:end'])
        })

        it('fails without retry', () => {
            const { eventBroadcaster } = stepLevelFormatter({ _retry: 0 })
            expect(names(stepEvents(eventBroadcaster, failed))).toEqual(['test:start', 'test:fail', 'test:end'])
        })

        it('follows retryTagFilter, as Cucumber', () => {
            const notRetried = stepLevelFormatter({ _retry: 1, _retryTagFilter: '@other' })
            expect(names(stepEvents(notRetried.eventBroadcaster, failed))).toEqual(['test:start', 'test:fail', 'test:end'])
            const retried = stepLevelFormatter({ _retry: 1, _retryTagFilter: '@scenario-tag1 and not @other' })
            expect(names(stepEvents(retried.eventBroadcaster, failed))).toEqual(['test:start', 'test:retry', 'test:end'])
        })

        // Cucumber retries only an attempt whose worst result is FAILED
        it.each(['UNDEFINED', 'PENDING', 'PASSED'])('keeps the result of a %s step', (status) => {
            const { eventBroadcaster } = stepLevelFormatter({ _retry: 1 })
            expect(names(stepEvents(eventBroadcaster, { status }))).not.toContain('test:retry')
        })
    })

    // as Cucumber: with strict, a pending step stays pending, and it fails the run
    describe('strict: true counts a pending step as a failure of the run', () => {
        it('keeps a pending step pending and counts it', () => {
            const { eventBroadcaster, formatter } = stepLevelFormatter({ _strict: true })
            const events = stepEvents(eventBroadcaster, { status: 'PENDING' }).map(([event]: [string]) => event)
            expect(events).toContain('test:pending')
            expect(events).not.toContain('test:fail')
            expect(formatter['failedCount']).toBe(1)
        })

        it('keeps a pending step pending without strict', () => {
            const { eventBroadcaster, formatter } = stepLevelFormatter({ _strict: false })
            const events = stepEvents(eventBroadcaster, { status: 'PENDING' }).map(([event]: [string]) => event)
            expect(events).toContain('test:pending')
            expect(events).not.toContain('test:fail')
            expect(formatter['failedCount']).toBe(0)
        })

        it('counts a pending hook', () => {
            const { eventBroadcaster, formatter } = stepLevelFormatter({ _strict: true })
            const calls = stepEvents(eventBroadcaster, { status: 'PENDING' }, 0, '27')
            const [, hook] = calls.find(([name]: [string]) => name === 'hook:end')
            expect(hook).toMatchObject({ state: 'PENDING', error: undefined })
            expect(formatter['failedCount']).toBe(1)
        })

        it('keeps a scenario with a pending step pending at scenario level and counts it', () => {
            const { eventBroadcaster, formatter } = stepLevelFormatter({ _strict: true, _scenarioLevelReporter: true })
            stepEvents(eventBroadcaster, { status: 'PENDING' })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testCaseFinished })
            expect(wdioReporter.emit.mock.calls[0][0]).toBe('test:pending')
            expect(formatter['failedCount']).toBe(1)
        })

        it('names a scenario whose pending After hook comes after an ignored undefined step', () => {
            const warn = vi.spyOn(logger('CucumberFormatter'), 'warn').mockClear()
            const { eventBroadcaster, formatter } = stepLevelFormatter({ _strict: true, _ignoreUndefinedDefinitions: true })
            stepEvents(eventBroadcaster, { status: 'UNDEFINED' })
            const hook: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            Object.assign(hook, { testStepId: '27' })
            Object.assign(hook.testStepResult, { status: 'PENDING' })
            eventBroadcaster.emit('envelope', { testStepFinished: hook })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(formatter['failedCount']).toBe(1)
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('1 scenario has a pending step or hook: "Get size of an element"'))
        })

        it.each([true, false])('names the pending scenarios in a warning at the end of the run, only with strict (%s)', (strict) => {
            const warn = vi.spyOn(logger('CucumberFormatter'), 'warn').mockClear()
            const { eventBroadcaster } = stepLevelFormatter({ _strict: strict })
            stepEvents(eventBroadcaster, { status: 'PENDING' })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            eventBroadcaster.emit('envelope', { testRunFinished })
            const warnings = warn.mock.calls.map(([message]) => message)
            const file = path.relative(process.cwd(), gherkinDocument.uri!)
            expect(warnings).toEqual(strict ? [`The run fails because cucumberOpts.strict is true and 1 scenario has a pending step or hook: "Get size of an element" (${file}:12)`] : [])
        })
    })

    describe('counts only the failures of the last attempt of a retried scenario', () => {
        it.each([false, true])('scenario level: %s', (scenarioLevelReporter) => {
            const eventBroadcaster = new EventEmitter()
            const formatter = new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: scenarioLevelReporter,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: '/some/path/to',
                },
            } as any)
            const failing: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            Object.assign(failing.testStepResult, { status: 'FAILED', message: 'first try fails' })
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: failing })
            eventBroadcaster.emit('envelope', { testCaseFinished: { ...testCaseFinished, willBeRetried: true } })
            eventBroadcaster.emit('envelope', { testCaseStarted: { ...testCaseStarted, attempt: 1, id: '29' } })
            eventBroadcaster.emit('envelope', { testStepStarted: { ...testStepStarted, testCaseStartedId: '29' } })
            eventBroadcaster.emit('envelope', { testStepFinished: { ...JSON.parse(JSON.stringify(testStepFinished)), testCaseStartedId: '29' } })
            eventBroadcaster.emit('envelope', { testCaseFinished: { ...testCaseFinished, testCaseStartedId: '29' } })

            expect(formatter['failedCount']).toBe(0)
        })
    })

    it('ends a scenario-level scenario with an undefined step as failed, also when an ambiguous step follows (default options)', () => {
        const eventBroadcaster = new EventEmitter()
        new CucumberFormatter({
            eventBroadcaster,
            parsedArgvOptions: {
                _reporter: wdioReporter,
                _cid: cid,
                _specs: specs,
                _eventEmitter: new EventEmitter(),
                _scenarioLevelReporter: true,
                _tagsInTitle: false,
                _ignoreUndefinedDefinitions: false,
                _failAmbiguousDefinitions: false,
                _rootDir: '/some/path/to',
            },
        } as any)
        const undefinedStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        Object.assign(undefinedStep.testStepResult, { status: 'UNDEFINED' })
        const ambiguousStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        Object.assign(ambiguousStep.testStepResult, { status: 'AMBIGUOUS', message: 'Multiple step definitions match:' })
        loadGherkin(eventBroadcaster)
        acceptPickle(eventBroadcaster)
        prepareSuite(eventBroadcaster)
        startSuite(eventBroadcaster)
        eventBroadcaster.emit('envelope', { testStepStarted })
        eventBroadcaster.emit('envelope', { testStepFinished: undefinedStep })
        eventBroadcaster.emit('envelope', { testStepFinished: ambiguousStep })
        wdioReporter.emit.mockClear()
        eventBroadcaster.emit('envelope', { testCaseFinished })

        const [event, payload] = wdioReporter.emit.mock.calls[0]
        expect(event).toBe('test:fail')
        expect(payload.error.message).toContain('has undefined steps')
    })

    it('ends a scenario-level scenario with its worst result, as Cucumber: a failed After hook after an ignored undefined step', () => {
        const eventBroadcaster = new EventEmitter()
        const formatter = new CucumberFormatter({
            eventBroadcaster,
            parsedArgvOptions: {
                _reporter: wdioReporter,
                _cid: cid,
                _specs: specs,
                _eventEmitter: new EventEmitter(),
                _scenarioLevelReporter: true,
                _tagsInTitle: false,
                _ignoreUndefinedDefinitions: true,
                _failAmbiguousDefinitions: true,
                _rootDir: '/some/path/to',
            },
        } as any)
        const undefinedStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        Object.assign(undefinedStep.testStepResult, { status: 'UNDEFINED' })
        const failedHook: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
        Object.assign(failedHook.testStepResult, { status: 'FAILED', message: 'After hook fails' })
        loadGherkin(eventBroadcaster)
        acceptPickle(eventBroadcaster)
        prepareSuite(eventBroadcaster)
        startSuite(eventBroadcaster)
        eventBroadcaster.emit('envelope', { testStepStarted })
        eventBroadcaster.emit('envelope', { testStepFinished: undefinedStep })
        eventBroadcaster.emit('envelope', { testStepFinished: failedHook })
        wdioReporter.emit.mockClear()
        eventBroadcaster.emit('envelope', { testCaseFinished })

        const [event, payload] = wdioReporter.emit.mock.calls[0]
        expect(event).toBe('test:fail')
        expect(payload.error.message).toContain('After hook fails')
        expect(formatter['failedCount']).toBe(1)
    })

    describe('provides a fail counter', () => {
        it('should increment failed counter on `failed` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.FAILED)).toEqual([1])
        })

        it('should increment failed counter on `ambiguous` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.AMBIGUOUS)).toEqual([1])
        })

        it('should increment failed counter on `undefined` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.UNDEFINED)).toEqual([1])
        })

        it('should not increment failed counter on `undefined` status if ignoreUndefinedDefinitions set to true', () => {
            expect(reportedFailedCount(TestStepResultStatus.UNDEFINED, true)).toEqual([0])
        })
    })

    describe('undefined steps', () => {
        it('marks an undefined step as pending with "(undefined step)" in its title (ignoreUndefinedDefinitions)', () => {
            wdioReporter.emit.mockClear()
            reportedFailedCount(TestStepResultStatus.UNDEFINED, true)
            const [, payload] = wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:pending')
            expect(payload.state).toBe('pending')
            expect(payload.title).toMatch(/ \(undefined step\)$/)
            // the keyword stays: reporters find the step by its title
            expect(payload.title).toMatch(/^(Given|When|Then|And|But) /)
        })
    })

    describe('ambiguous steps', () => {
        const definitions = [
            { id: '16', pattern: { source: 'I do something', type: 'CUCUMBER_EXPRESSION' }, sourceReference: { uri: 'features/steps.js', location: { line: 3 } } },
            { id: '99', pattern: { source: '^I do', type: 'REGULAR_EXPRESSION' }, sourceReference: { uri: 'features/steps.js', location: { line: 7 } } }
        ] as StepDefinition[]
        const DEFINITIONS_TEXT = 'Multiple step definitions match:\n  I do something - features/steps.js:3\n  /^I do/ - features/steps.js:7'
        // the text before the location lines of the feature file
        const stackText = (stack: string) => stack.split('\n\tat ')[0]

        function reportAmbiguity (scenarioLevelReporter: boolean, message?: string, failAmbiguousDefinitions = true, stepDefinitions: StepDefinition[] = []) {
            const eventBroadcaster = new EventEmitter()
            const events = new EventEmitter()
            const counts: number[] = []
            events.on('getFailedCount', (count) => counts.push(count))
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: events,
                    _scenarioLevelReporter: scenarioLevelReporter,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: failAmbiguousDefinitions,
                    _rootDir: '/some/path/to',
                },
            } as any)
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            for (const stepDefinition of stepDefinitions) {
                eventBroadcaster.emit('envelope', { stepDefinition })
            }
            eventBroadcaster.emit('envelope', {
                testCase: {
                    ...testCase,
                    testSteps: testCase.testSteps.map((step) => step.id === '26' ? { ...step, stepDefinitionIds: ['16', '99'] } : step)
                }
            })
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: {
                    ...testStepFinished,
                    testStepResult: { status: TestStepResultStatus.AMBIGUOUS, duration: { seconds: 0, nanos: 0 }, message }
                }
            })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            eventBroadcaster.emit('envelope', { testRunFinished })
            return {
                payload: wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:fail')?.[1],
                skipPayload: wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:skip')?.[1],
                counts
            }
        }

        it.each([false, true])('explains a missing Cucumber diagnostic (scenario level: %s)', (scenarioLevelReporter) => {
            const { payload, counts } = reportAmbiguity(scenarioLevelReporter)
            expect(payload.error.message).toContain(scenarioLevelReporter ? 'Scenario "Get size of an element" contains a step matching' : 'Step "should the element')
            expect(payload.error.message).toContain('multiple step definitions')
            expect(payload.error.message).toContain('overlapping expressions')
            expect(payload.error.stack).toContain(payload.error.message)
            expect(counts).toEqual([1])
        })

        it('also explains an empty Cucumber diagnostic', () => {
            expect(reportAmbiguity(false, '').payload.error.message).toContain('multiple step definitions')
        })

        it('preserves a provided Cucumber diagnostic and stack', () => {
            const message = 'Multiple step definitions match:\n  first.js:2\n  second.js:3'
            const { payload } = reportAmbiguity(false, message)
            expect(payload.error.message).toBe(message.split('\n')[0])
            expect(stackText(payload.error.stack)).toBe(message)
        })

        it('preserves the skipped-step policy when failAmbiguousDefinitions is false', () => {
            const { payload, counts } = reportAmbiguity(false, undefined, false)
            expect(payload).toBeUndefined()
            expect(wdioReporter.emit).toHaveBeenCalledWith('test:skip', expect.objectContaining({ state: 'skip', error: undefined }))
            expect(counts).toEqual([0])
        })

        it('lists the matching definitions in the error (failAmbiguousDefinitions)', () => {
            const { payload } = reportAmbiguity(false, undefined, true, definitions)
            expect(payload.error.message).toBe('Multiple step definitions match:')
            expect(stackText(payload.error.stack)).toBe(DEFINITIONS_TEXT)
        })

        it('gives the location of the step in the feature file', () => {
            const { payload } = reportAmbiguity(false, undefined, true, definitions)
            expect(payload.error.stack).toBe(`${DEFINITIONS_TEXT}\n` +
                // an absolute uri stays as it is, also on Windows
                `\tat Feature(${gherkinDocument.uri}):1:1\n` +
                '\tat Scenario(Get size of an element):12:3\n' +
                '\tat Step(should the element \'.header-logged-out a\' be 32px wide and 35px high):14:5\n')
        })

        it('lists the matching definitions on a skipped ambiguous step', () => {
            const { payload, skipPayload } = reportAmbiguity(false, undefined, false, definitions)
            expect(payload).toBeUndefined()
            expect(skipPayload.error.message).toBe(DEFINITIONS_TEXT)
        })

        it('gives the definitions as the reason of a skipped ambiguous step', () => {
            const { skipPayload } = reportAmbiguity(false, undefined, false, definitions)
            expect(skipPayload.pendingReason).toBe(DEFINITIONS_TEXT)
        })

        it('gives the definitions as the reason of a skipped scenario-level test', () => {
            const { skipPayload } = reportAmbiguity(true, undefined, false, definitions)
            expect(skipPayload.type).toBe('scenario')
            expect(skipPayload.pendingReason).toBe(DEFINITIONS_TEXT)
        })

        it('keeps a message that Cucumber sends', () => {
            const { payload } = reportAmbiguity(false, 'from cucumber', true, definitions)
            expect(payload.error.message).toBe('from cucumber')
            expect(stackText(payload.error.stack)).toBe('from cucumber')
        })

        it('skips a definition id without a stepDefinition message', () => {
            const { payload } = reportAmbiguity(false, undefined, true, [definitions[1]])
            expect(stackText(payload.error.stack)).toBe('Multiple step definitions match:\n  /^I do/ - features/steps.js:7')
        })

        it('gives the location of an undefined step in a rule', () => {
            const eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: false,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: '/some/path/to',
                },
            } as any)
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', {
                testStepFinished: { ...testStepFinished, testStepResult: { status: TestStepResultStatus.UNDEFINED, duration: { seconds: 0, nanos: 0 } } }
            })
            const [, payload] = wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:fail')!
            expect(payload.error.stack).toContain('\tat Scenario(Get size of an element):12:3\n')
        })

        it('gives the location of a step from a background', () => {
            const eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: false,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: '/some/path/to',
                },
            } as any)
            // the pickle step '12' comes from the background step '4'
            const feature = {
                ...gherkinDocument.feature!,
                children: [
                    { background: { id: '30', keyword: 'Background', name: '', description: '', location: { line: 3, column: 3 }, steps: [
                        { id: '4', keyword: 'Given ', keywordType: 'Context', text: 'a background step', location: { line: 4, column: 5 } }
                    ] } },
                    { scenario: { id: '8', keyword: 'Scenario', name: 'Get size of an element', description: '', location: { line: 6, column: 3 }, tags: [], steps: [], examples: [] } }
                ]
            }
            eventBroadcaster.emit('envelope', { gherkinDocument: { ...gherkinDocument, feature } })
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', {
                testStepFinished: { ...testStepFinished, testStepResult: { status: TestStepResultStatus.AMBIGUOUS, duration: { seconds: 0, nanos: 0 } } }
            })
            const [, payload] = wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:fail')!
            expect(payload.error.stack).toContain('\tat Scenario(Get size of an element):6:3\n\tat Step(a background step):4:5\n')
        })

        it('lists the definitions for a scenario-level test', () => {
            const { payload } = reportAmbiguity(true, undefined, true, definitions)
            expect(payload.type).toBe('scenario')
            expect(stackText(payload.error.stack)).toBe(DEFINITIONS_TEXT)
        })
    })

    describe('tags in title', () => {
        let eventBroadcaster: EventEmitter

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: false,
                    _tagsInTitle: true,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: false,
                    _rootDir: '/some/path/to',
                },
            } as any)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('envelope', {
                gherkinDocument: gherkinDocEvent,
            })
            expect(wdioReporter.emit).not.toBeCalled()
            eventBroadcaster.emit('envelope', { testRunStarted })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })
    })

    afterEach(() => {
        wdioReporter.on.mockClear()
        wdioReporter.write.mockClear()
        wdioReporter.emit.mockClear()
    })

    describe('grouped specs in a random order (A/B/A)', () => {
        afterEach(() => {
            vi.useRealTimers()
        })

        const root = path.resolve('/project')

        /**
         * 2 feature files in one worker, and their scenarios in the order a1, b1, a2,
         * each scenario takes 10 ms
         */
        function runGroupedFeatures (
            scenarioLevelReporter: boolean,
            files = { a: path.join('features', 'a.feature'), b: path.join('features', 'b.feature') },
            order = ['a1', 'b1', 'a2']
        ) {
            vi.useFakeTimers({ toFake: ['Date'] })
            vi.setSystemTime(0)
            wdioReporter.emit.mockClear()
            const eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: scenarioLevelReporter,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                    _rootDir: root,
                },
            } as any)
            const uri = (name: 'a' | 'b') => path.join(root, files[name])
            const doc = (name: 'a' | 'b') => ({ ...gherkinDocument, uri: uri(name), feature: { ...gherkinDocument.feature!, name: `Feature ${name}` } })
            const scenario = (name: string, uri: string) => ({ ...pickle, id: `pickle-${name}`, name, uri })
            for (const gherkin of [doc('a'), doc('b')]) {
                eventBroadcaster.emit('envelope', { gherkinDocument: gherkin })
            }
            eventBroadcaster.emit('envelope', { testRunStarted })
            for (const name of order) {
                eventBroadcaster.emit('envelope', { pickle: scenario(name, uri(name[0] as 'a' | 'b')) })
                eventBroadcaster.emit('envelope', { testCase: { ...testCase, id: `case-${name}`, pickleId: `pickle-${name}` } })
            }
            for (const name of order) {
                eventBroadcaster.emit('envelope', { testCaseStarted: { ...testCaseStarted, testCaseId: `case-${name}` } })
                vi.advanceTimersByTime(10)
                if (scenarioLevelReporter) {
                    // the result of the scenario test comes from the results of its steps
                    eventBroadcaster.emit('envelope', { testStepFinished })
                }
                eventBroadcaster.emit('envelope', { testCaseFinished })
            }
            eventBroadcaster.emit('envelope', { testRunFinished })
            return wdioReporter.emit.mock.calls
                .filter(([event]: [string]) => /^(suite|test):(start|end|pass)$/.test(event))
                .map(([event, payload]: [string, any]) => ({ event, type: payload.type, title: payload.title, uid: payload.uid, parent: payload.parent, fullTitle: payload.fullTitle, duration: payload.duration }))
        }

        it('starts a feature again when the run comes back to it, with its own uid, and the feature uid as the parent of its scenarios', () => {
            const events = runGroupedFeatures(false)
            const a = 'features/a.feature:3:1'
            const b = 'features/b.feature:3:1'
            expect(events.map(({ event, type, uid, parent, fullTitle }) => type === 'feature' ? [event, type, uid] : [event, type, parent, fullTitle])).toEqual([
                ['suite:start', 'feature', a],
                ['suite:start', 'scenario', a, `${a}: a1`],
                ['suite:end', 'scenario', a, `${a}: a1`],
                ['suite:end', 'feature', a],
                ['suite:start', 'feature', b],
                ['suite:start', 'scenario', b, `${b}: b1`],
                ['suite:end', 'scenario', b, `${b}: b1`],
                ['suite:end', 'feature', b],
                ['suite:start', 'feature', `${a}#2`],
                ['suite:start', 'scenario', a, `${a}: a2`],
                ['suite:end', 'scenario', a, `${a}: a2`],
                ['suite:end', 'feature', `${a}#2`],
            ])
        })

        it('gives each part of a feature its duration', () => {
            const featureEnds = runGroupedFeatures(false).filter(({ event, type }) => event === 'suite:end' && type === 'feature')
            expect(featureEnds.map(({ duration }) => duration)).toEqual([10, 10, 10])
        })

        /**
         * the `fullTitle` of a scenario test gives its Allure `historyId`: it must not
         * depend on the random order that splits the feature into parts
         */
        it('uses the feature uid, not the uid of the part, as the parent of the scenario tests (scenarioLevelReporter)', () => {
            const tests = runGroupedFeatures(true).filter(({ event }) => event.startsWith('test:'))
            expect(tests.map(({ event, title, parent, fullTitle }) => [event, title, parent, fullTitle])).toEqual([
                ['test:start', 'a1', 'features/a.feature:3:1', 'features/a.feature:3:1: a1'],
                ['test:pass', 'a1', 'features/a.feature:3:1', 'features/a.feature:3:1: a1'],
                ['test:end', 'a1', 'features/a.feature:3:1', 'features/a.feature:3:1: a1'],
                ['test:start', 'b1', 'features/b.feature:3:1', 'features/b.feature:3:1: b1'],
                ['test:pass', 'b1', 'features/b.feature:3:1', 'features/b.feature:3:1: b1'],
                ['test:end', 'b1', 'features/b.feature:3:1', 'features/b.feature:3:1: b1'],
                ['test:start', 'a2', 'features/a.feature:3:1', 'features/a.feature:3:1: a2'],
                ['test:pass', 'a2', 'features/a.feature:3:1', 'features/a.feature:3:1: a2'],
                ['test:end', 'a2', 'features/a.feature:3:1', 'features/a.feature:3:1: a2'],
            ])
        })

        it('grouped feature files with the same name keep their own suites', () => {
            const files = { a: path.join('features', 'admin', 'login.feature'), b: path.join('features', 'user', 'login.feature') }
            const events = runGroupedFeatures(false, files, ['a1', 'b1'])
            const admin = 'features/admin/login.feature:3:1'
            const user = 'features/user/login.feature:3:1'
            expect(events.map(({ event, type, uid, parent }) => type === 'feature' ? [event, type, uid] : [event, type, parent])).toEqual([
                ['suite:start', 'feature', admin],
                ['suite:start', 'scenario', admin],
                ['suite:end', 'scenario', admin],
                ['suite:end', 'feature', admin],
                ['suite:start', 'feature', user],
                ['suite:start', 'scenario', user],
                ['suite:end', 'scenario', user],
                ['suite:end', 'feature', user],
            ])
        })
    })
})
